import { useState, useCallback, useRef, useEffect } from "react";
import { Send, X, Loader2 } from "lucide-react";

interface InlineCommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  onCancel: () => void;
  placeholder?: string;
}

/**
 * Inline comment form that appears in the diff when adding a new comment.
 * Simpler than the full CommentForm - just a textarea with submit/cancel.
 */
export function InlineCommentForm({
  onSubmit,
  onCancel,
  placeholder = "Write a comment...",
}: InlineCommentFormProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus the textarea when mounted
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Comment cannot be empty");
      return;
    }

    if (trimmedBody.length > 65536) {
      setError("Comment is too long (max 65,536 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmedBody);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
      setIsSubmitting(false);
    }
  }, [body, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Submit on Ctrl/Cmd + Enter
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
      // Cancel on Escape
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
    },
    [handleSubmit, onCancel],
  );

  return (
    <div className="p-3 bg-bg-secondary border-t border-border">
      <textarea
        ref={textareaRef}
        value={body}
        onChange={(e) => {
          setBody(e.target.value);
          setError(null);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="w-full min-h-[80px] p-2 text-sm border border-border rounded-lg resize-y focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:bg-bg"
      />

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400 bg-error border border-error-border rounded-lg p-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mt-2">
        <span className="text-xs text-fg-muted">Ctrl+Enter to submit, Esc to cancel</span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-fg-secondary hover:text-fg hover:bg-bg-tertiary rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={14} />
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !body.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Posting...
              </>
            ) : (
              <>
                <Send size={14} />
                Comment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
