import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex-1 w-full h-full min-h-[400px] flex items-center justify-center bg-[#0a0a0c] p-6 text-[#e0e0e0]">
          <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-6 space-y-4 font-mono text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/80 border border-rose-800/80 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-white">
                {this.props.fallbackTitle || 'Component Execution Recovered'}
              </h3>
              <p className="text-xs text-white/50 mt-1.5 leading-relaxed">
                A rendering exception occurred in this module. The application state has been preserved.
              </p>
              {this.state.error?.message && (
                <div className="mt-3 p-2.5 rounded bg-black/40 border border-white/5 text-[10px] text-rose-300 text-left font-mono break-all overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>
            <div className="pt-2">
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-2 px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
