import chalk from 'chalk';

class Log {
	constructor(options = {}) {
		this.options = {
			defaultIndentLevel: 0,
			showTimestamp: false,
			timestampFormat: 'YYYY-MM-DD HH:mm:ss',
			debug: false, // Default is false, disable logging in production
			...options, // Merge default options with user-provided options
		};

		this.isProd = process.env.NODE_ENV === 'production';
		this.currentIndent = this.options.defaultIndentLevel; // Store current indent
		this.currentType = null; // Store current log type
		this.forceLog = false; // Track whether to force logging
	}

	// Method to apply formatting options (e.g., indentation)
	format(options = {}) {
		this.currentIndent = options.indent || this.options.defaultIndentLevel; // Set new indent level
		return this; // Return the instance for chaining
	}

	// Store the log arguments and prepare to log later
	log(args, type = null, force = false) {
		// Skip logging if not in debug mode, except forced logs
		if (!this.options.debug && this.isProd && !force) {
			return;
		}

		// Format the first argument (message) with indentation and type
		const formattedMessage = this.formatLog(args[0], this.currentIndent, type);

		// Replace the first argument with the formatted message
		const newArgs = [formattedMessage, ...args.slice(1)];

		// Add timestamp if required
		if (this.options.showTimestamp) {
			const timestamp = new Date().toISOString();
			console.log(`[${timestamp}]`, ...newArgs);
		} else {
			console.log(...newArgs);
		}

		// Reset formatting after logging
		this.resetFormatting();
	}

	// Logging methods
	text(...args) {
		this.log(args, null, true);
		return this; // Return the instance for chaining
	}

	info(...args) {
		this.log(args, 'info');
		return this; // Return the instance for chaining
	}

	success(...args) {
		this.log(args, 'success');
		return this; // Return the instance for chaining
	}

	error(...args) {
		this.log(args, 'error', true);
		return this; // Return the instance for chaining
	}

	warn(...args) {
		this.log(args, 'warning', true);
		return this; // Return the instance for chaining
	}

	// Format log with indent and prefix
	formatLog(message, indentLevel = 0, type) {
		const indent = ' '.repeat(indentLevel * 2); // 2 spaces per indent level
		const prefix = this.getPrefix(type);
		return `${indent}${prefix}${message}`;
	}

	// Reset formatting to default values
	resetFormatting() {
		this.currentIndent = this.options.defaultIndentLevel;
		this.currentType = null;
	}

	getPrefix(type) {
		switch (type) {
			case 'info':
				return chalk.blue.bold('INFO: ');
			case 'success':
				return chalk.green.bold('SUCCESS: ');
			case 'error':
				return chalk.red.bold('ERROR: ');
			case 'warning':
				return chalk.yellow.bold('WARNING: ');
			default:
				return '';
		}
	}
}

export { Log };
