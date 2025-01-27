/// <reference types="vitest" />
import { describe, it, expect, beforeEach } from "vitest";
import { expect as plugmaExpect } from "#testing";
import { setupTestEnv, verifyAssertion } from "../test-utils";
import { mockFigma } from "../__mocks__/figma";

describe("assertion.ts", () => {
	beforeEach(() => {
		setupTestEnv();
	});

	describe("expect proxy", () => {
		it("generates code string for simple equality", () => {
			const rect = mockFigma.createRectangle();
			plugmaExpect(rect.type).to.equal("RECTANGLE");

			verifyAssertion(
				globalThis.currentTest.assertions[0],
				'expect("RECTANGLE").to.equal("RECTANGLE")',
			);
		});

		it("handles method chaining", () => {
			const arr = [1, 2, 3];
			plugmaExpect(arr).to.be.an("array").that.includes(2);

			verifyAssertion(
				globalThis.currentTest.assertions[0],
				'expect([1,2,3]).to.be.an("array").that.includes(2)',
			);
		});

		it("serializes different value types", () => {
			const obj = { a: 1, b: "test", c: true, d: null };
			plugmaExpect(obj).to.deep.equal(obj);

			verifyAssertion(
				globalThis.currentTest.assertions[0],
				'expect({"a":1,"b":"test","c":true,"d":null}).to.deep.equal({"a":1,"b":"test","c":true,"d":null})',
			);
		});

		it("collects assertions in test context", () => {
			const rect = mockFigma.createRectangle();

			plugmaExpect(rect.type).to.equal("RECTANGLE");
			plugmaExpect(rect.id).to.be.a("string");
			plugmaExpect(rect.children).to.be.an("array");

			expect(globalThis.currentTest.assertions).toHaveLength(3);
		});
	});

	describe("assertion execution", () => {
		it("executes generated code strings correctly", () => {
			const code = "expect(true).to.be.true";
			expect(() => {
				// This should not throw
				new Function("expect", code)(expect);
			}).not.toThrow();
		});

		it("handles errors in assertion execution", () => {
			const code = "expect(false).to.be.true";
			expect(() => {
				new Function("expect", code)(expect);
			}).toThrow();
		});

		it("maintains assertion order", () => {
			const rect = mockFigma.createRectangle();

			plugmaExpect(rect.type).to.equal("RECTANGLE");
			plugmaExpect(rect.id).to.be.a("string");

			const [first, second] = globalThis.currentTest.assertions;

			verifyAssertion(first, 'expect("RECTANGLE").to.equal("RECTANGLE")');
			verifyAssertion(second, 'expect("test-id-0").to.be.a("string")');
		});
	});
});
