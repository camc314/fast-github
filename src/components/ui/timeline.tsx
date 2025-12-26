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
import { formatRelativeTime } from "@/lib/utils/date";

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
      return { icon: Tag, color: "text-yellow-500" };
    case "assigned":
      return { icon: UserPlus, color: "text-blue-500" };
    case "unassigned":
      return { icon: UserMinus, color: "text-gray-500" };
    case "review_requested":
      return { icon: UserCheck, color: "text-purple-500" };
    case "review_request_removed":
      return { icon: UserMinus, color: "text-gray-500" };
    case "reviewed":
      return { icon: Eye, color: "text-purple-500" };
    case "merged":
      return { icon: GitMerge, color: "text-purple-500" };
    case "closed":
      return { icon: XCircle, color: "text-red-500" };
    case "reopened":
      return { icon: RotateCcw, color: "text-green-500" };
    case "renamed":
      return { icon: Pencil, color: "text-gray-500" };
    case "head_ref_force_pushed":
    case "base_ref_force_pushed":
      return { icon: GitBranch, color: "text-orange-500" };
    case "referenced":
    case "cross-referenced":
      return { icon: Link2, color: "text-blue-500" };
    case "milestoned":
    case "demilestoned":
      return { icon: Milestone, color: "text-blue-500" };
    case "commented":
      return { icon: MessageSquare, color: "text-fg-muted" };
    default:
      return { icon: MessageSquare, color: "text-fg-muted" };
  }
}

// Get review state icon
function getReviewStateIcon(state: string | undefined) {
  switch (state) {
    case "APPROVED":
      return { icon: Check, color: "text-green-500" };
    case "CHANGES_REQUESTED":
      return { icon: X, color: "text-red-500" };
    case "COMMENTED":
      return { icon: Eye, color: "text-gray-500" };
    default:
      return { icon: Eye, color: "text-gray-500" };
  }
}

// Format the event description
function getEventDescription(event: TimelineEvent): React.ReactNode {
  const actorName = event.actor?.login ?? "Someone";

  switch (event.type) {
    case "labeled":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium">{actorName}</span>
          <span>added</span>
          {event.label && <Label label={event.label} />}
        </span>
      );
    case "unlabeled":
      return (
        <span className="flex items-center gap-1.5 flex-wrap">
          <span className="font-medium">{actorName}</span>
          <span>removed</span>
          {event.label && <Label label={event.label} />}
        </span>
      );
    case "assigned":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> assigned </span>
          <span className="font-medium">{event.assignee?.login ?? "someone"}</span>
        </span>
      );
    case "unassigned":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> unassigned </span>
          <span className="font-medium">{event.assignee?.login ?? "someone"}</span>
        </span>
      );
    case "review_requested":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> requested review from </span>
          <span className="font-medium">{event.requestedReviewer?.login ?? "someone"}</span>
        </span>
      );
    case "review_request_removed":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> removed review request from </span>
          <span className="font-medium">{event.requestedReviewer?.login ?? "someone"}</span>
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
          <span className="font-medium">{actorName}</span>
          <span> {reviewState}</span>
        </span>
      );
    case "merged":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> merged this pull request</span>
        </span>
      );
    case "closed":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> closed this</span>
        </span>
      );
    case "reopened":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> reopened this</span>
        </span>
      );
    case "renamed":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> changed the title from </span>
          <span className="line-through text-fg-muted">{event.rename?.from}</span>
          <span> to </span>
          <span className="font-medium">{event.rename?.to}</span>
        </span>
      );
    case "head_ref_force_pushed":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> force-pushed the branch</span>
        </span>
      );
    case "base_ref_force_pushed":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> force-pushed the base branch</span>
        </span>
      );
    case "referenced":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> referenced this in </span>
          {event.source && (
            <span className="font-medium">
              #{event.source.number}
            </span>
          )}
        </span>
      );
    case "cross-referenced":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> mentioned this in </span>
          {event.source && (
            <span className="font-medium">
              #{event.source.number} {event.source.title}
            </span>
          )}
        </span>
      );
    case "milestoned":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> added this to the </span>
          <span className="font-medium">{event.milestone?.title}</span>
          <span> milestone</span>
        </span>
      );
    case "demilestoned":
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> removed this from the </span>
          <span className="font-medium">{event.milestone?.title}</span>
          <span> milestone</span>
        </span>
      );
    default:
      return (
        <span>
          <span className="font-medium">{actorName}</span>
          <span> performed an action</span>
        </span>
      );
  }
}

const TimelineEventItem = memo(function TimelineEventItem({ event }: TimelineItemProps) {
  // Use review state icon for reviewed events
  const iconInfo =
    event.type === "reviewed"
      ? getReviewStateIcon(event.reviewState)
      : getEventIcon(event.type);
  const Icon = iconInfo.icon;

  return (
    <div className="flex items-start gap-3 py-2">
      <div className={`mt-0.5 ${iconInfo.color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-fg-muted flex-wrap">
          {getEventDescription(event)}
          <span className="text-xs">{formatRelativeTime(event.createdAt)}</span>
        </div>
        {/* Show review body if present */}
        {event.type === "reviewed" && event.reviewBody && (
          <div className="mt-2 pl-0 text-sm">
            <MarkdownViewer content={event.reviewBody} />
          </div>
        )}
      </div>
    </div>
  );
});

const CommentItem = memo(function CommentItem({ comment }: { comment: PRComment }) {
  return (
    <div className="py-3">
      <div className="flex items-start gap-3">
        <Avatar src={comment.user.avatarUrl} alt={comment.user.login} size={32} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-fg">{comment.user.login}</span>
            <span className="text-xs text-fg-muted">{formatRelativeTime(comment.createdAt)}</span>
          </div>
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
    <div className="bg-bg-secondary rounded-xl border border-border overflow-hidden">
      <div className="flex items-center gap-2 text-fg-muted p-4 border-b border-border">
        <MessageSquare size={16} />
        <h2 className="text-sm font-medium">Activity</h2>
        <span className="text-xs bg-bg-tertiary px-1.5 py-0.5 rounded-full">{items.length}</span>
      </div>

      <div className="divide-y divide-border">
        {items.map((item, index) =>
          item.type === "comment" ? (
            <div key={`comment-${item.data.id}`} className="px-4">
              <CommentItem comment={item.data} />
            </div>
          ) : (
            <div key={`event-${item.data.id}-${index}`} className="px-4">
              <TimelineEventItem event={item.data} />
            </div>
          ),
        )}
      </div>
    </div>
  );
});
