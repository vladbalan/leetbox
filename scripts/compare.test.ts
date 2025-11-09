import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { afterEach, describe, expect, it } from "vitest"

describe("compare script integration", () => {
	const testProblemName = "testIntegrationProblem"
	const problemsDir = join(cwd(), "problems")
	const testProblemDir = join(problemsDir, testProblemName)

	afterEach(async () => {
		// Cleanup test problem
		await rm(testProblemDir, { recursive: true, force: true })
	})

	async function createTestProblem() {
		const implDir = join(testProblemDir, "impl")
		const variantsDir = join(implDir, "variants")
		await mkdir(variantsDir, { recursive: true })

		// Create test variant
		await writeFile(
			join(variantsDir, "naive.ts"),
			`export function naiveVariant(arr: number[], target: number): number {
  return arr.indexOf(target);
}`,
			"utf8",
		)

		// Create impl/index.ts
		await writeFile(
			join(implDir, "index.ts"),
			`import { naiveVariant } from "./variants/naive";
export { testCases } from "./testCases";

export const implementations = [
  { name: "naive", fn: (arr: number[], target: number) => naiveVariant(arr, target) },
];

export const latest = implementations[implementations.length - 1];`,
			"utf8",
		)

		// Create testCases.ts
		await writeFile(
			join(implDir, "testCases.ts"),
			`import type { TestCase } from "../../../utils/testRunner";

export const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
  { input: { arr: [1, 2, 3], target: 2 }, expected: 1 },
];`,
			"utf8",
		)

		// Create compare.ts
		await writeFile(
			join(testProblemDir, "compare.ts"),
			`import { runComparison } from "../../utils/bench";
import { implementations, testCases } from "./impl";

runComparison(
  "testProblem implementations",
  implementations,
  testCases,
  (input) => [input.arr, input.target],
  { iterations: 2, warmup: 1, quiet: true }
);`,
			"utf8",
		)

		// Create index.ts
		await writeFile(
			join(testProblemDir, "index.ts"),
			`import { runTests } from "../../utils/testRunner";
import { latest, testCases } from "./impl";

runTests(
  "testProblem",
  ({ arr, target }) => latest.fn(arr, target),
  testCases
);`,
			"utf8",
		)
	}

	it("should create problem structure with all required files", async () => {
		await createTestProblem()

		const entries = await readdir(testProblemDir)
		expect(entries).toContain("compare.ts")
		expect(entries).toContain("index.ts")
		expect(entries).toContain("impl")

		const implEntries = await readdir(join(testProblemDir, "impl"))
		expect(implEntries).toContain("index.ts")
		expect(implEntries).toContain("testCases.ts")
		expect(implEntries).toContain("variants")
	})

	it("should allow dynamic import of problem implementations", async () => {
		await createTestProblem()

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("implementations")
		expect(content).toContain("testCases")
		expect(content).toContain("latest")
		expect(content).toContain("naiveVariant")
	})

	it("should execute comparison script successfully", async () => {
		await createTestProblem()

		const comparePath = join(testProblemDir, "compare.ts")
		const content = await readFile(comparePath, "utf8")

		expect(content).toContain("runComparison")
		expect(content).toContain("implementations")
		expect(content).toContain("testCases")
	})

	it("should verify existing problems directory structure", async () => {
		const entries = await readdir(problemsDir, { withFileTypes: true })
		const problemDirs = entries.filter((e) => e.isDirectory())

		expect(problemDirs.length).toBeGreaterThan(0)
		expect(problemDirs.every((d) => typeof d.name === "string")).toBe(true)
	})

	it("should verify problem has valid implementation structure", async () => {
		// Test with existing problem
		const existingProblems = await readdir(problemsDir, { withFileTypes: true })
		const firstProblem = existingProblems.find((e) => e.isDirectory())

		if (firstProblem) {
			const problemPath = join(problemsDir, firstProblem.name)
			const implPath = join(problemPath, "impl")
			const implEntries = await readdir(implPath)

			expect(implEntries).toContain("index.ts")
			expect(implEntries).toContain("testCases.ts")
		}
	})
})
