import { Link, useNavigate } from "@tanstack/react-router";
import { GitPullRequest, Check, CircleDot, CheckCircle2 } from "lucide-react";
import { SearchInput } from "./search-input";
import { SortDropdown } from "./sort-dropdown";
import { FilterDropdown } from "./filter-dropdown";
import { useRepoLabels, useRepoContributors } from "@/lib/hooks/use-infinite-list";
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
  author?: string;
  label?: string;
  assignee?: string;
  // Counts
  openCount: number;
  closedCount: number;
}

type SearchParams = {
  state?: ListState;
  sort?: SortField;
  direction?: SortDirection;
  q?: string;
  author?: string;
  label?: string;
  assignee?: string;
};

export function ListFilters({
  type,
  owner,
  repo,
  state,
  sort,
  direction,
  query = "",
  author,
  label,
  assignee,
  openCount,
  closedCount,
}: ListFiltersProps) {
  const navigate = useNavigate();
  const routePath = type === "pr" ? "/$owner/$repo/pulls" : "/$owner/$repo/issues";

  // Fetch filter options
  const { data: labels = [], isLoading: labelsLoading } = useRepoLabels(owner, repo);
  const { data: contributors = [], isLoading: contributorsLoading } = useRepoContributors(
    owner,
    repo,
  );

  // Transform to filter options
  const labelOptions = labels.map((l) => ({
    value: l.name,
    label: l.name,
    color: l.color,
  }));

  const userOptions = contributors.map((u) => ({
    value: u.login,
    label: u.login,
    icon: u.avatarUrl,
  }));

  // Build search params, omitting defaults to keep URLs clean
  const buildSearch = (overrides: Partial<SearchParams>): SearchParams => {
    // Use "in" operator to check if key was explicitly provided (even if undefined)
    const newState = "state" in overrides ? overrides.state : state;
    const newSort = "sort" in overrides ? overrides.sort : sort;
    const newDirection = "direction" in overrides ? overrides.direction : direction;
    const newQuery = "q" in overrides ? overrides.q : query;
    const newAuthor = "author" in overrides ? overrides.author : author;
    const newLabel = "label" in overrides ? overrides.label : label;
    const newAssignee = "assignee" in overrides ? overrides.assignee : assignee;

    const search: SearchParams = {};

    // Only include non-default values
    if (newState && newState !== "open") search.state = newState;
    if (newSort && newSort !== "created") search.sort = newSort;
    if (newDirection && newDirection !== "desc") search.direction = newDirection;
    if (newQuery) search.q = newQuery;
    if (newAuthor) search.author = newAuthor;
    if (newLabel) search.label = newLabel;
    if (newAssignee) search.assignee = newAssignee;

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

  const handleAuthorChange = (newAuthor: string | undefined) => {
    navigate({
      to: routePath,
      params: { owner, repo },
      search: buildSearch({ author: newAuthor }),
    });
  };

  const handleLabelChange = (newLabel: string | undefined) => {
    navigate({
      to: routePath,
      params: { owner, repo },
      search: buildSearch({ label: newLabel }),
    });
  };

  const handleAssigneeChange = (newAssignee: string | undefined) => {
    navigate({
      to: routePath,
      params: { owner, repo },
      search: buildSearch({ assignee: newAssignee }),
    });
  };

  const OpenIcon = type === "pr" ? GitPullRequest : CircleDot;
  const ClosedIcon = type === "pr" ? Check : CheckCircle2;

  // Count active filters
  const activeFilterCount = [author, label, assignee].filter(Boolean).length;

  return (
    <div className="space-y-3 mb-4">
      {/* Top row: Search + State toggle + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search input */}
        <SearchInput
          value={query}
          onChange={handleSearchChange}
          placeholder={type === "pr" ? "Search pull requests..." : "Search issues..."}
        />

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* State toggle - pill style */}
          <div className="inline-flex items-center bg-bg-tertiary rounded-lg p-1">
            <Link
              to={routePath}
              params={{ owner, repo }}
              search={buildSearch({ state: "open" })}
              className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                state === "open"
                  ? "bg-bg-secondary text-fg shadow-sm"
                  : "text-fg-secondary hover:text-fg"
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
                  ? "bg-bg-secondary text-fg shadow-sm"
                  : "text-fg-secondary hover:text-fg"
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

      {/* Bottom row: Filter dropdowns */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-fg-muted">Filters:</span>

        <FilterDropdown
          label="Author"
          value={author}
          options={userOptions}
          onChange={handleAuthorChange}
          isLoading={contributorsLoading}
          type="user"
          placeholder="Search authors..."
        />

        <FilterDropdown
          label="Label"
          value={label}
          options={labelOptions}
          onChange={handleLabelChange}
          isLoading={labelsLoading}
          type="label"
          placeholder="Search labels..."
        />

        <FilterDropdown
          label="Assignee"
          value={assignee}
          options={userOptions}
          onChange={handleAssigneeChange}
          isLoading={contributorsLoading}
          type="user"
          placeholder="Search assignees..."
        />

        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={() => {
              navigate({
                to: routePath,
                params: { owner, repo },
                search: buildSearch({ author: undefined, label: undefined, assignee: undefined }),
              });
            }}
            className="text-sm text-fg-muted hover:text-fg-secondary underline underline-offset-2"
          >
            Clear all filters
          </button>
        )}
      </div>
    </div>
  );
}
