import { hrtime } from "node:process"
import type { TestCase } from "./testRunner"

export interface Implementation<A, B, R> {
	readonly name: string
	readonly fn: (a: A, b: B) => R
}

export interface BenchOptions {
	readonly iterations?: number // measured iterations (batches across all test cases)
	readonly warmup?: number // warmup iterations (not measured)
	readonly quiet?: boolean // temporarily silence console during runs
}

function nowNs(): bigint {
	return hrtime.bigint()
}

function nsToMs(ns: bigint): number {
	return Number(ns) / 1_000_000
}

/**
 * Runs a function with console output suppressed by temporarily redirecting
 * stdout/stderr write operations. More robust than overwriting console methods.
 */
function withQuiet<T>(quiet: boolean | undefined, run: () => T): T {
	if (!quiet) return run()

	// Store original write functions
	const stdoutWrite = process.stdout.write.bind(process.stdout)
	const stderrWrite = process.stderr.write.bind(process.stderr)

	// Create no-op write function
	const noopWrite = () => true

	try {
		// Redirect writes to no-op
		process.stdout.write = noopWrite as typeof process.stdout.write
		process.stderr.write = noopWrite as typeof process.stderr.write
		return run()
	} finally {
		// Restore original write functions
		process.stdout.write = stdoutWrite
		process.stderr.write = stderrWrite
	}
}

export function runComparison<A, B, R, TInput>(
	title: string,
	implementations: readonly Implementation<A, B, R>[],
	testCases: readonly TestCase<TInput, R>[],
	extractArgs: (input: TInput) => readonly [A, B],
	options: BenchOptions = {},
): void {
	const iterations = options.iterations ?? 30
	const warmup = options.warmup ?? 2
	const quiet = options.quiet ?? true

	console.log(`\n🚀 ${title}: comparison of ${implementations.length} implementation(s)`)
	console.log(`Cases: ${testCases.length} | Warmup: ${warmup} | Iterations: ${iterations}`)

	type Row = {
		name: string
		pass: number
		total: number
		fail: number
		totalMs: number
		avgMsPerOp: number
		ops: number
	}

	const rows: Row[] = []

	for (const impl of implementations) {
		// correctness check (single pass)
		let pass = 0
		for (const tc of testCases) {
			const [a, b] = extractArgs(tc.input)
			const r = withQuiet(quiet, () => impl.fn(a, b))
			const ok = JSON.stringify(r) === JSON.stringify(tc.expected)
			if (ok) pass++
		}

		// warmup
		withQuiet(quiet, () => {
			for (let i = 0; i < warmup; i++) {
				for (const tc of testCases) {
					const [a, b] = extractArgs(tc.input)
					impl.fn(a, b)
				}
			}
		})

		// measure
		const start = nowNs()
		withQuiet(quiet, () => {
			for (let i = 0; i < iterations; i++) {
				for (const tc of testCases) {
					const [a, b] = extractArgs(tc.input)
					impl.fn(a, b)
				}
			}
		})
		const end = nowNs()

		const ops = iterations * testCases.length
		const totalMs = nsToMs(end - start)
		const avgMsPerOp = totalMs / ops

		rows.push({
			name: impl.name,
			pass,
			total: testCases.length,
			fail: testCases.length - pass,
			totalMs: Number(totalMs.toFixed(3)),
			avgMsPerOp: Number(avgMsPerOp.toFixed(6)),
			ops,
		})
	}

	const best = Math.min(...rows.map((r) => r.avgMsPerOp))
	const table = rows.map((r) => ({
		Implementation: r.name,
		Pass: `${r.pass}/${r.total}`,
		Fail: r.fail,
		TotalMs: r.totalMs,
		AvgMsPerOp: r.avgMsPerOp,
		RelToBest: Number((r.avgMsPerOp / best).toFixed(2)),
	}))

	console.log("\n\n📊 Comparison Report")
	console.table(table)
}
