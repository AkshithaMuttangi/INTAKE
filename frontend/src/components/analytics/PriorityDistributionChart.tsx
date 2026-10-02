import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import type { PriorityDistributionItem } from "../../types/dashboard";
import { AlertOctagon } from "lucide-react";

interface PriorityDistributionChartProps {
  data: PriorityDistributionItem[];
  title?: string;
  subtitle?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  P1_CRITICAL: "#e11d48", // rose-600
  P2_HIGH: "#ea580c",     // orange-600
  P3_MEDIUM: "#d97706",   // amber-600
  P4_LOW: "#64748b",      // slate-500
};

export const PriorityDistributionChart: React.FC<PriorityDistributionChartProps> = ({
  data,
  title = "Incident Severity & Priority Breakdown",
  subtitle = "Distribution across ITIL priority tiers (P1 Critical through P4 Low)",
}) => {
  const totalIncidents = data.reduce((acc, curr) => acc + curr.count, 0);

  const chartData = data.map((item) => ({
    name: item.priority.replace("_", " "),
    rawPriority: item.priority,
    value: item.count,
    percentage: item.percentage,
    color: PRIORITY_COLORS[item.priority] || "#64748b",
  }));

  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="mt-8 flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No priority distribution telemetry available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <AlertOctagon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
        <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {subtitle && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}

      <div className="mt-4 grid grid-cols-1 items-center gap-4 sm:grid-cols-2">
        {/* Donut Chart */}
        <div className="relative h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
              >
                {chartData.map((entry) => (
                  <Cell key={`cell-${entry.rawPriority}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const p = payload[0].payload as (typeof chartData)[0];
                    return (
                      <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-lg text-xs dark:border-slate-700 dark:bg-slate-800">
                        <div className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.name}
                        </div>
                        <div className="mt-1 text-slate-600 dark:text-slate-300">
                          Count:{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {p.value.toLocaleString()}
                          </span>
                        </div>
                        <div className="text-slate-600 dark:text-slate-300">
                          Share:{" "}
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {p.percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Callout */}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {totalIncidents.toLocaleString()}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Total Logged
            </span>
          </div>
        </div>

        {/* Priority Legend & Data Rows */}
        <div className="space-y-3">
          {chartData.map((item) => (
            <div
              key={item.rawPriority}
              className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50/50 p-2.5 dark:border-slate-800 dark:bg-slate-800/40"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {item.name}
                  </span>
                  <div className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                    {item.percentage}% of all tickets
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  {item.value.toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
