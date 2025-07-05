import React from 'react';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export const AnalysisPage: React.FC = () => {
  return (
    <div className='p-6'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-white'>Analysis Center</h1>
        <p className='text-gray-400 mt-1'>AI-powered forensic artifact analysis</p>
      </div>

      {/* Empty State */}
      <div className='forensic-card'>
        <div className='p-12 text-center'>
          <ChartBarIcon className='h-16 w-16 text-gray-500 mx-auto mb-4' />
          <h2 className='text-xl font-semibold text-white mb-2'>Ready for Analysis</h2>
          <p className='text-gray-400 mb-6'>
            Upload forensic artifacts to begin AI-powered analysis
          </p>
          <button className='forensic-button-primary'>Upload Artifacts</button>
        </div>
      </div>
    </div>
  );
};
