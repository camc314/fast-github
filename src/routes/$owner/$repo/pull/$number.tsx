import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  GitPullRequest,
  GitMerge,
  ArrowLeft,
  MessageSquare,
  GitCommit,
  FileCode,
} from "lucide-react";

import { RepoHeader } from "@/components/repo/repo-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { fetchPullRequest } from "@/lib/api/github";

export const Route = createFileRoute("/$owner/$repo/pull/$number")({
  component: PullRequestDetailPage,
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function PullRequestDetailPage() {
  const { owner, repo, number } = Route.useParams();
  const prNumber = parseInt(number, 10);

  const { data: pr, isLoading } = useQuery({
    queryKey: ["pull-request", owner, repo, prNumber],
    queryFn: () => fetchPullRequest(owner, repo, prNumber),
  });

  return (
    <div className="min-h-screen bg-white">
      <RepoHeader />

      <main className="max-w-5xl mx-auto px-4 py-6">
        <Link
          to="/$owner/$repo/pulls"
          params={{ owner, repo }}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={14} />
          Back to pull requests
        </Link>

        {isLoading ? (
          <PageSpinner />
        ) : pr ? (
          <div>
            {/* PR Header */}
            <div className="border-b border-gray-200 pb-4 mb-6">
              <h1 className="text-2xl font-semibold flex items-start gap-2">
                <span>{pr.title}</span>
                <span className="text-gray-400 font-normal">#{pr.number}</span>
              </h1>

              <div className="flex items-center gap-2 mt-2">
                {pr.state === "open" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-white bg-green-600 rounded-full">
                    <GitPullRequest size={14} />
                    Open
                  </span>
                ) : pr.state === "merged" ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-white bg-purple-600 rounded-full">
                    <GitMerge size={14} />
                    Merged
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 text-sm font-medium text-white bg-red-600 rounded-full">
                    <GitPullRequest size={14} />
                    Closed
                  </span>
                )}

                <span className="text-sm text-gray-600">
                  <span className="font-medium">{pr.user.login}</span> wants to merge · opened{" "}
                  {formatDate(pr.createdAt)}
                </span>
              </div>

              {pr.labels.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  {pr.labels.map((label) => (
                    <Label key={label.id} label={label} />
                  ))}
                </div>
              )}
            </div>

            {/* Tabs placeholder */}
            <div className="flex gap-4 border-b border-gray-200 mb-6">
              <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 border-orange-500">
                <MessageSquare size={16} />
                Conversation
                <span className="px-1.5 py-0.5 bg-gray-200 rounded-full text-xs">
                  {pr.comments}
                </span>
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                <GitCommit size={16} />
                Commits
              </button>
              <button className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
                <FileCode size={16} />
                Files changed
              </button>
            </div>

            {/* Author info */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <Avatar src={pr.user.avatarUrl} alt={pr.user.login} size={40} />
              <div>
                <div className="font-medium">{pr.user.login}</div>
                <p className="text-sm text-gray-600 mt-1">{pr.body}</p>
              </div>
            </div>

            {/* Placeholder notice */}
            <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <p className="text-yellow-800 font-medium">Minimal PR detail page</p>
              <p className="text-yellow-700 text-sm mt-1">
                Full implementation coming soon - this is a placeholder view
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">Pull request not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
