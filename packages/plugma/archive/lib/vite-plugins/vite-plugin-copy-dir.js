// vite-plugin-copy-directory.js
import fs from 'fs';
import path from 'path';


function removeDirectory(dirPath) {
	if (fs.existsSync(dirPath)) {
		const files = fs.readdirSync(dirPath);

		for (const file of files) {
			const filePath = path.join(dirPath, file);
			if (fs.statSync(filePath).isDirectory()) {
				// Recursively remove subdirectories
				removeDirectory(filePath);
			} else {
				// Remove files
				fs.unlinkSync(filePath);
			}
		}
		fs.rmdirSync(dirPath); // Remove the directory itself
	}
}

function copyDirectory(source, destination) {
	if (!fs.existsSync(destination)) {
		fs.mkdirSync(destination);
	}

	const files = fs.readdirSync(source);

	for (const file of files) {
		const sourcePath = path.join(source, file);
		const destPath = path.join(destination, file);

		if (fs.statSync(sourcePath).isDirectory()) {
			// Recursively copy subdirectories
			copyDirectory(sourcePath, destPath);
		} else {
			// Check if file is named 'index.html'
			if (file === 'index.html') {
				// Rename 'index.html' to 'ui.html' during copy
				fs.copyFileSync(sourcePath, path.join(destination, 'ui.html'));
			} else {
				// Copy files other than 'index.html'
				fs.copyFileSync(sourcePath, destPath);
			}
		}
	}

	// Remove all directories within the destination directory
	const subdirs = fs.readdirSync(destination);
	for (const subdir of subdirs) {
		const subdirPath = path.join(destination, subdir);
		if (fs.statSync(subdirPath).isDirectory()) {
			removeDirectory(subdirPath);
		}
	}
}


export default function viteCopyDirectoryPlugin({ sourceDir, targetDir }) {
	return {
		name: 'vite-plugin-copy-dir',
		apply: 'build',
		writeBundle() {
			copyDirectory(sourceDir, targetDir);
		},
	};
}
