import { memo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { GitCommit } from "lucide-react";
import type { PRCommit } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { RelativeTime } from "@/components/ui/relative-time";

interface PRDetailCommitsProps {
  commits: PRCommit[];
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
      className="flex items-center gap-4 px-4 h-[64px] hover:bg-bg-hover border-b border-border transition-colors"
    >
      {/* Avatar or icon */}
      {commit.user ? (
        <Avatar src={commit.user.avatarUrl} alt={commit.user.login} size={32} />
      ) : (
        <div className="w-8 h-8 rounded-full bg-bg-tertiary flex items-center justify-center">
          <GitCommit size={16} className="text-fg-muted" />
        </div>
      )}

      {/* Message and author */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg truncate">{getFirstLine(commit.message)}</p>
        <p className="text-xs text-fg-muted mt-0.5">
          {commit.user?.login ?? commit.author.name} committed{" "}
          <RelativeTime date={commit.author.date} />
        </p>
      </div>

      {/* SHA */}
      <div className="shrink-0">
        <code className="px-2 py-1 text-xs font-mono bg-bg-tertiary text-fg-secondary rounded">
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
      <div className="bg-bg-secondary rounded-xl border border-border p-12 text-center">
        <GitCommit size={32} className="mx-auto text-fg-muted mb-3" />
        <p className="text-fg-muted">No commits</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-bg">
        <span className="text-sm font-medium text-fg-secondary">
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
