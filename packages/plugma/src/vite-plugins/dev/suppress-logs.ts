import type { Plugin } from 'vite';

interface SuppressLogsOptions {
  [key: string]: unknown;
}

/**
 * A Vite plugin that suppresses specific log messages during development
 * to reduce noise in the console output.
 *
 * @param options - Optional configuration options (currently unused)
 * @returns A Vite plugin configuration object
 */
export function viteSuppressLogs(options: SuppressLogsOptions = {}): Plugin {
  return {
    name: 'suppress-logs',
    apply: 'serve',

    configResolved() {
      const originalLog = console.log;
      const originalStdoutWrite = process.stdout.write.bind(process.stdout);

      const suppressedPatterns = [
        'modules transformed',
        'gzip',
        'built in',
        'build started',
        'watching for file changes...',
        'transforming',
      ];

      // Type definition for console.log arguments
      type ConsoleLogArgs = Parameters<typeof console.log>;

      // Suppress specific logs in `console.log`
      console.log = (...args: ConsoleLogArgs): void => {
        const message = args.join(' ');
        if (!suppressedPatterns.some((pattern) => message.includes(pattern))) {
          originalLog(...args);
        }
      };

      // Suppress specific logs in `process.stdout.write`
      const write = (
        chunk: string | Uint8Array,
        encoding?: BufferEncoding | ((err?: Error) => void),
        callback?: (err?: Error) => void,
      ): boolean => {
        const message = chunk.toString();

        // Handle the case where encoding is actually the callback
        const actualCallback =
          typeof encoding === 'function' ? encoding : callback;
        const actualEncoding =
          typeof encoding === 'string' ? encoding : undefined;

        if (!suppressedPatterns.some((pattern) => message.includes(pattern))) {
          return originalStdoutWrite(chunk, actualEncoding, actualCallback);
        }

        // Call callback if provided to prevent hanging
        if (actualCallback) {
          actualCallback();
        }
        return true;
      };

      process.stdout.write = write;
    },
  };
}

export default viteSuppressLogs;
