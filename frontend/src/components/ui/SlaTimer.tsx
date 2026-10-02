import React, { useSyncExternalStore } from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

interface SlaTimerProps {
  dueAt: string | Date;
  isBreached?: boolean;
  isResolved?: boolean;
  className?: string;
}

// 30-second tick subscription using React 19 useSyncExternalStore
const subscribe = (callback: () => void) => {
  const interval = setInterval(callback, 30000);
  return () => clearInterval(interval);
};

const getSnapshot = () => Date.now();
const getServerSnapshot = () => 0;

export const SlaTimer: React.FC<SlaTimerProps> = ({
  dueAt,
  isBreached = false,
  isResolved = false,
  className = "",
}) => {
  // Retrieves current timestamp from the external store to ensure render purity
  const now = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (isResolved) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ${className}`}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
        <span>SLA Met</span>
      </span>
    );
  }

  const targetTime = new Date(dueAt).getTime();
  const diffMs = targetTime - (now || targetTime);

  const hasBreached = isBreached || (now > 0 && diffMs <= 0);

  if (hasBreached) {
    const overdueMinutes = Math.abs(Math.floor(diffMs / (1000 * 60)));
    const overdueHours = Math.floor(overdueMinutes / 60);
    const overdueText =
      overdueHours > 0
        ? `${overdueHours}h ${overdueMinutes % 60}m overdue`
        : `${overdueMinutes}m overdue`;

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 dark:border-rose-800 dark:bg-rose-950/50 dark:text-rose-300 ${className}`}
      >
        <AlertTriangle className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
        <span>Breached ({overdueText})</span>
      </span>
    );
  }

  // Active countdown
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const days = Math.floor(hours / 24);

  const formattedTime =
    days > 0
      ? `${days}d ${hours % 24}h left`
      : hours > 0
      ? `${hours}h ${minutes}m left`
      : `${minutes}m left`;

  // Imminent warning if under 1 hour remaining
  const isImminent = diffMs <= 60 * 60 * 1000;

  if (isImminent) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300 ${className}`}
      >
        <Clock className="h-3.5 w-3.5 text-amber-500" />
        <span>Imminent ({formattedTime})</span>
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 ${className}`}
    >
      <Clock className="h-3.5 w-3.5 text-slate-500" />
      <span>{formattedTime}</span>
    </span>
  );
};
