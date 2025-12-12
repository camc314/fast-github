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
  assignees: User[];
  requestedReviewers: User[];
  headSha: string;
}

export interface Issue {
  id: number;
  number: number;
  title: string;
  state: IssueState;
  user: User;
  labels: Label[];
  assignees: User[];
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  comments: number;
  body: string;
}

// Sort configuration
export type SortField = "created" | "updated" | "comments";
export type SortDirection = "asc" | "desc";
export type ListState = "open" | "closed" | "all";

export interface SortOption {
  label: string;
  field: SortField;
  direction: SortDirection;
}

export const SORT_OPTIONS: SortOption[] = [
  { label: "Newest", field: "created", direction: "desc" },
  { label: "Oldest", field: "created", direction: "asc" },
  { label: "Recently updated", field: "updated", direction: "desc" },
  { label: "Least recently updated", field: "updated", direction: "asc" },
  { label: "Most commented", field: "comments", direction: "desc" },
  { label: "Least commented", field: "comments", direction: "asc" },
];

// URL search params (shared between PR and Issue lists)
export interface ListSearchParams {
  state: ListState;
  sort: SortField;
  direction: SortDirection;
  q?: string; // Search query
}

// Legacy list params (for backwards compatibility)
export interface ListParams {
  state: "open" | "closed" | "all";
  sort: "created" | "updated" | "comments";
  direction: "asc" | "desc";
  page: number;
  perPage: number;
}

export type PRListParams = ListParams;
export type IssueListParams = ListParams;

// Pagination metadata
export interface PaginationInfo {
  page: number;
  perPage: number;
  hasNextPage: boolean;
}

// Response type for infinite queries
export interface InfinitePRListResponse {
  pullRequests: PullRequest[];
  pagination: PaginationInfo;
  openCount: number;
  closedCount: number;
}

export interface InfiniteIssueListResponse {
  issues: Issue[];
  pagination: PaginationInfo;
  openCount: number;
  closedCount: number;
}

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

// PR Detail types
export type GitHubPRFile = components["schemas"]["diff-entry"];
export type GitHubPRCommit = components["schemas"]["commit"];
export type GitHubIssueComment = components["schemas"]["issue-comment"];

export type PRFileStatus =
  | "added"
  | "removed"
  | "modified"
  | "renamed"
  | "copied"
  | "changed"
  | "unchanged";

export interface PRFile {
  sha: string;
  filename: string;
  status: PRFileStatus;
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
}

export interface PRCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    date: string;
  };
  user: User | null;
}

export interface PRComment {
  id: number;
  body: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface PRReviewComment {
  id: number;
  body: string;
  user: User;
  path: string;
  line: number | null;
  originalLine: number | null;
  side: "LEFT" | "RIGHT";
  createdAt: string;
  updatedAt: string;
  inReplyToId: number | null;
  replies: PRReviewComment[];
}

// Review types
export type ReviewState = "APPROVED" | "CHANGES_REQUESTED" | "COMMENTED" | "PENDING" | "DISMISSED";

export interface PRReview {
  id: number;
  user: User;
  state: ReviewState;
  submittedAt: string | null;
}

export interface RequestedReviewer {
  login: string;
  avatarUrl: string;
}

// Check run types
export type CheckConclusion =
  | "success"
  | "failure"
  | "neutral"
  | "cancelled"
  | "skipped"
  | "timed_out"
  | "action_required"
  | null;

export type CheckRunStatus = "queued" | "in_progress" | "completed";

export interface CheckRun {
  id: number;
  name: string;
  status: CheckRunStatus;
  conclusion: CheckConclusion;
  htmlUrl: string;
}

export interface ChecksSummary {
  total: number;
  success: number;
  failure: number;
  pending: number;
  checks: CheckRun[];
}

// Diff types
export type DiffLineType = "addition" | "deletion" | "context" | "header";

export interface DiffLine {
  type: DiffLineType;
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}

export interface DiffHunk {
  header: string;
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: DiffLine[];
}

export interface ParsedDiff {
  hunks: DiffHunk[];
  totalAdditions: number;
  totalDeletions: number;
}

// Split diff types (side-by-side view)
export type SplitLineType = "addition" | "deletion" | "context" | "empty";

export interface SplitDiffSide {
  type: SplitLineType;
  content: string;
  lineNumber: number | null;
}

export interface SplitDiffRow {
  left: SplitDiffSide;
  right: SplitDiffSide;
  isHeader?: boolean;
  headerContent?: string;
}
