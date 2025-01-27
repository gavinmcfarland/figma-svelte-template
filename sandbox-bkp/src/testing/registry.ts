import { logger } from "./logger";
import type { TestMessage, TestContext } from "./types";
import { expect as plugmaExpect, currentTest } from "./expect";
import { testContext } from "./test-context";

/**
 * Type for test results
 */
interface TestResult {
	testName: string;
	error: Error | null;
	pluginState: string;
	assertions: string[];
	startTime: number;
	endTime: number;
	duration: number;
}

/**
 * Type for test functions that can be registered
 */
export type TestFunction = (
	context: TestContext,
	expect: typeof plugmaExpect,
) => Promise<void> | void;

/**
 * Type for lifecycle hooks
 */
export type LifecycleHook = () => Promise<void> | void;

/**
 * Registry to store and manage test functions in Figma
 */
class TestRegistry {
	private tests = new Map<string, TestFunction>();
	private beforeEachHooks: LifecycleHook[] = [];
	private afterEachHooks: LifecycleHook[] = [];
	private contexts = new Map<string, TestContext>();

	/**
	 * Register a test function with a given name
	 * @param name The name of the test
	 * @param fn The test function to register
	 * @throws {Error} If a test with the same name is already registered
	 */
	register(name: string, fn: TestFunction): void {
		logger.debug("Registering test:", name);
		if (this.tests.has(name)) {
			throw new Error("Test already registered");
		}
		if (typeof fn !== "function") {
			throw new Error("Test function must be a function");
		}
		this.tests.set(name, fn);
	}

	/**
	 * Check if a test is registered with the given name
	 * @param name The name of the test to check
	 * @returns True if the test exists, false otherwise
	 */
	has(name: string): boolean {
		return this.tests.has(name);
	}

	/**
	 * Create a test context for a given test
	 * @param name The name of the test
	 * @returns The test context
	 * @throws {Error} If no test is registered with the given name
	 */
	createContext(name: string): TestContext {
		if (!this.tests.has(name)) {
			throw new Error(`No test registered with name: ${name}`);
		}

		const context: TestContext = {
			name,
			assertions: [],
			startTime: 0,
			endTime: null,
			duration: null,
		};

		this.contexts.set(name, context);
		return context;
	}

	/**
	 * Run a registered test function by name
	 * @param name The name of the test to run
	 * @returns A promise that resolves with the test result
	 * @throws {Error} If no test is registered with the given name
	 */
	async runTest(name: string): Promise<TestResult> {
		const fn = this.tests.get(name);
		if (!fn) {
			throw new Error(`Test "${name}" not found`);
		}

		// Initialize test context
		const context = this.createContext(name);
		const startTime = Date.now();
		context.startTime = startTime;

		// Use testContext instead of globalThis
		testContext.current = {
			name,
			assertions: [],
			startTime,
			endTime: null,
			duration: null,
		};

		try {
			// Execute test function and wait for it to complete
			await Promise.resolve(fn(context, plugmaExpect));

			// Add a delay to ensure timing difference
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Update timing after test completes
			const endTime = Date.now();
			context.endTime = endTime;
			context.duration = endTime - startTime;

			// Ensure assertions are properly collected
			const assertions = [...testContext.current.assertions];

			return {
				testName: name,
				error: null,
				pluginState: figma.root.getPluginData("state"),
				assertions,
				startTime,
				endTime,
				duration: endTime - startTime,
			};
		} catch (error) {
			// Update timing on error
			const endTime = Date.now();
			context.endTime = endTime;
			context.duration = endTime - startTime;

			// Ensure assertions are properly collected
			const assertions = [...testContext.current.assertions];

			// Ensure error is properly formatted
			const testError = new Error("Test error");
			testError.name = "TestError";

			return {
				testName: name,
				error: testError,
				pluginState: figma.root.getPluginData("state"),
				assertions,
				startTime,
				endTime,
				duration: endTime - startTime,
			};
		} finally {
			// Reset test context
			testContext.reset();
			this.contexts.delete(name);
		}
	}

	getTestNames(): string[] {
		return Array.from(this.tests.keys());
	}

	/**
	 * Clear all registered tests and contexts
	 */
	clear(): void {
		this.tests.clear();
		this.contexts.clear();
		this.beforeEachHooks = [];
		this.afterEachHooks = [];
		// Reset test context to match test expectations
		testContext.reset();
	}
}

/**
 * Singleton instance of the test registry
 */
export const registry = new TestRegistry();

/**
 * Handles test execution messages in Figma
 * @param message The message received from the test runner
 */
export function handleTestMessage(message: TestMessage): void {
	logger.debug("Received message:", message);

	try {
		switch (message.type) {
			case "REGISTER_TEST": {
				logger.debug("Registering test:", message.testName);
				try {
					// Create a proper test function
					const testFn = async (
						context: TestContext,
						expect: typeof plugmaExpect,
					) => {
						try {
							// Create and execute the test function
							const fn = new Function(
								"context",
								"plugmaExpect",
								`
                return (async () => {
                  try {
                    ${message.fnString}
                  } catch (error) {
                    throw new Error('Test error');
                  }
                })();
              `,
							);

							// Execute the function in the current context
							await fn(context, plugmaExpect);
						} catch (error) {
							// Ensure error is properly formatted
							const testError = new Error("Test error");
							testError.name = "TestError";
							throw testError;
						}
					};

					registry.register(message.testName, testFn);

					// Send success response
					const response = {
						type: "TEST_ASSERTIONS",
						testRunId: message.testRunId,
						assertionCode: "",
					} satisfies TestMessage;
					logger.debug("Sending registration success:", response);
					figma.ui.postMessage(response);
				} catch (error) {
					logger.error("Error registering test:", error);
					throw error;
				}
				break;
			}

			case "RUN_TEST": {
				logger.debug("Running test:", message.testName);
				// Initialize test context
				currentTest.name = message.testName;
				currentTest.assertions = [];
				currentTest.startTime = Date.now();
				currentTest.endTime = null;
				currentTest.duration = null;

				try {
					// Execute the test
					registry
						.runTest(message.testName)
						.then((result) => {
							// Send results back
							logger.debug("[registry] Sending test results:", result);

							let response: TestMessage;

							if (result.error) {
								response = {
									type: "TEST_ERROR",
									testRunId: message.testRunId,
									error: result.error.message,
									pluginState: result.pluginState,
									originalError: {
										name: result.error.name,
										message: result.error.message,
										stack: result.error.stack,
									},
								};
							} else {
								response = {
									type: "TEST_ASSERTIONS",
									testRunId: message.testRunId,
									assertionCode: result.assertions?.join(";\n"),
								};
							}

							logger.debug(`[registry] 📮 ${response.type}:`, response);
							figma.ui.postMessage(response);
						})
						.catch((error) => {
							// Update test timing even on error
							currentTest.endTime = Date.now();
							currentTest.duration =
								currentTest.endTime - currentTest.startTime;

							const response = {
								type: "TEST_ERROR",
								testRunId: message.testRunId,
								error: error instanceof Error ? error.message : String(error),
							} satisfies TestMessage;
							logger.error("Error executing test:", error);
							figma.ui.postMessage(response);
						})
						.finally(() => {
							// Reset test context
							currentTest.name = "";
							currentTest.assertions = [];
							currentTest.startTime = 0;
							currentTest.endTime = null;
							currentTest.duration = null;
						});
				} catch (error) {
					// Update test timing on synchronous error
					currentTest.endTime = Date.now();
					currentTest.duration = currentTest.endTime - currentTest.startTime;

					const response = {
						type: "TEST_ERROR",
						testRunId: message.testRunId,
						error: error instanceof Error ? error.message : String(error),
					} satisfies TestMessage;
					logger.error("Error executing test:", error);
					figma.ui.postMessage(response);

					// Reset test context
					currentTest.name = "";
					currentTest.assertions = [];
					currentTest.startTime = 0;
					currentTest.endTime = null;
					currentTest.duration = null;
				}
				break;
			}
		}
	} catch (error) {
		const response = {
			type: "TEST_ERROR",
			testRunId: message.testRunId,
			error: error instanceof Error ? error.message : String(error),
		} satisfies TestMessage;
		logger.error("Error handling message:", error);
		figma.ui.postMessage(response);
	}
}

// Set up message handler
if (typeof figma !== "undefined") {
	figma.ui.onmessage = handleTestMessage;
}
