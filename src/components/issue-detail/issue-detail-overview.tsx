import { MessageSquare } from "lucide-react";
import type { PRComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface IssueDetailOverviewProps {
  body: string;
  comments: PRComment[];
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
    return `${diffHours}h ago`;
  }
  if (diffDays === 1) return "yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function Description({ body }: { body: string }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 p-6 mb-6">
      <h2 className="text-sm font-medium text-neutral-500 mb-3">Description</h2>
      <MarkdownViewer content={body} />
    </div>
  );
}

function Comments({ comments }: { comments: PRComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <div className="flex items-center gap-2 text-neutral-500 mb-3">
          <MessageSquare size={16} />
          <h2 className="text-sm font-medium">Conversation</h2>
        </div>
        <p className="text-neutral-400 italic">No comments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
      <div className="flex items-center gap-2 text-neutral-500 p-4 border-b border-neutral-100">
        <MessageSquare size={16} />
        <h2 className="text-sm font-medium">Conversation</h2>
        <span className="text-xs bg-neutral-100 px-1.5 py-0.5 rounded-full">{comments.length}</span>
      </div>

      <div className="divide-y divide-neutral-100">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-neutral-900">{comment.user.login}</span>
                  <span className="text-xs text-neutral-400">
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
                <MarkdownViewer content={comment.body} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function IssueDetailOverview({ body, comments }: IssueDetailOverviewProps) {
  return (
    <div>
      <Description body={body} />
      <Comments comments={comments} />
    </div>
  );
}
