import { Link, useParams, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Book, Star, GitFork, ExternalLink } from "lucide-react";
import type { Repository } from "@/lib/types/github";
import { fetchRepository } from "@/lib/api/github";

interface RepoHeaderProps {
  owner?: string;
  repo?: string;
  repository?: Repository;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}m`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
}

export function RepoHeader({ owner: ownerProp, repo: repoProp, repository }: RepoHeaderProps) {
  // Use props if provided, otherwise extract from URL params
  const params = useParams({ strict: false });
  const owner = ownerProp ?? (params as { owner?: string }).owner ?? "";
  const repo = repoProp ?? (params as { repo?: string }).repo ?? "";
  const matchRoute = useMatchRoute();

  // Fetch repository data if not provided as prop
  const repoQuery = useQuery({
    queryKey: ["repository", owner, repo],
    queryFn: () => fetchRepository(owner, repo),
    staleTime: 5 * 60 * 1000,
    enabled: !repository && !!owner && !!repo,
  });

  const repoData = repository ?? repoQuery.data;

  const isCodeActive = matchRoute({ to: "/$owner/$repo", params: { owner, repo } });
  const isIssuesActive = matchRoute({ to: "/$owner/$repo/issues", params: { owner, repo } });
  const isPullsActive = matchRoute({ to: "/$owner/$repo/pulls", params: { owner, repo } });

  if (!owner || !repo) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-bg-secondary/80 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Repo info */}
        <div className="flex items-center gap-3">
          <Link
            to="/$owner/$repo"
            params={{ owner, repo }}
            className="w-8 h-8 rounded-lg bg-bg-tertiary flex items-center justify-center hover:bg-bg-hover transition-colors"
          >
            <Book size={16} className="text-fg-secondary" />
          </Link>

          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="text-fg-secondary hover:text-fg transition-colors"
            >
              {owner}
            </Link>
            <span className="text-fg-muted">/</span>
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="font-semibold text-fg hover:text-accent transition-colors"
            >
              {repo}
            </Link>
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 p-1 rounded hover:bg-bg-hover text-fg-muted hover:text-fg-secondary transition-colors"
              title="View on GitHub"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Right: Stats */}
        <div className="flex items-center gap-1">
          <a
            href={`https://github.com/${owner}/${repo}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-fg-secondary hover:text-fg hover:bg-bg-hover rounded-lg transition-colors"
          >
            <Star size={14} />
            <span className="font-medium">{repoData ? formatCount(repoData.stars) : "..."}</span>
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-fg-secondary hover:text-fg hover:bg-bg-hover rounded-lg transition-colors"
          >
            <GitFork size={14} />
            <span className="font-medium">{repoData ? formatCount(repoData.forks) : "..."}</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex gap-1 -mb-px">
          <Link
            to="/$owner/$repo"
            params={{ owner, repo }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isCodeActive
                ? "text-fg border-fg"
                : "text-fg-secondary hover:text-fg border-transparent hover:border-border-secondary"
            }`}
          >
            Code
          </Link>
          <Link
            to="/$owner/$repo/issues"
            params={{ owner, repo }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isIssuesActive
                ? "text-fg border-fg"
                : "text-fg-secondary hover:text-fg border-transparent hover:border-border-secondary"
            }`}
          >
            Issues
          </Link>
          <Link
            to="/$owner/$repo/pulls"
            params={{ owner, repo }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isPullsActive
                ? "text-fg border-fg"
                : "text-fg-secondary hover:text-fg border-transparent hover:border-border-secondary"
            }`}
          >
            Pull Requests
          </Link>
        </nav>
      </div>
    </header>
  );
}
