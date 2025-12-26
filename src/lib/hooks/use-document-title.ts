import { useEffect } from "react";

const BASE_TITLE = "Fast GitHub";

/**
 * Hook to set the document title.
 * Automatically resets to base title on unmount.
 */
export function useDocumentTitle(title: string | undefined) {
  useEffect(() => {
    const previousTitle = document.title;

    if (title) {
      document.title = `${title} · ${BASE_TITLE}`;
    } else {
      document.title = BASE_TITLE;
    }

    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}
