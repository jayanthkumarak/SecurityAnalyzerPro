import React from 'react';

export const SettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 mt-1">Configure SecurityAnalyzer Pro preferences</p>
      </div>

      {/* Settings Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Configuration */}
        <div className="forensic-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">AI Configuration</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Claude API Key
                </label>
                <input
                  type="password"
                  placeholder="Enter your Claude API key"
                  className="forensic-input w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Analysis Depth
                </label>
                <select className="forensic-select w-full">
                  <option>Standard</option>
                  <option>Detailed</option>
                  <option>Comprehensive</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="forensic-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Data Encryption</p>
                  <p className="text-xs text-gray-500">Encrypt all stored data</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-300">Audit Logging</p>
                  <p className="text-xs text-gray-500">Log all user activities</p>
                </div>
                <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-600">
                  <span className="translate-x-6 inline-block h-4 w-4 transform rounded-full bg-white transition"></span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-6 flex space-x-4">
        <button className="forensic-button-primary">
          Save Settings
        </button>
        <button className="forensic-button-secondary">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
};