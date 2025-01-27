/// <reference types="chai" />

declare global {
	var currentTest: TestContext;
}

/**
 * Re-export of Chai's ExpectStatic type
 */
export type Expect = Chai.ExpectStatic;

/**
 * Configuration for test execution
 */
export interface TestConfig {
	/** Timeout for test execution in milliseconds */
	timeout: number;
	/** Whether to enable debug logging */
	debug?: boolean;
	/** Default indent level for logs */
	defaultIndentLevel?: number;
}

/**
 * Configuration for WebSocket client
 */
export interface WebSocketConfig {
	/** WebSocket server URL */
	url: string;
	/** Timeout for message responses in milliseconds */
	timeout: number;
	/** Delay between reconnection attempts in milliseconds */
	retryDelay: number;
}

/**
 * Lifecycle hook functions
 */
export interface TestHooks {
	/** Called before any tests are run */
	beforeAll?: () => Promise<void> | void;
	/** Called after all tests are complete */
	afterAll?: () => Promise<void> | void;
	/** Called before each test */
	beforeEach?: () => Promise<void> | void;
	/** Called after each test */
	afterEach?: () => Promise<void> | void;
}

/**
 * Message types for test communication
 */
export type TestMessage =
	| { type: "REGISTER_TEST"; testName: string; fnString: string }
	| { type: "RUN_TEST"; testName: string; testRunId: string }
	| { type: "CANCEL_TEST"; testName: string; testRunId: string; reason: string }
	| { type: "TEST_ASSERTIONS"; testRunId: string; assertionCode: string }
	| {
			type: "TEST_ERROR";
			testRunId: string;
			error: string;
			pluginState?: unknown;
			originalError?: Error;
	  }
	| { type: "BEFORE_ALL" }
	| { type: "AFTER_ALL" }
	| { type: "BEFORE_EACH"; testName: string }
	| { type: "AFTER_EACH"; testName: string };

/**
 * Context for tracking the current test execution
 */
export interface TestContext {
	/** The name of the test being executed */
	name: string;
	/** Array of assertion code strings */
	assertions: string[];
	/** Timestamp when the test started */
	startTime: number;
	/** Timestamp when the test ended */
	endTime: number | null;
	/** Duration of the test in milliseconds */
	duration: number | null;
}

/**
 * Test function signature
 */
export type TestFn = (
	name: string,
	fn: () => void | Promise<void>,
) => void | Promise<void>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: TestConfig = {
	timeout: 30000, // 30 seconds
	debug: process.env.NODE_ENV === "development",
	defaultIndentLevel: 1,
} as const;

/**
 * Default WebSocket configuration
 */
export const DEFAULT_WS_CONFIG: WebSocketConfig = {
	url: "ws://localhost:9001",
	timeout: 30000, // 30 seconds
	retryDelay: 1000, // 1 second
} as const;
