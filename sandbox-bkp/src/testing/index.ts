/**
 * @module testing
 * Testing module for Plugma
 *
 * This module provides a testing framework that allows running tests in Figma
 * while using Vitest's API and reporting. It handles:
 *
 * - Test execution in Figma's sandbox environment
 * - Assertion tracking and reconstruction
 * - WebSocket communication between Node and Figma
 * - Test result reporting through Vitest
 * - Test lifecycle hooks (before/after)
 * - Timeout handling and error reporting
 *
 * @example
 * ```ts
 * import { test, expect } from 'plugma/testing';
 *
 * test('creates a rectangle', async () => {
 *   const rect = figma.createRectangle();
 *   expect(rect.type).to.equal('RECTANGLE');
 * });
 * ```
 */

// Core testing functionality
export { expect } from "./expect";
export { test, it } from "./test-runner";

// Configuration and types
export {
  type TestConfig,
  type WebSocketConfig,
  type TestHooks,
  type TestContext,
  DEFAULT_CONFIG,
  DEFAULT_WS_CONFIG,
} from "./types";

// Internal types (for plugin development)
export type {
  TestMessage,
  TestFn,
  Expect,
} from "./types";

// Re-export registry for Figma-side
export * from "./registry";
