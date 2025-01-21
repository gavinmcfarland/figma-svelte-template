/**
 * Script to copy files from the apps/dist directory to the apps directory.
 * This is typically used in the build process to move compiled files to their final destination.
 */

import { copyFile, existsSync, mkdir, readdir } from 'node:fs';
import { join } from 'node:path';
import { promisify } from 'node:util';

// Promisify fs functions for better async handling
const copyFileAsync = promisify(copyFile);
const mkdirAsync = promisify(mkdir);
const readdirAsync = promisify(readdir);

// Source and destination directories
const sourceDir: string = join(process.cwd(), '../apps/dist');
const destDir: string = join(process.cwd(), 'apps');

/**
 * Copies all files from the source directory to the destination directory.
 * Creates the destination directory if it doesn't exist.
 */
async function copyFiles(): Promise<void> {
  try {
    // Ensure destination directory exists
    if (!existsSync(destDir)) {
      await mkdirAsync(destDir, { recursive: true });
    }

    // Get list of files to copy
    const files = await readdirAsync(sourceDir);

    // Copy each file
    await Promise.all(
      files.map(async (file: string) => {
        const srcPath = join(sourceDir, file);
        const destPath = join(destDir, file);

        await copyFileAsync(srcPath, destPath);
        console.log(`${file} was copied to ${destPath}`);
      }),
    );
  } catch (error) {
    console.error('Error copying files:', error);
    process.exit(1);
  }
}

// Execute the copy operation
copyFiles();
