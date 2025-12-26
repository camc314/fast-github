import { Link, useParams, useMatchRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Book, Star, GitFork, ExternalLink } from "lucide-react";
import type { Repository } from "@/lib/types/github";
import { fetchRepository } from "@/lib/api/github";
import { formatCount } from "@/lib/utils/format";
import { STALE_TIME_MS } from "@/lib/constants";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface RepoHeaderProps {
  owner?: string;
  repo?: string;
  repository?: Repository;
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
    staleTime: STALE_TIME_MS,
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Repo info */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            to="/$owner/$repo"
            params={{ owner, repo }}
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-bg-tertiary flex items-center justify-center hover:bg-bg-hover transition-colors shrink-0"
          >
            <Book size={14} className="text-fg-secondary sm:hidden" />
            <Book size={16} className="text-fg-secondary hidden sm:block" />
          </Link>

          <div className="flex items-center gap-1 sm:gap-1.5 text-sm min-w-0">
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="text-fg-secondary hover:text-fg transition-colors truncate max-w-[80px] sm:max-w-none"
            >
              {owner}
            </Link>
            <span className="text-fg-muted">/</span>
            <Link
              to="/$owner/$repo"
              params={{ owner, repo }}
              className="font-semibold text-fg hover:text-accent transition-colors truncate max-w-[100px] sm:max-w-none"
            >
              {repo}
            </Link>
            <a
              href={`https://github.com/${owner}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 p-1 rounded hover:bg-bg-hover text-fg-muted hover:text-fg-secondary transition-colors shrink-0 hidden sm:inline-flex"
              title="View on GitHub"
            >
              <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Right: Stats and Theme Toggle */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Stars - hide label on mobile */}
          <a
            href={`https://github.com/${owner}/${repo}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-sm text-fg-secondary hover:text-fg hover:bg-bg-hover rounded-lg transition-colors"
          >
            <Star size={14} />
            <span className="font-medium hidden sm:inline">{repoData ? formatCount(repoData.stars) : "..."}</span>
          </a>
          {/* Forks - hide on mobile */}
          <a
            href={`https://github.com/${owner}/${repo}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-fg-secondary hover:text-fg hover:bg-bg-hover rounded-lg transition-colors"
          >
            <GitFork size={14} />
            <span className="font-medium">{repoData ? formatCount(repoData.forks) : "..."}</span>
          </a>
          <div className="ml-1 sm:ml-2 border-l border-border pl-1 sm:pl-2">
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Tabs - scrollable on mobile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <nav className="flex gap-1 -mb-px min-w-max">
          <Link
            to="/$owner/$repo"
            params={{ owner, repo }}
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
