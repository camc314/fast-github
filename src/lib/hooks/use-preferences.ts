import { useSyncExternalStore, useCallback, useEffect } from "react";
import type { DiffViewMode } from "@/components/diff/diff-viewer";

const STORAGE_KEY = "fast-github-preferences";

export type Theme = "light" | "dark" | "system";

interface Preferences {
  diffViewMode: DiffViewMode;
  theme: Theme;
}

const defaultPreferences: Preferences = {
  diffViewMode: "unified",
  theme: "system",
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
 * Get the resolved theme (accounting for system preference).
 */
function getResolvedTheme(theme: Theme): "light" | "dark" {
  if (theme === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return theme;
}

/**
 * Apply theme to document.
 */
function applyTheme(theme: Theme): void {
  const resolved = getResolvedTheme(theme);
  const root = document.documentElement;

  // Remove existing theme classes
  root.classList.remove("light", "dark");

  // Add new theme class
  root.classList.add(resolved);

  // Update color-scheme for native elements
  root.style.colorScheme = resolved;
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

  const setTheme = useCallback((theme: Theme) => {
    setPreferences({ theme });
    applyTheme(theme);
  }, []);

  // Apply theme on mount and when system preference changes
  useEffect(() => {
    applyTheme(preferences.theme);

    // Listen for system theme changes when using "system" theme
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (preferences.theme === "system") {
        applyTheme("system");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [preferences.theme]);

  return {
    preferences,
    resolvedTheme: getResolvedTheme(preferences.theme),
    setDiffViewMode,
    setTheme,
  };
}
