import fs from 'fs/promises';
import path from 'path';

export class DataStagingService {
    // This service will store and process complete model outputs.
    // It will act as an intermediary before generating rich media reports.
    private fs: typeof fs;

    constructor(fsModule: typeof fs = fs) {
        this.fs = fsModule;
    }

    async stageData(modelName: string, rawContent: string, summary: string): Promise<void> {
        console.log(`[DataStaging] Staging data for ${modelName}. Summary: ${summary.substring(0, 50)}...`);
        try {
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const filename = `${modelName.replace('/', '_')}-${timestamp}.json`;
            const dirPath = path.join(process.cwd(), 'api', 'data', 'staged-artifacts');
            const filePath = path.join(dirPath, filename);

            await this.fs.mkdir(dirPath, { recursive: true });

            const dataToStore = {
                model: modelName,
                timestamp: new Date().toISOString(),
                rawContent,
                summary
            };

            await this.fs.writeFile(filePath, JSON.stringify(dataToStore, null, 2));
            console.log(`[DataStaging] Successfully staged data to ${filePath}`);
        } catch (error) {
            console.error(`[DataStaging] Error staging data for ${modelName}:`, error);
        }
    }
} 