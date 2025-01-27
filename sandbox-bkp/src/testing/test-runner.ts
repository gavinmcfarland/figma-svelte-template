import { test as vitestTest } from "vitest";
import { disableLoggger as logger } from "./logger";
import type { TestFn } from "./types";
import { executeAssertions } from "./expect";
import { testClient } from "./ws-client";
import { registry } from "./registry";

/**
 * Configuration for test execution
 */
const TEST_CONFIG = {
	timeout: 30000, // 30 seconds
} as const;

/**
 * Error class for test timeouts
 */
class TestTimeoutError extends Error {
	constructor(testName: string) {
		super(`Test "${testName}" timed out after ${TEST_CONFIG.timeout}ms`);
		this.name = "TestTimeoutError";
	}
}

/**
 * Error class for test execution errors
 */
class TestExecutionError extends Error {
	constructor(
		message: string,
		public readonly testName: string,
		public readonly pluginState?: unknown,
		public readonly originalError?: Error,
	) {
		super(message);
		this.name = "TestExecutionError";

		// Preserve the original stack trace if available
		if (originalError?.stack) {
			this.stack = originalError.stack;
		}
	}
}

/**
 * Wraps a promise with a timeout
 * @param promise The promise to wrap
 * @param timeoutMs Timeout in milliseconds
 * @param testName Name of the test (for error messages)
 */
async function withTimeout<T>(
	promise: Promise<T>,
	timeoutMs: number,
	testName: string,
): Promise<T> {
	let timeoutId: ReturnType<typeof setTimeout>;

	const timeoutPromise = new Promise<never>((_, reject) => {
		timeoutId = setTimeout(() => {
			reject(new TestTimeoutError(testName));
		}, timeoutMs);
	});

	return Promise.race([promise, timeoutPromise])
		.then((result) => {
			clearTimeout(timeoutId);
			return result;
		})
		.catch((error) => {
			clearTimeout(timeoutId);
			throw error;
		});
}

/**
 * Wraps Vitest's test function to execute tests in Figma
 * @param name The name of the test
 * @param fn The test function to register
 */
export const test: TestFn = async (name, fn) => {
	if (typeof figma !== "undefined") {
		registry.register(name, fn);
		return;
	}

	if (!vitestTest) {
		throw new Error("Vitest is not available in this environment");
	}

	// In Node: Create a Vitest test that sends a message to Figma
	return vitestTest(name, TEST_CONFIG, async () => {
		logger.debug("Running test:", name);
		const testRunId = `${name}-${Date.now()}`;
		let assertionCode: string | null = null;

		try {
			// Setup handler before sending the message
			const assertionsPromise = new Promise<void>((resolve, reject) => {
				testClient.waitForTestResult(testRunId).then(
					(response) => {
						if (response.type === "TEST_ASSERTIONS") {
							assertionCode = response.assertionCode;
							resolve();
						} else {
							reject(
								new TestExecutionError(
									response.error,
									name,
									response.pluginState,
									response.originalError,
								),
							);
						}
					},
					(error) => reject(error),
				);
			});

			const runTestMessage = {
				type: "RUN_TEST" as const,
				testName: name,
				testRunId,
			};

			logger.debug("[test-runner] 📮 RUN_TEST:", runTestMessage);

			// Send the message and wait for assertions
			await testClient.send(runTestMessage);
			await withTimeout(assertionsPromise, TEST_CONFIG.timeout, name);

			if (assertionCode) {
				executeAssertions(assertionCode.split(";\n").filter(Boolean));
			}
		} catch (error) {
			if (error instanceof TestTimeoutError) {
				logger.error("Test timed out:", error.message);
				await testClient.send({
					type: "CANCEL_TEST",
					testName: name,
					testRunId: testRunId,
					reason: "timeout",
				});
				throw error;
			}

			// If it's already a TestExecutionError, just rethrow it
			if (error instanceof TestExecutionError) {
				logger.error("Test execution failed:", {
					message: error.message,
					testName: error.testName,
					pluginState: error.pluginState,
					stack: error.stack,
				});
				throw error;
			}

			// Otherwise wrap the error with additional context
			logger.error("Error running test:", error);
			throw new TestExecutionError(
				error instanceof Error ? error.message : String(error),
				name,
				undefined,
				error instanceof Error ? error : undefined,
			);
		}
	});
};

// Alias for test
export const it = test;
