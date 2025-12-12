import { memo } from "react";
import type { DiffLine as DiffLineType } from "@/lib/types/github";

interface DiffLineProps {
  line: DiffLineType;
  lineNumChars: number;
}

const bgColors = {
  addition: "bg-emerald-50",
  deletion: "bg-red-50",
  context: "bg-white",
  header: "bg-blue-50",
} as const;

const textColors = {
  addition: "text-emerald-900",
  deletion: "text-red-900",
  context: "text-neutral-700",
  header: "text-blue-700",
} as const;

const lineNumColors = {
  addition: "text-emerald-500 bg-emerald-50",
  deletion: "text-red-400 bg-red-50",
  context: "text-neutral-400 bg-neutral-50",
  header: "text-blue-500 bg-blue-50",
} as const;

const prefixes = {
  addition: "+",
  deletion: "-",
  context: " ",
  header: "",
} as const;

/**
 * Memoized diff line component.
 * Uses custom comparison to avoid re-renders when line data hasn't changed.
 */
export const DiffLine = memo(
  function DiffLine({ line, lineNumChars }: DiffLineProps) {
    const isHeader = line.type === "header";

    if (isHeader) {
      return (
        <div className="sticky top-0 left-0 z-20 flex items-center h-8 px-4 bg-blue-50 text-blue-700 text-xs font-mono border-y border-blue-100">
          <span className="select-none">{line.content}</span>
        </div>
      );
    }

    // Width: chars + 1ch padding on each side
    const lineNumWidth = `${lineNumChars + 2}ch`;
    const totalGutterWidth = `${(lineNumChars + 2) * 2}ch`;

    return (
      <div className={bgColors[line.type]}>
        <div className="flex w-fit min-w-full h-6 font-mono text-xs">
          {/* Sticky line number gutter */}
          <div style={{ width: totalGutterWidth }} className="sticky left-0 z-10 flex shrink-0">
            {/* Old line number */}
            <div
              style={{ width: lineNumWidth }}
              className={`h-full flex items-center justify-end pr-2 select-none border-r border-neutral-200 ${lineNumColors[line.type]}`}
            >
              {line.oldLineNumber ?? ""}
            </div>

            {/* New line number */}
            <div
              style={{ width: lineNumWidth }}
              className={`h-full flex items-center justify-end pr-2 select-none border-r border-neutral-200 ${lineNumColors[line.type]}`}
            >
              {line.newLineNumber ?? ""}
            </div>
          </div>

          {/* Content */}
          <div
            className={`pl-2 pr-4 ${textColors[line.type]} whitespace-pre h-6 flex items-center hover:brightness-95`}
          >
            <span className="select-none text-neutral-400 mr-1">{prefixes[line.type]}</span>
            <span>{line.content}</span>
          </div>
        </div>
      </div>
    );
  },
  // Custom comparison - only re-render if line data changes
  (prevProps, nextProps) => {
    const prev = prevProps.line;
    const next = nextProps.line;
    return (
      prevProps.lineNumChars === nextProps.lineNumChars &&
      prev.type === next.type &&
      prev.content === next.content &&
      prev.oldLineNumber === next.oldLineNumber &&
      prev.newLineNumber === next.newLineNumber
    );
  },
);
