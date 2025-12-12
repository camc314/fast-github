import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { RepoHeader } from "@/components/repo/repo-header";
import { IssueListHeader } from "@/components/issue-list/issue-list-header";
import { ListFilters } from "@/components/list-filters/list-filters";
import { IssueListItem } from "@/components/issue-list/issue-list-item";
import { PageSpinner, Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { useInfiniteIssueList } from "@/lib/hooks/use-infinite-list";
import type { SortField, SortDirection, ListState } from "@/lib/types/github";

// URL search params type
type IssueListSearch = {
  state?: ListState;
  sort?: SortField;
  direction?: SortDirection;
  q?: string;
};

// Validators
function validateState(value: unknown): ListState {
  if (value === "open" || value === "closed" || value === "all") return value;
  return "open";
}

function validateSort(value: unknown): SortField {
  if (value === "created" || value === "updated" || value === "comments") return value;
  return "created";
}

function validateDirection(value: unknown): SortDirection {
  if (value === "asc" || value === "desc") return value;
  return "desc";
}

export const Route = createFileRoute("/$owner/$repo/issues")({
  validateSearch: (search: Record<string, unknown>): IssueListSearch => ({
    state: validateState(search.state),
    sort: validateSort(search.sort),
    direction: validateDirection(search.direction),
    q: typeof search.q === "string" && search.q.trim() ? search.q.trim() : undefined,
  }),
  component: IssuesPage,
});

function IssuesPage() {
  const { owner, repo } = Route.useParams();
  const { state = "open", sort = "created", direction = "desc", q } = Route.useSearch();
  const queryClient = useQueryClient();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isFetching,
    error,
  } = useInfiniteIssueList({
    owner,
    repo,
    state,
    sort,
    direction,
    query: q,
  });

  // Flatten all pages into single array
  const issues = data?.pages.flatMap((page) => page.issues) ?? [];
  const counts = data?.pages[0] ?? { openCount: 0, closedCount: 0 };

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? issues.length + 1 : issues.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 56, []),
    overscan: 10,
  });

  // Trigger fetch when scrolling near end
  useEffect(() => {
    const virtualItems = virtualizer.getVirtualItems();
    const lastItem = virtualItems[virtualItems.length - 1];

    if (!lastItem) return;

    // Fetch more when we're within 5 items of the end
    if (lastItem.index >= issues.length - 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, issues.length, fetchNextPage]);

  // Show initial loading spinner only on first load
  const showInitialLoading = isLoading && !data;

  return (
    <div className="min-h-screen bg-neutral-50">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <IssueListHeader />

        <ListFilters
          type="issue"
          owner={owner}
          repo={repo}
          state={state}
          sort={sort}
          direction={direction}
          query={q}
          openCount={counts.openCount}
          closedCount={counts.closedCount}
        />

        {error ? (
          <ErrorMessage
            error={error}
            onRetry={() => {
              queryClient.invalidateQueries({
                queryKey: ["issues-infinite", owner, repo],
              });
            }}
          />
        ) : showInitialLoading ? (
          <PageSpinner />
        ) : data ? (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div
              ref={parentRef}
              className={`h-[calc(100vh-320px)] overflow-auto transition-opacity duration-150 ${
                isFetching && !isFetchingNextPage ? "opacity-60" : "opacity-100"
              }`}
            >
              {issues.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-500">
                  <p className="text-sm">
                    {q ? `No issues found matching "${q}"` : "No issues found"}
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    height: `${virtualizer.getTotalSize()}px`,
                    width: "100%",
                    position: "relative",
                  }}
                >
                  {virtualizer.getVirtualItems().map((virtualItem) => {
                    const isLoaderRow = virtualItem.index >= issues.length;

                    if (isLoaderRow) {
                      return (
                        <div
                          key="loader"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: `${virtualItem.size}px`,
                            transform: `translateY(${virtualItem.start}px)`,
                          }}
                          className="flex items-center justify-center"
                        >
                          <Spinner size={20} />
                        </div>
                      );
                    }

                    const issue = issues[virtualItem.index];
                    return (
                      <IssueListItem
                        key={issue.id}
                        issue={issue}
                        style={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: "100%",
                          height: `${virtualItem.size}px`,
                          transform: `translateY(${virtualItem.start}px)`,
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 text-sm text-neutral-500">
              {q ? (
                <span>Found {issues.length} issues matching "{q}"</span>
              ) : (
                <span>
                  Showing {issues.length} of{" "}
                  {state === "open"
                    ? counts.openCount
                    : state === "closed"
                      ? counts.closedCount
                      : counts.openCount + counts.closedCount}{" "}
                  issues
                </span>
              )}
              {isFetchingNextPage && <span className="ml-2">Loading more...</span>}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
