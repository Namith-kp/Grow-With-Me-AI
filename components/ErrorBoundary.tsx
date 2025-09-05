import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // Check if error is related to extensions
    if (error.message.includes('exponent') || 
        error.message.includes('extension') ||
        error.stack?.includes('exponent')) {
      console.warn('Extension-related error detected');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
            <p className="text-gray-300 mb-4">
              The app encountered an error. This might be caused by a browser extension.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
            <div className="mt-4 text-sm text-gray-500">
              <p>If the problem persists, try:</p>
              <ul className="list-disc list-inside mt-2">
                <li>Disabling browser extensions</li>
                <li>Using incognito mode</li>
                <li>Clearing browser cache</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
