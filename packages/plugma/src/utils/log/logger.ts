import chalk from 'chalk';

export interface LogOptions {
  defaultIndentLevel?: number;
  showTimestamp?: boolean;
  timestampFormat?: string;
  debug?: boolean;
}

/**
 * A configurable logging utility that provides formatted console output with various log levels,
 * indentation support, and timestamp options.
 */
export class Logger {
  private options: Required<LogOptions>;
  private currentIndent: number;

  /**
   * Creates a new Log instance with the specified options.
   * @param options - Configuration options for the logger
   */
  constructor(options: LogOptions = {}) {
    this.options = {
      defaultIndentLevel: 0,
      showTimestamp: false,
      timestampFormat: 'YYYY-MM-DD HH:mm:ss',
      debug: false,
      ...options,
    };

    this.currentIndent = this.options.defaultIndentLevel;
  }

  public setOptions(options: LogOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Applies formatting options to subsequent log messages.
   * @param options - Formatting options to apply
   */
  format(options: { indent?: number } = {}): this {
    this.currentIndent = options.indent ?? this.options.defaultIndentLevel;
    return this;
  }

  /**
   * Internal method to handle log message formatting and output.
   * @param args - Arguments to be logged
   * @param type - Log type (info, success, error, warning)
   * @param force - Whether to force logging even in production
   */
  private log(
    args: unknown[],
    type: string | null = null,
    force = false,
  ): void {
    if (!this.options.debug && !force) {
      return;
    }

    const formattedMessage = this.formatLog(
      String(args[0]),
      type,
      this.currentIndent,
    );
    const newArgs = [formattedMessage, ...args.slice(1)];

    if (this.options.showTimestamp) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}]`, ...newArgs);
    } else {
      console.log(...newArgs);
    }

    this.resetFormatting();
  }

  private logSeparator(force = false, amount = 1): void {
    this.log(['\n'.repeat(amount - 1)], '', force);
  }

  /**
   * Logs an informational message.
   * @param args - Arguments to log
   */
  debug(...args: unknown[]): this {
    this.log(args, 'debug');
    return this;
  }

  /**
   * Logs an informational message.
   * @param args - Arguments to log
   */
  info(...args: unknown[]): this {
    this.log(args, 'info');
    return this;
  }

  /**
   * Logs a success message.
   * @param args - Arguments to log
   */
  success(...args: unknown[]): this {
    this.logSeparator(true);
    this.log(args, 'success', true);
    return this;
  }

  /**
   * Logs an error message.
   * @param args - Arguments to log
   */
  error(...args: unknown[]): this {
    this.log(args, 'error', true);
    return this;
  }

  /**
   * Logs a warning message.
   * @param args - Arguments to log
   */
  warn(...args: unknown[]): this {
    this.log(args, 'warning', true);
    return this;
  }

  /**
   * Formats a log message with indentation and prefix.
   * @param message - Message to format
   * @param type - Type of log message
   * @param indentLevel - Level of indentation
   */
  private formatLog(
    message: string,
    type: string | null,
    indentLevel = 0,
  ): string {
    const indent = ' '.repeat(indentLevel * 2);
    const prefix = this.getPrefix(type);
    return `${indent}${prefix}${message}`;
  }

  /**
   * Resets formatting to default values.
   */
  private resetFormatting(): void {
    this.currentIndent = this.options.defaultIndentLevel;
  }

  /**
   * Gets the prefix for a given log type.
   * @param type - Type of log message
   */
  private getPrefix(type: string | null): string {
    switch (type) {
      case 'info':
        return chalk.blue.bold('INFO: ');
      case 'debug':
        return chalk.gray.bold('DEBUG: ');
      case 'success':
        return chalk.green.bold('✔︎ ');
      case 'error':
        return chalk.red.bold('ERROR: ');
      case 'warning':
        return chalk.yellow.bold('WARNING: ');
      default:
        return '';
    }
  }
}

export const defaultLogger = new Logger();
