import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SORT_OPTIONS, type SortField, type SortDirection } from "@/lib/types/github";

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

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
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
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  const handleSelect = (option: (typeof SORT_OPTIONS)[0]) => {
    onChange(option.field, option.direction);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 h-9 px-3 text-sm font-medium text-neutral-600
          bg-white border border-neutral-200 rounded-lg
          hover:bg-neutral-50 hover:text-neutral-900
          focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
          transition-all duration-150"
      >
        <span className="text-neutral-400">Sort:</span>
        <span className="text-neutral-900">{currentLabel}</span>
        <ChevronDown
          size={14}
          className={`text-neutral-400 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-1 w-52 py-1 bg-white border border-neutral-200 rounded-lg shadow-lg z-50
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
                  ${isSelected ? "bg-neutral-50 text-neutral-900" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900"}`}
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
