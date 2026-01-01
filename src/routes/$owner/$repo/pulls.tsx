import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useCallback, useEffect, useMemo } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import * as v from "valibot";
import { valibotSearchValidator } from "@tanstack/router-valibot-adapter";

import { RepoHeader } from "@/components/repo/repo-header";
import { PRListHeader } from "@/components/pr-list/pr-list-header";
import { ListFilters } from "@/components/list-filters/list-filters";
import { PRListItem } from "@/components/pr-list/pr-list-item";
import { PageSpinner, Spinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { useInfinitePRList } from "@/lib/hooks/use-infinite-list";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";
import { VIRTUAL_LIST_OVERSCAN, INFINITE_SCROLL_THRESHOLD } from "@/lib/constants";

const listSearchSchema = v.object({
  state: v.fallback(v.picklist(["open", "closed", "all"]), "open"),
  sort: v.fallback(v.picklist(["created", "updated", "comments"]), "created"),
  direction: v.fallback(v.picklist(["asc", "desc"]), "desc"),
  q: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  author: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  label: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  assignee: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
});

export const Route = createFileRoute("/$owner/$repo/pulls")({
  validateSearch: valibotSearchValidator(listSearchSchema),
  component: PullRequestsPage,
});

function PullRequestsPage() {
  const { owner, repo } = Route.useParams();
  const {
    state = "open",
    sort = "created",
    direction = "desc",
    q,
    author,
    label,
    assignee,
  } = Route.useSearch();
  const queryClient = useQueryClient();
  useDocumentTitle(`Pull Requests · ${owner}/${repo}`);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isFetching, error } =
    useInfinitePRList({
      owner,
      repo,
      state,
      sort,
      direction,
      query: q,
      author,
      label,
      assignee,
    });

  // Flatten all pages into single array
  const pullRequests = data?.pages.flatMap((page) => page.pullRequests) ?? [];
  const counts = data?.pages[0] ?? { openCount: 0, closedCount: 0 };

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: hasNextPage ? pullRequests.length + 1 : pullRequests.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 56, []),
    overscan: VIRTUAL_LIST_OVERSCAN,
  });

  // Get virtual items and compute last item index
  const virtualItems = virtualizer.getVirtualItems();
  const lastItemIndex = useMemo(
    () => virtualItems[virtualItems.length - 1]?.index ?? 0,
    [virtualItems],
  );

  // Trigger fetch when scrolling near end
  useEffect(() => {
    if (
      lastItemIndex >= pullRequests.length - INFINITE_SCROLL_THRESHOLD &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [lastItemIndex, hasNextPage, isFetchingNextPage, pullRequests.length, fetchNextPage]);

  // Show initial loading spinner only on first load
  const showInitialLoading = isLoading && !data;

  // Build description of active filters for empty state
  const hasFilters = !!(q || author || label || assignee);
  const filterDescription = hasFilters
    ? [
        q && `matching "${q}"`,
        author && `by ${author}`,
        label && `with label "${label}"`,
        assignee && `assigned to ${assignee}`,
      ]
        .filter(Boolean)
        .join(" ")
    : "";

  return (
    <div className="min-h-screen bg-bg">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <PRListHeader owner={owner} repo={repo} />

        <ListFilters
          type="pr"
          owner={owner}
          repo={repo}
          state={state}
          sort={sort}
          direction={direction}
          query={q}
          author={author}
          label={label}
          assignee={assignee}
          openCount={counts.openCount}
          closedCount={counts.closedCount}
        />

        {error ? (
          <ErrorMessage
            error={error}
            onRetry={() => {
              queryClient.invalidateQueries({
                queryKey: ["pull-requests-infinite", owner, repo],
              });
            }}
          />
        ) : showInitialLoading ? (
          <PageSpinner />
        ) : data ? (
          <div className="bg-bg-secondary rounded-xl border border-border shadow-sm overflow-hidden">
            <div
              ref={parentRef}
              className={`h-[calc(100vh-380px)] overflow-auto transition-opacity duration-150 ${
                isFetching && !isFetchingNextPage ? "opacity-60" : "opacity-100"
              }`}
            >
              {pullRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-fg-muted">
                  <p className="text-sm">
                    {hasFilters
                      ? `No pull requests found ${filterDescription}`
                      : "No pull requests found"}
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
                    const isLoaderRow = virtualItem.index >= pullRequests.length;

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

                    const pr = pullRequests[virtualItem.index];
                    return (
                      <PRListItem
                        key={pr.id}
                        pr={pr}
                        owner={owner}
                        repo={repo}
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

            <div className="px-4 py-3 border-t border-border bg-bg text-sm text-fg-muted">
              {hasFilters ? (
                <span>
                  Found {pullRequests.length} pull requests {filterDescription}
                </span>
              ) : (
                <span>
                  Showing {pullRequests.length} of{" "}
                  {state === "open"
                    ? counts.openCount
                    : state === "closed"
                      ? counts.closedCount
                      : counts.openCount + counts.closedCount}{" "}
                  pull requests
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
