import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { afterEach } from "vitest"

/**
 * Creates a temporary directory for integration tests
 * Automatically cleaned up after each test via afterEach hook
 */
export async function createTempDir(): Promise<string> {
	const dir = await mkdtemp(join(tmpdir(), "leetbox-test-"))
	afterEach(async () => {
		await rm(dir, { recursive: true, force: true })
	})
	return dir
}

/**
 * Writes a file to the given path with content
 */
export async function writeTestFile(filePath: string, content: string): Promise<void> {
	await writeFile(filePath, content, "utf8")
}

/**
 * Reads a file from the given path
 */
export async function readTestFile(filePath: string): Promise<string> {
	return readFile(filePath, "utf8")
}

/**
 * Mocks stdin for interactive tests
 */
export function mockStdin(inputs: string[]): { restore: () => void } {
	const originalIsTTY = process.stdin.isTTY
	const originalReadable = process.stdin.readable
	let inputIndex = 0

	// Mock stdin properties
	Object.defineProperty(process.stdin, "isTTY", {
		value: false,
		configurable: true,
	})

	// Mock stdin read
	const originalOn = process.stdin.on
	const originalOnce = process.stdin.once
	const listeners: Map<string, ((...args: unknown[]) => void)[]> = new Map()

	process.stdin.on = ((event: string, listener: (...args: unknown[]) => void) => {
		if (!listeners.has(event)) listeners.set(event, [])
		listeners.get(event)?.push(listener)
		return process.stdin
	}) as typeof process.stdin.on

	process.stdin.once = ((event: string, listener: (...args: unknown[]) => void) => {
		const wrapped = (...args: unknown[]) => {
			listener(...args)
			const arr = listeners.get(event)
			if (arr) {
				const idx = arr.indexOf(wrapped)
				if (idx >= 0) arr.splice(idx, 1)
			}
		}
		process.stdin.on(event, wrapped)
		return process.stdin
	}) as typeof process.stdin.once

	// Simulate data events
	setTimeout(() => {
		if (inputIndex < inputs.length) {
			const data = inputs[inputIndex++]
			listeners.get("data")?.forEach((fn) => {
				fn(Buffer.from(data))
			})
		}
	}, 10)

	return {
		restore: () => {
			Object.defineProperty(process.stdin, "isTTY", {
				value: originalIsTTY,
				configurable: true,
			})
			Object.defineProperty(process.stdin, "readable", {
				value: originalReadable,
				configurable: true,
			})
			process.stdin.on = originalOn
			process.stdin.once = originalOnce
		},
	}
}

/**
 * Captures console output for assertions
 */
export function captureConsole(): {
	log: string[]
	error: string[]
	restore: () => void
} {
	const log: string[] = []
	const error: string[] = []

	const originalLog = console.log
	const originalError = console.error

	console.log = (...args: unknown[]) => {
		log.push(args.map((a) => String(a)).join(" "))
	}

	console.error = (...args: unknown[]) => {
		error.push(args.map((a) => String(a)).join(" "))
	}

	return {
		log,
		error,
		restore: () => {
			console.log = originalLog
			console.error = originalError
		},
	}
}
