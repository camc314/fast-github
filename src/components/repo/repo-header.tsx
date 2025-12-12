import { Link, useParams } from "@tanstack/react-router";
import { GitPullRequest, Star, GitFork, ExternalLink } from "lucide-react";

export function RepoHeader() {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left: Repo info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            <GitPullRequest size={16} className="text-neutral-600" />
          </div>

          <div className="flex items-center gap-1.5 text-sm">
            <a
              href={`https://github.com/${owner}`}
              className="text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              {owner}
            </a>
            <span className="text-neutral-300">/</span>
            <a
              href={`https://github.com/${owner}/${repo}`}
              className="font-semibold text-neutral-900 hover:text-blue-600 transition-colors"
            >
              {repo}
            </a>
            <a
              href={`https://github.com/${owner}/${repo}`}
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <Star size={14} />
            <span className="font-medium">242k</span>
          </a>
          <a
            href={`https://github.com/${owner}/${repo}/forks`}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <GitFork size={14} />
            <span className="font-medium">50k</span>
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-6">
        <nav className="flex gap-1 -mb-px">
          <Link
            to="/$owner/$repo/pulls"
            params={{ owner, repo }}
            className="px-4 py-2.5 text-sm font-medium text-neutral-900 border-b-2 border-neutral-900 transition-colors"
          >
            Pull Requests
          </Link>
          <a
            href={`https://github.com/${owner}/${repo}/issues`}
            className="px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent hover:border-neutral-300 transition-colors"
          >
            Issues
          </a>
          <a
            href={`https://github.com/${owner}/${repo}`}
            className="px-4 py-2.5 text-sm font-medium text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent hover:border-neutral-300 transition-colors"
          >
            Code
          </a>
        </nav>
      </div>
    </header>
  );
}
