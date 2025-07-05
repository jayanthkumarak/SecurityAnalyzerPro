import { app } from 'electron';
import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { SecurityManager } from '../security/security-manager';
import {
  Case,
  Evidence,
  AuditEvent,
  CreateCaseRequest,
  CreateEvidenceRequest,
  CaseFilters,
  OperationContext,
  RetentionPolicy,
} from './types';

export class DatabaseManager {
  private primaryDB: Database.Database | null = null;
  private auditDB: Database.Database | null = null;
  private caseDBs: Map<string, Database.Database> = new Map();
  private tempDB: Database.Database | null = null;

  private primaryDBPath: string;
  private auditDBPath: string;
  private caseDBDir: string;
  private securityManager: SecurityManager;
  private retentionPolicies: Map<string, RetentionPolicy> = new Map();

  constructor(securityManager: SecurityManager) {
    this.securityManager = securityManager;
    const userDataPath = app.getPath('userData');

    // Database paths
    this.primaryDBPath = path.join(userDataPath, 'database', 'primary.db');
    this.auditDBPath = path.join(userDataPath, 'audit', 'compliance.db');
    this.caseDBDir = path.join(userDataPath, 'cases');

    // Initialize retention policies
    this.initializeRetentionPolicies();
  }

  async initialize(): Promise<void> {
    try {
      // Ensure directories exist
      await this.ensureDirectories();

      // Initialize all database layers
      await this.initializePrimaryDB();
      await this.initializeAuditDB();
      await this.initializeTempDB();

      console.log('Enterprise database system initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database system:', error);
      throw error;
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [path.dirname(this.primaryDBPath), path.dirname(this.auditDBPath), this.caseDBDir];

    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }
  }

  private async initializePrimaryDB(): Promise<void> {
    this.primaryDB = new Database(this.primaryDBPath);

    // Configure for performance and safety
    this.primaryDB.pragma('journal_mode = WAL');
    this.primaryDB.pragma('foreign_keys = ON');
    this.primaryDB.pragma('synchronous = NORMAL');
    this.primaryDB.pragma('cache_size = 64000');
    this.primaryDB.pragma('temp_store = MEMORY');

    // Create primary database schema
    this.createPrimarySchema();
  }

  private async initializeAuditDB(): Promise<void> {
    this.auditDB = new Database(this.auditDBPath);

    // Configure for integrity and compliance
    this.auditDB.pragma('journal_mode = WAL');
    this.auditDB.pragma('synchronous = FULL');
    this.auditDB.pragma('foreign_keys = ON');

    // Create audit schema
    this.createAuditSchema();
  }

  private async initializeTempDB(): Promise<void> {
    this.tempDB = new Database(':memory:');
    this.tempDB.pragma('foreign_keys = ON');
    this.tempDB.pragma('synchronous = OFF'); // Fast for temp data
  }

  private createPrimarySchema(): void {
    if (!this.primaryDB) throw new Error('Primary database not initialized');

    // Cases table with comprehensive metadata
    this.primaryDB.exec(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        case_number TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        case_type TEXT CHECK (case_type IN ('incident', 'investigation', 'compliance', 'training')),
        priority TEXT CHECK (priority IN ('critical', 'high', 'medium', 'low')),
        status TEXT CHECK (status IN ('active', 'suspended', 'closed', 'archived')),
        
        organization TEXT,
        investigator_id TEXT,
        supervisor_id TEXT,
        department TEXT,
        
        legal_hold BOOLEAN DEFAULT FALSE,
        retention_class TEXT NOT NULL DEFAULT 'standard',
        classification TEXT CHECK (classification IN ('public', 'internal', 'confidential', 'restricted')),
        
        incident_date DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        archived_at DATETIME,
        
        retention_expires DATETIME,
        auto_purge_eligible BOOLEAN DEFAULT FALSE,
        purge_approval_required BOOLEAN DEFAULT TRUE,
        
        encrypted_notes TEXT,
        encrypted_metadata TEXT,
        custody_chain TEXT,
        integrity_hash TEXT NOT NULL
      )
    `);

    // Evidence table with forensic metadata
    this.primaryDB.exec(`
      CREATE TABLE IF NOT EXISTS evidence (
        id TEXT PRIMARY KEY,
        case_id TEXT NOT NULL,
        evidence_number TEXT NOT NULL,
        
        original_filename TEXT NOT NULL,
        original_path TEXT NOT NULL,
        file_hash_md5 TEXT NOT NULL,
        file_hash_sha256 TEXT NOT NULL,
        file_hash_sha512 TEXT,
        file_signature TEXT NOT NULL,
        
        file_size INTEGER NOT NULL CHECK (file_size >= 0),
        file_type TEXT NOT NULL CHECK (file_type IN ('prefetch', 'evtx', 'registry', 'memory', 'network', 'unknown')),
        mime_type TEXT,
        file_extension TEXT,
        
        acquisition_method TEXT NOT NULL,
        acquisition_tool TEXT,
        acquisition_hash TEXT NOT NULL,
        chain_of_custody TEXT,
        
        storage_location TEXT NOT NULL,
        storage_method TEXT DEFAULT 'encrypted_file',
        compression_method TEXT,
        encryption_key_id TEXT NOT NULL,
        
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        processing_status TEXT DEFAULT 'pending',
        analysis_status TEXT DEFAULT 'pending',
        verification_status TEXT DEFAULT 'pending',
        
        retention_class TEXT NOT NULL DEFAULT 'evidence',
        auto_purge_eligible BOOLEAN DEFAULT FALSE,
        backup_status TEXT DEFAULT 'pending',
        
        parent_evidence_id TEXT,
        related_evidence_ids TEXT,
        metadata TEXT,
        
        FOREIGN KEY (case_id) REFERENCES cases (id) ON DELETE CASCADE,
        FOREIGN KEY (parent_evidence_id) REFERENCES evidence (id),
        UNIQUE(case_id, evidence_number)
      )
    `);

    // Analysis results table
    this.primaryDB.exec(`
      CREATE TABLE IF NOT EXISTS analysis_results (
        id TEXT PRIMARY KEY,
        evidence_id TEXT NOT NULL,
        analysis_type TEXT NOT NULL,
        analysis_version TEXT NOT NULL,
        
        analyzer_name TEXT NOT NULL,
        analyzer_version TEXT,
        analysis_parameters TEXT,
        
        raw_results TEXT NOT NULL,
        processed_results TEXT,
        confidence_score REAL CHECK (confidence_score >= 0 AND confidence_score <= 1),
        risk_score REAL CHECK (risk_score >= 0 AND risk_score <= 10),
        
        threat_indicators TEXT,
        mitre_techniques TEXT,
        analysis_tags TEXT,
        
        validated BOOLEAN DEFAULT FALSE,
        validator_id TEXT,
        validation_notes TEXT,
        false_positive BOOLEAN DEFAULT FALSE,
        
        analysis_started DATETIME,
        analysis_completed DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        
        retention_class TEXT NOT NULL DEFAULT 'analysis',
        auto_purge_eligible BOOLEAN DEFAULT FALSE,
        
        FOREIGN KEY (evidence_id) REFERENCES evidence (id) ON DELETE CASCADE
      )
    `);

    // Create performance indices
    this.createIndices();
  }

  private createAuditSchema(): void {
    if (!this.auditDB) throw new Error('Audit database not initialized');

    this.auditDB.exec(`
      CREATE TABLE IF NOT EXISTS audit_trail (
        id TEXT PRIMARY KEY,
        event_id TEXT UNIQUE NOT NULL,
        
        event_type TEXT NOT NULL,
        action TEXT NOT NULL,
        resource_type TEXT,
        resource_id TEXT,
        
        user_id TEXT,
        session_id TEXT,
        ip_address TEXT,
        user_agent TEXT,
        
        event_details TEXT,
        before_state TEXT,
        after_state TEXT,
        
        correlation_id TEXT,
        parent_event_id TEXT,
        
        legal_hold_applicable BOOLEAN DEFAULT FALSE,
        retention_required BOOLEAN DEFAULT TRUE,
        compliance_flags TEXT,
        
        event_hash TEXT NOT NULL,
        previous_hash TEXT,
        signature TEXT,
        
        event_timestamp DATETIME NOT NULL,
        recorded_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create audit indices
    this.auditDB.exec(`
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_trail(event_timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_trail(resource_type, resource_id);
      CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_trail(user_id);
      CREATE INDEX IF NOT EXISTS idx_audit_correlation ON audit_trail(correlation_id);
    `);
  }

  private createIndices(): void {
    if (!this.primaryDB) return;

    this.primaryDB.exec(`
      CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
      CREATE INDEX IF NOT EXISTS idx_cases_investigator ON cases(investigator_id);
      CREATE INDEX IF NOT EXISTS idx_cases_retention ON cases(retention_expires);
      
      CREATE INDEX IF NOT EXISTS idx_evidence_case ON evidence(case_id);
      CREATE INDEX IF NOT EXISTS idx_evidence_type ON evidence(file_type);
      CREATE INDEX IF NOT EXISTS idx_evidence_hash ON evidence(file_hash_sha256);
      CREATE INDEX IF NOT EXISTS idx_evidence_status ON evidence(processing_status);
      
      CREATE INDEX IF NOT EXISTS idx_analysis_evidence ON analysis_results(evidence_id);
      CREATE INDEX IF NOT EXISTS idx_analysis_type ON analysis_results(analysis_type);
      CREATE INDEX IF NOT EXISTS idx_analysis_confidence ON analysis_results(confidence_score);
    `);
  }

  private initializeRetentionPolicies(): void {
    this.retentionPolicies.set('criminal_case', {
      class_name: 'criminal_case',
      retention_period: '7_years',
      legal_hold_default: true,
      auto_purge_allowed: false,
      approval_required: true,
      compliance_requirements: ['legal_hold', 'chain_of_custody'],
    });

    this.retentionPolicies.set('civil_case', {
      class_name: 'civil_case',
      retention_period: '3_years',
      legal_hold_default: false,
      auto_purge_allowed: false,
      approval_required: true,
      compliance_requirements: ['data_protection'],
    });

    this.retentionPolicies.set('security_incident', {
      class_name: 'security_incident',
      retention_period: '2_years',
      legal_hold_default: false,
      auto_purge_allowed: true,
      approval_required: false,
      compliance_requirements: ['incident_response'],
    });

    this.retentionPolicies.set('training', {
      class_name: 'training',
      retention_period: '1_year',
      legal_hold_default: false,
      auto_purge_allowed: true,
      approval_required: false,
      compliance_requirements: [],
    });
  }

  // Case Management Operations
  async createCase(request: CreateCaseRequest, context: OperationContext): Promise<Case> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const id = this.generateId('case');
    const now = new Date();
    const retentionPolicy =
      this.retentionPolicies.get(request.case_type) ||
      this.retentionPolicies.get('security_incident')!;

    const retentionExpires = this.calculateRetentionExpiry(retentionPolicy.retention_period);
    const custodyChain = [
      {
        from_user: 'system',
        to_user: context.user_id || 'unknown',
        timestamp: now,
        reason: 'case_creation',
        location: 'system',
        signature_hash: crypto.randomBytes(32).toString('hex'),
      },
    ];

    const recordToInsert = {
      id,
      case_number: request.case_number,
      title: request.title,
      description: request.description ?? null,
      case_type: request.case_type,
      priority: request.priority,
      classification: request.classification,
      investigator_id: request.investigator_id ?? null,
      incident_date: request.incident_date?.toISOString() ?? null,
      retention_class: request.case_type,
      legal_hold: retentionPolicy.legal_hold_default ? 1 : 0,
      retention_expires: retentionExpires.toISOString(),
      auto_purge_eligible: retentionPolicy.auto_purge_allowed ? 1 : 0,
      purge_approval_required: retentionPolicy.approval_required ? 1 : 0,
      custody_chain: JSON.stringify(custodyChain),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      status: 'active',
    };
    
    const integrityHash = this.calculateIntegrityHash(recordToInsert);

    const stmt = this.primaryDB.prepare(`
      INSERT INTO cases (
        id, case_number, title, description, case_type, priority, classification,
        investigator_id, incident_date, retention_class, legal_hold,
        retention_expires, auto_purge_eligible, purge_approval_required,
        custody_chain, integrity_hash, created_at, updated_at, status
      ) VALUES (
        @id, @case_number, @title, @description, @case_type, @priority, @classification,
        @investigator_id, @incident_date, @retention_class, @legal_hold,
        @retention_expires, @auto_purge_eligible, @purge_approval_required,
        @custody_chain, @integrity_hash, @created_at, @updated_at, @status
      )
    `);

    stmt.run({ ...recordToInsert, integrity_hash: integrityHash });

    // Log case creation
    await this.logAuditEvent(
      {
        event_type: 'data_creation',
        action: 'create_case',
        resource_type: 'case',
        resource_id: id,
        event_details: { case_number: request.case_number, case_type: request.case_type },
      },
      context
    );

    return this.getCaseById(id) as Promise<Case>;
  }

  async getCaseById(id: string): Promise<Case | null> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const stmt = this.primaryDB.prepare('SELECT * FROM cases WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return this.mapRowToCase(row as Record<string, any>);
  }

  async getCases(filters?: CaseFilters): Promise<Case[]> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    let query = 'SELECT * FROM cases';
    const params: any[] = [];
    const conditions: string[] = [];

    if (filters) {
      if (filters.status?.length) {
        conditions.push(`status IN (${filters.status.map(() => '?').join(',')})`);
        params.push(...filters.status);
      }
      if (filters.case_type?.length) {
        conditions.push(`case_type IN (${filters.case_type.map(() => '?').join(',')})`);
        params.push(...filters.case_type);
      }
      if (filters.investigator_id) {
        conditions.push('investigator_id = ?');
        params.push(filters.investigator_id);
      }
      if (filters.created_after) {
        conditions.push('created_at >= ?');
        params.push(filters.created_after.toISOString());
      }
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' ORDER BY created_at DESC';

    const stmt = this.primaryDB.prepare(query);
    const rows = stmt.all(...params) as Record<string, any>[];

    return rows.map(row => this.mapRowToCase(row));
  }

  // Evidence Management
  async addEvidence(request: CreateEvidenceRequest, context: OperationContext): Promise<Evidence> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const id = this.generateId('evidence');
    const evidenceNumber = await this.getNextEvidenceNumber(request.case_id);
    const now = new Date();

    // Generate encryption key for this evidence
    const encryptionKeyId = await this.securityManager.generateSecureRandomId();

    const stmt = this.primaryDB.prepare(`
      INSERT INTO evidence (
        id, case_id, evidence_number, original_filename, original_path,
        file_type, acquisition_method, acquisition_tool, encryption_key_id,
        created_at, modified_at, accessed_at, retention_class
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      request.case_id,
      evidenceNumber,
      request.original_filename,
      request.original_path,
      request.file_type,
      request.acquisition_method,
      request.acquisition_tool,
      encryptionKeyId,
      now.toISOString(),
      now.toISOString(),
      now.toISOString(),
      'evidence'
    );

    await this.logAuditEvent(
      {
        event_type: 'data_creation',
        action: 'add_evidence',
        resource_type: 'evidence',
        resource_id: id,
        event_details: { case_id: request.case_id, filename: request.original_filename },
      },
      context
    );

    return this.getEvidenceById(id) as Promise<Evidence>;
  }

  async getEvidenceById(id: string): Promise<Evidence | null> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const stmt = this.primaryDB.prepare('SELECT * FROM evidence WHERE id = ?');
    const row = stmt.get(id);

    if (!row) return null;

    return this.mapRowToEvidence(row as Record<string, any>);
  }

  async getEvidenceByCase(caseId: string): Promise<Evidence[]> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const stmt = this.primaryDB.prepare(
      'SELECT * FROM evidence WHERE case_id = ? ORDER BY evidence_number'
    );
    const rows = stmt.all(caseId) as Record<string, any>[];

    return rows.map(row => this.mapRowToEvidence(row));
  }

  // Audit logging
  async logAuditEvent(event: Partial<AuditEvent>, context: OperationContext): Promise<void> {
    if (!this.auditDB) throw new Error('Audit database not initialized');

    const eventId = crypto.randomUUID();
    const now = new Date();

    const eventData = {
      id: this.generateId('audit'),
      event_id: eventId,
      event_type: event.event_type || 'system_action',
      action: event.action || 'unknown',
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      user_id: context.user_id,
      session_id: context.session_id,
      ip_address: context.ip_address,
      user_agent: context.user_agent,
      event_details: JSON.stringify(event.event_details || {}),
      correlation_id: context.correlation_id,
      event_timestamp: now.toISOString(),
      recorded_timestamp: now.toISOString(),
      legal_hold_applicable: false,
      retention_required: true,
    };

    const eventHash = this.calculateEventHash(eventData);

    const stmt = this.auditDB.prepare(`
      INSERT INTO audit_trail (
        id, event_id, event_type, action, resource_type, resource_id,
        user_id, session_id, ip_address, user_agent, event_details,
        correlation_id, event_timestamp, recorded_timestamp,
        legal_hold_applicable, retention_required, event_hash
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      eventData.id,
      eventData.event_id,
      eventData.event_type,
      eventData.action,
      eventData.resource_type,
      eventData.resource_id,
      eventData.user_id,
      eventData.session_id,
      eventData.ip_address,
      eventData.user_agent,
      eventData.event_details,
      eventData.correlation_id,
      eventData.event_timestamp,
      eventData.recorded_timestamp,
      eventData.legal_hold_applicable ? 1 : 0,
      eventData.retention_required ? 1 : 0,
      eventHash
    );
  }

  // Utility methods
  private generateId(prefix: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `${prefix}_${timestamp}_${random}`;
  }

  private async getNextEvidenceNumber(caseId: string): Promise<string> {
    if (!this.primaryDB) throw new Error('Database not initialized');

    const stmt = this.primaryDB.prepare(`
      SELECT COUNT(*) as count FROM evidence WHERE case_id = ?
    `);
    const result = stmt.get(caseId) as { count: number };
    const nextNumber = (result.count + 1).toString().padStart(4, '0');
    return `E${nextNumber}`;
  }

  private calculateRetentionExpiry(period: string): Date {
    const now = new Date();
    switch (period) {
      case '1_year':
        return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      case '2_years':
        return new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
      case '3_years':
        return new Date(now.getFullYear() + 3, now.getMonth(), now.getDate());
      case '5_years':
        return new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
      case '7_years':
        return new Date(now.getFullYear() + 7, now.getMonth(), now.getDate());
      default:
        return new Date(now.getFullYear() + 2, now.getMonth(), now.getDate());
    }
  }

  private calculateIntegrityHash(data: any): string {
    const content = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private calculateEventHash(event: any): string {
    const content = JSON.stringify(event, Object.keys(event).sort());
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  private mapRowToCase(row: Record<string, any>): Case {
    return {
      id: row['id'],
      case_number: row['case_number'],
      title: row['title'],
      description: row['description'] ?? undefined,
      case_type: row['case_type'],
      priority: row['priority'],
      status: row['status'],
      organization: row['organization'] ?? undefined,
      investigator_id: row['investigator_id'] ?? undefined,
      supervisor_id: row['supervisor_id'] ?? undefined,
      department: row['department'] ?? undefined,
      legal_hold: Boolean(row['legal_hold']),
      retention_class: row['retention_class'],
      classification: row['classification'],
      incident_date: row['incident_date'] ? new Date(row['incident_date']) : undefined,
      created_at: new Date(row['created_at']),
      updated_at: new Date(row['updated_at']),
      closed_at: row['closed_at'] ? new Date(row['closed_at']) : undefined,
      archived_at: row['archived_at'] ? new Date(row['archived_at']) : undefined,
      retention_expires: row['retention_expires'] ? new Date(row['retention_expires']) : undefined,
      auto_purge_eligible: Boolean(row['auto_purge_eligible']),
      purge_approval_required: Boolean(row['purge_approval_required']),
      custody_chain: row['custody_chain'] ? JSON.parse(row['custody_chain']) : [],
      integrity_hash: row['integrity_hash'],
    } as any as Case;
  }

  private mapRowToEvidence(row: Record<string, any>): Evidence {
    return {
      id: row['id'],
      case_id: row['case_id'],
      evidence_number: row['evidence_number'],
      original_filename: row['original_filename'],
      original_path: row['original_path'],
      file_hash_md5: row['file_hash_md5'] || '',
      file_hash_sha256: row['file_hash_sha256'] || '',
      file_hash_sha512: row['file_hash_sha512'] ?? undefined,
      file_signature: row['file_signature'] || '',
      file_size: row['file_size'] || 0,
      file_type: row['file_type'],
      mime_type: row['mime_type'] ?? undefined,
      file_extension: row['file_extension'] || '',
      acquisition_method: row['acquisition_method'],
      acquisition_tool: row['acquisition_tool'] ?? undefined,
      acquisition_hash: row['acquisition_hash'] || '',
      chain_of_custody: row['chain_of_custody'] ? JSON.parse(row['chain_of_custody']) : [],
      storage_location: row['storage_location'] || '',
      storage_method: row['storage_method'] || 'encrypted_file',
      compression_method: row['compression_method'] ?? undefined,
      encryption_key_id: row['encryption_key_id'] || '',
      created_at: new Date(row['created_at']),
      modified_at: new Date(row['modified_at']),
      accessed_at: new Date(row['accessed_at']),
      processing_status: row['processing_status'] || 'pending',
      analysis_status: row['analysis_status'] || 'pending',
      verification_status: row['verification_status'] || 'pending',
      retention_class: row['retention_class'] || 'evidence',
      auto_purge_eligible: Boolean(row['auto_purge_eligible']),
      backup_status: row['backup_status'] || 'pending',
      parent_evidence_id: row['parent_evidence_id'] ?? undefined,
      related_evidence_ids: row['related_evidence_ids'] ? JSON.parse(row['related_evidence_ids']) : [],
      metadata: row['metadata'] ? JSON.parse(row['metadata']) : {},
    } as any as Evidence;
  }

  async close(): Promise<void> {
    if (this.primaryDB) {
      this.primaryDB.close();
      this.primaryDB = null;
    }

    if (this.auditDB) {
      this.auditDB.close();
      this.auditDB = null;
    }

    if (this.tempDB) {
      this.tempDB.close();
      this.tempDB = null;
    }

    // Close all case databases
    for (const db of this.caseDBs.values()) {
      db.close();
    }
    this.caseDBs.clear();
  }
}
