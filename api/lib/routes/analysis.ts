import { FastifyInstance } from 'fastify';
import { OpenRouterAnalysisService, AnalysisRequest } from '../services/openrouter-analysis-service';
import { FileParserService } from '../services/file-parser-service';
import { ReportGenerationService } from '../services/report-generation-service';
import { randomUUID } from 'crypto';

// In-memory storage for demo purposes
const analysisResults = new Map<string, any>();
const analysisRequests = new Map<string, AnalysisRequest>();
const liveAnalysisSummaries = new Map<string, string>();
const liveProgressTrackers = new Map<string, { intervalId: NodeJS.Timeout, currentProgress: number, isComplete: boolean, startTime: number }>();
const modelStatuses = new Map<string, Record<string, string>>();

export async function analysisRoutes(fastify: FastifyInstance) {
  // Simplified authentication - disabled for development
  // TODO: Enable proper authentication in production

  const onSummaryUpdate = (caseId: string, summary: string) => {
    liveAnalysisSummaries.set(caseId, summary);
    // Update progress (e.g., currentProgress based on time elapsed or model completion)
    // For now, let's just log and update the summary
    console.log(`[Frontend Update] Case ${caseId} Summary: ${summary.substring(0, 100)}...`);
  };

  const analysisService = new OpenRouterAnalysisService(onSummaryUpdate);
  const fileParser = new FileParserService();

  // Start multi-LLM analysis
  fastify.post('/analyze', async (request, reply) => {
    try {
      const files = request.files();
      const parsedContents: string[] = [];
      const fileNames: string[] = [];
      let context = '';
      let caseId = randomUUID();
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled

      // Process uploaded files
      for await (const file of files) {
        if (file.fieldname === 'files') {
          const chunks: Buffer[] = [];
          for await (const chunk of file.file) {
            chunks.push(chunk);
          }
          const buffer = Buffer.concat(chunks);
          
          // Parse the file content
          const parsed = await fileParser.parseFile(buffer, file.filename, file.mimetype);
          const summary = fileParser.extractSummary(parsed.content);
          
          parsedContents.push(summary);
          fileNames.push(file.filename);
          
          console.log(`Parsed file ${file.filename}: ${parsed.metadata.size} bytes -> ${summary.length} characters`);
        } else if (file.fieldname === 'context') {
          const chunks: Buffer[] = [];
          for await (const chunk of file.file) {
            chunks.push(chunk);
          }
          const contextBuffer = Buffer.concat(chunks);
          context = contextBuffer.toString('utf-8');
        }
      }

      if (parsedContents.length === 0) {
        return reply.status(400).send({ error: 'No files uploaded' });
      }

      // Convert parsed contents to buffers for the analysis service
      const contentBuffers = parsedContents.map(content => Buffer.from(content, 'utf-8'));

      // Store initial analysis state and request
      analysisResults.set(caseId, {
        status: 'processing',
        timestamp: new Date(),
        artifacts: null,
        synthesis: null
      });
      analysisRequests.set(caseId, {
        files: contentBuffers,
        fileNames,
        context: context || 'General forensic analysis',
        priority: 'quality',
        caseId,
        userId
      });

      // Initialize live progress tracker
      let currentProgress = 0;
      const totalLoadingTimeMs = 175 * 1000; // 175 seconds
      const updateIntervalMs = 500; // Update every 500ms for smoothness

      const intervalId = setInterval(() => {
        const tracker = liveProgressTrackers.get(caseId);
        if (tracker?.isComplete) {
          clearInterval(intervalId);
          return;
        }
        currentProgress = Math.min(currentProgress + (updateIntervalMs / totalLoadingTimeMs) * 100, 99);
        liveProgressTrackers.set(caseId, { 
          intervalId,
          currentProgress,
          isComplete: false,
          startTime: tracker?.startTime || Date.now() // Preserve start time
        });
      }, updateIntervalMs);

      liveProgressTrackers.set(caseId, { 
        intervalId,
        currentProgress,
        isComplete: false,
        startTime: Date.now()
      });

      // Create analysis request
      const analysisRequest: AnalysisRequest = {
        files: contentBuffers,
        fileNames,
        context: context || 'General forensic analysis',
        priority: 'quality',
        caseId,
        userId
      };

      // Initialize model statuses
      const initialModelStatuses: Record<string, string> = {};
      const activeModels = analysisService.getActiveModelNames();
      activeModels.forEach((model: string) => {
        initialModelStatuses[model] = 'pending';
      });
      modelStatuses.set(caseId, initialModelStatuses);

      // Return immediately with analysis ID
      reply.send({
        analysisId: caseId,
        status: 'started',
        message: 'Multi-LLM analysis initiated',
        estimatedTime: '5-10 minutes',
        tier: process.env.ANALYSIS_TIER || 'free',
        models: activeModels
      });

      // Process analysis in background
      analysisService.analyzeEvidence(analysisRequest).then(async (artifacts) => {
        // Synthesize results
        const synthesis = await analysisService.synthesizeAnalysis(artifacts);
        
        // Store results
        analysisResults.set(caseId, {
          status: 'completed',
          timestamp: new Date(),
          artifacts,
          synthesis
        });

        // Mark analysis as complete and clear interval
        const tracker = liveProgressTrackers.get(caseId);
        if (tracker) {
          clearInterval(tracker.intervalId);
          liveProgressTrackers.set(caseId, { ...tracker, currentProgress: 100, isComplete: true });
        }

        console.log(`Analysis ${caseId} completed with ${artifacts.length} artifacts`);

        // Schedule cleanup to prevent memory leaks
        setTimeout(() => {
          analysisResults.delete(caseId);
          analysisRequests.delete(caseId);
          liveAnalysisSummaries.delete(caseId);
          liveProgressTrackers.delete(caseId);
          modelStatuses.delete(caseId);
          console.log(`Cleaned up in-memory data for case ${caseId}`);
        }, 1800000); // Clean up after 30 minutes
      }).catch(error => {
        console.error(`Analysis ${caseId} failed:`, error);
        analysisResults.set(caseId, {
          status: 'failed',
          timestamp: new Date(),
          error: error.message
        });
        // Mark analysis as complete (failed) and clear interval
        const tracker = liveProgressTrackers.get(caseId);
        if (tracker) {
          clearInterval(tracker.intervalId);
          liveProgressTrackers.set(caseId, { ...tracker, currentProgress: 100, isComplete: true });
        }

        // Schedule cleanup for failed analysis
        setTimeout(() => {
          analysisResults.delete(caseId);
          analysisRequests.delete(caseId);
          liveAnalysisSummaries.delete(caseId);
          liveProgressTrackers.delete(caseId);
          modelStatuses.delete(caseId);
          console.log(`Cleaned up in-memory data for failed case ${caseId}`);
        }, 1800000); // Clean up after 30 minutes
      });

    } catch (error) {
      console.error('Analysis error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // REMOVED: SSE streaming endpoint - simplified to staging-only approach
  // Frontend should use polling with /analysis/:id/status for progress updates

  // Get visual analysis report - LCARS compatible
  fastify.get('/analysis/:id/visual-report', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      
      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      const results = analysisResults.get(id);
      
      if (!results) {
        return reply.status(404).send({ error: 'Analysis not found' });
      }

      if (results.status !== 'completed') {
        return reply.status(202).send({ 
          message: 'Analysis still in progress',
          status: results.status,
          progress: liveProgressTrackers.get(id)?.currentProgress || 0
        });
      }

      // Generate LCARS-compatible visual report
      const visualReport = {
        analysisId: id,
        status: 'completed',
        timestamp: results.timestamp,
        title: "FORENSIC ANALYSIS REPORT",
        classification: "CONFIDENTIAL",
        
        // Executive summary for LCARS display
        executiveSummary: {
          totalFindings: results.artifacts?.length || 0,
          criticalIssues: results.artifacts?.filter((a: any) => a.findings.some((f: any) => f.severity === 'critical')).length || 0,
          confidenceScore: results.synthesis?.confidenceScore || 0,
          processingTime: results.artifacts?.reduce((sum: number, a: any) => sum + a.processingTime, 0) || 0,
          modelsUsed: results.artifacts?.map((a: any) => a.modelName) || []
        },

        // Visual data for LCARS components
        visualData: {
          severityDistribution: calculateSeverityDistribution(results.artifacts || []),
          modelPerformance: calculateModelPerformance(results.artifacts || []),
          timelineData: generateTimelineData(results.artifacts || []),
          threatLevel: calculateThreatLevel(results.artifacts || [])
        },

        // Processed findings (not raw model output)
        processedFindings: results.synthesis?.consensusFindings || [],
        
        // High-level recommendations
        recommendations: generateLCARSRecommendations(results.synthesis?.consensusFindings || []),
        
        // System metadata for LCARS
        systemMetadata: {
          analysisEngine: "ForensicAnalyzerPro v2.0",
          stardate: new Date().toISOString(),
          operator: userId,
          clearanceLevel: "ALPHA-7"
        }
      };

      reply.send(visualReport);
    } catch (error) {
      console.error('Visual report generation error:', error);
      reply.status(500).send({ error: 'Failed to generate visual report' });
    }
  });

  // Get analysis status
  fastify.get('/analysis/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      
      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      const results = analysisResults.get(id);
      
      if (!results) {
        return reply.status(404).send({ error: 'Analysis not found' });
      }

      reply.send({
        analysisId: id,
        status: results.status,
        artifacts: results.artifacts?.length || 0,
        confidence: results.synthesis?.confidenceScore || 0,
        createdAt: results.timestamp
      });
    } catch (error) {
      console.error('Status check error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get analysis results
  fastify.get('/analysis/:id/results', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled

      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }
      
      const results = analysisResults.get(id);
      
      if (!results) {
        return reply.status(404).send({ error: 'Analysis not found' });
      }

      if (results.status !== 'completed') {
        return reply.status(202).send({ 
          message: 'Analysis still in progress',
          status: results.status 
        });
      }

      reply.send({
        analysisId: id,
        status: results.status,
        artifacts: results.artifacts,
        synthesis: results.synthesis,
        completedAt: results.timestamp
      });
    } catch (error) {
      console.error('Results retrieval error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get executive leadership narrative report
  fastify.get('/analysis/:id/executive-report', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      
      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      const results = analysisResults.get(id);
      
      if (!results || results.status !== 'completed') {
        return reply.status(404).send({ error: 'Analysis not found or not completed' });
      }

      // Generate executive narrative using LLM
      const executiveNarrative = await analysisService.generateExecutiveNarrative(results.artifacts, results.synthesis);
      
      reply.send({
        analysisId: id,
        status: 'completed',
        executiveNarrative,
        confidence: results.synthesis?.confidenceScore || 0,
        completedAt: results.timestamp
      });
    } catch (error) {
      console.error('Executive report generation error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get PDF report
  fastify.get('/analysis/:id/report.pdf', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      
      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      const results = analysisResults.get(id);
      
      if (!results || results.status !== 'completed') {
        return reply.status(404).send({ error: 'Analysis not found or not completed' });
      }

      // Generate PDF report
      const pdfBuffer = await analysisService.generatePDFReport(results.artifacts, results.synthesis);
      
      reply.header('Content-Type', 'application/pdf');
      reply.header('Content-Disposition', `attachment; filename="forensic-analysis-${id}.pdf"`);
      return pdfBuffer;
    } catch (error) {
      console.error('PDF report generation error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get rich media analysis results
  fastify.get('/analysis/:id/rich-results', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      
      const analysisRequest = analysisRequests.get(id);
      // TODO: Enable user check when authentication is enabled
      // if (analysisRequest?.userId !== userId) {
      //   return reply.status(403).send({ error: 'Forbidden' });
      // }

      const results = analysisResults.get(id);
      
      if (!results || results.status !== 'completed') {
        return reply.status(404).send({ error: 'Analysis not found or not completed' });
      }

      if (!results.artifacts || !results.synthesis) {
        return reply.status(404).send({ error: 'Rich media data not available' });
      }

      // Generate rich media report using the new service
      const richMediaReport = await analysisService.getMediaGeneratorService().generateRichMediaReport(id, results.artifacts);
      
      reply.send({
        analysisId: id,
        status: results.status,
        richMedia: richMediaReport,
        completedAt: results.timestamp
      });
    } catch (error) {
      console.error('Rich media retrieval error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Test endpoint for rich HTML generation
  fastify.get('/analysis/:id/test-rich-html', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
      // Get the analysis results
      const results = analysisResults.get(id);
      if (!results) {
        return reply.status(404).send({ error: 'Analysis not found' });
      }
      
      // Generate rich HTML from the final report
      const reportGenerationService = new ReportGenerationService();
      const richHTML = await reportGenerationService.generateRichHTMLReport(
        results.synthesis?.finalReport || '# No Report Available\n\nNo analysis report was generated.',
        {
          includeCharts: true,
          includeTimeline: true,
          includeInteractiveElements: true,
          theme: 'professional'
        }
      );
      
      reply.type('text/html').send(richHTML);
    } catch (error) {
      console.error('Error generating rich HTML:', error);
      reply.status(500).send({ error: 'Failed to generate rich HTML report' });
    }
  });

  // List all analyses
  fastify.get('/analyses', async (request, reply) => {
    try {
      const userId = 'demo-user'; // TODO: Get from JWT when authentication is enabled
      const analyses = Array.from(analysisResults.entries())
        .filter(([id, data]) => {
          const req = analysisRequests.get(id);
          // TODO: Enable user filtering when authentication is enabled
          return req; // && req.userId === userId;
        })
        .map(([id, data]) => ({
          id,
          status: data.status,
          createdAt: data.timestamp,
          artifacts: data.artifacts?.length || 0,
          confidence: data.synthesis?.confidenceScore || 0
        }));
      reply.send({ analyses });
    } catch (error) {
      console.error('List analyses error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });
} 

// Helper functions for LCARS visual report generation
function calculateSeverityDistribution(artifacts: any[]) {
  const severityCount: { critical: number; high: number; medium: number; low: number } = { critical: 0, high: 0, medium: 0, low: 0 };
  artifacts.forEach((artifact: any) => {
    artifact.findings?.forEach((finding: any) => {
      const severity = finding.severity;
      if (severity === 'critical' || severity === 'high' || severity === 'medium' || severity === 'low') {
        severityCount[severity as keyof typeof severityCount]++;
      }
    });
  });
  return severityCount;
}

function calculateModelPerformance(artifacts: any[]) {
  return artifacts.map((artifact: any) => ({
    model: artifact.modelName,
    confidence: artifact.confidence,
    processingTime: artifact.processingTime,
    findingsCount: artifact.findings?.length || 0
  }));
}

function generateTimelineData(artifacts: any[]) {
  return artifacts.map((artifact: any) => ({
    timestamp: artifact.timestamp,
    model: artifact.modelName,
    status: 'completed',
    findings: artifact.findings?.length || 0
  }));
}

function calculateThreatLevel(artifacts: any[]) {
  const criticalCount = artifacts.reduce((sum: number, a: any) => 
    sum + (a.findings?.filter((f: any) => f.severity === 'critical').length || 0), 0);
  const highCount = artifacts.reduce((sum: number, a: any) => 
    sum + (a.findings?.filter((f: any) => f.severity === 'high').length || 0), 0);
  
  if (criticalCount > 0) return 'CRITICAL';
  if (highCount > 2) return 'HIGH';
  if (highCount > 0) return 'MEDIUM';
  return 'LOW';
}

function generateLCARSRecommendations(findings: any[]) {
  const recommendations = findings.flatMap(f => f.recommendations || []);
  const uniqueRecommendations = [...new Set(recommendations)];
  
  return uniqueRecommendations.slice(0, 5).map((rec, index) => ({
    priority: index < 2 ? 'HIGH' : 'MEDIUM',
    recommendation: rec,
    category: 'SECURITY'
  }));
}