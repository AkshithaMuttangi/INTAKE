import React from "react";
import type { EndUserDashboardData } from "../../types/dashboard";
import { MetricCard } from "./MetricCard";
import { RecentTicketsTable } from "./RecentTicketsTable";
import { Inbox, Clock, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

interface EndUserDashboardProps {
  data: EndUserDashboardData;
  userName: string;
}

export const EndUserDashboard: React.FC<EndUserDashboardProps> = ({
  data,
  userName,
}) => {
  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Welcome back, {userName}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Your personal service desk overview and submitted request status
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Submitted"
          value={data.totalTickets}
          subtext="All historical requests"
          icon={Inbox}
          color="blue"
        />
        <MetricCard
          title="In Progress / Open"
          value={data.openTickets}
          subtext="Active support investigations"
          icon={Clock}
          color="indigo"
        />
        <MetricCard
          title="Action Required"
          value={data.pendingCustomerTickets}
          subtext="Awaiting information from you"
          icon={AlertCircle}
          color="amber"
          badge={
            data.pendingCustomerTickets > 0
              ? { text: "Action Needed", isPositive: false }
              : undefined
          }
        />
        <MetricCard
          title="Resolved"
          value={data.resolvedTickets}
          subtext="Successfully completed"
          icon={CheckCircle2}
          color="emerald"
        />
      </div>

      {/* Recent Tickets Table */}
      <RecentTicketsTable
        title="My Recent Tickets"
        subtitle="Recent activity and live SLA tracking for your requests"
        tickets={data.recentTickets}
        viewAllLink="/tickets"
      />

      {/* Direct Quick Link Banner */}
      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-950/20 sm:flex-row sm:items-center">
        <div>
          <h4 className="text-xs font-bold text-blue-900 dark:text-blue-200">
            Looking for an older service request?
          </h4>
          <p className="text-xs text-blue-700/80 dark:text-blue-400">
            Use the full incident queue to search, filter by category, or check resolution notes.
          </p>
        </div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600"
        >
          <span>Open Ticket Queue</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};
