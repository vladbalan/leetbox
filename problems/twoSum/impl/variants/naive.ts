/**
 * v0: naive double loop for comparison
 * Time: O(n^2), Space: O(1)
 */
export function naiveVariant(arr: number[], target: number): number[] {
	// Choose the pair with the smallest second index (j), then smallest i
	for (let j = 1; j < arr.length; j++) {
		for (let i = 0; i < j; i++) {
			if (arr[i] + arr[j] === target) return [i, j]
		}
	}
	return [-1, -1]
}
