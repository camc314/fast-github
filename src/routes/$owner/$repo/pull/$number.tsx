import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { useToastActions } from "@/components/ui/toast";

import { RepoHeader } from "@/components/repo/repo-header";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { PRDetailHeader } from "@/components/pr-detail/pr-detail-header";
import { PRDetailTabs, type PRTab } from "@/components/pr-detail/pr-detail-tabs";
import { PRDetailOverview } from "@/components/pr-detail/pr-detail-overview";
import { PRDetailFiles } from "@/components/pr-detail/pr-detail-files";
import { PRDetailCommits } from "@/components/pr-detail/pr-detail-commits";
import { PRDetailSidebar } from "@/components/pr-detail/pr-detail-sidebar";
import { PRMergeSection } from "@/components/pr-detail/pr-merge-section";
import { MobileSidebar } from "@/components/ui/mobile-sidebar";
import { CommentForm } from "@/components/ui/comment-form";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";
import { useAuth } from "@/lib/auth/auth-context";
import type { PRComment } from "@/lib/types/github";
import {
  fetchPullRequest,
  fetchPRFiles,
  fetchPRCommits,
  fetchPRComments,
  fetchPRReviews,
  fetchPRChecks,
  fetchPRReviewComments,
  fetchIssueTimeline,
  createPRReviewComment,
  createIssueComment,
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
  const toast = useToastActions();
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

  const { data: timelineEvents = [] } = useQuery({
    queryKey: ["pull-request-timeline", owner, repo, prNumber],
    queryFn: () => fetchIssueTimeline(owner, repo, prNumber),
  });

  const isLoading =
    prLoading ||
    filesLoading ||
    commitsLoading ||
    commentsLoading ||
    reviewsLoading ||
    checksLoading ||
    reviewCommentsLoading;

  const { user } = useAuth();

  // Mutation for adding review comments (inline/diff comments)
  const addReviewCommentMutation = useMutation({
    mutationFn: (params: { path: string; line: number; side: "LEFT" | "RIGHT"; body: string }) =>
      createPRReviewComment(owner, repo, prNumber, {
        body: params.body,
        path: params.path,
        line: params.line,
        side: params.side,
        commitId: pr?.headSha ?? "",
      }),
    onSuccess: () => {
      toast.success("Comment added", "Your review comment was posted successfully");
      // Invalidate and refetch review comments
      queryClient.invalidateQueries({
        queryKey: ["pull-request-review-comments", owner, repo, prNumber],
      });
    },
    onError: (error) => {
      toast.error(
        "Failed to add comment",
        error instanceof Error ? error.message : "Please try again",
      );
    },
  });

  // Mutation for adding general PR comments (on Overview tab)
  const createCommentMutation = useMutation({
    mutationFn: (body: string) => createIssueComment(owner, repo, prNumber, body),
    onMutate: async (body) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({
        queryKey: ["pull-request-comments", owner, repo, prNumber],
      });

      // Snapshot the previous value
      const previousComments = queryClient.getQueryData<PRComment[]>([
        "pull-request-comments",
        owner,
        repo,
        prNumber,
      ]);

      // Optimistically add the new comment
      const optimisticComment: PRComment = {
        id: Date.now(),
        body,
        user: {
          login: user?.login ?? "You",
          avatarUrl: user?.avatarUrl ?? "",
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PRComment[]>(
        ["pull-request-comments", owner, repo, prNumber],
        (old) => (old ? [...old, optimisticComment] : [optimisticComment]),
      );

      return { previousComments, optimisticComment };
    },
    onError: (err, _body, context) => {
      // Revert to previous comments on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["pull-request-comments", owner, repo, prNumber],
          context.previousComments,
        );
      }
      toast.error("Failed to add comment", err instanceof Error ? err.message : "Please try again");
    },
    onSuccess: () => {
      toast.success("Comment added", "Your comment was posted successfully");
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({
        queryKey: ["pull-request-comments", owner, repo, prNumber],
      });
      queryClient.invalidateQueries({
        queryKey: ["pull-request-timeline", owner, repo, prNumber],
      });
    },
  });

  const handleCommentSubmit = async (body: string) => {
    await createCommentMutation.mutateAsync(body);
  };

  // Handler for adding a comment to a file (inline/diff comments)
  const handleAddComment = useCallback(
    async (path: string, line: number, side: "LEFT" | "RIGHT", body: string) => {
      await addReviewCommentMutation.mutateAsync({ path, line, side, body });
    },
    [addReviewCommentMutation],
  );

  const checksData = checks ?? {
    total: 0,
    success: 0,
    failure: 0,
    pending: 0,
    skipped: 0,
    checks: [],
  };

  function renderTabContent(activeTab: PRTab) {
    if (!pr) return null;

    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-6">
            <PRDetailOverview pr={pr} comments={comments} timelineEvents={timelineEvents} />
            <PRMergeSection pr={pr} checks={checksData} reviews={reviews} />
            <CommentForm
              onSubmit={handleCommentSubmit}
              placeholder="Leave a comment..."
              disabled={createCommentMutation.isPending}
            />
          </div>
        );
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
        return (
          <div className="space-y-6">
            <PRDetailOverview pr={pr} comments={comments} timelineEvents={timelineEvents} />
            <PRMergeSection pr={pr} checks={checksData} reviews={reviews} />
            <CommentForm
              onSubmit={handleCommentSubmit}
              placeholder="Leave a comment..."
              disabled={createCommentMutation.isPending}
            />
          </div>
        );
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
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

            <div className="flex flex-col lg:flex-row gap-6">
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

              {/* Sidebar - only on overview tab, collapsible on mobile */}
              {tab === "overview" && (
                <MobileSidebar title="PR Details">
                  <PRDetailSidebar
                    owner={owner}
                    repo={repo}
                    pr={pr}
                    reviews={reviews}
                    checks={checksData}
                  />
                </MobileSidebar>
              )}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
