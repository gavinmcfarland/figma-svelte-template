import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = process.cwd();

export default function dotEnvLoader(options = {}) {
	function parseEnvFile(content) {
		const env = {};
		const lines = content.split('\n');
		lines.forEach((line) => {
			// Ignore comments and empty lines
			if (line.trim() === '' || line.trim().startsWith('#')) return;

			// Split key-value pairs
			const [key, ...valueParts] = line.split('=');
			const value = valueParts.join('=').trim();

			// Remove quotes from value if present
			env[key.trim()] = value.replace(/^['"]|['"]$/g, '');
		});
		return env;
	}

	function loadEnvFiles() {
		const envFiles = [
			path.resolve(rootDir, '.env'),
			path.resolve(rootDir, '.env.local'),               // Default .env
			path.resolve(rootDir, `.env.${process.env.NODE_ENV}`), // Environment-specific .env (e.g., .env.development, .env.production)
			path.resolve(rootDir, `.env.${process.env.NODE_ENV}.local`)             // Local overrides, if any
		];

		const env = { ...process.env };

		delete env['CommonProgramFiles(x86)'];
		delete env['ProgramFiles(x86)'];

		envFiles.forEach((file) => {
			if (fs.existsSync(file)) {
				const content = fs.readFileSync(file, 'utf-8');
				const parsedEnv = parseEnvFile(content);
				Object.assign(env, parsedEnv);
				console.log(`[custom-env-loader] Reloaded environment variables from: ${file}`);
			}
		});

		return env;
	}

	return {
		name: 'custom-env-loader',
		config(config, { command }) {
			// Reload environment variables freshly for each build or serve command
			const env = loadEnvFiles();

			// Log the environment variables to verify they are being loaded correctly
			// console.log('[custom-env-loader] Loaded environment variables:');

			// Return the environment variables to be applied in the build configuration
			return {
				define: {
					...Object.fromEntries(
						Object.entries(env).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
					)
				}
			};
		}
	};
}
