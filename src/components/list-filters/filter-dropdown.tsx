import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, User, Tag } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  icon?: string; // Avatar URL for users
  color?: string; // Color for labels
}

interface FilterDropdownProps {
  label: string;
  value?: string;
  options: FilterOption[];
  onChange: (value: string | undefined) => void;
  isLoading?: boolean;
  type?: "user" | "label";
  placeholder?: string;
}

export function FilterDropdown({
  label,
  value,
  options,
  onChange,
  isLoading = false,
  type = "user",
  placeholder = "Filter...",
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Find current selected option
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options based on search
  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  );

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearch("");
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (option: FilterOption) => {
    onChange(option.value);
    setIsOpen(false);
    setSearch("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onChange(undefined);
  };

  const DefaultIcon = type === "label" ? Tag : User;

  return (
    <div className="relative" ref={dropdownRef}>
      {selectedOption ? (
        // When filter is active, show as a pill with separate clickable areas
        <div
          className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border transition-all duration-150
            bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
        >
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            {type === "user" && selectedOption.icon ? (
              <img
                src={selectedOption.icon}
                alt={selectedOption.label}
                className="w-4 h-4 rounded-full"
              />
            ) : type === "label" && selectedOption.color ? (
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: `#${selectedOption.color}` }}
              />
            ) : (
              <DefaultIcon size={14} />
            )}
            <span className="max-w-[100px] truncate">{selectedOption.label}</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="p-0.5 hover:bg-blue-200 rounded transition-colors"
            aria-label={`Clear ${label} filter`}
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        // When no filter, show as a dropdown button
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium rounded-lg border transition-all duration-150
            focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
            bg-bg-secondary border-border text-fg-secondary hover:bg-bg-hover hover:text-fg"
        >
          <DefaultIcon size={14} className="text-fg-muted" />
          <span className="text-fg-muted">{label}</span>
          <ChevronDown
            size={14}
            className={`text-fg-muted transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      )}

      {isOpen && (
        <div
          className="absolute left-0 mt-1 w-64 bg-bg-secondary border border-border rounded-lg shadow-lg z-50
            animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {/* Search input */}
          <div className="p-2 border-b border-border">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full h-8 px-3 text-sm bg-bg border border-border rounded-md
                placeholder:text-fg-muted text-fg
                focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Options list */}
          <div className="max-h-64 overflow-auto py-1">
            {isLoading ? (
              <div className="px-3 py-4 text-sm text-fg-muted text-center">Loading...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-fg-muted text-center">
                {search ? "No matches found" : "No options available"}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors duration-100
                    ${
                      option.value === value
                        ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                        : "text-fg-secondary hover:bg-bg-hover"
                    }`}
                >
                  {type === "user" && option.icon ? (
                    <img src={option.icon} alt={option.label} className="w-5 h-5 rounded-full" />
                  ) : type === "label" && option.color ? (
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: `#${option.color}` }}
                    />
                  ) : (
                    <DefaultIcon size={16} className="text-fg-muted flex-shrink-0" />
                  )}
                  <span className="truncate">{option.label}</span>
                </button>
              ))
            )}
          </div>

          {/* Clear option */}
          {value && (
            <div className="p-2 border-t border-border">
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="w-full px-3 py-2 text-sm text-fg-muted hover:text-fg-secondary hover:bg-bg-hover rounded-md transition-colors"
              >
                Clear filter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
