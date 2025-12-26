import type { LanguageBreakdown } from "@/lib/types/github";

// GitHub's language colors (common ones)
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Java: "#b07219",
  Go: "#00ADD8",
  Rust: "#dea584",
  Ruby: "#701516",
  PHP: "#4F5D95",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
  Scala: "#c22d40",
  Shell: "#89e051",
  HTML: "#e34c26",
  CSS: "#563d7c",
  SCSS: "#c6538c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Dart: "#00B4AB",
  Elixir: "#6e4a7e",
  Haskell: "#5e5086",
  Lua: "#000080",
  Perl: "#0298c3",
  R: "#198CE7",
  Julia: "#a270ba",
  Clojure: "#db5855",
  Erlang: "#B83998",
  Objective: "#438eff",
  Markdown: "#083fa1",
  Dockerfile: "#384d54",
  Makefile: "#427819",
  Nix: "#7e7eff",
  Zig: "#ec915c",
  OCaml: "#3be133",
  F: "#b845fc",
  Assembly: "#6E4C13",
  YAML: "#cb171e",
  JSON: "#292929",
  TOML: "#9c4221",
};

function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "#8b8b8b";
}

interface LanguageBarProps {
  languages: LanguageBreakdown;
  showLabels?: boolean;
}

export function LanguageBar({ languages, showLabels = true }: LanguageBarProps) {
  const entries = Object.entries(languages);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);

  // Sort by bytes descending
  const sorted = entries.sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* Bar */}
      <div className="flex h-2 rounded-full overflow-hidden bg-neutral-100">
        {sorted.map(([lang, bytes]) => {
          const pct = (bytes / total) * 100;
          if (pct < 0.5) return null; // Skip tiny languages
          return (
            <div
              key={lang}
              className="h-full"
              style={{
                backgroundColor: getLanguageColor(lang),
                width: `${pct}%`,
              }}
              title={`${lang}: ${pct.toFixed(1)}%`}
            />
          );
        })}
      </div>

      {/* Labels */}
      {showLabels && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs">
          {sorted.slice(0, 8).map(([lang, bytes]) => {
            const pct = (bytes / total) * 100;
            return (
              <div key={lang} className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: getLanguageColor(lang) }}
                />
                <span className="font-medium text-neutral-700">{lang}</span>
                <span className="text-neutral-400">{pct.toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
