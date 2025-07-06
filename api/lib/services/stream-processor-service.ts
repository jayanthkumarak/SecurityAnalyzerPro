import { SummaryExtractorService } from './summary-extractor-service';
import { DataStagingService } from './data-staging-service';

export class StreamProcessorService {
    private summaryExtractorService: SummaryExtractorService;
    private dataStagingService: DataStagingService;
    private onSummaryUpdate: (caseId: string, summary: string) => void;

    constructor(onSummaryUpdate: (caseId: string, summary: string) => void) {
        this.onSummaryUpdate = onSummaryUpdate;
        this.summaryExtractorService = new SummaryExtractorService(onSummaryUpdate);
        this.dataStagingService = new DataStagingService();
    }

    // This service will be responsible for intercepting raw model outputs
    // and passing them to other services for summarization and staging.

    // This method will handle full, non-streaming model outputs
    async processStaticOutput(modelName: string, rawContent: string, caseId: string): Promise<void> {
        console.log(`[StreamProcessor] Processing static output from ${modelName}:`, rawContent.substring(0, 100) + '...');
        try {
            const summary = await this.summaryExtractorService.extractSummary(rawContent);
            console.log(`[StreamProcessor] Extracted summary:`, summary);
            this.onSummaryUpdate(caseId, summary);
            await this.dataStagingService.stageData(modelName, rawContent, summary);
        } catch (error) {
            console.error(`[StreamProcessor] Error processing static output for ${modelName}:`, error);
            // Do not re-throw, allow other analyses to continue
        }
    }

    // This method will handle chunks from streaming model outputs
    async processStreamChunk(modelName: string, chunk: string, caseId: string): Promise<void> {
        const currentSummary = this.summaryExtractorService.processStreamChunk(modelName, chunk);
        this.onSummaryUpdate(caseId, currentSummary);
        console.log(`[StreamProcessor] Processing stream chunk from ${modelName}:`, chunk.substring(0, 50) + '...');
    }
} 