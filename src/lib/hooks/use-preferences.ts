import { useSyncExternalStore, useCallback } from "react";
import type { DiffViewMode } from "@/components/diff/diff-viewer";

const STORAGE_KEY = "fast-github-preferences";

interface Preferences {
  diffViewMode: DiffViewMode;
}

const defaultPreferences: Preferences = {
  diffViewMode: "unified",
};

// In-memory cache to avoid repeated JSON parsing
let cachedPreferences: Preferences = defaultPreferences;
let initialized = false;

function getPreferences(): Preferences {
  if (initialized) {
    return cachedPreferences;
  }

  initialized = true;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cachedPreferences = { ...defaultPreferences, ...JSON.parse(stored) };
      return cachedPreferences;
    }
  } catch {
    // Ignore parse errors
  }

  return cachedPreferences;
}

function setPreferences(prefs: Partial<Preferences>): void {
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  cachedPreferences = updated;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage errors (e.g., quota exceeded)
  }

  // Notify listeners
  window.dispatchEvent(new CustomEvent("preferences-change"));
}

// Subscribe to preference changes
function subscribe(callback: () => void): () => void {
  const handleChange = () => callback();
  window.addEventListener("preferences-change", handleChange);
  window.addEventListener("storage", handleChange);

  return () => {
    window.removeEventListener("preferences-change", handleChange);
    window.removeEventListener("storage", handleChange);
  };
}

function getSnapshot(): Preferences {
  return getPreferences();
}

function getServerSnapshot(): Preferences {
  return defaultPreferences;
}

/**
 * Hook to access and update user preferences.
 * Persists to localStorage and syncs across tabs.
 */
export function usePreferences() {
  const preferences = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setDiffViewMode = useCallback((mode: DiffViewMode) => {
    setPreferences({ diffViewMode: mode });
  }, []);

  return {
    preferences,
    setDiffViewMode,
  };
}
