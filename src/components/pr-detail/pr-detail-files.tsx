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
import type { PRFile, PRFileStatus } from "@/lib/types/github";
import { DiffViewer, type DiffViewMode } from "@/components/diff/diff-viewer";
import { usePreferences } from "@/lib/hooks/use-preferences";

interface PRDetailFilesProps {
  files: PRFile[];
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
      return <File size={16} className="text-neutral-400" />;
  }
}

function getStatusBadge(status: PRFileStatus) {
  const styles: Record<PRFileStatus, string> = {
    added: "bg-emerald-50 text-emerald-700",
    removed: "bg-red-50 text-red-700",
    modified: "bg-amber-50 text-amber-700",
    changed: "bg-amber-50 text-amber-700",
    renamed: "bg-blue-50 text-blue-700",
    copied: "bg-violet-50 text-violet-700",
    unchanged: "bg-neutral-50 text-neutral-500",
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
}

/**
 * Single file accordion item - memoized to prevent re-renders when other files change
 */
const FileAccordionItem = memo(
  function FileAccordionItem({ file, isExpanded, onToggle, viewMode }: FileAccordionItemProps) {
    return (
      <div className="border-b border-neutral-200 last:border-b-0">
        {/* File header - clickable */}
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-3 w-full px-4 py-3 hover:bg-neutral-50 transition-colors text-left"
        >
          {/* Expand/collapse chevron */}
          <span className="text-neutral-400">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </span>

          {/* File icon */}
          {getFileIcon(file.status)}

          {/* Filename */}
          <span className="flex-1 min-w-0 text-sm font-mono text-neutral-900 truncate">
            {file.filename}
          </span>

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
          <DiffViewer patch={file.patch} filename={file.filename} viewMode={viewMode} />
        )}
      </div>
    );
  },
  // Custom comparison - only re-render if relevant props change
  (prevProps, nextProps) => {
    return (
      prevProps.isExpanded === nextProps.isExpanded &&
      prevProps.viewMode === nextProps.viewMode &&
      prevProps.file.filename === nextProps.file.filename &&
      prevProps.file.patch === nextProps.file.patch &&
      prevProps.file.additions === nextProps.file.additions &&
      prevProps.file.deletions === nextProps.file.deletions &&
      prevProps.file.status === nextProps.file.status
    );
  },
);

interface ViewModeToggleProps {
  viewMode: DiffViewMode;
  onChange: (mode: DiffViewMode) => void;
}

function ViewModeToggle({ viewMode, onChange }: ViewModeToggleProps) {
  return (
    <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-md">
      <button
        type="button"
        onClick={() => onChange("unified")}
        className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded transition-colors ${
          viewMode === "unified"
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
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
            ? "bg-white text-neutral-900 shadow-sm"
            : "text-neutral-500 hover:text-neutral-700"
        }`}
        title="Split view"
      >
        <Columns size={14} />
        <span>Split</span>
      </button>
    </div>
  );
}

export function PRDetailFiles({ files }: PRDetailFilesProps) {
  // Track which files are collapsed (default: all expanded)
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  // Get view mode from persisted preferences
  const { preferences, setDiffViewMode } = usePreferences();
  const viewMode = preferences.diffViewMode;

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
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <File size={32} className="mx-auto text-neutral-300 mb-3" />
        <p className="text-neutral-500">No files changed</p>
      </div>
    );
  }

  // Calculate total stats
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header with stats and view toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <span className="text-sm font-medium text-neutral-700">
          {files.length} {files.length === 1 ? "file" : "files"} changed
        </span>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-emerald-600">+{totalAdditions.toLocaleString()}</span>
            <span className="font-medium text-red-500">-{totalDeletions.toLocaleString()}</span>
          </div>
          <ViewModeToggle viewMode={viewMode} onChange={setDiffViewMode} />
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
          />
        ))}
      </div>
    </div>
  );
}
