#!/usr/bin/env node

// Lightweight CLI shim to run TypeScript scripts via tsx
// Usage: leetbox <command> [args]
// Commands:
//   compare [problem]
//   latest [problem]
//   add variant
//   remove variant
//   add (interactive)
//   remove (interactive)

const { spawn } = require("node:child_process")
const path = require("node:path")

function findTsxExecutable() {
	// Prefer the local .bin shim (works cross-platform)
	const exe = process.platform === "win32" ? "tsx.cmd" : "tsx"
	const binPath = path.resolve(__dirname, "..", "node_modules", ".bin", exe)
	return binPath
}

function runTsx(scriptRelPath, args) {
	const tsxBin = findTsxExecutable()
	const scriptPath = path.resolve(__dirname, "..", scriptRelPath)
	// On Windows, spawn the .cmd directly; elsewhere, the binary
	const child = spawn(tsxBin, [scriptPath, ...args], {
		stdio: "inherit",
		env: process.env,
		shell: process.platform === "win32",
	})
	child.on("exit", (code, signal) => {
		if (signal) {
			process.kill(process.pid, signal)
		} else {
			process.exit(code ?? 0)
		}
	})
}

function printHelp() {
	console.log("leetbox - benchmark CLI")
	console.log("")
	console.log("Usage:")
	console.log("  leetbox <command> [args]")
	console.log("")
	console.log("Interactive:")
	console.log("  leetbox")
	console.log("  leetbox add")
	console.log("  leetbox remove")
	console.log("  leetbox compare")
	console.log("  leetbox latest")
	console.log("")
	console.log("  leetbox compare [problem]")
	console.log("  leetbox latest [problem]")
	console.log("  leetbox add [variant|problem]")
	console.log("  leetbox remove [variant|problem]")
	console.log("")
	console.log("  leetbox add variant")
	console.log("  leetbox add problem")
	console.log("  leetbox remove variant")
	console.log("  leetbox remove problem")
	console.log("")
	console.log("Examples:")
	console.log("  leetbox compare searchRotated")
	console.log("  leetbox latest twoSum")
	console.log("  leetbox add variant")
}

function main() {
	const [cmd, ...rest] = process.argv.slice(2)
	switch ((cmd || "").toLowerCase()) {
		case "compare":
			return runTsx(path.join("scripts", "compare.ts"), rest)
		case "latest":
			return runTsx(path.join("scripts", "latest.ts"), rest)
		case "add": {
			const sub = (rest[0] || "").toLowerCase()
			if (sub === "variant") {
				return runTsx(path.join("scripts", "add-variant.ts"), rest.slice(1))
			}
			if (sub === "problem") {
				return runTsx(path.join("scripts", "add-problem.ts"), rest.slice(1))
			}
			// interactive picker when no subcommand provided
			if (!sub) {
				return runTsx(path.join("scripts", "add.ts"), rest)
			}
			console.error(`Unknown add subcommand: ${rest[0] || "(none)"}`)
			return printHelp()
		}
		case "remove": {
			const sub = (rest[0] || "").toLowerCase()
			if (sub === "variant") {
				return runTsx(path.join("scripts", "remove-variant.ts"), rest.slice(1))
			}
			if (sub === "problem") {
				return runTsx(path.join("scripts", "remove-problem.ts"), rest.slice(1))
			}
			// interactive picker when no subcommand provided
			if (!sub) {
				return runTsx(path.join("scripts", "remove.ts"), rest)
			}
			console.error(`Unknown remove subcommand: ${rest[0] || "(none)"}`)
			return printHelp()
		}
		case "-h":
		case "--help":
		case "help":
			return printHelp()
		case "":
		case undefined:
			return runTsx(path.join("scripts", "menu.ts"), rest)
		default:
			console.error(`Unknown command: ${cmd}`)
			printHelp()
			process.exit(1)
	}
}

main()
