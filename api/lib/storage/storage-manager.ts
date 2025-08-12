import { Database } from 'bun:sqlite';
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
  filePath: string;
  createdAt: Date;
  caseId?: string;
  // Encryption metadata (optional for backward compatibility)
  iv?: string; // base64
  authTag?: string; // base64
  isEncrypted?: boolean;
}

export interface StorageConfig {
  dbPath: string;
  artifactsDir: string;
}

export class StorageManager {
  private db: Database;
  private config: StorageConfig;

  constructor(config: StorageConfig) {
    this.config = config;
    
    // Ensure directories exist
    this.ensureDirectories();
    
    // Initialize database
    this.db = new Database(config.dbPath);
    this.db.exec(`PRAGMA journal_mode = WAL;`); // Enable WAL mode for better performance
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
    // Create artifacts table - simplified schema
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS artifacts (
        id TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        hash TEXT NOT NULL,
        file_path TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        case_id TEXT,
        UNIQUE(filename)
      )
    `);

    // Create index for faster lookups
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_artifacts_case_id ON artifacts(case_id)
    `);

    // Ensure encryption columns exist (best-effort migration)
    try {
      this.db.exec(`ALTER TABLE artifacts ADD COLUMN iv TEXT`);
    } catch {}
    try {
      this.db.exec(`ALTER TABLE artifacts ADD COLUMN auth_tag TEXT`);
    } catch {}
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
    const filePath = path.join(this.config.artifactsDir, filename);
    
    // Encrypt file contents using AES-256-GCM
    const { ciphertext, iv, authTag } = this.encryptBuffer(fileBuffer);
    
    // Store encrypted file to filesystem
    await fs.promises.writeFile(filePath, ciphertext);
    
    // Insert metadata into database
    const query = this.db.query(`
      INSERT INTO artifacts (id, filename, original_name, size, mime_type, hash, file_path, case_id, iv, auth_tag)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    query.run(id, filename, originalName, fileBuffer.length, mimeType, hash, filePath, caseId || null, iv, authTag);
    
    return {
      id,
      filename,
      originalName,
      size: fileBuffer.length,
      mimeType,
      hash,
      filePath,
      createdAt: new Date(),
      caseId,
      iv,
      authTag,
      isEncrypted: true
    };
  }

  async getArtifact(id: string): Promise<Artifact | null> {
    const query = this.db.query('SELECT * FROM artifacts WHERE id = ?');
    const row = query.get(id) as any;
    
    if (!row) return null;
    
    return {
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      size: row.size,
      mimeType: row.mime_type,
      hash: row.hash,
      filePath: row.file_path,
      createdAt: new Date(row.created_at),
      caseId: row.case_id,
      iv: row.iv || undefined,
      authTag: row.auth_tag || undefined,
      isEncrypted: !!(row.iv && row.auth_tag)
    };
  }

  async getArtifactData(id: string): Promise<Buffer | null> {
    const artifact = await this.getArtifact(id);
    if (!artifact) return null;
    
    try {
      const data = await fs.promises.readFile(artifact.filePath);
      // Decrypt if encryption metadata present, otherwise return as-is (backward compatibility)
      if (artifact.iv && artifact.authTag) {
        return this.decryptBuffer(data, artifact.iv, artifact.authTag);
      }
      return data;
    } catch (error) {
      console.error('Error reading artifact file:', error);
      return null;
    }
  }

  async listArtifacts(caseId?: string): Promise<Artifact[]> {
    let query;
    let rows;
    
    if (caseId) {
      query = this.db.query('SELECT * FROM artifacts WHERE case_id = ? ORDER BY created_at DESC');
      rows = query.all(caseId);
    } else {
      query = this.db.query('SELECT * FROM artifacts ORDER BY created_at DESC');
      rows = query.all();
    }
    
    return rows.map((row: any) => ({
      id: row.id,
      filename: row.filename,
      originalName: row.original_name,
      size: row.size,
      mimeType: row.mime_type,
      hash: row.hash,
      filePath: row.file_path,
      createdAt: new Date(row.created_at),
      caseId: row.case_id,
      isEncrypted: !!(row.iv && row.auth_tag)
    }));
  }

  async deleteArtifact(id: string): Promise<boolean> {
    const artifact = await this.getArtifact(id);
    if (!artifact) return false;
    
    try {
      // Delete the file
      await fs.promises.unlink(artifact.filePath);
    } catch (error) {
      console.error('Error deleting artifact file:', error);
      // Continue with database deletion even if file deletion fails
    }
    
    // Delete from database
    const query = this.db.query('DELETE FROM artifacts WHERE id = ?');
    const result = query.run(id);
    return result.changes > 0;
  }

  private calculateHash(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  private generateId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  private getEncryptionKey(): Buffer {
    const keyHex = process.env.ENCRYPTION_KEY || '';
    if (!keyHex) {
      console.warn('[StorageManager] ENCRYPTION_KEY not set. Generating ephemeral key (NOT FOR PRODUCTION).');
      return crypto.randomBytes(32);
    }
    const key = Buffer.from(keyHex, 'hex');
    if (key.length !== 32) {
      throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters) for AES-256-GCM');
    }
    return key;
  }

  private encryptBuffer(plaintext: Buffer): { ciphertext: Buffer; iv: string; authTag: string } {
    const key = this.getEncryptionKey();
    const ivBuf = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, ivBuf);
    const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return { ciphertext, iv: ivBuf.toString('base64'), authTag: authTag.toString('base64') };
  }

  private decryptBuffer(ciphertext: Buffer, ivB64: string, authTagB64: string): Buffer {
    const key = this.getEncryptionKey();
    const iv = Buffer.from(ivB64, 'base64');
    const authTag = Buffer.from(authTagB64, 'base64');
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  }

  close(): void {
    this.db.close();
  }
} 