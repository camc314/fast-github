import { useInfiniteQuery, keepPreviousData } from "@tanstack/react-query";
import {
  fetchPullRequestsPaginated,
  fetchIssuesPaginated,
  searchPullRequests,
  searchIssues,
} from "@/lib/api/github";
import type {
  SortField,
  SortDirection,
  ListState,
  InfinitePRListResponse,
  InfiniteIssueListResponse,
} from "@/lib/types/github";

const PER_PAGE = 30;

interface UseInfiniteListOptions {
  type: "pr" | "issue";
  owner: string;
  repo: string;
  state: ListState;
  sort: SortField;
  direction: SortDirection;
  query?: string;
}

export function useInfinitePRList(options: Omit<UseInfiniteListOptions, "type">) {
  const { owner, repo, state, sort, direction, query } = options;

  return useInfiniteQuery<InfinitePRListResponse>({
    queryKey: ["pull-requests-infinite", owner, repo, { state, sort, direction, query }],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      if (query) {
        return searchPullRequests(owner, repo, {
          state,
          sort,
          direction,
          query,
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

export function useInfiniteIssueList(options: Omit<UseInfiniteListOptions, "type">) {
  const { owner, repo, state, sort, direction, query } = options;

  return useInfiniteQuery<InfiniteIssueListResponse>({
    queryKey: ["issues-infinite", owner, repo, { state, sort, direction, query }],
    queryFn: async ({ pageParam }) => {
      const page = pageParam as number;
      if (query) {
        return searchIssues(owner, repo, {
          state,
          sort,
          direction,
          query,
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
