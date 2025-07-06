import { describe, it, expect, mock } from 'bun:test';
import { OpenRouterAnalysisService } from '../openrouter-analysis-service';

// Mock the OpenAI client
mock.module('openai', () => {
  const mockCompletions = {
    create: mock(async (options: any) => {
      if (options.stream) {
        // Simulate a stream
        async function* stream() {
          yield { choices: [{ delta: { content: '{"findings": [{"category": "Test"}]}' } }] };
        }
        return stream();
      }
      return {
        choices: [{ message: { content: '```json\n{"findings": [{"category": "Test Finding","severity": "high","description": "A test finding."}]}\n```' } }],
        usage: { total_tokens: 100 },
      };
    }),
  };
  return {
    __esModule: true,
    default: class {
      chat = {
        completions: mockCompletions
      };
    }
  };
});


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

    // This will depend on how many models are active in the test env
    // For now, let's just check that it ran
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
}); 