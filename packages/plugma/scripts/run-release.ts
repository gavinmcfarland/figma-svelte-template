/**
 * This module handles the plugin release process, including version management,
 * Git operations, and GitHub workflow template management.
 */

import { execSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

interface ReleaseOptions {
  version?: string;
  type?: 'stable' | 'alpha' | 'beta';
  title?: string;
  notes?: string;
}

interface PackageJson {
  plugma?: {
    pluginVersion?: string;
  };
  [key: string]: any;
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/**
 * Recursively copies a directory and its contents
 * @param src - Source directory path
 * @param dest - Destination directory path
 */
async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    entry.isDirectory()
      ? await copyDirectory(srcPath, destPath)
      : await fs.copyFile(srcPath, destPath);
  }
}

/**
 * Copies a file if the source is newer than the destination
 * @param source - Source file path
 * @param destination - Destination file path
 * @returns Promise<boolean> - True if file was copied, false otherwise
 */
async function copyIfOutOfDate(
  source: string,
  destination: string,
): Promise<boolean> {
  try {
    const sourceStats = await fs.stat(source);
    const destinationStats = await fs.stat(destination).catch(() => null);

    if (!destinationStats || sourceStats.mtime > destinationStats.mtime) {
      console.log(`Copying template from ${source} to ${destination}...`);
      await fs.copyFile(source, destination);
      console.log(`Template copied successfully: ${path.basename(source)}`);
      return true;
    }
  } catch (err) {
    console.error(`Error copying file from ${source} to ${destination}:`, err);
  }
  return false;
}

/**
 * Sets a GitHub environment variable
 * @param key - Environment variable name
 * @param value - Environment variable value
 */
async function setGitHubEnv(key: string, value: string): Promise<void> {
  const githubEnvPath = process.env.GITHUB_ENV;
  if (githubEnvPath) {
    await fs.appendFile(githubEnvPath, `${key}=${value}\n`);
  } else {
    console.error('GITHUB_ENV is not defined.');
    process.exit(1);
  }
}

/**
 * Main release function that handles the entire release process
 * @param command - The command being executed
 * @param options - Release configuration options
 */
export async function runRelease(
  command: string,
  options: ReleaseOptions,
): Promise<void> {
  // Check if the working directory is dirty
  try {
    const uncommittedChanges = execSync('git diff --name-only', {
      encoding: 'utf8',
    }).trim();
    const stagedChanges = execSync('git diff --name-only --cached', {
      encoding: 'utf8',
    }).trim();

    if (uncommittedChanges || stagedChanges) {
      console.error(
        'Error: Working directory has uncommitted changes. Please commit or stash them before proceeding.',
      );
      process.exit(1);
    }
  } catch (err) {
    console.error('Error checking Git status:', err);
    process.exit(1);
  }

  // Ensure the template is copied from `templates/github/` to `.github/` if not present
  const templateDir = path.join(
    __dirname,
    '../templates',
    'github',
    'workflows',
  );
  const githubDir = path.join(process.cwd(), '.github', 'workflows');
  const releaseFile = path.join(githubDir, 'plugma-create-release.yml');

  try {
    const templateExists = await fs.stat(templateDir);
    if (!templateExists) {
      throw new Error(`Template directory ${templateDir} not found.`);
    }

    const githubExists = await fs.stat(githubDir).catch(() => null);
    if (!githubExists) {
      console.log(
        `.github/ directory not found. Copying templates to ${githubDir}...`,
      );
      await copyDirectory(templateDir, githubDir);
      console.log('Templates copied successfully.');
    } else {
      // Check each template file for updates and copy if necessary
      const files = await fs.readdir(templateDir);
      for (const file of files) {
        const sourceFile = path.join(templateDir, file);
        const destinationFile = path.join(githubDir, file);
        await copyIfOutOfDate(sourceFile, destinationFile);
      }
    }

    // Check if `plugma-create-release.yml` was added or updated and create a separate commit
    const releaseFileExists = await fs.stat(releaseFile).catch(() => null);
    if (releaseFileExists) {
      try {
        const releaseFileChanges = execSync(
          `git diff --name-only --staged ${releaseFile}`,
          { encoding: 'utf8' },
        ).trim();

        if (releaseFileChanges) {
          execSync('git add .github/workflows/plugma-create-release.yml', {
            stdio: 'inherit',
          });
          execSync('git commit -m "Add or update plugma-create-release.yml"', {
            stdio: 'inherit',
          });
          console.log(
            'plugma-create-release.yml added or updated and committed.',
          );
        }
      } catch (err: unknown) {
        console.error('Error committing plugma-create-release.yml:', err);
        process.exit(1);
      }
    }
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error copying GitHub templates: ${err.message}`);
    } else {
      console.error('Error copying GitHub templates:', err);
    }
    process.exit(1);
  }

  // Check if the current directory is a Git repository
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch (err) {
    console.error(
      'Error: This is not a Git repository. Please initialize a Git repository before proceeding.',
    );
    process.exit(1);
  }

  // Version management
  const manualVersion = options.version;
  const releaseType = options.type || 'stable';
  const releaseTitle = options.title;
  const releaseNotes = options.notes;

  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  let version: string;
  let newTag: string;

  try {
    const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
    const packageJson: PackageJson = JSON.parse(packageJsonData);

    // Initialize plugma.pluginVersion if not present
    if (!packageJson.plugma) {
      packageJson.plugma = {};
    }
    if (!packageJson.plugma.pluginVersion) {
      packageJson.plugma.pluginVersion = '0';
      console.log('No plugma.pluginVersion found. Initializing it to 0.');
    }

    version = packageJson.plugma.pluginVersion;
    let baseVersion = version;

    if (manualVersion) {
      newTag = `v${manualVersion}`;
    } else if (releaseType === 'stable') {
      const newVersion = Number.parseInt(version) + 1;
      newTag = `v${newVersion}`;
    } else {
      // Extract the base version and sub-version
      const existingTagMatch = version.match(/^(.*?)-(alpha|beta)\.(\d+)$/);
      if (existingTagMatch) {
        baseVersion = existingTagMatch[1];
      }

      // Increment subversion based on the current package.json `plugma.pluginVersion`
      const versionParts = version.split('-');
      let subVersion = 0;

      if (versionParts.length === 2) {
        const [base, suffix] = versionParts;
        const [releaseType, subVersionStr] = suffix.split('.');
        subVersion = Number.parseInt(subVersionStr, 10) + 1;
        newTag = `v${base}-${releaseType}.${subVersion}`;
      } else {
        newTag = `v${baseVersion}-${releaseType}.0`;
      }
    }

    // Update version in package.json
    if (manualVersion) {
      packageJson.plugma.pluginVersion = manualVersion;
    } else if (releaseType === 'stable') {
      packageJson.plugma.pluginVersion = `${Number.parseInt(version) + 1}`;
    } else {
      const versionMatch = newTag.match(/-(alpha|beta)\.(\d+)$/);
      if (!versionMatch) {
        throw new Error('Invalid version format');
      }
      const subVersion = versionMatch[2];
      packageJson.plugma.pluginVersion = `${baseVersion}-${releaseType}.${subVersion}`;
    }

    await fs.writeFile(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2),
      'utf8',
    );
    console.log(`Version successfully updated to ${newTag} in package.json`);
  } catch (err) {
    console.error('Error reading or updating package.json:', err);
    process.exit(1);
  }

  // Stage changes and create release
  try {
    execSync('git add package.json .github', { stdio: 'inherit' });

    const changes = execSync('git diff --cached --name-only', {
      encoding: 'utf8',
    }).trim();
    if (changes) {
      execSync('git add .', { stdio: 'inherit' });
      execSync('git commit -m "Plugin version updated"', { stdio: 'inherit' });

      try {
        // Build tag message
        let tagMessage = '';
        if (releaseTitle) {
          tagMessage += `TITLE: ${releaseTitle}`;
        }
        if (releaseNotes) {
          if (tagMessage) {
            tagMessage += '\n\n';
          }
          tagMessage += `NOTES: ${releaseNotes}`;
        }

        // Create tag
        if (tagMessage) {
          execSync(`git tag ${newTag} -m "${tagMessage}"`, {
            stdio: 'inherit',
          });
        } else {
          execSync(`git tag ${newTag}`, { stdio: 'inherit' });
        }

        execSync('git push', { stdio: 'inherit' });
        execSync(`git push origin ${newTag}`, { stdio: 'inherit' });
        console.log(`Successfully committed, tagged, and pushed: ${newTag}`);
        execSync('plugma build', { stdio: 'inherit' });
      } catch (err) {
        console.error(
          'Error during git push, reverting the last commit...',
          err,
        );
        execSync('git reset --hard HEAD^', { stdio: 'inherit' });
        process.exit(1);
      }
    } else {
      console.log('No changes to commit.');
    }
  } catch (err) {
    console.error('Error committing or pushing to Git:', err);
    process.exit(1);
  }
}
