import { Star, GitFork, Eye, Scale, Link as LinkIcon, Users } from "lucide-react";
import type { Repository, LanguageBreakdown, User } from "@/lib/types/github";
import { LanguageBar } from "./language-bar";
import { Avatar } from "@/components/ui/avatar";
import { formatCount } from "@/lib/utils/format";

interface RepoSidebarProps {
  repo: Repository;
  languages: LanguageBreakdown;
  contributors: User[];
}

export function RepoSidebar({ repo, languages, contributors }: RepoSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* About */}
      <section className="bg-bg-secondary rounded-xl border border-border p-4">
        <h2 className="text-sm font-semibold text-fg mb-3">About</h2>
        {repo.description ? (
          <p className="text-sm text-fg-secondary leading-relaxed">{repo.description}</p>
        ) : (
          <p className="text-sm text-fg-muted italic">No description provided.</p>
        )}

        {/* Homepage link */}
        {repo.homepage && (
          <a
            href={repo.homepage}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 mt-3 text-sm text-blue-600 hover:underline"
          >
            <LinkIcon size={14} />
            <span className="truncate">{repo.homepage.replace(/^https?:\/\//, "")}</span>
          </a>
        )}

        {/* Topics */}
        {repo.topics.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-4">
            {repo.topics.map((topic) => (
              <span
                key={topic}
                className="px-2 py-0.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 rounded-full hover:bg-blue-500/20 cursor-pointer transition-colors"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* License */}
        {repo.license && (
          <div className="flex items-center gap-2 mt-4 text-sm text-fg-secondary">
            <Scale size={14} className="text-fg-muted" />
            <span>{repo.license.name}</span>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="bg-bg-secondary rounded-xl border border-border p-4">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`https://github.com/${repo.fullName}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Star size={16} className="text-fg-muted mb-1" />
            <span className="text-sm font-semibold text-fg">{formatCount(repo.stars)}</span>
            <span className="text-xs text-fg-muted">Stars</span>
          </a>
          <a
            href={`https://github.com/${repo.fullName}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <GitFork size={16} className="text-fg-muted mb-1" />
            <span className="text-sm font-semibold text-fg">{formatCount(repo.forks)}</span>
            <span className="text-xs text-fg-muted">Forks</span>
          </a>
          <a
            href={`https://github.com/${repo.fullName}/watchers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-bg-hover transition-colors"
          >
            <Eye size={16} className="text-fg-muted mb-1" />
            <span className="text-sm font-semibold text-fg">{formatCount(repo.watchers)}</span>
            <span className="text-xs text-fg-muted">Watching</span>
          </a>
        </div>
      </section>

      {/* Languages */}
      {Object.keys(languages).length > 0 && (
        <section className="bg-bg-secondary rounded-xl border border-border p-4">
          <h2 className="text-sm font-semibold text-fg mb-3">Languages</h2>
          <LanguageBar languages={languages} />
        </section>
      )}

      {/* Contributors */}
      {contributors.length > 0 && (
        <section className="bg-bg-secondary rounded-xl border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-fg">Contributors</h2>
            <a
              href={`https://github.com/${repo.fullName}/graphs/contributors`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-blue-600 hover:underline"
            >
              <Users size={12} />
              <span>View all</span>
            </a>
          </div>
          <div className="flex flex-wrap gap-1">
            {contributors.slice(0, 12).map((user) => (
              <a
                key={user.login}
                href={`https://github.com/${user.login}`}
                target="_blank"
                rel="noopener noreferrer"
                title={user.login}
              >
                <Avatar src={user.avatarUrl} alt={user.login} size={32} />
              </a>
            ))}
          </div>
        </section>
      )}
    </aside>
  );
}
