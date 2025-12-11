/**
 * Error tracking utility
 * This provides a centralized error logging system that can be easily
 * upgraded to a service like Sentry, LogRocket, or Datadog in the future.
 */

interface ErrorContext {
  userId?: string
  widgetKey?: string
  businessId?: string
  route?: string
  [key: string]: unknown
}

type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

class ErrorTracker {
  private isDevelopment = process.env.NODE_ENV === 'development'

  /**
   * Log an error with context
   */
  logError(
    error: Error | unknown,
    context?: ErrorContext,
    severity: ErrorSeverity = 'medium'
  ) {
    const timestamp = new Date().toISOString()
    const errorMessage = error instanceof Error ? error.message : String(error)
    const stack = error instanceof Error ? error.stack : undefined

    const logEntry = {
      timestamp,
      severity,
      message: errorMessage,
      stack,
      context,
      environment: process.env.NODE_ENV,
    }

    // In development, log to console with formatting
    if (this.isDevelopment) {
      console.group(`🚨 Error [${severity.toUpperCase()}] - ${timestamp}`)
      console.error('Message:', errorMessage)
      if (stack) console.error('Stack:', stack)
      if (context) console.error('Context:', context)
      console.groupEnd()
    } else {
      // In production, log as JSON for external log aggregation
      console.error(JSON.stringify(logEntry))
    }

    // TODO: Send to external error tracking service (Sentry, LogRocket, etc.)
    // Example for Sentry:
    // if (typeof window !== 'undefined' && window.Sentry) {
    //   window.Sentry.captureException(error, { contexts: { custom: context } })
    // }
  }

  /**
   * Log a warning (non-critical issue)
   */
  logWarning(message: string, context?: ErrorContext) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      level: 'warning',
      message,
      context,
      environment: process.env.NODE_ENV,
    }

    if (this.isDevelopment) {
      console.warn(`⚠️ Warning - ${timestamp}:`, message, context)
    } else {
      console.warn(JSON.stringify(logEntry))
    }
  }

  /**
   * Log general info (for debugging and monitoring)
   */
  logInfo(message: string, context?: ErrorContext) {
    if (this.isDevelopment) {
      console.log(`ℹ️ Info:`, message, context)
    }
  }

  /**
   * Track API errors with additional request context
   */
  logApiError(
    error: Error | unknown,
    request: {
      method: string
      url: string
      body?: unknown
    },
    context?: ErrorContext
  ) {
    this.logError(
      error,
      {
        ...context,
        route: request.url,
        method: request.method,
        requestBody: request.body,
      },
      'high'
    )
  }
}

// Export singleton instance
export const errorTracker = new ErrorTracker()

/**
 * Convenience functions for common error scenarios
 */
export const logError = (error: Error | unknown, context?: ErrorContext, severity?: ErrorSeverity) =>
  errorTracker.logError(error, context, severity)

export const logWarning = (message: string, context?: ErrorContext) =>
  errorTracker.logWarning(message, context)

export const logInfo = (message: string, context?: ErrorContext) =>
  errorTracker.logInfo(message, context)

export const logApiError = (
  error: Error | unknown,
  request: { method: string; url: string; body?: unknown },
  context?: ErrorContext
) => errorTracker.logApiError(error, request, context)
