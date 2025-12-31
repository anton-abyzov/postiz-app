/**
 * Lightweight Logger Utility
 *
 * Provides consistent logging across the application with:
 * - Environment-aware log levels
 * - Structured output format
 * - Category/module tagging
 *
 * For NestJS services, prefer using the built-in @nestjs/common Logger.
 * This utility is for non-NestJS code (helpers, utilities, etc.)
 */

/**
 * Log levels in order of verbosity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toUpperCase();
  switch (level) {
    case 'DEBUG':
      return LogLevel.DEBUG;
    case 'INFO':
      return LogLevel.INFO;
    case 'WARN':
      return LogLevel.WARN;
    case 'ERROR':
      return LogLevel.ERROR;
    case 'NONE':
      return LogLevel.NONE;
    default:
      // Default: DEBUG in development, INFO in production
      return process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }
}

/**
 * Check if we're in production
 */
function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Format timestamp for logs
 */
function timestamp(): string {
  return new Date().toISOString();
}

/**
 * Format log message
 */
function formatMessage(level: string, category: string, message: string): string {
  return `[${timestamp()}] [${level}] [${category}] ${message}`;
}

/**
 * Serialize data for logging
 */
function serializeData(data: unknown): string {
  if (data === undefined) return '';
  if (data === null) return 'null';
  if (typeof data === 'string') return data;
  if (data instanceof Error) {
    return `${data.message}\n${data.stack || ''}`;
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * Logger class for consistent logging
 */
export class AppLogger {
  private readonly category: string;
  private readonly logLevel: LogLevel;

  constructor(category: string) {
    this.category = category;
    this.logLevel = getLogLevel();
  }

  /**
   * Check if a log level should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  /**
   * Debug level logging (development only by default)
   */
  debug(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const formattedMessage = formatMessage('DEBUG', this.category, message);
      if (data !== undefined) {
        console.debug(formattedMessage, serializeData(data));
      } else {
        console.debug(formattedMessage);
      }
    }
  }

  /**
   * Info level logging
   */
  info(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const formattedMessage = formatMessage('INFO', this.category, message);
      if (data !== undefined) {
        console.info(formattedMessage, serializeData(data));
      } else {
        console.info(formattedMessage);
      }
    }
  }

  /**
   * Alias for info
   */
  log(message: string, data?: unknown): void {
    this.info(message, data);
  }

  /**
   * Warning level logging
   */
  warn(message: string, data?: unknown): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const formattedMessage = formatMessage('WARN', this.category, message);
      if (data !== undefined) {
        console.warn(formattedMessage, serializeData(data));
      } else {
        console.warn(formattedMessage);
      }
    }
  }

  /**
   * Error level logging
   */
  error(message: string, error?: unknown): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const formattedMessage = formatMessage('ERROR', this.category, message);
      if (error !== undefined) {
        console.error(formattedMessage, serializeData(error));
      } else {
        console.error(formattedMessage);
      }
    }
  }
}

/**
 * Create a logger instance for a category
 *
 * @param category - The category/module name for this logger
 * @returns Logger instance
 *
 * @example
 * ```typescript
 * const logger = createLogger('UploadService');
 * logger.info('File uploaded', { filename: 'test.jpg' });
 * logger.error('Upload failed', error);
 * ```
 */
export function createLogger(category: string): AppLogger {
  return new AppLogger(category);
}

/**
 * Default logger instance
 */
export const logger = createLogger('App');
