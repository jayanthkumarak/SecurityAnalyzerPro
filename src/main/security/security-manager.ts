import { app } from 'electron';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export class SecurityManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private encryptionKey: Buffer | null = null;
  private keyFilePath: string;

  constructor() {
    this.keyFilePath = path.join(app.getPath('userData'), 'security', 'master.key');
  }

  async initialize(): Promise<void> {
    try {
      // Ensure security directory exists
      const securityDir = path.dirname(this.keyFilePath);
      await fs.mkdir(securityDir, { recursive: true });

      // Load or generate encryption key
      await this.loadOrGenerateEncryptionKey();
      
      console.log('Security manager initialized successfully');
    } catch (error) {
      console.error('Failed to initialize security manager:', error);
      throw error;
    }
  }

  private async loadOrGenerateEncryptionKey(): Promise<void> {
    try {
      // Try to load existing key
      const keyData = await fs.readFile(this.keyFilePath);
      this.encryptionKey = Buffer.from(keyData.toString(), 'hex');
    } catch (error) {
      // Generate new key if file doesn't exist
      console.log('Generating new encryption key...');
      this.encryptionKey = crypto.randomBytes(SecurityManager.KEY_LENGTH);
      
      // Save the key securely
      await fs.writeFile(
        this.keyFilePath, 
        this.encryptionKey.toString('hex'),
        { mode: 0o600 } // Owner read/write only
      );
    }
  }

  encrypt(data: string): EncryptedData {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipherGCM(SecurityManager.ALGORITHM, this.encryptionKey, iv);
    cipher.setAAD(Buffer.from('SecurityAnalyzer'));

    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex'),
      algorithm: SecurityManager.ALGORITHM,
    };
  }

  decrypt(encryptedData: EncryptedData): string {
    if (!this.encryptionKey) {
      throw new Error('Encryption key not initialized');
    }

    const iv = Buffer.from(encryptedData.iv, 'hex');
    const decipher = crypto.createDecipherGCM(
      encryptedData.algorithm,
      this.encryptionKey,
      iv
    );

    decipher.setAAD(Buffer.from('SecurityAnalyzer'));
    decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }

  sanitizeForAnalysis(data: any): any {
    // Remove or hash sensitive information before sending to AI
    const sanitized = JSON.parse(JSON.stringify(data));

    // Recursively sanitize object properties
    return this.sanitizeObject(sanitized);
  }

  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(obj)) {
      // Sanitize file paths
      if (key.toLowerCase().includes('path') && typeof value === 'string') {
        sanitized[key] = this.sanitizeFilePath(value);
      }
      // Sanitize user names
      else if (key.toLowerCase().includes('user') && typeof value === 'string') {
        sanitized[key] = this.hashSensitiveData(value);
      }
      // Sanitize IP addresses
      else if (key.toLowerCase().includes('ip') && typeof value === 'string') {
        sanitized[key] = this.sanitizeIPAddress(value);
      }
      // Recursively sanitize nested objects
      else if (typeof value === 'object') {
        sanitized[key] = this.sanitizeObject(value);
      }
      // Keep other values as-is
      else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private sanitizeFilePath(filePath: string): string {
    // Replace user-specific paths with generic placeholders
    return filePath
      .replace(/C:\\Users\\[^\\]+/g, 'C:\\Users\\<USER>')
      .replace(/\/Users\/[^\/]+/g, '/Users/<USER>')
      .replace(/\\AppData\\Local\\[^\\]+/g, '\\AppData\\Local\\<APP>')
      .replace(/\/Library\/Application Support\/[^\/]+/g, '/Library/Application Support/<APP>');
  }

  private sanitizeIPAddress(ip: string): string {
    // Replace last octet with XXX for IPv4 addresses
    const ipv4Regex = /^(\d{1,3}\.\d{1,3}\.\d{1,3}\.)\d{1,3}$/;
    const match = ip.match(ipv4Regex);
    
    if (match) {
      return `${match[1]}XXX`;
    }
    
    // For IPv6 or other formats, just indicate it's an IP
    return '<IP_ADDRESS>';
  }

  private hashSensitiveData(data: string): string {
    // Create a deterministic but non-reversible hash
    const hash = crypto.createHash('sha256');
    hash.update(data + 'SecurityAnalyzer');
    return `<HASH_${hash.digest('hex').substring(0, 8)}>`;
  }

  generateSecureRandomId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  async validateFileIntegrity(filePath: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(fileBuffer);
      return hash.digest('hex');
    } catch (error) {
      throw new Error(`Failed to validate file integrity: ${error}`);
    }
  }

  async cleanup(): Promise<void> {
    // Clear sensitive data from memory
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }
  }
}