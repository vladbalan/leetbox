// Generic runner to execute the latest implementation for a given problem
// Usage:
//   npm run latest -- <problemName>
// Example:
//   npm run latest -- searchRotated

import { readdir } from "node:fs/promises"
import { join } from "node:path"
import process, { argv, cwd, exit } from "node:process"
import { selectFromList } from "./interactive"

async function main() {
	let problem = getProblemName()

	if (!problem) {
		// Interactive selection when no problem name is provided
		const problems = await listProblems()
		if (!problems.length) {
			await printUsageAndExit("No problems found.")
			return
		}
		problem = await selectFromList(problems, { title: "Select a problem to run (latest)" })
		if (!problem) {
			console.log("No selection made. Exiting.")
			return
		}
	}

	try {
		await import(`../problems/${problem}/index.ts`)
	} catch (err: unknown) {
		console.error(`❌ Could not run latest for problem "${problem}".`)
		console.error(err instanceof Error ? err.message : String(err))
		await printUsageAndExit()
	}
}

function getProblemName(): string | undefined {
	// Prefer positional args
	const args = argv?.slice(2) ?? []
	if (args[0]) return String(args[0])

	// Attempt to parse npm_config_argv (best-effort support for "npm run latest problem")
	try {
		const raw = process.env?.npm_config_argv
		if (!raw) return undefined

		const parsed: unknown = JSON.parse(raw)
		if (!isValidNpmConfigArgv(parsed)) return undefined

		const original: string[] = parsed.original ?? []
		// Find the first token that isn't npm/run boilerplate
		const skip = new Set(["run", "run-script", "latest", "--", "-s", "--silent"])
		const candidate = original.find((t: string) => !skip.has(t))
		if (candidate) return candidate
	} catch (_err: unknown) {
		// JSON parse failed or env variable invalid - silently ignore
	}
	return undefined
}

function isValidNpmConfigArgv(value: unknown): value is { original?: string[] } {
	return (
		typeof value === "object" &&
		value !== null &&
		(!("original" in value) ||
			(Array.isArray((value as { original?: unknown }).original) &&
				(value as { original: unknown[] }).original.every((v) => typeof v === "string")))
	)
}

async function printUsageAndExit(reason?: string) {
	if (reason) console.error(`ℹ️  ${reason}`)
	console.log("Usage: npm run latest -- <problemName>")
	console.log("Examples:")
	console.log("  npm run latest -- searchRotated")
	try {
		const problems = await listProblems()
		if (problems.length) {
			console.log("Available problems:")
			for (const p of problems) console.log(`  - ${p}`)
		}
	} catch {}
	exit(1)
}

async function listProblems(): Promise<string[]> {
	const base = join(cwd(), "problems")
	const entries = await readdir(base, { withFileTypes: true })
	return entries
		.filter((e) => e.isDirectory())
		.map((e) => e.name)
		.sort()
}

// selection UI extracted into scripts/interactive.ts

main()
