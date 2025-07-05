import Database from 'better-sqlite3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

export interface Artifact {
  id: string;
  filename: string;
  originalName: string;
  size: number;
  mimeType: string;
  hash: string;
  encryptedData: Buffer;
  createdAt: Date;
  caseId?: string;
}

export interface StorageConfig {
  dbPath: string;
  encryptionKey: string;
  artifactsDir: string;
}

export class StorageManager {
  private db: Database.Database;
  private config: StorageConfig;
  private encryptionKey: Buffer;

  constructor(config: StorageConfig) {
    this.config = config;
    this.encryptionKey = Buffer.from(config.encryptionKey, 'hex');
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Initialize database
    this.db = new Database(config.dbPath);
    this.initializeDatabase();
  }

  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.config.dbPath),
      this.config.artifactsDir
    ];

    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private initializeDatabase(): void {
    // Create artifacts table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        hash TEXT NOT NULL,
        encrypted_data BLOB NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        case_id TEXT,
        UNIQUE(filename)
      )
    `);

    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_artifacts_case_id ON artifacts(case_id)
    `);
  }

  async storeArtifact(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    caseId?: string
  ): Promise<Artifact> {
    const id = this.generateId();
    const filename = `${id}_${originalName}`;
    const hash = this.calculateHash(fileBuffer);
    
    // Encrypt the file data
    const encryptedData = this.encrypt(fileBuffer);
    
    // Insert into database
    const stmt = this.db.prepare(`
      INSERT INTO artifacts (id, filename, original_name, size, mime_type, hash, encrypted_data, case_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(id, filename, originalName, fileBuffer.length, mimeType, hash, encryptedData, caseId);
    
    return {
      id,
      filename,
      originalName,
      size: fileBuffer.length,
      mimeType,
      hash,
      encryptedData,
      createdAt: new Date(),
      caseId
    };
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    const stmt = this.db.prepare('SELECT * FROM artifacts WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      size: row.size,
      mimeType: row.mime_type,
      hash: row.hash,
      encryptedData: row.encrypted_data,
      createdAt: new Date(row.created_at),
      caseId: row.case_id
    };
  }

  async getArtifactData(id: string): Promise<Buffer | null> {
    const artifact = await this.getArtifact(id);
    if (!artifact) return null;
    
    return this.decrypt(artifact.encryptedData);
  }

  async listArtifacts(caseId?: string): Promise<Artifact[]> {
    let stmt;
    let rows;
    
    if (caseId) {
      stmt = this.db.prepare('SELECT * FROM artifacts WHERE case_id = ? ORDER BY created_at DESC');
      rows = stmt.all(caseId);
    } else {
      stmt = this.db.prepare('SELECT * FROM artifacts ORDER BY created_at DESC');
      rows = stmt.all();
    }
    
    return rows.map((row: any) => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      size: row.size,
      mimeType: row.mime_type,
      hash: row.hash,
      encryptedData: row.encrypted_data,
      createdAt: new Date(row.created_at),
      caseId: row.case_id
    }));
  }

  async deleteArtifact(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM artifacts WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  private encrypt(data: Buffer): Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-gcm', this.encryptionKey, iv);
    
    const encrypted = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV + encrypted data + auth tag
    return Buffer.concat([iv, encrypted, authTag]);
  }

  private decrypt(encryptedData: Buffer): Buffer {
    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(-16);
    const encrypted = encryptedData.slice(16, -16);
    
    const decipher = crypto.createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
    decipher.setAuthTag(authTag);
    
    return Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  close(): void {
    this.db.close();
  }
} 