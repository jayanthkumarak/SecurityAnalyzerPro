import { app } from 'electron';
import * as crypto from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  SecurityContext,
  SecurityPolicy,
  SecurityIncident,
  SessionData,
  UserRole,
  Permission,
  SecurityLevel,
  AuthenticationMethod,
} from '../database/types';

export interface EncryptedData {
  encrypted: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export class SecurityManager {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly KEY_LENGTH = 32;
  private static readonly SESSION_TIMEOUT = 8 * 60 * 60 * 1000; // 8 hours
  
  private encryptionKey: Buffer | null = null;
  private keyFilePath: string;
  private activeSessions: Map<string, SessionData> = new Map();
  private securityPolicies: Map<string, SecurityPolicy> = new Map();
  private securityIncidents: SecurityIncident[] = [];
  private sessionCleanupTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.keyFilePath = path.join(app.getPath('userData'), 'security', 'master.key');
    this.initializeSecurityPolicies();
    this.startSessionCleanup();
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
    const cipher = crypto.createCipheriv(
      SecurityManager.ALGORITHM,
      this.encryptionKey,
      iv
    ) as crypto.CipherGCM;
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
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      this.encryptionKey,
      iv
    ) as crypto.DecipherGCM;

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
      .replace(/\/Users\/[^/]+/g, '/Users/<USER>')
      .replace(/\\AppData\\Local\\[^\\]+/g, '\\AppData\\Local\\<APP>')
      .replace(/\/Library\/Application Support\/[^/]+/g, '/Library/Application Support/<APP>');
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
    // Clear session cleanup timer
    if (this.sessionCleanupTimer) {
      clearInterval(this.sessionCleanupTimer);
      this.sessionCleanupTimer = null;
    }

    // Clear active sessions
    this.activeSessions.clear();

    // Clear sensitive data from memory
    if (this.encryptionKey) {
      this.encryptionKey.fill(0);
      this.encryptionKey = null;
    }
  }

  // Session Management
  async createSession(userId: string, username: string, roles: UserRole[], authMethod: AuthenticationMethod): Promise<SecurityContext> {
    const sessionId = crypto.randomUUID();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SecurityManager.SESSION_TIMEOUT);

    const permissions = this.calculatePermissions(roles);
    const securityLevel = this.calculateSecurityLevel(roles);

    const securityContext: SecurityContext = {
      user_id: userId,
      username,
      roles,
      permissions,
      security_level: securityLevel,
      authentication_method: authMethod,
      session_id: sessionId,
      session_expires: expiresAt,
      last_activity: now,
      mfa_verified: false,
      account_locked: false,
      failed_login_attempts: 0,
    };

    const sessionData: SessionData = {
      session_id: sessionId,
      user_id: userId,
      created_at: now,
      last_activity: now,
      expires_at: expiresAt,
      security_context: securityContext,
      active: true,
    };

    this.activeSessions.set(sessionId, sessionData);
    return securityContext;
  }

  async validateSession(sessionId: string): Promise<SecurityContext | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.active) {
      return null;
    }

    const now = new Date();
    if (now > session.expires_at) {
      await this.terminateSession(sessionId, 'expired');
      return null;
    }

    // Update last activity
    session.last_activity = now;
    session.security_context.last_activity = now;
    
    return session.security_context;
  }

  async terminateSession(sessionId: string, reason: string): Promise<void> {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.active = false;
      session.terminated_reason = reason;
      session.terminated_at = new Date();
      this.activeSessions.delete(sessionId);
    }
  }

  async refreshSession(sessionId: string): Promise<SecurityContext | null> {
    const session = this.activeSessions.get(sessionId);
    if (!session || !session.active) {
      return null;
    }

    const now = new Date();
    session.expires_at = new Date(now.getTime() + SecurityManager.SESSION_TIMEOUT);
    session.last_activity = now;
    session.security_context.session_expires = session.expires_at;
    session.security_context.last_activity = now;

    return session.security_context;
  }

  // Role-Based Access Control
  async checkPermission(context: SecurityContext, resource: string, operation: string): Promise<boolean> {
    const policyKey = `${resource}:${operation}`;
    const policy = this.securityPolicies.get(policyKey);

    if (!policy) {
      // Default deny if no policy exists
      await this.createSecurityIncident({
        incident_type: 'policy_violation',
        severity: 'medium',
        user_id: context.user_id,
        session_id: context.session_id,
        resource_type: resource,
        details: { operation, reason: 'No policy defined' },
        threat_indicators: ['missing_policy'],
        mitigation_actions: ['policy_review'],
      });
      return false;
    }

    // Check security level
    if (this.compareSecurityLevel(context.security_level, policy.minimum_security_level) < 0) {
      await this.createSecurityIncident({
        incident_type: 'authorization_violation',
        severity: 'high',
        user_id: context.user_id,
        session_id: context.session_id,
        resource_type: resource,
        details: { operation, required_level: policy.minimum_security_level, user_level: context.security_level },
        threat_indicators: ['insufficient_security_level'],
        mitigation_actions: ['escalate_to_admin'],
      });
      return false;
    }

    // Check permissions
    const hasPermission = policy.required_permissions.every(perm => context.permissions.includes(perm));
    if (!hasPermission) {
      await this.createSecurityIncident({
        incident_type: 'authorization_violation',
        severity: 'medium',
        user_id: context.user_id,
        session_id: context.session_id,
        resource_type: resource,
        details: { operation, required_permissions: policy.required_permissions, user_permissions: context.permissions },
        threat_indicators: ['insufficient_permissions'],
        mitigation_actions: ['access_review'],
      });
      return false;
    }

    // Check roles
    const hasRole = policy.required_roles.some(role => context.roles.includes(role));
    if (!hasRole) {
      await this.createSecurityIncident({
        incident_type: 'authorization_violation',
        severity: 'medium',
        user_id: context.user_id,
        session_id: context.session_id,
        resource_type: resource,
        details: { operation, required_roles: policy.required_roles, user_roles: context.roles },
        threat_indicators: ['insufficient_roles'],
        mitigation_actions: ['role_assignment_review'],
      });
      return false;
    }

    return true;
  }

  // Security Incident Management
  async createSecurityIncident(incident: Omit<SecurityIncident, 'id' | 'created_at' | 'updated_at' | 'status' | 'escalated'>): Promise<SecurityIncident> {
    const securityIncident: SecurityIncident = {
      id: crypto.randomUUID(),
      ...incident,
      status: 'open',
      created_at: new Date(),
      updated_at: new Date(),
      escalated: incident.severity === 'critical',
    };

    this.securityIncidents.push(securityIncident);
    
    // Auto-escalate critical incidents
    if (securityIncident.severity === 'critical') {
      console.warn('CRITICAL SECURITY INCIDENT:', securityIncident);
    }

    return securityIncident;
  }

  // Private helper methods
  private initializeSecurityPolicies(): void {
    // Case management policies
    this.securityPolicies.set('case:create', {
      resource_type: 'case',
      operation: 'create',
      required_permissions: ['case:create'],
      minimum_security_level: 'medium',
      required_roles: ['investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    this.securityPolicies.set('case:read', {
      resource_type: 'case',
      operation: 'read',
      required_permissions: ['case:read'],
      minimum_security_level: 'low',
      required_roles: ['viewer', 'analyst', 'investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    this.securityPolicies.set('case:update', {
      resource_type: 'case',
      operation: 'update',
      required_permissions: ['case:update'],
      minimum_security_level: 'medium',
      required_roles: ['investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    this.securityPolicies.set('case:delete', {
      resource_type: 'case',
      operation: 'delete',
      required_permissions: ['case:delete'],
      minimum_security_level: 'high',
      required_roles: ['admin'],
      audit_required: true,
      approval_required: true,
    });

    // Evidence management policies
    this.securityPolicies.set('evidence:create', {
      resource_type: 'evidence',
      operation: 'create',
      required_permissions: ['evidence:create'],
      minimum_security_level: 'medium',
      required_roles: ['investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    this.securityPolicies.set('evidence:read', {
      resource_type: 'evidence',
      operation: 'read',
      required_permissions: ['evidence:read'],
      minimum_security_level: 'low',
      required_roles: ['viewer', 'analyst', 'investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    // Analysis policies
    this.securityPolicies.set('analysis:create', {
      resource_type: 'analysis',
      operation: 'create',
      required_permissions: ['analysis:create'],
      minimum_security_level: 'medium',
      required_roles: ['analyst', 'investigator', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    // Audit policies
    this.securityPolicies.set('audit:read', {
      resource_type: 'audit',
      operation: 'read',
      required_permissions: ['audit:read'],
      minimum_security_level: 'high',
      required_roles: ['auditor', 'admin'],
      audit_required: true,
      approval_required: false,
    });

    this.securityPolicies.set('audit:create', {
      resource_type: 'audit',
      operation: 'create',
      required_permissions: [], // System-level action, no specific permission needed
      minimum_security_level: 'low',
      required_roles: ['admin', 'investigator', 'analyst', 'viewer', 'auditor'],
      audit_required: false, // Prevents recursive audit loops
      approval_required: false,
    });

    this.securityPolicies.set('audit:export', {
      resource_type: 'audit',
      operation: 'export',
      required_permissions: ['audit:export'],
      minimum_security_level: 'high',
      required_roles: ['auditor', 'admin'],
      audit_required: true,
      approval_required: true,
    });
  }

  private calculatePermissions(roles: UserRole[]): Permission[] {
    const permissions: Permission[] = [];
    
    roles.forEach(role => {
      switch (role) {
        case 'admin':
          permissions.push(...([
            'case:create', 'case:read', 'case:update', 'case:delete',
            'evidence:create', 'evidence:read', 'evidence:update', 'evidence:delete',
            'analysis:create', 'analysis:read', 'analysis:update', 'analysis:delete',
            'audit:read', 'audit:export', 'system:configure', 'user:manage'
          ] as Permission[]));
          break;
        case 'investigator':
          permissions.push(...([
            'case:create', 'case:read', 'case:update',
            'evidence:create', 'evidence:read', 'evidence:update',
            'analysis:create', 'analysis:read', 'analysis:update'
          ] as Permission[]));
          break;
        case 'analyst':
          permissions.push(...([
            'case:read', 'evidence:read',
            'analysis:create', 'analysis:read', 'analysis:update'
          ] as Permission[]));
          break;
        case 'auditor':
          permissions.push(...([
            'case:read', 'evidence:read', 'analysis:read',
            'audit:read', 'audit:export'
          ] as Permission[]));
          break;
        case 'viewer':
          permissions.push(...(['case:read', 'evidence:read', 'analysis:read'] as Permission[]));
          break;
      }
    });

    return [...new Set(permissions)]; // Remove duplicates
  }

  private calculateSecurityLevel(roles: UserRole[]): SecurityLevel {
    if (roles.includes('admin')) return 'critical';
    if (roles.includes('investigator') || roles.includes('auditor')) return 'high';
    if (roles.includes('analyst')) return 'medium';
    return 'low';
  }

  private compareSecurityLevel(level1: SecurityLevel, level2: SecurityLevel): number {
    const levels = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
    return levels[level1] - levels[level2];
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    this.sessionCleanupTimer = setInterval(() => {
      const now = new Date();
      for (const [sessionId, session] of this.activeSessions) {
        if (now > session.expires_at) {
          this.terminateSession(sessionId, 'expired');
        }
      }
    }, 5 * 60 * 1000);
  }

  // Getters for monitoring
  getActiveSessionCount(): number {
    return this.activeSessions.size;
  }

  getSecurityIncidents(): SecurityIncident[] {
    return [...this.securityIncidents];
  }

  getSecurityIncidentsByType(type: SecurityIncident['incident_type']): SecurityIncident[] {
    return this.securityIncidents.filter(incident => incident.incident_type === type);
  }
}
