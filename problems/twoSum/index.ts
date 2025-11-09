import { runTests } from "../../utils/testRunner"
import { latest, testCases } from "./impl"

/**
 * Two Sum
 * Runs tests against the latest implementation.
 */
runTests("Two Sum", ({ arr, target }) => latest.fn(arr, target), testCases)
