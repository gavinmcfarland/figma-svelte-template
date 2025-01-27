import path from 'path';
import fs from 'fs';

export default function deleteDistOnError(options, platform) {
	return {
		name: 'delete-dist-on-error',

		// Handle deletion in build mode
		buildEnd(error) {
			if (error) {
				deleteFile(options, platform);
			}
		},

		resolveId(source, importer) {
			try {
				// If the resolution fails, throw an error to trigger deletion
				if (!fs.existsSync(path.resolve(source))) {
					throw new Error(`Failed to resolve: ${source}`);
				}
				return null; // Let Vite continue to resolve normally if the file exists
			} catch (error) {
				deleteFile(options, platform);
				// throw error; // Re-throw to make Vite aware of the error
			}
		},
	};
}

// Helper function to handle deletion logic
function deleteFile(options, platform) {
	let file;
	if (platform === 'ui') {
		file = 'ui.html';
	} else if (platform === 'main') {
		file = 'main.js';
	}

	const distFilePath = path.resolve(path.join(process.cwd(), options.output, file));
	if (fs.existsSync(distFilePath)) {
		fs.unlinkSync(distFilePath);
		// console.warn(`Deleted ${distFilePath} due to an error.`);
	} else {
		// console.error(`File not found: ${distFilePath}`);
	}
}
