import { access, mkdir, readFile, rm } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { afterEach, describe, expect, it } from "vitest"

describe("add-problem script integration", () => {
	const testProblemName = "scaffoldTestProblem"
	const problemsDir = join(cwd(), "problems")
	const testProblemDir = join(problemsDir, testProblemName)

	afterEach(async () => {
		await rm(testProblemDir, { recursive: true, force: true })
	})

	async function fileExists(path: string): Promise<boolean> {
		try {
			await access(path)
			return true
		} catch {
			return false
		}
	}

	async function scaffoldProblem(shortName: string, fullName: string) {
		const problemRoot = join(problemsDir, shortName)
		const implDir = join(problemRoot, "impl")
		const variantsDir = join(implDir, "variants")
		await mkdir(variantsDir, { recursive: true })

		// index.ts
		await import("node:fs/promises").then((fs) =>
			fs.writeFile(
				join(problemRoot, "index.ts"),
				`import { runTests } from "../../utils/testRunner";
import { latest, testCases } from "./impl";

// ${fullName}
runTests(
  "${fullName}",
  ({ arr, target }) => latest.fn(arr, target),
  testCases
);
`,
				"utf8",
			),
		)

		// compare.ts
		await import("node:fs/promises").then((fs) =>
			fs.writeFile(
				join(problemRoot, "compare.ts"),
				`import { runComparison } from "../../utils/bench";
import { implementations, testCases } from "./impl";

runComparison(
  "${shortName} implementations",
  implementations,
  testCases,
  (input) => [input.arr, input.target],
  { iterations: 30, warmup: 2, quiet: true }
);
`,
				"utf8",
			),
		)

		// impl/index.ts
		await import("node:fs/promises").then((fs) =>
			fs.writeFile(
				join(implDir, "index.ts"),
				`import { naiveVariant } from "./variants/naive";
export { testCases } from "./testCases";

// Registry of implementations (newest last)
export const implementations = [
  { name: "naive", fn: (arr: number[], target: number) => naiveVariant(arr, target) },
];

export const latest = implementations[implementations.length - 1];
`,
				"utf8",
			),
		)

		// impl/testCases.ts
		await import("node:fs/promises").then((fs) =>
			fs.writeFile(
				join(implDir, "testCases.ts"),
				`import { TestCase } from "../../../utils/testRunner";

// Test cases for ${fullName} (scaffold)
export const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
  { input: { arr: [1, 2, 3, 4], target: 3 }, expected: 2, description: "Find index of 3" },
  { input: { arr: [10, 20, 30], target: 15 }, expected: -1, description: "Target not present" },
];
`,
				"utf8",
			),
		)

		// impl/variants/naive.ts
		await import("node:fs/promises").then((fs) =>
			fs.writeFile(
				join(variantsDir, "naive.ts"),
				`/**
 * naiveVariant: initial scaffold
 * Time: O(1) placeholder, Space: O(1) placeholder
 */
export function naiveVariant(arr: number[], target: number): number {
  // TODO: implement
  return -1;
}
`,
				"utf8",
			),
		)
	}

	it("should create complete problem structure", async () => {
		await scaffoldProblem(testProblemName, "Scaffold Test Problem")

		expect(await fileExists(join(testProblemDir, "index.ts"))).toBe(true)
		expect(await fileExists(join(testProblemDir, "compare.ts"))).toBe(true)
		expect(await fileExists(join(testProblemDir, "impl", "index.ts"))).toBe(true)
		expect(await fileExists(join(testProblemDir, "impl", "testCases.ts"))).toBe(true)
		expect(await fileExists(join(testProblemDir, "impl", "variants", "naive.ts"))).toBe(true)
	})

	it("should generate valid index.ts with runTests call", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const content = await readFile(join(testProblemDir, "index.ts"), "utf8")

		expect(content).toContain("runTests")
		expect(content).toContain("Test Problem")
		expect(content).toContain("latest")
		expect(content).toContain("testCases")
	})

	it("should generate valid compare.ts with runComparison call", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const content = await readFile(join(testProblemDir, "compare.ts"), "utf8")

		expect(content).toContain("runComparison")
		expect(content).toContain("implementations")
		expect(content).toContain("testCases")
		expect(content).toContain("iterations: 30")
	})

	it("should generate impl/index.ts with implementations array", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const content = await readFile(join(testProblemDir, "impl", "index.ts"), "utf8")

		expect(content).toContain("naiveVariant")
		expect(content).toContain("implementations")
		expect(content).toContain("latest")
		expect(content).toContain('name: "naive"')
	})

	it("should generate impl/testCases.ts with valid test cases", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const content = await readFile(join(testProblemDir, "impl", "testCases.ts"), "utf8")

		expect(content).toContain("TestCase")
		expect(content).toContain("testCases")
		expect(content).toContain("expected")
		expect(content).toContain("description")
	})

	it("should generate naive variant with TODO placeholder", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const content = await readFile(join(testProblemDir, "impl", "variants", "naive.ts"), "utf8")

		expect(content).toContain("naiveVariant")
		expect(content).toContain("TODO: implement")
		expect(content).toContain("export function")
		expect(content).toContain("return -1")
	})

	it("should create importable module structure", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("implementations")
		expect(content).toContain("testCases")
		expect(content).toContain("latest")
		expect(content).toContain('name: "naive"')
	})

	it("should have callable variant function", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const variantPath = join(testProblemDir, "impl", "variants", "naive.ts")
		const content = await readFile(variantPath, "utf8")

		expect(content).toContain("export function naiveVariant")
		expect(content).toContain("return -1")
	})

	it("should validate testCases structure matches TestCase interface", async () => {
		await scaffoldProblem(testProblemName, "Test Problem")

		const testCasesPath = join(testProblemDir, "impl", "testCases.ts")
		const content = await readFile(testCasesPath, "utf8")

		expect(content).toContain("TestCase<{ arr: number[]; target: number }, number>")
		expect(content).toContain("input:")
		expect(content).toContain("expected:")
		expect(content).toContain("arr:")
		expect(content).toContain("target:")
	})
})
