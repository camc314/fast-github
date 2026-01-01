import { useState, useEffect } from "react";

/**
 * Hook that returns true if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    // Check if window exists (SSR safety)
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);

    // Update state initially
    setMatches(mediaQuery.matches);

    // Event listener for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", handler);

    return () => {
      mediaQuery.removeEventListener("change", handler);
    };
  }, [query]);

  return matches;
}

/**
 * Predefined breakpoint hooks following Tailwind CSS defaults
 */
export function useIsMobile(): boolean {
  // Mobile: < 768px (below md breakpoint)
  return useMediaQuery("(max-width: 767px)");
}

export function useIsTablet(): boolean {
  // Tablet: >= 768px and < 1024px
  return useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
}

export function useIsDesktop(): boolean {
  // Desktop: >= 1024px
  return useMediaQuery("(min-width: 1024px)");
}

export function useIsSmallScreen(): boolean {
  // Small screen: < 1024px (mobile or tablet)
  return useMediaQuery("(max-width: 1023px)");
}
