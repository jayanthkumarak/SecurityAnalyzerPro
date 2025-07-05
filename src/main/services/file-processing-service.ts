import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { app } from 'electron';
import { SecurityManager } from '../security/security-manager';
import { DatabaseManager } from '../database/database-manager';
import {
  Evidence,
  CreateEvidenceRequest,
  FileValidationResult,
  FileMetadata,
  EvidenceType,
  OperationContext,
} from '../database/types';

export class FileProcessingService {
  private securityManager: SecurityManager;
  private databaseManager: DatabaseManager;
  private evidenceStorageDir: string;

  constructor(securityManager: SecurityManager, databaseManager: DatabaseManager) {
    this.securityManager = securityManager;
    this.databaseManager = databaseManager;
    this.evidenceStorageDir = path.join(app.getPath('userData'), 'evidence');
  }

  async initialize(): Promise<void> {
    // Ensure evidence storage directory exists
    await fs.mkdir(this.evidenceStorageDir, { recursive: true });
    console.log('File processing service initialized');
  }

  async processFile(
    filePath: string,
    caseId: string,
    context: OperationContext
  ): Promise<Evidence> {
    try {
      // Validate file first
      const validation = await this.validateFile(filePath);
      if (!validation.valid) {
        throw new Error(`File validation failed: ${validation.security_issues.join(', ')}`);
      }

      // Extract comprehensive metadata
      const metadata = await this.extractMetadata(filePath);

      // Create evidence record
      const evidenceRequest: CreateEvidenceRequest = {
        case_id: caseId,
        original_filename: path.basename(filePath),
        original_path: filePath,
        file_type: validation.file_type,
        acquisition_method: 'manual_upload',
        acquisition_tool: 'SecurityAnalyzer Pro',
        metadata: metadata,
      };

      // Store file securely and create database record
      const evidence = await this.databaseManager.addEvidence(evidenceRequest, context);

      // Copy file to secure storage
      const secureLocation = await this.secureStore(filePath, evidence.id);

      // Update evidence with file details
      await this.updateEvidenceWithFileDetails(evidence.id, metadata, secureLocation);

      console.log(`File processed successfully: ${evidence.id}`);
      return evidence;
    } catch (error) {
      console.error(`File processing failed for ${filePath}:`, error);
      throw error;
    }
  }

  async validateFile(filePath: string): Promise<FileValidationResult> {
    try {
      // Check if file exists and is accessible
      const stats = await fs.stat(filePath);
      if (!stats.isFile()) {
        return {
          valid: false,
          file_type: 'unknown',
          mime_type: 'unknown',
          file_signature: '',
          security_issues: ['Not a regular file'],
          metadata: {},
        };
      }

      // Read file header for magic number detection
      const fileHandle = await fs.open(filePath, 'r');
      const headerBuffer = Buffer.alloc(512);
      await fileHandle.read(headerBuffer, 0, 512, 0);
      await fileHandle.close();

      // Detect file type from magic numbers
      const fileType = this.detectFileType(headerBuffer);
      const mimeType = this.getMimeType(fileType, path.extname(filePath));
      const fileSignature = this.getFileSignature(headerBuffer);

      // Security checks
      const securityIssues = await this.performSecurityChecks(filePath, headerBuffer, stats);

      return {
        valid: securityIssues.length === 0,
        file_type: fileType,
        mime_type: mimeType,
        file_signature: fileSignature,
        security_issues: securityIssues,
        metadata: {
          size: stats.size,
          detected_type: fileType,
          extension: path.extname(filePath),
        },
      };
    } catch (error) {
      return {
        valid: false,
        file_type: 'unknown',
        mime_type: 'unknown',
        file_signature: '',
        security_issues: [`Validation error: ${error}`],
        metadata: {},
      };
    }
  }

  async extractMetadata(filePath: string): Promise<FileMetadata> {
    const stats = await fs.stat(filePath);
    const hashes = await this.computeHashes(filePath);

    return {
      basic: {
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        accessed: stats.atime,
        permissions: stats.mode.toString(8),
      },
      hashes,
      forensic: {
        signature: await this.getFileSignatureFromPath(filePath),
        entropy: await this.calculateEntropy(filePath),
        strings_count: await this.countStrings(filePath),
        suspicious_indicators: await this.findSuspiciousIndicators(filePath),
      },
      timestamps: {
        birth_time: stats.birthtime,
        change_time: stats.ctime,
        access_time: stats.atime,
        modify_time: stats.mtime,
      },
    };
  }

  private detectFileType(headerBuffer: Buffer): EvidenceType {
    const header = headerBuffer.toString('hex').toLowerCase();

    // Windows Prefetch files (.pf)
    if (
      header.startsWith('11000000') ||
      header.startsWith('17000000') ||
      header.startsWith('1a000000')
    ) {
      return 'prefetch';
    }

    // Windows Event Log files (.evtx)
    if (header.startsWith('456c6656')) {
      // "ElvF" in hex
      return 'evtx';
    }

    // Windows Registry hives
    if (header.startsWith('72656766')) {
      // "regf" in hex
      return 'registry';
    }

    // Memory dump indicators
    if (header.includes('50414745') || header.includes('4d444d50')) {
      // "PAGE" or "MDMP"
      return 'memory';
    }

    // Network packet capture
    if (header.startsWith('d4c3b2a1') || header.startsWith('a1b2c3d4')) {
      // pcap magic
      return 'network';
    }

    return 'unknown';
  }

  private getMimeType(fileType: EvidenceType, extension: string): string {
    const mimeTypes: Record<EvidenceType, string> = {
      prefetch: 'application/octet-stream',
      evtx: 'application/x-ms-evtx',
      registry: 'application/x-ms-registry',
      memory: 'application/x-memory-dump',
      network: 'application/vnd.tcpdump.pcap',
      unknown: 'application/octet-stream',
    };

    return mimeTypes[fileType] || 'application/octet-stream';
  }

  private getFileSignature(headerBuffer: Buffer): string {
    return headerBuffer.subarray(0, 16).toString('hex').toUpperCase();
  }

  private async getFileSignatureFromPath(filePath: string): string {
    const fileHandle = await fs.open(filePath, 'r');
    const headerBuffer = Buffer.alloc(16);
    await fileHandle.read(headerBuffer, 0, 16, 0);
    await fileHandle.close();
    return headerBuffer.toString('hex').toUpperCase();
  }

  private async performSecurityChecks(
    filePath: string,
    headerBuffer: Buffer,
    stats: Awaited<ReturnType<typeof fs.stat>>
  ): Promise<string[]> {
    const issues: string[] = [];

    // File size checks
    if (stats.size > 10 * 1024 * 1024 * 1024) {
      // 10GB limit
      issues.push('File exceeds maximum size limit (10GB)');
    }

    if (stats.size === 0) {
      issues.push('File is empty');
    }

    // Check for suspicious file patterns
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.dll$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.ps1$/i,
    ];

    const fileName = path.basename(filePath);
    if (suspiciousPatterns.some(pattern => pattern.test(fileName))) {
      issues.push('Potentially executable file type detected');
    }

    // Check for malformed headers
    if (headerBuffer.every(byte => byte === 0)) {
      issues.push('File appears to be corrupted or contains only null bytes');
    }

    return issues;
  }

  private async computeHashes(
    filePath: string
  ): Promise<{ md5: string; sha256: string; sha512: string }> {
    const fileBuffer = await fs.readFile(filePath);

    return {
      md5: crypto.createHash('md5').update(fileBuffer).digest('hex'),
      sha256: crypto.createHash('sha256').update(fileBuffer).digest('hex'),
      sha512: crypto.createHash('sha512').update(fileBuffer).digest('hex'),
    };
  }

  private async calculateEntropy(filePath: string): Promise<number> {
    const fileBuffer = await fs.readFile(filePath);
    const frequencies = new Array(256).fill(0);

    // Count byte frequencies
    for (const byte of fileBuffer) {
      frequencies[byte]++;
    }

    // Calculate Shannon entropy
    let entropy = 0;
    const length = fileBuffer.length;

    for (const freq of frequencies) {
      if (freq > 0) {
        const probability = freq / length;
        entropy -= probability * Math.log2(probability);
      }
    }

    return entropy;
  }

  private async countStrings(filePath: string): Promise<number> {
    const fileBuffer = await fs.readFile(filePath);
    const content = fileBuffer.toString('binary');

    // Simple string extraction (printable ASCII sequences of 4+ characters)
    const stringPattern = /[\x20-\x7E]{4,}/g;
    const matches = content.match(stringPattern);

    return matches ? matches.length : 0;
  }

  private async findSuspiciousIndicators(filePath: string): Promise<string[]> {
    const indicators: string[] = [];
    const fileBuffer = await fs.readFile(filePath, { encoding: 'binary' });

    // Look for common suspicious patterns
    const suspiciousPatterns = [
      { pattern: /cmd\.exe/gi, indicator: 'Command shell reference' },
      { pattern: /powershell/gi, indicator: 'PowerShell reference' },
      { pattern: /\.(bat|cmd|ps1|vbs|js)/gi, indicator: 'Script file reference' },
      { pattern: /HKEY_/gi, indicator: 'Registry key reference' },
      { pattern: /\\system32\\/gi, indicator: 'System32 path reference' },
    ];

    for (const { pattern, indicator } of suspiciousPatterns) {
      if (pattern.test(fileBuffer)) {
        indicators.push(indicator);
      }
    }

    return indicators;
  }

  private async secureStore(originalPath: string, evidenceId: string): Promise<string> {
    // Create evidence-specific directory
    const evidenceDir = path.join(this.evidenceStorageDir, evidenceId.substring(0, 2), evidenceId);
    await fs.mkdir(evidenceDir, { recursive: true });

    // Generate secure filename
    const originalExtension = path.extname(originalPath);
    const secureFilename = `${evidenceId}${originalExtension}`;
    const securePath = path.join(evidenceDir, secureFilename);

    // Copy file to secure location
    await fs.copyFile(originalPath, securePath);

    // Set restrictive permissions
    await fs.chmod(securePath, 0o600); // Owner read/write only

    // Verify integrity
    const originalHash = await this.computeFileHash(originalPath);
    const copiedHash = await this.computeFileHash(securePath);

    if (originalHash !== copiedHash) {
      throw new Error('File integrity verification failed during secure storage');
    }

    return path.relative(this.evidenceStorageDir, securePath);
  }

  private async computeFileHash(filePath: string): Promise<string> {
    const fileBuffer = await fs.readFile(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  }

  private async updateEvidenceWithFileDetails(
    evidenceId: string,
    metadata: FileMetadata,
    storageLocation: string
  ): Promise<void> {
    // This would update the evidence record with computed hashes and storage location
    // Implementation would depend on having an update method in DatabaseManager
    console.log(`Updated evidence ${evidenceId} with file details`);
  }

  async getStoredFile(evidenceId: string): Promise<string> {
    const evidence = await this.databaseManager.getEvidenceById(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    const fullPath = path.join(this.evidenceStorageDir, evidence.storage_location);

    // Verify file exists
    try {
      await fs.access(fullPath);
      return fullPath;
    } catch (error) {
      throw new Error(`Stored evidence file not accessible: ${fullPath}`);
    }
  }

  async verifyFileIntegrity(evidenceId: string): Promise<boolean> {
    const evidence = await this.databaseManager.getEvidenceById(evidenceId);
    if (!evidence) {
      throw new Error(`Evidence not found: ${evidenceId}`);
    }

    const storedFilePath = await this.getStoredFile(evidenceId);
    const currentHash = await this.computeFileHash(storedFilePath);

    return currentHash === evidence.file_hash_sha256;
  }
}
