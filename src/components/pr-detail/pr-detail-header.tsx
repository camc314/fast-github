import { GitPullRequest, GitMerge } from "lucide-react";
import type { PullRequest, PRFile } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";

interface PRDetailHeaderProps {
  pr: PullRequest;
  files: PRFile[];
}

function StateIcon({ state }: { state: string }) {
  switch (state) {
    case "open":
      return <GitPullRequest size={16} />;
    case "merged":
      return <GitMerge size={16} />;
    case "closed":
      return <GitPullRequest size={16} />;
    default:
      return <GitPullRequest size={16} />;
  }
}

function StateBadge({ state, draft }: { state: string; draft: boolean }) {
  if (draft) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-fg-secondary bg-bg-tertiary rounded-full">
        <GitPullRequest size={14} />
        Draft
      </span>
    );
  }

  switch (state) {
    case "open":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-emerald-500 rounded-full">
          <StateIcon state={state} />
          Open
        </span>
      );
    case "merged":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-violet-500 rounded-full">
          <StateIcon state={state} />
          Merged
        </span>
      );
    case "closed":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-red-500 rounded-full">
          <StateIcon state={state} />
          Closed
        </span>
      );
    default:
      return null;
  }
}

function DiffStats({ files }: { files: PRFile[] }) {
  const additions = files.reduce((sum, f) => sum + f.additions, 0);
  const deletions = files.reduce((sum, f) => sum + f.deletions, 0);
  const total = additions + deletions;
  const addPct = total > 0 ? (additions / total) * 100 : 50;

  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="font-medium text-emerald-600">+{additions.toLocaleString()}</span>
      <span className="font-medium text-red-500">-{deletions.toLocaleString()}</span>
      <div className="flex h-1.5 w-16 rounded-full overflow-hidden bg-bg-tertiary">
        <div className="bg-emerald-500" style={{ width: `${addPct}%` }} />
        <div className="bg-red-400" style={{ width: `${100 - addPct}%` }} />
      </div>
      <span className="text-fg-muted">{files.length} files</span>
    </div>
  );
}

export function PRDetailHeader({ pr, files }: PRDetailHeaderProps) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-border shadow-sm p-6 mb-6">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-semibold text-fg leading-tight">
          {pr.title}
          <span className="ml-2 text-fg-muted font-normal">#{pr.number}</span>
        </h1>
        <StateBadge state={pr.state} draft={pr.draft} />
      </div>

      {/* Meta row */}
      <div className="flex items-center justify-between gap-4 mt-3">
        <div className="flex items-center gap-3 text-sm text-fg-secondary">
          <Avatar src={pr.user.avatarUrl} alt={pr.user.login} size={20} />
          <span>
            <span className="font-medium text-fg">{pr.user.login}</span>
            {" opened "}
            <RelativeTime date={pr.createdAt} />
          </span>
        </div>
        <DiffStats files={files} />
      </div>
    </div>
  );
}
