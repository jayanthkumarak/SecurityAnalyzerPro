import * as crypto from 'crypto';
import { SecurityContext, SecurityIncident } from '../database/types';

export interface SecurityError {
  id: string;
  error_type: 'authentication' | 'authorization' | 'validation' | 'system' | 'security' | 'data_integrity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  sanitized_message: string;
  stack_trace: string;
  context: {
    user_id?: string;
    session_id?: string;
    resource_type?: string;
    resource_id?: string;
    operation?: string;
    ip_address?: string;
  };
  threat_indicators: string[];
  mitigation_actions: string[];
  correlation_id: string;
  timestamp: Date;
  escalated: boolean;
}

export interface ErrorPattern {
  pattern: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  indicators: string[];
  auto_mitigate: boolean;
  mitigation_actions: string[];
}

export class SecurityAwareErrorHandler {
  private errorHistory: SecurityError[] = [];
  private suspiciousPatterns: Map<string, ErrorPattern> = new Map();
  private errorCorrelations: Map<string, SecurityError[]> = new Map();
  private maxHistorySize = 10000;

  constructor() {
    this.initializeThreatPatterns();
  }

  async handleError(
    error: Error,
    context: Partial<SecurityContext>,
    operationContext?: {
      resource_type?: string;
      resource_id?: string;
      operation?: string;
    }
  ): Promise<SecurityError> {
    const errorId = crypto.randomUUID();
    const correlationId = crypto.randomUUID();
    
    // Sanitize error message
    const sanitizedMessage = this.sanitizeErrorMessage(error.message);
    
    // Determine error type and severity
    const errorType = this.classifyError(error, operationContext);
    const severity = this.calculateSeverity(error, errorType, context);
    
    // Analyze for threat indicators
    const threatIndicators = this.analyzeThreatIndicators(error, context, operationContext);
    
    // Generate mitigation actions
    const mitigationActions = this.generateMitigationActions(errorType, severity, threatIndicators);
    
    const errorContext: SecurityError['context'] = {};
    if (context.user_id) errorContext.user_id = context.user_id;
    if (context.session_id) errorContext.session_id = context.session_id;
    if (operationContext?.resource_type) errorContext.resource_type = operationContext.resource_type;
    if (operationContext?.resource_id) errorContext.resource_id = operationContext.resource_id;
    if (operationContext?.operation) errorContext.operation = operationContext.operation;
    if (context.ip_address) errorContext.ip_address = context.ip_address;

    const securityError: SecurityError = {
      id: errorId,
      error_type: errorType,
      severity,
      message: error.message,
      sanitized_message: sanitizedMessage,
      stack_trace: this.sanitizeStackTrace(error.stack),
      context: errorContext,
      threat_indicators: threatIndicators,
      mitigation_actions: mitigationActions,
      correlation_id: correlationId,
      timestamp: new Date(),
      escalated: severity === 'critical',
    };

    // Store error for analysis
    this.storeError(securityError);
    
    // Perform correlation analysis
    await this.performCorrelationAnalysis(securityError);
    
    // Auto-escalate if critical
    if (severity === 'critical') {
      await this.escalateError(securityError);
    }
    
    // Apply automatic mitigations
    await this.applyAutoMitigations(securityError);
    
    return securityError;
  }

  async detectAnomalousPatterns(): Promise<SecurityIncident[]> {
    const incidents: SecurityIncident[] = [];
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    
    // Analyze recent errors for patterns
    const recentErrors = this.errorHistory.filter(
      error => (now.getTime() - error.timestamp.getTime()) < oneHour
    );
    
    // Check for authentication failure patterns
    const authFailures = recentErrors.filter(e => e.error_type === 'authentication');
    if (authFailures.length > 10) {
      incidents.push({
        id: crypto.randomUUID(),
        incident_type: 'authentication_failure',
        severity: 'high',
        details: { failure_count: authFailures.length, time_window: '1_hour' },
        threat_indicators: ['authentication_flood', 'potential_brute_force'],
        mitigation_actions: ['rate_limit_enforcement', 'account_lockout'],
        status: 'open',
        created_at: now,
        updated_at: now,
        escalated: true,
      });
    }
    
    // Check for authorization violation patterns
    const authzViolations = recentErrors.filter(e => e.error_type === 'authorization');
    if (authzViolations.length > 5) {
      incidents.push({
        id: crypto.randomUUID(),
        incident_type: 'authorization_violation',
        severity: 'medium',
        details: { violation_count: authzViolations.length, time_window: '1_hour' },
        threat_indicators: ['privilege_escalation_attempt', 'unauthorized_access'],
        mitigation_actions: ['enhanced_monitoring', 'access_review'],
        status: 'open',
        created_at: now,
        updated_at: now,
        escalated: false,
      });
    }
    
    // Check for data integrity issues
    const dataIntegrityErrors = recentErrors.filter(e => e.error_type === 'data_integrity');
    if (dataIntegrityErrors.length > 3) {
      incidents.push({
        id: crypto.randomUUID(),
        incident_type: 'data_breach',
        severity: 'critical',
        details: { integrity_violations: dataIntegrityErrors.length, time_window: '1_hour' },
        threat_indicators: ['data_corruption', 'tampering_detected'],
        mitigation_actions: ['immediate_investigation', 'data_isolation', 'backup_verification'],
        status: 'open',
        created_at: now,
        updated_at: now,
        escalated: true,
      });
    }
    
    return incidents;
  }

  getErrorStatistics(): {
    total_errors: number;
    errors_by_type: Record<string, number>;
    errors_by_severity: Record<string, number>;
    recent_errors: number;
    escalated_errors: number;
  } {
    const now = new Date();
    const oneHour = 60 * 60 * 1000;
    const recentErrors = this.errorHistory.filter(
      error => (now.getTime() - error.timestamp.getTime()) < oneHour
    );

    return {
      total_errors: this.errorHistory.length,
      errors_by_type: this.groupBy(this.errorHistory, 'error_type'),
      errors_by_severity: this.groupBy(this.errorHistory, 'severity'),
      recent_errors: recentErrors.length,
      escalated_errors: this.errorHistory.filter(e => e.escalated).length,
    };
  }

  // Private helper methods
  private sanitizeErrorMessage(message: string): string {
    // Remove sensitive information from error messages
    let sanitized = message;
    
    // Remove file paths
    sanitized = sanitized.replace(/[C-Z]:\\[^\\s]+/g, '<FILE_PATH>');
    sanitized = sanitized.replace(/\/[^\\s]+/g, '<FILE_PATH>');
    
    // Remove IP addresses
    sanitized = sanitized.replace(/\\b(?:[0-9]{1,3}\\.){3}[0-9]{1,3}\\b/g, '<IP_ADDRESS>');
    
    // Remove user IDs and session IDs
    sanitized = sanitized.replace(/user[_-]?id[\\s:=]+[^\\s]+/gi, 'user_id=<REDACTED>');
    sanitized = sanitized.replace(/session[_-]?id[\\s:=]+[^\\s]+/gi, 'session_id=<REDACTED>');
    
    // Remove SQL fragments
    sanitized = sanitized.replace(/SELECT\\s+.*?FROM\\s+\\w+/gi, '<SQL_QUERY>');
    sanitized = sanitized.replace(/INSERT\\s+INTO\\s+\\w+/gi, '<SQL_QUERY>');
    sanitized = sanitized.replace(/UPDATE\\s+\\w+\\s+SET/gi, '<SQL_QUERY>');
    sanitized = sanitized.replace(/DELETE\\s+FROM\\s+\\w+/gi, '<SQL_QUERY>');
    
    return sanitized;
  }

  private sanitizeStackTrace(stackTrace?: string): string {
    if (!stackTrace) return '';
    
    // Remove sensitive file paths from stack trace
    let sanitized = stackTrace;
    sanitized = sanitized.replace(/[C-Z]:\\[^\\s\\)]+/g, '<PATH>');
    sanitized = sanitized.replace(/\/[^\\s\\)]+/g, '<PATH>');
    
    return sanitized;
  }

  private classifyError(
    error: Error,
    _operationContext?: { resource_type?: string; operation?: string }
  ): SecurityError['error_type'] {
    const message = error.message.toLowerCase();
    
    if (message.includes('authentication') || message.includes('login') || message.includes('credential')) {
      return 'authentication';
    }
    
    if (message.includes('authorization') || message.includes('permission') || message.includes('access denied')) {
      return 'authorization';
    }
    
    if (message.includes('validation') || message.includes('invalid') || message.includes('malformed')) {
      return 'validation';
    }
    
    if (message.includes('integrity') || message.includes('hash') || message.includes('checksum') || message.includes('tamper')) {
      return 'data_integrity';
    }
    
    if (message.includes('security') || message.includes('threat') || message.includes('suspicious')) {
      return 'security';
    }
    
    return 'system';
  }

  private calculateSeverity(
    error: Error,
    errorType: SecurityError['error_type'],
    context: Partial<SecurityContext>
  ): SecurityError['severity'] {
    const message = error.message.toLowerCase();
    
    // Critical severity conditions
    if (
      errorType === 'data_integrity' ||
      message.includes('critical') ||
      message.includes('security breach') ||
      message.includes('unauthorized access to admin')
    ) {
      return 'critical';
    }
    
    // High severity conditions
    if (
      errorType === 'authorization' ||
      errorType === 'security' ||
      message.includes('failed login attempts') ||
      context.security_level === 'critical'
    ) {
      return 'high';
    }
    
    // Medium severity conditions
    if (
      errorType === 'authentication' ||
      errorType === 'validation' ||
      context.security_level === 'high'
    ) {
      return 'medium';
    }
    
    return 'low';
  }

  private analyzeThreatIndicators(
    error: Error,
    context: Partial<SecurityContext>,
    _operationContext?: { resource_type?: string; operation?: string }
  ): string[] {
    const indicators: string[] = [];
    const message = error.message.toLowerCase();
    
    // Authentication threats
    if (message.includes('invalid credentials')) indicators.push('credential_stuffing');
    if (message.includes('account locked')) indicators.push('brute_force_attempt');
    if (message.includes('session expired')) indicators.push('session_hijacking');
    
    // Authorization threats
    if (message.includes('access denied')) indicators.push('privilege_escalation');
    if (message.includes('insufficient permissions')) indicators.push('unauthorized_access');
    
    // Data integrity threats
    if (message.includes('hash mismatch')) indicators.push('data_tampering');
    if (message.includes('integrity check failed')) indicators.push('corruption_detected');
    
    // System threats
    if (message.includes('sql injection')) indicators.push('sql_injection');
    if (message.includes('path traversal')) indicators.push('path_traversal');
    if (message.includes('buffer overflow')) indicators.push('buffer_overflow');
    
    // Context-based indicators
    if (context.failed_login_attempts && context.failed_login_attempts > 3) {
      indicators.push('repeated_failure');
    }
    
    if (context.account_locked) {
      indicators.push('locked_account_access');
    }
    
    return indicators;
  }

  private generateMitigationActions(
    errorType: SecurityError['error_type'],
    severity: SecurityError['severity'],
    threatIndicators: string[]
  ): string[] {
    const actions: string[] = [];
    
    // Type-specific mitigations
    switch (errorType) {
      case 'authentication':
        actions.push('rate_limit_enforcement', 'account_monitoring');
        if (severity === 'high' || severity === 'critical') {
          actions.push('temporary_account_lock');
        }
        break;
        
      case 'authorization':
        actions.push('access_review', 'privilege_audit');
        if (severity === 'critical') {
          actions.push('immediate_access_revocation');
        }
        break;
        
      case 'data_integrity':
        actions.push('data_verification', 'backup_comparison');
        if (severity === 'critical') {
          actions.push('immediate_quarantine', 'forensic_analysis');
        }
        break;
        
      case 'security':
        actions.push('security_scan', 'threat_assessment');
        if (severity === 'critical') {
          actions.push('incident_response_activation');
        }
        break;
    }
    
    // Threat-specific mitigations
    if (threatIndicators.includes('brute_force_attempt')) {
      actions.push('ip_blocking', 'rate_limiting');
    }
    
    if (threatIndicators.includes('sql_injection')) {
      actions.push('input_sanitization', 'query_parameterization');
    }
    
    if (threatIndicators.includes('data_tampering')) {
      actions.push('integrity_verification', 'audit_trail_review');
    }
    
    return [...new Set(actions)]; // Remove duplicates
  }

  private storeError(error: SecurityError): void {
    this.errorHistory.push(error);
    
    // Maintain history size limit
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private async performCorrelationAnalysis(error: SecurityError): Promise<void> {
    const correlationKey = error.context.user_id || error.context.ip_address || 'unknown';
    
    if (!this.errorCorrelations.has(correlationKey)) {
      this.errorCorrelations.set(correlationKey, []);
    }
    
    const correlatedErrors = this.errorCorrelations.get(correlationKey)!;
    correlatedErrors.push(error);
    
    // Keep only recent correlations (last hour)
    const oneHour = 60 * 60 * 1000;
    const now = new Date();
    this.errorCorrelations.set(
      correlationKey,
      correlatedErrors.filter(e => (now.getTime() - e.timestamp.getTime()) < oneHour)
    );
  }

  private async escalateError(error: SecurityError): Promise<void> {
    console.error('CRITICAL SECURITY ERROR ESCALATED:', {
      id: error.id,
      type: error.error_type,
      severity: error.severity,
      message: error.sanitized_message,
      context: error.context,
      threats: error.threat_indicators,
    });
    
    // Additional escalation logic would go here
    // (e.g., send alerts, create tickets, notify security team)
  }

  private async applyAutoMitigations(error: SecurityError): Promise<void> {
    for (const action of error.mitigation_actions) {
      try {
        await this.executeMitigationAction(action, error);
      } catch (mitigationError) {
        console.error(`Failed to execute mitigation action ${action}:`, mitigationError);
      }
    }
  }

  private async executeMitigationAction(action: string, error: SecurityError): Promise<void> {
    switch (action) {
      case 'rate_limit_enforcement':
        // Implement rate limiting logic
        console.log(`Applying rate limiting for ${error.context.ip_address}`);
        break;
        
      case 'account_monitoring':
        // Implement enhanced account monitoring
        console.log(`Enhanced monitoring activated for user ${error.context.user_id}`);
        break;
        
      case 'data_verification':
        // Trigger data integrity verification
        console.log(`Data integrity verification triggered for ${error.context.resource_id}`);
        break;
        
      default:
        console.log(`Mitigation action ${action} logged for manual execution`);
    }
  }

  private initializeThreatPatterns(): void {
    this.suspiciousPatterns.set('repeated_auth_failure', {
      pattern: 'Multiple authentication failures from same source',
      threat_level: 'high',
      indicators: ['brute_force_attempt', 'credential_stuffing'],
      auto_mitigate: true,
      mitigation_actions: ['rate_limiting', 'ip_blocking'],
    });
    
    this.suspiciousPatterns.set('privilege_escalation', {
      pattern: 'Repeated authorization failures for elevated resources',
      threat_level: 'critical',
      indicators: ['privilege_escalation', 'unauthorized_access'],
      auto_mitigate: true,
      mitigation_actions: ['access_revocation', 'security_review'],
    });
    
    this.suspiciousPatterns.set('data_integrity_violations', {
      pattern: 'Multiple data integrity check failures',
      threat_level: 'critical',
      indicators: ['data_tampering', 'corruption_detected'],
      auto_mitigate: true,
      mitigation_actions: ['immediate_quarantine', 'forensic_analysis'],
    });
  }

  private groupBy(array: SecurityError[], key: keyof SecurityError): Record<string, number> {
    return array.reduce((result, item) => {
      const group = String(item[key]);
      result[group] = (result[group] || 0) + 1;
      return result;
    }, {} as Record<string, number>);
  }
}