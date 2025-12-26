import { useState, useRef, useCallback } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { usePreferences, type Theme } from "@/lib/hooks/use-preferences";
import { useDropdownClose } from "@/lib/hooks/use-dropdown-close";

const THEME_OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle() {
  const { preferences, resolvedTheme, setTheme } = usePreferences();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => setIsOpen(false), []);
  useDropdownClose(isOpen, handleClose, dropdownRef);

  // Get the icon for the current theme
  const CurrentIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-fg-secondary hover:text-fg hover:bg-bg-hover transition-colors"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        <CurrentIcon size={18} />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-36 py-1 bg-bg-secondary border border-border rounded-lg shadow-lg z-50
            animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {THEME_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isSelected = preferences.theme === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-100
                  ${isSelected ? "bg-bg-hover text-fg" : "text-fg-secondary hover:bg-bg-hover hover:text-fg"}`}
              >
                <Icon size={16} className={isSelected ? "text-accent" : "text-fg-muted"} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
