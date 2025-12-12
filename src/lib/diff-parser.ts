import type { DiffHunk, DiffLine, ParsedDiff, SplitDiffRow } from "./types/github";

const HUNK_HEADER_REGEX = /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/;

/**
 * Parse a unified diff patch string into structured data.
 * This parser is designed to be fast and memory-efficient.
 */
export function parsePatch(patch: string | undefined): ParsedDiff {
  if (!patch) {
    return { hunks: [], totalAdditions: 0, totalDeletions: 0 };
  }

  const hunks: DiffHunk[] = [];
  let totalAdditions = 0;
  let totalDeletions = 0;

  const lines = patch.split("\n");
  let currentHunk: DiffHunk | null = null;
  let oldLineNum = 0;
  let newLineNum = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for hunk header
    const hunkMatch = HUNK_HEADER_REGEX.exec(line);
    if (hunkMatch) {
      // Save previous hunk if exists
      if (currentHunk) {
        hunks.push(currentHunk);
      }

      const oldStart = parseInt(hunkMatch[1], 10);
      const oldCount = hunkMatch[2] ? parseInt(hunkMatch[2], 10) : 1;
      const newStart = parseInt(hunkMatch[3], 10);
      const newCount = hunkMatch[4] ? parseInt(hunkMatch[4], 10) : 1;

      oldLineNum = oldStart;
      newLineNum = newStart;

      currentHunk = {
        header: line,
        oldStart,
        oldCount,
        newStart,
        newCount,
        lines: [],
      };
      continue;
    }

    // Skip if we haven't found a hunk yet
    if (!currentHunk) {
      continue;
    }

    // Parse the line
    const firstChar = line[0];
    const content = line.slice(1);

    switch (firstChar) {
      case "+":
        totalAdditions++;
        currentHunk.lines.push({
          type: "addition",
          content,
          oldLineNumber: null,
          newLineNumber: newLineNum++,
        });
        break;
      case "-":
        totalDeletions++;
        currentHunk.lines.push({
          type: "deletion",
          content,
          oldLineNumber: oldLineNum++,
          newLineNumber: null,
        });
        break;
      case " ":
        currentHunk.lines.push({
          type: "context",
          content,
          oldLineNumber: oldLineNum++,
          newLineNumber: newLineNum++,
        });
        break;
      case "\\":
        // "\ No newline at end of file" - skip
        break;
      default:
        // Handle lines that don't start with expected characters
        // (could be empty lines or malformed patches)
        if (line === "") {
          currentHunk.lines.push({
            type: "context",
            content: "",
            oldLineNumber: oldLineNum++,
            newLineNumber: newLineNum++,
          });
        }
        break;
    }
  }

  // Don't forget the last hunk
  if (currentHunk) {
    hunks.push(currentHunk);
  }

  return { hunks, totalAdditions, totalDeletions };
}

/**
 * Flatten hunks into a single array of lines for virtualization.
 * Includes hunk headers as special lines.
 */
export function flattenHunksToLines(hunks: DiffHunk[]): DiffLine[] {
  const result: DiffLine[] = [];

  for (const hunk of hunks) {
    // Add hunk header as a special line
    result.push({
      type: "header",
      content: hunk.header,
      oldLineNumber: null,
      newLineNumber: null,
    });

    // Add all lines from the hunk
    for (const line of hunk.lines) {
      result.push(line);
    }
  }

  return result;
}

/**
 * Convert hunks to split (side-by-side) view rows.
 * Pairs deletions with additions where possible for easier comparison.
 */
export function hunksToSplitRows(hunks: DiffHunk[]): SplitDiffRow[] {
  const result: SplitDiffRow[] = [];

  for (const hunk of hunks) {
    // Add hunk header row
    result.push({
      isHeader: true,
      headerContent: hunk.header,
      left: { type: "empty", content: "", lineNumber: null },
      right: { type: "empty", content: "", lineNumber: null },
    });

    // Process lines - pair deletions with additions
    let i = 0;
    while (i < hunk.lines.length) {
      const line = hunk.lines[i];

      if (line.type === "context") {
        // Context lines appear on both sides
        result.push({
          left: { type: "context", content: line.content, lineNumber: line.oldLineNumber },
          right: { type: "context", content: line.content, lineNumber: line.newLineNumber },
        });
        i++;
      } else if (line.type === "deletion") {
        // Collect consecutive deletions
        const deletions: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "deletion") {
          deletions.push(hunk.lines[i]);
          i++;
        }

        // Collect consecutive additions
        const additions: DiffLine[] = [];
        while (i < hunk.lines.length && hunk.lines[i].type === "addition") {
          additions.push(hunk.lines[i]);
          i++;
        }

        // Pair them up
        const maxLen = Math.max(deletions.length, additions.length);
        for (let j = 0; j < maxLen; j++) {
          const del = deletions[j];
          const add = additions[j];

          result.push({
            left: del
              ? { type: "deletion", content: del.content, lineNumber: del.oldLineNumber }
              : { type: "empty", content: "", lineNumber: null },
            right: add
              ? { type: "addition", content: add.content, lineNumber: add.newLineNumber }
              : { type: "empty", content: "", lineNumber: null },
          });
        }
      } else if (line.type === "addition") {
        // Pure addition (no preceding deletion)
        result.push({
          left: { type: "empty", content: "", lineNumber: null },
          right: { type: "addition", content: line.content, lineNumber: line.newLineNumber },
        });
        i++;
      } else {
        i++;
      }
    }
  }

  return result;
}
