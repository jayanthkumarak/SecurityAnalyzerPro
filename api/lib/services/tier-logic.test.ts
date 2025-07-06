import { describe, it, expect, beforeAll, afterAll } from 'bun:test';
import { OpenRouterAnalysisService } from './openrouter-analysis-service';

describe('OpenRouterAnalysisService Tier Logic', () => {

  let originalTier: string | undefined;
  let originalApiKey: string | undefined;

  beforeAll(() => {
    originalTier = process.env.ANALYSIS_TIER;
    originalApiKey = process.env.OPENROUTER_API_KEY;
    process.env.OPENROUTER_API_KEY = 'test-key'; // Set dummy key
  });

  afterAll(() => {
    process.env.ANALYSIS_TIER = originalTier;
    process.env.OPENROUTER_API_KEY = originalApiKey;
  });

  it('should return 1 model for the "free" tier', () => {
    process.env.ANALYSIS_TIER = 'free';
    const analysisService = new OpenRouterAnalysisService(() => {});
    const models = analysisService.getActiveModelNames();
    expect(models.length).toBe(1);
    expect(models[0]).toBe('google/gemini-2.5-flash');
  });

  it('should return all models for the "pro" tier', () => {
    process.env.ANALYSIS_TIER = 'pro';
    const analysisService = new OpenRouterAnalysisService(() => {});
    const models = analysisService.getActiveModelNames();
    // Currently 5 models are in the pro tier
    expect(models.length).toBe(5);
    expect(models).toContain('google/gemini-2.5-pro');
    expect(models).toContain('deepseek/deepseek-chat');
  });

  it('should default to the "free" tier if ANALYSIS_TIER is not set', () => {
    delete process.env.ANALYSIS_TIER;
    const analysisService = new OpenRouterAnalysisService(() => {});
    const models = analysisService.getActiveModelNames();
    expect(models.length).toBe(1);
  });

}); 