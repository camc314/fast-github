import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CircleDot, CheckCircle2, ArrowLeft, MessageSquare } from "lucide-react";

import { RepoHeader } from "@/components/repo/repo-header";
import { PageSpinner } from "@/components/ui/spinner";
import { Label } from "@/components/ui/label";
import { Avatar } from "@/components/ui/avatar";
import { fetchIssue } from "@/lib/api/github";

export const Route = createFileRoute("/$owner/$repo/issue/$number")({
  component: IssueDetailPage,
});

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function IssueDetailPage() {
  const { owner, repo, number } = Route.useParams();
  const issueNumber = parseInt(number, 10);

  const { data: issue, isLoading } = useQuery({
    queryKey: ["issue", owner, repo, issueNumber],
    queryFn: () => fetchIssue(owner, repo, issueNumber),
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <RepoHeader />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Link
          to="/$owner/$repo/issues"
          params={{ owner, repo }}
          className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline mb-4"
        >
          <ArrowLeft size={14} />
          Back to issues
        </Link>

        {isLoading ? (
          <PageSpinner />
        ) : issue ? (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* Issue Header */}
            <div className="p-6 border-b border-neutral-100">
              <h1 className="text-xl font-semibold flex items-start gap-2">
                <span>{issue.title}</span>
                <span className="text-neutral-400 font-normal">#{issue.number}</span>
              </h1>

              <div className="flex items-center gap-2 mt-3">
                {issue.state === "open" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-emerald-500 rounded-full">
                    <CircleDot size={14} />
                    Open
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-medium text-white bg-violet-500 rounded-full">
                    <CheckCircle2 size={14} />
                    Closed
                  </span>
                )}

                <span className="text-sm text-neutral-600">
                  <span className="font-medium">{issue.user.login}</span> opened this issue on{" "}
                  {formatDate(issue.createdAt)}
                </span>

                <span className="text-sm text-neutral-400">·</span>

                <span className="inline-flex items-center gap-1 text-sm text-neutral-500">
                  <MessageSquare size={14} />
                  {issue.comments} comments
                </span>
              </div>

              {issue.labels.length > 0 && (
                <div className="flex items-center gap-2 mt-4">
                  {issue.labels.map((label) => (
                    <Label key={label.id} label={label} />
                  ))}
                </div>
              )}
            </div>

            {/* Issue Body */}
            <div className="p-6">
              <div className="flex items-start gap-4">
                <Avatar src={issue.user.avatarUrl} alt={issue.user.login} size={40} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-neutral-900">{issue.user.login}</span>
                    <span className="text-sm text-neutral-500">
                      commented {formatDate(issue.createdAt)}
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-neutral-700">
                    {issue.body || (
                      <span className="italic text-neutral-400">No description provided.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder notice */}
            <div className="m-6 p-6 bg-amber-50 border border-amber-200 rounded-lg text-center">
              <p className="text-amber-800 font-medium">Minimal issue detail page</p>
              <p className="text-amber-700 text-sm mt-1">
                Full implementation coming soon - this is a placeholder view
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-neutral-500">Issue not found</p>
          </div>
        )}
      </main>
    </div>
  );
}
