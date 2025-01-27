import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vite.dev/config/
export default defineConfig(() => {
	const isTesting = process.env.NODE_ENV === 'testing';

	return {
		plugins: [
			svelte(),
			{
				name: 'replace-vitest',
				transform(code, id) {
					if (!isTesting && id.includes('test-runner.ts')) {
						// Replace the vitest import with a mock during build
						return code.replace(
							'import { test as vitestTest } from "vitest"',
							'const vitestTest = undefined'
						);
					}
				}
			}
		],
		resolve: {
			alias: {
				"#testing": "./src/testing/index.ts",
				"#testing/*": "./src/testing/*",
			}
		}
	}
});
