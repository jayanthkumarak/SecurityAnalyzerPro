import { describe, it, expect, mock } from 'bun:test';
import { StreamProcessorService } from '../stream-processor-service';
import { SummaryExtractorService } from '../summary-extractor-service';
import { DataStagingService } from '../data-staging-service';

describe('StreamProcessorService', () => {
  it('should process static output and trigger summary extraction', async () => {
    // Mock dependencies
    const onSummaryUpdate = mock((caseId: string, summary: string) => {});
    const summaryExtractor = new SummaryExtractorService(onSummaryUpdate);
    summaryExtractor.extractSummary = mock(async (content: string) => `Summary: ${content.substring(0, 10)}`);
    
    const dataStaging = new DataStagingService();
    dataStaging.stageData = mock(async (modelName: string, rawContent: string, summary: string) => {});

    const streamProcessor = new StreamProcessorService(onSummaryUpdate);
    // @ts-ignore - for testing private properties
    streamProcessor.summaryExtractorService = summaryExtractor;
    // @ts-ignore
    streamProcessor.dataStagingService = dataStaging;

    const modelName = 'test-model';
    const rawContent = 'This is the full raw content of the analysis.';
    const caseId = 'test-case-1';

    await streamProcessor.processStaticOutput(modelName, rawContent, caseId);

    expect(summaryExtractor.extractSummary).toHaveBeenCalledWith(rawContent);
    expect(dataStaging.stageData).toHaveBeenCalled();
    const stagedData = (dataStaging.stageData as any).mock.calls[0];
    expect(stagedData[0]).toBe(modelName);
    expect(stagedData[1]).toBe(rawContent);
    expect(stagedData[2]).toContain('Summary:');
  });

  it('should process stream chunks and update summaries incrementally', async () => {
    const onSummaryUpdate = mock((caseId: string, summary: string) => {});
    const summaryExtractor = new SummaryExtractorService(onSummaryUpdate);
    summaryExtractor.processStreamChunk = mock((modelName: string, chunk: string) => `Updated summary with ${chunk}`);
    
    const dataStaging = new DataStagingService();
    dataStaging.stageData = mock(async () => {});

    const streamProcessor = new StreamProcessorService(onSummaryUpdate);
    // @ts-ignore
    streamProcessor.summaryExtractorService = summaryExtractor;
    // @ts-ignore
    streamProcessor.dataStagingService = dataStaging;

    const modelName = 'stream-model';
    const caseId = 'test-case-stream';

    await streamProcessor.processStreamChunk(modelName, 'chunk1', caseId);
    await streamProcessor.processStreamChunk(modelName, 'chunk2', caseId);

    expect(summaryExtractor.processStreamChunk).toHaveBeenCalledTimes(2);
    expect(summaryExtractor.processStreamChunk).toHaveBeenCalledWith(modelName, 'chunk1');
    expect(summaryExtractor.processStreamChunk).toHaveBeenCalledWith(modelName, 'chunk2');
    expect(onSummaryUpdate).toHaveBeenCalledTimes(2);
  });
}); 