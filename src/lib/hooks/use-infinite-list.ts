import { useInfiniteQuery, useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchPullRequestsPaginated,
  fetchIssuesPaginated,
  searchPullRequests,
  searchIssues,
  fetchRepoLabels,
  fetchRepoContributors,
} from "@/lib/api/github";
import type {
  SortField,
  SortDirection,
  ListState,
  InfinitePRListResponse,
  InfiniteIssueListResponse,
  Label,
  User,
} from "@/lib/types/github";

const PER_PAGE = 30;

interface UseInfiniteListOptions {
  owner: string;
  repo: string;
  state: ListState;
  sort: SortField;
  direction: SortDirection;
  query?: string;
  author?: string;
  label?: string;
  assignee?: string;
}

// Check if any filters are active (requiring search API)
function hasFilters(options: UseInfiniteListOptions): boolean {
  return !!(options.query || options.author || options.label || options.assignee);
}

export function useInfinitePRList(options: UseInfiniteListOptions) {
  const { owner, repo, state, sort, direction, query, author, label, assignee } = options;

  return useInfiniteQuery<InfinitePRListResponse>({
    queryKey: [
      "pull-requests-infinite",
      owner,
      repo,
      { state, sort, direction, query, author, label, assignee },
    ],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      if (hasFilters(options)) {
        return searchPullRequests(owner, repo, {
          state,
          sort,
          direction,
          query,
          author,
          label,
          assignee,
          page,
          perPage: PER_PAGE,
        });
      }
      return fetchPullRequestsPaginated(owner, repo, {
        state,
        sort,
        direction,
        page,
        perPage: PER_PAGE,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
  });
}

export function useInfiniteIssueList(options: UseInfiniteListOptions) {
  const { owner, repo, state, sort, direction, query, author, label, assignee } = options;

  return useInfiniteQuery<InfiniteIssueListResponse>({
    queryKey: [
      "issues-infinite",
      owner,
      repo,
      { state, sort, direction, query, author, label, assignee },
    ],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      if (hasFilters(options)) {
        return searchIssues(owner, repo, {
          state,
          sort,
          direction,
          query,
          author,
          label,
          assignee,
          page,
          perPage: PER_PAGE,
        });
      }
      return fetchIssuesPaginated(owner, repo, {
        state,
        sort,
        direction,
        page,
        perPage: PER_PAGE,
      });
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.hasNextPage ? lastPage.pagination.page + 1 : undefined,
    initialPageParam: 1,
    placeholderData: keepPreviousData,
  });
}

// Hook to fetch repository labels for filter dropdown
export function useRepoLabels(owner: string, repo: string) {
  return useQuery<Label[]>({
    queryKey: ["repo-labels", owner, repo],
    queryFn: () => fetchRepoLabels(owner, repo),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

// Hook to fetch repository contributors for filter dropdown
export function useRepoContributors(owner: string, repo: string) {
  return useQuery<User[]>({
    queryKey: ["repo-contributors", owner, repo],
    queryFn: () => fetchRepoContributors(owner, repo),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}
