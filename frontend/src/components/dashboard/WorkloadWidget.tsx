import React from "react";
import type { AgentWorkloadItem } from "../../types/dashboard";
import { Users2, AlertTriangle, CheckCircle2, TrendingUp } from "lucide-react";

interface WorkloadWidgetProps {
  workload: AgentWorkloadItem[];
  title?: string;
  subtitle?: string;
}

export const WorkloadWidget: React.FC<WorkloadWidgetProps> = ({
  workload,
  title = "Support Team Workload & Capacity",
  subtitle = "Dynamic least-busy agent distribution across departments",
}) => {
  // Sort agents by active ticket count ascending (least-busy first)
  const sortedAgents = [...workload].sort(
    (a, b) => a.activeTicketCount - b.activeTicketCount
  );

  const getLoadBadge = (activeCount: number) => {
    if (activeCount === 0) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-3 w-3" />
          Available / Least Busy
        </span>
      );
    }
    if (activeCount < 40) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
          Optimal Load
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
        <TrendingUp className="h-3 w-3" />
        High Load
      </span>
    );
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Users2 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        {subtitle && (
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
        )}
      </div>

      {/* Table */}
      {sortedAgents.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No agent workload telemetry available
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Agent</th>
                <th className="py-2.5 px-3">Department</th>
                <th className="py-2.5 px-3 text-center">Active Queue</th>
                <th className="py-2.5 px-3 text-center">SLA Breaches</th>
                <th className="py-2.5 pr-5 pl-3 text-right">Capacity Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sortedAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                >
                  <td className="py-3 pl-5 pr-3">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-400">{agent.email}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                    {agent.department}
                  </td>
                  <td className="py-3 px-3 text-center font-bold text-slate-900 dark:text-slate-100">
                    {agent.activeTicketCount}
                  </td>
                  <td className="py-3 px-3 text-center">
                    {agent.breachedTicketCount > 0 ? (
                      <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                        <AlertTriangle className="h-3 w-3" />
                        {agent.breachedTicketCount}
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 pr-5 pl-3 text-right whitespace-nowrap">
                    {getLoadBadge(agent.activeTicketCount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
