/**
 * hash map (reverse pass to match original expected indices semantics)
 * Time: O(n), Space: O(n)
 */
export function mapVariant(arr: number[], target: number): number[] {
	const cache = new Map<number, number>()
	for (let i = arr.length - 1; i >= 0; i--) {
		const complement = target - arr[i]
		const found = cache.get(complement)
		if (found !== undefined) {
			return [i, found]
		}
		cache.set(arr[i], i)
	}
	return [-1, -1]
}
