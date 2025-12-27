import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Check, Loader2 } from "lucide-react";
import { Avatar } from "./avatar";
import { useAuth } from "@/lib/auth/auth-context";
import { useDropdownClose } from "@/lib/hooks/use-dropdown-close";
import { useToastActions } from "./toast";
import { fetchRepoAssignees, addAssignees, removeAssignees } from "@/lib/api/github";
import type { User } from "@/lib/types/github";

interface AssigneePickerProps {
  owner: string;
  repo: string;
  issueNumber: number;
  currentAssignees: User[];
  queryKeyPrefix: "issue" | "pull-request";
}

export function AssigneePicker({
  owner,
  repo,
  issueNumber,
  currentAssignees,
  queryKeyPrefix,
}: AssigneePickerProps) {
  const { isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const toast = useToastActions();

  useDropdownClose(isOpen, () => setIsOpen(false), dropdownRef);

  // Fetch available assignees
  const { data: availableAssignees = [], isLoading: isLoadingAssignees } = useQuery({
    queryKey: ["repo-assignees", owner, repo],
    queryFn: () => fetchRepoAssignees(owner, repo),
    enabled: isOpen,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add assignee mutation
  const addMutation = useMutation({
    mutationFn: (login: string) => addAssignees(owner, repo, issueNumber, [login]),
    onSuccess: () => {
      toast.success("Assignee added", "User has been assigned successfully");
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, owner, repo, issueNumber] });
    },
    onError: (error) => {
      toast.error(
        "Failed to add assignee",
        error instanceof Error ? error.message : "Please try again",
      );
    },
  });

  // Remove assignee mutation
  const removeMutation = useMutation({
    mutationFn: (login: string) => removeAssignees(owner, repo, issueNumber, [login]),
    onSuccess: () => {
      toast.success("Assignee removed", "User has been unassigned successfully");
      queryClient.invalidateQueries({ queryKey: [queryKeyPrefix, owner, repo, issueNumber] });
    },
    onError: (error) => {
      toast.error(
        "Failed to remove assignee",
        error instanceof Error ? error.message : "Please try again",
      );
    },
  });

  const isPending = addMutation.isPending || removeMutation.isPending;

  // Filter assignees based on search
  const filteredAssignees = availableAssignees.filter(
    (user) =>
      user.login.toLowerCase().includes(search.toLowerCase()) &&
      !currentAssignees.some((a) => a.login === user.login),
  );

  const handleToggleAssignee = (user: User) => {
    const isCurrentlyAssigned = currentAssignees.some((a) => a.login === user.login);
    if (isCurrentlyAssigned) {
      removeMutation.mutate(user.login);
    } else {
      addMutation.mutate(user.login);
    }
  };

  const handleRemoveAssignee = (login: string) => {
    removeMutation.mutate(login);
  };

  // Show current assignees (read-only if not authenticated)
  if (!isAuthenticated) {
    if (currentAssignees.length === 0) {
      return <p className="text-sm text-fg-muted">No assignees</p>;
    }
    return (
      <div className="flex flex-wrap gap-2">
        {currentAssignees.map((user) => (
          <div key={user.login} className="flex items-center gap-1.5">
            <Avatar src={user.avatarUrl} alt={user.login} size={20} />
            <span className="text-sm text-fg-secondary">{user.login}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2" ref={dropdownRef}>
      {/* Current assignees with remove button */}
      {currentAssignees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {currentAssignees.map((user) => (
            <div
              key={user.login}
              className="flex items-center gap-1.5 bg-bg-tertiary rounded-full pl-0.5 pr-2 py-0.5 group"
            >
              <Avatar src={user.avatarUrl} alt={user.login} size={20} />
              <span className="text-sm text-fg-secondary">{user.login}</span>
              <button
                type="button"
                onClick={() => handleRemoveAssignee(user.login)}
                disabled={isPending}
                className="p-0.5 rounded-full text-fg-muted hover:text-fg hover:bg-bg-hover transition-colors disabled:opacity-50"
                title={`Remove ${user.login}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add assignee button / dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1.5 text-sm text-fg-muted hover:text-fg transition-colors"
        >
          <Plus size={14} />
          {currentAssignees.length === 0 ? "Add assignee" : "Add more"}
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-bg-secondary border border-border rounded-lg shadow-lg z-50 overflow-hidden">
            {/* Search input */}
            <div className="p-2 border-b border-border">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full px-2 py-1.5 text-sm bg-bg border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-accent focus:border-accent"
                autoFocus
              />
            </div>

            {/* Assignee list */}
            <div className="max-h-48 overflow-y-auto">
              {isLoadingAssignees ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 size={16} className="animate-spin text-fg-muted" />
                </div>
              ) : filteredAssignees.length === 0 ? (
                <p className="text-sm text-fg-muted text-center py-4">
                  {search ? "No users found" : "No available assignees"}
                </p>
              ) : (
                <div className="py-1">
                  {filteredAssignees.map((user) => {
                    const isAssigned = currentAssignees.some((a) => a.login === user.login);
                    return (
                      <button
                        key={user.login}
                        type="button"
                        onClick={() => handleToggleAssignee(user)}
                        disabled={isPending}
                        className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-bg-hover transition-colors disabled:opacity-50"
                      >
                        <Avatar src={user.avatarUrl} alt={user.login} size={20} />
                        <span className="text-sm text-fg-secondary flex-1">{user.login}</span>
                        {isAssigned && <Check size={14} className="text-accent" />}
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
