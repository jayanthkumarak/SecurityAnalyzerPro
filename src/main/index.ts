import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { WindowManager } from './window-manager';
import { SecurityManager } from './security/security-manager';
import { SecurityAwareErrorHandler } from './security/error-handler';
import { SecurityEventMonitor } from './security/security-event-monitor';
import { DatabaseManager } from './database/database-manager';
import { FileProcessingService } from './services/file-processing-service';
import { ClaudeAnalysisService } from './services/claude-analysis-service';
import { AuditService } from './services/audit-service';
import { ConfigManager, Schema } from './config/config-manager';
import { OperationContext, SecurityContext } from './database/types';
import * as crypto from 'crypto';
import * as path from 'path';
import * as fs from 'fs';

const isPackaged = app.isPackaged;
const preloadPath = isPackaged
  ? path.join(__dirname, 'preload.js')
  : path.join(__dirname, '..', 'src', 'main', 'preload.ts');

if (!fs.existsSync(preloadPath)) {
  throw new Error(`Preload script missing at ${preloadPath}`);
}

class SecurityAnalyzerApp {
  private windowManager: WindowManager;
  private securityManager: SecurityManager;
  private errorHandler: SecurityAwareErrorHandler;
  private databaseManager: DatabaseManager;
  private auditService: AuditService;
  private securityMonitor: SecurityEventMonitor;
  private fileProcessingService: FileProcessingService;
  private claudeService: ClaudeAnalysisService;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.securityManager = new SecurityManager();
    this.errorHandler = new SecurityAwareErrorHandler();
    this.databaseManager = new DatabaseManager(this.securityManager);
    this.auditService = new AuditService(this.databaseManager, this.securityManager, this.errorHandler);
    this.securityMonitor = new SecurityEventMonitor(this.securityManager, this.errorHandler, this.auditService);
    this.windowManager = new WindowManager();
    this.fileProcessingService = new FileProcessingService(this.databaseManager);
    this.claudeService = new ClaudeAnalysisService();

    this.initializeApp();
    this.setupSecurityEventHandlers();
  }

  private initializeApp(): void {
    // Security: Disable node integration by default
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(() => ({ action: 'deny' }));

      contents.on('will-navigate', (event, url) => {
        if (url !== contents.getURL()) {
          event.preventDefault();
        }
      });
    });

    // App event handlers
    app.whenReady().then(() => this.onReady());
    app.on('window-all-closed', this.onWindowAllClosed);
    app.on('activate', this.onActivate);
    app.on('before-quit', this.onBeforeQuit);

    // Security: Prevent new window creation
    app.on('web-contents-created', (_, contents) => {
      contents.setWindowOpenHandler(() => ({ action: 'deny' }));
    });

    this.setupIpcHandlers();
  }

  private async onReady(): Promise<void> {
    try {
      // Initialize core services in correct order
      await this.securityManager.initialize();
      await this.databaseManager.initialize();
      await this.auditService.initialize();
      await this.securityMonitor.start();
      await this.fileProcessingService.initialize();

      // Create main window
      await this.windowManager.createMainWindow();

      // Create default admin session for system operations
      await this.createSystemSession();

      console.log('SecurityAnalyzer Pro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      await this.handleInitializationError(error);
      app.quit();
    }
  }

  private onWindowAllClosed = (): void => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  };

  private onActivate = async (): Promise<void> => {
    if (BrowserWindow.getAllWindows().length === 0) {
      await this.windowManager.createMainWindow();
    }
  };

  private onBeforeQuit = async (): Promise<void> => {
    try {
      await this.securityMonitor.stop();
      await this.auditService.shutdown();
      await this.databaseManager.close();
      await this.securityManager.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  private setupIpcHandlers(): void {
    // File processing handlers
    ipcMain.handle('process-file', async (event, filePath: string, caseId: string) => {
      const securityContext = await this.getSecurityContext(event);
      try {
        // Check permissions
        const hasPermission = await this.securityManager.checkPermission(
          securityContext,
          'evidence',
          'create'
        );
        
        if (!hasPermission) {
          throw new Error('Insufficient permissions to process files');
        }

        const context = this.createOperationContext(event, 'file_processing', 'process_file');
        const result = await this.fileProcessingService.processFile(filePath, caseId, context);
        
        // Log successful operation
        await this.auditService.logSecurityEvent({
          event_type: 'data_processing',
          action: 'process_file',
          resource_type: 'evidence',
          resource_id: result.id,
          event_details: { file_path: filePath, case_id: caseId },
        }, securityContext);

        return result;
      } catch (error) {
        await this.handleSecureError(error, securityContext, 'file_processing', 'process_file');
        throw error;
      }
    });

    ipcMain.handle('validate-file', async (event, filePath: string) => {
      const securityContext = await this.getSecurityContext(event);
      try {
        const result = await this.fileProcessingService.validateFile(filePath);
        
        // Log validation attempt
        await this.auditService.logSecurityEvent({
          event_type: 'data_validation',
          action: 'validate_file',
          resource_type: 'file',
          event_details: { file_path: filePath, valid: result.valid },
        }, securityContext);

        return result;
      } catch (error) {
        await this.handleSecureError(error, securityContext, 'file_validation', 'validate_file');
        throw error;
      }
    });

    ipcMain.handle('analyze-artifact', async (event, analysisRequest) => {
      const securityContext = await this.getSecurityContext(event);
      try {
        // Check permissions
        const hasPermission = await this.securityManager.checkPermission(
          securityContext,
          'analysis',
          'create'
        );
        
        if (!hasPermission) {
          throw new Error('Insufficient permissions to analyze artifacts');
        }

        const result = await this.claudeService.analyzeForensicArtifact(analysisRequest);
        
        // Log analysis operation
        await this.auditService.logSecurityEvent({
          event_type: 'ai_analysis',
          action: 'analyze_artifact',
          resource_type: 'analysis',
          event_details: { artifact_type: (analysisRequest as any).type },
        }, securityContext);

        return result;
      } catch (error) {
        await this.handleSecureError(error, securityContext, 'analysis', 'analyze_artifact');
        throw error;
      }
    });

    // Database handlers
    ipcMain.handle('create-case', async (event, caseData) => {
      const securityContext = await this.getSecurityContext(event);
      try {
        // Check permissions
        const hasPermission = await this.securityManager.checkPermission(
          securityContext,
          'case',
          'create'
        );
        
        if (!hasPermission) {
          throw new Error('Insufficient permissions to create cases');
        }

        const context = this.createOperationContext(event, 'case_management', 'create_case');
        const result = await this.databaseManager.createCase(caseData, context);
        
        // Log case creation
        await this.auditService.logSecurityEvent({
          event_type: 'data_creation',
          action: 'create_case',
          resource_type: 'case',
          resource_id: result.id,
          event_details: { case_number: caseData.case_number, case_type: caseData.case_type },
        }, securityContext);

        return result;
      } catch (error) {
        await this.handleSecureError(error, securityContext, 'case_management', 'create_case');
        throw error;
      }
    });

    ipcMain.handle('get-cases', async (event, filters?) => {
      try {
        const context = this.createOperationContext(event, 'case_management', 'get_cases');
        await this.databaseManager.logAuditEvent(
          {
            event_type: 'data_access',
            action: 'list_cases',
            resource_type: 'case',
            event_details: { filters },
          },
          context
        );
        return await this.databaseManager.getCases(filters);
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    });

    ipcMain.handle('get-case-by-id', async (event, caseId: string) => {
      try {
        const context = this.createOperationContext(event, 'case_management', 'get_case');
        await this.databaseManager.logAuditEvent(
          {
            event_type: 'data_access',
            action: 'get_case',
            resource_type: 'case',
            resource_id: caseId,
          },
          context
        );
        return await this.databaseManager.getCaseById(caseId);
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    });

    ipcMain.handle('get-evidence-by-case', async (event, caseId: string) => {
      try {
        const context = this.createOperationContext(event, 'evidence_management', 'get_evidence');
        await this.databaseManager.logAuditEvent(
          {
            event_type: 'data_access',
            action: 'list_evidence',
            resource_type: 'evidence',
            event_details: { case_id: caseId },
          },
          context
        );
        return await this.databaseManager.getEvidenceByCase(caseId);
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    });

    // File dialog handlers
    ipcMain.handle('show-open-dialog', async (_, options) => {
      try {
        const result = await dialog.showOpenDialog(options);
        return result;
      } catch (error) {
        console.error('Dialog error:', error);
        throw error;
      }
    });

    ipcMain.handle('show-save-dialog', async (_, options) => {
      try {
        const result = await dialog.showSaveDialog(options);
        return result;
      } catch (error) {
        console.error('Dialog error:', error);
        throw error;
      }
    });

    // Configuration handlers
    ipcMain.handle('get-config', async (_, key: string) => {
      try {
        if (this.isValidConfigKey(key)) {
          return this.configManager.get(key);
        }
        throw new Error(`Invalid configuration key: ${key}`);
      } catch (error) {
        console.error('Config error:', error);
        throw error;
      }
    });

    // App version handler (for backward compatibility)
    ipcMain.handle('get-app-version', async () => {
      try {
        return this.configManager.get('appVersion') || '0.1.0';
      } catch (error) {
        console.error('Error getting app version:', error);
        return '0.1.0';
      }
    });

    ipcMain.handle('set-config', async (_, key: string, value: any) => {
      try {
        if (this.isValidConfigKey(key)) {
          this.configManager.set(key, value);
          return true;
        }
        throw new Error(`Invalid configuration key: ${key}`);
      } catch (error) {
        console.error('Config error:', error);
        throw error;
      }
    });
  }

  private isValidConfigKey(key: string): key is keyof Schema {
    const schemaKeys: (keyof Schema)[] = [
      'claudeApiKey',
      'analysisDepth',
      'encryptionEnabled',
      'auditLogging',
      'appVersion',
    ];
    return schemaKeys.includes(key as keyof Schema);
  }

  private createOperationContext(
    event: Electron.IpcMainInvokeEvent,
    operationType: string,
    action: string
  ): OperationContext {
    return {
      user_id: 'system_user', // TODO: Add proper user authentication
      session_id: crypto.randomBytes(16).toString('hex'),
      ip_address: event.sender.getURL().includes('localhost') ? '127.0.0.1' : 'unknown',
      user_agent: event.sender.getUserAgent(),
      correlation_id: crypto.randomUUID(),
      operation_type: operationType,
      resource_type: action,
    };
  }

  private async getSecurityContext(_event: Electron.IpcMainInvokeEvent): Promise<SecurityContext> {
    // For now, create a default admin context
    // In production, this would validate the user's session and return their actual context
    return await this.securityManager.createSession(
      'system_admin',
      'System Administrator',
      ['admin'],
      'password'
    );
  }

  private async createSystemSession(): Promise<void> {
    try {
      const systemContext = await this.securityManager.createSession(
        'system',
        'System',
        ['admin'],
        'certificate'
      );
      
      // Log system startup
      await this.auditService.logSecurityEvent({
        event_type: 'system_startup',
        action: 'application_start',
        resource_type: 'system',
        event_details: { 
          version: process.env['npm_package_version'] || 'unknown',
          node_version: process.version,
          platform: process.platform,
        },
      }, systemContext);
      
      console.log('System session created successfully');
    } catch (error) {
      console.error('Failed to create system session:', error);
    }
  }

  private async handleSecureError(
    error: any,
    context: SecurityContext,
    resourceType: string,
    operation: string
  ): Promise<void> {
    try {
      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context,
        { resource_type: resourceType, operation }
      );
    } catch (handlerError) {
      console.error('Error handler failed:', handlerError);
    }
  }

  private async handleInitializationError(error: any): Promise<void> {
    try {
      // Create emergency context for error logging
      const emergencyContext = await this.securityManager.createSession(
        'emergency_system',
        'Emergency System',
        ['admin'],
        'certificate'
      );

      await this.errorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        emergencyContext,
        { resource_type: 'system', operation: 'initialization' }
      );
    } catch (handlerError) {
      console.error('Emergency error handling failed:', handlerError);
    }
  }

  private setupSecurityEventHandlers(): void {
    // Security monitor event handlers
    this.securityMonitor.on('alert_created', (alert) => {
      console.log('Security Alert Created:', alert);
    });

    this.securityMonitor.on('critical_alert', (alert) => {
      console.warn('CRITICAL SECURITY ALERT:', alert);
    });

    this.securityMonitor.on('alert_resolved', (alert) => {
      console.log('Security Alert Resolved:', alert.id);
    });

    this.securityMonitor.on('monitoring_started', () => {
      console.log('Security monitoring activated');
    });

    this.securityMonitor.on('monitoring_stopped', () => {
      console.log('Security monitoring deactivated');
    });
  }
}

// Initialize the application
new SecurityAnalyzerApp();
