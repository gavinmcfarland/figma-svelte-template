import fs from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

interface CopyDirOptions {
  sourceDir: string;
  targetDir: string;
}

/**
 * Recursively removes a directory and all its contents
 * @param dirPath - Path to the directory to remove
 */
function removeDirectory(dirPath: string): void {
  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      if (fs.statSync(filePath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectory(filePath);
      } else {
        // Remove files
        fs.unlinkSync(filePath);
      }
    }
    fs.rmdirSync(dirPath); // Remove the directory itself
  }
}

/**
 * Recursively copies a directory and its contents
 * @param source - Source directory path
 * @param destination - Destination directory path
 */
function copyDirectory(source: string, destination: string): void {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination);
  }

  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const destPath = path.join(destination, file);

    if (fs.statSync(sourcePath).isDirectory()) {
      // Recursively copy subdirectories
      copyDirectory(sourcePath, destPath);
    } else {
      // Check if file is named 'index.html'
      if (file === 'index.html') {
        // Rename 'index.html' to 'ui.html' during copy
        fs.copyFileSync(sourcePath, path.join(destination, 'ui.html'));
      } else {
        // Copy files other than 'index.html'
        fs.copyFileSync(sourcePath, destPath);
      }
    }
  }

  // Remove all directories within the destination directory
  const subdirs = fs.readdirSync(destination);
  for (const subdir of subdirs) {
    const subdirPath = path.join(destination, subdir);
    if (fs.statSync(subdirPath).isDirectory()) {
      removeDirectory(subdirPath);
    }
  }
}

/**
 * Vite plugin that copies a directory after the build is complete
 * @param options - Configuration options for the plugin
 */
export function viteCopyDirectoryPlugin(options: CopyDirOptions): Plugin {
  return {
    name: 'vite-plugin-copy-dir',
    apply: 'build',
    writeBundle() {
      copyDirectory(options.sourceDir, options.targetDir);
    },
  };
}

export default viteCopyDirectoryPlugin;
