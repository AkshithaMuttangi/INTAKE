import React from "react";
import { Link } from "react-router-dom";
import { MessageSquare, Paperclip, User, ChevronRight } from "lucide-react";
import { StatusBadge } from "../ui/StatusBadge";
import { PriorityBadge } from "../ui/PriorityBadge";
import { SlaTimer } from "../ui/SlaTimer";
import type { TicketListItem } from "../../types/ticket";

interface TicketTableProps {
  tickets: TicketListItem[];
  isLoading: boolean;
}

export const TicketTable: React.FC<TicketTableProps> = ({ tickets, isLoading }) => {
  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-64 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-20 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-5 w-28 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          {/* Table Header */}
          <thead className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-400">
            <tr>
              <th className="py-3 pl-4 pr-3 sm:pl-6">Ticket #</th>
              <th className="py-3 px-3">Title & Details</th>
              <th className="py-3 px-3">Priority</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">SLA Target</th>
              <th className="py-3 px-3">Assignee</th>
              <th className="py-3 px-3">Category</th>
              <th className="py-3 pr-4 pl-3 text-right sm:pr-6">Created</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {tickets.map((ticket) => {
              const createdDate = new Date(ticket.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              const isResolved =
                ticket.status === "RESOLVED" || ticket.status === "CLOSED";

              return (
                <tr
                  key={ticket.id}
                  className="group transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                >
                  {/* Ticket Number */}
                  <td className="py-3.5 pl-4 pr-3 sm:pl-6">
                    <Link
                      to={`/tickets/${ticket.id}`}
                      className="font-mono text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {ticket.ticketNumber}
                    </Link>
                  </td>

                  {/* Title & Metadata */}
                  <td className="py-3.5 px-3">
                    <div className="flex flex-col">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="font-medium text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400 line-clamp-1"
                      >
                        {ticket.title}
                      </Link>
                      <div className="mt-1 flex items-center gap-3 text-xs text-slate-400">
                        <span>By {ticket.creator.name}</span>
                        {ticket._count.comments > 0 && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <MessageSquare className="h-3 w-3" />
                            {ticket._count.comments}
                          </span>
                        )}
                        {ticket._count.attachments > 0 && (
                          <span className="flex items-center gap-1 text-[11px]">
                            <Paperclip className="h-3 w-3" />
                            {ticket._count.attachments}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Priority Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <PriorityBadge priority={ticket.priority} size="sm" />
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <StatusBadge status={ticket.status} size="sm" />
                  </td>

                  {/* SLA Countdown Timer */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <SlaTimer
                      dueAt={ticket.resolveDueAt}
                      isBreached={ticket.slaBreached}
                      isResolved={isResolved}
                    />
                  </td>

                  {/* Assignee */}
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {ticket.assignee ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                          {ticket.assignee.name.charAt(0)}
                        </div>
                        <span className="line-clamp-1">{ticket.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                        <User className="h-3 w-3" />
                        Unassigned
                      </span>
                    )}
                  </td>

                  {/* Category */}
                  <td className="py-3.5 px-3 whitespace-nowrap text-xs text-slate-600 dark:text-slate-400">
                    {ticket.category}
                  </td>

                  {/* Creation Date & Row Action */}
                  <td className="py-3.5 pr-4 pl-3 text-right sm:pr-6 whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {createdDate}
                      </span>
                      <Link
                        to={`/tickets/${ticket.id}`}
                        aria-label={`View ticket ${ticket.ticketNumber}`}
                        className="rounded p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
