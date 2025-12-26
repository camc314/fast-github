/**
 * Formats a date string into a human-readable relative time string.
 * Examples: "just now", "5m ago", "3h ago", "yesterday", "2d ago", "3w ago", "2mo ago", "1y ago"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates or very recent times
  if (diffMs < 0) return "just now";

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 1) return "just now";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours === 0) {
    return `${diffMinutes}m ago`;
  }

  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

/**
 * Formats a date string into an absolute, human-readable format.
 * Example: "Jan 15, 2024, 3:45 PM"
 */
export function formatAbsoluteTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
