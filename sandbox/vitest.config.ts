import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "jsdom",
		// setupFiles: ['src/test/setup.ts'],
		include: ["src/**/*.test.ts", "tests/*.test.ts"],
	},
});
