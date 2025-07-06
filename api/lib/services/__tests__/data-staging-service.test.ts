import { describe, it, expect, mock } from 'bun:test';
import { DataStagingService } from '../data-staging-service';

describe('DataStagingService', () => {
  it('should stage data by writing it to a file', async () => {
    const mockFs = {
      mkdir: mock(async () => {}),
      writeFile: mock(async () => {}),
    };

    const service = new DataStagingService(mockFs as any);
    const modelName = 'test-model';
    const rawContent = 'raw content';
    const summary = 'summary content';

    await service.stageData(modelName, rawContent, summary);

    expect(mockFs.mkdir).toHaveBeenCalledWith(expect.stringContaining('api/data/staged-artifacts'), { recursive: true });
    expect(mockFs.writeFile).toHaveBeenCalledTimes(1);
    
    const writeFileCall = (mockFs.writeFile.mock.calls as any)[0];
    const filePath = writeFileCall[0] as string;
    const fileContent = JSON.parse(writeFileCall[1] as string);

    expect(filePath).toContain(modelName);
    expect(fileContent.model).toBe(modelName);
    expect(fileContent.rawContent).toBe(rawContent);
    expect(fileContent.summary).toBe(summary);
    expect(fileContent.timestamp).toBeDefined();
  });
}); 