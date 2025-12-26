import { AlertCircle, Clock, FileQuestion, RefreshCw } from "lucide-react";
import { GitHubError } from "@/lib/api/github";

interface ErrorMessageProps {
  error: Error;
  onRetry?: () => void;
}

/**
 * Displays a user-friendly error message based on the error type.
 * Handles rate limits, not found, and generic errors.
 */
export function ErrorMessage({ error, onRetry }: ErrorMessageProps) {
  const isGitHubError = error instanceof GitHubError;
  const isRateLimit = isGitHubError && error.isRateLimit;
  const isNotFound = isGitHubError && error.isNotFound;

  // Choose icon and colors based on error type
  let Icon = AlertCircle;
  let iconColor = "text-red-500";
  let bgColor = "bg-red-50";
  let borderColor = "border-red-200";
  let title = "Something went wrong";

  if (isRateLimit) {
    Icon = Clock;
    iconColor = "text-amber-500";
    bgColor = "bg-amber-50";
    borderColor = "border-amber-200";
    title = "Rate limit exceeded";
  } else if (isNotFound) {
    Icon = FileQuestion;
    iconColor = "text-fg-muted";
    bgColor = "bg-bg";
    borderColor = "border-border";
    title = "Not found";
  }

  return (
    <div className={`rounded-xl border ${borderColor} ${bgColor} p-8`}>
      <div className="flex flex-col items-center text-center">
        <Icon size={48} className={`${iconColor} mb-4`} />
        <h2 className="text-lg font-semibold text-fg mb-2">{title}</h2>
        <p className="text-sm text-fg-secondary mb-4 max-w-md">{error.message}</p>

        {isRateLimit && isGitHubError && error.rateLimitReset && (
          <p className="text-xs text-fg-muted mb-4">
            Rate limit resets at {error.rateLimitReset.toLocaleTimeString()}
          </p>
        )}

        {isRateLimit && (
          <div className="text-xs text-fg-muted mb-4 max-w-md">
            <p>
              GitHub limits unauthenticated requests to 60 per hour. To increase this limit to 5,000
              requests per hour, you can authenticate with a GitHub token.
            </p>
          </div>
        )}

        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-fg-secondary bg-bg-secondary border border-border rounded-lg hover:bg-bg-hover transition-colors"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
