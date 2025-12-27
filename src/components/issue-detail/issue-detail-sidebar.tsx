import { Users, Tag } from "lucide-react";
import { AssigneePicker } from "@/components/ui/assignee-picker";
import { LabelPicker } from "@/components/ui/label-picker";
import type { Issue } from "@/lib/types/github";

interface IssueDetailSidebarProps {
  owner: string;
  repo: string;
  issue: Issue;
}

function SidebarSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <div className="flex items-center gap-2 text-xs font-medium text-fg-muted uppercase tracking-wide mb-3">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

export function IssueDetailSidebar({ owner, repo, issue }: IssueDetailSidebarProps) {
  return (
    <aside className="w-full lg:w-64 shrink-0">
      <div className="bg-bg-secondary rounded-xl border border-border shadow-sm p-4">
        <SidebarSection title="Assignees" icon={Users}>
          <AssigneePicker
            owner={owner}
            repo={repo}
            issueNumber={issue.number}
            currentAssignees={issue.assignees}
            queryKeyPrefix="issue"
          />
        </SidebarSection>

        <SidebarSection title="Labels" icon={Tag}>
          <LabelPicker
            owner={owner}
            repo={repo}
            issueNumber={issue.number}
            currentLabels={issue.labels}
            queryKeyPrefix="issue"
          />
        </SidebarSection>
      </div>
    </aside>
  );
}
