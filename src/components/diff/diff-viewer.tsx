import { memo, useMemo } from "react";
import { parsePatch, flattenHunksToLines } from "@/lib/diff-parser";
import { DiffLine } from "./diff-line";

interface DiffViewerProps {
  patch: string | undefined;
  filename: string;
}

/**
 * Diff viewer component.
 * Parses patch and renders all lines - no internal scrolling.
 * Relies on parent page scroll for navigation.
 */
export const DiffViewer = memo(function DiffViewer({ patch, filename }: DiffViewerProps) {
  // Parse the patch once and memoize
  const parsedDiff = useMemo(() => parsePatch(patch), [patch]);

  // Flatten hunks to lines
  const lines = useMemo(() => flattenHunksToLines(parsedDiff.hunks), [parsedDiff.hunks]);

  // No diff available
  if (!patch || lines.length === 0) {
    return (
      <div className="p-6 text-center text-neutral-500 text-sm bg-neutral-50 border-t border-neutral-200">
        No diff available for {filename}
      </div>
    );
  }

  return (
    <div className="border-t border-neutral-200 overflow-x-auto">
      {lines.map((line, index) => (
        <DiffLine key={index} line={line} />
      ))}
    </div>
  );
});
