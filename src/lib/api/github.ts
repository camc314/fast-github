import type {
  GitHubPullRequestSimple,
  GitHubPullRequestFull,
  GitHubIssue,
  GitHubPRFile,
  GitHubPRCommit,
  GitHubIssueComment,
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
      });
    }
  }

  return Array.from(commentsMap.values());
}
