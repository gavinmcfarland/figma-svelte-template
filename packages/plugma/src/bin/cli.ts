import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Command } from 'commander';

import {
  type BuildCommandOptions,
  type DevCommandOptions,
  type ReleaseCommandOptions,
  build,
  dev,
  preview,
  release,
} from '#commands';
import { colorStringify } from '#utils/cli/colorStringify.js';
import { defaultLogger } from '#utils/log/logger.js';
import { getDirName } from '#utils/path.js';
import type { ReleaseType } from './types.js';

// Read package.json to get the version
const __dirname = getDirName(import.meta.url);
const packageJsonPath = join(__dirname, '../../package.json');
const packageJson = JSON.parse(await readFile(packageJsonPath, 'utf-8'));
const version = packageJson.version;

// Initialize Commander
const program = new Command();

// Set version for the program
program.version(version, '-v, --version', 'Output the current version');

// Global Debug Option
const handleDebug = (
  command: string,
  options: Record<string, any> & { debug?: boolean },
): void => {
  if (options.debug) {
    defaultLogger.setOptions({ debug: true });
    console.log('Debug mode enabled');
    console.log('Command:', command);
    console.log('Arguments:', `${colorStringify(options)}\n`);
  }
};

// Dev Command
program
  .command('dev')
  .description('Start a server to develop your plugin')
  .option('-p, --port <number>', 'Specify a port number for the plugin preview')
  .option('-t, --toolbar', 'Display the developer toolbar within the plugin UI')
  .option('-m, --mode <mode>', 'Specify the mode', 'development')
  .option('-o, --output <path>', 'Specify the output directory', 'dist')
  .option('-ws, --websockets', 'Enable websockets', false)
  .option('-d, --debug', 'Enable debug mode', false)
  .action(function (this: Command, options: DevCommandOptions) {
    handleDebug(this.name(), options);
    dev(options);
  })
  .addHelpText(
    'after',
    `
    Examples:
      plugma dev --port 3000 --websockets
      plugma dev --mode test
  `,
  );

// Preview Command
program
  .command('preview')
  .description('Preview your plugin')
  .option('-p, --port <number>', 'Specify a port number for the plugin preview')
  .option('-t, --toolbar', 'Display the developer toolbar within the plugin UI')
  .option('-m, --mode <mode>', 'Specify the mode', 'development')
  .option('-o, --output <path>', 'Specify the output directory', 'dist')
  .option('-d, --debug', 'Enable debug mode', false)
  .action(function (this: Command, options: DevCommandOptions) {
    handleDebug(this.name(), options);
    preview(options);
  })
  .addHelpText(
    'after',
    `
    Examples:
      plugma preview --port 3000
  `,
  );

// Build Command
program
  .command('build')
  .description('Create a build ready for publishing')
  .option('-w, --watch', 'Watch for changes and rebuild automatically')
  .option('-m, --mode <mode>', 'Specify the mode', 'production')
  .option('-o, --output <path>', 'Specify the output directory', 'dist')
  .option('-d, --debug', 'Enable debug mode', false)
  .action(function (this: Command, options: BuildCommandOptions) {
    handleDebug(this.name(), options);
    build(options);
  })
  .addHelpText(
    'after',
    `
    Examples:
      plugma build --watch
  `,
  );

// Release Command
program
  .command('release')
  .argument('[type]', 'Release type or version number', 'stable')
  .description('Prepare a release for your plugin')
  .option('-t, --title <title>', 'Specify a title for the release')
  .option('-n, --notes <notes>', 'Specify release notes')
  .option('-d, --debug', 'Enable debug mode', false)
  .option('-o, --output <path>', 'Specify the output directory', 'dist')
  .action(function (
    this: Command,
    type: string,
    options: ReleaseCommandOptions,
  ) {
    handleDebug(this.name(), { ...options, type });

    const validReleaseTypes: ReleaseType[] = [
      'alpha',
      'beta',
      'stable',
    ] as const;
    const releaseOptions: ReleaseCommandOptions = {
      command: 'release',
      title: options.title,
      notes: options.notes,
      output: options.output,
      debug: options.debug,
    };

    if (
      validReleaseTypes.includes(type as (typeof validReleaseTypes)[number])
    ) {
      releaseOptions.type = type as (typeof validReleaseTypes)[number];
    } else if (/^\d+$/.test(type)) {
      releaseOptions.version = type;
    } else {
      console.error(
        'Invalid version: must be a whole integer or a release type (alpha, beta, stable)',
      );
      process.exit(1);
    }

    release(releaseOptions);
  })
  .addHelpText(
    'after',
    `
    Examples:
      plugma release
      plugma release alpha --title "Alpha Release" --notes "Initial alpha release"
  `,
  );

// Parse arguments
program.parse(process.argv);
