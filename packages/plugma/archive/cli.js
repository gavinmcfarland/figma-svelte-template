#!/usr/bin/env node

import { Command } from 'commander';
import { runScript } from '../scripts/run-script.js';
import { runRelease } from '../scripts/run-release.js';
import chalk from 'chalk'

// Initialize Commander
const program = new Command();

// Color and format string
function colorStringify(obj, indent = 2) {
	const spaces = ' '.repeat(indent); // Creates spacing for indentation

	const formatted = Object.entries(obj)
		.map(([key, value]) => {
			let coloredValue;
			if (typeof value === 'number') {
				coloredValue = chalk.yellow(value); // Numbers in blue
			} else if (typeof value === 'string') {
				coloredValue = chalk.green(`"${value}"`); // Strings in green with quotes
			} else if (typeof value === 'boolean') {
				coloredValue = value ? chalk.blue(value) : chalk.red(value); // True in blue, false in red
			} else {
				coloredValue = value; // Any other type, output as is
			}
			return `${spaces}${key}: ${coloredValue}`;
		})
		.join(',\n'); // Join with newline and comma

	return `{\n${formatted}\n}`;
}

// Global Debug Option
const handleDebug = (command, options) => {
	if (options.debug) {
		console.log('Debug mode enabled');
		console.log('Command:', command);
		console.log('Arguments:', colorStringify(options) + "\n");
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
	.action(function (options) {
		runScript(this.name(), options); // Call your CLI function
		handleDebug(this.name(), options);
	})
	.addHelpText('after', `
    Examples:
      plugma dev --port 3000 --websockets
      plugma dev --mode test
  `);

// Preview Command
program
	.command('preview')
	.description('Preview your plugin')
	.option('-p, --port <number>', 'Specify a port number for the plugin preview')
	.option('-t, --toolbar', 'Display the developer toolbar within the plugin UI')
	.option('-m, --mode <mode>', 'Specify the mode', 'development')
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-d, --debug', 'Enable debug mode', false)
	.action(function (options) {
		handleDebug(this.name(), options);
		options.websockets = true
		runScript(this.name(), options);
	})
	.addHelpText('after', `
    Examples:
      plugma preview --port 3000
  `);

// Build Command
program
	.command('build')
	.description('Create a build ready for publishing')
	.option('-w, --watch', 'Watch for changes and rebuild automatically')
	.option('-m, --mode <mode>', 'Specify the mode', 'production')
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.option('-d, --debug', 'Enable debug mode', false)
	.action(function (options) {
		runScript(this.name(), options);
		handleDebug(this.name(), options);
	})
	.addHelpText('after', `
    Examples:
      plugma build --watch
  `);

// Release Command
program
	.command('release [version]')
	.description('Prepare a release for your plugin')
	.option('-t, --title <title>', 'Specify a title for the release')
	.option('-n, --notes <notes>', 'Specify release notes')
	.option('-d, --debug', 'Enable debug mode', false)
	.option('-o, --output <path>', 'Specify the output directory', 'dist')
	.action(function (version = 'stable', options) {
		const validReleaseTypes = ['alpha', 'beta', 'stable'];
		const releaseOptions = {
			title: options.title,
			notes: options.notes,
		};

		if (validReleaseTypes.includes(version)) {
			releaseOptions.type = version;
		} else if (/^\d+$/.test(version)) {
			releaseOptions.version = version;
		} else {
			console.error('Invalid version: must be a whole integer or a release type (alpha, beta, stable)');
			process.exit(1);
		}

		runRelease(this.name(), releaseOptions); // Call your release function
		handleDebug(this.name(), { ...options, version });
	})
	.addHelpText('after', `
    Examples:
      plugma release
      plugma release alpha --title "Alpha Release" --notes "Initial alpha release"
  `);

// Parse arguments
program.parse(process.argv);
