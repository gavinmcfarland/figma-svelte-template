export function suppressLogs(options) {
	// need to remove any trailing slashes for it to match correctly
	const output = options.output.replace(/\/+$/, ''); // Removes trailing slash(es)
	const escapedOutput = output.replace(/\//g, '\\/');
	const MAIN_BUILT_REGEX = new RegExp(`^${escapedOutput}/main\\.js\\s+\\d+(\\.\\d+)?\\s+kB\\s+│\\s+gzip:\\s+\\d+(\\.\\d+)?\\s+kB$`);
	const TEMP_INDEX_PATH_REGEX = new RegExp(`^${escapedOutput}/node_modules/plugma/tmp/index\\.html\\s+\\d+(\\.\\d+)?\\s+kB\\s+│\\s+gzip:\\s+\\d+(\\.\\d+)?\\s+kB$`);

	let patterns = [
		/^vite v\d+\.\d+\.\d+ building for \w+\.\.\.$/,
		/^build started...$/,
		/^✓ \d+ module(s)? transformed\.$/,
		/^✓?\s*built in \d+(\.\d+)?ms\.?$/,
		/^✓?\s*built in \d+(\.\d+)?s\.?$/,
		/^watching for file changes...$/,
		TEMP_INDEX_PATH_REGEX,
		MAIN_BUILT_REGEX,
		'transforming',
	]

	const originalStdoutWrite = process.stdout.write;
	const originalLog = console.log;

	// Function to remove ANSI color codes from a string
	function stripAnsiCodes(str) {
		return str.replace(/\x1B\[\d{1,2}(;\d{1,2})?m/g, '').trim();
	}

	// Helper function to check if a message matches any pattern (string or regex)
	function matchesPattern(message, patterns) {
		return patterns.some(pattern =>
			pattern instanceof RegExp ? pattern.test(message) : message.includes(pattern)
		);
	}

	// Override console.log with a filter based on the provided patterns
	console.log = (...args) => {
		const message = args.join(' ');
		const cleanMessage = stripAnsiCodes(message); // Remove ANSI codes for matching

		// if (MAIN_BUILT_REGEX.test(cleanMessage)) {
		// 	if (hasMainBuiltBeenCalled) {
		// 		originalLog(chalk.grey(formatTime()) + chalk.cyan(chalk.bold(' [vite]')) + chalk.green(' main updated'))
		// 	}
		// 	hasMainBuiltBeenCalled = true
		// }

		// Suppress message if it matches any of the specified patterns (after cleaning)
		if (!matchesPattern(cleanMessage, patterns)) {
			originalLog(...args);
		}
	};

	// Suppress specific logs in `process.stdout.write`
	process.stdout.write = (chunk, encoding, callback) => {
		const message = chunk.toString();
		const cleanMessage = stripAnsiCodes(message); // Remove ANSI codes for matching

		if (!matchesPattern(cleanMessage, patterns)) {
			originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
		} else if (typeof callback === 'function') {
			callback(); // Prevents hanging if a callback is required
		}
	};
}
