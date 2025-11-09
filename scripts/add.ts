#!/usr/bin/env tsx

import { selectFromList } from "./interactive"

async function main() {
	const pick = await selectFromList(["variant", "problem"], { title: "Select an add command" })
	if (!pick) return
	switch (pick) {
		case "variant":
			await import("./add-variant.js")
			return
		case "problem":
			await import("./add-problem.js")
			return
		default:
			return
	}
}

main().catch((err: unknown) => {
	const message = err instanceof Error ? err.message : String(err)
	console.error(message)
	process.exit(1)
})
