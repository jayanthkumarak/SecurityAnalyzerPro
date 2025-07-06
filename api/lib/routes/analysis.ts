import { FastifyInstance } from 'fastify';
import { OpenRouterAnalysisService, AnalysisRequest } from '../services/openrouter-analysis-service';
import { FileParserService } from '../services/file-parser-service';
import { randomUUID } from 'crypto';

// In-memory storage for demo purposes
const analysisResults = new Map<string, any>();
const analysisRequests = new Map<string, AnalysisRequest>();
const liveAnalysisSummaries = new Map<string, string>();
const liveProgressTrackers = new Map<string, { intervalId: NodeJS.Timeout, currentProgress: number, isComplete: boolean, startTime: number }>();

export async function analysisRoutes(fastify: FastifyInstance) {
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
        caseId
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
        caseId
      };

      // Return immediately with analysis ID
      reply.send({
        analysisId: caseId,
        status: 'started',
        message: 'Multi-LLM analysis initiated',
        estimatedTime: '5-10 minutes',
        tier: process.env.ANALYSIS_TIER || 'free',
        models: analysisService.getActiveModelNames()
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
          console.log(`Cleaned up in-memory data for case ${caseId}`);
        }, 60000); // Clean up after 1 minute
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
          console.log(`Cleaned up in-memory data for failed case ${caseId}`);
        }, 60000); // Clean up after 1 minute
      });

    } catch (error) {
      console.error('Analysis error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Stream analysis results
  fastify.get('/analysis/:id/stream', async (request, reply) => {
    const { id } = request.params as { id: string };

    // Set headers for SSE
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Connection', 'keep-alive');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Access-Control-Allow-Origin', '*');

    const sendUpdate = () => {
      try {
        const summary = liveAnalysisSummaries.get(id) || "Waiting for analysis to start...";
        const progressTracker = liveProgressTrackers.get(id);
        const progress = progressTracker ? Math.floor(progressTracker.currentProgress) : 0;
        const status = analysisResults.get(id)?.status || 'pending';
  
        reply.raw.write(`data: ${JSON.stringify({ summary, progress, status })}\n\n`);
  
        if (progressTracker && progressTracker.isComplete) {
          console.log(`[SSE] Analysis ${id} completed, ending stream.`);
          clearInterval(updateInterval);
          reply.raw.end();
        }
      } catch (error) {
        console.error(`SSE update error for ${id}:`, error);
        clearInterval(updateInterval);
        reply.raw.end();
      }
    };

    // Send initial update immediately
    sendUpdate();

    // Send updates every 500ms for smooth progress bar
    const updateInterval = setInterval(sendUpdate, 500);

    // Timeout the stream after 175 seconds if not completed to prevent hanging connections
    const streamTimeout = setTimeout(() => {
      const tracker = liveProgressTrackers.get(id);
      if (tracker && !tracker.isComplete) {
        console.log(`[SSE] Analysis ${id} timed out after 175s, ending stream.`);
        clearInterval(updateInterval);
        reply.raw.write(`data: ${JSON.stringify({ summary: "Analysis taking longer than expected.", progress: 99, status: 'timed_out' })}\n\n`);
        reply.raw.end();
      }
    }, 175 * 1000); // 175 seconds

    // Clean up on client disconnect
    reply.raw.on('close', () => {
      console.log(`[SSE] Client disconnected for analysis ${id}. Cleaning up.`);
      clearInterval(updateInterval);
      clearTimeout(streamTimeout);
    });
  });

  // Get analysis status
  fastify.get('/analysis/:id/status', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
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

  // Get analysis report
  fastify.get('/analysis/:id/report', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const query = request.query as { format?: string };
      const format = query.format || 'markdown';
      
      const results = analysisResults.get(id);
      
      if (!results || results.status !== 'completed') {
        return reply.status(404).send({ error: 'Analysis not found or not completed' });
      }

      const report = results.synthesis.finalReport;
      
      if (format === 'json') {
        reply.send({
          analysisId: id,
          report: results.synthesis,
          generatedAt: results.timestamp
        });
      } else {
        reply.type('text/markdown').send(report);
      }
    } catch (error) {
      console.error('Report generation error:', error);
      reply.status(500).send({ error: 'Internal server error' });
    }
  });

  // Get rich media analysis results
  fastify.get('/analysis/:id/rich-results', async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      
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

  // List all analyses
  fastify.get('/analyses', async (request, reply) => {
    try {
      const analyses = Array.from(analysisResults.entries()).map(([id, data]) => ({
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