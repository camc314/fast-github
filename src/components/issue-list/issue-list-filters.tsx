import { CircleDot, CheckCircle2 } from "lucide-react";

interface IssueListFiltersProps {
  openCount: number;
  closedCount: number;
  state: "open" | "closed" | "all";
  onStateChange: (state: "open" | "closed" | "all") => void;
}

export function IssueListFilters({
  openCount,
  closedCount,
  state,
  onStateChange,
}: IssueListFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="inline-flex items-center bg-neutral-100 rounded-lg p-1">
        <button
          onClick={() => onStateChange("open")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            state === "open"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <CircleDot size={14} className="text-emerald-500" />
          <span>{openCount.toLocaleString()}</span>
          <span className="hidden sm:inline">Open</span>
        </button>

        <button
          onClick={() => onStateChange("closed")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            state === "closed"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <CheckCircle2 size={14} className="text-violet-500" />
          <span>{closedCount.toLocaleString()}</span>
          <span className="hidden sm:inline">Closed</span>
        </button>
      </div>
    </div>
  );
}
