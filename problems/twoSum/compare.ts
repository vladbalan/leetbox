import { runComparison } from "../../utils/bench"
import { implementations, testCases } from "./impl"

runComparison("TwoSum implementations", implementations, testCases, (input) => [input.arr, input.target], {
	iterations: 200,
	warmup: 1,
	quiet: true,
})
