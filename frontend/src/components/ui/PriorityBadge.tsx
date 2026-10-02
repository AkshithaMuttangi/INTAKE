import React from "react";
import type { TicketPriority } from "../../types/api";

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: "sm" | "md";
  className?: string;
}

const priorityConfig: Record<
  TicketPriority,
  { label: string; bg: string; text: string; border: string; indicator: string }
> = {
  P1_CRITICAL: {
    label: "P1 - Critical",
    bg: "bg-rose-50 dark:bg-rose-950/50",
    text: "text-rose-700 dark:text-rose-300",
    border: "border-rose-200 dark:border-rose-800",
    indicator: "bg-rose-600",
  },
  P2_HIGH: {
    label: "P2 - High",
    bg: "bg-orange-50 dark:bg-orange-950/50",
    text: "text-orange-700 dark:text-orange-300",
    border: "border-orange-200 dark:border-orange-800",
    indicator: "bg-orange-500",
  },
  P3_MEDIUM: {
    label: "P3 - Medium",
    bg: "bg-amber-50 dark:bg-amber-950/50",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    indicator: "bg-amber-500",
  },
  P4_LOW: {
    label: "P4 - Low",
    bg: "bg-slate-100 dark:bg-slate-800/80",
    text: "text-slate-700 dark:text-slate-300",
    border: "border-slate-200 dark:border-slate-700",
    indicator: "bg-slate-400",
  },
};

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  size = "md",
  className = "",
}) => {
  const config = priorityConfig[priority] || priorityConfig.P3_MEDIUM;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1.5"
      : "text-xs font-semibold px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-md border ${config.bg} ${config.text} ${config.border} ${sizeClasses} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.indicator}`} />
      <span>{config.label}</span>
    </span>
  );
};
