import { Link, useParams, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Book, Star, GitFork, ExternalLink } from "lucide-react";
import type { Repository } from "@/lib/types/github";
import { fetchRepository } from "@/lib/api/github";

interface RepoHeaderProps {
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

export function RepoHeader({ repository }: RepoHeaderProps) {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;
  const matchRoute = useMatchRoute();

  // Fetch repository data if not provided as prop
  const repoQuery = useQuery({
    queryKey: ["repository", owner, repo],
    queryFn: () => fetchRepository(owner, repo),
    staleTime: 5 * 60 * 1000,
    enabled: !repository, // Only fetch if not provided
  });

  const repoData = repository ?? repoQuery.data;

  const isCodeActive = matchRoute({ to: "/$owner/$repo", params: { owner, repo } });
  const isIssuesActive = matchRoute({ to: "/$owner/$repo/issues", params: { owner, repo } });
  const isPullsActive = matchRoute({ to: "/$owner/$repo/pulls", params: { owner, repo } });

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Repo info */}
        <div className="flex items-center gap-3">
          <Link
            to="/$owner/$repo"
            params={{ owner, repo }}
            className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center hover:from-neutral-200 hover:to-neutral-300 transition-colors"
          >
            <Book size={16} className="text-neutral-600" />
          </Link>

          <div className="flex items-center gap-1.5 text-sm">
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {owner}
            </Link>
            <span className="text-neutral-300">/</span>
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="font-semibold text-neutral-900 hover:text-blue-600 transition-colors"
            >
              {repo}
            </Link>
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Star size={14} />
            <span className="font-medium">{repoData ? formatCount(repoData.stars) : "..."}</span>
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
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
                ? "text-neutral-900 border-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 border-transparent hover:border-neutral-300"
            }`}
          >
            Code
          </Link>
          <Link
            to="/$owner/$repo/issues"
            params={{ owner, repo }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isIssuesActive
                ? "text-neutral-900 border-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 border-transparent hover:border-neutral-300"
            }`}
          >
            Issues
          </Link>
          <Link
            to="/$owner/$repo/pulls"
            params={{ owner, repo }}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              isPullsActive
                ? "text-neutral-900 border-neutral-900"
                : "text-neutral-500 hover:text-neutral-700 border-transparent hover:border-neutral-300"
            }`}
          >
            Pull Requests
          </Link>
        </nav>
      </div>
    </header>
  );
}
