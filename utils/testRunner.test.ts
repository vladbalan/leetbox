import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { runTests, type TestCase } from "./testRunner"

describe("testRunner", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
	})

	afterEach(() => {
		consoleLogSpy.mockRestore()
	})

	describe("runTests", () => {
		it("should pass all tests with correct output", () => {
			const testCases: TestCase<number, number>[] = [
				{ input: 2, expected: 4 },
				{ input: 3, expected: 9 },
			]

			const result = runTests("Square Function", (n) => n * n, testCases)

			expect(result).toEqual({
				passed: 2,
				failed: 0,
				total: 2,
			})
		})

		it("should fail tests with incorrect output", () => {
			const testCases: TestCase<number, number>[] = [
				{ input: 2, expected: 4 },
				{ input: 3, expected: 10 }, // Wrong expectation
			]

			const result = runTests("Square Function", (n) => n * n, testCases)

			expect(result).toEqual({
				passed: 1,
				failed: 1,
				total: 2,
			})
		})

		it("should handle mixed pass/fail results", () => {
			const testCases: TestCase<number, boolean>[] = [
				{ input: 2, expected: true },
				{ input: 3, expected: false },
				{ input: 5, expected: false },
			]

			const result = runTests("IsEven", (n) => n % 2 === 0, testCases)

			expect(result).toEqual({
				passed: 3,
				failed: 0,
				total: 3,
			})
		})

		it("should use custom comparator when provided", () => {
			const testCases: TestCase<number[], number[]>[] = [
				{ input: [1, 2], expected: [2, 1] },
				{ input: [3, 4], expected: [4, 3] },
			]

			// Custom comparator that checks set equality (order-independent)
			const setComparator = (result: number[], expected: number[]) => {
				return result.length === expected.length && result.every((val) => expected.includes(val))
			}

			const result = runTests("Reverse Array", (arr) => [...arr].reverse(), testCases, setComparator)

			expect(result.passed).toBe(2)
			expect(result.failed).toBe(0)
		})

		it("should handle empty test cases array", () => {
			const testCases: TestCase<number, number>[] = []

			const result = runTests("Empty Tests", (n) => n, testCases)

			expect(result).toEqual({
				passed: 0,
				failed: 0,
				total: 0,
			})
		})

		it("should handle complex object comparisons", () => {
			const testCases: TestCase<{ a: number; b: string }, { sum: number; text: string }>[] = [
				{
					input: { a: 1, b: "test" },
					expected: { sum: 1, text: "test" },
				},
				{
					input: { a: 5, b: "hello" },
					expected: { sum: 5, text: "hello" },
				},
			]

			const result = runTests("Object Transform", (input) => ({ sum: input.a, text: input.b }), testCases)

			expect(result.passed).toBe(2)
			expect(result.failed).toBe(0)
		})

		it("should handle arrays with different ordering using default comparator", () => {
			const testCases: TestCase<number[], number[]>[] = [{ input: [1, 2, 3], expected: [3, 2, 1] }]

			const result = runTests("Reverse", (arr) => [...arr].reverse(), testCases)

			expect(result.passed).toBe(1)
			expect(result.failed).toBe(0)
		})

		it("should fail when array order differs and no custom comparator", () => {
			const testCases: TestCase<number[], number[]>[] = [{ input: [1, 2, 3], expected: [1, 2, 3] }]

			const result = runTests(
				"Identity",
				() => [3, 2, 1], // Returns wrong order
				testCases,
			)

			expect(result.passed).toBe(0)
			expect(result.failed).toBe(1)
		})

		it("should include test descriptions when provided", () => {
			const testCases: TestCase<number, number>[] = [{ input: 5, expected: 25, description: "Square of 5" }]

			runTests("Square", (n) => n * n, testCases)

			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Square of 5"))
		})

		it("should handle null and undefined values correctly", () => {
			const testCases: TestCase<number | null, number | null>[] = [
				{ input: null, expected: null },
				{ input: 5, expected: 5 },
			]

			const result = runTests("Identity", (n) => n, testCases)

			expect(result.passed).toBe(2)
			expect(result.failed).toBe(0)
		})

		it("should detect when function throws an error", () => {
			const testCases: TestCase<number, number>[] = [{ input: 0, expected: 0 }]

			const faultyFn = (n: number) => {
				if (n === 0) throw new Error("Cannot divide by zero")
				return 10 / n
			}

			expect(() => runTests("Divide", faultyFn, testCases)).toThrow()
		})

		it("should log results to console with proper formatting", () => {
			const testCases: TestCase<number, number>[] = [{ input: 1, expected: 1 }]

			runTests("Test", (n) => n, testCases)

			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Test Tests Started"))
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Test Tests Concluded"))
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("1/1 test cases passed"))
		})
	})
})
