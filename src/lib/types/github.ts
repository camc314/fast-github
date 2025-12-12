export type PRState = "open" | "closed" | "merged";

export type CheckStatus = "success" | "failure" | "pending" | "none";

export interface User {
  login: string;
  avatarUrl: string;
}

export interface Label {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface PullRequest {
  id: number;
  number: number;
  title: string;
  state: PRState;
  user: User;
  labels: Label[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  mergedAt: string | null;
  comments: number;
  checkStatus: CheckStatus;
  draft: boolean;
  body: string;
}

export interface PRListParams {
  state: "open" | "closed" | "all";
  sort: "created" | "updated" | "comments";
  direction: "asc" | "desc";
  page: number;
  perPage: number;
}

export interface PRListResponse {
  pullRequests: PullRequest[];
  totalCount: number;
  openCount: number;
  closedCount: number;
}

export interface Repository {
  owner: string;
  name: string;
  fullName: string;
  description: string;
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  openPullRequests: number;
}
