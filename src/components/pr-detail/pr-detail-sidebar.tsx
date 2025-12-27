import { useState } from "react";
import {
  Check,
  X,
  Clock,
  CircleDot,
  Users,
  UserCheck,
  AlertCircle,
  Tag,
  ChevronDown,
  ChevronRight,
  SkipForward,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { AssigneePicker } from "@/components/ui/assignee-picker";
import { LabelPicker } from "@/components/ui/label-picker";
import type { PullRequest, PRReview, ChecksSummary, CheckRun, User } from "@/lib/types/github";

interface PRDetailSidebarProps {
  owner: string;
  repo: string;
  pr: PullRequest;
  reviews: PRReview[];
  checks: ChecksSummary;
}

function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function ReviewersList({
  requestedReviewers,
  reviews,
}: {
  requestedReviewers: User[];
  reviews: PRReview[];
}) {
  // Get unique reviewers with their latest review state
  const reviewerMap = new Map<string, { user: User; state: string | null }>();

  // Add requested reviewers (pending)
  for (const user of requestedReviewers) {
    reviewerMap.set(user.login, { user, state: null });
  }

  // Add actual reviews (override pending if they've reviewed)
  for (const review of reviews) {
    const existing = reviewerMap.get(review.user.login);
    // Only update if no existing review or this is more recent
    if (!existing || existing.state === null || review.state !== "COMMENTED") {
      reviewerMap.set(review.user.login, { user: review.user, state: review.state });
    }
  }

  const reviewers = Array.from(reviewerMap.values());

  if (reviewers.length === 0) {
    return <p className="text-sm text-fg-muted">No reviewers</p>;
  }

  return (
    <div className="space-y-2">
      {reviewers.map(({ user, state }) => (
        <div key={user.login} className="flex items-center gap-2">
          <Avatar src={user.avatarUrl} alt={user.login} size={20} />
          <span className="text-sm text-fg-secondary flex-1">{user.login}</span>
          <ReviewStateIcon state={state} />
        </div>
      ))}
    </div>
  );
}

function ReviewStateIcon({ state }: { state: string | null }) {
  switch (state) {
    case "APPROVED":
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-600">
          <Check size={14} />
        </span>
      );
    case "CHANGES_REQUESTED":
      return (
        <span className="flex items-center gap-1 text-xs text-red-500">
          <X size={14} />
        </span>
      );
    case "COMMENTED":
      return (
        <span className="flex items-center gap-1 text-xs text-fg-muted">
          <CircleDot size={14} />
        </span>
      );
    case "PENDING":
    case null:
      return (
        <span className="flex items-center gap-1 text-xs text-amber-500">
          <Clock size={14} />
        </span>
      );
    default:
      return null;
  }
}

/**
 * Format duration between two dates in human-readable format
 */
function formatDuration(startedAt: string | null, completedAt: string | null): string | null {
  if (!startedAt || !completedAt) return null;

  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const durationMs = end - start;

  if (durationMs < 0) return null;

  const seconds = Math.floor(durationMs / 1000);
  if (seconds < 60) return `${seconds}s`;

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get icon and color for a check based on its status and conclusion
 */
function getCheckStatusDisplay(check: CheckRun): {
  icon: typeof Check;
  colorClass: string;
  bgClass: string;
  label: string;
} {
  if (check.status === "queued") {
    return {
      icon: Clock,
      colorClass: "text-fg-muted",
      bgClass: "bg-bg-tertiary",
      label: "Queued",
    };
  }

  if (check.status === "in_progress") {
    return {
      icon: Loader2,
      colorClass: "text-amber-500",
      bgClass: "bg-amber-500/10",
      label: "In progress",
    };
  }

  // Completed - check conclusion
  switch (check.conclusion) {
    case "success":
      return {
        icon: Check,
        colorClass: "text-emerald-600",
        bgClass: "bg-emerald-500/10",
        label: "Passed",
      };
    case "failure":
      return {
        icon: X,
        colorClass: "text-red-500",
        bgClass: "bg-red-500/10",
        label: "Failed",
      };
    case "timed_out":
      return {
        icon: Clock,
        colorClass: "text-red-500",
        bgClass: "bg-red-500/10",
        label: "Timed out",
      };
    case "cancelled":
      return {
        icon: X,
        colorClass: "text-fg-muted",
        bgClass: "bg-bg-tertiary",
        label: "Cancelled",
      };
    case "skipped":
      return {
        icon: SkipForward,
        colorClass: "text-fg-muted",
        bgClass: "bg-bg-tertiary",
        label: "Skipped",
      };
    case "neutral":
      return {
        icon: CircleDot,
        colorClass: "text-fg-muted",
        bgClass: "bg-bg-tertiary",
        label: "Neutral",
      };
    case "action_required":
      return {
        icon: AlertCircle,
        colorClass: "text-amber-500",
        bgClass: "bg-amber-500/10",
        label: "Action required",
      };
    default:
      return {
        icon: CircleDot,
        colorClass: "text-fg-muted",
        bgClass: "bg-bg-tertiary",
        label: "Unknown",
      };
  }
}

/**
 * Group checks by their app/workflow
 */
function groupChecksByApp(checks: CheckRun[]): Map<string, CheckRun[]> {
  const groups = new Map<string, CheckRun[]>();

  for (const check of checks) {
    const appName = check.appName ?? "Other";
    const existing = groups.get(appName) ?? [];
    existing.push(check);
    groups.set(appName, existing);
  }

  return groups;
}

/**
 * Individual check item display
 */
function CheckItem({ check }: { check: CheckRun }) {
  const { icon: StatusIcon, colorClass, label } = getCheckStatusDisplay(check);
  const duration = formatDuration(check.startedAt, check.completedAt);
  const isAnimated = check.status === "in_progress";

  return (
    <a
      href={check.htmlUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-bg-hover transition-colors group"
    >
      <StatusIcon
        size={14}
        className={`${colorClass} shrink-0 ${isAnimated ? "animate-spin" : ""}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs text-fg truncate">{check.name}</span>
          <ExternalLink
            size={10}
            className="text-fg-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          />
        </div>
        {duration && <span className="text-[10px] text-fg-muted">{duration}</span>}
      </div>
      <span className={`text-[10px] ${colorClass} shrink-0`}>{label}</span>
    </a>
  );
}

/**
 * Collapsible group of checks
 */
function CheckGroup({
  appName,
  checks,
  defaultExpanded = false,
}: {
  appName: string;
  checks: CheckRun[];
  defaultExpanded?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  // Calculate group summary
  const successCount = checks.filter(
    (c) => c.status === "completed" && c.conclusion === "success",
  ).length;
  const failureCount = checks.filter(
    (c) => c.status === "completed" && (c.conclusion === "failure" || c.conclusion === "timed_out"),
  ).length;
  const pendingCount = checks.filter(
    (c) => c.status === "queued" || c.status === "in_progress",
  ).length;

  // Determine group status color
  let groupColorClass = "text-emerald-600";
  if (failureCount > 0) {
    groupColorClass = "text-red-500";
  } else if (pendingCount > 0) {
    groupColorClass = "text-amber-500";
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full px-3 py-2 bg-bg-tertiary hover:bg-bg-hover transition-colors text-left"
      >
        {isExpanded ? (
          <ChevronDown size={14} className="text-fg-muted shrink-0" />
        ) : (
          <ChevronRight size={14} className="text-fg-muted shrink-0" />
        )}
        <span className="text-xs font-medium text-fg flex-1 truncate">{appName}</span>
        <div className="flex items-center gap-2 text-[10px]">
          {failureCount > 0 && (
            <span className="flex items-center gap-0.5 text-red-500">
              <X size={10} />
              {failureCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="flex items-center gap-0.5 text-amber-500">
              <Clock size={10} />
              {pendingCount}
            </span>
          )}
          {successCount > 0 && (
            <span className="flex items-center gap-0.5 text-emerald-600">
              <Check size={10} />
              {successCount}
            </span>
          )}
          <span className={`font-medium ${groupColorClass}`}>
            {checks.length} check{checks.length !== 1 ? "s" : ""}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 py-2 space-y-0.5 border-t border-border bg-bg">
          {checks.map((check) => (
            <CheckItem key={check.id} check={check} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChecksSection({ checks }: { checks: ChecksSummary }) {
  const [showAll, setShowAll] = useState(false);

  if (checks.total === 0) {
    return <p className="text-sm text-fg-muted">No checks</p>;
  }

  const { success, failure, pending, skipped } = checks;

  // Overall status
  let statusColor = "text-emerald-600 dark:text-emerald-400";
  let statusBg = "bg-emerald-500/10";
  let StatusIcon = Check;
  let statusText = "All checks passed";

  if (failure > 0) {
    statusColor = "text-red-600 dark:text-red-400";
    statusBg = "bg-red-500/10";
    StatusIcon = X;
    statusText = `${failure} check${failure > 1 ? "s" : ""} failed`;
  } else if (pending > 0) {
    statusColor = "text-amber-600 dark:text-amber-400";
    statusBg = "bg-amber-500/10";
    StatusIcon = Clock;
    statusText = `${pending} check${pending > 1 ? "s" : ""} pending`;
  }

  // Group checks by app
  const groupedChecks = groupChecksByApp(checks.checks);
  const hasMultipleGroups = groupedChecks.size > 1;

  // Sort groups: failures first, then pending, then success
  const sortedGroups = Array.from(groupedChecks.entries()).sort(([, a], [, b]) => {
    const aHasFailure = a.some((c) => c.conclusion === "failure" || c.conclusion === "timed_out");
    const bHasFailure = b.some((c) => c.conclusion === "failure" || c.conclusion === "timed_out");
    const aHasPending = a.some((c) => c.status === "queued" || c.status === "in_progress");
    const bHasPending = b.some((c) => c.status === "queued" || c.status === "in_progress");

    if (aHasFailure && !bHasFailure) return -1;
    if (!aHasFailure && bHasFailure) return 1;
    if (aHasPending && !bHasPending) return -1;
    if (!aHasPending && bHasPending) return 1;
    return 0;
  });

  return (
    <div className="space-y-3">
      {/* Summary badge */}
      <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg ${statusBg}`}>
        <StatusIcon size={14} className={statusColor} />
        <span className={`text-sm font-medium ${statusColor}`}>{statusText}</span>
      </div>

      {/* Breakdown */}
      <div className="flex items-center gap-3 text-xs">
        {success > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <Check size={12} />
            {success}
          </span>
        )}
        {failure > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <X size={12} />
            {failure}
          </span>
        )}
        {pending > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <Clock size={12} />
            {pending}
          </span>
        )}
        {skipped > 0 && (
          <span className="flex items-center gap-1 text-fg-muted">
            <SkipForward size={12} />
            {skipped}
          </span>
        )}
        <span className="text-fg-muted">{checks.total} total</span>
      </div>

      {/* Detailed checks list */}
      {showAll ? (
        <div className="space-y-2">
          {hasMultipleGroups ? (
            // Show grouped by app
            sortedGroups.map(([appName, appChecks]) => (
              <CheckGroup
                key={appName}
                appName={appName}
                checks={appChecks}
                defaultExpanded={appChecks.some(
                  (c) =>
                    c.conclusion === "failure" ||
                    c.conclusion === "timed_out" ||
                    c.status === "in_progress",
                )}
              />
            ))
          ) : (
            // Show flat list for single app
            <div className="border border-border rounded-lg px-3 py-2 space-y-0.5 bg-bg">
              {checks.checks.map((check) => (
                <CheckItem key={check.id} check={check} />
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowAll(false)}
            className="text-xs text-fg-muted hover:text-fg-secondary transition-colors"
          >
            Show less
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Show failed/pending checks preview */}
          {(failure > 0 || pending > 0) && (
            <div className="space-y-1">
              {checks.checks
                .filter(
                  (c) =>
                    c.conclusion === "failure" ||
                    c.conclusion === "timed_out" ||
                    c.status === "in_progress" ||
                    c.status === "queued",
                )
                .slice(0, 3)
                .map((check) => (
                  <CheckItem key={check.id} check={check} />
                ))}
            </div>
          )}

          {checks.total > 3 && (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="text-xs text-blue-600 hover:text-blue-700 hover:underline transition-colors"
            >
              Show all {checks.total} checks
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function PRDetailSidebar({ owner, repo, pr, reviews, checks }: PRDetailSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-bg-secondary rounded-xl border border-border shadow-sm p-4">
        <SidebarSection title="Assignees" icon={Users}>
          <AssigneePicker
            owner={owner}
            repo={repo}
            issueNumber={pr.number}
            currentAssignees={pr.assignees}
            queryKeyPrefix="pull-request"
          />
        </SidebarSection>

        <SidebarSection title="Reviewers" icon={UserCheck}>
          <ReviewersList requestedReviewers={pr.requestedReviewers} reviews={reviews} />
        </SidebarSection>

        <SidebarSection title="Labels" icon={Tag}>
          <LabelPicker
            owner={owner}
            repo={repo}
            issueNumber={pr.number}
            currentLabels={pr.labels}
            queryKeyPrefix="pull-request"
          />
        </SidebarSection>

        <SidebarSection title="Checks" icon={AlertCircle}>
          <ChecksSection checks={checks} />
        </SidebarSection>
      </div>
    </aside>
  );
}
