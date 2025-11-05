/**
 * v0: right-open interval [l, r)
 * Time: O(log n), Space: O(1)
 */
export function rightOpenVariant(arr: number[], target: number): number {
  let l = 0;
  let r = arr.length; // r is exclusive
  while (l < r) {
    const m = Math.floor((l + r) / 2);
    if (arr[m] === target) return m;
    if (arr[m] > target) r = m; // shrink right
    else l = m + 1; // move left up
  }
  return -1;
}
