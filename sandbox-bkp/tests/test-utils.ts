import { expect, vi } from "vitest";
import { mockFigma, MockNode } from "./__mocks__/figma";
import { MockWebSocket } from "./__mocks__/ws-server";
import type { TestMessage, TestContext } from "#testing";
import { testContext } from "#testing/test-context";

/**
 * Setup test environment
 */
export async function setupTestEnv() {
	// Reset all mocks
	MockWebSocket.reset();
	MockNode.resetIdCounter();
	global.figma = mockFigma;

	// Use testContext instead of globalThis
	testContext.current = {
		name: "",
		assertions: [],
		startTime: 0,
		endTime: null,
		duration: null,
	};

	// Create and return a new WebSocket instance
	const ws = MockWebSocket.getInstance("ws://localhost:9001");

	// Run timers to establish connection
	await vi.runAllTimersAsync();

	// Ensure the WebSocket is in OPEN state
	if (ws.readyState !== WebSocket.OPEN) {
		throw new Error("WebSocket not in OPEN state after setup");
	}

	return {
		ws,
		figma: mockFigma,
	};
}

/**
 * Wait for a specific message type from WebSocket
 */
export function waitForMessage<T extends TestMessage["type"]>(
	ws: MockWebSocket,
	type: T,
	timeout = 1000,
) {
	return new Promise<TestMessage>((resolve, reject) => {
		const timer = setTimeout(() => {
			reject(new Error(`Timeout waiting for message type: ${type}`));
		}, timeout);

		const handler = (event: { data: string }) => {
			const message = JSON.parse(event.data);
			if (message.type === type) {
				clearTimeout(timer);
				ws.removeListener("message", handler);
				resolve(message);
			}
		};

		ws.on("message", handler);
	});
}

/**
 * Create a test node hierarchy
 */
export function createNodeTree() {
	const root = new MockNode();
	root.type = "FRAME";
	root.name = "Root";

	const child1 = new MockNode();
	child1.type = "RECTANGLE";
	child1.name = "Child 1";
	root.appendChild(child1);

	const child2 = new MockNode();
	child2.type = "FRAME";
	child2.name = "Child 2";
	root.appendChild(child2);

	const grandchild = new MockNode();
	grandchild.type = "RECTANGLE";
	grandchild.name = "Grandchild";
	child2.appendChild(grandchild);

	return { root, child1, child2, grandchild };
}

/**
 * Verify assertion code string
 */
export function verifyAssertion(code: string, expected: string) {
	// Remove whitespace and normalize quotes
	const normalize = (s: string) => s.replace(/\s+/g, "").replace(/['"]/g, '"');
	expect(normalize(code)).toBe(normalize(expected));
}

/**
 * Wait for a specific amount of time
 */
export function wait(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
