import type { components } from "@octokit/openapi-types";

// Re-export GitHub API types directly
export type GitHubUser = components["schemas"]["simple-user"];
export type GitHubLabel = components["schemas"]["label"];
export type GitHubIssue = components["schemas"]["issue"];
export type GitHubIssueFull = components["schemas"]["issue"];
export type GitHubPullRequestSimple = components["schemas"]["pull-request-simple"];
export type GitHubPullRequestFull = components["schemas"]["pull-request"];

// App-specific types
export type PRState = "open" | "closed" | "merged";
export type IssueState = "open" | "closed";
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

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: IssueState;
  user: User;
  labels: Label[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  comments: number;
  body: string;
}

export interface ListParams {
  state: "open" | "closed" | "all";
  sort: "created" | "updated" | "comments";
  direction: "asc" | "desc";
  page: number;
  perPage: number;
}

export type PRListParams = ListParams;
export type IssueListParams = ListParams;

export interface PRListResponse {
  pullRequests: PullRequest[];
  totalCount: number;
  openCount: number;
  closedCount: number;
}

export interface IssueListResponse {
  issues: Issue[];
  totalCount: number;
  openCount: number;
  closedCount: number;
}
