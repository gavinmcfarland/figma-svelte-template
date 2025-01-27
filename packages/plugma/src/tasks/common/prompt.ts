/**
 * Task that shows the Plugma startup prompt
 */

import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { Logger } from '#utils/log/logger.js';
import { task } from '../runner.js';
import { GetFilesTask } from './get-files.js';

/**
 * Result type for the show-plugma-prompt task
 * This task doesn't return anything meaningful
 */
export interface ShowPlugmaPromptResult {
  shown: boolean;
}

/**
 * Task that displays the Plugma startup prompt
 * Used by all commands to show version and status
 */
const showPlugmaPrompt = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<ShowPlugmaPromptResult> => {
  try {
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const log = new Logger({ debug: options.debug });

    log.debug(`
Plugma v${fileResult.version}
A modern Figma plugin development toolkit
`);

    if (
      options.command === 'dev' ||
      options.command === 'preview' ||
      (options.command === 'build' && options.watch)
    ) {
      console.log('Watching for changes...');
    }

    return { shown: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to show Plugma prompt: ${errorMessage}`);
  }
};

export const ShowPlugmaPromptTask = task(
  'common:show-plugma-prompt',
  showPlugmaPrompt,
);

export type ShowPlugmaPromptTask = GetTaskTypeFor<typeof ShowPlugmaPromptTask>;

export default ShowPlugmaPromptTask;
