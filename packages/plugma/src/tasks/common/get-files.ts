/**
 * File loading task implementation
 */

import type { GetTaskTypeFor, PluginOptions, UserFiles } from '#core/types.js';
import { createViteConfigs } from '#utils/config/create-vite-configs.js';
import { getUserFiles } from '#utils/config/get-user-files.js';
import { getDirName } from '#utils/path.js';
import { task } from '../runner.js';

const __dirname = getDirName(import.meta.url);

/**
 * Result type for the getFiles task
 */
export interface GetFilesResult {
  /** The version of the plugin */
  version: string;
  /** The files to be used by the plugin */
  files: UserFiles;
  /** The configuration objects */
  config: ReturnType<typeof createViteConfigs>;
}

/**
 * Task that loads and prepares necessary files and configurations
 */
export const getFiles = async (
  options: PluginOptions,
): Promise<GetFilesResult> => {
  // Get user files
  const files = await getUserFiles(options);

  // Create configs
  const config = createViteConfigs(options, files);

  return {
    version: files.userPkgJson.version,
    files,
    config,
  };
};

export const GetFilesTask = task('common:get-files', getFiles);
export type GetFilesTask = GetTaskTypeFor<typeof GetFilesTask>;

export default GetFilesTask;
