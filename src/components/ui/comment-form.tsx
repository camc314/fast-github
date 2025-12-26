import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension } from "@tiptap/core";
import { MessageSquare, Send, Eye, EyeOff, Loader2 } from "lucide-react";

interface CommentFormProps {
  onSubmit: (body: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = "Write a comment...",
  disabled,
}: CommentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false,
      }),
      Link.configure({
        autolink: true,
        openOnClick: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Placeholder.configure({
        placeholder: placeholder || "Write a comment...",
      }),
      Extension.create({
        addKeyboardShortcuts() {
          return {
            "Mod-Enter": () => {
              handleSubmit();
              return true;
            },
          };
        },
      }),
    ],
    content: "",
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setError(null);
      setIsEmpty(!editor.getText().trim());
    },
  });

  const handleSubmit = async () => {
    if (!editor) return;

    const body = editor.getText().trim();
    if (!body) {
      setError("Comment cannot be empty");
      return;
    }

    if (body.length > 65536) {
      setError("Comment is too long (max 65,536 characters)");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit(editor.getHTML());
      editor.commands.clearContent();
      setShowPreview(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden mt-6">
      {/* Header */}
      <div className="flex items-center gap-2 text-fg-muted px-4 py-3 border-b border-border">
        <MessageSquare size={16} />
        <h2 className="text-sm font-medium">Add a comment</h2>
      </div>

      <div className="p-4 space-y-3">
        {/* Editor/Preview */}
        <div className="border border-border rounded-lg min-h-[100px] focus-within:border-[var(--color-accent)] focus-within:ring-1 focus-within:ring-[var(--color-accent)] transition-[border-color,box-shadow] duration-[var(--transition-fast)]">
          {showPreview ? (
            <div className="prose prose-sm max-w-none p-3 bg-bg rounded-lg min-h-[100px]">
              {editor?.getText() ? (
                <EditorContent editor={editor} className="pointer-events-none" />
              ) : (
                <p className="text-fg-muted italic m-0">Nothing to preview</p>
              )}
            </div>
          ) : (
            <EditorContent
              editor={editor}
              className="min-h-[100px] p-3 prose prose-sm max-w-none focus:outline-none"
            />
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-[var(--color-error)] bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg hover:bg-bg-tertiary rounded-md transition-colors duration-[var(--transition-fast)]"
              disabled={isSubmitting}
            >
              {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
              {showPreview ? "Edit" : "Preview"}
            </button>
            <span className="text-xs text-fg-muted">Ctrl+Enter to submit</span>
          </div>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isEmpty}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity duration-[var(--transition-fast)]"
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
