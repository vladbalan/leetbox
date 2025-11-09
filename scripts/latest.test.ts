import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { afterEach, describe, expect, it } from "vitest"

describe("latest script integration", () => {
	const testProblemName = "testLatestProblem"
	const problemsDir = join(cwd(), "problems")
	const testProblemDir = join(problemsDir, testProblemName)

	afterEach(async () => {
		await rm(testProblemDir, { recursive: true, force: true })
	})

	async function createTestProblem() {
		const implDir = join(testProblemDir, "impl")
		const variantsDir = join(implDir, "variants")
		await mkdir(variantsDir, { recursive: true })

		await writeFile(
			join(variantsDir, "naive.ts"),
			`export function naiveVariant(arr: number[], target: number): number {
  return arr.indexOf(target);
}`,
			"utf8",
		)

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

		await writeFile(
			join(implDir, "testCases.ts"),
			`import type { TestCase } from "../../../utils/testRunner";

export const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
  { input: { arr: [1, 2, 3], target: 2 }, expected: 1 },
];`,
			"utf8",
		)

		await writeFile(
			join(testProblemDir, "index.ts"),
			`import { runTests } from "../../utils/testRunner";
import { latest, testCases } from "./impl";

runTests(
  "testLatestProblem",
  ({ arr, target }) => latest.fn(arr, target),
  testCases
);`,
			"utf8",
		)
	}

	it("should execute latest implementation via index.ts", async () => {
		await createTestProblem()

		const indexPath = join(testProblemDir, "index.ts")
		const content = await readFile(indexPath, "utf8")

		expect(content).toContain("runTests")
		expect(content).toContain("latest")
		expect(content).toContain("testCases")
	})

	it("should have latest pointer to last implementation", async () => {
		await createTestProblem()

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("export const latest = implementations[implementations.length - 1]")
	})

	it("should verify latest implementation is callable", async () => {
		await createTestProblem()

		const variantPath = join(testProblemDir, "impl", "variants", "naive.ts")
		const content = await readFile(variantPath, "utf8")

		expect(content).toContain("export function naiveVariant")
		expect(content).toContain("arr.indexOf(target)")
	})

	it("should list available problems for selection", async () => {
		const entries = await readdir(problemsDir, { withFileTypes: true })
		const problems = entries.filter((e) => e.isDirectory()).map((e) => e.name)

		expect(problems.length).toBeGreaterThan(0)
		expect(problems).toEqual(expect.arrayContaining([expect.any(String)]))
	})

	it("should validate problem has index.ts entry point", async () => {
		const problems = await readdir(problemsDir, { withFileTypes: true })
		const firstProblem = problems.find((e) => e.isDirectory())

		if (firstProblem) {
			const indexPath = join(problemsDir, firstProblem.name, "index.ts")
			const content = await readFile(indexPath, "utf8")

			expect(content).toContain("runTests")
			expect(content.length).toBeGreaterThan(0)
		}
	})
})
