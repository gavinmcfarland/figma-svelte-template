import { resolve, join } from "node:path";
import { existsSync, unlinkSync } from "node:fs";
import type { Plugin } from "vite";

interface DeleteDistOptions {
	output: string;
	[key: string]: unknown;
}

type Platform = "ui" | "main";

/**
 * Helper function to handle deletion of output files on error
 *
 * @param options - Configuration options containing output directory
 * @param platform - The platform target ('ui' or 'main')
 */
function deleteFile(options: DeleteDistOptions, platform: Platform): void {
	const file = platform === "ui" ? "ui.html" : "main.js";
	const distFilePath = resolve(join(process.cwd(), options.output, file));

	if (existsSync(distFilePath)) {
		unlinkSync(distFilePath);
		// console.warn(`Deleted ${distFilePath} due to an error.`);
	} else {
		// console.error(`File not found: ${distFilePath}`);
	}
}

/**
 * A Vite plugin that deletes output files when build errors occur
 *
 * @param options - Configuration options containing output directory
 * @param platform - The platform target ('ui' or 'main')
 * @returns A Vite plugin configuration object
 */
export default function deleteDistOnError(
	options: DeleteDistOptions,
	platform: Platform,
): Plugin {
	return {
		name: "delete-dist-on-error",

		// Handle deletion in build mode
		buildEnd(error?: Error | null) {
			if (error) {
				deleteFile(options, platform);
			}
		},

		resolveId(source: string): null {
			try {
				// If the resolution fails, throw an error to trigger deletion
				if (!existsSync(resolve(source))) {
					throw new Error(`Failed to resolve: ${source}`);
				}
				return null; // Let Vite continue to resolve normally if the file exists
			} catch (error) {
				deleteFile(options, platform);
				// throw error; // Re-throw to make Vite aware of the error
				return null;
			}
		},
	};
}
