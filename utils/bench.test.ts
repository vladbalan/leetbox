import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { type Implementation, runComparison } from "./bench"
import type { TestCase } from "./testRunner"

describe("bench", () => {
	let consoleLogSpy: ReturnType<typeof vi.spyOn>
	let consoleTableSpy: ReturnType<typeof vi.spyOn>

	beforeEach(() => {
		consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
		consoleTableSpy = vi.spyOn(console, "table").mockImplementation(() => {})
	})

	afterEach(() => {
		consoleLogSpy.mockRestore()
		consoleTableSpy.mockRestore()
	})

	describe("runComparison", () => {
		it("should benchmark single implementation correctly", () => {
			const implementations: Implementation<number[], number, number>[] = [
				{ name: "linear", fn: (arr, target) => arr.indexOf(target) },
			]

			const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
				{ input: { arr: [1, 2, 3], target: 2 }, expected: 1 },
				{ input: { arr: [10, 20, 30], target: 20 }, expected: 1 },
			]

			runComparison("Search Test", implementations, testCases, (input) => [input.arr, input.target], {
				iterations: 5,
				warmup: 1,
				quiet: true,
			})

			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Search Test"))
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("comparison of 1 implementation"))
			expect(consoleTableSpy).toHaveBeenCalled()
		})

		it("should compare multiple implementations", () => {
			const implementations: Implementation<number[], number, number>[] = [
				{ name: "indexOf", fn: (arr, target) => arr.indexOf(target) },
				// biome-ignore lint/complexity/useIndexOf: intentionally testing findIndex for comparison
				{ name: "find", fn: (arr, target) => arr.findIndex((x) => x === target) },
			]

			const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
				{ input: { arr: [1, 2, 3], target: 2 }, expected: 1 },
			]

			runComparison("Search Comparison", implementations, testCases, (input) => [input.arr, input.target], {
				iterations: 10,
				warmup: 2,
				quiet: true,
			})

			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("comparison of 2 implementation"))
		})

		it("should track correctness of implementations", () => {
			const implementations: Implementation<number, number, number>[] = [
				{ name: "correct", fn: (a, b) => a + b },
				{ name: "incorrect", fn: (a, b) => a * b },
			]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [
				{ input: { a: 2, b: 3 }, expected: 5 },
				{ input: { a: 5, b: 10 }, expected: 15 },
			]

			runComparison("Addition Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 5,
				warmup: 1,
				quiet: true,
			})

			// Verify table was called with data showing pass/fail
			expect(consoleTableSpy).toHaveBeenCalled()
			const tableCall = consoleTableSpy.mock.calls[0][0] as Array<{
				Pass: string
				Fail: number
			}>

			expect(tableCall).toEqual(
				expect.arrayContaining([
					expect.objectContaining({ Pass: "2/2", Fail: 0 }),
					expect.objectContaining({ Pass: "0/2", Fail: 2 }),
				]),
			)
		})

		it("should calculate relative performance correctly", () => {
			const implementations: Implementation<number, number, number>[] = [
				{ name: "fast", fn: (a, b) => a + b },
				{ name: "slow", fn: (a, b) => Array.from({ length: 100 }).reduce(() => a + b, 0) as number },
			]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			runComparison("Performance Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 100,
				warmup: 5,
				quiet: true,
			})

			const tableCall = consoleTableSpy.mock.calls[0][0] as Array<{
				Implementation: string
				RelToBest: number
			}>

			// The fastest should have RelToBest of 1.00
			const fastResult = tableCall.find((row) => row.Implementation === "fast")
			expect(fastResult?.RelToBest).toBe(1)

			// The slow one should be > 1.00
			const slowResult = tableCall.find((row) => row.Implementation === "slow")
			expect(slowResult?.RelToBest).toBeGreaterThan(1)
		})

		it("should respect quiet mode option", () => {
			const stdoutWriteSpy = vi.spyOn(process.stdout, "write")
			const stderrWriteSpy = vi.spyOn(process.stderr, "write")

			const implementations: Implementation<number, number, number>[] = [
				{
					name: "noisy",
					fn: (a, b) => {
						console.log("This should be suppressed")
						return a + b
					},
				},
			]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			runComparison("Quiet Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 5,
				warmup: 1,
				quiet: true,
			})

			// Verify that during execution, no stdout/stderr writes happened from the function
			// (difficult to assert directly, but quiet mode should suppress output)
			stdoutWriteSpy.mockRestore()
			stderrWriteSpy.mockRestore()
		})

		it("should handle empty test cases", () => {
			const implementations: Implementation<number, number, number>[] = [{ name: "add", fn: (a, b) => a + b }]

			const testCases: TestCase<{ a: number; b: number }, number>[] = []

			runComparison("Empty Cases", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 5,
				warmup: 1,
				quiet: true,
			})

			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cases: 0"))
		})

		it("should use default options when not provided", () => {
			const implementations: Implementation<number, number, number>[] = [{ name: "add", fn: (a, b) => a + b }]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			runComparison("Default Options", implementations, testCases, (input) => [input.a, input.b])

			// Should use defaults: iterations=30, warmup=2, quiet=true
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Warmup: 2"))
			expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Iterations: 30"))
		})

		it("should handle complex objects as arguments", () => {
			type Graph = { nodes: number[]; edges: [number, number][] }

			const implementations: Implementation<Graph, number, boolean>[] = [
				{
					name: "hasNode",
					fn: (graph, nodeId) => graph.nodes.includes(nodeId),
				},
			]

			const testCases: TestCase<{ graph: Graph; nodeId: number }, boolean>[] = [
				{
					input: {
						graph: { nodes: [1, 2, 3], edges: [[1, 2]] },
						nodeId: 2,
					},
					expected: true,
				},
			]

			runComparison("Graph Test", implementations, testCases, (input) => [input.graph, input.nodeId], {
				iterations: 5,
				warmup: 1,
				quiet: true,
			})

			expect(consoleTableSpy).toHaveBeenCalled()
		})

		it("should measure timing accurately with high-resolution timer", () => {
			const implementations: Implementation<number, number, number>[] = [{ name: "compute", fn: (a, b) => a + b }]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			runComparison("Timing Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 100,
				warmup: 5,
				quiet: true,
			})

			const tableCall = consoleTableSpy.mock.calls[0][0] as Array<{
				TotalMs: number
				AvgMsPerOp: number
			}>

			expect(tableCall[0].TotalMs).toBeGreaterThan(0)
			expect(tableCall[0].AvgMsPerOp).toBeGreaterThan(0)
		})

		it("should perform warmup iterations before measurement", () => {
			let callCount = 0
			const implementations: Implementation<number, number, number>[] = [
				{
					name: "counter",
					fn: (a, b) => {
						callCount++
						return a + b
					},
				},
			]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			const warmup = 3
			const iterations = 5

			runComparison("Warmup Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations,
				warmup,
				quiet: true,
			})

			// Should be called: 1 (correctness) + warmup*cases + iterations*cases
			// = 1 + 3*1 + 5*1 = 9
			expect(callCount).toBe(1 + warmup * testCases.length + iterations * testCases.length)
		})

		it("should output results table with all required columns", () => {
			const implementations: Implementation<number, number, number>[] = [{ name: "impl1", fn: (a, b) => a + b }]

			const testCases: TestCase<{ a: number; b: number }, number>[] = [{ input: { a: 1, b: 2 }, expected: 3 }]

			runComparison("Table Test", implementations, testCases, (input) => [input.a, input.b], {
				iterations: 10,
				warmup: 2,
				quiet: true,
			})

			const tableCall = consoleTableSpy.mock.calls[0][0] as Array<Record<string, unknown>>

			expect(tableCall[0]).toHaveProperty("Implementation")
			expect(tableCall[0]).toHaveProperty("Pass")
			expect(tableCall[0]).toHaveProperty("Fail")
			expect(tableCall[0]).toHaveProperty("TotalMs")
			expect(tableCall[0]).toHaveProperty("AvgMsPerOp")
			expect(tableCall[0]).toHaveProperty("RelToBest")
		})
	})
})
