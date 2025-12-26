import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";

// Toast types
export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Hook to access toast functionality
 */
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

/**
 * Convenience functions for showing different toast types
 */
export function useToastActions() {
  const { addToast } = useToast();

  return {
    success: (title: string, description?: string) =>
      addToast({ type: "success", title, description }),
    error: (title: string, description?: string) =>
      addToast({ type: "error", title, description, duration: 6000 }),
    warning: (title: string, description?: string) =>
      addToast({ type: "warning", title, description }),
    info: (title: string, description?: string) =>
      addToast({ type: "info", title, description }),
  };
}

/**
 * Get icon and styles for toast type
 */
function getToastStyles(type: ToastType) {
  switch (type) {
    case "success":
      return {
        icon: CheckCircle,
        iconClass: "text-emerald-500",
        borderClass: "border-emerald-500/30",
        bgClass: "bg-emerald-500/10",
      };
    case "error":
      return {
        icon: AlertCircle,
        iconClass: "text-red-500",
        borderClass: "border-red-500/30",
        bgClass: "bg-red-500/10",
      };
    case "warning":
      return {
        icon: AlertTriangle,
        iconClass: "text-amber-500",
        borderClass: "border-amber-500/30",
        bgClass: "bg-amber-500/10",
      };
    case "info":
      return {
        icon: Info,
        iconClass: "text-blue-500",
        borderClass: "border-blue-500/30",
        bgClass: "bg-blue-500/10",
      };
  }
}

/**
 * Individual toast component
 */
function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const { icon: Icon, iconClass, borderClass, bgClass } = getToastStyles(toast.type);

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg backdrop-blur-sm
        ${borderClass} ${bgClass} bg-bg-secondary/95
        animate-in slide-in-from-right-full fade-in duration-200`}
      role="alert"
    >
      <Icon size={20} className={`${iconClass} shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-fg">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-fg-secondary mt-0.5">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 p-1 rounded hover:bg-bg-hover text-fg-muted hover:text-fg transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}

/**
 * Toast container that renders all active toasts
 */
function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  );
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const duration = toast.duration ?? 4000;

    setToasts((prev) => [...prev, { ...toast, id }]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}
