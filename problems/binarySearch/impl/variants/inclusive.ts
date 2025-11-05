/**
 * v1: inclusive interval [l, r]
 * Time: O(log n), Space: O(1)
 */
export function inclusiveVariant(arr: number[], target: number): number {
  let l = 0;
  let r = arr.length - 1; // r is inclusive
  while (l <= r) {
    const m = Math.floor((l + r) / 2);
    if (arr[m] === target) return m;
    if (arr[m] > target) r = m - 1;
    else l = m + 1;
  }
  return -1;
}
