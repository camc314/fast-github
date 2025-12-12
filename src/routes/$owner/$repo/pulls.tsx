import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { RepoHeader } from "@/components/repo/repo-header";
import { PRListHeader } from "@/components/pr-list/pr-list-header";
import { PRListFilters } from "@/components/pr-list/pr-list-filters";
import { PRListItem } from "@/components/pr-list/pr-list-item";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { fetchPullRequests } from "@/lib/api/github";
import type { PRListParams } from "@/lib/types/github";

export const Route = createFileRoute("/$owner/$repo/pulls")({
  component: PullRequestsPage,
});

function PullRequestsPage() {
  const { owner, repo } = Route.useParams();
  const [state, setState] = useState<"open" | "closed" | "all">("open");
  const queryClient = useQueryClient();

  const params: PRListParams = {
    state,
    sort: "created",
    direction: "desc",
    page: 1,
    perPage: 200,
  };

  const { data, isLoading, isFetching, error } = useQuery({
    queryKey: ["pull-requests", owner, repo, params],
    queryFn: () => fetchPullRequests(owner, repo, params),
    placeholderData: keepPreviousData,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data?.pullRequests.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 56, []),
    overscan: 10,
  });

  const handleStateChange = (newState: "open" | "closed" | "all") => {
    setState(newState);
  };

  // Show initial loading spinner only on first load
  const showInitialLoading = isLoading && !data;

  return (
    <div className="min-h-screen bg-neutral-50">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <PRListHeader />

        <PRListFilters
          openCount={data?.openCount ?? 0}
          closedCount={data?.closedCount ?? 0}
          state={state}
          onStateChange={handleStateChange}
        />

        {error ? (
          <ErrorMessage
            error={error}
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ["pull-requests", owner, repo, params] });
            }}
          />
        ) : showInitialLoading ? (
          <PageSpinner />
        ) : data ? (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            <div
              ref={parentRef}
              className={`h-[calc(100vh-320px)] overflow-auto transition-opacity ${
                isFetching ? "opacity-60" : "opacity-100"
              }`}
            >
              <div
                style={{
                  height: `${virtualizer.getTotalSize()}px`,
                  width: "100%",
                  position: "relative",
                }}
              >
                {virtualizer.getVirtualItems().map((virtualItem) => {
                  const pr = data.pullRequests[virtualItem.index];
                  return (
                    <PRListItem
                      key={pr.id}
                      pr={pr}
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
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 text-sm text-neutral-500">
              Showing {data.pullRequests.length} of {data.totalCount} pull requests
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
