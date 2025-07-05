import { BrowserWindow, screen, app } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';

export class WindowManager {
  private mainWindow: BrowserWindow | null = null;

  async createMainWindow(): Promise<BrowserWindow> {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width, height } = primaryDisplay.workAreaSize;

    // Calculate optimal window size (80% of screen, minimum 1200x800)
    const windowWidth = Math.max(Math.floor(width * 0.8), 1200);
    const windowHeight = Math.max(Math.floor(height * 0.8), 800);

    // Determine the correct preload path
    const preloadPath = app.isPackaged
      ? join(__dirname, 'preload.js')  // after build, __dirname === dist/main
      : join(__dirname, 'preload.js'); // during dev, webpack outputs to dist/main

    // Safety check: ensure preload script exists
    if (!existsSync(preloadPath)) {
      throw new Error(`Preload script missing at ${preloadPath}. Current __dirname: ${__dirname}`);
    }

    console.log(`✅ Preload script found at: ${preloadPath}`);

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
        preload: preloadPath,

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

    // Set Content Security Policy
    if (process.env['NODE_ENV'] === 'development') {
      // Development CSP - more permissive for hot reload
      this.mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        callback({
          responseHeaders: {
            ...details.responseHeaders,
            'Content-Security-Policy': [
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data: http://localhost:*; " +
              "font-src 'self' data:; " +
              "connect-src 'self' http://localhost:* ws://localhost:* https://api.anthropic.com;"
            ]
          }
        });
      });
    }

    // Load the application
    if (process.env['NODE_ENV'] === 'development') {
      // Development: Load from webpack dev server
      await this.mainWindow.loadURL('http://localhost:3001');

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

  private getAppIcon(): string {
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
    // Use the same preload path logic
    const preloadPath = app.isPackaged
      ? join(__dirname, 'preload.js')
      : join(__dirname, 'preload.js');

    if (!existsSync(preloadPath)) {
      throw new Error(`Preload script missing at ${preloadPath}`);
    }

    const analysisWindow = new BrowserWindow({
      width: 1000,
      height: 700,
      minWidth: 800,
      minHeight: 600,
      ...(this.mainWindow && { parent: this.mainWindow }),
      modal: false,
      show: false,
      title: 'Analysis Details - SecurityAnalyzer Pro',

      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: preloadPath,
      },
    });

    if (process.env['NODE_ENV'] === 'development') {
      await analysisWindow.loadURL('http://localhost:3001#/analysis');
    } else {
      await analysisWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'analysis',
      });
    }

    analysisWindow.once('ready-to-show', () => {
      analysisWindow.show();
    });

    return analysisWindow;
  }

  async createReportWindow(): Promise<BrowserWindow> {
    // Use the same preload path logic
    const preloadPath = app.isPackaged
      ? join(__dirname, 'preload.js')
      : join(__dirname, 'preload.js');

    if (!existsSync(preloadPath)) {
      throw new Error(`Preload script missing at ${preloadPath}`);
    }

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
        preload: preloadPath,
      },
    });

    if (process.env['NODE_ENV'] === 'development') {
      await reportWindow.loadURL('http://localhost:3001#/report');
    } else {
      await reportWindow.loadFile(join(__dirname, '../renderer/index.html'), {
        hash: 'report',
      });
    }

    reportWindow.once('ready-to-show', () => {
      reportWindow.show();
    });

    return reportWindow;
  }
}
