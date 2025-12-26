import { memo } from "react";
import type { PRReviewComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { formatRelativeTime } from "@/lib/utils/date";

interface DiffCommentThreadProps {
  comments: PRReviewComment[];
}

function SingleComment({ comment }: { comment: PRReviewComment }) {
  return (
    <div className="flex items-start gap-3 p-3">
      <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-fg">{comment.user.login}</span>
          <span className="text-xs text-fg-muted">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <div className="text-sm text-fg-secondary">
          <MarkdownViewer content={comment.body} />
        </div>
      </div>
    </div>
  );
}

/**
 * Comment thread displayed as a diff annotation.
 * Shows all comments for a line, each with their nested replies.
 */
export const DiffCommentThread = memo(function DiffCommentThread({
  comments,
}: DiffCommentThreadProps) {
  if (comments.length === 0) return null;

  return (
    <div className="bg-comment border-b border-comment-border">
      {comments.map((comment, index) => (
        <div key={comment.id} className={index > 0 ? "border-t border-comment-border" : undefined}>
          <SingleComment comment={comment} />

          {/* Nested replies for this comment */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-t border-comment-border-light ml-10">
              {comment.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="border-b border-comment-border-light last:border-b-0"
                >
                  <SingleComment comment={reply} />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
});
