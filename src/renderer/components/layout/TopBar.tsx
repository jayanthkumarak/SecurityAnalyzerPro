import React from 'react';
import { useLocation } from 'react-router-dom';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const getPageTitle = (pathname: string): string => {
  switch (pathname) {
    case '/':
      return 'Dashboard';
    case '/cases':
      return 'Case Management';
    case '/analysis':
      return 'Analysis Center';
    case '/settings':
      return 'Settings';
    default:
      if (pathname.startsWith('/analysis/')) {
        return 'Analysis Details';
      }
      return 'SecurityAnalyzer Pro';
  }
};

export const TopBar: React.FC = () => {
  const location = useLocation();
  const pageTitle = getPageTitle(location.pathname);

  return (
    <header className='bg-gray-900 border-b border-gray-700 px-6 py-4'>
      <div className='flex items-center justify-between'>
        {/* Page Title */}
        <div>
          <h1 className='text-xl font-semibold text-white'>{pageTitle}</h1>
          <p className='text-sm text-gray-400 mt-1'>AI-powered digital forensics analysis</p>
        </div>

        {/* Right side actions */}
        <div className='flex items-center space-x-4'>
          {/* Search Bar */}
          <div className='hidden md:block'>
            <div className='relative'>
              <input
                type='text'
                placeholder='Search cases, artifacts...'
                className='forensic-input w-64 pl-10 pr-4 py-2 text-sm'
              />
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <svg
                  className='h-4 w-4 text-gray-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* AI Status */}
          <div className='hidden lg:flex items-center space-x-2 text-sm'>
            <div className='flex items-center text-green-400'>
              <div className='w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse'></div>
              <span>Claude AI</span>
            </div>
          </div>

          {/* Notifications */}
          <button className='relative p-2 text-gray-400 hover:text-white transition-colors'>
            <BellIcon className='h-5 w-5' />
            <span className='absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full'></span>
          </button>

          {/* User Menu */}
          <div className='relative'>
            <button className='flex items-center space-x-2 text-gray-400 hover:text-white transition-colors'>
              <UserCircleIcon className='h-6 w-6' />
              <span className='hidden md:block text-sm'>Security Analyst</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
