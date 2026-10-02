import React, { useState } from "react";
import type { AuditLogEntry, AuditAction } from "../../types/ticket";
import {
  ShieldCheck,
  PlusCircle,
  ArrowRightCircle,
  AlertTriangle,
  UserCheck,
  MessageSquare,
  Paperclip,
  ArrowRight,
  ArrowUpDown,
} from "lucide-react";

interface AuditTimelineProps {
  auditLogs: AuditLogEntry[];
}

const actionConfig: Record<
  AuditAction,
  { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  TICKET_CREATED: {
    label: "Ticket Created",
    icon: PlusCircle,
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  STATUS_CHANGE: {
    label: "Status Transition",
    icon: ArrowRightCircle,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  PRIORITY_UPDATE: {
    label: "Priority Modified",
    icon: AlertTriangle,
    color: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800",
  },
  REASSIGNMENT: {
    label: "Assignee Updated",
    icon: UserCheck,
    color: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800",
  },
  COMMENT_ADDED: {
    label: "Comment Logged",
    icon: MessageSquare,
    color: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
  },
  ATTACHMENT_ADDED: {
    label: "Attachment Uploaded",
    icon: Paperclip,
    color: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
};

export const AuditTimeline: React.FC<AuditTimelineProps> = ({ auditLogs }) => {
  const [sortDescending, setSortDescending] = useState<boolean>(true);

  const sortedLogs = [...auditLogs].sort((a, b) => {
    const diff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    return sortDescending ? diff : -diff;
  });

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-slate-200 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Immutable Audit Ledger
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Tamper-evident chronological record of all state transitions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Append-Only
          </span>
          <button
            type="button"
            onClick={() => setSortDescending(!sortDescending)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            title="Toggle chronological order"
          >
            <ArrowUpDown className="h-3 w-3" />
            <span>{sortDescending ? "Newest First" : "Oldest First"}</span>
          </button>
        </div>
      </div>

      {/* Timeline Stream */}
      {sortedLogs.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500">
          No audit entries recorded for this ticket.
        </div>
      ) : (
        <div className="p-5">
          <div className="relative border-l border-slate-200 pl-6 dark:border-slate-800 space-y-6">
            {sortedLogs.map((log) => {
              const config = actionConfig[log.action] || actionConfig.TICKET_CREATED;
              const Icon = config.icon;
              const formattedDate = new Date(log.timestamp).toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                second: "2-digit",
              });

              return (
                <div key={log.id} className="relative group">
                  {/* Timeline Node Icon */}
                  <div
                    className={`absolute -left-[37px] top-0 flex h-6 w-6 items-center justify-center rounded-full border ${config.color}`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>

                  {/* Entry Header */}
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        {config.label}
                      </span>
                      <span className="text-[11px] text-slate-400">by</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {log.performedBy.name}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.2 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {log.performedBy.role}
                      </span>
                    </div>
                    <time className="font-mono text-[11px] text-slate-400">
                      {formattedDate}
                    </time>
                  </div>

                  {/* Before / After Diff or Action Detail */}
                  <div className="mt-2 rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 text-xs text-slate-700 dark:border-slate-800/60 dark:bg-slate-800/40 dark:text-slate-300">
                    {log.oldValue && log.newValue ? (
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className="rounded bg-rose-50 px-2 py-0.5 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 line-through">
                          {log.oldValue}
                        </span>
                        <ArrowRight className="h-3 w-3 text-slate-400" />
                        <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {log.newValue}
                        </span>
                      </div>
                    ) : (
                      <p className="text-xs">{log.newValue || "Action recorded"}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
