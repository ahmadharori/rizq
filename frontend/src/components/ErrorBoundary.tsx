/**
 * ErrorBoundary Component
 * Catch and handle React errors gracefully
 */

import React, { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { ErrorState } from '@/components/common/ErrorState';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <ErrorState
              title="Aplikasi Mengalami Masalah"
              message={
                this.state.error?.message ||
                'Terjadi kesalahan yang tidak terduga. Silakan muat ulang halaman.'
              }
              onRetry={this.handleReset}
            />
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
