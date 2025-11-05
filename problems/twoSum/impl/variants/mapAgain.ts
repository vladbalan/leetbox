/**
 * mapAgainVariant: slightly different map-based two sum implementation, for benchmarking purposes
 * Time: O(n), Space: O(n)
 */
export function mapAgainVariant(arr: number[], target: number): number[] {
  const cache = new Map();
  for (let i = arr.length - 1; i >= 0; i--) {
    const diff = target - arr[i];
    if (cache.has(diff)) {
      return [i, cache.get(diff)];
    } else {
      cache.set(arr[i], i);
    }
  }
  return [-1, -1];
}
