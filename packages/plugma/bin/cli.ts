#!/usr/bin/env node

import chalk from 'chalk';
import { Command } from 'commander';
import { runRelease } from '../scripts/run-release';
import { runScript } from '../scripts/run-script';
import type { DebugOptions, ReleaseOptions, ScriptOptions } from './types';

// Initialize Commander
const program = new Command();

// Color and format string
function colorStringify(obj: Record<string, unknown>, indent = 2): string {
  const spaces = ' '.repeat(indent);

  const formatted = Object.entries(obj)
    .map(([key, value]) => {
      let coloredValue: string;
      if (typeof value === 'number') {
        coloredValue = chalk.yellow(value.toString());
      } else if (typeof value === 'string') {
        coloredValue = chalk.green(`"${value}"`);
      } else if (typeof value === 'boolean') {
        coloredValue = value
          ? chalk.blue(value.toString())
          : chalk.red(value.toString());
      } else {
        coloredValue = String(value);
      }
      return `${spaces}${key}: ${coloredValue}`;
    })
    .join(',\n');

  return `{\n${formatted}\n}`;
}

// Global Debug Option
const handleDebug = (command: string, options: DebugOptions): void => {
  if (options.debug) {
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
  .action(function (this: Command, options: ScriptOptions) {
    runScript('dev', options);
    handleDebug(this.name(), options);
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
  .action(function (this: Command, options: ScriptOptions) {
    handleDebug(this.name(), options);
    options.websockets = true;
    runScript('preview', options);
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
  .action(function (this: Command, options: ScriptOptions) {
    runScript('build', options);
    handleDebug(this.name(), options);
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
  .action(function (this: Command, type: string, options: ScriptOptions) {
    const validReleaseTypes = ['alpha', 'beta', 'stable'] as const;
    const releaseOptions: ReleaseOptions = {
      title: options.title as string | undefined,
      notes: options.notes as string | undefined,
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

    runRelease(this.name(), releaseOptions);
    handleDebug(this.name(), { ...options, type });
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
