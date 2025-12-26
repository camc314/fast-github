import { useEffect, type RefObject } from "react";

/**
 * Hook to handle closing a dropdown when clicking outside or pressing Escape.
 * @param isOpen - Whether the dropdown is currently open
 * @param onClose - Callback to close the dropdown
 * @param ref - Ref to the dropdown container element
 */
export function useDropdownClose(
  isOpen: boolean,
  onClose: () => void,
  ref: RefObject<HTMLElement | null>,
): void {
  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen, onClose, ref]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, onClose]);
}
