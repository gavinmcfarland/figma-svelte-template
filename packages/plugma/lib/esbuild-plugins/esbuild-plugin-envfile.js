import { readFileSync, existsSync } from 'fs';
import dotenv from 'dotenv';
import path from 'path';

const proxyCode = `
globalThis.process = globalThis.process || {};
globalThis.process.env = new Proxy(globalThis.process.env || {}, {
  get: (target, prop) => {
    return prop in target ? target[prop] : undefined;
  }
});
`;

const envfilePlugin = (options = {}) => {
	const { envPath = '.env', envTestPath = '.env.test', envDevelopmentPath = '.env.development', defaultEnv = 'development' } = options;

	// Determine which environment file to load based on process.env.NODE_ENV
	const getEnvFile = () => {
		if (process.env.NODE_ENV === 'test' && existsSync(envTestPath)) {
			return envTestPath;
		} else if (process.env.NODE_ENV === 'development' && existsSync(envDevelopmentPath)) {
			return envDevelopmentPath;
		} else if (existsSync(envPath)) {
			return envPath;
		}
		return null;
	};

	return {
		name: 'envfile',
		setup(build) {
			const envFile = getEnvFile();

			// Load environment variables from the appropriate file
			if (envFile) {
				const envConfig = dotenv.parse(readFileSync(envFile));
				for (const key in envConfig) {
					if (!process.env[key]) {
						process.env[key] = envConfig[key];
					}

					// Define each environment variable for esbuild
					build.initialOptions.define = {
						...build.initialOptions.define,
						[`process.env.${key}`]: JSON.stringify(process.env[key]),
					};
				}
			}

			// Inject the proxyCode at the start of the bundle
			build.onLoad({ filter: /\.(js|ts)$/ }, async (args) => {
				const source = readFileSync(args.path, 'utf8');
				return {
					contents: proxyCode + '\n' + source,
					loader: 'default',
				};
			});
		},
	};
};

export default envfilePlugin;
