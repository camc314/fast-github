import { Link } from "@tanstack/react-router";
import { FileCode, GitCommit, LayoutDashboard } from "lucide-react";

export type PRTab = "overview" | "files" | "commits";

interface PRDetailTabsProps {
  owner: string;
  repo: string;
  number: string;
  activeTab: PRTab;
  filesCount: number;
  commitsCount: number;
}

export function PRDetailTabs({
  owner,
  repo,
  number,
  activeTab,
  filesCount,
  commitsCount,
}: PRDetailTabsProps) {
  const tabs = [
    {
      id: "overview" as PRTab,
      label: "Overview",
      icon: <LayoutDashboard size={16} />,
    },
    {
      id: "files" as PRTab,
      label: "Files",
      icon: <FileCode size={16} />,
      count: filesCount,
    },
    {
      id: "commits" as PRTab,
      label: "Commits",
      icon: <GitCommit size={16} />,
      count: commitsCount,
    },
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-bg-tertiary rounded-lg mb-6 w-fit">
      {tabs.map((tab) => (
        <Link
          key={tab.id}
          to="/$owner/$repo/pull/$number"
          params={{ owner, repo, number }}
          search={{ tab: tab.id }}
          className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${
            activeTab === tab.id
              ? "bg-bg-secondary text-fg shadow-sm"
              : "text-fg-secondary hover:text-fg"
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.count !== undefined && (
            <span
              className={`px-1.5 py-0.5 text-xs rounded-full ${
                activeTab === tab.id ? "bg-bg-tertiary" : "bg-border"
              }`}
            >
              {tab.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
