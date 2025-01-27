import type { TestContext } from "./types";

/**
 * Singleton class to manage test context across environments
 */
class TestContextManager {
	private context: TestContext = {
		name: "",
		assertions: [],
		startTime: 0,
		endTime: null,
		duration: null,
	};

	get current(): TestContext {
		return this.context;
	}

	set current(ctx: TestContext) {
		this.context = ctx;
	}

	reset() {
		this.context = {
			name: "",
			assertions: [],
			startTime: 0,
			endTime: null,
			duration: null,
		};
	}

	addAssertion(code: string) {
		this.context.assertions.push(code);
	}
}

export const testContext = new TestContextManager();
