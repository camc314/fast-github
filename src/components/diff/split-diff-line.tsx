import { memo } from "react";
import type { SplitDiffRow, SplitDiffSide, SplitLineType } from "@/lib/types/github";

interface SplitDiffLineProps {
  row: SplitDiffRow;
  lineNumChars: number;
  side: "left" | "right";
}

const bgColors: Record<SplitLineType, string> = {
  addition: "bg-emerald-50",
  deletion: "bg-red-50",
  context: "bg-white",
  empty: "bg-neutral-50",
};

const textColors: Record<SplitLineType, string> = {
  addition: "text-emerald-900",
  deletion: "text-red-900",
  context: "text-neutral-700",
  empty: "text-neutral-400",
};

const lineNumColors: Record<SplitLineType, string> = {
  addition: "text-emerald-500 bg-emerald-50",
  deletion: "text-red-400 bg-red-50",
  context: "text-neutral-400 bg-neutral-50",
  empty: "text-neutral-300 bg-neutral-50",
};

const prefixes: Record<SplitLineType, string> = {
  addition: "+",
  deletion: "-",
  context: " ",
  empty: " ",
};

/**
 * Renders a single side of a split diff row
 */
function DiffSideContent({ data, lineNumWidth }: { data: SplitDiffSide; lineNumWidth: string }) {
  const { type, content, lineNumber } = data;

  return (
    <div className={bgColors[type]}>
      <div className="flex w-fit min-w-full h-6 font-mono text-xs">
        {/* Sticky line number */}
        <div
          style={{ width: lineNumWidth }}
          className={`sticky left-0 z-10 h-full shrink-0 flex items-center justify-center select-none border-r border-neutral-200 ${lineNumColors[type]}`}
        >
          {lineNumber ?? ""}
        </div>

        {/* Content */}
        <div
          className={`pl-2 pr-4 ${textColors[type]} whitespace-pre h-6 flex items-center hover:brightness-95`}
        >
          {type !== "empty" && (
            <>
              <span className="select-none text-neutral-400 mr-1">{prefixes[type]}</span>
              <span>{content}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Memoized split diff line component - renders only one side
 */
export const SplitDiffLine = memo(
  function SplitDiffLine({ row, lineNumChars, side }: SplitDiffLineProps) {
    // Width: chars + 1ch padding on each side
    const lineNumWidth = `${lineNumChars + 2}ch`;

    // Header row
    if (row.isHeader) {
      return (
        <div className="sticky top-0 left-0 z-20 flex items-center h-8 px-4 bg-blue-50 text-blue-700 text-xs font-mono border-y border-blue-100">
          <span className="select-none">{row.headerContent}</span>
        </div>
      );
    }

    const data = side === "left" ? row.left : row.right;

    return <DiffSideContent data={data} lineNumWidth={lineNumWidth} />;
  },
  // Custom comparison
  (prevProps, nextProps) => {
    const prev = prevProps.row;
    const next = nextProps.row;

    if (prevProps.lineNumChars !== nextProps.lineNumChars) return false;
    if (prevProps.side !== nextProps.side) return false;
    if (prev.isHeader !== next.isHeader) return false;
    if (prev.isHeader && next.isHeader) {
      return prev.headerContent === next.headerContent;
    }

    // Only compare the relevant side
    const prevSide = prevProps.side === "left" ? prev.left : prev.right;
    const nextSide = nextProps.side === "left" ? next.left : next.right;

    return (
      prevSide.type === nextSide.type &&
      prevSide.content === nextSide.content &&
      prevSide.lineNumber === nextSide.lineNumber
    );
  },
);
