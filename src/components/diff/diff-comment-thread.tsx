import { memo } from "react";
import type { PRReviewComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils/date";

interface DiffCommentThreadProps {
  comments: PRReviewComment[];
}

function SingleComment({ comment }: { comment: PRReviewComment }) {
  return (
    <div className="flex gap-3 p-3">
      <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={28} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-fg">{comment.user.login}</span>
          <span className="text-xs text-fg-muted">{formatRelativeTime(comment.createdAt)}</span>
        </div>
        <div className="text-sm text-fg-secondary whitespace-pre-wrap">{comment.body}</div>
      </div>
    </div>
  );
}

/**
 * Comment thread displayed as a diff annotation.
 * Shows the main comment and any replies.
 */
export const DiffCommentThread = memo(function DiffCommentThread({
  comments,
}: DiffCommentThreadProps) {
  if (comments.length === 0) return null;

  // The first comment is the main one, rest are replies (already structured)
  const mainComment = comments[0];
  const additionalComments = comments.slice(1);

  return (
    <div className="bg-comment border-b border-comment-border">
      <SingleComment comment={mainComment} />

      {/* Replies from the main comment */}
      {mainComment.replies && mainComment.replies.length > 0 && (
        <div className="border-t border-comment-border ml-10">
          {mainComment.replies.map((reply) => (
            <div key={reply.id} className="border-b border-comment-border-light last:border-b-0">
              <SingleComment comment={reply} />
            </div>
          ))}
        </div>
      )}

      {/* Additional top-level comments on the same line */}
      {additionalComments.map((comment) => (
        <div key={comment.id} className="border-t border-comment-border">
          <SingleComment comment={comment} />
          {comment.replies && comment.replies.length > 0 && (
            <div className="border-t border-comment-border-light ml-10">
              {comment.replies.map((reply) => (
                <div key={reply.id} className="border-b border-comment-border-light last:border-b-0">
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
