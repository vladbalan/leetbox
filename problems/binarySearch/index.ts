import { runTests } from "../../utils/testRunner"
import { latest, testCases } from "./impl"

runTests("Binary Search", ({ arr, target }) => latest.fn(arr, target), testCases)
