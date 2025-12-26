import type { PullRequest, PRComment, TimelineEvent } from "@/lib/types/github";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";
import { Timeline } from "@/components/ui/timeline";

interface PRDetailOverviewProps {
  pr: PullRequest;
  comments: PRComment[];
  timelineEvents?: TimelineEvent[];
}

function Description({ body }: { body: string }) {
  return (
    <div className="bg-bg-secondary rounded-xl border border-border p-6 mb-6">
      <h2 className="text-sm font-medium text-fg-muted mb-3">Description</h2>
      <MarkdownViewer content={body} />
    </div>
  );
}

export function PRDetailOverview({ pr, comments, timelineEvents = [] }: PRDetailOverviewProps) {
  return (
    <div>
      <Description body={pr.body} />
      <Timeline events={timelineEvents} comments={comments} />
    </div>
  );
}
