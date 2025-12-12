import { memo } from "react";
import type { SplitDiffRow, SplitLineType, PRReviewComment } from "@/lib/types/github";
import { formatRelativeTime } from "@/lib/utils/date";

interface SplitDiffViewProps {
  rows: SplitDiffRow[];
  lineNumWidth: string;
  commentMap: Map<string, PRReviewComment[]>;
}

const bgColors: Record<SplitLineType, string> = {
  addition: "bg-emerald-50",
  deletion: "bg-red-50",
  context: "bg-white",
  empty: "bg-neutral-100",
};

const textColors: Record<SplitLineType, string> = {
  addition: "text-emerald-900",
  deletion: "text-red-900",
  context: "text-neutral-700",
  empty: "text-neutral-400",
};

const lineNumBgColors: Record<SplitLineType, string> = {
  addition: "bg-emerald-100",
  deletion: "bg-red-100",
  context: "bg-neutral-50",
  empty: "bg-neutral-100",
};

const lineNumTextColors: Record<SplitLineType, string> = {
  addition: "text-emerald-600",
  deletion: "text-red-500",
  context: "text-neutral-400",
  empty: "text-neutral-300",
};

const prefixes: Record<SplitLineType, string> = {
  addition: "+",
  deletion: "-",
  context: " ",
  empty: " ",
};

function CommentThread({ comments }: { comments: PRReviewComment[] }) {
  return (
    <>
      {comments.map((comment) => (
        <div key={comment.id} className="p-3 border-b border-amber-100 last:border-b-0">
          <div className="flex gap-3">
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.login}
              className="w-6 h-6 rounded-full shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-xs text-neutral-900">{comment.user.login}</span>
                <span className="text-xs text-neutral-400">
                  {formatRelativeTime(comment.createdAt)}
                </span>
              </div>
              <div className="text-xs text-neutral-700 whitespace-pre-wrap break-words">
                {comment.body}
              </div>
            </div>
          </div>
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2 ml-9 pt-2 border-t border-amber-200 space-y-2">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="flex gap-3">
                  <img
                    src={reply.user.avatarUrl}
                    alt={reply.user.login}
                    className="w-5 h-5 rounded-full shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-xs text-neutral-900">
                        {reply.user.login}
                      </span>
                      <span className="text-xs text-neutral-400">
                        {formatRelativeTime(reply.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs text-neutral-700 whitespace-pre-wrap break-words">
                      {reply.body}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

interface RowData {
  row: SplitDiffRow;
  leftComments?: PRReviewComment[];
  rightComments?: PRReviewComment[];
}

/**
 * Split diff view with two side-by-side panels that scroll horizontally independently.
 * Comments appear full-width below both panels to maintain row alignment.
 */
export const SplitDiffView = memo(function SplitDiffView({
  rows,
  lineNumWidth,
  commentMap,
}: SplitDiffViewProps) {
  // Prepare row data with comments
  const rowData: RowData[] = rows.map((row) => {
    const leftKey = row.left.lineNumber !== null ? `LEFT:${row.left.lineNumber}` : null;
    const rightKey = row.right.lineNumber !== null ? `RIGHT:${row.right.lineNumber}` : null;
    return {
      row,
      leftComments: leftKey ? commentMap.get(leftKey) : undefined,
      rightComments: rightKey ? commentMap.get(rightKey) : undefined,
    };
  });

  // Group consecutive rows without comments, then rows with comments
  // This allows us to have column-level scrolling for code rows
  // while comments break the flow
  type Segment = { type: "code"; rows: RowData[] } | { type: "comment"; data: RowData };
  const segments: Segment[] = [];
  let currentCodeRows: RowData[] = [];

  for (const data of rowData) {
    const hasComments =
      (data.leftComments && data.leftComments.length > 0) ||
      (data.rightComments && data.rightComments.length > 0);

    if (hasComments) {
      // Flush current code rows
      if (currentCodeRows.length > 0) {
        segments.push({ type: "code", rows: [...currentCodeRows] });
        currentCodeRows = [];
      }
      // Add the row with comments (code + comment)
      segments.push({ type: "comment", data });
    } else {
      currentCodeRows.push(data);
    }
  }
  // Flush remaining code rows
  if (currentCodeRows.length > 0) {
    segments.push({ type: "code", rows: currentCodeRows });
  }

  return (
    <div className="border-t border-neutral-200">
      {segments.map((segment, segIndex) => {
        if (segment.type === "code") {
          // Render a group of code rows with column-level scrolling
          return (
            <div key={`code-${segIndex}`} className="flex">
              {/* Left column - scrolls independently */}
              <div className="w-1/2 border-r border-neutral-200 overflow-x-auto">
                {segment.rows.map(({ row }, rowIndex) => (
                  <SplitDiffSide key={rowIndex} row={row} side="left" lineNumWidth={lineNumWidth} />
                ))}
              </div>

              {/* Right column - scrolls independently */}
              <div className="w-1/2 overflow-x-auto">
                {segment.rows.map(({ row }, rowIndex) => (
                  <SplitDiffSide
                    key={rowIndex}
                    row={row}
                    side="right"
                    lineNumWidth={lineNumWidth}
                  />
                ))}
              </div>
            </div>
          );
        } else {
          // Render a single row with comments
          const { row, leftComments, rightComments } = segment.data;
          return (
            <div key={`comment-${segIndex}`}>
              {/* Code row */}
              <div className="flex">
                <div className="w-1/2 border-r border-neutral-200 overflow-x-auto">
                  <SplitDiffSide row={row} side="left" lineNumWidth={lineNumWidth} />
                </div>
                <div className="w-1/2 overflow-x-auto">
                  <SplitDiffSide row={row} side="right" lineNumWidth={lineNumWidth} />
                </div>
              </div>

              {/* Comments */}
              <div className="flex bg-amber-50 border-y border-amber-200">
                <div className="w-1/2 border-r border-amber-200">
                  {leftComments && leftComments.length > 0 && (
                    <CommentThread comments={leftComments} />
                  )}
                </div>
                <div className="w-1/2">
                  {rightComments && rightComments.length > 0 && (
                    <CommentThread comments={rightComments} />
                  )}
                </div>
              </div>
            </div>
          );
        }
      })}
    </div>
  );
});

interface SplitDiffSideProps {
  row: SplitDiffRow;
  side: "left" | "right";
  lineNumWidth: string;
}

/**
 * Single side of a split diff row (left or right).
 */
const SplitDiffSide = memo(
  function SplitDiffSide({ row, side, lineNumWidth }: SplitDiffSideProps) {
    // Header row
    if (row.isHeader) {
      return (
        <div className="sticky top-0 z-20 h-8 px-4 bg-blue-50 text-blue-700 text-xs font-mono border-y border-blue-100 flex items-center">
          <span className="select-none">{row.headerContent}</span>
        </div>
      );
    }

    const data = side === "left" ? row.left : row.right;
    const { type, content, lineNumber } = data;

    return (
      <div className={`flex font-mono text-xs min-w-fit ${bgColors[type]}`}>
        {/* Line number - sticky */}
        <div
          style={{ width: lineNumWidth, minWidth: lineNumWidth }}
          className={`sticky left-0 z-10 h-6 flex items-center justify-center select-none border-r border-neutral-200 shrink-0 ${lineNumBgColors[type]} ${lineNumTextColors[type]}`}
        >
          {lineNumber ?? ""}
        </div>

        {/* Content */}
        <div
          className={`h-6 flex items-center whitespace-pre pl-1 pr-4 ${textColors[type]} hover:brightness-[0.97]`}
        >
          {type !== "empty" && (
            <>
              <span className="select-none text-neutral-400 mr-1">{prefixes[type]}</span>
              <span>{content}</span>
            </>
          )}
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    if (prevProps.side !== nextProps.side) return false;
    if (prevProps.lineNumWidth !== nextProps.lineNumWidth) return false;

    const prev = prevProps.row;
    const next = nextProps.row;

    if (prev.isHeader !== next.isHeader) return false;
    if (prev.isHeader && next.isHeader) {
      return prev.headerContent === next.headerContent;
    }

    const prevData = prevProps.side === "left" ? prev.left : prev.right;
    const nextData = nextProps.side === "left" ? next.left : next.right;

    return (
      prevData.type === nextData.type &&
      prevData.content === nextData.content &&
      prevData.lineNumber === nextData.lineNumber
    );
  },
);
