import React from "react";
import type { TeamLeadDashboardData } from "../../types/dashboard";
import { MetricCard } from "./MetricCard";
import { WorkloadWidget } from "./WorkloadWidget";
import { RecentTicketsTable } from "./RecentTicketsTable";
import { PriorityChartWidget } from "./PriorityChartWidget";
import { Inbox, AlertTriangle, ShieldCheck, Clock } from "lucide-react";

interface TeamLeadDashboardProps {
  data: TeamLeadDashboardData;
  department: string;
}

export const TeamLeadDashboard: React.FC<TeamLeadDashboardProps> = ({
  data,
  department,
}) => {
  const { kpis, charts } = data.analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          Team Operations & Capacity Dashboard
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Supervisory workload distribution and SLA enforcement for {department}
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Incidents"
          value={kpis.totalTickets}
          subtext="Indexed across enterprise"
          icon={Inbox}
          color="blue"
        />
        <MetricCard
          title="Active SLA Breaches"
          value={kpis.activeSlaBreaches}
          subtext="Unresolved past deadline"
          icon={AlertTriangle}
          color="rose"
          badge={
            kpis.activeSlaBreaches > 0
              ? { text: "Breaches Detected", isPositive: false }
              : { text: "100% Compliant", isPositive: true }
          }
        />
        <MetricCard
          title="SLA Compliance"
          value={`${kpis.overallSlaCompliancePercentage}%`}
          subtext="Target SLA benchmark: >90%"
          icon={ShieldCheck}
          color="emerald"
          badge={{
            text: kpis.overallSlaCompliancePercentage >= 90 ? "Target Met" : "At Risk",
            isPositive: kpis.overallSlaCompliancePercentage >= 90,
          }}
        />
        <MetricCard
          title="Avg Resolution Time"
          value={`${kpis.avgResolutionHours} hrs`}
          subtext="Average incident lifetime"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Workload Balancing Section */}
      <WorkloadWidget
        workload={data.workload}
        title="Agent Workload Balancing Matrix"
        subtitle="Least-busy capacity analysis across support engineering teams"
      />

      {/* Escalation Queue & Severity Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RecentTicketsTable
            title="Critical SLA Escalation Queue"
            subtitle="Immediate priority tickets with breached or imminent resolution windows"
            tickets={data.recentEscalations}
            showAssignee={true}
            viewAllLink="/tickets?slaBreached=true"
          />
        </div>
        <div>
          <PriorityChartWidget
            data={charts.priorityDistribution}
            title="Incident Severity Distribution"
            subtitle="Active workload categorized by P1-P4 tiers"
          />
        </div>
      </div>
    </div>
  );
};
