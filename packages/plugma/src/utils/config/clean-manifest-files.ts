import fs from 'node:fs';
import path from 'node:path';

import chalk from 'chalk';

import type { PluginOptions, UserFiles } from '#core/types.js';
import { formatTime } from '../time.js';

/**
 * Cleans manifest files based on the trigger event
 * @param options - Plugin configuration options
 * @param files - User files
 * @param trigger - Event that triggered the cleaning
 */
export async function cleanManifestFiles(
  options: PluginOptions,
  files: UserFiles,
  type: 'manifest-changed' | 'file-added' | 'on-initialisation',
): Promise<void> {
  const logStatusChange = (message: string) => {
    console.log(
      `${chalk.grey(formatTime())} ${chalk.cyan(chalk.bold('[plugma]'))} ${chalk.green(message)}`,
    );
  };

  const removeFileIfExists = async (filePath: string) => {
    try {
      await fs.promises.access(filePath);
      await fs.promises.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  };

  const validateFile = async (filePath: string, fieldName: string) => {
    try {
      await fs.promises.access(path.resolve(filePath));
      return true;
    } catch {
      console.log(
        `${chalk.grey(formatTime())} ${chalk.cyan(chalk.bold('[plugma]'))} ${chalk.yellow(
          `Warning: ${fieldName} file not found at ${filePath}`,
        )}`,
      );
      return false;
    }
  };

  const mainJsPath = path.join(options.output, 'main.js');
  const uiHtmlPath = path.join(options.output, 'ui.html');

  if (!files.manifest.main) {
    await removeFileIfExists(mainJsPath);
  }

  if (!files.manifest.ui) {
    await removeFileIfExists(uiHtmlPath);
  }

  if (files.manifest.main) {
    await validateFile(files.manifest.main, 'Main');
  }

  if (files.manifest.ui) {
    await validateFile(files.manifest.ui, 'UI');
  }

  if (type === 'manifest-changed') {
    logStatusChange('manifest changed');
  } else if (type === 'file-added') {
    logStatusChange('file added');
  }
}
