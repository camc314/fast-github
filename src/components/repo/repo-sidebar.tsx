import { Star, GitFork, Eye, Scale, Link as LinkIcon, Users } from "lucide-react";
import type { Repository, LanguageBreakdown, User } from "@/lib/types/github";
import { LanguageBar } from "./language-bar";
import { Avatar } from "@/components/ui/avatar";

interface RepoSidebarProps {
  repo: Repository;
  languages: LanguageBreakdown;
  contributors: User[];
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

export function RepoSidebar({ repo, languages, contributors }: RepoSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* About */}
      <section className="bg-white rounded-xl border border-neutral-200 p-4">
        <h2 className="text-sm font-semibold text-neutral-900 mb-3">About</h2>
        {repo.description ? (
          <p className="text-sm text-neutral-600 leading-relaxed">{repo.description}</p>
        ) : (
          <p className="text-sm text-neutral-400 italic">No description provided.</p>
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
                className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 cursor-pointer transition-colors"
              >
                {topic}
              </span>
            ))}
          </div>
        )}

        {/* License */}
        {repo.license && (
          <div className="flex items-center gap-2 mt-4 text-sm text-neutral-600">
            <Scale size={14} className="text-neutral-400" />
            <span>{repo.license.name}</span>
          </div>
        )}
      </section>

      {/* Stats */}
      <section className="bg-white rounded-xl border border-neutral-200 p-4">
        <div className="grid grid-cols-3 gap-2">
          <a
            href={`https://github.com/${repo.fullName}/stargazers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Star size={16} className="text-neutral-400 mb-1" />
            <span className="text-sm font-semibold text-neutral-900">
              {formatCount(repo.stars)}
            </span>
            <span className="text-xs text-neutral-500">Stars</span>
          </a>
          <a
            href={`https://github.com/${repo.fullName}/forks`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <GitFork size={16} className="text-neutral-400 mb-1" />
            <span className="text-sm font-semibold text-neutral-900">
              {formatCount(repo.forks)}
            </span>
            <span className="text-xs text-neutral-500">Forks</span>
          </a>
          <a
            href={`https://github.com/${repo.fullName}/watchers`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center p-2 rounded-lg hover:bg-neutral-50 transition-colors"
          >
            <Eye size={16} className="text-neutral-400 mb-1" />
            <span className="text-sm font-semibold text-neutral-900">
              {formatCount(repo.watchers)}
            </span>
            <span className="text-xs text-neutral-500">Watching</span>
          </a>
        </div>
      </section>

      {/* Languages */}
      {Object.keys(languages).length > 0 && (
        <section className="bg-white rounded-xl border border-neutral-200 p-4">
          <h2 className="text-sm font-semibold text-neutral-900 mb-3">Languages</h2>
          <LanguageBar languages={languages} />
        </section>
      )}

      {/* Contributors */}
      {contributors.length > 0 && (
        <section className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-neutral-900">Contributors</h2>
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
