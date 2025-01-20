import chalk from "chalk";
import { relative } from "node:path";
import type { Plugin, ResolvedConfig } from "vite";

/**
 * Formats the current time in a readable format (HH:MM:SS AM/PM)
 */
function formatTime(): string {
	const currentDate = new Date();
	let hours = currentDate.getHours();
	const minutes = String(currentDate.getMinutes()).padStart(2, "0");
	const seconds = String(currentDate.getSeconds()).padStart(2, "0");
	const meridiem = hours >= 12 ? "PM" : "AM";
	hours = hours % 12 || 12;
	return `${hours}:${minutes}:${seconds} ${meridiem}`;
}

/**
 * A Vite plugin that logs file updates during the build process
 *
 * @returns A Vite plugin configuration object
 */
export function logFileUpdates(): Plugin {
	let isInitialBuild = true;
	let root = "";

	return {
		name: "log-file-updates",

		configResolved(config: ResolvedConfig) {
			root = config.root; // Capture the root directory from the Vite config
		},

		// async buildStart() {
		//   console.log("Starting Vite build...");
		// },
		// async handleHotUpdate({ file, timestamp }) {
		//   console.log(`[vite] File updated: ${file} at ${new Date(timestamp).toLocaleTimeString()}`);
		// },
		// buildStart() {
		//   console.log("Vite build started.");
		// },

		async transform(code: string, id: string): Promise<string> {
			if (!isInitialBuild) {
				const relativePath = relative(root, id);

				// Clear the terminal screen except for the last two lines
				console.log("\n".repeat(process.stdout.rows - 2));

				// Move cursor to the top of the screen
				process.stdout.write("\x1B[H");

				// Log the build status with formatting
				console.log(
					chalk.grey(formatTime()) +
						chalk.cyan(chalk.bold(" [vite]")) +
						chalk.green(" main built") +
						chalk.grey(` /${relativePath}`),
				);
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
