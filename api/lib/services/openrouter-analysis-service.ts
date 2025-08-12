import OpenAI from 'openai';
import { FileAnalysis } from './file-processing-service';
import { SimpleStagingService } from './simple-staging-service';
import { MediaGeneratorService } from './media-generator-service';
import { ReportGenerationService } from './report-generation-service';

export interface ModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  costPerToken: number;
  speedRating: number;
  qualityRating: number;
}

export interface AnalysisRequest {
  files: Buffer[];
  fileNames: string[];
  context: string;
  priority: 'speed' | 'quality' | 'cost';
  caseId: string;
  userId: string;
}

export interface AnalysisArtifact {
  modelName: string;
  timestamp: Date;
  findings: ForensicFinding[];
  confidence: number;
  processingTime: number;
  tokenUsage: number;
  // Keep rawResponse internally only; do not expose via public API
  rawResponse?: string;
}

export interface ForensicFinding {
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: string[];
  recommendations: string[];
}

export interface SynthesisResult {
  consensusFindings: ForensicFinding[];
  conflictingFindings: ConflictingFinding[];
  confidenceScore: number;
  finalReport: string;
  summary: string;
}

export interface ConflictingFinding {
  category: string;
  modelDisagreements: {
    model: string;
    finding: string;
    confidence: number;
  }[];
  resolution: string;
}

const ALL_MODELS: ModelConfig[] = [
  {
    name: "google/gemini-2.5-flash",
    provider: "google",
    contextWindow: 1048576,
    costPerToken: 0.0000003,
    speedRating: 98,
    qualityRating: 88
  },
  {
    name: "google/gemini-2.5-pro",
    provider: "google",
    contextWindow: 1048576,
    costPerToken: 0.00000125,
    speedRating: 85,
    qualityRating: 96
  },
  {
    name: "openai/gpt-4.1",
    provider: "openai",
    contextWindow: 1047576,
    costPerToken: 0.000002,
    speedRating: 80,
    qualityRating: 95
  },
  {
    name: "anthropic/claude-sonnet-4",
    provider: "anthropic",
    contextWindow: 200000,
    costPerToken: 0.000003,
    speedRating: 82,
    qualityRating: 94
  },
  {
    name: "deepseek/deepseek-chat",
    provider: "deepseek",
    contextWindow: 131072,
    costPerToken: 0.00000014,
    speedRating: 95,
    qualityRating: 85
  }
];

const FREE_MODEL_NAMES = ["google/gemini-2.5-flash"];

function getActiveModels(): ModelConfig[] {
  const tier = (process.env.ANALYSIS_TIER || "free").toLowerCase();
  if (tier === "pro") {
    return ALL_MODELS;
  }
  return ALL_MODELS.filter(m => FREE_MODEL_NAMES.includes(m.name));
}

export class OpenRouterAnalysisService {
  private openRouterClient: OpenAI;
  private stagingService: SimpleStagingService;
  private mediaGeneratorService: MediaGeneratorService;
  private reportGenerationService: ReportGenerationService;
  private onSummaryUpdate: (caseId: string, summary: string) => void;
  private maxRetries = 3;
  private timeoutMs = 300000; // 5 minutes

  constructor(onSummaryUpdate: (caseId: string, summary: string) => void) {
    this.openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY || '',
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "ForensicAnalyzerPro",
      }
    });
    this.onSummaryUpdate = onSummaryUpdate;
    this.stagingService = new SimpleStagingService();
    this.mediaGeneratorService = new MediaGeneratorService();
    this.reportGenerationService = new ReportGenerationService();
  }

  async analyzeEvidence(request: AnalysisRequest): Promise<AnalysisArtifact[]> {
    const artifacts: AnalysisArtifact[] = [];
    
    // Process through each model in parallel
    const activeModels = this.getActiveModels();
    const modelPromises = activeModels.map(model => 
      this.analyzeWithModel(model, request)
    );
    
    const results = await Promise.allSettled(modelPromises);
    
    // Handle failures gracefully
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        artifacts.push(result.value);
      } else {
        console.error(`Model ${activeModels[index].name} failed:`, result.reason);
        // Create a failure artifact for audit purposes
        artifacts.push({
          modelName: activeModels[index].name,
          timestamp: new Date(),
          findings: [],
          confidence: 0,
          processingTime: 0,
          tokenUsage: 0,
          rawResponse: `Error: ${result.reason}`
        });
      }
    });
    
    return artifacts;
  }

  private async analyzeWithModel(
    model: ModelConfig, 
    request: AnalysisRequest
  ): Promise<AnalysisArtifact> {
    const startTime = Date.now();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);
    
    try {
      const prompt = this.buildPrompt(model, request);
      
      const response = await this.openRouterClient.chat.completions.create({
        model: model.name,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.1,
      }, { signal: controller.signal });

      const content = response.choices[0].message.content || '';

      // Stage the result using the simplified staging service
      await this.stagingService.stageResult(model.name, content, request.caseId);

      const findings = this.parseFindings(content);
      const confidence = this.calculateConfidence(findings, response);
      
      return {
        modelName: model.name,
        timestamp: new Date(),
        findings,
        confidence,
        processingTime: Date.now() - startTime,
        tokenUsage: response.usage?.total_tokens || 0,
        rawResponse: content
      };
    } catch (error) {
      console.error(`Error analyzing with ${model.name}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // REMOVED: Streaming functionality - simplified to staging-only approach
  // async * analyzeWithModelStream() method removed to reduce complexity

  private buildPrompt(model: ModelConfig, request: AnalysisRequest): string {
    const safeFileNames = Array.isArray((request as any).fileNames) ? (request as any).fileNames : [];
    const safeFiles = Array.isArray((request as any).files) ? (request as any).files : [];
    const safeContext = (request as any).context || '';
    const safePriority = (request as any).priority || 'quality';
    const safeCaseId = (request as any).caseId || 'test-case';

    const basePrompt = `
# Forensic Analysis Request

## Context
${safeContext}

## Case Information
- Case ID: ${safeCaseId}
- Priority: ${safePriority}
- Files: ${safeFileNames.join(', ')}

## Analysis Instructions
You are an expert digital forensics analyst. Analyze the provided evidence and provide a comprehensive forensic report.

## Evidence Files
${safeFiles.map((file, index) => `
### File ${index + 1}: ${request.fileNames[index]}
\`\`\`
${file.toString('utf-8').substring(0, Math.min(50000, model.contextWindow / 4))}
\`\`\`
`).join('\n')}

## Required Analysis Format
Please provide your analysis in the following JSON format:
\`\`\`json
{
  "findings": [
    {
      "category": "string",
      "severity": "low|medium|high|critical",
      "description": "string",
      "evidence": ["string"],
      "recommendations": ["string"]
    }
  ],
  "summary": "string",
  "confidence": number (0-100)
}
\`\`\`

## Model-Specific Instructions
`;

    // Add model-specific instructions
    switch (model.provider) {
      case 'google':
        if (model.name.includes('flash')) {
          return basePrompt + `
Focus on rapid triage and initial assessment. Identify:
- Critical security events
- Timeline of activities
- High-priority indicators of compromise
- Immediate threats requiring attention`;
        } else {
          return basePrompt + `
Perform deep technical analysis with focus on:
- Detailed pattern recognition
- Complex relationship mapping
- Advanced persistent threat detection
- Sophisticated attack vector analysis`;
        }
      
      case 'x-ai':
        return basePrompt + `
Provide creative interpretation and anomaly detection:
- Unusual patterns that might be missed
- Creative attack vectors
- Behavioral anomalies
- Novel threat detection approaches`;
      
      case 'anthropic':
        return basePrompt + `
Provide comprehensive analysis with a focus on enterprise-grade reliability and instruction following:
- Meticulous, step-by-step reasoning
- High-recall analysis of long documents
- Identification of subtle security flaws
- Actionable recommendations for remediation`;
      
      default:
        return basePrompt + `
Provide thorough forensic analysis covering all aspects of the evidence.`;
    }
  }

  private parseFindings(content: string): ForensicFinding[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.findings && Array.isArray(parsed.findings)) {
          return parsed.findings.map((f: any) => ({
            category: f.category || 'Unknown',
            severity: f.severity || 'medium',
            description: f.description || '',
            evidence: f.evidence || [],
            recommendations: f.recommendations || [],
          }));
        }
      }
      
      // Fallback: parse structured text
      return this.parseStructuredText(content);
    } catch (error) {
      console.error('Failed to parse findings:', error);
      return [{
        category: 'Parsing Error',
        severity: 'medium',
        description: 'Failed to parse model response',
        evidence: [content.substring(0, 500)],
        recommendations: ['Review raw response for manual analysis']
      }];
    }
  }

  private parseStructuredText(content: string): ForensicFinding[] {
    // Simple text parsing for non-JSON responses
    const findings: ForensicFinding[] = [];
    const lines = content.split('\n');
    
    let currentFinding: Partial<ForensicFinding> = {};
    
    for (const line of lines) {
      if (line.includes('Category:') || line.includes('Finding:')) {
        if (currentFinding.category) {
          findings.push({
            recommendations: [], 
            evidence: [], 
            ...currentFinding
          } as ForensicFinding);
          currentFinding = {};
        }
        currentFinding.category = line.split(':')[1]?.trim() || 'Unknown';
      } else if (line.includes('Severity:')) {
        const severity = line.split(':')[1]?.trim().toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(severity)) {
          currentFinding.severity = severity as any;
        }
      } else if (line.includes('Description:')) {
        currentFinding.description = line.split(':')[1]?.trim() || '';
      }
    }
    
    if (currentFinding.category) {
      findings.push({
        recommendations: [], 
        evidence: [], 
        ...currentFinding
      } as ForensicFinding);
    }
    
    return findings.length > 0 ? findings : [{
      category: 'General Analysis',
      severity: 'medium',
      description: content.substring(0, 500),
      evidence: [],
      recommendations: []
    }];
  }

  private calculateConfidence(findings: ForensicFinding[], response: any): number {
    // Simple confidence calculation based on findings quality
    let score = 50; // Base score
    
    // Add points for structured findings
    if (findings.length > 0) score += 20;
    if (findings.some(f => f.severity === 'critical')) score += 15;
    if (findings.some(f => f.evidence.length > 0)) score += 10;
    if (findings.some(f => f.recommendations.length > 0)) score += 5;
    
    return Math.min(100, score);
  }

  async synthesizeAnalysis(artifacts: AnalysisArtifact[]): Promise<SynthesisResult> {
    // In test environment, skip external LLM calls for determinism
    if (process.env.NODE_ENV === 'test') {
      const consensusFindings: ForensicFinding[] = [];
      const conflictingFindings: ConflictingFinding[] = [];
      const findingsByCategory = new Map<string, ForensicFinding[]>();
      artifacts.forEach(artifact => {
        artifact.findings.forEach(finding => {
          if (!findingsByCategory.has(finding.category)) {
            findingsByCategory.set(finding.category, []);
          }
          findingsByCategory.get(finding.category)!.push(finding);
        });
      });
      for (const [category, findings] of findingsByCategory) {
        if (findings.length >= 2) {
          const severityCounts = new Map<string, number>();
          findings.forEach(f => {
            severityCounts.set(f.severity, (severityCounts.get(f.severity) || 0) + 1);
          });
          const mostCommonSeverity = Array.from(severityCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
          consensusFindings.push({
            category,
            severity: mostCommonSeverity as any,
            description: findings[0].description,
            evidence: [...new Set(findings.flatMap(f => f.evidence))],
            recommendations: [...new Set(findings.flatMap(f => f.recommendations))]
          });
        }
      }
      const avgConfidence = artifacts.length
        ? artifacts.reduce((sum, a) => sum + a.confidence, 0) / artifacts.length
        : 0;
      const finalReport = await this.generateFinalReport(consensusFindings, conflictingFindings, artifacts);
      return {
        consensusFindings,
        conflictingFindings,
        confidenceScore: avgConfidence,
        finalReport,
        summary: this.generateSummary(consensusFindings)
      };
    }

    // Use Claude Sonnet 4 to synthesize all model outputs
    try {
      const prompt = `You are a senior forensic analyst tasked with synthesizing findings from multiple AI models into a comprehensive, professional report.

ANALYSIS CONTEXT:
You have received outputs from ${artifacts.length} different AI models analyzing the same forensic evidence. Your job is to:

1. **Collate and Compare**: Review all model outputs and identify consensus vs. conflicting findings
2. **Weigh and Measure**: Assess the reliability and confidence of each model's findings
3. **Synthesize**: Create a final, authoritative report that represents the best analysis
4. **Format Professionally**: Present findings in a clear, structured format suitable for legal/executive review

MODEL OUTPUTS:
${artifacts.map((artifact, index) => `
MODEL ${index + 1}: ${artifact.modelName}
Confidence: ${artifact.confidence}%
Processing Time: ${artifact.processingTime}ms
Token Usage: ${artifact.tokenUsage}

FINDINGS:
${artifact.findings.map(finding => `
- Category: ${finding.category}
- Severity: ${finding.severity.toUpperCase()}
- Description: ${finding.description}
- Evidence: ${finding.evidence.join('; ')}
- Recommendations: ${finding.recommendations.join('; ')}
`).join('\n')}

RAW RESPONSE:
${artifact.rawResponse}
`).join('\n\n')}

TASK:
Create a comprehensive synthesis that includes:

1. **Executive Summary** (2-3 paragraphs)
   - High-level overview of findings
   - Risk assessment and business impact
   - Key recommendations for leadership

2. **Consensus Findings** (detailed analysis)
   - Findings that multiple models agree on
   - Evidence and confidence levels
   - Specific recommendations

3. **Conflicting Analysis** (if any)
   - Areas where models disagree
   - Analysis of why conflicts exist
   - Resolution recommendations

4. **Technical Details**
   - Model performance comparison
   - Confidence scoring methodology
   - Limitations and caveats

5. **Recommendations**
   - Immediate actions required
   - Long-term strategic recommendations
   - Risk mitigation strategies

FORMAT THE OUTPUT AS A PROFESSIONAL FORENSIC REPORT with proper headings, bullet points, and structured sections. Use clear, authoritative language suitable for legal and executive review.

Focus on creating actionable insights and clear risk assessments.`;

      const response = await this.openRouterClient.chat.completions.create({
        model: "anthropic/claude-sonnet-4",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.2,
      });

      const synthesizedReport = response.choices[0].message.content || 'Synthesis failed.';

      // Parse the synthesized report to extract structured findings
      const consensusFindings = this.extractConsensusFindings(synthesizedReport);
      const conflictingFindings: ConflictingFinding[] = []; // Will be enhanced later
      
      // Calculate overall confidence
      const avgConfidence = artifacts.reduce((sum, a) => sum + a.confidence, 0) / artifacts.length;
      
      return {
        consensusFindings,
        conflictingFindings,
        confidenceScore: avgConfidence,
        finalReport: synthesizedReport,
        summary: this.generateSummary(consensusFindings)
      };
    } catch (error) {
      console.error('Synthesis with Claude Sonnet 4 failed:', error);
      
      // Fallback to original synthesis method
      const consensusFindings: ForensicFinding[] = [];
      const conflictingFindings: ConflictingFinding[] = [];
      
      // Group findings by category
      const findingsByCategory = new Map<string, ForensicFinding[]>();
      
      artifacts.forEach(artifact => {
        artifact.findings.forEach(finding => {
          if (!findingsByCategory.has(finding.category)) {
            findingsByCategory.set(finding.category, []);
          }
          findingsByCategory.get(finding.category)!.push(finding);
        });
      });
      
      // Analyze consensus and conflicts
      for (const [category, findings] of findingsByCategory) {
        if (findings.length >= 2) {
          // Check for consensus
          const severityCounts = new Map<string, number>();
          findings.forEach(f => {
            severityCounts.set(f.severity, (severityCounts.get(f.severity) || 0) + 1);
          });
          
          const mostCommonSeverity = Array.from(severityCounts.entries())
            .sort((a, b) => b[1] - a[1])[0][0];
          
          // Create consensus finding
          consensusFindings.push({
            category,
            severity: mostCommonSeverity as any,
            description: findings[0].description,
            evidence: [...new Set(findings.flatMap(f => f.evidence))],
            recommendations: [...new Set(findings.flatMap(f => f.recommendations))]
          });
        }
      }
      
      // Calculate overall confidence
      const avgConfidence = artifacts.reduce((sum, a) => sum + a.confidence, 0) / artifacts.length;
      
      // Generate final report
      const finalReport = await this.generateFinalReport(consensusFindings, conflictingFindings, artifacts);
      
      return {
        consensusFindings,
        conflictingFindings,
        confidenceScore: avgConfidence,
        finalReport,
        summary: this.generateSummary(consensusFindings)
      };
    }
  }

  private extractConsensusFindings(synthesizedReport: string): ForensicFinding[] {
    // Simple extraction - in production, you'd want more sophisticated parsing
    const findings: ForensicFinding[] = [];
    
    // Look for patterns in the synthesized report
    const severityPatterns = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    const lines = synthesizedReport.split('\n');
    
    let currentFinding: Partial<ForensicFinding> = {};
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      // Look for severity indicators
      const severity = severityPatterns.find(s => trimmedLine.includes(s));
      if (severity) {
        if (currentFinding.category && currentFinding.description) {
          findings.push(currentFinding as ForensicFinding);
        }
        currentFinding = {
          severity: severity.toLowerCase() as any,
          evidence: [],
          recommendations: []
        };
      }
      
      // Look for category patterns
      if (trimmedLine.includes(':') && !trimmedLine.includes('http')) {
        const parts = trimmedLine.split(':');
        if (parts.length >= 2) {
          currentFinding.category = parts[0].trim();
          currentFinding.description = parts[1].trim();
        }
      }
    }
    
    // Add the last finding if it exists
    if (currentFinding.category && currentFinding.description) {
      findings.push(currentFinding as ForensicFinding);
    }
    
    return findings;
  }

  private async generateFinalReport(
    consensusFindings: ForensicFinding[],
    conflictingFindings: ConflictingFinding[],
    artifacts: AnalysisArtifact[]
  ): Promise<string> {
    // Generate rich HTML report instead of plain markdown
    const markdownReport = `
# Forensic Analysis Report

## Executive Summary
This report presents the findings from a comprehensive multi-model AI analysis of the submitted evidence.

## Analysis Overview
- **Models Used**: ${artifacts.map(a => a.modelName).join(', ')}
- **Processing Time**: ${artifacts.reduce((sum, a) => sum + a.processingTime, 0)}ms
- **Total Tokens**: ${artifacts.reduce((sum, a) => sum + a.tokenUsage, 0)}
- **Confidence Score**: ${(artifacts.reduce((sum, a) => sum + a.confidence, 0) / artifacts.length).toFixed(1)}%

## Consensus Findings
${consensusFindings.map(f => `
### ${f.category} (${f.severity.toUpperCase()})
${f.description}

**Evidence:**
${f.evidence.map(e => `- ${e}`).join('\n')}

**Recommendations:**
${f.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}

## Individual Model Analysis
${artifacts.map(a => `
### ${a.modelName}
- **Confidence**: ${a.confidence}%
- **Processing Time**: ${a.processingTime}ms
- **Token Usage**: ${a.tokenUsage}
- **Findings**: ${a.findings.length}
`).join('\n')}

## Conclusion
Based on the multi-model analysis, the evidence shows ${consensusFindings.length} consensus findings requiring attention.

---
Generated by ForensicAnalyzerPro Multi-LLM Analysis Engine
`;

    // Convert to rich HTML
    return await this.reportGenerationService.generateRichHTMLReport(markdownReport, {
      includeCharts: true,
      includeTimeline: true,
      includeInteractiveElements: true,
      theme: 'professional'
    });
  }

  private generateSummary(findings: ForensicFinding[]): string {
    const criticalCount = findings.filter(f => f.severity === 'critical').length;
    const highCount = findings.filter(f => f.severity === 'high').length;
    const mediumCount = findings.filter(f => f.severity === 'medium').length;
    const lowCount = findings.filter(f => f.severity === 'low').length;
    
    return `Analysis completed with ${findings.length} findings: ${criticalCount} critical, ${highCount} high, ${mediumCount} medium, ${lowCount} low severity issues identified.`;
  }

  getActiveModelNames(): string[] {
    return getActiveModels().map(m => m.name);
  }

  getActiveModels(): ModelConfig[] {
    return getActiveModels();
  }

  public getMediaGeneratorService(): MediaGeneratorService {
    return this.mediaGeneratorService;
  }

  async generateExecutiveNarrative(artifacts: AnalysisArtifact[], synthesis: SynthesisResult): Promise<string> {
    try {
      const prompt = `You are a senior forensic analyst creating an executive-level narrative report for leadership.

Based on the following forensic analysis results, create a compelling, high-level narrative that would be suitable for:
- C-level executives
- Board members
- Non-technical stakeholders

Focus on:
1. Business impact and risk assessment
2. Key findings that matter to leadership
3. Strategic recommendations
4. Clear, non-technical language
5. Actionable insights

Analysis Results:
${artifacts.map(a => `
Model: ${a.modelName}
Findings: ${a.findings.map(f => `${f.category} (${f.severity}): ${f.description}`).join('; ')}
`).join('\n')}

Synthesis Summary:
${synthesis.summary}

Confidence Score: ${synthesis.confidenceScore}%

Create a narrative that tells the story of what happened, why it matters, and what leadership should do about it.`;

      const response = await this.openRouterClient.chat.completions.create({
        model: "anthropic/claude-sonnet-4", // Use a high-quality model for executive narrative
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.3,
      });

      return response.choices[0].message.content || 'Executive narrative generation failed.';
    } catch (error) {
      console.error('Executive narrative generation failed:', error);
      return `Executive Summary: ${synthesis.summary}\n\nThis analysis identified ${synthesis.consensusFindings.length} key findings requiring leadership attention.`;
    }
  }

  async generatePDFReport(artifacts: AnalysisArtifact[], synthesis: SynthesisResult): Promise<Buffer> {
    try {
      // Collect all findings from artifacts
      const allFindings = artifacts.flatMap(artifact => artifact.findings);
      
      // Count findings by severity
      const severityCounts = {
        critical: allFindings.filter(f => f.severity === 'critical').length,
        high: allFindings.filter(f => f.severity === 'high').length,
        medium: allFindings.filter(f => f.severity === 'medium').length,
        low: allFindings.filter(f => f.severity === 'low').length
      };
      
      const totalFindings = allFindings.length;
      
      // For now, generate a simple text-based PDF
      // In production, you'd use a proper PDF library like puppeteer or jsPDF
      const reportContent = `
FORENSIC ANALYSIS REPORT
========================

Executive Summary
----------------
Analysis completed with ${totalFindings} findings: ${severityCounts.critical} critical, ${severityCounts.high} high, ${severityCounts.medium} medium, ${severityCounts.low} low severity issues identified.

Key Findings
-----------
${allFindings.map(f => `
${f.category} (${f.severity.toUpperCase()})
${f.description}

Evidence:
${f.evidence.map(e => `- ${e}`).join('\n')}

Recommendations:
${f.recommendations.map(r => `- ${r}`).join('\n')}
`).join('\n')}

Analysis Details
---------------
Models Used: ${artifacts.map(a => a.modelName).join(', ')}
Confidence Score: ${synthesis.confidenceScore}%
Processing Time: ${artifacts.reduce((sum, a) => sum + a.processingTime, 0)}ms

Generated by ForensicAnalyzerPro
Date: ${new Date().toISOString()}
`;

      // Convert to Buffer (in production, use proper PDF generation)
      return Buffer.from(reportContent, 'utf-8');
    } catch (error) {
      console.error('PDF generation failed:', error);
      return Buffer.from('PDF generation failed', 'utf-8');
    }
  }
} 