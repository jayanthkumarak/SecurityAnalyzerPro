import * as crypto from 'crypto';
import { EventEmitter } from 'events';
import { SecurityManager } from './security-manager';
import { SecurityAwareErrorHandler } from './error-handler';
import { AuditService } from '../services/audit-service';
import {
  SecurityContext,
  AuditEvent,
} from '../database/types';

export interface ThreatSignature {
  id: string;
  name: string;
  pattern: string | RegExp;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  indicators: string[];
  mitigation_actions: string[];
  enabled: boolean;
  created_at: Date;
  last_triggered?: Date;
  trigger_count: number;
}

export interface SecurityAlert {
  id: string;
  alert_type: 'threat_detected' | 'anomaly_detected' | 'policy_violation' | 'system_compromise';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  source_event?: AuditEvent;
  threat_signature?: ThreatSignature;
  indicators: string[];
  affected_resources: string[];
  recommended_actions: string[];
  created_at: Date;
  resolved_at?: Date;
  resolved_by?: string;
  resolution_notes?: string;
  escalated: boolean;
  auto_mitigated: boolean;
}

export interface MonitoringRule {
  id: string;
  name: string;
  description: string;
  condition: string; // SQL-like condition or pattern
  threshold?: number;
  time_window_minutes?: number;
  enabled: boolean;
  alert_severity: SecurityAlert['severity'];
  auto_mitigation: boolean;
  mitigation_actions: string[];
}

export interface SecurityMetrics {
  timestamp: Date;
  active_sessions: number;
  failed_authentications_last_hour: number;
  security_incidents_last_24h: number;
  data_access_events_last_hour: number;
  threat_detection_rate: number;
  system_health_score: number;
  compliance_score: number;
}

export class SecurityEventMonitor extends EventEmitter {
  private securityManager: SecurityManager;
  private errorHandler: SecurityAwareErrorHandler;
  private auditService: AuditService;
  
  private threatSignatures: Map<string, ThreatSignature> = new Map();
  private monitoringRules: Map<string, MonitoringRule> = new Map();
  private activeAlerts: Map<string, SecurityAlert> = new Map();
  private securityMetrics: SecurityMetrics[] = [];
  
  private monitoringActive = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private metricsInterval: NodeJS.Timeout | null = null;
  
  private readonly MAX_METRICS_HISTORY = 24 * 60; // 24 hours of minute-by-minute data
  private readonly MONITORING_INTERVAL_MS = 30000; // 30 seconds
  private readonly METRICS_INTERVAL_MS = 60000; // 1 minute

  constructor(
    securityManager: SecurityManager,
    errorHandler: SecurityAwareErrorHandler,
    auditService: AuditService
  ) {
    super();
    this.securityManager = securityManager;
    this.errorHandler = errorHandler;
    this.auditService = auditService;
    
    this.initializeThreatSignatures();
    this.initializeMonitoringRules();
  }

  async start(): Promise<void> {
    if (this.monitoringActive) {
      console.warn('Security monitoring is already active');
      return;
    }

    try {
      console.log('Starting security event monitoring...');
      
      this.monitoringActive = true;
      
      // Start main monitoring loop
      this.monitoringInterval = setInterval(() => {
        this.performSecurityMonitoring().catch(error => {
          console.error('Security monitoring error:', error);
        });
      }, this.MONITORING_INTERVAL_MS);

      // Start metrics collection
      this.metricsInterval = setInterval(() => {
        this.collectSecurityMetrics().catch(error => {
          console.error('Metrics collection error:', error);
        });
      }, this.METRICS_INTERVAL_MS);

      // Emit monitoring started event
      this.emit('monitoring_started');
      
      console.log('Security event monitoring started successfully');
    } catch (error) {
      console.error('Failed to start security monitoring:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.monitoringActive) {
      return;
    }

    console.log('Stopping security event monitoring...');
    
    this.monitoringActive = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    this.emit('monitoring_stopped');
    console.log('Security event monitoring stopped');
  }

  async analyzeEvent(event: AuditEvent, context: SecurityContext): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    try {
      // Check against threat signatures
      for (const signature of this.threatSignatures.values()) {
        if (!signature.enabled) continue;
        
        if (await this.matchesThreatSignature(event, signature)) {
          const alert = await this.createThreatAlert(event, signature, context);
          alerts.push(alert);
          
          // Update signature statistics
          signature.last_triggered = new Date();
          signature.trigger_count++;
        }
      }

      // Check against monitoring rules
      for (const rule of this.monitoringRules.values()) {
        if (!rule.enabled) continue;
        
        if (await this.matchesMonitoringRule(event, rule)) {
          const alert = await this.createRuleAlert(event, rule, context);
          alerts.push(alert);
        }
      }

      // Analyze for behavioral anomalies
      const anomalyAlerts = await this.detectBehavioralAnomalies(event, context);
      alerts.push(...anomalyAlerts);

      // Process alerts
      for (const alert of alerts) {
        await this.processAlert(alert, context);
      }

      return alerts;

    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        { resource_type: 'security_monitor', operation: 'analyze_event' }
      );
      return [];
    }
  }

  async getActiveAlerts(): Promise<SecurityAlert[]> {
    return Array.from(this.activeAlerts.values());
  }

  async getSecurityMetrics(hours = 24): Promise<SecurityMetrics[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.securityMetrics.filter(metric => metric.timestamp >= cutoffTime);
  }

  async resolveAlert(alertId: string, resolvedBy: string, notes: string): Promise<void> {
    const alert = this.activeAlerts.get(alertId);
    if (!alert) {
      throw new Error(`Alert not found: ${alertId}`);
    }

    alert.resolved_at = new Date();
    alert.resolved_by = resolvedBy;
    alert.resolution_notes = notes;

    this.activeAlerts.delete(alertId);
    this.emit('alert_resolved', alert);
  }

  // Private methods
  private async performSecurityMonitoring(): Promise<void> {
    try {
      // Analyze error patterns
      const errorIncidents = await this.errorHandler.detectAnomalousPatterns();
      
      for (const incident of errorIncidents) {
        const alert: SecurityAlert = {
          id: crypto.randomUUID(),
          alert_type: 'anomaly_detected',
          severity: incident.severity,
          title: `Security Incident: ${incident.incident_type}`,
          description: `${incident.incident_type} detected with ${incident.severity} severity`,
          indicators: incident.threat_indicators,
          affected_resources: incident.resource_id ? [incident.resource_id] : [],
          recommended_actions: incident.mitigation_actions,
          created_at: new Date(),
          escalated: incident.escalated,
          auto_mitigated: false,
        };

        this.activeAlerts.set(alert.id, alert);
        this.emit('alert_created', alert);

        if (alert.severity === 'critical') {
          this.emit('critical_alert', alert);
        }
      }

      // Check for session anomalies
      await this.monitorSessionAnomalies();
      
      // Check for data access patterns
      await this.monitorDataAccessPatterns();

    } catch (error) {
      console.error('Security monitoring cycle error:', error);
    }
  }

  private async collectSecurityMetrics(): Promise<void> {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const errorStats = this.errorHandler.getErrorStatistics();
      
      const metrics: SecurityMetrics = {
        timestamp: now,
        active_sessions: this.securityManager.getActiveSessionCount(),
        failed_authentications_last_hour: this.securityManager.getSecurityIncidentsByType('authentication_failure').length,
        security_incidents_last_24h: this.securityManager.getSecurityIncidents().filter(
          i => i.created_at >= oneDayAgo
        ).length,
        data_access_events_last_hour: errorStats.recent_errors,
        threat_detection_rate: this.calculateThreatDetectionRate(),
        system_health_score: this.calculateSystemHealthScore(),
        compliance_score: this.calculateComplianceScore(),
      };

      this.securityMetrics.push(metrics);

      // Maintain metrics history size
      if (this.securityMetrics.length > this.MAX_METRICS_HISTORY) {
        this.securityMetrics = this.securityMetrics.slice(-this.MAX_METRICS_HISTORY);
      }

      this.emit('metrics_collected', metrics);

    } catch (error) {
      console.error('Metrics collection error:', error);
    }
  }

  private async matchesThreatSignature(event: AuditEvent, signature: ThreatSignature): Promise<boolean> {
    const eventText = JSON.stringify(event).toLowerCase();
    
    if (signature.pattern instanceof RegExp) {
      return signature.pattern.test(eventText);
    } else {
      return eventText.includes(signature.pattern.toLowerCase());
    }
  }

  private async matchesMonitoringRule(event: AuditEvent, rule: MonitoringRule): Promise<boolean> {
    // Simplified rule matching - in practice this would be more sophisticated
    const eventText = JSON.stringify(event).toLowerCase();
    return eventText.includes(rule.condition.toLowerCase());
  }

  private async createThreatAlert(
    event: AuditEvent,
    signature: ThreatSignature,
    _context: SecurityContext
  ): Promise<SecurityAlert> {
    return {
      id: crypto.randomUUID(),
      alert_type: 'threat_detected',
      severity: signature.threat_level,
      title: `Threat Detected: ${signature.name}`,
      description: signature.description,
      source_event: event,
      threat_signature: signature,
      indicators: signature.indicators,
      affected_resources: event.resource_id ? [event.resource_id] : [],
      recommended_actions: signature.mitigation_actions,
      created_at: new Date(),
      escalated: signature.threat_level === 'critical',
      auto_mitigated: false,
    };
  }

  private async createRuleAlert(
    event: AuditEvent,
    rule: MonitoringRule,
    _context: SecurityContext
  ): Promise<SecurityAlert> {
    return {
      id: crypto.randomUUID(),
      alert_type: 'policy_violation',
      severity: rule.alert_severity,
      title: `Rule Triggered: ${rule.name}`,
      description: rule.description,
      source_event: event,
      indicators: ['rule_violation'],
      affected_resources: event.resource_id ? [event.resource_id] : [],
      recommended_actions: rule.mitigation_actions,
      created_at: new Date(),
      escalated: rule.alert_severity === 'critical',
      auto_mitigated: rule.auto_mitigation,
    };
  }

  private async detectBehavioralAnomalies(
    event: AuditEvent,
    _context: SecurityContext
  ): Promise<SecurityAlert[]> {
    const alerts: SecurityAlert[] = [];

    // Check for unusual access patterns
    if (event.event_type === 'data_access') {
      const recentAccess = this.securityMetrics.slice(-60); // Last hour
      if (recentAccess.length > 0) {
        const avgAccess =
          recentAccess.reduce((sum, m) => sum + m.data_access_events_last_hour, 0) /
          recentAccess.length;
        const lastAccess = recentAccess[recentAccess.length - 1];

        if (lastAccess && lastAccess.data_access_events_last_hour > avgAccess * 3) {
          alerts.push({
            id: crypto.randomUUID(),
            alert_type: 'anomaly_detected',
            severity: 'medium',
            title: 'Unusual Data Access Pattern',
            description: 'Data access rate significantly higher than normal',
            source_event: event,
            indicators: ['data_access_anomaly'],
            affected_resources: [event.resource_id || 'unknown'],
            recommended_actions: ['investigate_user_activity', 'review_access_logs'],
            created_at: new Date(),
            escalated: false,
            auto_mitigated: false,
          });
        }
      }
    }

    return alerts;
  }

  private async processAlert(alert: SecurityAlert, context: SecurityContext): Promise<void> {
    // Store alert
    this.activeAlerts.set(alert.id, alert);

    // Emit events
    this.emit('alert_created', alert);
    
    if (alert.severity === 'critical') {
      this.emit('critical_alert', alert);
    }

    // Auto-mitigation
    if (alert.auto_mitigated) {
      await this.applyAutoMitigation(alert);
    }

    // Log to audit trail
    await this.auditService.logSecurityEvent({
      event_type: 'security_alert',
      action: 'alert_created',
      resource_type: 'security_alert',
      resource_id: alert.id,
      event_details: {
        alert_type: alert.alert_type,
        severity: alert.severity,
        title: alert.title,
        indicators: alert.indicators,
      },
    }, context);
  }

  private async applyAutoMitigation(alert: SecurityAlert): Promise<void> {
    for (const action of alert.recommended_actions) {
      try {
        await this.executeMitigationAction(action, alert);
      } catch (error) {
        console.error(`Failed to execute mitigation action ${action}:`, error);
      }
    }
  }

  private async executeMitigationAction(action: string, alert: SecurityAlert): Promise<void> {
    switch (action) {
      case 'rate_limit_enforcement':
        console.log(`Applying rate limiting due to alert: ${alert.id}`);
        break;
      case 'account_lockout':
        console.log(`Locking account due to alert: ${alert.id}`);
        break;
      case 'immediate_investigation':
        console.log(`Triggering investigation for alert: ${alert.id}`);
        break;
      default:
        console.log(`Mitigation action ${action} logged for manual execution`);
    }
  }

  private async monitorSessionAnomalies(): Promise<void> {
    // Monitor for unusual session patterns
    const activeSessions = this.securityManager.getActiveSessionCount();
    
    // This is a simplified check - real implementation would be more sophisticated
    if (activeSessions > 100) { // Arbitrary threshold
      const alert: SecurityAlert = {
        id: crypto.randomUUID(),
        alert_type: 'anomaly_detected',
        severity: 'medium',
        title: 'High Session Count',
        description: `Unusually high number of active sessions: ${activeSessions}`,
        indicators: ['session_anomaly'],
        affected_resources: ['session_manager'],
        recommended_actions: ['investigate_sessions', 'check_for_ddos'],
        created_at: new Date(),
        escalated: false,
        auto_mitigated: false,
      };

      this.activeAlerts.set(alert.id, alert);
      this.emit('alert_created', alert);
    }
  }

  private async monitorDataAccessPatterns(): Promise<void> {
    // Monitor for unusual data access patterns
    // This would analyze recent audit events for anomalies
    console.log('Monitoring data access patterns...');
  }

  private calculateThreatDetectionRate(): number {
    const recentMetrics = this.securityMetrics.slice(-60); // Last hour
    if (recentMetrics.length === 0) return 1.0;
    
    const threatsDetected = Array.from(this.activeAlerts.values()).filter(
      alert => alert.created_at >= new Date(Date.now() - 60 * 60 * 1000)
    ).length;
    
    return Math.min(1.0, threatsDetected / Math.max(1, recentMetrics.length));
  }

  private calculateSystemHealthScore(): number {
    const recentErrors = this.errorHandler.getErrorStatistics().recent_errors;
    const activeSessions = this.securityManager.getActiveSessionCount();
    
    // Simple health score calculation
    let score = 1.0;
    
    if (recentErrors > 10) score -= 0.2;
    if (recentErrors > 50) score -= 0.3;
    if (activeSessions > 100) score -= 0.1;
    
    return Math.max(0.0, score);
  }

  private calculateComplianceScore(): number {
    const incidents = this.securityManager.getSecurityIncidents();
    const criticalIncidents = incidents.filter(i => i.severity === 'critical').length;
    
    let score = 1.0;
    if (criticalIncidents > 0) score -= 0.5;
    if (incidents.length > 10) score -= 0.2;
    
    return Math.max(0.0, score);
  }

  private initializeThreatSignatures(): void {
    // SQL Injection
    this.threatSignatures.set('sql_injection', {
      id: 'sql_injection',
      name: 'SQL Injection Attempt',
      pattern: /(union|select|insert|update|delete|drop|exec|script)/i,
      threat_level: 'high',
      description: 'Potential SQL injection attack detected',
      indicators: ['sql_injection', 'code_injection'],
      mitigation_actions: ['input_sanitization', 'query_parameterization'],
      enabled: true,
      created_at: new Date(),
      trigger_count: 0,
    });

    // Path Traversal
    this.threatSignatures.set('path_traversal', {
      id: 'path_traversal',
      name: 'Path Traversal Attempt',
      pattern: /(\.\.\/|\.\.\\|%2e%2e)/i,
      threat_level: 'medium',
      description: 'Potential path traversal attack detected',
      indicators: ['path_traversal', 'directory_traversal'],
      mitigation_actions: ['path_validation', 'input_sanitization'],
      enabled: true,
      created_at: new Date(),
      trigger_count: 0,
    });

    // Authentication Bypass
    this.threatSignatures.set('auth_bypass', {
      id: 'auth_bypass',
      name: 'Authentication Bypass Attempt',
      pattern: /(admin|root|sa|administrator).*password/i,
      threat_level: 'critical',
      description: 'Potential authentication bypass attempt',
      indicators: ['authentication_bypass', 'credential_stuffing'],
      mitigation_actions: ['account_lockout', 'enhanced_monitoring'],
      enabled: true,
      created_at: new Date(),
      trigger_count: 0,
    });
  }

  private initializeMonitoringRules(): void {
    this.monitoringRules.set('multiple_failed_logins', {
      id: 'multiple_failed_logins',
      name: 'Multiple Failed Login Attempts',
      description: 'More than 5 failed login attempts in 10 minutes',
      condition: 'failed_login_count > 5',
      threshold: 5,
      time_window_minutes: 10,
      enabled: true,
      alert_severity: 'medium',
      auto_mitigation: true,
      mitigation_actions: ['rate_limiting', 'account_monitoring'],
    });

    this.monitoringRules.set('admin_action_outside_hours', {
      id: 'admin_action_outside_hours',
      name: 'Administrative Action Outside Business Hours',
      description: 'Administrative action performed outside of 9-5 business hours',
      condition: 'admin_action AND (hour < 9 OR hour > 17)',
      enabled: true,
      alert_severity: 'medium',
      auto_mitigation: false,
      mitigation_actions: ['verify_authorization', 'enhanced_logging'],
    });

    this.monitoringRules.set('bulk_data_access', {
      id: 'bulk_data_access',
      name: 'Bulk Data Access',
      description: 'Large amount of data accessed in short period',
      condition: 'data_volume > 1GB AND time_window < 5_minutes',
      threshold: 1000000000, // 1GB
      time_window_minutes: 5,
      enabled: true,
      alert_severity: 'high',
      auto_mitigation: false,
      mitigation_actions: ['investigate_access', 'verify_authorization'],
    });
  }
}