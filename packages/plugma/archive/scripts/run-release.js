import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import process from 'process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL(".", import.meta.url));

// Utility function to copy directory contents recursively
async function copyDirectory(src, dest) {
	await fs.mkdir(dest, { recursive: true });
	const entries = await fs.readdir(src, { withFileTypes: true });

	for (const entry of entries) {
		const srcPath = path.join(src, entry.name);
		const destPath = path.join(dest, entry.name);

		entry.isDirectory()
			? await copyDirectory(srcPath, destPath)
			: await fs.copyFile(srcPath, destPath);
	}
}

export async function runRelease(command, options) {
	// Check if the working directory is dirty
	try {
		const uncommittedChanges = execSync('git diff --name-only', { encoding: 'utf8' }).trim();
		const stagedChanges = execSync('git diff --name-only --cached', { encoding: 'utf8' }).trim();

		if (uncommittedChanges || stagedChanges) {
			console.error('Error: Working directory has uncommitted changes. Please commit or stash them before proceeding.');
			process.exit(1);
		}
	} catch (err) {
		console.error('Error checking Git status:', err);
		process.exit(1);
	}

	// Ensure the template is copied from `templates/github/` to `.github/` if not present
	const templateDir = path.join(__dirname, '../templates', 'github', 'workflows'); // Path to template in npm package
	const githubDir = path.join(process.cwd(), '.github', 'workflows'); // Path to user's .github/ folder
	const releaseFile = path.join(githubDir, 'plugma-create-release.yml');

	try {
		const templateExists = await fs.stat(templateDir);
		if (!templateExists) {
			throw new Error(`Template directory ${templateDir} not found.`);
		}

		const githubExists = await fs.stat(githubDir).catch(() => null); // Check if .github/ exists
		if (!githubExists) {
			console.log(`.github/ directory not found. Copying templates to ${githubDir}...`);
			await copyDirectory(templateDir, githubDir); // Ensure entire directory is copied
			console.log('Templates copied successfully.');
		} else {
			// Check each template file for updates and copy if necessary
			const files = await fs.readdir(templateDir);
			for (const file of files) {
				const sourceFile = path.join(templateDir, file);
				const destinationFile = path.join(githubDir, file);
				await copyIfOutOfDate(sourceFile, destinationFile);
			}
		}

		// Check if `plugma-create-release.yml` was added or updated and create a separate commit
		const releaseFileExists = await fs.stat(releaseFile).catch(() => null);
		if (releaseFileExists) {
			try {
				// Check if there are any staged changes for the release file
				const releaseFileChanges = execSync(`git diff --name-only --staged ${releaseFile}`, { encoding: 'utf8' }).trim();

				if (releaseFileChanges) {
					execSync('git add .github/workflows/plugma-create-release.yml', { stdio: 'inherit' });
					execSync('git commit -m "Add or update plugma-create-release.yml"', { stdio: 'inherit' });
					console.log('plugma-create-release.yml added or updated and committed.');
				}
			} catch (err) {
				console.error('Error committing plugma-create-release.yml:', err);
				process.exit(1);
			}
		}

	} catch (err) {
		console.error(`Error copying GitHub templates: ${err.message}`);
		process.exit(1);
	}

	// Check if the current directory is a Git repository
	try {
		execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
	} catch (err) {
		console.error('Error: This is not a Git repository. Please initialize a Git repository before proceeding.');
		process.exit(1);
	}

	// Check if a manual version is provided, otherwise fallback to releaseType
	const manualVersion = options.version;
	const releaseType = options.type || 'stable';
	const releaseTitle = options.title
	const releaseNotes = options.notes



	// Locate the package.json file
	const packageJsonPath = path.resolve(process.cwd(), 'package.json');
	let version;
	let newTag;

	try {
		const packageJsonData = await fs.readFile(packageJsonPath, 'utf8');
		const packageJson = JSON.parse(packageJsonData);

		// Initialize plugma.pluginVersion if not present
		if (!packageJson.plugma) {
			packageJson.plugma = {};
		}
		if (!packageJson.plugma.pluginVersion) {
			packageJson.plugma.pluginVersion = '0'; // Default initial version
			console.log('No plugma.pluginVersion found. Initializing it to 0.');
		}

		version = packageJson.plugma.pluginVersion;

		// For alpha or beta releases
		let baseVersion = version;

		if (manualVersion) {
			newTag = `v${manualVersion}`;
		} else if (releaseType === 'stable') {
			const newVersion = parseInt(version) + 1;
			newTag = `v${newVersion}`;
		} else {
			// Extract the base version and sub-version
			const existingTagMatch = version.match(/^(.*?)-(alpha|beta)\.(\d+)$/);
			if (existingTagMatch) {
				baseVersion = existingTagMatch[1]; // Get the base version (e.g., '6')
			}

			// Increment subversion based on the current package.json `plugma.pluginVersion`
			const versionParts = version.split('-');
			let subVersion = 0;

			if (versionParts.length === 2) {
				const [base, suffix] = versionParts;
				const [releaseType, subVersionStr] = suffix.split('.');
				subVersion = parseInt(subVersionStr, 10) + 1; // Increment subversion
				newTag = `v${base}-${releaseType}.${subVersion}`;
			} else {
				// If there is no subversion, start from 0
				newTag = `v${baseVersion}-${releaseType}.0`;
			}
		}

		// Update version in package.json before committing
		if (manualVersion) {
			packageJson.plugma.pluginVersion = manualVersion;
		} else if (releaseType === 'stable') {
			packageJson.plugma.pluginVersion = `${parseInt(version) + 1}`;
		} else {
			const subVersion = newTag.match(/-(alpha|beta)\.(\d+)$/)[2];
			packageJson.plugma.pluginVersion = `${baseVersion}-${releaseType}.${subVersion}`;
		}

		await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
		console.log(`Version successfully updated to ${newTag} in package.json`);

	} catch (err) {
		console.error(`Error reading or updating package.json:`, err);
		process.exit(1);
	}

	// Stage changes for commit
	try {
		execSync('git add package.json .github', { stdio: 'inherit' });

		// Check if there are changes to commit
		const changes = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
		if (changes) {
			// Commit changes to package to repo
			execSync(`git add .`, { stdio: 'inherit' });
			execSync(`git commit -m "Plugin version updated"`, { stdio: 'inherit' });

			// Try pushing the changes
			try {

				// Build the tag message conditionally with markers
				let tagMessage = '';
				if (releaseTitle) {
					tagMessage += `TITLE: ${releaseTitle}`; // Add TITLE marker
				}
				if (releaseNotes) {
					if (tagMessage) {
						tagMessage += '\n\n'; // Add space between title and notes if both are present
					}
					tagMessage += `NOTES: ${releaseNotes}`; // Add NOTES marker
				}

				// Run the git tag command
				if (tagMessage) {
					execSync(`git tag ${newTag} -m "${tagMessage}"`, { stdio: 'inherit' });
				} else {
					// Create the tag without a message if no title or notes are provided
					execSync(`git tag ${newTag}`, { stdio: 'inherit' });
				}

				execSync('git push', { stdio: 'inherit' });
				execSync(`git push origin ${newTag}`, { stdio: 'inherit' });
				console.log(`Successfully committed, tagged, and pushed: ${newTag}`);
				execSync('plugma build', { stdio: 'inherit' });

			} catch (err) {
				console.error('Error during git push, reverting the last commit...', err);
				// Revert the last commit
				execSync('git reset --hard HEAD^', { stdio: 'inherit' });
				process.exit(1);
			}
		} else {
			console.log('No changes to commit.');
		}
	} catch (err) {
		console.error('Error committing or pushing to Git:', err);
		process.exit(1);
	}
}

async function setGitHubEnv(key, value) {
	const githubEnvPath = process.env.GITHUB_ENV; // Get the path to GITHUB_ENV file
	if (githubEnvPath) {
		await fs.appendFile(githubEnvPath, `${key}=${value}\n`);
	} else {
		console.error('GITHUB_ENV is not defined.');
		process.exit(1);
	}
}

async function copyIfOutOfDate(source, destination) {
	try {
		const sourceStats = await fs.stat(source);
		const destinationStats = await fs.stat(destination).catch(() => null);

		if (!destinationStats || sourceStats.mtime > destinationStats.mtime) {
			console.log(`Copying template from ${source} to ${destination}...`);
			await fs.copyFile(source, destination);
			console.log(`Template copied successfully: ${path.basename(source)}`);
			return true; // File was copied or updated
		}
	} catch (err) {
		console.error(`Error copying file from ${source} to ${destination}:`, err);
	}
	return false; // No update
}
