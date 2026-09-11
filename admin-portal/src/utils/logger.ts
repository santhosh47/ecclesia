/**
 * Client-side Centralized Logger for Ecclesia Admin Portal
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  data?: unknown;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

class ClientLogger {
  private minLevel: LogLevel = (import.meta.env.MODE === 'production' ? 'info' : 'debug') as LogLevel;
  private logBuffer: LogEntry[] = [];
  private readonly maxBufferSize = 100;

  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.minLevel];
  }

  private format(level: LogLevel, context: string | undefined, message: string, data?: unknown): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      context,
      message,
      data,
    };

    this.logBuffer.push(entry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift();
    }

    return entry;
  }

  debug(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.format('debug', context, message, data);
    console.debug(`%c[DEBUG] [${entry.timestamp}]${context ? ` [${context}]` : ''}: ${message}`, 'color: #9ca3af', data ?? '');
  }

  info(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    const entry = this.format('info', context, message, data);
    console.info(`%c[INFO] [${entry.timestamp}]${context ? ` [${context}]` : ''}: ${message}`, 'color: #3b82f6', data ?? '');
  }

  warn(message: string, context?: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.format('warn', context, message, data);
    console.warn(`%c[WARN] [${entry.timestamp}]${context ? ` [${context}]` : ''}: ${message}`, 'color: #f59e0b', data ?? '');
  }

  error(message: string, context?: string, error?: unknown): void {
    if (!this.shouldLog('error')) return;
    const entry = this.format('error', context, message, error);
    console.error(`%c[ERROR] [${entry.timestamp}]${context ? ` [${context}]` : ''}: ${message}`, 'color: #ef4444; font-weight: bold', error ?? '');
  }

  getRecentLogs(): LogEntry[] {
    return [...this.logBuffer];
  }
}

export const logger = new ClientLogger();
