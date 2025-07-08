export class MediaGeneratorService {
    // This service will transform analysis data into rich media formats
    // such as charts, timelines, and threat matrices.

    async generateRichMediaReport(caseId: string, analysisArtifacts: any[]): Promise<any> {
        console.log(`[MediaGenerator] Generating rich media report for case ${caseId} with ${analysisArtifacts.length} artifacts.`);
        
        const totalModels = analysisArtifacts.length;
        const averageConfidence = totalModels > 0 
            ? analysisArtifacts.reduce((sum, a) => sum + a.confidence, 0) / totalModels
            : 0;

        const severityOrder = ['low', 'medium', 'high', 'critical'];
        const highestSeverity = analysisArtifacts
            .flatMap(a => a.findings)
            .reduce((max, f) => severityOrder.indexOf(f.severity) > severityOrder.indexOf(max) ? f.severity : max, 'low');

        // Calculate findings by severity for pie chart
        const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
        for (const artifact of analysisArtifacts) {
            for (const finding of (artifact.findings || [])) {
                if (['low', 'medium', 'high', 'critical'].includes(finding.severity)) {
                    severityCounts[finding.severity as 'low' | 'medium' | 'high' | 'critical']++;
                }
            }
        }

        // Enhanced timeline: include model start/end and findings
        const timelineEvents = [];
        for (const artifact of analysisArtifacts) {
            timelineEvents.push({
                timestamp: artifact.timestamp,
                description: `Model ${artifact.modelName} analysis started.`
            });
            for (const finding of (artifact.findings || [])) {
                timelineEvents.push({
                    timestamp: artifact.timestamp,
                    description: `Model ${artifact.modelName} found: ${finding.category} (${finding.severity})`
                });
            }
            timelineEvents.push({
                timestamp: artifact.timestamp,
                description: `Model ${artifact.modelName} analysis completed.`
            });
        }
        timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        return {
            caseId,
            reportTitle: `Rich Media Analysis Report for ${caseId}`,
            generatedAt: new Date().toISOString(),
            summary: {
                totalModels,
                averageConfidence,
                highestSeverity,
                totalFindings: analysisArtifacts.reduce((sum, a) => sum + a.findings.length, 0)
            },
            charts: [
                { type: 'bar', title: 'Confidence per Model', data: analysisArtifacts.map(a => ({ model: a.modelName, confidence: a.confidence })) },
                { type: 'pie', title: 'Findings by Severity', data: severityCounts }
            ],
            timeline: {
                events: timelineEvents
            },
            modelBreakdown: analysisArtifacts.reduce((acc, a) => {
                acc[a.modelName] = { confidence: a.confidence, findingsCount: a.findings.length };
                return acc;
            }, {} as Record<string, any>)
        };
    }
} 