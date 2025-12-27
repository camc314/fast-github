import { useState, useRef, memo, useEffect, useReducer } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import { useDropdownClose } from "@/lib/hooks/use-dropdown-close";
import { useToastActions } from "./toast";
import { fetchRepoLabels, addLabels, removeLabel } from "@/lib/api/github";
import type { Label as LabelType } from "@/lib/types/github";

// Debounce delay for batching label additions
const BATCH_DELAY_MS = 300;

// Simple hook to force re-render
function useForceUpdate() {
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);
  return forceUpdate;
}

interface LabelPickerProps {
  owner: string;
  repo: string;
  issueNumber: number;
  currentLabels: LabelType[];
  queryKeyPrefix: "issue" | "pull-request";
}

function getContrastColor(hexColor: string): string {
  const r = parseInt(hexColor.slice(0, 2), 16);
  const g = parseInt(hexColor.slice(2, 4), 16);
  const b = parseInt(hexColor.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

const LabelBadge = memo(function LabelBadge({
  label,
  onRemove,
  canRemove,
}: {
  label: LabelType;
  onRemove?: () => void;
  canRemove: boolean;
}) {
  const bgColor = `#${label.color}`;
  const textColor = getContrastColor(label.color);

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ backgroundColor: bgColor, color: textColor }}
      title={label.description}
    >
      {label.name}
      {canRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-0.5 rounded-full hover:bg-black/20 transition-colors"
          title={`Remove ${label.name}`}
        >
          <X size={10} />
        </button>
      )}
    </span>
  );
});

export function LabelPicker({
  owner,
  repo,
  issueNumber,
  currentLabels,
  queryKeyPrefix,
}: LabelPickerProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const forceUpdate = useForceUpdate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const batchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLabelsRef = useRef<Set<string>>(new Set());
  const queryClient = useQueryClient();
  const toast = useToastActions();

  useDropdownClose(isOpen, () => setIsOpen(false), dropdownRef);

  // Fetch available labels
  const { data: availableLabels = [], isLoading: isLoadingLabels } = useQuery({
    queryKey: ["repo-labels", owner, repo],
    queryFn: () => fetchRepoLabels(owner, repo),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Batched add labels mutation
  const addMutation = useMutation({
    mutationFn: (labelNames: string[]) => addLabels(owner, repo, issueNumber, labelNames),
    onSuccess: (_data, labelNames) => {
      const count = labelNames.length;
      toast.success(
        count === 1 ? "Label added" : "Labels added",
        count === 1
          ? "Label has been added successfully"
          : `${count} labels have been added successfully`,
      );
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, owner, repo, issueNumber] });
    },
    onError: (error) => {
      toast.error(
        "Failed to add labels",
        error instanceof Error ? error.message : "Please try again",
      );
    },
    onSettled: () => {
      pendingLabelsRef.current = new Set();
      forceUpdate();
    },
  });

  // Remove label mutation
  const removeMutation = useMutation({
    mutationFn: (labelName: string) => removeLabel(owner, repo, issueNumber, labelName),
    onSuccess: () => {
      toast.success("Label removed", "Label has been removed successfully");
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, owner, repo, issueNumber] });
    },
    onError: (error) => {
      toast.error(
        "Failed to remove label",
        error instanceof Error ? error.message : "Please try again",
      );
    },
  });

  const isPending = addMutation.isPending || removeMutation.isPending;
  const pendingLabels = pendingLabelsRef.current;

  // Filter labels based on search and exclude already selected + pending
  const filteredLabels = availableLabels.filter(
    (label) =>
      label.name.toLowerCase().includes(search.toLowerCase()) &&
      !currentLabels.some((l) => l.name === label.name) &&
      !pendingLabels.has(label.name),
  );

  // Handle adding a label with batching
  const handleAddLabel = (label: LabelType) => {
    // Add to pending set
    pendingLabelsRef.current.add(label.name);
    forceUpdate();

    // Clear existing timeout
    if (batchTimeoutRef.current) {
      clearTimeout(batchTimeoutRef.current);
    }

    // Set new timeout to flush
    batchTimeoutRef.current = setTimeout(() => {
      const labels = Array.from(pendingLabelsRef.current);
      if (labels.length > 0) {
        addMutation.mutate(labels);
      }
      batchTimeoutRef.current = null;
    }, BATCH_DELAY_MS);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (batchTimeoutRef.current) {
        clearTimeout(batchTimeoutRef.current);
      }
    };
  }, []);

  const handleRemoveLabel = (labelName: string) => {
    removeMutation.mutate(labelName);
  };

  // Show current labels (read-only if not authenticated)
  if (!isAuthenticated) {
    if (currentLabels.length === 0) {
      return <p className="text-sm text-fg-muted">No labels</p>;
    }
    return (
      <div className="flex flex-wrap gap-1.5">
        {currentLabels.map((label) => (
          <LabelBadge key={label.id} label={label} canRemove={false} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {/* Current labels with remove button */}
      {currentLabels.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {currentLabels.map((label) => (
            <LabelBadge
              key={label.id}
              label={label}
              onRemove={() => handleRemoveLabel(label.name)}
              canRemove={!isPending}
            />
          ))}
        </div>
      )}

      {/* Add label button / dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <Plus size={14} />
          {currentLabels.length === 0 ? "Add label" : "Add more"}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search labels..."
                className="w-full px-2 py-1.5 text-sm bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                autoFocus
              />
            </div>

            {/* Label list */}
            <div className="max-h-48 overflow-y-auto">
              {isLoadingLabels ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-fg-muted" />
                </div>
              ) : filteredLabels.length === 0 ? (
                <p className="text-sm text-fg-muted text-center py-4">
                  {search ? "No labels found" : "No available labels"}
                </p>
              ) : (
                <div className="py-1">
                  {/* Show pending labels at the top with a check mark */}
                  {Array.from(pendingLabels).map((labelName) => {
                    const label = availableLabels.find((l) => l.name === labelName);
                    if (!label) return null;
                    const bgColor = `#${label.color}`;

                    return (
                      <div
                        key={label.id}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left bg-bg-hover opacity-75"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: bgColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-fg block truncate">{label.name}</span>
                        </div>
                        <Check size={14} className="text-accent shrink-0" />
                      </div>
                    );
                  })}
                  {filteredLabels.map((label) => {
                    const bgColor = `#${label.color}`;

                    return (
                      <button
                        key={label.id}
                        type="button"
                        onClick={() => handleAddLabel(label)}
                        disabled={isPending}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-hover transition-colors disabled:opacity-50"
                      >
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: bgColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm text-fg block truncate">{label.name}</span>
                          {label.description && (
                            <span className="text-xs text-fg-muted block truncate">
                              {label.description}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
