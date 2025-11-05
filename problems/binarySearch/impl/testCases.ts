import { TestCase } from "../../../utils/testRunner";

// Test cases (migrated)
export const testCases: TestCase<{ arr: number[]; target: number }, number>[] = [
  {
    input: { arr: [1, 2, 5, 7, 9, 13, 25, 67], target: 13 },
    expected: 5,
    description: "Find 13 in array",
  },
  {
    input: { arr: [11, 14, 23, 34], target: 89 },
    expected: -1,
    description: "Target not in array",
  },
  {
    input: { arr: [11, 14, 23, 34], target: 14 },
    expected: 1,
    description: "Find 14 in array",
  },
  {
    input: { arr: [11, 14, 23, 34], target: 11 },
    expected: 0,
    description: "Find first element",
  },
  {
    input: { arr: [11, 14, 23, 34], target: 23 },
    expected: 2,
    description: "Find 23 in array",
  },
  {
    input: { arr: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], target: 9 },
    expected: 8,
    description: "Find 9 in larger array",
  },
];
