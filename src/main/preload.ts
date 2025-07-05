import { contextBridge, ipcRenderer } from 'electron';

// Define the API interface that will be exposed to the renderer
interface SecurityAnalyzerAPI {
  // File processing
  processFile: (filePath: string) => Promise<any>;
  showOpenDialog: (options: any) => Promise<any>;
  showSaveDialog: (options: any) => Promise<any>;

  // Analysis
  analyzeArtifact: (analysisRequest: any) => Promise<any>;

  // Database operations
  createCase: (caseData: any) => Promise<any>;
  getCases: () => Promise<any>;

  // Configuration
  getConfig: (key: string) => Promise<any>;
  setConfig: (key: string, value: any) => Promise<boolean>;

  // Event subscriptions
  subscribeToAnalysis: (analysisId: string, callback: (update: any) => void) => () => void;

  // Security
  validateFile: (filePath: string) => Promise<boolean>;
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api: SecurityAnalyzerAPI = {
  // File processing
  processFile: (filePath: string) => ipcRenderer.invoke('process-file', filePath),
  showOpenDialog: (options: any) => ipcRenderer.invoke('show-open-dialog', options),
  showSaveDialog: (options: any) => ipcRenderer.invoke('show-save-dialog', options),

  // Analysis
  analyzeArtifact: (analysisRequest: any) =>
    ipcRenderer.invoke('analyze-artifact', analysisRequest),

  // Database operations
  createCase: (caseData: any) => ipcRenderer.invoke('create-case', caseData),
  getCases: () => ipcRenderer.invoke('get-cases'),

  // Configuration
  getConfig: (key: string) => ipcRenderer.invoke('get-config', key),
  setConfig: (key: string, value: any) => ipcRenderer.invoke('set-config', key, value),

  // Event subscriptions for real-time updates
  subscribeToAnalysis: (analysisId: string, callback: (update: any) => void) => {
    const handler = (_: any, update: any) => {
      if (update.analysisId === analysisId) {
        callback(update);
      }
    };

    ipcRenderer.on('analysis-update', handler);

    // Return unsubscribe function
    return () => {
      ipcRenderer.removeListener('analysis-update', handler);
    };
  },

  // Security validation
  validateFile: (filePath: string) => ipcRenderer.invoke('validate-file', filePath),
};

// Security: Only expose specific APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', api);

// Expose a secure API for development tools (only in development)
if (process.env['NODE_ENV'] === 'development') {
  contextBridge.exposeInMainWorld('devAPI', {
    openDevTools: () => ipcRenderer.invoke('open-dev-tools'),
    reloadApp: () => ipcRenderer.invoke('reload-app'),
  });
}

// Prevent the renderer process from accessing Node.js APIs
// This is already handled by contextIsolation: true, but good to be explicit
window.addEventListener('DOMContentLoaded', () => {
  // Remove any global Node.js objects that might have leaked
  delete (window as any).require;
  delete (window as any).exports;
  delete (window as any).module;
});

// Add TypeScript declarations for the global API
declare global {
  interface Window {
    electronAPI: SecurityAnalyzerAPI;
    devAPI?: {
      openDevTools: () => Promise<void>;
      reloadApp: () => Promise<void>;
    };
  }
}
