import { useState, useCallback, useEffect } from "react";
import { PanelRightOpen, X } from "lucide-react";
import { useIsMobile } from "@/lib/hooks/use-media-query";

interface MobileSidebarProps {
  children: React.ReactNode;
  title?: string;
}

/**
 * Wrapper component that shows content as a collapsible slide-out panel on mobile.
 * On desktop, it renders children normally as a sidebar.
 */
export function MobileSidebar({ children, title = "Details" }: MobileSidebarProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, handleClose]);

  // Prevent body scroll when panel is open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  // On desktop, just render children as-is
  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Toggle button - fixed at bottom right on mobile */}
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-4 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-fg text-bg rounded-full shadow-lg hover:opacity-90 transition-opacity"
        aria-label={`Open ${title}`}
      >
        <PanelRightOpen size={18} />
        <span className="text-sm font-medium">{title}</span>
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 transition-opacity"
          onClick={handleClose}
          aria-hidden="true"
        />
      )}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[85vw] max-w-sm bg-bg transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Panel header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-bg-secondary">
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          <button
            type="button"
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors text-fg-muted hover:text-fg"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Panel content */}
        <div className="overflow-y-auto h-[calc(100%-52px)] p-4">{children}</div>
      </div>
    </>
  );
}
