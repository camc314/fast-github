import { memo } from "react";
import type { DiffLine as DiffLineType } from "@/lib/types/github";

interface DiffLineProps {
  line: DiffLineType;
}

/**
 * Memoized diff line component.
 * Uses custom comparison to avoid re-renders when line data hasn't changed.
 */
export const DiffLine = memo(
  function DiffLine({ line }: DiffLineProps) {
    const isHeader = line.type === "header";

    if (isHeader) {
      return (
        <div className="sticky top-0 z-10 flex items-center h-8 px-4 bg-blue-50 text-blue-700 text-xs font-mono border-y border-blue-100">
          <span className="select-none">{line.content}</span>
        </div>
      );
    }

    const bgColor = {
      addition: "bg-emerald-50",
      deletion: "bg-red-50",
      context: "bg-white",
      header: "bg-blue-50",
    }[line.type];

    const textColor = {
      addition: "text-emerald-900",
      deletion: "text-red-900",
      context: "text-neutral-700",
      header: "text-blue-700",
    }[line.type];

    const lineNumColor = {
      addition: "text-emerald-500 bg-emerald-50",
      deletion: "text-red-400 bg-red-50",
      context: "text-neutral-400 bg-neutral-50",
      header: "text-blue-500 bg-blue-50",
    }[line.type];

    const prefix = {
      addition: "+",
      deletion: "-",
      context: " ",
      header: "",
    }[line.type];

    return (
      <div className={`flex h-6 font-mono text-xs ${bgColor} hover:brightness-95`}>
        {/* Old line number */}
        <div
          className={`w-12 shrink-0 text-right pr-2 select-none border-r border-neutral-200 ${lineNumColor}`}
        >
          {line.oldLineNumber ?? ""}
        </div>

        {/* New line number */}
        <div
          className={`w-12 shrink-0 text-right pr-2 select-none border-r border-neutral-200 ${lineNumColor}`}
        >
          {line.newLineNumber ?? ""}
        </div>

        {/* Content */}
        <div className={`flex-1 pl-2 pr-4 ${textColor} whitespace-pre`}>
          <span className="select-none text-neutral-400 mr-1">{prefix}</span>
          <span>{line.content}</span>
        </div>
      </div>
    );
  },
  // Custom comparison - only re-render if line data changes
  (prevProps, nextProps) => {
    const prev = prevProps.line;
    const next = nextProps.line;
    return (
      prev.type === next.type &&
      prev.content === next.content &&
      prev.oldLineNumber === next.oldLineNumber &&
      prev.newLineNumber === next.newLineNumber
    );
  },
);
