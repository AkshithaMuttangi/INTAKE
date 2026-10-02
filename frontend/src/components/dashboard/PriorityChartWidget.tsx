import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import type { PriorityDistributionItem } from "../../types/dashboard";
import { BarChart3 } from "lucide-react";

interface PriorityChartWidgetProps {
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

export const PriorityChartWidget: React.FC<PriorityChartWidgetProps> = ({
  data,
  title = "Incident Distribution by Priority",
  subtitle = "Real-time enterprise incident severity breakdown",
}) => {
  const chartData = data.map((item) => ({
    name: item.label.replace("P1 ", "").replace("P2 ", "").replace("P3 ", "").replace("P4 ", ""),
    rawPriority: item.priority,
    count: item.count,
    percentage: item.percentage,
  }));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </div>
      {subtitle && (
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}

      <div className="mt-4 h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <XAxis
              dataKey="name"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => (val >= 1000 ? `${(val / 1000).toFixed(1)}k` : `${val}`)}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const p = payload[0].payload;
                  return (
                    <div className="rounded-lg border border-slate-200 bg-white p-2.5 shadow-md text-xs dark:border-slate-700 dark:bg-slate-800">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {p.rawPriority.replace("_", " ")}
                      </div>
                      <div className="mt-1 text-slate-500 dark:text-slate-300">
                        Incidents: <span className="font-semibold text-slate-900 dark:text-white">{p.count.toLocaleString()}</span>
                      </div>
                      <div className="text-slate-500 dark:text-slate-300">
                        Share: <span className="font-semibold text-slate-900 dark:text-white">{p.percentage}%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={PRIORITY_COLORS[entry.rawPriority] || "#3b82f6"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
