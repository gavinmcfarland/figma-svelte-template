/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from "vitest";
import { registry } from "../../registry";
import { testCases } from "../__fixtures__/test-cases";
import { setupTestEnv } from "../test-utils";

describe("registry.ts", () => {
	beforeEach(() => {
		setupTestEnv();
		registry.clear();
	});

	describe("test registration", () => {
		it("registers tests with unique names", () => {
			const fn = new Function("plugmaExpect", "context", testCases.basic.fn);
			registry.register(testCases.basic.name, fn);
			expect(registry.has(testCases.basic.name)).toBe(true);
		});

		it("prevents duplicate test names", () => {
			const fn = new Function("plugmaExpect", "context", testCases.basic.fn);
			registry.register(testCases.basic.name, fn);
			expect(() => registry.register(testCases.basic.name, fn)).toThrow(
				"Test already registered",
			);
		});

		it("validates test function format", () => {
			expect(() => registry.register("invalid", null as any)).toThrow(
				"Test function must be a function",
			);
		});
	});

	describe("test context", () => {
		it("creates proper test context", () => {
			const fn = new Function("plugmaExpect", "context", testCases.basic.fn);
			registry.register(testCases.basic.name, fn);
			const context = registry.createContext(testCases.basic.name);
			expect(context).toEqual({
				name: testCases.basic.name,
				assertions: [],
				startTime: 0,
				endTime: null,
				duration: null,
			});
		});

		it("tracks test timing correctly", async () => {
			const fn = new Function("plugmaExpect", "context", testCases.async.fn);
			registry.register(testCases.async.name, fn);
			const result = await registry.runTest(testCases.async.name);
			expect(result.startTime).toBeGreaterThan(0);
			expect(result.endTime).toBeGreaterThan(result.startTime);
			expect(result.duration).toBeGreaterThan(0);
		});

		it("manages assertion collection", async () => {
			const fn = new Function(
				"plugmaExpect",
				"context",
				testCases.manyAssertions.fn,
			);
			registry.register(testCases.manyAssertions.name, fn);
			const result = await registry.runTest(testCases.manyAssertions.name);
			expect(result.assertions).toHaveLength(4);
		});
	});

	describe("test execution", () => {
		it("executes test function", async () => {
			const fn = new Function("plugmaExpect", "context", testCases.basic.fn);
			registry.register(testCases.basic.name, fn);
			const result = await registry.runTest(testCases.basic.name);
			expect(result.error).toBeNull();
		});

		it("handles test errors", async () => {
			const fn = new Function("plugmaExpect", "context", testCases.error.fn);
			registry.register(testCases.error.name, fn);
			const result = await registry.runTest(testCases.error.name);
			expect(result.error).toBeDefined();
			expect(result.error?.message).toBe("Test error");
		});

		it("cleans up after test execution", async () => {
			const fn = new Function("plugmaExpect", "context", testCases.basic.fn);
			registry.register(testCases.basic.name, fn);
			await registry.runTest(testCases.basic.name);
			expect(globalThis.currentTest).toEqual({ assertions: [] });
		});
	});
});
