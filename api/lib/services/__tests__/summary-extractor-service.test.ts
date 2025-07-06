import { describe, it, expect, mock } from 'bun:test';
import { SummaryExtractorService } from '../summary-extractor-service';

describe('SummaryExtractorService', () => {
  it('should return the current summary', () => {
    const service = new SummaryExtractorService(() => {});
    expect(service.getCurrentSummary()).toBe('Initiating analysis...');
  });

  it('should reset the summary', () => {
    const service = new SummaryExtractorService(() => {});
    service.processStreamChunk('test-model', 'some content');
    service.resetSummary();
    expect(service.getCurrentSummary()).toBe('Initiating analysis...');
  });

  it('should process a stream chunk and update the summary', () => {
    const onSummaryUpdate = mock((caseId: string, summary: string) => {});
    const service = new SummaryExtractorService(onSummaryUpdate);
    const summary = service.processStreamChunk('test-model', 'new chunk');
    expect(summary).toContain('new chunk');
    expect(service.getCurrentSummary()).toContain('new chunk');
  });

  it('should truncate the summary to prevent it from growing indefinitely', () => {
    const service = new SummaryExtractorService(() => {});
    let summary = '';
    for (let i = 0; i < 20; i++) {
      summary = service.processStreamChunk('test-model', 'a'.repeat(100));
    }
    expect(summary.length).toBeLessThanOrEqual(1000 + 115); // A bit of leeway for model name etc.
    expect(summary.startsWith('...')).toBe(true);
  });

  it('should extract a static summary from full content', async () => {
    const service = new SummaryExtractorService(() => {});
    const fullContent = 'a'.repeat(1000);
    const summary = await service.extractSummary(fullContent);
    expect(summary).toContain('Final Summary:');
    expect(summary.length).toBeLessThan(520);
  });
}); 