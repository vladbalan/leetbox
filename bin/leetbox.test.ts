import { spawn } from "node:child_process"
import { join } from "node:path"
import { describe, expect, it } from "vitest"

const CLI_PATH = join(__dirname, "leetbox.js")
const PROJECT_ROOT = join(__dirname, "..")

/**
 * Helper to run the CLI and capture output
 */
function runCLI(args: string[] = []): Promise<{ code: number; stdout: string; stderr: string }> {
	return new Promise((resolve) => {
		const child = spawn("node", [CLI_PATH, ...args], {
			cwd: PROJECT_ROOT,
			env: process.env,
		})

		let stdout = ""
		let stderr = ""

		child.stdout?.on("data", (data) => {
			stdout += data.toString()
		})

		child.stderr?.on("data", (data) => {
			stderr += data.toString()
		})

		child.on("close", (code) => {
			resolve({ code: code ?? 0, stdout, stderr })
		})
	})
}

describe("CLI", () => {
	describe("help command", () => {
		it("should display help with --help flag", async () => {
			const result = await runCLI(["--help"])
			expect(result.stdout).toContain("leetbox - benchmark CLI")
			expect(result.stdout).toContain("Usage:")
			expect(result.stdout).toContain("compare")
			expect(result.stdout).toContain("latest")
			expect(result.code).toBe(0)
		})

		it("should display help with -h flag", async () => {
			const result = await runCLI(["-h"])
			expect(result.stdout).toContain("leetbox - benchmark CLI")
			expect(result.code).toBe(0)
		})

		it("should display help with help command", async () => {
			const result = await runCLI(["help"])
			expect(result.stdout).toContain("leetbox - benchmark CLI")
			expect(result.code).toBe(0)
		})
	})

	describe("compare command", () => {
		it("should accept compare command", async () => {
			const result = await runCLI(["compare", "twoSum"])
			// Should not have "Unknown command" error
			expect(result.stderr).not.toContain("Unknown command")
		})
	})

	describe("latest command", () => {
		it("should accept latest command", async () => {
			const result = await runCLI(["latest", "twoSum"])
			expect(result.stderr).not.toContain("Unknown command")
		})
	})

	describe("add command", () => {
		it("should recognize add variant command routing", async () => {
			// These tests verify the CLI routes to the correct script
			// They will timeout waiting for stdin, which proves routing works
			const promise = runCLI(["add", "variant"])
			const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 100))
			const result = await Promise.race([promise, timeout])
			// If we get timeout, it means the script was invoked and is waiting for input
			expect(result).toBe("timeout")
		})

		it("should recognize add problem command routing", async () => {
			const promise = runCLI(["add", "problem"])
			const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 100))
			const result = await Promise.race([promise, timeout])
			expect(result).toBe("timeout")
		})

		it("should show error for unknown add subcommand", async () => {
			const result = await runCLI(["add", "unknown"])
			expect(result.stderr).toContain("Unknown add subcommand")
			expect(result.stdout).toContain("Usage:")
		})
	})

	describe("remove command", () => {
		it("should recognize remove variant command routing", async () => {
			const promise = runCLI(["remove", "variant"])
			const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 100))
			const result = await Promise.race([promise, timeout])
			expect(result).toBe("timeout")
		})

		it("should recognize remove problem command routing", async () => {
			const promise = runCLI(["remove", "problem"])
			const timeout = new Promise((resolve) => setTimeout(() => resolve("timeout"), 100))
			const result = await Promise.race([promise, timeout])
			expect(result).toBe("timeout")
		})

		it("should show error for unknown remove subcommand", async () => {
			const result = await runCLI(["remove", "unknown"])
			expect(result.stderr).toContain("Unknown remove subcommand")
			expect(result.stdout).toContain("Usage:")
		})
	})

	describe("unknown command", () => {
		it("should show error for unknown command", async () => {
			const result = await runCLI(["invalid"])
			expect(result.stderr).toContain("Unknown command: invalid")
			expect(result.stdout).toContain("Usage:")
			expect(result.code).toBe(1)
		})
	})
})
