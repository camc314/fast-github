import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";

import { RepoHeader } from "@/components/repo/repo-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { PRDetailHeader } from "@/components/pr-detail/pr-detail-header";
import { PRDetailTabs, type PRTab } from "@/components/pr-detail/pr-detail-tabs";
import { PRDetailOverview } from "@/components/pr-detail/pr-detail-overview";
import { PRDetailFiles } from "@/components/pr-detail/pr-detail-files";
import { PRDetailCommits } from "@/components/pr-detail/pr-detail-commits";
import { PRDetailSidebar } from "@/components/pr-detail/pr-detail-sidebar";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";
import {
  fetchPullRequest,
  fetchPRFiles,
  fetchPRCommits,
  fetchPRComments,
  fetchPRReviews,
  fetchPRChecks,
  fetchPRReviewComments,
  createPRReviewComment,
} from "@/lib/api/github";

type SearchParams = {
  tab?: PRTab;
};

export const Route = createFileRoute("/$owner/$repo/pull/$number")({
  validateSearch: (search: Record<string, unknown>): SearchParams => {
    const tab = search.tab;
    if (tab === "overview" || tab === "files" || tab === "commits") {
      return { tab };
    }
    return { tab: "overview" };
  },
  component: PullRequestDetailPage,
});

function PullRequestDetailPage() {
  const { owner, repo, number } = Route.useParams();
  const { tab = "overview" } = Route.useSearch();
  const prNumber = parseInt(number, 10);
  const queryClient = useQueryClient();
  useDocumentTitle(`#${number} · ${owner}/${repo}`);

  // Fetch all data in parallel
  const {
    data: pr,
    isLoading: prLoading,
    error: prError,
  } = useQuery({
    queryKey: ["pull-request", owner, repo, prNumber],
    queryFn: () => fetchPullRequest(owner, repo, prNumber),
  });

  const { data: files = [], isLoading: filesLoading } = useQuery({
    queryKey: ["pull-request-files", owner, repo, prNumber],
    queryFn: () => fetchPRFiles(owner, repo, prNumber),
  });

  const { data: commits = [], isLoading: commitsLoading } = useQuery({
    queryKey: ["pull-request-commits", owner, repo, prNumber],
    queryFn: () => fetchPRCommits(owner, repo, prNumber),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["pull-request-comments", owner, repo, prNumber],
    queryFn: () => fetchPRComments(owner, repo, prNumber),
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery({
    queryKey: ["pull-request-reviews", owner, repo, prNumber],
    queryFn: () => fetchPRReviews(owner, repo, prNumber),
  });

  const { data: checks, isLoading: checksLoading } = useQuery({
    queryKey: ["pull-request-checks", owner, repo, pr?.headSha],
    queryFn: () => fetchPRChecks(owner, repo, pr!.headSha),
    enabled: !!pr?.headSha,
  });

  const { data: reviewComments = [], isLoading: reviewCommentsLoading } = useQuery({
    queryKey: ["pull-request-review-comments", owner, repo, prNumber],
    queryFn: () => fetchPRReviewComments(owner, repo, prNumber),
  });

  const isLoading =
    prLoading ||
    filesLoading ||
    commitsLoading ||
    commentsLoading ||
    reviewsLoading ||
    checksLoading ||
    reviewCommentsLoading;

  // Mutation for adding review comments
  const addCommentMutation = useMutation({
    mutationFn: (params: { path: string; line: number; side: "LEFT" | "RIGHT"; body: string }) =>
      createPRReviewComment(owner, repo, prNumber, {
        body: params.body,
        path: params.path,
        line: params.line,
        side: params.side,
        commitId: pr?.headSha ?? "",
      }),
    onSuccess: () => {
      // Invalidate and refetch review comments
      queryClient.invalidateQueries({
        queryKey: ["pull-request-review-comments", owner, repo, prNumber],
      });
    },
  });

  // Handler for adding a comment to a file
  const handleAddComment = useCallback(
    async (path: string, line: number, side: "LEFT" | "RIGHT", body: string) => {
      await addCommentMutation.mutateAsync({ path, line, side, body });
    },
    [addCommentMutation],
  );

  function renderTabContent(activeTab: PRTab) {
    if (!pr) return null;

    switch (activeTab) {
      case "overview":
        return <PRDetailOverview pr={pr} comments={comments} />;
      case "files":
        return (
          <PRDetailFiles
            files={files}
            reviewComments={reviewComments}
            onAddComment={handleAddComment}
          />
        );
      case "commits":
        return <PRDetailCommits commits={commits} />;
      default:
        return <PRDetailOverview pr={pr} comments={comments} />;
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/$owner/$repo/pulls"
          params={{ owner, repo }}
          className="inline-flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to pull requests
        </Link>

        {prError ? (
          <ErrorMessage
            error={prError}
            onRetry={() => {
              queryClient.invalidateQueries({ queryKey: ["pull-request", owner, repo, prNumber] });
            }}
          />
        ) : isLoading ? (
          <PageSpinner />
        ) : pr ? (
          <>
            <PRDetailHeader pr={pr} files={files} />

            <div className="flex gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <PRDetailTabs
                  owner={owner}
                  repo={repo}
                  number={number}
                  activeTab={tab}
                  filesCount={files.length}
                  commitsCount={commits.length}
                />

                {renderTabContent(tab)}
              </div>

              {/* Sidebar - only on overview tab */}
              {tab === "overview" && (
                <PRDetailSidebar
                  pr={pr}
                  reviews={reviews}
                  checks={checks ?? { total: 0, success: 0, failure: 0, pending: 0, checks: [] }}
                />
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
