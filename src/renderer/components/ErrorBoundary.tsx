import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
          <div className="max-w-2xl w-full">
            <div className="bg-red-900 bg-opacity-20 border border-red-700 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg
                    className="h-8 w-8 text-red-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h1 className="text-xl font-bold text-red-400">
                    Application Error
                  </h1>
                  <p className="text-red-300 mt-1">
                    Something went wrong in SecurityAnalyzer Pro
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-2">
                  Error Details:
                </h2>
                <div className="bg-gray-800 border border-gray-700 rounded p-4 overflow-auto">
                  <pre className="text-sm text-red-300 whitespace-pre-wrap">
                    {this.state.error?.message}
                  </pre>
                </div>
              </div>

              {process.env['NODE_ENV'] === 'development' && this.state.errorInfo && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-2">
                    Stack Trace:
                  </h2>
                  <div className="bg-gray-800 border border-gray-700 rounded p-4 overflow-auto max-h-64">
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {this.state.error?.stack}
                    </pre>
                  </div>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => window.location.reload()}
                  className="forensic-button-primary"
                >
                  Reload Application
                </button>
                
                <button
                  onClick={() => {
                    this.setState({
                      hasError: false,
                      error: null,
                      errorInfo: null,
                    });
                  }}
                  className="forensic-button-secondary"
                >
                  Try Again
                </button>

                {process.env['NODE_ENV'] === 'development' && (
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Error: ${this.state.error?.message}\n\nStack: ${this.state.error?.stack}`
                      );
                    }}
                    className="forensic-button-secondary"
                  >
                    Copy Error
                  </button>
                )}
              </div>

              <div className="mt-6 p-4 bg-gray-800 border border-gray-700 rounded">
                <h3 className="text-sm font-semibold text-gray-300 mb-2">
                  Troubleshooting Tips:
                </h3>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Try reloading the application</li>
                  <li>• Check if your system meets the minimum requirements</li>
                  <li>• Ensure you have a stable internet connection</li>
                  <li>• If the issue persists, please report it on GitHub</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}