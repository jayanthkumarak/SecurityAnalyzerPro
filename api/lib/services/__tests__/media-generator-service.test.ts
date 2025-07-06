import { describe, it, expect } from 'bun:test';
import { MediaGeneratorService } from '../media-generator-service';

describe('MediaGeneratorService', () => {
  it('should generate a rich media report structure', async () => {
    const service = new MediaGeneratorService();
    const caseId = 'test-case';
    const analysisArtifacts = [
      { modelName: 'model1', confidence: 80, findings: [{ severity: 'high' }] },
      { modelName: 'model2', confidence: 90, findings: [{ severity: 'critical' }] },
    ];

    const report = await service.generateRichMediaReport(caseId, analysisArtifacts as any);

    expect(report.caseId).toBe(caseId);
    expect(report.reportTitle).toBe(`Rich Media Analysis Report for ${caseId}`);
    expect(report.charts.length).toBe(2);
    expect(report.summary.totalModels).toBe(2);
    expect(report.summary.averageConfidence).toBe(85);
    expect(report.summary.highestSeverity).toBe('critical');
    expect(report.timeline).toBeDefined();
    expect(report.modelBreakdown.model1).toBeDefined();
    expect(report.modelBreakdown.model2).toBeDefined();
  });
}); 