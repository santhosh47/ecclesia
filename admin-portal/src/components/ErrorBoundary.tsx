import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  showDetails: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    showDetails: false,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    logger.error(
      `Uncaught exception in ${this.props.moduleName || 'Component'}: ${error.message}`,
      'ErrorBoundary',
      {
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      }
    );
    this.setState({ errorInfo });
  }

  private handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const moduleName = this.props.moduleName || 'Module';

      return (
        <div
          style={{
            padding: '2.5rem',
            margin: '2rem auto',
            maxWidth: '650px',
            backgroundColor: 'var(--card-bg, #1e293b)',
            borderRadius: '12px',
            border: '1px solid var(--border-color, rgba(239, 68, 68, 0.3))',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            color: 'var(--text-main, #f8fafc)',
            textAlign: 'center',
          }}
          role="alert"
          aria-live="assertive"
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}
          >
            <AlertTriangle size={28} />
          </div>

          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            Something went wrong in {moduleName}
          </h3>

          <p
            style={{
              fontSize: '0.95rem',
              color: 'var(--text-muted, #94a3b8)',
              marginBottom: '1.75rem',
              lineHeight: 1.5,
            }}
          >
            An unexpected error occurred while rendering this component. The rest of your session and
            other church management views remain safe and unaffected.
          </p>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <RotateCcw size={16} />
              Reload {moduleName}
            </button>

            <button
              onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
              className="btn btn-secondary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {this.state.showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              {this.state.showDetails ? 'Hide Diagnostics' : 'Technical Details'}
            </button>
          </div>

          {this.state.showDetails && this.state.error && (
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                textAlign: 'left',
                overflowX: 'auto',
                fontSize: '0.8rem',
                fontFamily: 'monospace',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '0.5rem' }}>
                {this.state.error.name}: {this.state.error.message}
              </div>
              {this.state.error.stack && (
                <pre style={{ whiteSpace: 'pre-wrap', color: '#94a3b8', margin: 0 }}>
                  {this.state.error.stack}
                </pre>
              )}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
