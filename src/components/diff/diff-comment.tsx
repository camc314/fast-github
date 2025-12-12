import { memo } from "react";
import type { PRReviewComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/date";

interface DiffCommentProps {
  comment: PRReviewComment;
  gutterWidth: string;
}

function SingleComment({ comment }: { comment: PRReviewComment }) {
  return (
    <div className="flex gap-3 p-3">
      <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-neutral-900">{comment.user.login}</span>
          <span className="text-xs text-neutral-400">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <div className="text-sm text-neutral-700 whitespace-pre-wrap">{comment.body}</div>
      </div>
    </div>
  );
}

/**
 * Inline comment thread displayed below a diff line.
 * Shows the main comment and any replies.
 */
export const DiffComment = memo(function DiffComment({ comment, gutterWidth }: DiffCommentProps) {
  return (
    <div className="flex bg-amber-50 border-y border-amber-200">
      {/* Gutter spacer to align with line numbers */}
      <div
        style={{ width: gutterWidth }}
        className="shrink-0 bg-amber-100 border-r border-amber-200"
      />

      {/* Comment content */}
      <div className="flex-1 min-w-0">
        <SingleComment comment={comment} />

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="border-t border-amber-200">
            {comment.replies.map((reply) => (
              <div key={reply.id} className="border-b border-amber-100 last:border-b-0">
                <SingleComment comment={reply} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
