/**
 * Centralized logging utility
 *
 * In production, you can integrate this with:
 * - Sentry for error tracking
 * - LogRocket for session replay
 * - Datadog/New Relic for application monitoring
 * - Winston/Pino for structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development'
  private isProduction = process.env.NODE_ENV === 'production'

  /**
   * Log debug information (only in development)
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '')
    }
  }

  /**
   * Log informational messages
   */
  info(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()

    if (this.isDevelopment) {
      console.log(`[INFO] ${timestamp} - ${message}`, context || '')
    } else {
      // In production, send to logging service
      this.sendToLoggingService('info', message, context)
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, context?: LogContext) {
    const timestamp = new Date().toISOString()

    if (this.isDevelopment) {
      console.warn(`[WARN] ${timestamp} - ${message}`, context || '')
    } else {
      this.sendToLoggingService('warn', message, context)
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const timestamp = new Date().toISOString()

    const errorDetails = error instanceof Error
      ? { name: error.name, message: error.message, stack: error.stack }
      : error

    if (this.isDevelopment) {
      console.error(`[ERROR] ${timestamp} - ${message}`, errorDetails, context || '')
    } else {
      this.sendToLoggingService('error', message, { ...context, error: errorDetails })
    }
  }

  /**
   * Log with emoji indicators for better visibility
   */
  emoji = {
    success: (message: string, context?: LogContext) => {
      this.info(`✅ ${message}`, context)
    },
    failure: (message: string, context?: LogContext) => {
      this.error(`❌ ${message}`, undefined, context)
    },
    email: (message: string, context?: LogContext) => {
      this.info(`📧 ${message}`, context)
    },
    warning: (message: string, context?: LogContext) => {
      this.warn(`⚠️ ${message}`, context)
    },
    api: (message: string, context?: LogContext) => {
      this.info(`🔌 ${message}`, context)
    },
  }

  /**
   * Send logs to external logging service
   * TODO: Integrate with Sentry, LogRocket, or other logging service
   */
  private sendToLoggingService(level: LogLevel, message: string, context?: LogContext) {
    // In production, send to your logging service
    // Example integrations:

    // Sentry (for errors)
    // if (level === 'error' && typeof Sentry !== 'undefined') {
    //   Sentry.captureException(new Error(message), { extra: context })
    // }

    // LogRocket
    // if (typeof LogRocket !== 'undefined') {
    //   LogRocket.log(level, message, context)
    // }

    // For now, still use console in production but with structured format
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
    }

    switch (level) {
      case 'error':
        console.error(JSON.stringify(logEntry))
        break
      case 'warn':
        console.warn(JSON.stringify(logEntry))
        break
      default:
        console.log(JSON.stringify(logEntry))
    }
  }
}

// Export singleton instance
export const logger = new Logger()

// Convenience exports for common patterns
export const logSuccess = logger.emoji.success.bind(logger)
export const logFailure = logger.emoji.failure.bind(logger)
export const logEmail = logger.emoji.email.bind(logger)
export const logWarning = logger.emoji.warning.bind(logger)
export const logApi = logger.emoji.api.bind(logger)
