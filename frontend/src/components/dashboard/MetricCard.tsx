import React from "react";
import type { LucideIcon } from "lucide-react";

export type MetricColor = "blue" | "emerald" | "amber" | "rose" | "purple" | "indigo" | "slate";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  color?: MetricColor;
  badge?: {
    text: string;
    isPositive?: boolean;
  };
}

const colorStyles: Record<
  MetricColor,
  { bg: string; iconBg: string; iconText: string; text: string; border: string }
> = {
  blue: {
    bg: "bg-blue-50/50 dark:bg-blue-950/20",
    iconBg: "bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-400",
    iconText: "text-blue-600 dark:text-blue-400",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-100 dark:border-blue-900/30",
  },
  emerald: {
    bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
    iconBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-400",
    iconText: "text-emerald-600 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-300",
    border: "border-emerald-100 dark:border-emerald-900/30",
  },
  amber: {
    bg: "bg-amber-50/50 dark:bg-amber-950/20",
    iconBg: "bg-amber-100 text-amber-600 dark:bg-amber-900/60 dark:text-amber-400",
    iconText: "text-amber-600 dark:text-amber-400",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-100 dark:border-amber-900/30",
  },
  rose: {
    bg: "bg-rose-50/50 dark:bg-rose-950/20",
    iconBg: "bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-400",
    iconText: "text-rose-600 dark:text-rose-400",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-100 dark:border-rose-900/30",
  },
  purple: {
    bg: "bg-purple-50/50 dark:bg-purple-950/20",
    iconBg: "bg-purple-100 text-purple-600 dark:bg-purple-900/60 dark:text-purple-400",
    iconText: "text-purple-600 dark:text-purple-400",
    text: "text-purple-700 dark:text-purple-300",
    border: "border-purple-100 dark:border-purple-900/30",
  },
  indigo: {
    bg: "bg-indigo-50/50 dark:bg-indigo-950/20",
    iconBg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-400",
    iconText: "text-indigo-600 dark:text-indigo-400",
    text: "text-indigo-700 dark:text-indigo-300",
    border: "border-indigo-100 dark:border-indigo-900/30",
  },
  slate: {
    bg: "bg-slate-50/50 dark:bg-slate-800/40",
    iconBg: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    iconText: "text-slate-600 dark:text-slate-400",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-100 dark:border-slate-800",
  },
};

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  color = "blue",
  badge,
}) => {
  const styles = colorStyles[color];

  return (
    <div
      className={`relative overflow-hidden rounded-xl border ${styles.border} bg-white p-5 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          {title}
        </span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${styles.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        {badge && (
          <span
            className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-semibold ${
              badge.isPositive
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400"
                : "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400"
            }`}
          >
            {badge.text}
          </span>
        )}
      </div>

      {subtext && (
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{subtext}</p>
      )}
    </div>
  );
};
