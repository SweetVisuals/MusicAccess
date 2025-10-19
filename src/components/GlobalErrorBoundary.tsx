'use client'

import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface GlobalErrorBoundaryProps {
  children: React.ReactNode
}

interface GlobalErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class GlobalErrorBoundary extends React.Component<
  GlobalErrorBoundaryProps, 
  GlobalErrorBoundaryState
> {
  constructor(props: GlobalErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): GlobalErrorBoundaryState {
    console.error('Global Error Boundary caught error:', error)
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Global Error Boundary:', error, errorInfo)
    this.setState({ errorInfo })
    
    // Log to error reporting service if available
    // You can integrate with Sentry, LogRocket, etc. here
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    // Optionally reload the page for a clean reset
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md border-destructive/50 bg-destructive/10 animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-destructive flex items-center gap-2 text-lg">
                <AlertTriangle className="h-6 w-6" />
                Something went wrong
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The application encountered an unexpected error. This might be due to a temporary issue.
              </p>
              
              {this.state.error && (
                <details className="text-xs text-muted-foreground">
                  <summary className="cursor-pointer mb-2">Error details</summary>
                  <div className="space-y-2">
                    <p className="font-medium">Error message:</p>
                    <pre className="p-2 bg-muted rounded overflow-x-auto text-xs">
                      {this.state.error.message}
                    </pre>
                    {this.state.error.stack && (
                      <>
                        <p className="font-medium mt-2">Stack trace:</p>
                        <pre className="p-2 bg-muted rounded overflow-x-auto text-xs max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={this.handleGoHome}
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go Home
                </Button>
                <Button
                  variant="default"
                  onClick={this.handleReset}
                  className="flex-1"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for functional components
export const withGlobalErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> => {
  return class WithErrorBoundary extends React.Component<P> {
    render() {
      return (
        <GlobalErrorBoundary>
          <Component {...this.props} />
        </GlobalErrorBoundary>
      )
    }
  }
}
