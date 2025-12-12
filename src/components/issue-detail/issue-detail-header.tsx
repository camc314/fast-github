import { CircleDot, CheckCircle2 } from "lucide-react";
import type { Issue } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";

interface IssueDetailHeaderProps {
  issue: Issue;
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
      return `${diffMinutes} minutes ago`;
    }
    return `${diffHours} hours ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

function StateBadge({ state }: { state: string }) {
  switch (state) {
    case "open":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-emerald-500 rounded-full">
          <CircleDot size={14} />
          Open
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-violet-500 rounded-full">
          <CheckCircle2 size={14} />
          Closed
        </span>
      );
    default:
      return null;
  }
}

export function IssueDetailHeader({ issue }: IssueDetailHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-neutral-900 leading-tight">
          {issue.title}
          <span className="ml-2 text-neutral-400 font-normal">#{issue.number}</span>
        </h1>
        <StateBadge state={issue.state} />
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 mt-3 text-sm text-neutral-600">
        <Avatar src={issue.user.avatarUrl} alt={issue.user.login} size={20} />
        <span>
          <span className="font-medium text-neutral-900">{issue.user.login}</span>
          {" opened "}
          {formatRelativeTime(issue.createdAt)}
        </span>
      </div>
    </div>
  );
}
