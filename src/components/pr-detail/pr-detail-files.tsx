import { memo, useState, useCallback } from "react";
import {
  File,
  FilePlus,
  FileMinus,
  FileEdit,
  FileSymlink,
  Copy,
  ChevronRight,
  ChevronDown,
  Columns,
  Rows,
} from "lucide-react";
import type { PRFile, PRFileStatus, PRReviewComment } from "@/lib/types/github";
import { DiffViewer, type DiffViewMode } from "@/components/diff/diff-viewer";
import { usePreferences } from "@/lib/hooks/use-preferences";
import { useIsSmallScreen } from "@/lib/hooks/use-media-query";

interface PRDetailFilesProps {
  files: PRFile[];
  reviewComments: PRReviewComment[];
  onAddComment?: (
    path: string,
    line: number,
    side: "LEFT" | "RIGHT",
    body: string,
  ) => Promise<void>;
}

function getFileIcon(status: PRFileStatus) {
  switch (status) {
    case "added":
      return <FilePlus size={16} className="text-emerald-500" />;
    case "removed":
      return <FileMinus size={16} className="text-red-500" />;
    case "modified":
    case "changed":
      return <FileEdit size={16} className="text-amber-500" />;
    case "renamed":
      return <FileSymlink size={16} className="text-blue-500" />;
    case "copied":
      return <Copy size={16} className="text-violet-500" />;
    default:
      return <File size={16} className="text-fg-muted" />;
  }
}

function getStatusBadge(status: PRFileStatus) {
  const styles: Record<PRFileStatus, string> = {
    added: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    removed: "bg-red-500/10 text-red-600 dark:text-red-400",
    modified: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    changed: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    renamed: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    copied: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
    unchanged: "bg-bg text-fg-muted",
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[status]}`}>
      {status}
    </span>
  );
}

interface FileAccordionItemProps {
  file: PRFile;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: DiffViewMode;
  comments?: PRReviewComment[];
  onAddComment?: (line: number, side: "LEFT" | "RIGHT", body: string) => Promise<void>;
}

/**
 * Single file accordion item - memoized to prevent re-renders when other files change
 */
const FileAccordionItem = memo(
  function FileAccordionItem({
    file,
    isExpanded,
    onToggle,
    viewMode,
    comments,
    onAddComment,
  }: FileAccordionItemProps) {
    return (
      <div className="border-b border-border last:border-b-0">
        {/* File header - clickable */}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-bg-hover transition-colors text-left"
        >
          {/* Expand/collapse chevron */}
          <span className="text-fg-muted">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>

          {/* File icon */}
          {getFileIcon(file.status)}

          {/* Filename */}
          <span className="flex-1 min-w-0 text-sm font-mono text-fg truncate">{file.filename}</span>

          {/* Stats */}
          <div className="flex items-center gap-3 shrink-0">
            {file.additions > 0 && (
              <span className="text-xs font-medium text-emerald-600">+{file.additions}</span>
            )}
            {file.deletions > 0 && (
              <span className="text-xs font-medium text-red-500">-{file.deletions}</span>
            )}
            {getStatusBadge(file.status)}
          </div>
        </button>

        {/* Diff viewer - only rendered when expanded */}
        {isExpanded && (
          <DiffViewer
            patch={file.patch}
            filename={file.filename}
            viewMode={viewMode}
            status={file.status}
            comments={comments}
            onAddComment={onAddComment}
          />
        )}
      </div>
    );
  },
  // Custom comparison - only re-render if relevant props change
  (prevProps, nextProps) => {
    // Compare comments by length and IDs instead of reference
    const prevComments = prevProps.comments ?? [];
    const nextComments = nextProps.comments ?? [];
    const commentsEqual =
      prevComments.length === nextComments.length &&
      prevComments.every((c, i) => c.id === nextComments[i]?.id);

    return (
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.file.filename === nextProps.file.filename &&
      prevProps.file.patch === nextProps.file.patch &&
      prevProps.file.additions === nextProps.file.additions &&
      prevProps.file.deletions === nextProps.file.deletions &&
      prevProps.file.status === nextProps.file.status &&
      commentsEqual
    );
  },
);

interface ViewModeToggleProps {
  viewMode: DiffViewMode;
  onChange: (mode: DiffViewMode) => void;
}

function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-bg-tertiary rounded-md">
      <button
        type="button"
        onClick={() => onChange("unified")}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
          viewMode === "unified"
            ? "bg-bg-secondary text-fg shadow-sm"
            : "text-fg-muted hover:text-fg-secondary"
        }`}
        title="Unified view"
      >
        <Rows size={14} />
        <span>Unified</span>
      </button>
      <button
        type="button"
        onClick={() => onChange("split")}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
          viewMode === "split"
            ? "bg-bg-secondary text-fg shadow-sm"
            : "text-fg-muted hover:text-fg-secondary"
        }`}
        title="Split view"
      >
        <Columns size={14} />
        <span>Split</span>
      </button>
    </div>
  );
}

export function PRDetailFiles({
  files,
  reviewComments,
  onAddComment,
}: PRDetailFilesProps) {
  // Track which files are collapsed (default: all expanded)
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  // Get view mode from persisted preferences
  const { preferences, setDiffViewMode } = usePreferences();
  const isSmallScreen = useIsSmallScreen();
  // Force unified view on small screens (split view doesn't fit)
  const viewMode = isSmallScreen ? "unified" : preferences.diffViewMode;

  // Toggle handler - memoized to avoid creating new functions on each render
  const createToggleHandler = useCallback(
    (filename: string) => () => {
      setCollapsedFiles((current) => {
        const next = new Set(current);
        if (next.has(filename)) {
          next.delete(filename);
        } else {
          next.add(filename);
        }
        return next;
      });
    },
    [],
  );

  if (files.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border p-12 text-center">
        <File size={32} className="mx-auto text-fg-muted mb-3" />
        <p className="text-fg-muted">No files changed</p>
      </div>
    );
  }

  // Calculate total stats
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
      {/* Header with stats and view toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg">
        <span className="text-sm font-medium text-fg-secondary">
          {files.length} {files.length === 1 ? "file" : "files"} changed
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-emerald-600">+{totalAdditions.toLocaleString()}</span>
            <span className="font-medium text-red-500">-{totalDeletions.toLocaleString()}</span>
          </div>
          {/* Hide view mode toggle on small screens (forced to unified) */}
          {!isSmallScreen && <ViewModeToggle viewMode={viewMode} onChange={setDiffViewMode} />}
        </div>
      </div>

      {/* File list with accordion */}
      <div>
        {files.map((file) => (
          <FileAccordionItem
            key={file.sha || file.filename}
            file={file}
            isExpanded={!collapsedFiles.has(file.filename)}
            onToggle={createToggleHandler(file.filename)}
            viewMode={viewMode}
            comments={reviewComments.filter((c) => c.path === file.filename)}
            onAddComment={
              onAddComment
                ? (line, side, body) => onAddComment(file.filename, line, side, body)
                : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
