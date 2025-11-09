import { mapVariant } from "./variants/map"
import { mapAgainVariant } from "./variants/mapAgain"
import { naiveVariant } from "./variants/naive"
import { usingObjectVariant } from "./variants/usingObject"

export { testCases } from "./testCases"

// Registry of implementations (newer version last)
export const implementations = [
	{ name: "naive", fn: (arr: number[], target: number) => naiveVariant(arr, target) },
	{ name: "map", fn: (arr: number[], target: number) => mapVariant(arr, target) },
	{ name: "usingObject", fn: (arr: number[], target: number) => usingObjectVariant(arr, target) },
	{ name: "mapAgain", fn: (arr: number[], target: number) => mapAgainVariant(arr, target) },
]

export const latest = implementations[implementations.length - 1]
