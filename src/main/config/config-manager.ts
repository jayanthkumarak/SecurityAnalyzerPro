import Store from 'electron-store';

export type Schema = {
  claudeApiKey: string;
  analysisDepth: 'standard' | 'deep';
  encryptionEnabled: boolean;
  auditLogging: boolean;
  appVersion: string;
};

export class ConfigManager {
  private store: Store<Schema>;

  constructor() {
    this.store = new Store<Schema>({
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

  get<K extends keyof Schema>(key: K): Schema[K] {
    return this.store.get(key);
  }

  set<K extends keyof Schema>(key: K, value: Schema[K]): void {
    this.store.set(key, value);
  }

  has(key: keyof Schema): boolean {
    return this.store.has(key);
  }

  delete(key: keyof Schema): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): Schema {
    return this.store.store;
  }
}
