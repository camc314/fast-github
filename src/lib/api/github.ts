import type {
  GitHubPullRequestSimple,
  GitHubPullRequestFull,
  GitHubIssue,
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
} from "../types/github";

const GITHUB_API = "https://api.github.com";

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
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
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
): Promise<PullRequest | null> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/pulls/${number}`;
    const data = await githubFetch<GitHubPullRequestFull>(url);
    return transformFullPullRequest(data);
  } catch {
    return null;
  }
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

export async function fetchIssue(
  owner: string,
  repo: string,
  number: number,
): Promise<Issue | null> {
  try {
    const url = `${GITHUB_API}/repos/${owner}/${repo}/issues/${number}`;
    const data = await githubFetch<GitHubIssue>(url);
    return transformIssue(data);
  } catch {
    return null;
  }
}
