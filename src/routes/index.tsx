import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Search, Book, ArrowRight } from "lucide-react";
import { useDocumentTitle } from "@/lib/hooks/use-document-title";

export const Route = createFileRoute("/")({
  component: HomePage,
});

const POPULAR_REPOS = [
  { owner: "facebook", repo: "react" },
  { owner: "microsoft", repo: "vscode" },
  { owner: "tanstack", repo: "query" },
  { owner: "vercel", repo: "next.js" },
  { owner: "tailwindlabs", repo: "tailwindcss" },
  { owner: "vitejs", repo: "vite" },
];

function HomePage() {
  useDocumentTitle(undefined); // Use base title on home page
  const navigate = useNavigate();
  const [repoInput, setRepoInput] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const input = repoInput.trim();
    if (!input) {
      setError("Please enter a repository");
      return;
    }

    const match = input.match(/^(?:https?:\/\/github\.com\/)?([^/\s]+)\/([^/\s]+)\/?$/);
    if (!match) {
      setError("Please enter a valid format: owner/repo");
      return;
    }

    const [, owner, repo] = match;
    navigate({
      to: "/$owner/$repo",
      params: { owner, repo: repo.replace(/\.git$/, "") },
    });
  };

  const goToRepo = (owner: string, repo: string) => {
    navigate({
      to: "/$owner/$repo",
      params: { owner, repo },
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-neutral-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
              <Book size={16} className="text-neutral-600" />
            </div>
            <span className="font-semibold text-neutral-900">Fast GitHub</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-xl mx-auto text-center mb-10">
          <h1 className="text-2xl font-semibold text-neutral-900 mb-2">
            Explore GitHub Repositories
          </h1>
          <p className="text-sm text-neutral-500">
            Enter a repository to browse its issues and pull requests
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-12">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none"
            />
            <input
              type="text"
              value={repoInput}
              onChange={(e) => {
                setRepoInput(e.target.value);
                setError("");
              }}
              placeholder="owner/repo"
              className="w-full h-10 pl-9 pr-24 text-sm bg-white border border-neutral-200 rounded-lg
                placeholder:text-neutral-400 text-neutral-900
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
                transition-all duration-150"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-3 text-sm font-medium
                bg-neutral-900 text-white rounded-md hover:bg-neutral-800
                transition-colors duration-150 flex items-center gap-1.5"
            >
              Go
              <ArrowRight size={14} />
            </button>
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>

        <div className="max-w-xl mx-auto">
          <h2 className="text-xs font-medium text-neutral-400 uppercase tracking-wider mb-3">
            Popular Repositories
          </h2>
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden divide-y divide-neutral-100">
            {POPULAR_REPOS.map(({ owner, repo }) => (
              <button
                key={`${owner}/${repo}`}
                onClick={() => goToRepo(owner, repo)}
                className="w-full px-4 py-3 flex items-center justify-between text-left
                  hover:bg-neutral-50 transition-colors duration-150 group"
              >
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-neutral-500">{owner}</span>
                  <span className="text-neutral-300">/</span>
                  <span className="font-medium text-neutral-900">{repo}</span>
                </div>
                <ArrowRight
                  size={14}
                  className="text-neutral-300 group-hover:text-neutral-500 transition-colors"
                />
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
