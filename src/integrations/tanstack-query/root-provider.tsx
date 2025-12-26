import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GitHubError } from "@/lib/api/github";

export function getContext() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        // Don't retry on rate limit or not found errors
        retry: (failureCount, error) => {
          if (error instanceof GitHubError) {
            // Never retry rate limits or 404s
            if (error.isRateLimit || error.isNotFound) {
              return false;
            }
          }
          // Default: retry up to 3 times for other errors
          return failureCount < 3;
        },
        // Stale time of 1 minute for GitHub data
        staleTime: 60 * 1000,
        // Disable refetch on window focus
        refetchOnWindowFocus: false,
      },
    },
  });
  return {
    queryClient,
  };
}

export function Provider({
  children,
  queryClient,
}: {
  children: React.ReactNode;
  queryClient: QueryClient;
}) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
