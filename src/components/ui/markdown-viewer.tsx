import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import { Markdown } from "@tiptap/markdown";
import { Node, mergeAttributes } from "@tiptap/core";
import "./markdown-viewer.css";

// Custom Details extension for <details> and <summary> support
const Details = Node.create({
  name: "details",
  group: "block",
  content: "detailsSummary block+",
  defining: true,

  parseHTML() {
    return [{ tag: "details" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["details", mergeAttributes(HTMLAttributes), 0];
  },
});

const DetailsSummary = Node.create({
  name: "detailsSummary",
  group: "block",
  content: "inline*",
  defining: true,

  parseHTML() {
    return [{ tag: "summary" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["summary", mergeAttributes(HTMLAttributes), 0];
  },
});

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        undoRedo: false, // Not needed for read-only
      }),
      Link.configure({
        openOnClick: true,
        autolink: true,
        HTMLAttributes: {
          // Same tab like GitHub
          target: null,
          rel: "noopener noreferrer nofollow",
        },
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      Details,
      DetailsSummary,
      Markdown,
    ],
    content: content,
    contentType: "markdown",
    editable: false,
    immediatelyRender: false,
  });

  // Handle empty content
  if (!content?.trim()) {
    return <p className="text-neutral-400 italic text-sm">No description provided.</p>;
  }

  return <EditorContent editor={editor} className={className} />;
}
