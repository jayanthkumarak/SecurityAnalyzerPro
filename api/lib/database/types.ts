// Database Types and Interfaces for SecurityAnalyzer Pro
// Enterprise-grade forensic data management

export type CaseStatus = 'active' | 'suspended' | 'closed' | 'archived';
export type CaseType = 'incident' | 'investigation' | 'compliance' | 'training';
export type CasePriority = 'critical' | 'high' | 'medium' | 'low';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type EvidenceType = 'prefetch' | 'evtx' | 'registry' | 'memory' | 'network' | 'unknown';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Core case interface
export interface Case {
  id: string;
  case_number: string;
  title: string;
  description?: string;
  case_type: CaseType;
  priority: CasePriority;
  status: CaseStatus;

  // Organizational data
  organization?: string;
  investigator_id?: string;
  supervisor_id?: string;
  department?: string;

  // Legal and compliance
  legal_hold: boolean;
  retention_class: string;
  classification: DataClassification;

  // Timestamps
  incident_date?: Date;
  created_at: Date;
  updated_at: Date;
  closed_at?: Date;
  archived_at?: Date;

  // Retention management
  retention_expires?: Date;
  auto_purge_eligible: boolean;
  purge_approval_required: boolean;

  // Chain of custody
  custody_chain: CustodyTransfer[];
  integrity_hash: string;
}

// Evidence interface with comprehensive metadata
export interface Evidence {
  id: string;
  case_id: string;
  evidence_number: string;

  // File identification
  original_filename: string;
  original_path: string;
  file_hash_md5: string;
  file_hash_sha256: string;
  file_hash_sha512?: string;
  file_signature: string;

  // File properties
  file_size: number;
  file_type: EvidenceType;
  mime_type?: string;
  file_extension: string;

  // Forensic metadata
  acquisition_method: string;
  acquisition_tool?: string;
  acquisition_hash: string;
  chain_of_custody: CustodyTransfer[];

  // Storage management
  storage_location: string;
  storage_method: string;
  compression_method?: string;
  encryption_key_id: string;

  // Timestamps
  created_at: Date;
  modified_at: Date;
  accessed_at: Date;

  // Processing status
  processing_status: ProcessingStatus;
  analysis_status: ProcessingStatus;
  verification_status: ProcessingStatus;

  // Retention and lifecycle
  retention_class: string;
  auto_purge_eligible: boolean;
  backup_status: string;

  // Relationships
  parent_evidence_id?: string;
  related_evidence_ids: string[];

  // Extracted metadata
  metadata: Record<string, any>;
}

// Analysis results with versioning
export interface AnalysisResult {
  id: string;
  evidence_id: string;
  analysis_type: string;
  analysis_version: string;

  // Analysis metadata
  analyzer_name: string;
  analyzer_version?: string;
  analysis_parameters: Record<string, any>;

  // Results
  raw_results: Record<string, any>;
  processed_results: Record<string, any>;
  confidence_score: number;
  risk_score: number;

  // Classification and tagging
  threat_indicators: string[];
  mitre_techniques: string[];
  analysis_tags: string[];

  // Quality assurance
  validated: boolean;
  validator_id?: string;
  validation_notes?: string;
  false_positive: boolean;

  // Timestamps
  analysis_started?: Date;
  analysis_completed: Date;
  created_at: Date;

  // Retention
  retention_class: string;
  auto_purge_eligible: boolean;
}

// Audit trail interface
export interface AuditEvent {
  id: string;
  event_id: string;

  // Event classification
  event_type: string;
  action: string;
  resource_type?: string;
  resource_id?: string;

  // Actor information
  user_id?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;

  // Event details
  event_details: Record<string, any>;
  before_state?: Record<string, any>;
  after_state?: Record<string, any>;

  // Context
  correlation_id?: string;
  parent_event_id?: string;

  // Compliance and legal
  legal_hold_applicable: boolean;
  retention_required: boolean;
  compliance_flags: Record<string, any>;

  // Integrity
  event_hash: string;
  previous_hash?: string;
  signature?: string;

  // Timestamps
  event_timestamp: Date;
  recorded_timestamp: Date;
}

// Custody transfer tracking
export interface CustodyTransfer {
  from_user: string;
  to_user: string;
  timestamp: Date;
  reason: string;
  location: string;
  signature_hash: string;
}

// Request/Response interfaces
export interface CreateCaseRequest {
  case_number: string;
  title: string;
  description?: string;
  case_type: CaseType;
  priority: CasePriority;
  classification: DataClassification;
  investigator_id?: string;
  incident_date?: Date;
}

export interface CreateEvidenceRequest {
  case_id: string;
  original_filename: string;
  original_path: string;
  file_type: EvidenceType;
  acquisition_method: string;
  acquisition_tool?: string;
  metadata?: Record<string, any>;
}

export interface FileValidationResult {
  valid: boolean;
  file_type: EvidenceType;
  mime_type: string;
  file_signature: string;
  security_issues: string[];
  metadata: Record<string, any>;
}

export interface FileMetadata {
  basic: {
    size: number;
    created: Date;
    modified: Date;
    accessed: Date;
    permissions: string;
  };
  hashes: {
    md5: string;
    sha256: string;
    sha512: string;
  };
  forensic: {
    signature: string;
    entropy: number;
    strings_count: number;
    suspicious_indicators: string[];
  };
  timestamps: {
    birth_time?: Date;
    change_time?: Date;
    access_time?: Date;
    modify_time?: Date;
  };
}

// Retention policy interfaces
export interface RetentionPolicy {
  class_name: string;
  retention_period: string;
  legal_hold_default: boolean;
  auto_purge_allowed: boolean;
  approval_required: boolean;
  compliance_requirements: string[];
}

export interface PurgeCandidate {
  id: string;
  type: 'case' | 'evidence' | 'analysis';
  case_id?: string;
  retention_expires: Date;
  auto_approval_allowed: boolean;
  legal_hold_active: boolean;
  approval_status: 'pending' | 'approved' | 'denied';
  purge_reason: string;
}

// Backup interfaces
export interface BackupMetadata {
  backup_id: string;
  backup_type: 'continuous' | 'incremental' | 'full' | 'archive';
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  created_at: Date;
  size: number;
  encryption_key_id: string;
  integrity_hash: string;
  storage_location: string;
  retention_expires?: Date;
  immutable: boolean;
}

// Operation context for audit logging
export interface OperationContext {
  user_id?: string;
  session_id: string;
  ip_address?: string;
  user_agent?: string;
  correlation_id?: string;
  operation_type: string;
  resource_type: string;
  resource_id?: string;
}

// Database operation interface
export interface DatabaseOperation {
  type: 'create' | 'read' | 'update' | 'delete';
  table: string;
  data?: any;
  where?: Record<string, any>;
  options?: Record<string, any>;
}

export interface CaseFilters {
  status?: CaseStatus[];
  case_type?: CaseType[];
  priority?: CasePriority[];
  investigator_id?: string;
  classification?: DataClassification[];
  created_after?: Date;
  created_before?: Date;
  legal_hold?: boolean;
}

export interface EvidenceFilters {
  case_id?: string;
  file_type?: EvidenceType[];
  processing_status?: ProcessingStatus[];
  size_min?: number;
  size_max?: number;
  created_after?: Date;
  created_before?: Date;
}

// Security enhancements for Session 3
export type SecurityLevel = 'low' | 'medium' | 'high' | 'critical';
export type AuthenticationMethod = 'password' | 'certificate' | 'biometric' | 'token';
export type UserRole = 'admin' | 'investigator' | 'analyst' | 'viewer' | 'auditor';
export type Permission = 
  | 'case:create' | 'case:read' | 'case:update' | 'case:delete' 
  | 'evidence:create' | 'evidence:read' | 'evidence:update' | 'evidence:delete'
  | 'analysis:create' | 'analysis:read' | 'analysis:update' | 'analysis:delete'
  | 'audit:read' | 'audit:export' | 'system:configure' | 'user:manage';

export interface SecurityContext {
  user_id: string;
  username: string;
  roles: UserRole[];
  permissions: Permission[];
  security_level: SecurityLevel;
  authentication_method: AuthenticationMethod;
  session_id: string;
  session_expires: Date;
  ip_address?: string;
  user_agent?: string;
  last_activity: Date;
  mfa_verified: boolean;
  account_locked: boolean;
  failed_login_attempts: number;
}

export interface SecurityPolicy {
  resource_type: string;
  operation: string;
  required_permissions: Permission[];
  minimum_security_level: SecurityLevel;
  required_roles: UserRole[];
  audit_required: boolean;
  approval_required: boolean;
  rate_limit?: number;
  time_restrictions?: {
    allowed_hours: number[];
    allowed_days: number[];
  };
}

export interface SecurityIncident {
  id: string;
  incident_type: 'authentication_failure' | 'authorization_violation' | 'data_breach' | 'suspicious_activity' | 'policy_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  session_id?: string;
  resource_type?: string;
  resource_id?: string;
  details: Record<string, any>;
  threat_indicators: string[];
  mitigation_actions: string[];
  status: 'open' | 'investigating' | 'resolved' | 'false_positive';
  created_at: Date;
  updated_at: Date;
  assigned_to?: string;
  escalated: boolean;
}

export interface SessionData {
  session_id: string;
  user_id: string;
  created_at: Date;
  last_activity: Date;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  security_context: SecurityContext;
  active: boolean;
  terminated_reason?: string;
  terminated_at?: Date;
}
