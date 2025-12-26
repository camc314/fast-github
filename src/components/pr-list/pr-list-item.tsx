import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { GitPullRequest, GitMerge, MessageSquare, Check, X, Clock } from "lucide-react";
import type { PullRequest, CheckStatus } from "@/lib/types/github";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/date";

interface PRListItemProps {
  pr: PullRequest;
  owner: string;
  repo: string;
  style?: React.CSSProperties;
}

function PRStateIcon({ state, draft }: { state: string; draft: boolean }) {
  if (draft) {
    return (
      <div className="w-5 h-5 flex items-center justify-center text-fg-muted">
        <GitPullRequest size={18} />
      </div>
    );
  }

  switch (state) {
    case "open":
      return (
        <div className="w-5 h-5 flex items-center justify-center text-emerald-500">
          <GitPullRequest size={18} />
        </div>
      );
    case "merged":
      return (
        <div className="w-5 h-5 flex items-center justify-center text-violet-500">
          <GitMerge size={18} />
        </div>
      );
    case "closed":
      return (
        <div className="w-5 h-5 flex items-center justify-center text-red-500">
          <GitPullRequest size={18} />
        </div>
      );
    default:
      return (
        <div className="w-5 h-5 flex items-center justify-center text-fg-muted">
          <GitPullRequest size={18} />
        </div>
      );
  }
}

function CheckStatusIcon({ status }: { status: CheckStatus }) {
  switch (status) {
    case "success":
      return <Check size={14} className="text-emerald-500" />;
    case "failure":
      return <X size={14} className="text-red-500" />;
    case "pending":
      return <Clock size={14} className="text-amber-500" />;
    default:
      return null;
  }
}

export const PRListItem = memo(function PRListItem({ pr, owner, repo, style }: PRListItemProps) {
  return (
    <div style={style}>
      <Link
        to="/$owner/$repo/pull/$number"
        params={{ owner, repo, number: String(pr.number) }}
        className="group flex items-center gap-3 h-[56px] px-4 hover:bg-bg-hover border-b border-border transition-colors"
      >
        {/* State icon */}
        <PRStateIcon state={pr.state} draft={pr.draft} />

        {/* Title & meta */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-fg group-hover:text-blue-600 truncate transition-colors">
                {pr.title}
              </span>
              {pr.labels.slice(0, 2).map((label) => (
                <Label key={label.id} label={label} />
              ))}
            </div>
            <p className="text-xs text-fg-muted mt-0.5">
              #{pr.number}
              {pr.draft && <span className="ml-1 text-fg-muted">(draft)</span>}
              <span className="mx-1">·</span>
              {formatRelativeTime(pr.createdAt)} by {pr.user.login}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          <CheckStatusIcon status={pr.checkStatus} />

          {pr.comments > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
              <MessageSquare size={12} />
              {pr.comments}
            </span>
          )}

          <Avatar src={pr.user.avatarUrl} alt={pr.user.login} size={24} />
        </div>
      </Link>
    </div>
  );
});
