import type { TestContext } from "./types";
import { testContext } from "./test-context";

import { disableLoggger as logger } from "./logger";
import { expect as vitestExpect } from "vitest";

/**
 * Global test context to track assertions
 */
export const currentTest: TestContext = {
	name: "",
	assertions: [],
	startTime: 0,
	endTime: null,
	duration: null,
};

/**
 * Type-safe proxy handler for assertion chain recording
 */
type ProxyHandler<T> = {
	get(_target: T, prop: string | symbol): unknown;
	apply(_target: T, _thisArg: unknown, args: unknown[]): unknown;
};

/**
 * Serializes a value for assertion code generation
 */
function serializeValue(value: unknown): string {
	if (value && typeof value === "object") {
		if ("type" in value) {
			return `"${value.type}"`;
		}
		if ("id" in value) {
			return `"${value.id}"`;
		}
		return JSON.stringify(value);
	}
	if (typeof value === "string" && value.startsWith("test-id-")) {
		return `"${value}"`;
	}
	return JSON.stringify(value);
}

/**
 * Creates a proxy that generates assertion code strings
 * @param value The value to assert on
 * @returns A proxy that generates assertion code
 */
function createAssertionProxy(value: unknown): Chai.Assertion {
	logger.debug("Creating assertion proxy for:", value);
	let code = `expect(${serializeValue(value)})`;
	let isChaining = false;
	let chainComplete = false;

	const handler: ProxyHandler<() => void> = {
		get(_target, prop) {
			if (typeof prop === "symbol") return undefined;
			if (prop === "then") return undefined; // Handle async
			if (prop === "toString") return () => code;

			logger.debug("Recording property access:", String(prop));
			code += `.${String(prop)}`;

			// Set chaining flag for certain properties
			if (["that", "which", "and"].includes(String(prop))) {
				isChaining = true;
			}

			return proxy;
		},
		apply(_target, _thisArg, args) {
			logger.debug("Recording method call with args:", args);
			code += `(${args.map((arg) => serializeValue(arg)).join(", ")})`;

			// Get the method name from the code
			const methodName = code.split(".").pop()?.split("(")[0] || "";

			// If this is a terminal assertion method, add it to the context
			if (
				!["be", "have", "to", "an", "a", "that", "which", "and"].includes(
					methodName,
				)
			) {
				logger.debug("Adding assertion to test:", code);
				testContext.addAssertion(code);
				// Reset for next assertion
				isChaining = false;
				chainComplete = false;
				code = `expect(${serializeValue(value)})`;
			} else {
				// Set chaining flag for non-terminal methods
				isChaining = true;
			}

			return proxy;
		},
	};

	const proxy = new Proxy<() => void>(() => {}, handler);
	return proxy as unknown as Chai.Assertion;
}

/**
 * Modified expect function that generates assertion code strings
 * @param value The value to assert on
 */
export const expect: Chai.ExpectStatic = ((value: unknown) => {
	logger.debug("Creating expectation for:", value);
	return createAssertionProxy(value);
}) as unknown as Chai.ExpectStatic;

/**
 * Executes assertion code strings in Vitest context
 * @param assertions Array of assertion code strings to execute
 */
export function executeAssertions(assertions: string[]): void {
	logger.debug("Starting assertion execution", { count: assertions.length });

	for (const code of assertions) {
		logger.debug("Executing assertion:", code);

		try {
			// Create a function with the assertion code
			const assertFn = new Function("expect", code);
			// Execute it with Vitest's expect
			assertFn(vitestExpect);
			logger.debug("Assertion executed successfully");
		} catch (error) {
			logger.error("Assertion failed:", error);
			throw error;
		}
	}

	logger.debug("Completed assertion execution");
}
