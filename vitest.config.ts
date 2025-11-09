import { resolve } from "node:path"
import { defineConfig } from "vitest/config"

export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		testTimeout: 10000,
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["utils/**/*.ts", "scripts/**/*.ts"],
			exclude: [
				"**/*.test.ts",
				"**/*.spec.ts",
				"node_modules/**",
				"dist/**",
				"scripts/add.ts",
				"scripts/menu.ts",
				"scripts/remove.ts",
				"scripts/remove-problem.ts",
				"scripts/remove-variant.ts",
			],
		},
	},
	resolve: {
		alias: {
			"@utils": resolve(__dirname, "./utils"),
			"@problems": resolve(__dirname, "./problems"),
			"@scripts": resolve(__dirname, "./scripts"),
		},
	},
})
