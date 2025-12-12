import { memo, useCallback, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { File, FilePlus, FileMinus, FileEdit, FileSymlink, Copy } from "lucide-react";
import type { PRFile, PRFileStatus } from "@/lib/types/github";

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

const FileRow = memo(function FileRow({
  file,
  style,
}: {
  file: PRFile;
  style: React.CSSProperties;
}) {
  return (
    <div
      style={style}
      className="flex items-center gap-3 px-4 h-[52px] hover:bg-neutral-50 border-b border-neutral-100 transition-colors cursor-pointer"
    >
      {getFileIcon(file.status)}

      <div className="flex-1 min-w-0">
        <span className="text-sm font-mono text-neutral-900 truncate block">{file.filename}</span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {file.additions > 0 && (
          <span className="text-xs font-medium text-emerald-600">+{file.additions}</span>
        )}
        {file.deletions > 0 && (
          <span className="text-xs font-medium text-red-500">-{file.deletions}</span>
        )}
        {getStatusBadge(file.status)}
      </div>
    </div>
  );
});

export function PRDetailFiles({ files }: PRDetailFilesProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: files.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 52, []),
    overscan: 10,
  });

  if (files.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
        <File size={32} className="mx-auto text-neutral-300 mb-3" />
        <p className="text-neutral-500">No files changed</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
        <span className="text-sm font-medium text-neutral-700">
          {files.length} {files.length === 1 ? "file" : "files"} changed
        </span>
      </div>

      {/* Virtualized file list */}
      <div ref={parentRef} className="h-[calc(100vh-400px)] overflow-auto">
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const file = files[virtualItem.index];
            return (
              <FileRow
                key={file.sha || file.filename}
                file={file}
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

      {/* Diff placeholder */}
      <div className="px-4 py-6 border-t border-neutral-200 bg-neutral-50 text-center">
        <p className="text-sm text-neutral-500">
          Click a file to view diff <span className="text-neutral-400">(coming soon)</span>
        </p>
      </div>
    </div>
  );
}
