import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import { WindowManager } from './window-manager';
import { SecurityManager } from './security/security-manager';
import { DatabaseManager } from './database/database-manager';
import { FileProcessingService } from './services/file-processing-service';
import { ClaudeAnalysisService } from './services/claude-analysis-service';
import { ConfigManager } from './config/config-manager';

class SecurityAnalyzerApp {
  private windowManager: WindowManager;
  private securityManager: SecurityManager;
  private databaseManager: DatabaseManager;
  private fileProcessingService: FileProcessingService;
  private claudeService: ClaudeAnalysisService;
  private configManager: ConfigManager;

  constructor() {
    this.configManager = new ConfigManager();
    this.securityManager = new SecurityManager();
    this.databaseManager = new DatabaseManager();
    this.windowManager = new WindowManager();
    this.fileProcessingService = new FileProcessingService();
    this.claudeService = new ClaudeAnalysisService(this.configManager);
    
    this.initializeApp();
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
      // Initialize core services
      await this.databaseManager.initialize();
      await this.securityManager.initialize();
      
      // Create main window
      await this.windowManager.createMainWindow();
      
      console.log('SecurityAnalyzer Pro initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
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
      await this.databaseManager.close();
      await this.securityManager.cleanup();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  private setupIpcHandlers(): void {
    // File processing handlers
    ipcMain.handle('process-file', async (_, filePath: string) => {
      try {
        return await this.fileProcessingService.processFile(filePath);
      } catch (error) {
        console.error('File processing error:', error);
        throw error;
      }
    });

    ipcMain.handle('analyze-artifact', async (_, analysisRequest) => {
      try {
        return await this.claudeService.analyzeForensicArtifact(analysisRequest);
      } catch (error) {
        console.error('Analysis error:', error);
        throw error;
      }
    });

    // Database handlers
    ipcMain.handle('create-case', async (_, caseData) => {
      try {
        return await this.databaseManager.createCase(caseData);
      } catch (error) {
        console.error('Database error:', error);
        throw error;
      }
    });

    ipcMain.handle('get-cases', async () => {
      try {
        return await this.databaseManager.getCases();
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
        return this.configManager.get(key);
      } catch (error) {
        console.error('Config error:', error);
        throw error;
      }
    });

    ipcMain.handle('set-config', async (_, key: string, value: any) => {
      try {
        this.configManager.set(key, value);
        return true;
      } catch (error) {
        console.error('Config error:', error);
        throw error;
      }
    });
  }
}

// Initialize the application
new SecurityAnalyzerApp();