import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { DashboardService } from "../../services/dashboardService";
import type {
  EndUserDashboardData,
  AgentDashboardData,
  TeamLeadDashboardData,
  AdminDashboardData,
} from "../../types/dashboard";
import { EndUserDashboard } from "../../components/dashboard/EndUserDashboard";
import { AgentDashboard } from "../../components/dashboard/AgentDashboard";
import { TeamLeadDashboard } from "../../components/dashboard/TeamLeadDashboard";
import { AdminDashboard } from "../../components/dashboard/AdminDashboard";
import { AlertCircle, RefreshCw } from "lucide-react";

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);

  const [endUserData, setEndUserData] = useState<EndUserDashboardData | null>(null);
  const [agentData, setAgentData] = useState<AgentDashboardData | null>(null);
  const [teamLeadData, setTeamLeadData] = useState<TeamLeadDashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);

  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      if (!user) return;

      try {
        if (user.role === "END_USER") {
          const data = await DashboardService.getEndUserDashboardData();
          if (isMounted) setEndUserData(data);
        } else if (user.role === "SUPPORT_AGENT") {
          const data = await DashboardService.getAgentDashboardData(user.id);
          if (isMounted) setAgentData(data);
        } else if (user.role === "TEAM_LEAD") {
          const data = await DashboardService.getTeamLeadDashboardData();
          if (isMounted) setTeamLeadData(data);
        } else if (user.role === "ADMIN") {
          const data = await DashboardService.getAdminDashboardData();
          if (isMounted) setAdminData(data);
        }
        if (isMounted) setError(null);
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as {
            response?: { data?: { error?: { message?: string } } };
            message?: string;
          };
          const message =
            apiErr.response?.data?.error?.message ||
            apiErr.message ||
            "Failed to load dashboard operational telemetry.";
          setError(message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [user, refreshTrigger]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="mt-2 h-4 w-72 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
        </div>

        {/* 4 Skeleton Metric Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 animate-pulse"
            >
              <div className="flex justify-between">
                <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="mt-4 h-6 w-16 rounded bg-slate-200 dark:bg-slate-800" />
            </div>
          ))}
        </div>

        {/* Skeleton Table / Chart */}
        <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse">
          <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
          <div className="mt-6 space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-8 w-full rounded bg-slate-100 dark:bg-slate-800" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-rose-500" />
          <h3 className="text-sm font-bold">Failed to load dashboard metrics</h3>
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

  // Role Routing View
  if (user?.role === "END_USER" && endUserData) {
    return <EndUserDashboard data={endUserData} userName={user.name} />;
  }

  if (user?.role === "SUPPORT_AGENT" && agentData) {
    return <AgentDashboard data={agentData} userName={user.name} />;
  }

  if (user?.role === "TEAM_LEAD" && teamLeadData) {
    return <TeamLeadDashboard data={teamLeadData} department={user.department} />;
  }

  if (user?.role === "ADMIN" && adminData) {
    return <AdminDashboard data={adminData} />;
  }

  return (
    <div className="p-8 text-center text-xs text-slate-500">
      No dashboard operational telemetry available for this account.
    </div>
  );
};
