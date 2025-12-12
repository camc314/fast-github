import { useParams } from "@tanstack/react-router";
import { Plus } from "lucide-react";

export function PRListHeader() {
  const params = useParams({ strict: false }) as {
    owner?: string;
    repo?: string;
  };
  const { owner = "facebook", repo = "react" } = params;

  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Pull Requests</h1>
        <p className="text-sm text-neutral-500 mt-1">Review and manage code changes</p>
      </div>

      <a
        href={`https://github.com/${owner}/${repo}/compare`}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-neutral-900 hover:bg-neutral-800 rounded-lg transition-colors shadow-sm"
      >
        <Plus size={16} />
        New
      </a>
    </div>
  );
}
