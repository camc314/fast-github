import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { CircleDot, CheckCircle2, MessageSquare } from "lucide-react";
import type { Issue } from "@/lib/types/github";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";

interface IssueListItemProps {
  issue: Issue;
  owner: string;
  repo: string;
  style?: React.CSSProperties;
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
        <div className="w-5 h-5 flex items-center justify-center text-fg-muted">
          <CircleDot size={18} />
        </div>
      );
  }
}

export const IssueListItem = memo(function IssueListItem({
  issue,
  owner,
  repo,
  style,
}: IssueListItemProps) {
  return (
    <div style={style}>
      <Link
        to="/$owner/$repo/issue/$number"
        params={{ owner, repo, number: String(issue.number) }}
        className="group flex items-center gap-3 h-[56px] px-4 hover:bg-bg-hover border-b border-border transition-colors"
      >
        {/* State icon */}
        <IssueStateIcon state={issue.state} />

        {/* Title & meta */}
        <div className="flex-1 min-w-0 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-fg group-hover:text-blue-600 truncate transition-colors">
                {issue.title}
              </span>
              {issue.labels.slice(0, 2).map((label) => (
                <Label key={label.id} label={label} />
              ))}
            </div>
            <p className="text-xs text-fg-muted mt-0.5">
              #{issue.number}
              <span className="mx-1">·</span>
              <RelativeTime date={issue.createdAt} /> by {issue.user.login}
            </p>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4 shrink-0">
          {issue.comments > 0 && (
            <span className="inline-flex items-center gap-1 text-xs text-fg-muted">
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
