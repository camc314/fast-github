import { memo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { GitPullRequest, GitMerge, MessageSquare, Check, X, Clock } from "lucide-react";
import type { PullRequest, CheckStatus } from "@/lib/types/github";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";

interface PRListItemProps {
  pr: PullRequest;
  style?: React.CSSProperties;
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return `${Math.floor(diffDays / 365)}y ago`;
}

function PRStateIcon({ state, draft }: { state: string; draft: boolean }) {
  if (draft) {
    return (
      <div className="w-5 h-5 flex items-center justify-center text-neutral-400">
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
        <div className="w-5 h-5 flex items-center justify-center text-neutral-400">
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

export const PRListItem = memo(function PRListItem({ pr, style }: PRListItemProps) {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;

  return (
    <div style={style}>
      <Link
        to="/$owner/$repo/pull/$number"
        params={{ owner, repo, number: String(pr.number) }}
        className="group flex items-center gap-3 h-[56px] px-4 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
      >
        {/* State icon */}
        <PRStateIcon state={pr.state} draft={pr.draft} />

        {/* Title & meta */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 truncate transition-colors">
                {pr.title}
              </span>
              {pr.labels.slice(0, 2).map((label) => (
                <Label key={label.id} label={label} />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              #{pr.number}
              {pr.draft && <span className="ml-1 text-neutral-400">(draft)</span>}
              <span className="mx-1">·</span>
              {formatRelativeTime(pr.createdAt)} by {pr.user.login}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          <CheckStatusIcon status={pr.checkStatus} />

          {pr.comments > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
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
