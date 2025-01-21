import chalk from "chalk";
import { formatTime } from "../../scripts/utils.js";
import path from 'path';

export function logFileUpdates() {
	let isInitialBuild = true
	let root = '';
	return {
		name: 'log-file-updates',
		configResolved(config) {
			root = config.root; // Capture the root directory from the Vite config
		},
		// async buildStart() {
		// 	console.log("Starting Vite build...");
		// },
		// async handleHotUpdate({ file, timestamp }) {
		// 	console.log(`[vite] File updated: ${file} at ${new Date(timestamp).toLocaleTimeString()}`);
		// },
		// buildStart() {
		// 	console.log("Vite build started.");
		// },

		async transform(code, id) {
			if (!isInitialBuild) {
				const relativePath = path.relative(root, id);

				console.log('\n'.repeat(process.stdout.rows - 2))

				process.stdout.write('\x1B[H')
				console.log(chalk.grey(formatTime()) + chalk.cyan(chalk.bold(' [vite]')) + chalk.green(' main built') + chalk.grey(` /${relativePath}`))
			}
			return code;
		},
		closeBundle() {
			// First build complete
			isInitialBuild = false;
			// console.log("Vite build completed.");
		},
	};
}
