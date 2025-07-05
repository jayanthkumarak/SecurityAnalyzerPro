// Global polyfill for Electron renderer process
;(window as any).global = window;

import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/global.css';

// Get the root element
const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

// Create React root
const root = createRoot(container);

// Render the application
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hot module replacement for development
if (process.env['NODE_ENV'] === 'development') {
  // Development optimizations
  console.log('Development mode enabled');
}
