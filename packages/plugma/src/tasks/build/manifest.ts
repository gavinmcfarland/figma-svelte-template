/**
 * Manifest building task implementation
 */

import type {
  GetTaskTypeFor,
  ManifestFile,
  PluginOptions,
  ResultsOfTask,
} from '#core/types.js';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { filterNullProps } from '../../utils/filter-null-props.js';
import { GetFilesTask } from '../common/get-files.js';
import { task } from '../runner.js';

/**
 * Result type for the build-manifest task
 */
export interface BuildManifestResult {
  raw: ManifestFile;
  processed: ManifestFile;
}

/**
 * Task that generates the plugin manifest
 */
const buildManifest = async (
  options: PluginOptions,
  context: ResultsOfTask<GetFilesTask>,
): Promise<BuildManifestResult> => {
  try {
    // Get files from previous task
    const fileResult = context[GetFilesTask.name];
    if (!fileResult) {
      throw new Error('get-files task must run first');
    }

    const { files } = fileResult;
    const outputDirPath = join(options.output || 'dist', 'manifest.json');

    // Ensure output directory exists
    await mkdir(dirname(outputDirPath), { recursive: true });

    // Define default and overridden values
    const defaultValues = {
      api: '1.0.0',
    };

    const overriddenValues: Partial<ManifestFile> = {};

    if (files.manifest.main) {
      overriddenValues.main = 'main.js';
    }

    if (files.manifest.ui) {
      overriddenValues.ui = 'ui.html';
    }

    // Merge manifest values and filter out null/undefined
    const processed = filterNullProps({
      ...defaultValues,
      ...files.manifest,
      ...overriddenValues,
    });

    // Write manifest file
    await writeFile(outputDirPath, JSON.stringify(processed, null, 2), 'utf-8');

    return {
      raw: files.manifest,
      processed,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to build manifest: ${errorMessage}`);
  }
};

export const BuildManifestTask = task('build:manifest', buildManifest);
export type BuildManifestTask = GetTaskTypeFor<typeof BuildManifestTask>;

export default BuildManifestTask;
