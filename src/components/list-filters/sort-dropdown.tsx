import { useState, useRef, useCallback } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SORT_OPTIONS, type SortField, type SortDirection } from "@/lib/types/github";
import { useDropdownClose } from "@/lib/hooks/use-dropdown-close";

interface SortDropdownProps {
  sort: SortField;
  direction: SortDirection;
  onChange: (sort: SortField, direction: SortDirection) => void;
}

export function SortDropdown({ sort, direction, onChange }: SortDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find current label
  const currentOption = SORT_OPTIONS.find(
    (opt) => opt.field === sort && opt.direction === direction,
  );
  const currentLabel = currentOption?.label ?? "Sort";

  // Close dropdown callback
  const handleClose = useCallback(() => setIsOpen(false), []);

  // Use shared hook for click-outside and escape handling
  useDropdownClose(isOpen, handleClose, dropdownRef);

  const handleSelect = (option: (typeof SORT_OPTIONS)[0]) => {
    onChange(option.field, option.direction);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium text-fg-secondary
          bg-bg-secondary border border-border rounded-lg
          hover:bg-bg-hover hover:text-fg
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          transition-all duration-150"
      >
        <span className="text-fg-muted">Sort:</span>
        <span className="text-fg">{currentLabel}</span>
        <ChevronDown
          size={14}
          className={`text-fg-muted transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-52 py-1 bg-bg-secondary border border-border rounded-lg shadow-lg z-50
            animate-in fade-in slide-in-from-top-1 duration-150"
        >
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.field === sort && option.direction === direction;
            return (
              <button
                key={`${option.field}-${option.direction}`}
                type="button"
                onClick={() => handleSelect(option)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left
                  transition-colors duration-100
                  ${isSelected ? "bg-bg-hover text-fg" : "text-fg-secondary hover:bg-bg-hover hover:text-fg"}`}
              >
                <span>{option.label}</span>
                {isSelected && <Check size={14} className="text-blue-500" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
