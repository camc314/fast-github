import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";

import { RepoHeader } from "@/components/repo/repo-header";
import { RepoSidebar } from "@/components/repo/repo-sidebar";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { PageSpinner } from "@/components/ui/spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";
import {
  fetchRepository,
  fetchReadme,
  fetchLanguages,
  fetchRepoContributors,
} from "@/lib/api/github";

export const Route = createFileRoute("/$owner/$repo/")({
  component: RepoHomePage,
});

function RepoHomePage() {
  const { owner, repo } = useParams({ from: "/$owner/$repo/" });
  useDocumentTitle(`${owner}/${repo}`);

  // Fetch repository data
  const repoQuery = useQuery({
    queryKey: ["repository", owner, repo],
    queryFn: () => fetchRepository(owner, repo),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch README
  const readmeQuery = useQuery({
    queryKey: ["readme", owner, repo],
    queryFn: () => fetchReadme(owner, repo),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch languages
  const languagesQuery = useQuery({
    queryKey: ["languages", owner, repo],
    queryFn: () => fetchLanguages(owner, repo),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch contributors
  const contributorsQuery = useQuery({
    queryKey: ["contributors", owner, repo],
    queryFn: () => fetchRepoContributors(owner, repo),
    staleTime: 10 * 60 * 1000,
  });

  // Loading state
  if (repoQuery.isLoading) {
    return (
      <div className="min-h-screen bg-bg">
        <RepoHeader />
        <PageSpinner />
      </div>
    );
  }

  // Error state
  if (repoQuery.error) {
    return (
      <div className="min-h-screen bg-bg">
        <RepoHeader />
        <main className="max-w-6xl mx-auto px-6 py-8">
          <ErrorMessage error={repoQuery.error} onRetry={() => repoQuery.refetch()} />
        </main>
      </div>
    );
  }

  const repository = repoQuery.data!;
  const readme = readmeQuery.data;
  const languages = languagesQuery.data ?? {};
  const contributors = contributorsQuery.data ?? [];

  return (
    <div className="min-h-screen bg-bg">
      <RepoHeader repository={repository} />

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main content - README */}
          <div className="flex-1 min-w-0">
            <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
              {/* README header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-bg">
                <FileText size={16} className="text-fg-muted" />
                <span className="text-sm font-medium text-fg-secondary">
                  {readme?.name ?? "README.md"}
                </span>
              </div>

              {/* README content */}
              <div className="p-6">
                {readmeQuery.isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-border border-t-fg-secondary rounded-full animate-spin" />
                  </div>
                ) : readme ? (
                  <MarkdownViewer content={readme.content} />
                ) : (
                  <div className="text-center py-12">
                    <FileText size={48} className="mx-auto text-border mb-3" />
                    <p className="text-fg-muted">No README found</p>
                    <p className="text-sm text-fg-muted mt-1">
                      Add a README to help others understand this repository
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 shrink-0">
            <RepoSidebar repo={repository} languages={languages} contributors={contributors} />
          </div>
        </div>
      </main>
    </div>
  );
}
