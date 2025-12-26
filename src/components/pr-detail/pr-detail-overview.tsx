import { MessageSquare } from "lucide-react";
import type { PullRequest, PRComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { formatRelativeTime } from "@/lib/utils/date";

interface PRDetailOverviewProps {
  pr: PullRequest;
  comments: PRComment[];
}

function Description({ body }: { body: string }) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-6 mb-6">
      <h2 className="text-sm font-medium text-fg-muted mb-3">Description</h2>
      <MarkdownViewer content={body} />
    </div>
  );
}

function Comments({ comments }: { comments: PRComment[] }) {
  if (comments.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 text-fg-muted mb-3">
          <MessageSquare size={16} />
          <h2 className="text-sm font-medium">Conversation</h2>
        </div>
        <p className="text-fg-muted italic">No comments yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 text-fg-muted p-4 border-b border-border">
        <MessageSquare size={16} />
        <h2 className="text-sm font-medium">Conversation</h2>
        <span className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded-full">{comments.length}</span>
      </div>

      <div className="divide-y divide-border">
        {comments.map((comment) => (
          <div key={comment.id} className="p-4">
            <div className="flex items-start gap-3">
              <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={32} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm text-fg">{comment.user.login}</span>
                  <span className="text-xs text-fg-muted">
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

export function PRDetailOverview({ pr, comments }: PRDetailOverviewProps) {
  return (
    <div>
      <Description body={pr.body} />
      <Comments comments={comments} />
    </div>
  );
}
