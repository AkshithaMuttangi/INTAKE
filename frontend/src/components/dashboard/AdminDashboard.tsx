import React from "react";
import type { AdminDashboardData } from "../../types/dashboard";
import { MetricCard } from "./MetricCard";
import { WorkloadWidget } from "./WorkloadWidget";
import { RecentTicketsTable } from "./RecentTicketsTable";
import { PriorityChartWidget } from "./PriorityChartWidget";
import { Server, CheckCircle2, AlertOctagon, ShieldCheck } from "lucide-react";

interface AdminDashboardProps {
  data: AdminDashboardData;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ data }) => {
  const { kpis, charts } = data.analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          System Administration & Governance
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Executive incident telemetry and support engineering governance
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Enterprise Incidents"
          value={kpis.totalTickets}
          subtext="Indexed in PostgreSQL"
          icon={Server}
          color="blue"
        />
        <MetricCard
          title="Resolution Rate"
          value={`${kpis.resolutionRatePercentage}%`}
          subtext={`${kpis.resolvedTickets.toLocaleString()} incidents closed`}
          icon={CheckCircle2}
          color="emerald"
        />
        <MetricCard
          title="Active SLA Breaches"
          value={kpis.activeSlaBreaches}
          subtext="Requiring team escalation"
          icon={AlertOctagon}
          color="rose"
          badge={
            kpis.activeSlaBreaches > 0
              ? { text: "Breaches Active", isPositive: false }
              : { text: "All Targets Met", isPositive: true }
          }
        />
        <MetricCard
          title="Platform Compliance"
          value={`${kpis.overallSlaCompliancePercentage}%`}
          subtext="Enterprise SLA baseline"
          icon={ShieldCheck}
          color="indigo"
        />
      </div>

      {/* Cross-Department Workload Capacity Matrix */}
      <WorkloadWidget
        workload={data.workload}
        title="Enterprise Staff Capacity & Load Distribution"
        subtitle="Least-busy capacity analysis across all engineering departments"
      />

      {/* P1 Critical Incidents & Severity Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTicketsTable
            title="P1 Critical Enterprise Incidents"
            subtitle="Highest severity incidents requiring tier-3 response"
            tickets={data.criticalTickets}
            showAssignee={true}
            viewAllLink="/tickets?priority=P1_CRITICAL"
          />
        </div>
        <div>
          <PriorityChartWidget
            data={charts.priorityDistribution}
            title="Enterprise Severity Distribution"
            subtitle="Categorized breakdown of all 10,200+ incidents"
          />
        </div>
      </div>
    </div>
  );
};
