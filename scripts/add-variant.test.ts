import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { cwd } from "node:process"
import { afterEach, describe, expect, it } from "vitest"

describe("add-variant script integration", () => {
	const testProblemName = "variantTestProblem"
	const problemsDir = join(cwd(), "problems")
	const testProblemDir = join(problemsDir, testProblemName)

	afterEach(async () => {
		await rm(testProblemDir, { recursive: true, force: true })
	})

	async function createBaseProblem() {
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

// Registry of implementations (newest last)
export const implementations = [
  { name: "naive", fn: (arr: number[], target: number) => naiveVariant(arr, target) },
];

export const latest = implementations[implementations.length - 1];
`,
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
	}

	async function addVariant(variantName: string) {
		const variantsDir = join(testProblemDir, "impl", "variants")
		const variantPath = join(variantsDir, `${variantName}.ts`)

		// Create variant file
		await writeFile(
			variantPath,
			`/**
 * ${variantName}Variant: new variant
 * Time: O(1) placeholder, Space: O(1) placeholder
 */
export function ${variantName}Variant(arr: number[], target: number): number {
  // TODO: implement
  return -1;
}
`,
			"utf8",
		)

		// Update impl/index.ts
		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		let content = await readFile(implIndexPath, "utf8")

		// Add import
		const importLine = `import { ${variantName}Variant } from "./variants/${variantName}";`
		content = content.replace(/(export\s+\{\s*testCases\s*\}\s+from\s+"\.\/testCases";)/, `${importLine}\n$1`)

		// Add to implementations array
		const implArrayRegex = /(export\s+const\s+implementations\s*=\s*\[)([\s\S]*?)(\];)/
		content = content.replace(implArrayRegex, (_match, head, body, tail) => {
			const trimmed = body.replace(/\s*$/, "")
			const newEntry = `\n  { name: "${variantName}", fn: (arr: number[], target: number) => ${variantName}Variant(arr, target) },\n`
			return `${head}${trimmed}${newEntry}${tail}`
		})

		await writeFile(implIndexPath, content, "utf8")
	}

	it("should add new variant file to variants directory", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const variantPath = join(testProblemDir, "impl", "variants", "optimized.ts")
		const content = await readFile(variantPath, "utf8")

		expect(content).toContain("optimizedVariant")
		expect(content).toContain("TODO: implement")
		expect(content).toContain("export function")
	})

	it("should add import statement to impl/index.ts", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain('import { optimizedVariant } from "./variants/optimized";')
	})

	it("should add new implementation to implementations array", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain('name: "naive"')
		expect(content).toContain('name: "optimized"')
	})

	it("should update latest to point to new implementation", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("export const latest = implementations[implementations.length - 1]")
		// Optimized should be last in the array
		const optimizedIndex = content.indexOf('name: "optimized"')
		const naiveIndex = content.indexOf('name: "naive"')
		expect(optimizedIndex).toBeGreaterThan(naiveIndex)
	})

	it("should preserve existing implementations when adding new variant", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("naiveVariant")
		expect(content).toContain("optimizedVariant")
	})

	it("should allow multiple variants to be added sequentially", async () => {
		await createBaseProblem()
		await addVariant("optimized")
		await addVariant("bruteForce")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		expect(content).toContain("optimizedVariant")
		expect(content).toContain("bruteForceVariant")
	})

	it("should create callable variant function", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const variantPath = join(testProblemDir, "impl", "variants", "optimized.ts")
		const content = await readFile(variantPath, "utf8")

		expect(content).toContain("export function optimizedVariant")
		expect(content).toContain("arr: number[], target: number")
		expect(content).toContain("return -1")
	})

	it("should handle camelCase variant names correctly", async () => {
		await createBaseProblem()
		await addVariant("binarySearch")

		const variantPath = join(testProblemDir, "impl", "variants", "binarySearch.ts")
		const content = await readFile(variantPath, "utf8")

		expect(content).toContain("binarySearchVariant")
		expect(content).toContain("export function binarySearchVariant")
	})

	it("should maintain correct import order in impl/index.ts", async () => {
		await createBaseProblem()
		await addVariant("optimized")

		const implIndexPath = join(testProblemDir, "impl", "index.ts")
		const content = await readFile(implIndexPath, "utf8")

		const naiveImportIndex = content.indexOf("import { naiveVariant }")
		const optimizedImportIndex = content.indexOf("import { optimizedVariant }")
		const testCasesExportIndex = content.indexOf("export { testCases }")

		expect(naiveImportIndex).toBeGreaterThan(-1)
		expect(optimizedImportIndex).toBeGreaterThan(-1)
		expect(optimizedImportIndex).toBeLessThan(testCasesExportIndex)
	})
})
