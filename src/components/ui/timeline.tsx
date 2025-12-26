import { memo } from "react";
import {
  Tag,
  UserPlus,
  UserMinus,
  UserCheck,
  GitMerge,
  XCircle,
  RotateCcw,
  Pencil,
  GitBranch,
  Link2,
  Milestone,
  MessageSquare,
  Check,
  X,
  Eye,
} from "lucide-react";
import type { TimelineEvent, PRComment } from "@/lib/types/github";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { RelativeTime } from "@/components/ui/relative-time";

interface TimelineProps {
  events: TimelineEvent[];
  comments: PRComment[];
}

interface TimelineItemProps {
  event: TimelineEvent;
}

// Get icon and color for each event type
function getEventIcon(type: TimelineEvent["type"]) {
  switch (type) {
    case "labeled":
    case "unlabeled":
      return { icon: Tag, color: "text-yellow-500", bg: "bg-yellow-500/10" };
    case "assigned":
      return { icon: UserPlus, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "unassigned":
      return { icon: UserMinus, color: "text-gray-500", bg: "bg-gray-500/10" };
    case "review_requested":
      return { icon: UserCheck, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "review_request_removed":
      return { icon: UserMinus, color: "text-gray-500", bg: "bg-gray-500/10" };
    case "reviewed":
      return { icon: Eye, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "merged":
      return { icon: GitMerge, color: "text-purple-500", bg: "bg-purple-500/10" };
    case "closed":
      return { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10" };
    case "reopened":
      return { icon: RotateCcw, color: "text-green-500", bg: "bg-green-500/10" };
    case "renamed":
      return { icon: Pencil, color: "text-gray-500", bg: "bg-gray-500/10" };
    case "head_ref_force_pushed":
    case "base_ref_force_pushed":
      return { icon: GitBranch, color: "text-orange-500", bg: "bg-orange-500/10" };
    case "referenced":
    case "cross-referenced":
      return { icon: Link2, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "milestoned":
    case "demilestoned":
      return { icon: Milestone, color: "text-blue-500", bg: "bg-blue-500/10" };
    case "commented":
      return { icon: MessageSquare, color: "text-fg-muted", bg: "bg-bg-tertiary" };
    default:
      return { icon: MessageSquare, color: "text-fg-muted", bg: "bg-bg-tertiary" };
  }
}

// Get review state icon
function getReviewStateIcon(state: string | undefined) {
  switch (state) {
    case "APPROVED":
      return { icon: Check, color: "text-green-500", bg: "bg-green-500/10" };
    case "CHANGES_REQUESTED":
      return { icon: X, color: "text-red-500", bg: "bg-red-500/10" };
    case "COMMENTED":
      return { icon: Eye, color: "text-gray-500", bg: "bg-gray-500/10" };
    default:
      return { icon: Eye, color: "text-gray-500", bg: "bg-gray-500/10" };
  }
}

// Format the event description
function getEventDescription(event: TimelineEvent): React.ReactNode {
  const actorName = event.actor?.login ?? "Someone";

  switch (event.type) {
    case "labeled":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-fg">{actorName}</span>
          <span>added</span>
          {event.label && <Label label={event.label} />}
        </span>
      );
    case "unlabeled":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium text-fg">{actorName}</span>
          <span>removed</span>
          {event.label && <Label label={event.label} />}
        </span>
      );
    case "assigned":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> assigned </span>
          <span className="font-medium text-fg">{event.assignee?.login ?? "someone"}</span>
        </span>
      );
    case "unassigned":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> unassigned </span>
          <span className="font-medium text-fg">{event.assignee?.login ?? "someone"}</span>
        </span>
      );
    case "review_requested":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> requested review from </span>
          <span className="font-medium text-fg">{event.requestedReviewer?.login ?? "someone"}</span>
        </span>
      );
    case "review_request_removed":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> removed review request from </span>
          <span className="font-medium text-fg">{event.requestedReviewer?.login ?? "someone"}</span>
        </span>
      );
    case "reviewed":
      const reviewState =
        event.reviewState === "APPROVED"
          ? "approved"
          : event.reviewState === "CHANGES_REQUESTED"
            ? "requested changes"
            : "reviewed";
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> {reviewState}</span>
        </span>
      );
    case "merged":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> merged this pull request</span>
        </span>
      );
    case "closed":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> closed this</span>
        </span>
      );
    case "reopened":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> reopened this</span>
        </span>
      );
    case "renamed":
      return (
        <span className="flex items-center gap-1 flex-wrap">
          <span className="font-medium text-fg">{actorName}</span>
          <span>changed the title from</span>
          <span className="line-through text-fg-muted">{event.rename?.from}</span>
          <span>to</span>
          <span className="font-medium text-fg">{event.rename?.to}</span>
        </span>
      );
    case "head_ref_force_pushed":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> force-pushed the branch</span>
        </span>
      );
    case "base_ref_force_pushed":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> force-pushed the base branch</span>
        </span>
      );
    case "referenced":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> referenced this in </span>
          {event.source && <span className="font-medium text-fg">#{event.source.number}</span>}
        </span>
      );
    case "cross-referenced":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> mentioned this in </span>
          {event.source && (
            <span className="font-medium text-fg">
              #{event.source.number} {event.source.title}
            </span>
          )}
        </span>
      );
    case "milestoned":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> added this to the </span>
          <span className="font-medium text-fg">{event.milestone?.title}</span>
          <span> milestone</span>
        </span>
      );
    case "demilestoned":
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> removed this from the </span>
          <span className="font-medium text-fg">{event.milestone?.title}</span>
          <span> milestone</span>
        </span>
      );
    default:
      return (
        <span>
          <span className="font-medium text-fg">{actorName}</span>
          <span> performed an action</span>
        </span>
      );
  }
}

/**
 * Compact timeline event item - shown inline with icon
 */
const TimelineEventItem = memo(function TimelineEventItem({ event }: TimelineItemProps) {
  // Use review state icon for reviewed events
  const iconInfo =
    event.type === "reviewed" ? getReviewStateIcon(event.reviewState) : getEventIcon(event.type);
  const Icon = iconInfo.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      {/* Icon with background circle */}
      <div
        className={`w-8 h-8 rounded-full ${iconInfo.bg} flex items-center justify-center shrink-0`}
      >
        <Icon size={16} className={iconInfo.color} />
      </div>

      {/* Event description */}
      <div className="flex-1 min-w-0 pt-1">
        <div className="flex items-center gap-2 text-sm text-fg-muted flex-wrap">
          {getEventDescription(event)}
          <RelativeTime date={event.createdAt} className="text-xs" />
        </div>
        {/* Show review body if present */}
        {event.type === "reviewed" && event.reviewBody && (
          <div className="mt-2 text-sm bg-bg-tertiary rounded-lg p-3 border border-border">
            <MarkdownViewer content={event.reviewBody} />
          </div>
        )}
      </div>
    </div>
  );
});

/**
 * Comment item - shown as a full card with avatar and body
 */
const CommentItem = memo(function CommentItem({ comment }: { comment: PRComment }) {
  return (
    <div className="flex items-start gap-3 py-3">
      {/* Avatar */}
      <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={32} />

      {/* Comment card */}
      <div className="flex-1 min-w-0 bg-bg rounded-lg border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border-b border-border">
          <span className="font-medium text-sm text-fg">{comment.user.login}</span>
          <RelativeTime date={comment.createdAt} className="text-xs text-fg-muted" />
        </div>

        {/* Body */}
        <div className="px-4 py-3">
          <MarkdownViewer content={comment.body} />
        </div>
      </div>
    </div>
  );
});

// Combine and sort timeline events with comments chronologically
type TimelineItem =
  | { type: "event"; data: TimelineEvent; date: Date }
  | { type: "comment"; data: PRComment; date: Date };

function mergeTimelineItems(events: TimelineEvent[], comments: PRComment[]): TimelineItem[] {
  const items: TimelineItem[] = [
    ...events.map((event) => ({
      type: "event" as const,
      data: event,
      date: new Date(event.createdAt),
    })),
    ...comments.map((comment) => ({
      type: "comment" as const,
      data: comment,
      date: new Date(comment.createdAt),
    })),
  ];

  // Sort by date ascending (oldest first)
  items.sort((a, b) => a.date.getTime() - b.date.getTime());

  return items;
}

export const Timeline = memo(function Timeline({ events, comments }: TimelineProps) {
  const items = mergeTimelineItems(events, comments);

  if (items.length === 0) {
    return (
      <div className="bg-bg-secondary rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 text-fg-muted mb-3">
          <MessageSquare size={16} />
          <h2 className="text-sm font-medium">Activity</h2>
        </div>
        <p className="text-fg-muted italic">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center gap-2 text-fg-muted mb-4">
        <MessageSquare size={16} />
        <h2 className="text-sm font-medium">Activity</h2>
        <span className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded-full">{items.length}</span>
      </div>

      {/* Timeline with vertical line */}
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-4 top-4 bottom-4 w-px bg-border" />

        {/* Timeline items */}
        <div className="relative space-y-0">
          {items.map((item, index) =>
            item.type === "comment" ? (
              <CommentItem key={`comment-${item.data.id}`} comment={item.data} />
            ) : (
              <TimelineEventItem key={`event-${item.data.id}-${index}`} event={item.data} />
            ),
          )}
        </div>
      </div>
    </div>
  );
});
