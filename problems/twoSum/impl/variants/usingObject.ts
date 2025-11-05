/**
 * usingObjectVariant: two sum implementation using an object to store complements
 * Time: O(n), Space: O(n)
 */
export function usingObjectVariant(arr: number[], target: number): number[] {
  const c: Record<number, number> = {}
  for (let i = arr.length; i >= 0; i--) {
    const d = target - arr[i]
    if (c[d]) {
      return [i, c[d]]
    } else {
      c[arr[i]] = i
    }
  }
  return [-1, -1];
}
