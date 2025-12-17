import React, { Component, type ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card } from "@/shared/components/ui/card";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error("Error caught by boundary:", error, errorInfo);
    }

    // Call optional error handler
    this.props.onError?.(error, errorInfo);

    // In production, you might want to log to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-destructive" />
              <div className="flex-1">
                <h2 className="text-lg font-semibold">Something went wrong</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  An unexpected error occurred. Please try refreshing the page.
                </p>
              </div>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-md">
                <p className="text-xs font-mono text-destructive">
                  {this.state.error.message}
                </p>
                {this.state.error.stack && (
                  <details className="mt-2">
                    <summary className="text-xs cursor-pointer text-muted-foreground">
                      Stack trace
                    </summary>
                    <pre className="text-xs mt-2 overflow-auto text-muted-foreground">
                      {this.state.error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline" size="sm">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="default"
                size="sm"
              >
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
