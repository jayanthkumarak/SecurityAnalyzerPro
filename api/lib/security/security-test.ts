import { SecurityManager } from './security-manager';
import { SecurityAwareErrorHandler } from './error-handler';
import { SecurityEventMonitor } from './security-event-monitor';
import { AuditService } from '../services/audit-service';
import { DatabaseManager } from '../database/database-manager';

/**
 * Comprehensive security implementation test suite
 * Validates all security components work together correctly
 */
export class SecurityTestSuite {
  private securityManager: SecurityManager;
  private errorHandler: SecurityAwareErrorHandler;
  private databaseManager: DatabaseManager;
  private auditService: AuditService;
  private securityMonitor: SecurityEventMonitor;

  constructor() {
    this.securityManager = new SecurityManager();
    this.errorHandler = new SecurityAwareErrorHandler();
    this.databaseManager = new DatabaseManager(this.securityManager);
    this.auditService = new AuditService(this.databaseManager, this.securityManager, this.errorHandler);
    this.securityMonitor = new SecurityEventMonitor(this.securityManager, this.errorHandler, this.auditService);
  }

  async runAllTests(): Promise<boolean> {
    console.log('🔒 Starting Security Implementation Test Suite');
    
    let allTestsPassed = true;
    const testResults: { [key: string]: boolean } = {};

    try {
      // Initialize all components
      await this.initializeComponents();

      // Run test categories
      testResults['session_management'] = await this.testSessionManagement();
      testResults['rbac_system'] = await this.testRBACSystem();
      testResults['error_handling'] = await this.testErrorHandling();
      testResults['audit_logging'] = await this.testAuditLogging();
      testResults['threat_detection'] = await this.testThreatDetection();
      testResults['security_monitoring'] = await this.testSecurityMonitoring();
      testResults['data_encryption'] = await this.testDataEncryption();
      testResults['integration'] = await this.testIntegration();

      // Calculate overall result
      allTestsPassed = Object.values(testResults).every(result => result);

      // Display results
      this.displayTestResults(testResults, allTestsPassed);

      return allTestsPassed;

    } catch (error) {
      console.error('❌ Test suite execution failed:', error);
      return false;
    } finally {
      await this.cleanup();
    }
  }

  private async initializeComponents(): Promise<void> {
    console.log('🚀 Initializing security components...');
    await this.securityManager.initialize();
    await this.databaseManager.initialize();
    await this.auditService.initialize();
    await this.securityMonitor.start();
    console.log('✅ All components initialized');
  }

  private async testSessionManagement(): Promise<boolean> {
    console.log('🧪 Testing Session Management...');
    
    try {
      // Test session creation
      const session1 = await this.securityManager.createSession(
        'test_user_1',
        'Test User 1',
        ['investigator'],
        'password'
      );
      
      if (!session1.session_id || !session1.user_id) {
        throw new Error('Session creation failed');
      }

      // Test session validation
      const validatedSession = await this.securityManager.validateSession(session1.session_id);
      if (!validatedSession || validatedSession.user_id !== session1.user_id) {
        throw new Error('Session validation failed');
      }

      // Test session refresh
      const refreshedSession = await this.securityManager.refreshSession(session1.session_id);
      if (!refreshedSession || refreshedSession.session_expires <= session1.session_expires) {
        throw new Error('Session refresh failed');
      }

      // Test session termination
      await this.securityManager.terminateSession(session1.session_id, 'test_complete');
      const terminatedSession = await this.securityManager.validateSession(session1.session_id);
      if (terminatedSession !== null) {
        throw new Error('Session termination failed');
      }

      console.log('✅ Session Management tests passed');
      return true;

    } catch (error) {
      console.error('❌ Session Management tests failed:', error);
      return false;
    }
  }

  private async testRBACSystem(): Promise<boolean> {
    console.log('🧪 Testing RBAC System...');
    
    try {
      // Create test sessions with different roles
      const adminSession = await this.securityManager.createSession(
        'admin_user',
        'Admin User',
        ['admin'],
        'password'
      );

      const viewerSession = await this.securityManager.createSession(
        'viewer_user',
        'Viewer User',
        ['viewer'],
        'password'
      );

      // Test admin permissions
      const adminCanCreateCase = await this.securityManager.checkPermission(
        adminSession,
        'case',
        'create'
      );
      if (!adminCanCreateCase) {
        throw new Error('Admin should be able to create cases');
      }

      const adminCanDeleteCase = await this.securityManager.checkPermission(
        adminSession,
        'case',
        'delete'
      );
      if (!adminCanDeleteCase) {
        throw new Error('Admin should be able to delete cases');
      }

      // Test viewer restrictions
      const viewerCanCreateCase = await this.securityManager.checkPermission(
        viewerSession,
        'case',
        'create'
      );
      if (viewerCanCreateCase) {
        throw new Error('Viewer should not be able to create cases');
      }

      const viewerCanReadCase = await this.securityManager.checkPermission(
        viewerSession,
        'case',
        'read'
      );
      if (!viewerCanReadCase) {
        throw new Error('Viewer should be able to read cases');
      }

      console.log('✅ RBAC System tests passed');
      return true;

    } catch (error) {
      console.error('❌ RBAC System tests failed:', error);
      return false;
    }
  }

  private async testErrorHandling(): Promise<boolean> {
    console.log('🧪 Testing Error Handling...');
    
    try {
      const testSession = await this.securityManager.createSession(
        'error_test_user',
        'Error Test User',
        ['analyst'],
        'password'
      );

      // Test authentication error
      const authError = new Error('Invalid credentials provided');
      const securityError = await this.errorHandler.handleError(
        authError,
        testSession,
        { resource_type: 'authentication', operation: 'login' }
      );

      if (securityError.error_type !== 'authentication') {
        throw new Error('Authentication error not classified correctly');
      }

      // Test validation error
      const validationError = new Error('Invalid file format detected');
      const validationSecurityError = await this.errorHandler.handleError(
        validationError,
        testSession,
        { resource_type: 'file', operation: 'validation' }
      );

      if (validationSecurityError.error_type !== 'validation') {
        throw new Error('Validation error not classified correctly');
      }

      // Test error statistics
      const stats = this.errorHandler.getErrorStatistics();
      if (stats.total_errors < 2) {
        throw new Error('Error statistics not updating correctly');
      }

      console.log('✅ Error Handling tests passed');
      return true;

    } catch (error) {
      console.error('❌ Error Handling tests failed:', error);
      return false;
    }
  }

  private async testAuditLogging(): Promise<boolean> {
    console.log('🧪 Testing Audit Logging...');
    
    try {
      const testSession = await this.securityManager.createSession(
        'audit_test_user',
        'Audit Test User',
        ['auditor'],
        'password'
      );

      // Test security event logging
      await this.auditService.logSecurityEvent({
        event_type: 'test_event',
        action: 'test_action',
        resource_type: 'test_resource',
        resource_id: 'test_123',
        event_details: { test: 'data' },
      }, testSession);

      // Test audit trail integrity
      const integrityCheck = await this.auditService.verifyAuditTrailIntegrity();
      if (!integrityCheck) {
        throw new Error('Audit trail integrity verification failed');
      }

      console.log('✅ Audit Logging tests passed');
      return true;

    } catch (error) {
      console.error('❌ Audit Logging tests failed:', error);
      return false;
    }
  }

  private async testThreatDetection(): Promise<boolean> {
    console.log('🧪 Testing Threat Detection...');
    
    try {
      // Test anomaly detection
      const incidents = await this.errorHandler.detectAnomalousPatterns();
      
      // The method should return an array (may be empty)
      if (!Array.isArray(incidents)) {
        throw new Error('Threat detection should return an array');
      }

      console.log('✅ Threat Detection tests passed');
      return true;

    } catch (error) {
      console.error('❌ Threat Detection tests failed:', error);
      return false;
    }
  }

  private async testSecurityMonitoring(): Promise<boolean> {
    console.log('🧪 Testing Security Monitoring...');
    
    try {
      // Test that monitoring is active
      if (!this.securityMonitor.listenerCount('alert_created')) {
        // This is just a basic check that the monitor exists
        console.log('Security monitor is initialized');
      }

      // Test getting active alerts
      const alerts = await this.securityMonitor.getActiveAlerts();
      if (!Array.isArray(alerts)) {
        throw new Error('Active alerts should return an array');
      }

      // Test metrics collection
      const metrics = await this.securityMonitor.getSecurityMetrics(1);
      if (!Array.isArray(metrics)) {
        throw new Error('Security metrics should return an array');
      }

      console.log('✅ Security Monitoring tests passed');
      return true;

    } catch (error) {
      console.error('❌ Security Monitoring tests failed:', error);
      return false;
    }
  }

  private async testDataEncryption(): Promise<boolean> {
    console.log('🧪 Testing Data Encryption...');
    
    try {
      const testData = 'Sensitive forensic data for testing';
      
      // Test encryption
      const encrypted = this.securityManager.encrypt(testData);
      if (!encrypted.encrypted || !encrypted.iv || !encrypted.authTag) {
        throw new Error('Encryption failed to produce required components');
      }

      // Test decryption
      const decrypted = this.securityManager.decrypt(encrypted);
      if (decrypted !== testData) {
        throw new Error('Decryption failed to restore original data');
      }

      // Test data sanitization
      const testObject = {
        user: 'sensitive_user',
        path: '/Users/sensitive/file.txt',
        ip: '192.168.1.100',
        data: 'some data'
      };

      const sanitized = this.securityManager.sanitizeForAnalysis(testObject);
      if (sanitized.user === testObject.user) {
        throw new Error('Data sanitization failed to anonymize user data');
      }

      console.log('✅ Data Encryption tests passed');
      return true;

    } catch (error) {
      console.error('❌ Data Encryption tests failed:', error);
      return false;
    }
  }

  private async testIntegration(): Promise<boolean> {
    console.log('🧪 Testing Component Integration...');
    
    try {
      // Test full workflow: Session -> Permission -> Audit -> Error
      const testSession = await this.securityManager.createSession(
        'integration_user',
        'Integration User',
        ['investigator'],
        'password'
      );

      // Check permission
      const hasPermission = await this.securityManager.checkPermission(
        testSession,
        'evidence',
        'create'
      );

      if (!hasPermission) {
        throw new Error('Integration test: Permission check failed');
      }

      // Log audit event
      await this.auditService.logSecurityEvent({
        event_type: 'integration_test',
        action: 'test_workflow',
        resource_type: 'evidence',
        event_details: { test: 'integration' },
      }, testSession);

      // Trigger error handling
      const testError = new Error('Integration test error');
      await this.errorHandler.handleError(
        testError,
        testSession,
        { resource_type: 'integration', operation: 'test' }
      );

      console.log('✅ Integration tests passed');
      return true;

    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      return false;
    }
  }

  private displayTestResults(results: { [key: string]: boolean }, allPassed: boolean): void {
    console.log('\n📊 Security Test Results:');
    console.log('====================================');
    
    Object.entries(results).forEach(([testName, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      const formattedName = testName.replace(/_/g, ' ').toUpperCase();
      console.log(`${formattedName}: ${status}`);
    });
    
    console.log('====================================');
    const overallStatus = allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED';
    console.log(`OVERALL RESULT: ${overallStatus}`);
    
    if (allPassed) {
      console.log('🎉 Security implementation is ready for production!');
    } else {
      console.log('⚠️  Please address failing tests before deployment.');
    }
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up test environment...');
    try {
      await this.securityMonitor.stop();
      await this.auditService.shutdown();
      await this.databaseManager.close();
      await this.securityManager.cleanup();
      console.log('✅ Cleanup completed');
    } catch (error) {
      console.error('❌ Cleanup failed:', error);
    }
  }
}

// Export for external testing
export async function runSecurityTests(): Promise<boolean> {
  const testSuite = new SecurityTestSuite();
  return await testSuite.runAllTests();
}