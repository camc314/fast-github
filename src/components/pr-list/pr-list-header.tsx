import { Plus } from "lucide-react";

interface PRListHeaderProps {
  owner: string;
  repo: string;
}

export function PRListHeader({ owner, repo }: PRListHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Pull Requests</h1>
        <p className="text-sm text-fg-muted mt-1">Review and manage code changes</p>
      </div>

      <a
        href={`https://github.com/${owner}/${repo}/compare`}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-bg-secondary bg-fg hover:opacity-90 rounded-lg transition-colors shadow-sm"
      >
        <Plus size={16} />
        New
      </a>
    </div>
  );
}
