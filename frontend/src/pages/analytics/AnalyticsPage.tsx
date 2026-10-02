import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { AnalyticsService } from "../../services/analyticsService";
import type { DashboardAnalyticsData } from "../../types/dashboard";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { MonthlyVolumeChart } from "../../components/analytics/MonthlyVolumeChart";
import { PriorityDistributionChart } from "../../components/analytics/PriorityDistributionChart";
import { DepartmentSlaChart } from "../../components/analytics/DepartmentSlaChart";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Lock,
  ArrowLeft,
} from "lucide-react";

export const AnalyticsPage: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<DashboardAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const canAccess = hasRole(["SUPPORT_AGENT", "TEAM_LEAD", "ADMIN"]);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (!canAccess) {
      return;
    }

    let isMounted = true;

    const fetchAnalytics = async () => {
      try {
        const result = await AnalyticsService.getDashboardMetrics();
        if (isMounted) {
          setData(result);
          setError(null);
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as { message?: string };
          setError(apiErr.message || "Failed to load incident analytics telemetry.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAnalytics();

    return () => {
      isMounted = false;
    };
  }, [canAccess, refreshTrigger]);

  // Role Access Guard: Prevent END_USER from viewing management analytics
  if (!canAccess) {
    return (
      <div className="mx-auto max-w-xl py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/40">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/60">
            <Lock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h2 className="mt-4 text-base font-bold text-amber-900 dark:text-amber-200">
            Access Restricted
          </h2>
          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">
            Incident Analytics is reserved for Support Staff, Team Leads, and Administrators. End
            users can track their tickets directly via the personal dashboard.
          </p>
          <div className="mt-6">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-500"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-6 w-64 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3.5 w-96 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          </div>
          <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* KPI Skeleton Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="h-88 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="h-80 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
          <div className="h-80 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error || !data) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold">Failed to load incident analytics telemetry</h3>
        </div>
        <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
          {error || "No data returned from backend analytics service."}
        </p>
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

  const { kpis, charts } = data;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Incident Analytics & Operational Intelligence
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time telemetry, volume trends, priority distributions, and department SLA compliance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <span className="block text-[11px] font-medium text-slate-400">Viewing Role</span>
            <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
              {user?.role}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Refresh Analytics</span>
          </button>
        </div>
      </div>

      {/* 1. KPI Summary Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Total Incidents */}
        <MetricCard
          title="Total Incidents"
          value={kpis.totalTickets}
          subtext="Total enterprise incident log volume"
          icon={Activity}
          color="blue"
        />

        {/* Card 2: Resolved Incidents */}
        <MetricCard
          title="Resolved Incidents"
          value={kpis.resolvedTickets}
          subtext={`Avg resolution: ${kpis.avgResolutionHours}h`}
          icon={CheckCircle2}
          color="emerald"
          badge={{
            text: `${kpis.resolutionRatePercentage}% Resolved`,
            isPositive: true,
          }}
        />

        {/* Card 3: Active SLA Breaches */}
        <MetricCard
          title="Active SLA Breaches"
          value={kpis.activeSlaBreaches}
          subtext="Open incidents exceeding deadline"
          icon={AlertTriangle}
          color="rose"
          badge={{
            text: kpis.activeSlaBreaches > 0 ? "Requires Attention" : "All Compliant",
            isPositive: kpis.activeSlaBreaches === 0,
          }}
        />

        {/* Card 4: Overall SLA Compliance */}
        <MetricCard
          title="SLA Compliance Rate"
          value={`${kpis.overallSlaCompliancePercentage}%`}
          subtext="Calculated across all historical incidents"
          icon={ShieldCheck}
          color="purple"
          badge={{
            text:
              kpis.overallSlaCompliancePercentage >= 90
                ? "Target Met"
                : "Target 90%",
            isPositive: kpis.overallSlaCompliancePercentage >= 90,
          }}
        />
      </div>

      {/* 2. Monthly Incident Volume Area Chart */}
      <MonthlyVolumeChart data={charts.monthlyIncidentVolume} />

      {/* 3 & 4. Priority Breakdown & Department SLA Compliance Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PriorityDistributionChart data={charts.priorityDistribution} />
        <DepartmentSlaChart data={charts.departmentSlaCompliance} />
      </div>
    </div>
  );
};
