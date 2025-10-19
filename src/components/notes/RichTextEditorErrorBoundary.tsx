'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface RichTextEditorErrorBoundaryProps {
  children: React.ReactNode
  onReset?: () => void
  onError?: () => void
  fallback?: React.ReactNode
}

interface RichTextEditorErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class RichTextEditorErrorBoundary extends React.Component<
  RichTextEditorErrorBoundaryProps, 
  RichTextEditorErrorBoundaryState
> {
  constructor(props: RichTextEditorErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): RichTextEditorErrorBoundaryState {
    console.error('RichTextEditor Error Boundary caught error:', error)
    // Prevent the error from bubbling up and crashing the entire app
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('RichTextEditor Error Boundary:', error, errorInfo)
    // Log to error reporting service if available
    this.props.onError?.()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
    this.props.onReset?.()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-destructive/50 bg-destructive/10 animate-fade-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-destructive flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4" />
              Editor Failed to Load
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              The rich text editor encountered an error. This might be due to browser compatibility 
              or a temporary issue.
            </p>
            {this.state.error && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">Error details</summary>
                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={this.handleReset}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

// Simple textarea fallback component
export function SimpleTextareaFallback({
  value,
  onChange,
  placeholder = "Write your notes here...",
  className = ""
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full min-h-[100px] p-3 border rounded-md resize-y text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${className}`}
    />
  )
}
