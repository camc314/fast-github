import { memo } from "react";
import { Link, useParams } from "@tanstack/react-router";
import { CircleDot, CheckCircle2, MessageSquare } from "lucide-react";
import type { Issue } from "@/lib/types/github";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";

interface IssueListItemProps {
  issue: Issue;
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

function IssueStateIcon({ state }: { state: string }) {
  switch (state) {
    case "open":
      return (
        <div className="w-5 h-5 flex items-center justify-center text-emerald-500">
          <CircleDot size={18} />
        </div>
      );
    case "closed":
      return (
        <div className="w-5 h-5 flex items-center justify-center text-violet-500">
          <CheckCircle2 size={18} />
        </div>
      );
    default:
      return (
        <div className="w-5 h-5 flex items-center justify-center text-neutral-400">
          <CircleDot size={18} />
        </div>
      );
  }
}

export const IssueListItem = memo(function IssueListItem({ issue, style }: IssueListItemProps) {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;

  return (
    <div style={style}>
      <Link
        to="/$owner/$repo/issue/$number"
        params={{ owner, repo, number: String(issue.number) }}
        className="group flex items-center gap-3 h-[56px] px-4 hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
      >
        {/* State icon */}
        <IssueStateIcon state={issue.state} />

        {/* Title & meta */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-neutral-900 group-hover:text-blue-600 truncate transition-colors">
                {issue.title}
              </span>
              {issue.labels.slice(0, 2).map((label) => (
                <Label key={label.id} label={label} />
              ))}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              #{issue.number}
              <span className="mx-1">·</span>
              {formatRelativeTime(issue.createdAt)} by {issue.user.login}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          {issue.comments > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-neutral-400">
              <MessageSquare size={12} />
              {issue.comments}
            </span>
          )}

          <Avatar src={issue.user.avatarUrl} alt={issue.user.login} size={24} />
        </div>
      </Link>
    </div>
  );
});
