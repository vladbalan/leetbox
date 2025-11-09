import { runComparison } from "../../utils/bench"
import { implementations, testCases } from "./impl"

runComparison("Binary Search implementations", implementations, testCases, (input) => [input.arr, input.target], {
	iterations: 100,
	warmup: 20,
	quiet: true,
})
