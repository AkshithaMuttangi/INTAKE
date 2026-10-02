import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { TicketFilters } from "../../components/tickets/TicketFilters";
import { TicketTable } from "../../components/tickets/TicketTable";
import { PaginationControls } from "../../components/tickets/PaginationControls";
import { TicketService } from "../../services/ticketService";
import type { TicketListItem, PaginationMeta, TicketQueryParams } from "../../types/ticket";
import type { TicketPriority, TicketStatus } from "../../types/api";
import { Inbox, AlertCircle, RefreshCw, Zap } from "lucide-react";

export const TicketsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  // Derive filter state from URL search parameters for linkable and bookmarkable queries
  const filters: TicketQueryParams = useMemo(() => {
    return {
      page: parseInt(searchParams.get("page") || "1", 10),
      limit: parseInt(searchParams.get("limit") || "20", 10),
      status: (searchParams.get("status") as TicketStatus) || undefined,
      priority: (searchParams.get("priority") as TicketPriority) || undefined,
      category: searchParams.get("category") || undefined,
      search: searchParams.get("search") || undefined,
      slaBreached: searchParams.has("slaBreached")
        ? searchParams.get("slaBreached") === "true"
        : undefined,
      sortBy: (searchParams.get("sortBy") as TicketQueryParams["sortBy"]) || "createdAt",
      sortOrder: (searchParams.get("sortOrder") as TicketQueryParams["sortOrder"]) || "desc",
    };
  }, [searchParams]);

  // Updates search params in URL, resetting page when changing filters
  const updateFilters = useCallback(
    (newFilters: Partial<TicketQueryParams>) => {
      setIsLoading(true);
      const nextParams = new URLSearchParams(searchParams);

      Object.entries(newFilters).forEach(([key, val]) => {
        if (val === undefined || val === null || val === "") {
          nextParams.delete(key);
        } else {
          nextParams.set(key, String(val));
        }
      });

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const resetFilters = useCallback(() => {
    setIsLoading(true);
    setSearchParams(new URLSearchParams({ page: "1", limit: "20" }), { replace: true });
  }, [setSearchParams]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  // Main data fetch on filter change or manual refresh trigger
  useEffect(() => {
    let isCancelled = false;

    const executeFetch = async () => {
      const start = performance.now();
      try {
        const result = await TicketService.getTickets(filters);
        if (!isCancelled) {
          setTickets(result.data);
          setPagination(result.pagination);
          setLastLatencyMs(Math.round(performance.now() - start));
          setError(null);
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          const apiErr = err as {
            response?: { data?: { error?: { message?: string } } };
            message?: string;
          };
          const message =
            apiErr.response?.data?.error?.message ||
            apiErr.message ||
            "Failed to load tickets from service desk API.";
          setError(message);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isCancelled = true;
    };
  }, [filters, refreshTrigger]);

  return (
    <div className="space-y-4">
      {/* Header with Title and Query Latency SLA Badge */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Incident Queue
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time enterprise service desk records ({pagination.total.toLocaleString()} total incidents)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {lastLatencyMs !== null && (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
              <Zap className="h-3 w-3 text-emerald-500" />
              API: {lastLatencyMs}ms (Sub-100ms)
            </span>
          )}
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isLoading}
            title="Refresh queue"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 px-3 text-xs font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <TicketFilters
        filters={filters}
        onFilterChange={updateFilters}
        onReset={resetFilters}
      />

      {/* Error Alert */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="rounded border border-rose-300 bg-white px-2 py-1 font-semibold text-rose-700 hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Table or Empty State */}
      {!isLoading && !error && tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Inbox className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">
            No incidents found
          </h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            No tickets match your active filter criteria or search query.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 py-1.5 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <TicketTable tickets={tickets} isLoading={isLoading} />
          {!isLoading && pagination.total > 0 && (
            <PaginationControls
              pagination={pagination}
              onPageChange={(page) => updateFilters({ page })}
              onLimitChange={(limit) => updateFilters({ limit, page: 1 })}
            />
          )}
        </>
      )}
    </div>
  );
};
