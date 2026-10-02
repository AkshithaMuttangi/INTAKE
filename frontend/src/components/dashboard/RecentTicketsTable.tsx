import React from "react";
import { Link } from "react-router-dom";
import { StatusBadge } from "../ui/StatusBadge";
import { PriorityBadge } from "../ui/PriorityBadge";
import { SlaTimer } from "../ui/SlaTimer";
import type { TicketListItem } from "../../types/ticket";
import { ChevronRight, Inbox } from "lucide-react";

interface RecentTicketsTableProps {
  title: string;
  subtitle?: string;
  tickets: TicketListItem[];
  viewAllLink?: string;
  showAssignee?: boolean;
}

export const RecentTicketsTable: React.FC<RecentTicketsTableProps> = ({
  title,
  subtitle,
  tickets,
  viewAllLink = "/tickets",
  showAssignee = false,
}) => {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{subtitle}</p>
          )}
        </div>
        <Link
          to={viewAllLink}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          View all
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Content */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
            <Inbox className="h-5 w-5" />
          </div>
          <p className="mt-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            No tickets found in this queue
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th className="py-2.5 pl-5 pr-3">Ticket #</th>
                <th className="py-2.5 px-3">Title</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">SLA Status</th>
                {showAssignee && <th className="py-2.5 px-3">Assignee</th>}
                <th className="py-2.5 pr-5 pl-3 text-right">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((ticket) => {
                const isResolved =
                  ticket.status === "RESOLVED" || ticket.status === "CLOSED";
                const createdDate = new Date(ticket.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr
                    key={ticket.id}
                    className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                  >
                    <td className="py-3 pl-5 pr-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="hover:underline"
                      >
                        {ticket.ticketNumber}
                      </Link>
                    </td>
                    <td className="py-3 px-3 max-w-xs truncate font-medium text-slate-900 group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                      <Link to={`/tickets/${ticket.id}`} className="truncate">
                        {ticket.title}
                      </Link>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <PriorityBadge priority={ticket.priority} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <StatusBadge status={ticket.status} size="sm" />
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <SlaTimer
                        dueAt={ticket.resolveDueAt}
                        isBreached={ticket.slaBreached}
                        isResolved={isResolved}
                      />
                    </td>
                    {showAssignee && (
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {ticket.assignee ? ticket.assignee.name : "Unassigned"}
                      </td>
                    )}
                    <td className="py-3 pr-5 pl-3 text-right text-slate-400 whitespace-nowrap">
                      {createdDate}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
