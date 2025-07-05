import Store from 'electron-store';

export class ConfigManager {
  private store: Store;

  constructor() {
    this.store = new Store({
      name: 'security-analyzer-config',
      defaults: {
        claudeApiKey: '',
        analysisDepth: 'standard',
        encryptionEnabled: true,
        auditLogging: true,
        appVersion: '0.1.0',
      },
    });
  }

  get(key: string): any {
    return this.store.get(key);
  }

  set(key: string, value: any): void {
    this.store.set(key, value);
  }

  has(key: string): boolean {
    return this.store.has(key);
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): Record<string, any> {
    return this.store.store;
  }
}
