import { useState } from "react";
import {
  GitMerge,
  GitPullRequest,
  Check,
  X,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  SkipForward,
  ExternalLink,
  Loader2,
  GitBranch,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/date";
import type { PullRequest, ChecksSummary, CheckRun, PRReview } from "@/lib/types/github";

interface PRMergeSectionProps {
  pr: PullRequest;
  checks: ChecksSummary;
  reviews: PRReview[];
}

/**
 * Get the icon and styling for a check based on its status
 */
function getCheckIcon(check: CheckRun): {
  icon: typeof Check;
  colorClass: string;
  isAnimated?: boolean;
} {
  if (check.status === "in_progress") {
    return { icon: Loader2, colorClass: "text-amber-500", isAnimated: true };
  }
  if (check.status === "queued") {
    return { icon: Clock, colorClass: "text-fg-muted" };
  }

  switch (check.conclusion) {
    case "success":
      return { icon: Check, colorClass: "text-emerald-600" };
    case "failure":
    case "timed_out":
      return { icon: X, colorClass: "text-red-500" };
    case "skipped":
    case "cancelled":
    case "neutral":
      return { icon: SkipForward, colorClass: "text-fg-muted" };
    default:
      return { icon: Clock, colorClass: "text-fg-muted" };
  }
}

/**
 * Individual check item in the list
 */
function CheckItem({ check }: { check: CheckRun }) {
  const { icon: StatusIcon, colorClass, isAnimated } = getCheckIcon(check);

  return (
    <a
      href={check.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded hover:bg-bg-hover transition-colors group"
    >
      <StatusIcon
        size={14}
        className={`${colorClass} shrink-0 ${isAnimated ? "animate-spin" : ""}`}
      />
      <span className="text-sm text-fg truncate flex-1">{check.name}</span>
      <ExternalLink
        size={12}
        className="text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
      />
    </a>
  );
}

/**
 * Checks summary section
 */
function ChecksSummarySection({
  checks,
  isExpanded,
  onToggle,
}: {
  checks: ChecksSummary;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const { success, failure, pending, skipped, total } = checks;
  const hasFailed = failure > 0;
  const isPending = pending > 0 && failure === 0;

  let statusIcon = Check;
  let statusColor = "text-emerald-600";
  let statusBg = "bg-emerald-500/10";
  let statusText = "All checks have passed";

  if (hasFailed) {
    statusIcon = X;
    statusColor = "text-red-500";
    statusBg = "bg-red-500/10";
    statusText = `${failure} failing check${failure > 1 ? "s" : ""}`;
  } else if (isPending) {
    statusIcon = Clock;
    statusColor = "text-amber-500";
    statusBg = "bg-amber-500/10";
    statusText = `${pending} pending check${pending > 1 ? "s" : ""}`;
  } else if (total === 0) {
    statusIcon = Clock;
    statusColor = "text-fg-muted";
    statusBg = "bg-bg-tertiary";
    statusText = "No status checks";
  }

  const StatusIcon = statusIcon;

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-3 w-full px-4 py-3 bg-bg-secondary hover:bg-bg-hover transition-colors text-left"
      >
        <div className={`p-1.5 rounded-full ${statusBg}`}>
          <StatusIcon size={16} className={statusColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>
          {total > 0 && (
            <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5">
              {success > 0 && (
                <span className="flex items-center gap-0.5">
                  <Check size={10} className="text-emerald-600" />
                  {success} passed
                </span>
              )}
              {failure > 0 && (
                <span className="flex items-center gap-0.5">
                  <X size={10} className="text-red-500" />
                  {failure} failed
                </span>
              )}
              {pending > 0 && (
                <span className="flex items-center gap-0.5">
                  <Clock size={10} className="text-amber-500" />
                  {pending} pending
                </span>
              )}
              {skipped > 0 && (
                <span className="flex items-center gap-0.5">
                  <SkipForward size={10} />
                  {skipped} skipped
                </span>
              )}
            </div>
          )}
        </div>
        {total > 0 && (
          <span className="text-fg-muted">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>
        )}
      </button>

      {isExpanded && total > 0 && (
        <div className="px-4 py-2 border-t border-border bg-bg max-h-64 overflow-y-auto">
          {checks.checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Review approval summary section
 */
function ReviewsSummarySection({ reviews, pr }: { reviews: PRReview[]; pr: PullRequest }) {
  const approvals = reviews.filter((r) => r.state === "APPROVED");
  const changesRequested = reviews.filter((r) => r.state === "CHANGES_REQUESTED");
  const pendingReviewers = pr.requestedReviewers;

  const hasApprovals = approvals.length > 0;
  const hasChangesRequested = changesRequested.length > 0;
  const hasPendingReviews = pendingReviewers.length > 0;

  let statusIcon = ShieldCheck;
  let statusColor = "text-emerald-600";
  let statusBg = "bg-emerald-500/10";
  let statusText = "Changes approved";

  if (hasChangesRequested) {
    statusIcon = ShieldX;
    statusColor = "text-red-500";
    statusBg = "bg-red-500/10";
    statusText = "Changes requested";
  } else if (!hasApprovals && hasPendingReviews) {
    statusIcon = ShieldAlert;
    statusColor = "text-amber-500";
    statusBg = "bg-amber-500/10";
    statusText = "Review required";
  } else if (!hasApprovals && !hasPendingReviews) {
    statusIcon = ShieldAlert;
    statusColor = "text-fg-muted";
    statusBg = "bg-bg-tertiary";
    statusText = "No reviews";
  }

  const StatusIcon = statusIcon;

  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-bg-secondary">
      <div className={`p-1.5 rounded-full ${statusBg}`}>
        <StatusIcon size={16} className={statusColor} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-sm font-medium ${statusColor}`}>{statusText}</div>
        <div className="flex items-center gap-2 text-xs text-fg-muted mt-0.5">
          {hasApprovals && (
            <span className="flex items-center gap-1">
              {approvals.slice(0, 3).map((r) => (
                <Avatar key={r.id} src={r.user.avatarUrl} alt={r.user.login} size={16} />
              ))}
              {approvals.length > 3 && <span>+{approvals.length - 3}</span>}
              <span className="ml-1">approved</span>
            </span>
          )}
          {hasChangesRequested && (
            <span>
              {changesRequested.length} requested change{changesRequested.length > 1 ? "s" : ""}
            </span>
          )}
          {hasPendingReviews && (
            <span>{pendingReviewers.length} pending review{pendingReviewers.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Merge status indicator
 */
function MergeStatusSection({ pr }: { pr: PullRequest }) {
  // Already merged
  if (pr.state === "merged") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-purple-500/30 rounded-lg bg-purple-500/10">
        <div className="p-1.5 rounded-full bg-purple-500/20">
          <GitMerge size={16} className="text-purple-600 dark:text-purple-400" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Pull request merged
          </div>
          <div className="text-xs text-fg-muted mt-0.5 flex items-center gap-1">
            {pr.mergedBy && (
              <>
                <Avatar src={pr.mergedBy.avatarUrl} alt={pr.mergedBy.login} size={14} />
                <span>{pr.mergedBy.login}</span>
                <span>merged</span>
              </>
            )}
            {pr.mergedAt && <span>{formatRelativeTime(pr.mergedAt)}</span>}
          </div>
        </div>
      </div>
    );
  }

  // Closed without merge
  if (pr.state === "closed") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-red-500/30 rounded-lg bg-red-500/10">
        <div className="p-1.5 rounded-full bg-red-500/20">
          <GitPullRequest size={16} className="text-red-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-red-500">Pull request closed</div>
          <div className="text-xs text-fg-muted mt-0.5">
            This pull request was closed without being merged
          </div>
        </div>
      </div>
    );
  }

  // Open PR - show merge status
  if (pr.mergeableState === "conflicting") {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-red-500/30 rounded-lg bg-red-500/10">
        <div className="p-1.5 rounded-full bg-red-500/20">
          <AlertTriangle size={16} className="text-red-500" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-red-500">This branch has conflicts</div>
          <div className="text-xs text-fg-muted mt-0.5">
            Conflicts must be resolved before merging
          </div>
        </div>
      </div>
    );
  }

  if (pr.mergeableState === "unknown" || pr.mergeable === null) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 border border-border rounded-lg bg-bg-secondary">
        <div className="p-1.5 rounded-full bg-bg-tertiary">
          <Loader2 size={16} className="text-fg-muted animate-spin" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-fg-secondary">Checking merge status...</div>
          <div className="text-xs text-fg-muted mt-0.5">
            GitHub is calculating if this branch can be merged
          </div>
        </div>
      </div>
    );
  }

  // Mergeable
  return (
    <div className="flex items-center gap-3 px-4 py-3 border border-emerald-500/30 rounded-lg bg-emerald-500/10">
      <div className="p-1.5 rounded-full bg-emerald-500/20">
        <Check size={16} className="text-emerald-600" />
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-emerald-600">This branch has no conflicts</div>
        <div className="text-xs text-fg-muted mt-0.5 flex items-center gap-1">
          <GitBranch size={12} />
          <span>
            Merging <strong>{pr.headBranch}</strong> into <strong>{pr.baseBranch}</strong>
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * Main merge section component
 */
export function PRMergeSection({ pr, checks, reviews }: PRMergeSectionProps) {
  const [checksExpanded, setChecksExpanded] = useState(
    checks.failure > 0 || checks.pending > 0,
  );

  const isOpen = pr.state === "open";
  const canMerge =
    isOpen &&
    pr.mergeableState === "mergeable" &&
    checks.failure === 0 &&
    !reviews.some((r) => r.state === "CHANGES_REQUESTED");

  return (
    <div className="bg-bg-secondary rounded-xl border border-border shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-bg-tertiary">
        <div className="flex items-center gap-2">
          <GitMerge size={16} className="text-fg-secondary" />
          <h3 className="text-sm font-semibold text-fg">Merge</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Merge status */}
        <MergeStatusSection pr={pr} />

        {/* Only show checks and reviews for open PRs */}
        {isOpen && (
          <>
            {/* Checks */}
            <ChecksSummarySection
              checks={checks}
              isExpanded={checksExpanded}
              onToggle={() => setChecksExpanded(!checksExpanded)}
            />

            {/* Reviews */}
            <ReviewsSummarySection reviews={reviews} pr={pr} />

            {/* Merge button (visual only - no functionality) */}
            <div className="pt-2">
              <button
                type="button"
                disabled={!canMerge}
                className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2
                  ${
                    canMerge
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-bg-tertiary text-fg-muted cursor-not-allowed"
                  }`}
                title={canMerge ? "Merge pull request" : "Cannot merge - requirements not met"}
              >
                <GitMerge size={16} />
                {pr.draft ? "Mark ready and merge" : "Merge pull request"}
              </button>
              {!canMerge && isOpen && (
                <p className="text-xs text-fg-muted text-center mt-2">
                  {checks.failure > 0
                    ? "Some checks have failed"
                    : checks.pending > 0
                      ? "Some checks are still pending"
                      : reviews.some((r) => r.state === "CHANGES_REQUESTED")
                        ? "Changes have been requested"
                        : pr.mergeableState === "conflicting"
                          ? "Resolve conflicts before merging"
                          : pr.draft
                            ? "This is a draft pull request"
                            : "Waiting for requirements"}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
