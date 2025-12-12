import { createFileRoute } from "@tanstack/react-router";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { useRef, useState, useCallback } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";

import { RepoHeader } from "@/components/repo/repo-header";
import { IssueListHeader } from "@/components/issue-list/issue-list-header";
import { IssueListFilters } from "@/components/issue-list/issue-list-filters";
import { IssueListItem } from "@/components/issue-list/issue-list-item";
import { PageSpinner } from "@/components/ui/spinner";
import { fetchIssues } from "@/lib/api/github";
import type { IssueListParams } from "@/lib/types/github";

export const Route = createFileRoute("/$owner/$repo/issues")({
  component: IssuesPage,
});

function IssuesPage() {
  const { owner, repo } = Route.useParams();
  const [state, setState] = useState<"open" | "closed" | "all">("open");

  const params: IssueListParams = {
    state,
    sort: "created",
    direction: "desc",
    page: 1,
    perPage: 100,
  };

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["issues", owner, repo, params],
    queryFn: () => fetchIssues(owner, repo, params),
    placeholderData: keepPreviousData,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: data?.issues.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => 56, []),
    overscan: 10,
  });

  const handleStateChange = (newState: "open" | "closed" | "all") => {
    setState(newState);
  };

  const showInitialLoading = isLoading && !data;

  return (
    <div className="min-h-screen bg-neutral-50">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <IssueListHeader />

        <IssueListFilters
          openCount={data?.openCount ?? 0}
          closedCount={data?.closedCount ?? 0}
          state={state}
          onStateChange={handleStateChange}
        />

        {showInitialLoading ? (
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
                  const issue = data.issues[virtualItem.index];
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
            </div>

            <div className="px-4 py-3 border-t border-neutral-100 bg-neutral-50 text-sm text-neutral-500">
              Showing {data.issues.length} of {data.totalCount} issues
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
