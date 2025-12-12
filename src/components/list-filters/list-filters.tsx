import { Link, useNavigate } from "@tanstack/react-router";
import { GitPullRequest, Check, CircleDot, CheckCircle2 } from "lucide-react";
import { SearchInput } from "./search-input";
import { SortDropdown } from "./sort-dropdown";
import type { SortField, SortDirection, ListState } from "@/lib/types/github";

interface ListFiltersProps {
  type: "pr" | "issue";
  owner: string;
  repo: string;
  // Current values from URL
  state: ListState;
  sort: SortField;
  direction: SortDirection;
  query?: string;
  // Counts
  openCount: number;
  closedCount: number;
}

type SearchParams = {
  state?: ListState;
  sort?: SortField;
  direction?: SortDirection;
  q?: string;
};

export function ListFilters({
  type,
  owner,
  repo,
  state,
  sort,
  direction,
  query = "",
  openCount,
  closedCount,
}: ListFiltersProps) {
  const navigate = useNavigate();
  const routePath = type === "pr" ? "/$owner/$repo/pulls" : "/$owner/$repo/issues";

  // Build search params, omitting defaults to keep URLs clean
  const buildSearch = (overrides: Partial<SearchParams>): SearchParams => {
    const newState = overrides.state ?? state;
    const newSort = overrides.sort ?? sort;
    const newDirection = overrides.direction ?? direction;
    const newQuery = overrides.q !== undefined ? overrides.q : query;

    const search: SearchParams = {};

    // Only include non-default values
    if (newState !== "open") search.state = newState;
    if (newSort !== "created") search.sort = newSort;
    if (newDirection !== "desc") search.direction = newDirection;
    if (newQuery) search.q = newQuery;

    return search;
  };

  const handleSearchChange = (newQuery: string) => {
    navigate({
      to: routePath,
      params: { owner, repo },
      search: buildSearch({ q: newQuery }),
    });
  };

  const handleSortChange = (newSort: SortField, newDirection: SortDirection) => {
    navigate({
      to: routePath,
      params: { owner, repo },
      search: buildSearch({ sort: newSort, direction: newDirection }),
    });
  };

  const OpenIcon = type === "pr" ? GitPullRequest : CircleDot;
  const ClosedIcon = type === "pr" ? Check : CheckCircle2;

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
      {/* Search input */}
      <SearchInput
        value={query}
        onChange={handleSearchChange}
        placeholder={type === "pr" ? "Search pull requests..." : "Search issues..."}
      />

      <div className="flex items-center gap-3 w-full sm:w-auto">
        {/* State toggle - pill style */}
        <div className="inline-flex items-center bg-neutral-100 rounded-lg p-1">
          <Link
            to={routePath}
            params={{ owner, repo }}
            search={buildSearch({ state: "open" })}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              state === "open"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <OpenIcon size={14} className="text-emerald-500" />
            <span>{openCount.toLocaleString()}</span>
            <span className="hidden sm:inline">Open</span>
          </Link>

          <Link
            to={routePath}
            params={{ owner, repo }}
            search={buildSearch({ state: "closed" })}
            className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
              state === "closed"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <ClosedIcon size={14} className="text-violet-500" />
            <span>{closedCount.toLocaleString()}</span>
            <span className="hidden sm:inline">Closed</span>
          </Link>
        </div>

        {/* Sort dropdown */}
        <SortDropdown sort={sort} direction={direction} onChange={handleSortChange} />
      </div>
    </div>
  );
}
