import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  async createMainWindow(): Promise<BrowserWindow> {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Calculate optimal window size (80% of screen, minimum 1200x800)
    const windowWidth = Math.max(Math.floor(width * 0.8), 1200);
    const windowHeight = Math.max(Math.floor(height * 0.8), 800);

    this.mainWindow = new BrowserWindow({
      width: windowWidth,
      height: windowHeight,
      minWidth: 1000,
      minHeight: 700,
      center: true,
      show: false, // Don't show until ready
      title: 'SecurityAnalyzer Pro',
      titleBarStyle: 'default',
      icon: this.getAppIcon(),
      
      webPreferences: {
        // Security configuration
        nodeIntegration: false,
        contextIsolation: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false,
        
        // Preload script for secure IPC
        preload: join(__dirname, 'preload.js'),
        
        // Additional security
        webSecurity: true,
        sandbox: false, // We need access to Node.js APIs in preload
      },
    });

    // Security: Prevent navigation to external URLs
    this.mainWindow.webContents.on('will-navigate', (event, url) => {
      if (!url.startsWith('file://') && !url.startsWith('http://localhost')) {
        event.preventDefault();
      }
    });

    // Security: Prevent new window creation
    this.mainWindow.webContents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });

    // Load the application
    if (process.env['NODE_ENV'] === 'development') {
      // Development: Load from webpack dev server
      await this.mainWindow.loadURL('http://localhost:3000');
      
      // Open DevTools in development
      this.mainWindow.webContents.openDevTools();
    } else {
      // Production: Load from built files
      await this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      if (this.mainWindow) {
        this.mainWindow.show();
        
        // Focus the window
        if (process.env['NODE_ENV'] === 'development') {
          this.mainWindow.focus();
        }
      }
    });

    // Handle window events
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    // Optimize for different platforms
    if (process.platform === 'darwin') {
      // macOS specific optimizations
      this.mainWindow.setVibrancy('under-window');
    }

    return this.mainWindow;
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }

  private getAppIcon(): string | undefined {
    // Return platform-specific icon paths
    if (process.platform === 'win32') {
      return join(__dirname, '../../assets/icon.ico');
    } else if (process.platform === 'darwin') {
      return join(__dirname, '../../assets/icon.icns');
    } else {
      return join(__dirname, '../../assets/icon.png');
    }
  }

  async createAnalysisWindow(): Promise<BrowserWindow> {
    const analysisWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      parent: this.mainWindow || undefined,
      modal: false,
      show: false,
      title: 'Analysis Details - SecurityAnalyzer Pro',
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(__dirname, 'preload.js'),
      },
    });

    if (process.env.NODE_ENV === 'development') {
      await analysisWindow.loadURL('http://localhost:3000#/analysis');
    } else {
      await analysisWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'analysis'
      });
    }

    analysisWindow.once('ready-to-show', () => {
      analysisWindow.show();
    });

    return analysisWindow;
  }

  async createReportWindow(): Promise<BrowserWindow> {
    const reportWindow = new BrowserWindow({
      width: 1200,
      height: 800,
      minWidth: 1000,
      minHeight: 700,
      show: false,
      title: 'Report Generator - SecurityAnalyzer Pro',
      
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        enableRemoteModule: false,
        preload: join(__dirname, 'preload.js'),
      },
    });

    if (process.env.NODE_ENV === 'development') {
      await reportWindow.loadURL('http://localhost:3000#/report');
    } else {
      await reportWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'report'
      });
    }

    reportWindow.once('ready-to-show', () => {
      reportWindow.show();
    });

    return reportWindow;
  }
}