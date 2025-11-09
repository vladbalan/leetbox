import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { selectFromList } from "./interactive"

describe("interactive", () => {
	let setRawModeSpy: ReturnType<typeof vi.fn>
	let resumeSpy: ReturnType<typeof vi.fn>
	let pauseSpy: ReturnType<typeof vi.fn>
	let originalIsTTY: boolean | undefined
	let originalSetRawMode: ((mode: boolean) => void) | undefined
	let originalResume: (() => void) | undefined
	let originalPause: (() => void) | undefined

	beforeEach(() => {
		// Store originals
		originalIsTTY = process.stdin.isTTY
		originalSetRawMode = process.stdin.setRawMode
		originalResume = process.stdin.resume
		originalPause = process.stdin.pause

		// Mock stdin methods
		setRawModeSpy = vi.fn()
		resumeSpy = vi.fn()
		pauseSpy = vi.fn()

		Object.defineProperty(process.stdin, "isTTY", {
			value: true,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(process.stdin, "setRawMode", {
			value: setRawModeSpy,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(process.stdin, "resume", {
			value: resumeSpy,
			writable: true,
			configurable: true,
		})
		Object.defineProperty(process.stdin, "pause", {
			value: pauseSpy,
			writable: true,
			configurable: true,
		})

		// Mock console methods
		vi.spyOn(console, "clear").mockImplementation(() => {})
		vi.spyOn(console, "log").mockImplementation(() => {})
	})

	afterEach(() => {
		vi.restoreAllMocks()
		process.stdin.removeAllListeners("keypress")

		// Restore originals
		Object.defineProperty(process.stdin, "isTTY", {
			value: originalIsTTY,
			writable: true,
			configurable: true,
		})
		if (originalSetRawMode) {
			Object.defineProperty(process.stdin, "setRawMode", {
				value: originalSetRawMode,
				writable: true,
				configurable: true,
			})
		}
		if (originalResume) {
			Object.defineProperty(process.stdin, "resume", {
				value: originalResume,
				writable: true,
				configurable: true,
			})
		}
		if (originalPause) {
			Object.defineProperty(process.stdin, "pause", {
				value: originalPause,
				writable: true,
				configurable: true,
			})
		}
	})

	describe("selectFromList", () => {
		it("should return selected item on Enter key", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			// Wait for event listener to be attached
			await new Promise((resolve) => setTimeout(resolve, 10))

			// Simulate Enter key press
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("item1")
			expect(setRawModeSpy).toHaveBeenCalledWith(true)
			expect(setRawModeSpy).toHaveBeenCalledWith(false)
		})

		it("should return undefined on escape key", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			process.stdin.emit("keypress", "", { name: "escape" })

			const result = await promise
			expect(result).toBeUndefined()
		})

		it("should return undefined on q key", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			process.stdin.emit("keypress", "", { name: "q" })

			const result = await promise
			expect(result).toBeUndefined()
		})

		it("should navigate down and select second item", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			process.stdin.emit("keypress", "", { name: "down" })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("item2")
		})

		it("should navigate up and wrap around", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			process.stdin.emit("keypress", "", { name: "up" })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("item3") // wraps to last item
		})

		it("should filter items by typing", async () => {
			const items = ["apple", "banana", "cherry"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			// Type 'b' to filter
			process.stdin.emit("keypress", "", { sequence: "b" })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("banana")
		})

		it("should handle backspace to remove filter", async () => {
			const items = ["apple", "banana", "cherry"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			// Type 'b' then backspace
			process.stdin.emit("keypress", "", { sequence: "b" })
			process.stdin.emit("keypress", "", { name: "backspace" })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("apple") // back to first item
		})

		it("should handle numeric jump selection", async () => {
			const items = ["item1", "item2", "item3"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			// Press '3' to jump to third item
			process.stdin.emit("keypress", "", { sequence: "3" })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("item3")
		})

		it("should show custom title when provided", async () => {
			const items = ["item1", "item2"]
			const promise = selectFromList(items, { title: "Custom Title" })

			await new Promise((resolve) => setTimeout(resolve, 10))

			process.stdin.emit("keypress", "", { name: "escape" })

			await promise
			expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Custom Title"))
		})

		it("should ignore control characters in filter", async () => {
			const items = ["item1", "item2"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			// Emit control character
			process.stdin.emit("keypress", "", { sequence: "\x03", ctrl: true })
			process.stdin.emit("keypress", "", { name: "return" })

			const result = await promise
			expect(result).toBe("item1") // filter unchanged
		})

		it("should handle empty filtered list", async () => {
			const items = ["apple", "banana"]
			const promise = selectFromList(items)

			await new Promise((resolve) => setTimeout(resolve, 10))

			// Type 'xyz' to get no matches
			process.stdin.emit("keypress", "", { sequence: "x" })
			process.stdin.emit("keypress", "", { sequence: "y" })
			process.stdin.emit("keypress", "", { sequence: "z" })
			process.stdin.emit("keypress", "", { name: "escape" })

			const result = await promise
			expect(result).toBeUndefined()
		})
	})
})
