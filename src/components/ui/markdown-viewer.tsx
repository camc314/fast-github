import { useMemo } from "react";
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

// GitHub-flavored markdown alert types
type AlertType = "NOTE" | "TIP" | "IMPORTANT" | "WARNING" | "CAUTION";

const ALERT_ICONS: Record<AlertType, string> = {
  NOTE: "ℹ️",
  TIP: "💡",
  IMPORTANT: "❗",
  WARNING: "⚠️",
  CAUTION: "🔴",
};

/**
 * Preprocesses markdown to convert GitHub-flavored alerts into styled HTML.
 * Converts:
 *   > [!WARNING]
 *   > Content here
 * Into:
 *   <div class="markdown-alert markdown-alert-warning">
 *     <p class="markdown-alert-title">⚠️ Warning</p>
 *     <p>Content here</p>
 *   </div>
 */
function preprocessAlerts(markdown: string): string {
  // Match blockquotes that start with [!TYPE]
  const alertRegex = /^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*\n?)*)/gim;

  return markdown.replace(alertRegex, (_, type: string, content: string) => {
    const alertType = type.toUpperCase() as AlertType;
    const icon = ALERT_ICONS[alertType] || "";
    const title = alertType.charAt(0) + alertType.slice(1).toLowerCase();

    // Remove the leading > from each line of content
    const cleanContent = content
      .split("\n")
      .map((line) => line.replace(/^>\s?/, ""))
      .join("\n")
      .trim();

    return `<div class="markdown-alert markdown-alert-${alertType.toLowerCase()}">
<p class="markdown-alert-title">${icon} ${title}</p>

${cleanContent}

</div>

`;
  });
}

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
  // Preprocess content to handle GitHub-flavored alerts
  const processedContent = useMemo(() => preprocessAlerts(content), [content]);

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
    content: processedContent,
    contentType: "markdown",
    editable: false,
    immediatelyRender: false,
  });

  // Handle empty content
  if (!content?.trim()) {
    return <p className="text-fg-muted italic text-sm">No description provided.</p>;
  }

  return <EditorContent editor={editor} className={className} />;
}
