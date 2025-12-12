import { Users, Tag } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import type { Issue, User, Label as LabelType } from "@/lib/types/github";

interface IssueDetailSidebarProps {
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
    <div className="py-4 border-b border-neutral-100 last:border-b-0">
      <div className="flex items-center gap-2 text-xs font-medium text-neutral-500 uppercase tracking-wide mb-3">
        <Icon size={14} />
        {title}
      </div>
      {children}
    </div>
  );
}

function UserList({ users, emptyText }: { users: User[]; emptyText: string }) {
  if (users.length === 0) {
    return <p className="text-sm text-neutral-400">{emptyText}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {users.map((user) => (
        <div key={user.login} className="flex items-center gap-1.5">
          <Avatar src={user.avatarUrl} alt={user.login} size={20} />
          <span className="text-sm text-neutral-700">{user.login}</span>
        </div>
      ))}
    </div>
  );
}

function LabelsSection({ labels }: { labels: LabelType[] }) {
  if (labels.length === 0) {
    return <p className="text-sm text-neutral-400">No labels</p>;
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((label) => (
        <Label key={label.id} label={label} />
      ))}
    </div>
  );
}

export function IssueDetailSidebar({ issue }: IssueDetailSidebarProps) {
  return (
    <aside className="w-64 shrink-0">
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-4">
        <SidebarSection title="Assignees" icon={Users}>
          <UserList users={issue.assignees} emptyText="No assignees" />
        </SidebarSection>

        <SidebarSection title="Labels" icon={Tag}>
          <LabelsSection labels={issue.labels} />
        </SidebarSection>
      </div>
    </aside>
  );
}
