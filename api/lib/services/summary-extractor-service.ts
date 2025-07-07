export class SummaryExtractorService {
    // This service will extract topmost summaries from model streams.
    // It will intelligently select and format key information for the loading screen.
    private summaries: Map<string, string> = new Map();
    private onSummaryUpdate: (caseId: string, summary: string) => void;

    constructor(onSummaryUpdate: (caseId: string, summary: string) => void) {
        this.onSummaryUpdate = onSummaryUpdate;
    }

    async extractSummary(fullContent: string): Promise<string> {
        // This method is for static content summarization, potentially for rich reports.
        return `Final Summary: ${fullContent.substring(0, Math.min(fullContent.length, 500))}...`;
    }

    // New method to process chunks and update the live summary
    processStreamChunk(caseId: string, modelName: string, chunk: string): string {
        let current = this.summaries.get(caseId) || "Initiating analysis...";
        const newContent = ` ${modelName}: ${chunk}`;
        current += newContent;
        if (current.length > 1000) {
            current = "..." + current.slice(current.length - 997);
        }
        this.summaries.set(caseId, current);
        return current;
    }

    getCurrentSummary(caseId: string): string {
        return this.summaries.get(caseId) || "Initiating analysis...";
    }

    resetSummary(caseId: string): void {
        this.summaries.set(caseId, "Initiating analysis...");
    }
} 