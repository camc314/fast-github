/**
 * Formats a number into a human-readable string with k/m suffixes.
 * Examples: 1234 -> "1.2k", 1234567 -> "1.2m"
 */
export function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}m`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}
