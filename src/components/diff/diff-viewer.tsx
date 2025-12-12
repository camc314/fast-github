import { memo, useMemo } from "react";
import { parsePatch, flattenHunksToLines, hunksToSplitRows } from "@/lib/diff-parser";
import { DiffLine } from "./diff-line";
import { SplitDiffLine } from "./split-diff-line";
import type { DiffHunk } from "@/lib/types/github";

export type DiffViewMode = "unified" | "split";

interface DiffViewerProps {
  patch: string | undefined;
  filename: string;
  viewMode: DiffViewMode;
}

/**
 * Compute the maximum line number from hunks to determine column width.
 * Returns the number of characters needed to display the largest line number.
 */
function computeLineNumWidth(hunks: DiffHunk[]): number {
  let maxLineNum = 0;

  for (const hunk of hunks) {
    // Check the end of each hunk (start + count gives us the max)
    const oldEnd = hunk.oldStart + hunk.oldCount;
    const newEnd = hunk.newStart + hunk.newCount;
    maxLineNum = Math.max(maxLineNum, oldEnd, newEnd);
  }

  // Convert to character count, minimum 2 chars
  const charCount = Math.max(2, String(maxLineNum).length);

  // Each character is roughly 0.6em in monospace, plus padding
  // We use ch units which are exactly 1 character width in monospace
  return charCount;
}

/**
 * Diff viewer component supporting unified and split views.
 * Parses patch and renders all lines - no internal scrolling.
 * Relies on parent page scroll for navigation.
 */
export const DiffViewer = memo(function DiffViewer({ patch, filename, viewMode }: DiffViewerProps) {
  // Parse the patch once and memoize
  const parsedDiff = useMemo(() => parsePatch(patch), [patch]);

  // Compute line number width based on max line number
  const lineNumChars = useMemo(() => computeLineNumWidth(parsedDiff.hunks), [parsedDiff.hunks]);

  // Generate view-specific data
  const unifiedLines = useMemo(
    () => (viewMode === "unified" ? flattenHunksToLines(parsedDiff.hunks) : []),
    [parsedDiff.hunks, viewMode],
  );

  const splitRows = useMemo(
    () => (viewMode === "split" ? hunksToSplitRows(parsedDiff.hunks) : []),
    [parsedDiff.hunks, viewMode],
  );

  // No diff available
  if (!patch || parsedDiff.hunks.length === 0) {
    return (
      <div className="p-6 text-center text-neutral-500 text-sm bg-neutral-50 border-t border-neutral-200">
        No diff available for {filename}
      </div>
    );
  }

  if (viewMode === "split") {
    return (
      <div className="border-t border-neutral-200 flex">
        {/* Left side (old) - scrolls independently */}
        <div className="w-1/2 border-r border-neutral-200 overflow-x-auto">
          {splitRows.map((row, index) => (
            <SplitDiffLine key={index} row={row} lineNumChars={lineNumChars} side="left" />
          ))}
        </div>
        {/* Right side (new) - scrolls independently */}
        <div className="w-1/2 overflow-x-auto">
          {splitRows.map((row, index) => (
            <SplitDiffLine key={index} row={row} lineNumChars={lineNumChars} side="right" />
          ))}
        </div>
      </div>
    );
  }

  // Unified view (default)
  return (
    <div className="border-t border-neutral-200 overflow-x-auto">
      {unifiedLines.map((line, index) => (
        <DiffLine key={index} line={line} lineNumChars={lineNumChars} />
      ))}
    </div>
  );
});
