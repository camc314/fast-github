import { memo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GitCommit } from "lucide-react";
import type { PRCommit } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";

interface PRDetailCommitsProps {
  commits: PRCommit[];
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
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getFirstLine(message: string): string {
  const firstLine = message.split("\n")[0];
  return firstLine.length > 80 ? firstLine.slice(0, 80) + "..." : firstLine;
}

const CommitRow = memo(function CommitRow({
  commit,
  style,
}: {
  commit: PRCommit;
  style: React.CSSProperties;
}) {
  const shortSha = commit.sha.slice(0, 7);

  return (
    <div
      style={style}
      className="flex items-center gap-4 px-4 h-[64px] hover:bg-neutral-50 border-b border-neutral-100 transition-colors"
    >
      {/* Avatar or icon */}
      {commit.user ? (
        <Avatar src={commit.user.avatarUrl} alt={commit.user.login} size={32} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center">
          <GitCommit size={16} className="text-neutral-400" />
        </div>
      )}

      {/* Message and author */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-neutral-900 truncate">
          {getFirstLine(commit.message)}
        </p>
        <p className="text-xs text-neutral-500 mt-0.5">
          {commit.user?.login ?? commit.author.name} committed{" "}
          {formatRelativeTime(commit.author.date)}
        </p>
      </div>

      {/* SHA */}
      <div className="shrink-0">
        <code className="px-2 py-1 text-xs font-mono bg-neutral-100 text-neutral-600 rounded">
          {shortSha}
        </code>
      </div>
    </div>
  );
});

export function PRDetailCommits({ commits }: PRDetailCommitsProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: commits.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 64, []),
    overscan: 10,
  });

  if (commits.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <GitCommit size={32} className="mx-auto text-neutral-300 mb-3" />
        <p className="text-neutral-500">No commits</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <span className="text-sm font-medium text-neutral-700">
          {commits.length} {commits.length === 1 ? "commit" : "commits"}
        </span>
      </div>

      {/* Virtualized commit list */}
      <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const commit = commits[virtualItem.index];
            return (
              <CommitRow
                key={commit.sha}
                commit={commit}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
