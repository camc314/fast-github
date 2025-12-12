import type { components } from "@octokit/openapi-types";
import type {
  PRListParams,
  PRListResponse,
  PullRequest,
  PRState,
  CheckStatus,
} from "../types/github";

const GITHUB_API = "https://api.github.com";

// Use official GitHub OpenAPI types
type GitHubPullRequestSimple = components["schemas"]["pull-request-simple"];
type GitHubPullRequestFull = components["schemas"]["pull-request"];

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
    labels: pr.labels.map((label) => {
      // Handle both string labels and object labels
      if (typeof label === "string") {
        return { id: 0, name: label, color: "000000" };
      }
      return {
        id: label.id ?? 0,
        name: label.name ?? "",
        color: label.color ?? "000000",
        description: label.description ?? undefined,
      };
    }),
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    closedAt: pr.closed_at,
    mergedAt: pr.merged_at,
    comments: 0, // Not available in list endpoint
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
    labels: pr.labels.map((label) => {
      if (typeof label === "string") {
        return { id: 0, name: label, color: "000000" };
      }
      return {
        id: label.id ?? 0,
        name: label.name ?? "",
        color: label.color ?? "000000",
        description: label.description ?? undefined,
      };
    }),
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

  // Get counts from separate requests (cached)
  const [openCount, closedCount] = await Promise.all([
    fetchPRCount(owner, repo, "open"),
    fetchPRCount(owner, repo, "closed"),
  ]);

  return {
    pullRequests,
    totalCount:
      state === "open" ? openCount : state === "closed" ? closedCount : openCount + closedCount,
    openCount,
    closedCount,
  };
}

// Cache for PR counts to avoid repeated requests
const countCache = new Map<string, { count: number; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

async function fetchPRCount(
  owner: string,
  repo: string,
  state: "open" | "closed",
): Promise<number> {
  const cacheKey = `${owner}/${repo}/${state}`;
  const cached = countCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.count;
  }

  const url = `${GITHUB_API}/search/issues?q=repo:${owner}/${repo}+type:pr+state:${state}&per_page=1`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      return cached?.count ?? 0;
    }

    const data = await response.json();
    const count = data.total_count ?? 0;

    countCache.set(cacheKey, { count, timestamp: Date.now() });
    return count;
  } catch {
    return cached?.count ?? 0;
  }
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
