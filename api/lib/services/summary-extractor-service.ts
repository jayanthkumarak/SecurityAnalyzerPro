export class SummaryExtractorService {
    // This service will extract topmost summaries from model streams.
    // It will intelligently select and format key information for the loading screen.
    private currentSummary: string = "Initiating analysis...";
    private onSummaryUpdate: (caseId: string, summary: string) => void;

    constructor(onSummaryUpdate: (caseId: string, summary: string) => void) {
        this.onSummaryUpdate = onSummaryUpdate;
    }

    async extractSummary(fullContent: string): Promise<string> {
        // This method is for static content summarization, potentially for rich reports.
        return `Final Summary: ${fullContent.substring(0, Math.min(fullContent.length, 500))}...`;
    }

    // New method to process chunks and update the live summary
    processStreamChunk(modelName: string, chunk: string): string {
        const newContent = ` ${modelName}: ${chunk}`; // Simple aggregation for now
        this.currentSummary += newContent;
        if (this.currentSummary.length > 1000) {
            this.currentSummary = "..." + this.currentSummary.slice(this.currentSummary.length - 997);
        }
        return this.currentSummary;
    }

    getCurrentSummary(): string {
        return this.currentSummary;
    }

    resetSummary(): void {
        this.currentSummary = "Initiating analysis...";
    }
} 