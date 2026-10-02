import React, { useState, useEffect, useCallback } from "react";
import { DashboardService } from "../../services/dashboardService";
import type { AgentWorkloadItem } from "../../types/dashboard";
import { WorkloadWidget } from "../../components/dashboard/WorkloadWidget";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { Users2, AlertTriangle, Briefcase, RefreshCw, AlertCircle } from "lucide-react";

export const WorkloadPage: React.FC = () => {
  const [workload, setWorkload] = useState<AgentWorkloadItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const fetchWorkload = async () => {
      try {
        const data = await DashboardService.getWorkloadMetrics();
        if (isMounted) {
          setWorkload(data);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as { message?: string };
          setError(apiErr.message || "Failed to load team workload telemetry.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchWorkload();

    return () => {
      isMounted = false;
    };
  }, [refreshTrigger]);

  const totalActiveTickets = workload.reduce((acc, a) => acc + a.activeTicketCount, 0);
  const totalBreaches = workload.reduce((acc, a) => acc + a.breachedTicketCount, 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
        <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold">Failed to load workload telemetry</h3>
        </div>
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50 dark:border-rose-700 dark:bg-slate-900 dark:text-rose-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry Connection</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Team Workload & Capacity Balancing
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry supporting least-busy routing and departmental load distribution
          </p>
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="inline-flex items-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Refresh Workload</span>
        </button>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Active Support Engineers"
          value={workload.length}
          subtext="Available for automatic routing"
          icon={Users2}
          color="blue"
        />
        <MetricCard
          title="Total Assigned Queue"
          value={totalActiveTickets}
          subtext="Active tickets currently in progress"
          icon={Briefcase}
          color="indigo"
        />
        <MetricCard
          title="Active SLA Breaches"
          value={totalBreaches}
          subtext="Incidents past SLA deadline"
          icon={AlertTriangle}
          color="rose"
          badge={
            totalBreaches > 0
              ? { text: `${totalBreaches} Breached`, isPositive: false }
              : { text: "100% Compliant", isPositive: true }
          }
        />
      </div>

      {/* Main Workload Table */}
      <WorkloadWidget
        workload={workload}
        title="Agent Workload Balancing Matrix"
        subtitle="Least-busy capacity analysis across support engineering teams"
      />
    </div>
  );
};
