import OpenAI from 'openai';
import { FileAnalysis } from './file-processing-service';

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
}

export interface AnalysisArtifact {
  modelName: string;
  timestamp: Date;
  findings: ForensicFinding[];
  confidence: number;
  processingTime: number;
  tokenUsage: number;
  rawResponse: string;
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
  private maxRetries = 3;
  private timeoutMs = 300000; // 5 minutes

  constructor() {
    this.openRouterClient = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
        "X-Title": "ForensicAnalyzerPro",
      }
    });
  }

  async analyzeEvidence(request: AnalysisRequest): Promise<AnalysisArtifact[]> {
    const artifacts: AnalysisArtifact[] = [];
    
    // Process through each model in parallel
    const modelPromises = getActiveModels().map(model => 
      this.analyzeWithModel(model, request)
    );
    
    const results = await Promise.allSettled(modelPromises);
    
    // Handle failures gracefully
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        artifacts.push(result.value);
      } else {
        console.error(`Model ${getActiveModels()[index].name} failed:`, result.reason);
        // Create a failure artifact for audit purposes
        artifacts.push({
          modelName: getActiveModels()[index].name,
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

  async * analyzeWithModelStream(
    model: ModelConfig, 
    request: AnalysisRequest
  ): AsyncGenerator<string, void, unknown> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const prompt = this.buildPrompt(model, request);
      
      const stream = await this.openRouterClient.chat.completions.create({
        model: model.name,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 4000,
        temperature: 0.1,
        stream: true,
      }, { signal: controller.signal });

      for await (const chunk of stream) {
        yield chunk.choices[0]?.delta?.content || '';
      }
    } catch (error) {
      console.error(`Error during streaming with ${model.name}:`, error);
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private buildPrompt(model: ModelConfig, request: AnalysisRequest): string {
    const basePrompt = `
# Forensic Analysis Request

## Context
${request.context}

## Case Information
- Case ID: ${request.caseId}
- Priority: ${request.priority}
- Files: ${request.fileNames.join(', ')}

## Analysis Instructions
You are an expert digital forensics analyst. Analyze the provided evidence and provide a comprehensive forensic report.

## Evidence Files
${request.files.map((file, index) => `
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
          return parsed.findings;
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
          findings.push(currentFinding as ForensicFinding);
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
      findings.push(currentFinding as ForensicFinding);
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

  private async generateFinalReport(
    consensusFindings: ForensicFinding[],
    conflictingFindings: ConflictingFinding[],
    artifacts: AnalysisArtifact[]
  ): Promise<string> {
    const report = `
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

    return report;
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
} 