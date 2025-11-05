import { TestCase } from "../../../utils/testRunner";

// Test cases
export const testCases: TestCase<
  { arr: number[]; target: number },
  number[]
>[] = [
  {
    input: { arr: [1, 2, 5, 7, 9, 13, 25, 67], target: 9 },
    expected: [1, 3],
    description: "Find indices where values sum to 9",
  },
  {
    input: { arr: [1, 2, 3, 6], target: 5 },
    expected: [1, 2],
    description: "Find indices where values sum to 5",
  },
  {
    input: { arr: [12, 23, 34, 45, 55, 67, 78, 89], target: 90 },
    expected: [1, 5],
    description: "Find indices where values sum to 90",
  },
  {
    input: { arr: [3, 3], target: 6 },
    expected: [0, 1],
    description: "Same value twice",
  },
  {
    input: { arr: Array.from({ length: 10000 }, (_, i) => i), target: 19997 },
    expected: [9998, 9999],
    description: "Large array performance test",
  }
];
