import { describe, it, expect, mock } from 'bun:test';
import { OpenRouterAnalysisService } from '../openrouter-analysis-service';

// A more robust mock setup
const mockCreate = mock(async (options: any) => {
  if (options.model?.includes('fail')) {
    throw new Error('Model failed');
  }
  if (options.stream) {
    async function* stream() {
      yield { choices: [{ delta: { content: '{"findings": [{"category": "Test"}]}' } }] };
    }
    return stream();
  }
  return {
    choices: [{ message: { content: '```json\n{"findings": [{"category": "Test Finding","severity": "high","description": "A test finding."}]}\n```' } }],
    usage: { total_tokens: 100 },
  };
});

mock.module('openai', () => ({
  __esModule: true,
  default: class {
    chat = {
      completions: { create: mockCreate }
    };
  }
}));

describe('OpenRouterAnalysisService Integration', () => {
  it('should orchestrate analysis across multiple models', async () => {
    const service = new OpenRouterAnalysisService(() => {});
    const request = {
      files: [Buffer.from('test data')],
      fileNames: ['test.txt'],
      context: 'test context',
      priority: 'quality',
      caseId: 'test-case',
    } as any;

    const artifacts = await service.analyzeEvidence(request);
    expect(artifacts.length).toBeGreaterThan(0);
    expect(artifacts[0].modelName).toBeDefined();
    expect(artifacts[0].findings[0].category).toBe('Test Finding');
  });

  it('should synthesize findings from multiple artifacts', async () => {
    const service = new OpenRouterAnalysisService(() => {});
    const artifacts = [
      { modelName: 'model1', confidence: 80, findings: [{ category: 'A', severity: 'high', description: 'desc1', evidence: [], recommendations: [] }] },
      { modelName: 'model2', confidence: 90, findings: [{ category: 'A', severity: 'high', description: 'desc2', evidence: [], recommendations: [] }] },
      { modelName: 'model3', confidence: 70, findings: [{ category: 'B', severity: 'low', description: 'desc3', evidence: [], recommendations: [] }] },
    ] as any;

    const synthesis = await service.synthesizeAnalysis(artifacts);
    expect(synthesis.consensusFindings).toHaveLength(1);
    expect(synthesis.consensusFindings[0].category).toBe('A');
    expect(synthesis.confidenceScore).toBe(80);
  });

  it('should create a failure artifact when a model analysis fails', async () => {
    const service = new OpenRouterAnalysisService(() => {});
    const originalModels = service.getActiveModels;
    service.getActiveModels = () => [{ name: 'fail-model', provider: 'test' } as any];

    const request = {
      caseId: 'test-case-fail',
    } as any;
    
    const artifacts = await service.analyzeEvidence(request);
    
    expect(artifacts.length).toBe(1);
    const failedArtifact = artifacts[0];
    expect(failedArtifact).toBeDefined();
    expect(failedArtifact.modelName).toContain('fail-model');
    expect(failedArtifact.confidence).toBe(0);
    expect(failedArtifact.rawResponse).toContain('Error: Model failed');

    service.getActiveModels = originalModels; // Restore
  });
}); 