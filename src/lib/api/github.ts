import type {
  GitHubIssue,
  GitHubIssueComment,
  GitHubPullRequestSimple,
  GitHubPullRequestFull,
  GitHubPRFile,
  GitHubPRCommit,
  PRListParams,
  PRListResponse,
  PullRequest,
  PRState,
  CheckStatus,
  IssueListParams,
  IssueListResponse,
  Issue,
  IssueState,
  Label,
  PRFile,
  PRFileStatus,
  PRCommit,
  PRComment,
  PRReview,
  ReviewState,
  CheckRun,
  ChecksSummary,
  User,
  PRReviewComment,
  SortField,
  SortDirection,
  ListState,
  InfinitePRListResponse,
  InfiniteIssueListResponse,
  PaginationInfo,
  Repository,
  RepositoryReadme,
  LanguageBreakdown,
} from "../types/github";

const GITHUB_API = "https://api.github.com";

// Custom error class for GitHub API errors
export class GitHubError extends Error {
  status: number;
  statusText: string;
  isRateLimit: boolean;
  rateLimitReset: Date | null;
  isNotFound: boolean;

  constructor(status: number, statusText: string, rateLimitReset: string | null = null) {
    let message = `GitHub API error: ${status} ${statusText}`;
    const isRateLimit = status === 403 || status === 429;
    const isNotFound = status === 404;

    if (isRateLimit) {
      message = "GitHub API rate limit exceeded";
      if (rateLimitReset) {
        const resetDate = new Date(parseInt(rateLimitReset) * 1000);
        message += `. Resets at ${resetDate.toLocaleTimeString()}`;
      }
    } else if (isNotFound) {
      message = "Resource not found";
    }

    super(message);
    this.name = "GitHubError";
    this.status = status;
    this.statusText = statusText;
    this.isRateLimit = isRateLimit;
    this.isNotFound = isNotFound;
    this.rateLimitReset = rateLimitReset ? new Date(parseInt(rateLimitReset) * 1000) : null;
  }
}

// Helper to transform labels (handles both string and object labels)
function transformLabels(
  labels: (string | { id?: number; name?: string; color?: string; description?: string | null })[],
): Label[] {
  return labels.map((label) => {
    if (typeof label === "string") {
      return { id: 0, name: label, color: "000000" };
    }
    return {
      id: label.id ?? 0,
      name: label.name ?? "",
      color: label.color ?? "000000",
      description: label.description ?? undefined,
    };
  });
}

// Helper to transform users array
function transformUsers(
  users: { login?: string; avatar_url?: string }[] | null | undefined,
): User[] {
  if (!users) return [];
  return users.map((u) => ({
    login: u.login ?? "unknown",
    avatarUrl: u.avatar_url ?? "",
  }));
}

// Transform GitHub API response to our types
function transformPullRequest(pr: GitHubPullRequestSimple): PullRequest {
  let state: PRState = pr.state as PRState;
  if (pr.merged_at) {
    state = "merged";
  }

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state,
    user: {
      login: pr.user?.login ?? "unknown",
      avatarUrl: pr.user?.avatar_url ?? "",
    },
    labels: transformLabels(pr.labels),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    comments: 0,
    checkStatus: "none" as CheckStatus,
    draft: pr.draft ?? false,
    body: pr.body ?? "",
    assignees: transformUsers(pr.assignees),
    requestedReviewers: transformUsers(pr.requested_reviewers),
    headSha: pr.head.sha,
  };
}

function transformFullPullRequest(pr: GitHubPullRequestFull): PullRequest {
  let state: PRState = pr.state as PRState;
  if (pr.merged_at) {
    state = "merged";
  }

  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    state,
    user: {
      login: pr.user?.login ?? "unknown",
      avatarUrl: pr.user?.avatar_url ?? "",
    },
    labels: transformLabels(pr.labels),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    comments: pr.comments,
    checkStatus: "none" as CheckStatus,
    draft: pr.draft ?? false,
    body: pr.body ?? "",
    assignees: transformUsers(pr.assignees),
    requestedReviewers: transformUsers(pr.requested_reviewers),
    headSha: pr.head.sha,
  };
}

function transformIssue(issue: GitHubIssue): Issue {
  return {
    id: issue.id,
    number: issue.number,
    title: issue.title,
    state: issue.state as IssueState,
    user: {
      login: issue.user?.login ?? "unknown",
      avatarUrl: issue.user?.avatar_url ?? "",
    },
    labels: transformLabels(issue.labels as Parameters<typeof transformLabels>[0]),
    assignees: transformUsers(issue.assignees),
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    closedAt: issue.closed_at,
    comments: issue.comments,
    body: issue.body ?? "",
  };
}

// Fetch with error handling
async function githubFetch<T>(url: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    throw new GitHubError(response.status, response.statusText, rateLimitReset);
  }

  return response.json();
}

// Cache for counts to avoid repeated requests
const countCache = new Map<string, { openCount: number; closedCount: number; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

interface SearchResponse {
  total_count: number;
}

async function fetchCounts(
  owner: string,
  repo: string,
  type: "pr" | "issue",
): Promise<{ openCount: number; closedCount: number }> {
  const cacheKey = `${owner}/${repo}/${type}`;
  const cached = countCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return { openCount: cached.openCount, closedCount: cached.closedCount };
  }

  const baseQuery = `repo:${owner}/${repo}+type:${type}`;

  try {
    const [openRes, closedRes] = await Promise.all([
      fetch(`${GITHUB_API}/search/issues?q=${baseQuery}+state:open&per_page=1`, {
        headers: { Accept: "application/vnd.github.v3+json" },
      }),
      fetch(`${GITHUB_API}/search/issues?q=${baseQuery}+state:closed&per_page=1`, {
        headers: { Accept: "application/vnd.github.v3+json" },
      }),
    ]);

    let openCount = cached?.openCount ?? 0;
    let closedCount = cached?.closedCount ?? 0;

    if (openRes.ok) {
      const data: SearchResponse = await openRes.json();
      openCount = data.total_count ?? 0;
    }

    if (closedRes.ok) {
      const data: SearchResponse = await closedRes.json();
      closedCount = data.total_count ?? 0;
    }

    // Only cache if we got at least one successful response
    if (openRes.ok || closedRes.ok) {
      countCache.set(cacheKey, { openCount, closedCount, timestamp: Date.now() });
    }

    return { openCount, closedCount };
  } catch {
    return { openCount: cached?.openCount ?? 0, closedCount: cached?.closedCount ?? 0 };
  }
}

// Pull Requests API
export async function fetchPullRequests(
  owner: string,
  repo: string,
  params: PRListParams,
): Promise<PRListResponse> {
  const state = params.state === "all" ? "all" : params.state;
  const sort = params.sort === "comments" ? "popularity" : params.sort;
  const direction = params.direction;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&sort=${sort}&direction=${direction}&per_page=${params.perPage}&page=${params.page}`;

  const data = await githubFetch<GitHubPullRequestSimple[]>(url);
  const pullRequests = data.map(transformPullRequest);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "pr");

  return {
    pullRequests,
    totalCount:
      state === "open" ? openCount : state === "closed" ? closedCount : openCount + closedCount,
    openCount,
    closedCount,
  };
}

export async function fetchPullRequest(
  owner: string,
  repo: string,
  number: number,
): Promise<PullRequest> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`;
  const data = await githubFetch<GitHubPullRequestFull>(url);
  return transformFullPullRequest(data);
}

// Issues API
export async function fetchIssues(
  owner: string,
  repo: string,
  params: IssueListParams,
): Promise<IssueListResponse> {
  const state = params.state === "all" ? "all" : params.state;
  const sort = params.sort;
  const direction = params.direction;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=${state}&sort=${sort}&direction=${direction}&per_page=${params.perPage}&page=${params.page}`;

  const data = await githubFetch<GitHubIssue[]>(url);
  // Filter out pull requests (GitHub API returns PRs in issues endpoint)
  const issues = data.filter((issue) => !issue.pull_request).map(transformIssue);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "issue");

  return {
    issues,
    totalCount:
      state === "open" ? openCount : state === "closed" ? closedCount : openCount + closedCount,
    openCount,
    closedCount,
  };
}

export async function fetchIssue(owner: string, repo: string, number: number): Promise<Issue> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${number}`;
  const data = await githubFetch<GitHubIssue>(url);
  return transformIssue(data);
}

export async function fetchIssueComments(
  owner: string,
  repo: string,
  number: number,
): Promise<PRComment[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${number}/comments?per_page=100`;
  const data = await githubFetch<GitHubIssueComment[]>(url);

  return data.map((comment) => ({
    id: comment.id,
    body: comment.body ?? "",
    user: {
      login: comment.user?.login ?? "unknown",
      avatarUrl: comment.user?.avatar_url ?? "",
    },
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }));
}

export async function createIssueComment(
  owner: string,
  repo: string,
  issueNumber: number,
  body: string,
): Promise<PRComment> {
  // TODO: Add authentication header when implementing auth
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || "";
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in to comment.");
    }
    if (response.status === 403) {
      throw new Error(errorMessage || "You do not have permission to comment on this issue");
    }
    if (response.status === 404) {
      throw new Error("Issue not found");
    }
    if (response.status === 422) {
      throw new Error(errorMessage || "Comment body is invalid");
    }
    throw new Error(errorMessage || `Failed to create comment: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    id: data.id,
    body: data.body ?? "",
    user: {
      login: data.user?.login ?? "unknown",
      avatarUrl: data.user?.avatar_url ?? "",
    },
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// PR Detail API
export async function fetchPRFiles(owner: string, repo: string, number: number): Promise<PRFile[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`;
  const data = await githubFetch<GitHubPRFile[]>(url);

  return data.map((file) => ({
    sha: file.sha ?? "",
    filename: file.filename,
    status: file.status as PRFileStatus,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
    patch: file.patch,
  }));
}

export async function fetchPRCommits(
  owner: string,
  repo: string,
  number: number,
): Promise<PRCommit[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/commits?per_page=100`;
  const data = await githubFetch<GitHubPRCommit[]>(url);

  return data.map((commit) => ({
    sha: commit.sha,
    message: commit.commit.message,
    author: {
      name: commit.commit.author?.name ?? "Unknown",
      email: commit.commit.author?.email ?? "",
      date: commit.commit.author?.date ?? "",
    },
    committer: {
      name: commit.commit.committer?.name ?? "Unknown",
      date: commit.commit.committer?.date ?? "",
    },
    user: commit.author
      ? {
          login: commit.author.login,
          avatarUrl: commit.author.avatar_url,
        }
      : null,
  }));
}

export async function fetchPRComments(
  owner: string,
  repo: string,
  number: number,
): Promise<PRComment[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${number}/comments?per_page=100`;
  const data = await githubFetch<GitHubIssueComment[]>(url);

  return data.map((comment) => ({
    id: comment.id,
    body: comment.body ?? "",
    user: {
      login: comment.user?.login ?? "unknown",
      avatarUrl: comment.user?.avatar_url ?? "",
    },
    createdAt: comment.created_at,
    updatedAt: comment.updated_at,
  }));
}

// PR Reviews API
interface GitHubReview {
  id: number;
  user: { login: string; avatar_url: string } | null;
  state: string;
  submitted_at: string | null;
}

export async function fetchPRReviews(
  owner: string,
  repo: string,
  number: number,
): Promise<PRReview[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/reviews`;
  const data = await githubFetch<GitHubReview[]>(url);

  return data.map((review) => ({
    id: review.id,
    user: {
      login: review.user?.login ?? "unknown",
      avatarUrl: review.user?.avatar_url ?? "",
    },
    state: review.state as ReviewState,
    submittedAt: review.submitted_at,
  }));
}

// Check Runs API
interface GitHubCheckRun {
  id: number;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "skipped"
    | "timed_out"
    | "action_required"
    | null;
  html_url: string;
}

interface GitHubCheckRunsResponse {
  total_count: number;
  check_runs: GitHubCheckRun[];
}

export async function fetchPRChecks(
  owner: string,
  repo: string,
  ref: string,
): Promise<ChecksSummary> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/commits/${ref}/check-runs?per_page=100`;

  try {
    const data = await githubFetch<GitHubCheckRunsResponse>(url);

    const checks: CheckRun[] = data.check_runs.map((run) => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      htmlUrl: run.html_url,
    }));

    const success = checks.filter(
      (c) => c.status === "completed" && c.conclusion === "success",
    ).length;
    const failure = checks.filter(
      (c) =>
        c.status === "completed" && (c.conclusion === "failure" || c.conclusion === "timed_out"),
    ).length;
    const pending = checks.filter(
      (c) => c.status === "queued" || c.status === "in_progress",
    ).length;

    return {
      total: data.total_count,
      success,
      failure,
      pending,
      checks,
    };
  } catch {
    return { total: 0, success: 0, failure: 0, pending: 0, checks: [] };
  }
}

// PR Review Comments API (inline/diff comments)
interface GitHubPRReviewComment {
  id: number;
  body: string;
  user: { login: string; avatar_url: string } | null;
  path: string;
  line: number | null;
  original_line: number | null;
  side: "LEFT" | "RIGHT";
  created_at: string;
  updated_at: string;
  in_reply_to_id?: number;
}

export async function fetchPRReviewComments(
  owner: string,
  repo: string,
  number: number,
): Promise<PRReviewComment[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}/comments?per_page=100`;
  const data = await githubFetch<GitHubPRReviewComment[]>(url);

  // Transform and group by thread (in_reply_to_id)
  const commentsMap = new Map<number, PRReviewComment>();
  const replies: GitHubPRReviewComment[] = [];

  // First pass: create all top-level comments
  for (const comment of data) {
    if (!comment.in_reply_to_id) {
      commentsMap.set(comment.id, {
        id: comment.id,
        body: comment.body,
        user: {
          login: comment.user?.login ?? "unknown",
          avatarUrl: comment.user?.avatar_url ?? "",
        },
        path: comment.path,
        line: comment.line,
        originalLine: comment.original_line,
        side: comment.side,
        createdAt: comment.created_at,
        updatedAt: comment.updated_at,
        inReplyToId: null,
        replies: [],
      });
    } else {
      replies.push(comment);
    }
  }

  // Second pass: attach replies to their parent comments
  for (const reply of replies) {
    const parent = commentsMap.get(reply.in_reply_to_id!);
    if (parent) {
      parent.replies!.push({
        id: reply.id,
        body: reply.body,
        user: {
          login: reply.user?.login ?? "unknown",
          avatarUrl: reply.user?.avatar_url ?? "",
        },
        path: reply.path,
        line: reply.line,
        originalLine: reply.original_line,
        side: reply.side,
        createdAt: reply.created_at,
        updatedAt: reply.updated_at,
        inReplyToId: reply.in_reply_to_id ?? null,
        replies: [], // Replies don't have nested replies
      });
    }
  }

  return Array.from(commentsMap.values());
}

/**
 * Create a new review comment on a PR diff line.
 * Requires authentication.
 */
export async function createPRReviewComment(
  owner: string,
  repo: string,
  pullNumber: number,
  params: {
    body: string;
    path: string;
    line: number;
    side: "LEFT" | "RIGHT";
    commitId: string;
  },
): Promise<PRReviewComment> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/comments`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({
        body: params.body,
        path: params.path,
        line: params.line,
        side: params.side,
        commit_id: params.commitId,
      }),
    },
  );

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || "";
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in to comment.");
    }
    if (response.status === 403) {
      throw new Error(errorMessage || "You do not have permission to comment on this pull request");
    }
    if (response.status === 404) {
      throw new Error("Pull request not found");
    }
    if (response.status === 422) {
      throw new Error(errorMessage || "Invalid comment. The line may not exist in the diff.");
    }
    throw new Error(errorMessage || `Failed to create comment: ${response.statusText}`);
  }

  const data: GitHubPRReviewComment = await response.json();

  return {
    id: data.id,
    body: data.body,
    user: {
      login: data.user?.login ?? "unknown",
      avatarUrl: data.user?.avatar_url ?? "",
    },
    path: data.path,
    line: data.line,
    originalLine: data.original_line,
    side: data.side,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    inReplyToId: null,
    replies: [],
  };
}

/**
 * Reply to an existing review comment on a PR.
 * Requires authentication.
 */
export async function replyToPRReviewComment(
  owner: string,
  repo: string,
  pullNumber: number,
  commentId: number,
  body: string,
): Promise<PRReviewComment> {
  const response = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/pulls/${pullNumber}/comments/${commentId}/replies`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/vnd.github.v3+json",
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || "";
    } catch {
      // Ignore JSON parse errors
    }

    if (response.status === 401) {
      throw new Error("Authentication required. Please sign in to reply.");
    }
    if (response.status === 403) {
      throw new Error(errorMessage || "You do not have permission to reply on this pull request");
    }
    if (response.status === 404) {
      throw new Error("Comment not found");
    }
    throw new Error(errorMessage || `Failed to reply: ${response.statusText}`);
  }

  const data: GitHubPRReviewComment = await response.json();

  return {
    id: data.id,
    body: data.body,
    user: {
      login: data.user?.login ?? "unknown",
      avatarUrl: data.user?.avatar_url ?? "",
    },
    path: data.path,
    line: data.line,
    originalLine: data.original_line,
    side: data.side,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    inReplyToId: data.in_reply_to_id ?? null,
    replies: [],
  };
}

// ============================================================================
// Infinite Scroll / Search API Functions
// ============================================================================

// Parse Link header for pagination info
function parseLinkHeader(linkHeader: string | null): { hasNextPage: boolean } {
  if (!linkHeader) return { hasNextPage: false };
  return { hasNextPage: linkHeader.includes('rel="next"') };
}

// GitHub Search API response type
interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: GitHubIssue[];
}

// Fetch with pagination info
async function githubFetchWithPagination<T>(
  url: string,
): Promise<{ data: T; hasNextPage: boolean }> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (!response.ok) {
    const rateLimitReset = response.headers.get("x-ratelimit-reset");
    throw new GitHubError(response.status, response.statusText, rateLimitReset);
  }

  const linkHeader = response.headers.get("Link");
  const { hasNextPage } = parseLinkHeader(linkHeader);
  const data = await response.json();

  return { data, hasNextPage };
}

// Transform search result item to PullRequest
function transformSearchResultToPR(item: GitHubIssue): PullRequest {
  const isMerged = item.state === "closed" && item.pull_request?.merged_at;
  let state: PRState = item.state as PRState;
  if (isMerged) {
    state = "merged";
  }

  return {
    id: item.id,
    number: item.number,
    title: item.title,
    state,
    user: {
      login: item.user?.login ?? "unknown",
      avatarUrl: item.user?.avatar_url ?? "",
    },
    labels: transformLabels(item.labels as Parameters<typeof transformLabels>[0]),
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    closedAt: item.closed_at,
    mergedAt: item.pull_request?.merged_at ?? null,
    comments: item.comments,
    checkStatus: "none" as CheckStatus,
    draft: item.draft ?? false,
    body: item.body ?? "",
    assignees: transformUsers(item.assignees),
    requestedReviewers: [],
    headSha: "",
  };
}

// Paginated PR fetch (for infinite scroll without search)
export async function fetchPullRequestsPaginated(
  owner: string,
  repo: string,
  params: {
    state: ListState;
    sort: SortField;
    direction: SortDirection;
    page: number;
    perPage: number;
  },
): Promise<InfinitePRListResponse> {
  const state = params.state === "all" ? "all" : params.state;
  const sort = params.sort === "comments" ? "popularity" : params.sort;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls?state=${state}&sort=${sort}&direction=${params.direction}&per_page=${params.perPage}&page=${params.page}`;

  const { data, hasNextPage } = await githubFetchWithPagination<GitHubPullRequestSimple[]>(url);
  const pullRequests = data.map(transformPullRequest);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "pr");

  const pagination: PaginationInfo = {
    page: params.page,
    perPage: params.perPage,
    hasNextPage,
  };

  return {
    pullRequests,
    pagination,
    openCount,
    closedCount,
  };
}

// Paginated Issue fetch (for infinite scroll without search)
export async function fetchIssuesPaginated(
  owner: string,
  repo: string,
  params: {
    state: ListState;
    sort: SortField;
    direction: SortDirection;
    page: number;
    perPage: number;
  },
): Promise<InfiniteIssueListResponse> {
  const state = params.state === "all" ? "all" : params.state;

  const url = `${GITHUB_API}/repos/${owner}/${repo}/issues?state=${state}&sort=${params.sort}&direction=${params.direction}&per_page=${params.perPage}&page=${params.page}`;

  const { data, hasNextPage } = await githubFetchWithPagination<GitHubIssue[]>(url);
  // Filter out pull requests (GitHub API returns PRs in issues endpoint)
  const issues = data.filter((issue) => !issue.pull_request).map(transformIssue);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "issue");

  const pagination: PaginationInfo = {
    page: params.page,
    perPage: params.perPage,
    hasNextPage,
  };

  return {
    issues,
    pagination,
    openCount,
    closedCount,
  };
}

// Search PRs using GitHub Search API
export async function searchPullRequests(
  owner: string,
  repo: string,
  params: {
    state: ListState;
    sort: SortField;
    direction: SortDirection;
    query?: string;
    author?: string;
    label?: string;
    assignee?: string;
    page: number;
    perPage: number;
  },
): Promise<InfinitePRListResponse> {
  // Build search query
  const queryParts = [
    `repo:${owner}/${repo}`,
    "type:pr",
    params.state !== "all" ? `state:${params.state}` : "",
    params.author ? `author:${params.author}` : "",
    params.label ? `label:"${params.label}"` : "",
    params.assignee ? `assignee:${params.assignee}` : "",
    params.query || "",
  ].filter(Boolean);

  const q = encodeURIComponent(queryParts.join(" "));
  const sortParam = params.sort === "comments" ? "comments" : params.sort;

  const url = `${GITHUB_API}/search/issues?q=${q}&sort=${sortParam}&order=${params.direction}&per_page=${params.perPage}&page=${params.page}`;

  const { data, hasNextPage } = await githubFetchWithPagination<GitHubSearchResponse>(url);

  // Transform search results to PullRequest type
  const pullRequests = data.items.map(transformSearchResultToPR);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "pr");

  const pagination: PaginationInfo = {
    page: params.page,
    perPage: params.perPage,
    hasNextPage,
  };

  return {
    pullRequests,
    pagination,
    openCount,
    closedCount,
  };
}

// Search Issues using GitHub Search API
export async function searchIssues(
  owner: string,
  repo: string,
  params: {
    state: ListState;
    sort: SortField;
    direction: SortDirection;
    query?: string;
    author?: string;
    label?: string;
    assignee?: string;
    page: number;
    perPage: number;
  },
): Promise<InfiniteIssueListResponse> {
  // Build search query - exclude PRs
  const queryParts = [
    `repo:${owner}/${repo}`,
    "type:issue",
    params.state !== "all" ? `state:${params.state}` : "",
    params.author ? `author:${params.author}` : "",
    params.label ? `label:"${params.label}"` : "",
    params.assignee ? `assignee:${params.assignee}` : "",
    params.query || "",
  ].filter(Boolean);

  const q = encodeURIComponent(queryParts.join(" "));
  const sortParam = params.sort === "comments" ? "comments" : params.sort;

  const url = `${GITHUB_API}/search/issues?q=${q}&sort=${sortParam}&order=${params.direction}&per_page=${params.perPage}&page=${params.page}`;

  const { data, hasNextPage } = await githubFetchWithPagination<GitHubSearchResponse>(url);

  // Transform search results to Issue type
  const issues = data.items.map(transformIssue);

  const { openCount, closedCount } = await fetchCounts(owner, repo, "issue");

  const pagination: PaginationInfo = {
    page: params.page,
    perPage: params.perPage,
    hasNextPage,
  };

  return {
    issues,
    pagination,
    openCount,
    closedCount,
  };
}

// ============================================================================
// Repository Metadata API (for filter dropdowns)
// ============================================================================

// Fetch repository labels
export async function fetchRepoLabels(owner: string, repo: string): Promise<Label[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/labels?per_page=100`;
  const data =
    await githubFetch<Array<{ id: number; name: string; color: string; description?: string }>>(
      url,
    );

  return data.map((label) => ({
    id: label.id,
    name: label.name,
    color: label.color,
    description: label.description,
  }));
}

// Fetch repository contributors (for author/assignee filters)
export async function fetchRepoContributors(owner: string, repo: string): Promise<User[]> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/contributors?per_page=50`;

  try {
    const data = await githubFetch<Array<{ login: string; avatar_url: string }>>(url);
    return data.map((user) => ({
      login: user.login,
      avatarUrl: user.avatar_url,
    }));
  } catch {
    // Contributors endpoint might fail for some repos, return empty array
    return [];
  }
}

// ============================================================================
// Repository Home Page API Functions
// ============================================================================

interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  topics: string[];
  language: string | null;
  license: { name: string; spdx_id: string | null } | null;
  default_branch: string;
  homepage: string | null;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  private: boolean;
  fork: boolean;
  owner: { login: string; avatar_url: string };
}

export async function fetchRepository(owner: string, repo: string): Promise<Repository> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}`;
  const data = await githubFetch<GitHubRepository>(url);

  return {
    id: data.id,
    name: data.name,
    fullName: data.full_name,
    description: data.description,
    stars: data.stargazers_count,
    forks: data.forks_count,
    watchers: data.watchers_count,
    openIssuesCount: data.open_issues_count,
    topics: data.topics ?? [],
    language: data.language,
    license: data.license ? { name: data.license.name, spdxId: data.license.spdx_id } : null,
    defaultBranch: data.default_branch,
    homepage: data.homepage,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    pushedAt: data.pushed_at,
    isPrivate: data.private,
    isFork: data.fork,
    owner: {
      login: data.owner.login,
      avatarUrl: data.owner.avatar_url,
    },
  };
}

interface GitHubReadmeResponse {
  content: string;
  encoding: string;
  name: string;
  path: string;
}

export async function fetchReadme(owner: string, repo: string): Promise<RepositoryReadme | null> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/readme`;

  try {
    const data = await githubFetch<GitHubReadmeResponse>(url);

    // Decode base64 content (handle UTF-8 properly)
    const base64 = data.content.replace(/\n/g, "");
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const content = new TextDecoder("utf-8").decode(bytes);

    return {
      content,
      name: data.name,
      path: data.path,
    };
  } catch (error) {
    // README might not exist
    if (error instanceof GitHubError && error.isNotFound) {
      return null;
    }
    throw error;
  }
}

export async function fetchLanguages(owner: string, repo: string): Promise<LanguageBreakdown> {
  const url = `${GITHUB_API}/repos/${owner}/${repo}/languages`;

  try {
    const data = await githubFetch<Record<string, number>>(url);
    return data;
  } catch {
    return {};
  }
}
