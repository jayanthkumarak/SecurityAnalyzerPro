import React from 'react';

export const LoadingScreen: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        {/* App Logo/Icon */}
        <div className="mb-8">
          <div className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        {/* App Title */}
        <h1 className="text-2xl font-bold text-white mb-2">
          SecurityAnalyzer Pro
        </h1>
        <p className="text-gray-400 mb-8">
          AI-Powered Digital Forensics Platform
        </p>

        {/* Loading Spinner */}
        <div className="relative">
          <div className="w-12 h-12 mx-auto">
            <div className="spinner w-full h-full"></div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Initializing application...
          </p>
        </div>

        {/* Loading Progress */}
        <div className="mt-8 max-w-xs mx-auto">
          <div className="progress-bar h-2">
            <div className="progress-fill w-full animate-pulse"></div>
          </div>
        </div>

        {/* Version Info */}
        <div className="mt-8 text-xs text-gray-600">
          <p>Version 0.1.0 - Foundation Release</p>
          <p className="mt-1">
            Powered by Claude AI & Electron
          </p>
        </div>
      </div>
    </div>
  );
};