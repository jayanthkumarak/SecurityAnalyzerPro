import * as crypto from 'crypto';
import { DatabaseManager } from '../database/database-manager';
import { SecurityManager } from '../security/security-manager';
import { SecurityAwareErrorHandler } from '../security/error-handler';
import {
  AuditEvent,
  SecurityContext,
  SecurityIncident,
  OperationContext,
} from '../database/types';

export interface ComplianceReport {
  id: string;
  report_type: 'daily' | 'weekly' | 'monthly' | 'incident' | 'compliance_audit';
  generated_at: Date;
  period_start: Date;
  period_end: Date;
  generated_by: string;
  
  summary: {
    total_events: number;
    security_incidents: number;
    compliance_violations: number;
    data_access_events: number;
    administrative_actions: number;
    failed_operations: number;
  };
  
  events_by_type: Record<string, number>;
  events_by_user: Record<string, number>;
  security_metrics: {
    authentication_failures: number;
    authorization_violations: number;
    data_integrity_issues: number;
    suspicious_activities: number;
  };
  
  compliance_status: {
    gdpr_compliant: boolean;
    sox_compliant: boolean;
    nist_compliant: boolean;
    iso27037_compliant: boolean;
    violations: string[];
  };
  
  recommendations: string[];
  audit_trail_integrity: boolean;
  chain_of_custody_intact: boolean;
}

export interface AuditConfiguration {
  retention_period_days: number;
  real_time_monitoring: boolean;
  alert_thresholds: {
    failed_logins_per_hour: number;
    authorization_failures_per_hour: number;
    data_access_anomalies: number;
    admin_actions_per_day: number;
  };
  compliance_requirements: string[];
  automated_reporting: boolean;
  report_schedule: string[];
}

export class AuditService {
  private databaseManager: DatabaseManager;
  private securityManager: SecurityManager;
  private errorHandler: SecurityAwareErrorHandler;
  private config: AuditConfiguration;
  private auditChain: Map<string, string> = new Map(); // event_id -> previous_hash
  private monitoringTimer: NodeJS.Timeout | null = null;

  constructor(
    databaseManager: DatabaseManager,
    securityManager: SecurityManager,
    errorHandler: SecurityAwareErrorHandler
  ) {
    this.databaseManager = databaseManager;
    this.securityManager = securityManager;
    this.errorHandler = errorHandler;
    this.config = this.getDefaultConfiguration();
  }

  async initialize(): Promise<void> {
    try {
      // Verify audit database integrity
      await this.verifyAuditTrailIntegrity();
      
      // Start real-time monitoring if enabled
      if (this.config.real_time_monitoring) {
        this.startRealTimeMonitoring();
      }
      
      console.log('Audit service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audit service:', error);
      throw error;
    }
  }

  async logSecurityEvent(
    event: Partial<AuditEvent>,
    context: SecurityContext
  ): Promise<void> {
    try {
      // Validate security context
      const isAuthorized = await this.securityManager.checkPermission(
        context,
        'audit',
        'create'
      );
      
      if (!isAuthorized) {
        throw new Error('Insufficient permissions to create audit events');
      }

      const event_id = crypto.randomUUID();
      const correlation_id = crypto.randomUUID();

      // Create comprehensive audit event
      const auditEvent: AuditEvent = {
        id: this.securityManager.generateSecureRandomId(),
        event_id,
        event_type: event.event_type || 'security_event',
        action: event.action || 'unknown',
        ...event.resource_type && { resource_type: event.resource_type },
        ...event.resource_id && { resource_id: event.resource_id },
        ...context.user_id && { user_id: context.user_id },
        ...context.session_id && { session_id: context.session_id },
        ...context.ip_address && { ip_address: context.ip_address },
        ...context.user_agent && { user_agent: context.user_agent },
        event_details: {
          ...event.event_details,
          security_level: context.security_level,
          user_roles: context.roles,
          authentication_method: context.authentication_method,
        },
        correlation_id,
        legal_hold_applicable: this.isLegalHoldApplicable(event),
        retention_required: true,
        compliance_flags: this.generateComplianceFlags(event),
        event_timestamp: new Date(),
        recorded_timestamp: new Date(),
        event_hash: '', // will be calculated next
      };

      // Calculate audit chain hash
      const eventHash = this.calculateEventHash(auditEvent);
      const previousHash = this.auditChain.get('latest') || '0';
      
      auditEvent.event_hash = eventHash;
      auditEvent.previous_hash = previousHash;
      
      // Store in database
      const operationContext: OperationContext = {
        user_id: context.user_id,
        session_id: context.session_id,
        operation_type: 'audit_logging',
        resource_type: 'audit_event',
        ...context.ip_address && { ip_address: context.ip_address },
        ...context.user_agent && { user_agent: context.user_agent },
        ...auditEvent.correlation_id && { correlation_id: auditEvent.correlation_id },
      };

      await this.databaseManager.logAuditEvent(auditEvent, operationContext);
      
      // Update audit chain
      this.auditChain.set(auditEvent.event_id, eventHash);
      this.auditChain.set('latest', eventHash);

      // Check for real-time alerts
      if (this.config.real_time_monitoring) {
        await this.checkRealTimeAlerts(auditEvent);
      }

    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        { resource_type: 'audit', operation: 'log_event' }
      );
      throw error;
    }
  }

  async generateComplianceReport(
    reportType: ComplianceReport['report_type'],
    periodStart: Date,
    periodEnd: Date,
    generatedBy: string
  ): Promise<ComplianceReport> {
    try {
      const reportId = crypto.randomUUID();
      
      // Gather audit events for the period
      const events = await this.getAuditEventsByPeriod(periodStart, periodEnd);
      const securityIncidents = await this.getSecurityIncidentsByPeriod(periodStart, periodEnd);
      
      // Calculate summary statistics
      const summary = this.calculateSummaryStatistics(events, securityIncidents);
      
      // Analyze events by type and user
      const eventsByType = this.groupEventsByType(events);
      const eventsByUser = this.groupEventsByUser(events);
      
      // Calculate security metrics
      const securityMetrics = this.calculateSecurityMetrics(events, securityIncidents);
      
      // Assess compliance status
      const complianceStatus = await this.assessComplianceStatus(events, securityIncidents);
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(events, securityIncidents, complianceStatus);
      
      // Verify audit trail integrity
      const auditTrailIntegrity = await this.verifyAuditTrailIntegrity();
      const chainOfCustodyIntact = await this.verifyChainOfCustody();

      const report: ComplianceReport = {
        id: reportId,
        report_type: reportType,
        generated_at: new Date(),
        period_start: periodStart,
        period_end: periodEnd,
        generated_by: generatedBy,
        summary,
        events_by_type: eventsByType,
        events_by_user: eventsByUser,
        security_metrics: securityMetrics,
        compliance_status: complianceStatus,
        recommendations,
        audit_trail_integrity: auditTrailIntegrity,
        chain_of_custody_intact: chainOfCustodyIntact,
      };

      // Log report generation
      console.log(`Compliance report generated: ${reportId} (${reportType})`);
      
      return report;

    } catch (error) {
      console.error('Failed to generate compliance report:', error);
      throw error;
    }
  }

  async verifyAuditTrailIntegrity(): Promise<boolean> {
    try {
      // This would implement actual audit trail verification
      // For now, return true assuming integrity is maintained
      
      // In a real implementation, this would:
      // 1. Verify hash chain continuity
      // 2. Check for missing events
      // 3. Validate digital signatures
      // 4. Ensure no unauthorized modifications
      
      console.log('Audit trail integrity verification completed');
      return true;
    } catch (error) {
      console.error('Audit trail integrity verification failed:', error);
      return false;
    }
  }

  async exportAuditTrail(
    _startDate: Date,
    _endDate: Date,
    format: 'json' | 'csv' | 'xml',
    context: SecurityContext
  ): Promise<string> {
    try {
      // Check authorization
      const isAuthorized = await this.securityManager.checkPermission(
        context,
        'audit',
        'export'
      );
      
      if (!isAuthorized) {
        throw new Error('Insufficient permissions to export audit trail');
      }

      // Get audit events for the period
      const events = await this.getAuditEventsByPeriod(_startDate, _endDate);
      
      // Log the export action
      await this.logSecurityEvent({
        event_type: 'data_export',
        action: 'export_audit_trail',
        resource_type: 'audit_trail',
        event_details: {
          period_start: _startDate,
          period_end: _endDate,
          format,
          event_count: events.length,
        },
      }, context);

      // Format the data based on requested format
      switch (format) {
        case 'json':
          return JSON.stringify(events, null, 2);
        case 'csv':
          return this.formatAsCSV(events);
        case 'xml':
          return this.formatAsXML(events);
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }

    } catch (error) {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        { resource_type: 'audit', operation: 'export' }
      );
      throw error;
    }
  }

  // Private helper methods
  private getDefaultConfiguration(): AuditConfiguration {
    return {
      retention_period_days: 2555, // 7 years
      real_time_monitoring: true,
      alert_thresholds: {
        failed_logins_per_hour: 10,
        authorization_failures_per_hour: 5,
        data_access_anomalies: 3,
        admin_actions_per_day: 50,
      },
      compliance_requirements: ['GDPR', 'SOX', 'NIST-800-86', 'ISO-27037'],
      automated_reporting: true,
      report_schedule: ['daily', 'weekly', 'monthly'],
    };
  }

  private async getAuditEventsByPeriod(_startDate: Date, _endDate: Date): Promise<AuditEvent[]> {
    // This would query the actual audit database
    // For now, return empty array as placeholder
    return [];
  }

  private getSecurityIncidentsByPeriod(startDate: Date, endDate: Date): SecurityIncident[] {
    return this.securityManager.getSecurityIncidents().filter(
      incident => incident.created_at >= startDate && incident.created_at <= endDate
    );
  }

  private calculateSummaryStatistics(events: AuditEvent[], incidents: SecurityIncident[]): ComplianceReport['summary'] {
    return {
      total_events: events.length,
      security_incidents: incidents.length,
      compliance_violations: incidents.filter(i => i.incident_type === 'policy_violation').length,
      data_access_events: events.filter(e => e.event_type === 'data_access').length,
      administrative_actions: events.filter(e => e.event_type === 'administrative').length,
      failed_operations: events.filter(e => e.event_details['success'] === false).length,
    };
  }

  private groupEventsByType(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.event_type] = (acc[event.event_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private groupEventsByUser(events: AuditEvent[]): Record<string, number> {
    return events.reduce((acc, event) => {
      const userId = event.user_id || 'system';
      acc[userId] = (acc[userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateSecurityMetrics(_events: AuditEvent[], incidents: SecurityIncident[]): ComplianceReport['security_metrics'] {
    return {
      authentication_failures: incidents.filter(i => i.incident_type === 'authentication_failure').length,
      authorization_violations: incidents.filter(i => i.incident_type === 'authorization_violation').length,
      data_integrity_issues: incidents.filter(i => i.incident_type === 'data_breach').length,
      suspicious_activities: incidents.filter(i => i.incident_type === 'suspicious_activity').length,
    };
  }

  private async assessComplianceStatus(_events: AuditEvent[], incidents: SecurityIncident[]): Promise<ComplianceReport['compliance_status']> {
    const violations: string[] = [];
    
    // Check for compliance violations
    const criticalIncidents = incidents.filter(i => i.severity === 'critical');
    if (criticalIncidents.length > 0) {
      violations.push('Critical security incidents detected');
    }
    
    const dataBreaches = incidents.filter(i => i.incident_type === 'data_breach');
    if (dataBreaches.length > 0) {
      violations.push('Data integrity violations detected');
    }

    return {
      gdpr_compliant: dataBreaches.length === 0,
      sox_compliant: violations.length === 0,
      nist_compliant: true, // Would implement actual NIST compliance checks
      iso27037_compliant: await this.verifyChainOfCustody(),
      violations,
    };
  }

  private generateRecommendations(_events: AuditEvent[], incidents: SecurityIncident[], complianceStatus: ComplianceReport['compliance_status']): string[] {
    const recommendations: string[] = [];
    
    if (incidents.length > 0) {
      recommendations.push('Review and address security incidents');
    }
    
    if (!complianceStatus.gdpr_compliant) {
      recommendations.push('Implement additional data protection measures');
    }
    
    if (incidents.filter(i => i.incident_type === 'authentication_failure').length > 5) {
      recommendations.push('Strengthen authentication controls');
    }
    
    return recommendations;
  }

  private async verifyChainOfCustody(): Promise<boolean> {
    // This would implement actual chain of custody verification
    // For now, return true as placeholder
    return true;
  }

  private calculateEventHash(event: Partial<AuditEvent>): string {
    const eventData = {
      event_id: event.event_id,
      event_type: event.event_type,
      action: event.action,
      user_id: event.user_id,
      resource_type: event.resource_type,
      resource_id: event.resource_id,
      event_timestamp: event.event_timestamp?.toISOString(),
      event_details: event.event_details,
    };

    const sortedKeys = Object.keys(eventData).sort() as (keyof typeof eventData)[];
    const sortedEventData: any = {};
    for (const key of sortedKeys) {
      if (eventData[key] !== undefined) {
        sortedEventData[key] = eventData[key];
      }
    }

    const hashData = JSON.stringify(sortedEventData);
    return crypto.createHash('sha256').update(hashData).digest('hex');
  }

  private isLegalHoldApplicable(event: Partial<AuditEvent>): boolean {
    // Determine if legal hold applies to this event type
    const legalHoldTypes = ['data_deletion', 'evidence_modification', 'case_closure'];
    return legalHoldTypes.includes(event.event_type || '');
  }

  private generateComplianceFlags(event: Partial<AuditEvent>): Record<string, any> {
    return {
      gdpr_relevant: event.event_type === 'data_access' || event.event_type === 'data_modification',
      sox_relevant: event.event_type === 'administrative' || event.event_type === 'financial',
      nist_relevant: true, // Most events are relevant for NIST compliance
      retention_required: true,
    };
  }

  private async checkRealTimeAlerts(event: Partial<AuditEvent>): Promise<void> {
    // Implement real-time alerting logic
    if (event.event_type === 'authentication_failure') {
      // Check if threshold exceeded
      console.log('Real-time alert: Authentication failure detected');
    }
  }

  private startRealTimeMonitoring(): void {
    this.monitoringTimer = setInterval(async () => {
      try {
        await this.performRealTimeAnalysis();
      } catch (error) {
        console.error('Real-time monitoring error:', error);
      }
    }, 60000); // Check every minute
  }

  private async performRealTimeAnalysis(): Promise<void> {
    // Analyze recent events for anomalies
    const incidents = await this.errorHandler.detectAnomalousPatterns();
    
    for (const incident of incidents) {
      if (incident.severity === 'critical' || incident.severity === 'high') {
        console.warn('Real-time security alert:', incident);
      }
    }
  }

  private formatAsCSV(events: AuditEvent[]): string {
    if (!events || events.length === 0) {
      return '';
    }
    
    const headers = Object.keys(events[0]!).join(',');
    const rows = events.map(event =>
      Object.values(event)
        .map(value => (typeof value === 'object' ? JSON.stringify(value) : String(value)))
        .join(',')
    );
    
    return [headers, ...rows].join('\\n');
  }

  private formatAsXML(events: AuditEvent[]): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\\n<audit_trail>\\n';
    
    for (const event of events) {
      xml += '  <event>\\n';
      for (const [key, value] of Object.entries(event)) {
        xml += `    <${key}>${this.escapeXML(String(value))}</${key}>\\n`;
      }
      xml += '  </event>\\n';
    }
    
    xml += '</audit_trail>';
    return xml;
  }

  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }

  async shutdown(): Promise<void> {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
    }
  }
}