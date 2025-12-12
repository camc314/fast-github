import { Check, X, Clock, CircleDot, Users, UserCheck, AlertCircle, Tag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import type { PullRequest, PRReview, ChecksSummary, User } from "@/lib/types/github";

interface PRDetailSidebarProps {
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
    <div className="py-4 border-b border-neutral-100 last:border-b-0">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function UserList({ users, emptyText }: { users: User[]; emptyText: string }) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {users.map((user) => (
        <div key={user.login} className="flex items-center gap-1.5">
          <Avatar src={user.avatarUrl} alt={user.login} size={20} />
          <span className="text-sm text-neutral-700">{user.login}</span>
        </div>
      ))}
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
    return <p className="text-sm text-neutral-400">No reviewers</p>;
  }

  return (
    <div className="space-y-2">
      {reviewers.map(({ user, state }) => (
        <div key={user.login} className="flex items-center gap-2">
          <Avatar src={user.avatarUrl} alt={user.login} size={20} />
          <span className="text-sm text-neutral-700 flex-1">{user.login}</span>
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
        <span className="flex items-center gap-1 text-xs text-neutral-400">
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

function ChecksSection({ checks }: { checks: ChecksSummary }) {
  if (checks.total === 0) {
    return <p className="text-sm text-neutral-400">No checks</p>;
  }

  const { success, failure, pending } = checks;

  // Overall status
  let statusColor = "text-emerald-600";
  let statusBg = "bg-emerald-50";
  let StatusIcon = Check;
  let statusText = "All checks passed";

  if (failure > 0) {
    statusColor = "text-red-600";
    statusBg = "bg-red-50";
    StatusIcon = X;
    statusText = `${failure} check${failure > 1 ? "s" : ""} failed`;
  } else if (pending > 0) {
    statusColor = "text-amber-600";
    statusBg = "bg-amber-50";
    StatusIcon = Clock;
    statusText = `${pending} check${pending > 1 ? "s" : ""} pending`;
  }

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
        <span className="text-neutral-400">{checks.total} total</span>
      </div>

      {/* Individual checks (collapsed by default, show first few failures) */}
      {failure > 0 && (
        <div className="space-y-1.5 pt-1">
          {checks.checks
            .filter((c) => c.conclusion === "failure" || c.conclusion === "timed_out")
            .slice(0, 3)
            .map((check) => (
              <a
                key={check.id}
                href={check.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 hover:underline"
              >
                <X size={12} />
                <span className="truncate">{check.name}</span>
              </a>
            ))}
        </div>
      )}
    </div>
  );
}

function LabelsSection({ labels }: { labels: PullRequest["labels"] }) {
  if (labels.length === 0) {
    return <p className="text-sm text-neutral-400">No labels</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <Label key={label.id} label={label} />
      ))}
    </div>
  );
}

export function PRDetailSidebar({ pr, reviews, checks }: PRDetailSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      {/* TODO: make stats be here */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
        <SidebarSection title="Assignees" icon={Users}>
          <UserList users={pr.assignees} emptyText="No assignees" />
        </SidebarSection>

        <SidebarSection title="Reviewers" icon={UserCheck}>
          <ReviewersList requestedReviewers={pr.requestedReviewers} reviews={reviews} />
        </SidebarSection>

        <SidebarSection title="Labels" icon={Tag}>
          <LabelsSection labels={pr.labels} />
        </SidebarSection>

        <SidebarSection title="Checks" icon={AlertCircle}>
          <ChecksSection checks={checks} />
        </SidebarSection>
      </div>
    </aside>
  );
}
