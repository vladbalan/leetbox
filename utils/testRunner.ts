/**
 * Generic test case interface
 */
export interface TestCase<TInput, TExpected> {
  input: TInput;
  expected: TExpected;
  description?: string;
}

/**
 * Test result interface
 */
export interface TestResult {
  passed: number;
  failed: number;
  total: number;
}

/**
 * Runs a set of test cases against a solution function and logs results
 * 
 * @param solutionName - Name of the algorithm being tested
 * @param solution - The function to test
 * @param testCases - Array of test cases
 * @param comparator - Optional custom comparison function (defaults to strict equality)
 */
export function runTests<TInput, TExpected>(
  solutionName: string,
  solution: (input: TInput) => TExpected,
  testCases: TestCase<TInput, TExpected>[],
  comparator?: (result: TExpected, expected: TExpected) => boolean
): TestResult {
  console.log(`\n😬 === ${solutionName} Tests Started === 😬\n`);

  let passed = 0;
  let failed = 0;
  const tokens: string[] = [];
  const defaultComparator = (a: TExpected, b: TExpected) => JSON.stringify(a) === JSON.stringify(b);
  const compare = comparator || defaultComparator;

  testCases.forEach((testCase, index) => {
    console.log("_____________________________________________");
    console.log(`\nℹ️   Test Case ${index + 1}:`);
    if (testCase.description) {
      console.log(`ℹ️   ${testCase.description}`);
    }
    console.log(`ℹ️   Input: ${JSON.stringify(testCase.input)}`);
    console.log(`ℹ️   Expected: ${JSON.stringify(testCase.expected)}`);

    const result = solution(testCase.input);
    const isPass = compare(result, testCase.expected);

    if (isPass) {
      passed++;
      tokens.push("🟩");
    } else {
      failed++;
      tokens.push("🟥");
    }

    console.log(`\n${isPass ? "🟢" : "🔴"} Result: ${JSON.stringify(result)}`);
    console.log(`${isPass ? "✓ PASS" : "✗ FAIL"}`);
    console.log("_____________________________________________");
  });

  const total = testCases.length;
  console.log(`\nResults: ${passed}/${total} test cases passed:`);
  console.log(`${tokens.join(" ")}\n`);
  console.log(`😬 === ${solutionName} Tests Concluded === 😬\n`);

  return { passed, failed, total };
}
