import React from 'react';
import { PlusIcon, FolderIcon } from '@heroicons/react/24/outline';

export const CaseManager: React.FC = () => {
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Case Management</h1>
          <p className="text-gray-400 mt-1">Organize and manage your forensic investigations</p>
        </div>
        <button className="forensic-button-primary flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Case
        </button>
      </div>

      {/* Empty State */}
      <div className="forensic-card">
        <div className="p-12 text-center">
          <FolderIcon className="h-16 w-16 text-gray-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">No Cases Yet</h2>
          <p className="text-gray-400 mb-6">
            Create your first case to start organizing forensic investigations
          </p>
          <button className="forensic-button-primary">
            Create First Case
          </button>
        </div>
      </div>
    </div>
  );
};