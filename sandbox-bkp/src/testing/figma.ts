import { registry } from "./registry";

export * from "./expect";

export function test(name: string, fn: () => void) {
	if (typeof figma !== "undefined") {
		throw new Error(
			'The function `test` from "#testing/figma" is meant to be used in the plugin.' +
				'Did you mean to import `test` from "#testing"?',
		);
	}

	registry.register(name, fn);
}
