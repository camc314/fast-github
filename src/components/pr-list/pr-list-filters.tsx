import { GitPullRequest, Check } from "lucide-react";

interface PRListFiltersProps {
  openCount: number;
  closedCount: number;
  state: "open" | "closed" | "all";
  onStateChange: (state: "open" | "closed" | "all") => void;
}

export function PRListFilters({
  openCount,
  closedCount,
  state,
  onStateChange,
}: PRListFiltersProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      {/* State toggle - pill style */}
      <div className="inline-flex items-center bg-bg-tertiary rounded-lg p-1">
        <button
          onClick={() => onStateChange("open")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            state === "open"
              ? "bg-bg-secondary text-fg shadow-sm"
              : "text-fg-secondary hover:text-fg"
          }`}
        >
          <GitPullRequest size={14} className="text-emerald-500" />
          <span>{openCount.toLocaleString()}</span>
          <span className="hidden sm:inline">Open</span>
        </button>

        <button
          onClick={() => onStateChange("closed")}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
            state === "closed"
              ? "bg-bg-secondary text-fg shadow-sm"
              : "text-fg-secondary hover:text-fg"
          }`}
        >
          <Check size={14} className="text-violet-500" />
          <span>{closedCount.toLocaleString()}</span>
          <span className="hidden sm:inline">Closed</span>
        </button>
      </div>
    </div>
  );
}
