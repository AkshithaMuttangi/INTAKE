import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MonthlyVolume } from "../../types/dashboard";
import { TrendingUp } from "lucide-react";

interface MonthlyVolumeChartProps {
  data: MonthlyVolume[];
  title?: string;
  subtitle?: string;
}

export const MonthlyVolumeChart: React.FC<MonthlyVolumeChartProps> = ({
  data,
  title = "Monthly Incident Volume & Resolution Velocity",
  subtitle = "Aggregated monthly volume, completed resolutions, and SLA breaches across all departments",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="mt-8 flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No monthly incident telemetry available
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="mt-6 h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradientTotal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="gradientBreached" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis
              dataKey="month"
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) =>
                val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`
              }
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as MonthlyVolume;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs dark:border-slate-700 dark:bg-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-1.5 mb-2">
                        {label} Incident Overview
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-blue-500" />
                            Total Logged:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500" />
                            Resolved:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.resolved.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400">
                              ({((item.resolved / item.total) * 100).toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-rose-500" />
                            SLA Breached:
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {item.breached.toLocaleString()}{" "}
                            <span className="text-[10px] text-slate-400">
                              ({((item.breached / item.total) * 100).toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              wrapperStyle={{ paddingBottom: "12px", fontSize: "12px" }}
              formatter={(value) => (
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {value === "total"
                    ? "Total Incidents"
                    : value === "resolved"
                    ? "Resolved"
                    : "SLA Breached"}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="total"
              name="total"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradientTotal)"
            />
            <Area
              type="monotone"
              dataKey="resolved"
              name="resolved"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradientResolved)"
            />
            <Area
              type="monotone"
              dataKey="breached"
              name="breached"
              stroke="#f43f5e"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#gradientBreached)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
