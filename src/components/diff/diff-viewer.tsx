import { memo, useMemo, useState, useCallback } from "react";
import { FileDiff, type FileDiffMetadata, type DiffLineAnnotation } from "@pierre/diffs/react";
import { parsePatchFiles } from "@pierre/diffs";
import { Plus } from "lucide-react";
import type { PRReviewComment, PRFileStatus } from "@/lib/types/github";
import { DiffCommentThread } from "./diff-comment-thread";
import { InlineCommentForm } from "./inline-comment-form";

export type DiffViewMode = "unified" | "split";

// Annotation metadata that includes comments and pending comment state
interface CommentAnnotationMetadata {
  comments: PRReviewComment[];
  isPendingComment?: boolean;
}

interface DiffViewerProps {
  patch: string | undefined;
  filename: string;
  viewMode: DiffViewMode;
  status?: PRFileStatus;
  comments?: PRReviewComment[];
  onAddComment?: (line: number, side: "LEFT" | "RIGHT", body: string) => Promise<void>;
}

/**
 * Wrap a GitHub API patch (which only contains hunks) into a full diff format
 * that @pierre/diffs can parse.
 */
function wrapPatchWithHeaders(patch: string, filename: string, status?: PRFileStatus): string {
  if (status === "added") {
    return `diff --git a/${filename} b/${filename}
new file mode 100644
--- /dev/null
+++ b/${filename}
${patch}`;
  }

  if (status === "removed") {
    return `diff --git a/${filename} b/${filename}
deleted file mode 100644
--- a/${filename}
+++ /dev/null
${patch}`;
  }

  return `diff --git a/${filename} b/${filename}
--- a/${filename}
+++ b/${filename}
${patch}`;
}

/**
 * Parse a GitHub patch into FileDiffMetadata.
 */
function parseGitHubPatch(
  patch: string,
  filename: string,
  status?: PRFileStatus,
): FileDiffMetadata | null {
  try {
    const fullPatch = wrapPatchWithHeaders(patch, filename, status);
    const parsedPatches = parsePatchFiles(fullPatch);

    if (parsedPatches.length === 0 || parsedPatches[0].files.length === 0) {
      return null;
    }

    const fileDiff = parsedPatches[0].files[0];
    fileDiff.name = filename;
    return fileDiff;
  } catch (error) {
    console.error("Failed to parse patch:", error);
    return null;
  }
}

/**
 * Convert GitHub comment side to @pierre/diffs annotation side.
 */
function convertSide(side: "LEFT" | "RIGHT"): "deletions" | "additions" {
  return side === "LEFT" ? "deletions" : "additions";
}

/**
 * Convert @pierre/diffs annotation side to GitHub comment side.
 */
function convertToGitHubSide(side: "deletions" | "additions"): "LEFT" | "RIGHT" {
  return side === "deletions" ? "LEFT" : "RIGHT";
}

/**
 * Build annotations from comments, grouping by line and side.
 */
function buildCommentAnnotations(
  comments: PRReviewComment[],
  pendingCommentLocation: { line: number; side: "deletions" | "additions" } | null,
): DiffLineAnnotation<CommentAnnotationMetadata>[] {
  const annotationMap = new Map<string, DiffLineAnnotation<CommentAnnotationMetadata>>();

  // Group comments by line and side
  for (const comment of comments) {
    const lineNumber = comment.side === "RIGHT" ? comment.line : comment.originalLine;
    if (lineNumber === null) continue;

    const side = convertSide(comment.side);
    const key = `${side}:${lineNumber}`;

    const existing = annotationMap.get(key);
    if (existing) {
      existing.metadata.comments.push(comment);
    } else {
      annotationMap.set(key, {
        side,
        lineNumber,
        metadata: { comments: [comment] },
      });
    }
  }

  // Add pending comment location if present
  if (pendingCommentLocation) {
    const key = `${pendingCommentLocation.side}:${pendingCommentLocation.line}`;
    const existing = annotationMap.get(key);
    if (existing) {
      existing.metadata.isPendingComment = true;
    } else {
      annotationMap.set(key, {
        side: pendingCommentLocation.side,
        lineNumber: pendingCommentLocation.line,
        metadata: { comments: [], isPendingComment: true },
      });
    }
  }

  return Array.from(annotationMap.values());
}

/**
 * Diff viewer component using @pierre/diffs library.
 * Supports unified and split views with syntax highlighting and inline comments.
 */
export const DiffViewer = memo(function DiffViewer({
  patch,
  filename,
  viewMode,
  status,
  comments = [],
  onAddComment,
}: DiffViewerProps) {
  // State for pending comment (when user clicks to add a comment)
  const [pendingCommentLocation, setPendingCommentLocation] = useState<{
    line: number;
    side: "deletions" | "additions";
  } | null>(null);

  // Parse the patch into FileDiffMetadata
  const fileDiff = useMemo(() => {
    if (!patch) return null;
    return parseGitHubPatch(patch, filename, status);
  }, [patch, filename, status]);

  // Build annotations from comments and pending comment location
  const lineAnnotations = useMemo(
    () => buildCommentAnnotations(comments, pendingCommentLocation),
    [comments, pendingCommentLocation],
  );

  // Handle clicking on a line to add a comment
  const handleLineClick = useCallback(
    (lineNumber: number, side: "deletions" | "additions") => {
      if (!onAddComment) return;
      setPendingCommentLocation({ line: lineNumber, side });
    },
    [onAddComment],
  );

  // Handle canceling the pending comment
  const handleCancelComment = useCallback(() => {
    setPendingCommentLocation(null);
  }, []);

  // Handle submitting a comment
  const handleSubmitComment = useCallback(
    async (body: string) => {
      if (!pendingCommentLocation || !onAddComment) return;

      const githubSide = convertToGitHubSide(pendingCommentLocation.side);
      await onAddComment(pendingCommentLocation.line, githubSide, body);
      setPendingCommentLocation(null);
    },
    [pendingCommentLocation, onAddComment],
  );

  // Configure diff options
  const options = useMemo(() => {
    return {
      diffStyle: viewMode,
      diffIndicators: "bars" as const,
      disableBackground: false,
      disableFileHeader: true,
      overflow: "scroll" as const,
      themeType: "system" as const,
      theme: {
        light: "github-light",
        dark: "github-dark",
      },
      // Enable hover utility for add comment button
      enableHoverUtility: !!onAddComment,
    };
  }, [viewMode, onAddComment]);

  // Render annotation (comment thread or pending comment form)
  const renderAnnotation = useCallback(
    (annotation: DiffLineAnnotation<CommentAnnotationMetadata>) => {
      const { comments: lineComments, isPendingComment } = annotation.metadata;

      return (
        <div className="bg-bg border-y border-border">
          {/* Existing comments */}
          {lineComments.length > 0 && <DiffCommentThread comments={lineComments} />}

          {/* Pending comment form */}
          {isPendingComment && (
            <InlineCommentForm onSubmit={handleSubmitComment} onCancel={handleCancelComment} />
          )}
        </div>
      );
    },
    [handleSubmitComment, handleCancelComment],
  );

  // Render hover utility (add comment button)
  const renderHoverUtility = useCallback(
    (getHoveredLine: () => { lineNumber: number; side: "deletions" | "additions" } | undefined) => {
      return (
        <button
          type="button"
          onClick={() => {
            const hoveredLine = getHoveredLine();
            if (hoveredLine) {
              handleLineClick(hoveredLine.lineNumber, hoveredLine.side);
            }
          }}
          className="flex items-center justify-center w-5 h-5 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-sm transition-colors"
          title="Add comment"
        >
          <Plus size={12} strokeWidth={3} />
        </button>
      );
    },
    [handleLineClick],
  );

  // No diff available
  if (!patch || !fileDiff) {
    return (
      <div className="p-6 text-center text-fg-muted text-sm bg-bg border-t border-border">
        No diff available for {filename}
      </div>
    );
  }

  return (
    <div className="border-t border-border overflow-hidden">
      <FileDiff
        fileDiff={fileDiff}
        options={options}
        lineAnnotations={lineAnnotations}
        renderAnnotation={renderAnnotation}
        renderHoverUtility={onAddComment ? renderHoverUtility : undefined}
      />
    </div>
  );
});
