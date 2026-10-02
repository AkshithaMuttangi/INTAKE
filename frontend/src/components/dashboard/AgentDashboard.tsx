import React from "react";
import type { AgentDashboardData } from "../../types/dashboard";
import { MetricCard } from "./MetricCard";
import { RecentTicketsTable } from "./RecentTicketsTable";
import { PriorityChartWidget } from "./PriorityChartWidget";
import { Inbox, PlayCircle, Clock, AlertTriangle } from "lucide-react";

interface AgentDashboardProps {
  data: AgentDashboardData;
  userName: string;
}

export const AgentDashboard: React.FC<AgentDashboardProps> = ({
  data,
  userName,
}) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Support Operations Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Personal triage queue and SLA target adherence for {userName}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="My Assigned Queue"
          value={data.assignedTotal}
          subtext="Total tickets assigned to you"
          icon={Inbox}
          color="blue"
        />
        <MetricCard
          title="In Progress"
          value={data.assignedInProgress}
          subtext="Currently actively working"
          icon={PlayCircle}
          color="indigo"
        />
        <MetricCard
          title="Pending Customer"
          value={data.assignedPending}
          subtext="Waiting for client feedback"
          icon={Clock}
          color="purple"
        />
        <MetricCard
          title="SLA Breached"
          value={data.assignedBreached}
          subtext="Requires immediate escalation"
          icon={AlertTriangle}
          color="rose"
          badge={
            data.assignedBreached > 0
              ? { text: `${data.assignedBreached} Breached`, isPositive: false }
              : { text: "Compliant", isPositive: true }
          }
        />
      </div>

      {/* Operations Row: Recent Assigned Queue & Priority Distribution */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTicketsTable
            title="My Assigned Tickets"
            subtitle="Prioritized queue with active SLA response and resolution countdowns"
            tickets={data.recentAssigned}
            viewAllLink="/tickets"
          />
        </div>
        <div>
          {data.analytics && (
            <PriorityChartWidget
              data={data.analytics.charts.priorityDistribution}
              title="Global Priority Distribution"
              subtitle="Service desk volume by priority tier"
            />
          )}
        </div>
      </div>
    </div>
  );
};
