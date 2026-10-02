import React, { useState, useEffect } from "react";
import { Search, RotateCcw, Filter, AlertTriangle, ArrowUpDown } from "lucide-react";
import type { TicketQueryParams } from "../../types/ticket";
import type { TicketPriority, TicketStatus } from "../../types/api";

interface TicketFiltersProps {
  filters: TicketQueryParams;
  onFilterChange: (newFilters: Partial<TicketQueryParams>) => void;
  onReset: () => void;
}

export const TicketFilters: React.FC<TicketFiltersProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>(filters.search || "");
  const [prevSearch, setPrevSearch] = useState<string | undefined>(filters.search);

  // Synchronize internal input with external filters prop when prop changes
  if (filters.search !== prevSearch) {
    setPrevSearch(filters.search);
    setSearchTerm(filters.search || "");
  }

  // Debounced search trigger (350ms delay)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filters.search || "")) {
        onFilterChange({ search: searchTerm.trim() || undefined, page: 1 });
      }
    }, 350);
    return () => clearTimeout(handler);
  }, [searchTerm, filters.search, onFilterChange]);

  const hasActiveFilters = Boolean(
    filters.search ||
      filters.status ||
      filters.priority ||
      filters.category ||
      filters.slaBreached !== undefined ||
      filters.sortBy !== "createdAt" ||
      filters.sortOrder !== "desc"
  );

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-3">
        {/* Top Row: Search and Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ticket # (e.g. INTAKE-1042) or incident title..."
              className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500 sm:text-sm"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Sort:</span>
            </div>
            <select
              value={`${filters.sortBy || "createdAt"}-${filters.sortOrder || "desc"}`}
              onChange={(e) => {
                const [sortBy, sortOrder] = e.target.value.split("-") as [
                  TicketQueryParams["sortBy"],
                  TicketQueryParams["sortOrder"],
                ];
                onFilterChange({ sortBy, sortOrder, page: 1 });
              }}
              className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="createdAt-desc">Newest First</option>
              <option value="createdAt-asc">Oldest First</option>
              <option value="priority-desc">Priority</option>
              <option value="status-asc">Status</option>
              <option value="resolveDueAt-asc">Resolution Due Date</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                title="Clear all active filters"
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 py-1.5 px-2.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Field Dropdowns */}
        <div className="grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:items-center">
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 sm:mr-1">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ""}
            onChange={(e) =>
              onFilterChange({
                status: (e.target.value as TicketStatus) || undefined,
                page: 1,
              })
            }
            className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="PENDING_CUSTOMER">Pending Customer</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority || ""}
            onChange={(e) =>
              onFilterChange({
                priority: (e.target.value as TicketPriority) || undefined,
                page: 1,
              })
            }
            className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Priorities</option>
            <option value="P1_CRITICAL">P1 - Critical</option>
            <option value="P2_HIGH">P2 - High</option>
            <option value="P3_MEDIUM">P3 - Medium</option>
            <option value="P4_LOW">P4 - Low</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category || ""}
            onChange={(e) =>
              onFilterChange({
                category: e.target.value || undefined,
                page: 1,
              })
            }
            className="rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value="">All Categories</option>
            <option value="IT Infrastructure">IT Infrastructure</option>
            <option value="Security & Access">Security & Access</option>
            <option value="Network Engineering">Network Engineering</option>
            <option value="DevOps & Cloud">DevOps & Cloud</option>
            <option value="Workplace Services">Workplace Services</option>
            <option value="Database & Storage">Database & Storage</option>
          </select>

          {/* SLA Breach Checkbox Toggle */}
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white py-1.5 px-2.5 text-xs text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/50">
            <input
              type="checkbox"
              checked={filters.slaBreached === true}
              onChange={(e) =>
                onFilterChange({
                  slaBreached: e.target.checked ? true : undefined,
                  page: 1,
                })
              }
              className="h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            <span>SLA Breached Only</span>
          </label>
        </div>
      </div>
    </div>
  );
};
