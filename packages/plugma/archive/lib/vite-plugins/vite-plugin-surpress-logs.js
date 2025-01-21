export default function viteSupressLogs(options) {
	return {
		name: 'suppress-logs',
		apply: 'serve',
		configResolved() {
			const originalLog = console.log;
			const originalStdoutWrite = process.stdout.write;

			const suppressedPatterns = [
				'modules transformed',
				'gzip',
				'built in',
				'build started',
				'watching for file changes...',
				'transforming'
			];

			// Suppress specific logs in `console.log`
			console.log = (...args) => {
				const message = args.join(' ');
				if (!suppressedPatterns.some(pattern => message.includes(pattern))) {
					originalLog(...args);
				}
			};

			// Suppress specific logs in `process.stdout.write`
			process.stdout.write = (chunk, encoding, callback) => {
				const message = chunk.toString();
				if (!suppressedPatterns.some(pattern => message.includes(pattern))) {
					originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
				} else if (typeof callback === 'function') {
					callback(); // Prevents hanging if callback is required
				}
			};
		},
	}
}
