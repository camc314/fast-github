import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { RepoHeader } from "@/components/repo/repo-header";
import { PageSpinner } from "@/components/ui/spinner";
import { IssueDetailHeader } from "@/components/issue-detail/issue-detail-header";
import { IssueDetailOverview } from "@/components/issue-detail/issue-detail-overview";
import { IssueDetailSidebar } from "@/components/issue-detail/issue-detail-sidebar";
import { CommentForm } from "@/components/ui/comment-form";
import { fetchIssue, fetchIssueComments, createIssueComment } from "@/lib/api/github";
import type { PRComment } from "@/lib/types/github";

export const Route = createFileRoute("/$owner/$repo/issue/$number")({
  component: IssueDetailPage,
});

function IssueDetailPage() {
  const { owner, repo, number } = Route.useParams();
  const issueNumber = parseInt(number, 10);
  const queryClient = useQueryClient();

  // Fetch issue and comments in parallel
  const { data: issue, isLoading: issueLoading } = useQuery({
    queryKey: ["issue", owner, repo, issueNumber],
    queryFn: () => fetchIssue(owner, repo, issueNumber),
  });

  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["issue-comments", owner, repo, issueNumber],
    queryFn: () => fetchIssueComments(owner, repo, issueNumber),
  });

  // Mutation for creating comments
  const createCommentMutation = useMutation({
    mutationFn: (body: string) => createIssueComment(owner, repo, issueNumber, body),
    onMutate: async (body) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["issue-comments", owner, repo, issueNumber] });

      // Snapshot previous value
      const previousComments = queryClient.getQueryData<PRComment[]>([
        "issue-comments",
        owner,
        repo,
        issueNumber,
      ]);

      // Optimistically update with a temporary comment
      const optimisticComment: PRComment = {
        id: Date.now(), // Temporary ID
        body,
        user: {
          login: "You", // Placeholder
          avatarUrl: "", // Placeholder
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<PRComment[]>(["issue-comments", owner, repo, issueNumber], (old) =>
        old ? [...old, optimisticComment] : [optimisticComment],
      );

      return { previousComments, optimisticComment };
    },
    onError: (_err, _body, context) => {
      // Revert optimistic update on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          ["issue-comments", owner, repo, issueNumber],
          context.previousComments,
        );
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ["issue-comments", owner, repo, issueNumber] });
    },
  });

  const handleCommentSubmit = async (body: string) => {
    await createCommentMutation.mutateAsync(body);
  };

  const isLoading = issueLoading || commentsLoading;

  return (
    <div className="min-h-screen bg-neutral-50">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/$owner/$repo/issues"
          params={{ owner, repo }}
          className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to issues
        </Link>

        {isLoading ? (
          <PageSpinner />
        ) : issue ? (
          <>
            <IssueDetailHeader issue={issue} />

            <div className="flex gap-6">
              {/* Main content */}
              <div className="flex-1 min-w-0">
                <IssueDetailOverview body={issue.body} comments={comments} />
                <CommentForm
                  onSubmit={handleCommentSubmit}
                  disabled={createCommentMutation.isPending}
                />
              </div>

              {/* Sidebar */}
              <IssueDetailSidebar issue={issue} />
            </div>
          </>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
            <p className="text-neutral-500">Issue not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
