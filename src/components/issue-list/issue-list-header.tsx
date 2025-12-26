import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function IssueListHeader() {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Issues</h1>
        <p className="text-sm text-fg-muted mt-1">Track bugs, features, and tasks</p>
      </div>

      <a
        href={`https://github.com/${owner}/${repo}/issues/new`}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-bg-secondary bg-fg hover:opacity-90 rounded-lg transition-colors shadow-sm"
      >
        <Plus size={16} />
        New
      </a>
    </div>
  );
}
