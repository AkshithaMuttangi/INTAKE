import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Cell,
} from "recharts";
import type { DepartmentSlaItem } from "../../types/dashboard";
import { ShieldCheck } from "lucide-react";

interface DepartmentSlaChartProps {
  data: DepartmentSlaItem[];
  title?: string;
  subtitle?: string;
}

export const DepartmentSlaChart: React.FC<DepartmentSlaChartProps> = ({
  data,
  title = "Department SLA Compliance & Attainment",
  subtitle = "Compliance percentage against the 90.0% enterprise SLA threshold",
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="mt-8 flex h-64 flex-col items-center justify-center text-center">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            No departmental SLA compliance data available
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
            <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          {subtitle && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>

        {/* Legend Indicator */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            <span>&ge; 90% (Compliant)</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
            <span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />
            <span>&lt; 90% (Breached)</span>
          </div>
        </div>
      </div>

      <div className="mt-6 h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 15, right: 20, left: -10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
            <XAxis
              dataKey="department"
              stroke="#94a3b8"
              fontSize={11}
              interval={0}
              angle={-20}
              textAnchor="end"
              tickLine={false}
              axisLine={{ stroke: "#e2e8f0" }}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              domain={[0, 100]}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => `${val}%`}
            />
            <ReferenceLine
              y={90}
              stroke="#10b981"
              strokeDasharray="4 4"
              strokeWidth={1.5}
              label={{
                value: "Target 90%",
                position: "insideTopRight",
                fill: "#10b981",
                fontSize: 10,
                fontWeight: 600,
              }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const item = payload[0].payload as DepartmentSlaItem;
                  const isCompliant = item.complianceRate >= 90;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-3 shadow-lg text-xs dark:border-slate-700 dark:bg-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700/60 pb-1.5 mb-2">
                        {item.department}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 dark:text-slate-400">Compliance Rate:</span>
                          <span
                            className={`font-bold ${
                              isCompliant
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-rose-600 dark:text-rose-400"
                            }`}
                          >
                            {item.complianceRate}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 dark:text-slate-400">Total Tickets:</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {item.total.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <span className="text-slate-500 dark:text-slate-400">Breached:</span>
                          <span className="font-semibold text-rose-600 dark:text-rose-400">
                            {item.breached.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="complianceRate" radius={[4, 4, 0, 0]}>
              {data.map((entry) => (
                <Cell
                  key={`cell-dept-${entry.department}`}
                  fill={entry.complianceRate >= 90 ? "#10b981" : "#f43f5e"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
