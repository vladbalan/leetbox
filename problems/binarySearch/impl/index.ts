import { rightOpenVariant } from "./variants/rightOpen";
import { inclusiveVariant } from "./variants/inclusive";
export { testCases } from "./testCases";

// Registry of implementations (newest last)
export const implementations = [
	{ name: "rightOpen", fn: (arr: number[], target: number) => rightOpenVariant(arr, target) },
	{ name: "inclusive", fn: (arr: number[], target: number) => inclusiveVariant(arr, target) },
	];

export const latest = implementations[implementations.length - 1];