import fs from 'fs/promises';
import path from 'path';

export interface StagedResult {
    id: string;
    model: string;
    timestamp: string;
    rawContent: string;
    summary: string;
    findings?: any[];
    confidence?: number;
}

export class SimpleStagingService {
    private stagingDir: string;

    constructor() {
        this.stagingDir = path.join(__dirname, '../../data/staged-artifacts');
    }

    // Stage a model result for processing
    async stageResult(modelName: string, rawContent: string, caseId: string): Promise<string> {
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const id = `${modelName.replace('/', '_')}-${timestamp}`;
            const filename = `${id}.json`;
            const filePath = path.join(this.stagingDir, filename);

            await fs.mkdir(this.stagingDir, { recursive: true });

            // Extract summary and findings from raw content
            const summary = this.extractSummary(rawContent);
            const findings = this.extractFindings(rawContent);
            const confidence = this.calculateConfidence(rawContent);

            const stagedData: StagedResult = {
                id,
                model: modelName,
                timestamp: new Date().toISOString(),
                rawContent,
                summary,
                findings,
                confidence
            };

            await fs.writeFile(filePath, JSON.stringify(stagedData, null, 2));
            console.log(`[SimpleStagingService] Staged result for ${modelName} -> ${filename}`);
            
            return id;
        } catch (error) {
            console.error(`[SimpleStagingService] Error staging result for ${modelName}:`, error);
            throw error;
        }
    }

    // Get all staged results for a case
    async getStagedResults(caseId?: string): Promise<StagedResult[]> {
        try {
            const files = await fs.readdir(this.stagingDir);
            const results: StagedResult[] = [];

            for (const file of files) {
                if (file.endsWith('.json')) {
                    const filePath = path.join(this.stagingDir, file);
                    const content = await fs.readFile(filePath, 'utf8');
                    const data = JSON.parse(content);
                    results.push(data);
                }
            }

            return results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        } catch (error) {
            console.error('[SimpleStagingService] Error getting staged results:', error);
            return [];
        }
    }

    // Generate a high-level summary from staged results
    async generateHighLevelSummary(stagedResults: StagedResult[]): Promise<string> {
        if (stagedResults.length === 0) {
            return "No analysis results available yet.";
        }

        const latestResult = stagedResults[0];
        const modelCount = new Set(stagedResults.map(r => r.model)).size;
        const avgConfidence = stagedResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / stagedResults.length;

        // Enhanced summary with more details
        const criticalFindings = stagedResults.flatMap(r => r.findings || []).filter(f => f.severity === 'critical').length;
        const highFindings = stagedResults.flatMap(r => r.findings || []).filter(f => f.severity === 'high').length;
        
        let summary = `Analysis Summary: ${modelCount} models analyzed. `;
        summary += `Confidence: ${Math.round(avgConfidence)}%. `;
        
        if (criticalFindings > 0) {
            summary += `🚨 ${criticalFindings} critical findings detected. `;
        }
        if (highFindings > 0) {
            summary += `⚠️ ${highFindings} high-severity findings detected. `;
        }
        
        summary += `Latest: ${latestResult.summary.substring(0, 150)}...`;
        
        return summary;
    }

    // Extract summary from raw content
    private extractSummary(rawContent: string): string {
        try {
            // Try to extract from JSON first
            const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.summary) {
                    return parsed.summary;
                }
            }

            // Try to extract from "Final Summary" section
            const summaryMatch = rawContent.match(/Final Summary:\s*([\s\S]*?)(?:\n\n|\n```|$)/);
            if (summaryMatch) {
                return summaryMatch[1].trim();
            }

            // Fallback: first paragraph
            const firstParagraph = rawContent.split('\n\n')[0];
            return firstParagraph.substring(0, 200) + '...';
        } catch (error) {
            return rawContent.substring(0, 200) + '...';
        }
    }

    // Extract findings from raw content
    private extractFindings(rawContent: string): any[] {
        try {
            const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[1]);
                if (parsed.findings && Array.isArray(parsed.findings)) {
                    return parsed.findings;
                }
            }
        } catch (error) {
            // Ignore parsing errors
        }
        return [];
    }

    // Calculate confidence score
    private calculateConfidence(rawContent: string): number {
        let score = 50; // Base score
        
        // Add points for structured content
        if (rawContent.includes('```json')) score += 20;
        if (rawContent.includes('findings')) score += 15;
        if (rawContent.includes('evidence')) score += 10;
        if (rawContent.includes('critical') || rawContent.includes('high')) score += 5;
        
        return Math.min(100, score);
    }
} 