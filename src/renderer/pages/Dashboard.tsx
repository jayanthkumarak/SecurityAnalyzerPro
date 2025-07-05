import React from 'react';
import {
  ChartBarIcon,
  DocumentTextIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

export const Dashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome to SecurityAnalyzer Pro</h1>
        <p className="text-blue-100 mb-4">
          AI-powered digital forensics platform ready for your next investigation.
        </p>
        <button className="bg-white text-blue-600 font-medium px-4 py-2 rounded-md hover:bg-gray-100 transition-colors">
          Start New Analysis
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="forensic-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChartBarIcon className="h-8 w-8 text-blue-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Total Analyses</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>

        <div className="forensic-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Active Cases</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>

        <div className="forensic-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-8 w-8 text-yellow-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Pending Reviews</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>

        <div className="forensic-card p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-400" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-400">Threats Detected</p>
              <p className="text-2xl font-bold text-white">0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="forensic-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="text-center py-8 text-gray-400">
                <ChartBarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No recent activity</p>
                <p className="text-sm mt-2">Start your first analysis to see activity here</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="forensic-card">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full forensic-button-primary justify-start">
                <DocumentTextIcon className="h-5 w-5 mr-3" />
                Upload Forensic Artifacts
              </button>
              
              <button className="w-full forensic-button-secondary justify-start">
                <ChartBarIcon className="h-5 w-5 mr-3" />
                Create New Case
              </button>
              
              <button className="w-full forensic-button-secondary justify-start">
                <ClockIcon className="h-5 w-5 mr-3" />
                View Analysis History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="forensic-card">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-white mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Claude AI Service</span>
              <span className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Online
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">Database</span>
              <span className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Connected
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
              <span className="text-gray-300">File Processing</span>
              <span className="flex items-center text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};