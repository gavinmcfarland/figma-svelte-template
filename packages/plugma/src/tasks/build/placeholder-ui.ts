/**
 * Placeholder UI task implementation
 */

import type {
  GetTaskTypeFor,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the build-placeholder-ui task
 */
type Result = {
  outputPath: string;
};

export type BuildPlaceholderUiTask = GetTaskTypeFor<
  typeof BuildPlaceholderUiTask
>;

export const BuildPlaceholderUiTask = task(
  'build:placeholder-ui',
  async (
    options: PluginOptions,
    context: ResultsOfTask<GetFilesTask>,
  ): Promise<Result> => {
    try {
      const fileResult = context[GetFilesTask.name];
      if (!fileResult) {
        throw new Error('get-files task must run first');
      }

      const { files } = fileResult;
      const outputPath = join(options.output || 'dist', 'ui.html');

      // Only create placeholder if UI is specified but file doesn't exist
      if (files.manifest.ui) {
        const placeholderHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plugma Plugin UI</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      margin: 0;
      padding: 20px;
      background: #fff;
      color: #333;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      text-align: center;
    }
    h1 { color: #18a0fb; }
    p { line-height: 1.5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Your Plugma Plugin</h1>
    <p>
      This is a placeholder UI. To customize it, create a UI file at:
      <br>
      <code>${files.manifest.ui}</code>
    </p>
  </div>
</body>
</html>`;

        await mkdir(join(options.output || 'dist'), { recursive: true });
        await writeFile(outputPath, placeholderHtml, 'utf-8');
      }

      return { outputPath };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to build placeholder UI: ${errorMessage}`);
    }
  },
);

export default BuildPlaceholderUiTask;
