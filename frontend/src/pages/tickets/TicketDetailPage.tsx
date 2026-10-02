import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { TicketService } from "../../services/ticketService";
import { DashboardService } from "../../services/dashboardService";
import type { TicketDetail } from "../../types/ticket";
import type { AgentWorkloadItem } from "../../types/dashboard";
import type { TicketPriority, TicketStatus } from "../../types/api";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { PriorityBadge } from "../../components/ui/PriorityBadge";
import { SlaTimer } from "../../components/ui/SlaTimer";
import { AuditTimeline } from "../../components/tickets/AuditTimeline";
import { CommentSection } from "../../components/tickets/CommentSection";
import { AttachmentSection } from "../../components/tickets/AttachmentSection";
import {
  ChevronLeft,
  Calendar,
  User,
  Clock,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Folder,
} from "lucide-react";

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, isEndUser, isTeamLead, isAdmin } = useAuth();

  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [availableAgents, setAvailableAgents] = useState<AgentWorkloadItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotFound, setIsNotFound] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const [reloadTrigger, setReloadTrigger] = useState<number>(0);

  const canManageLifecycle = !isEndUser;
  const canReassign = isTeamLead || isAdmin;

  const handleRetry = useCallback(() => {
    setIsLoading(true);
    setReloadTrigger((prev) => prev + 1);
  }, []);

  // Load ticket details and agent list if authorized
  useEffect(() => {
    let isMounted = true;

    const fetchTicket = async () => {
      if (!id) return;

      try {
        const ticketData = await TicketService.getTicketById(id);
        if (isMounted) {
          setTicket(ticketData);
          setError(null);
          setIsNotFound(false);
        }

        // If supervisor role, load agent list for reassignment options
        if (canReassign) {
          try {
            const agents = await DashboardService.getWorkloadMetrics();
            if (isMounted) setAvailableAgents(agents);
          } catch {
            // Non-critical, continue
          }
        }
      } catch (err: unknown) {
        if (isMounted) {
          const apiErr = err as {
            response?: { status?: number; data?: { error?: { message?: string } } };
            message?: string;
          };
          if (apiErr.response?.status === 404) {
            setIsNotFound(true);
          } else {
            setError(
              apiErr.response?.data?.error?.message ||
              apiErr.message ||
              "Failed to load ticket details."
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTicket();

    return () => {
      isMounted = false;
    };
  }, [id, canReassign, reloadTrigger]);

  // Auto-clear feedback notification
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  // Lifecycle Mutations
  const handleStatusChange = async (newStatus: TicketStatus) => {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      await TicketService.updateStatus(ticket.id, newStatus);
      const refreshed = await TicketService.getTicketById(ticket.id);
      setTicket(refreshed);
      setFeedback({ type: "success", message: `Status updated to ${newStatus}` });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setFeedback({
        type: "error",
        message: apiErr.response?.data?.error?.message || "Failed to update status",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePriorityChange = async (newPriority: TicketPriority) => {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      await TicketService.updatePriority(ticket.id, newPriority);
      const refreshed = await TicketService.getTicketById(ticket.id);
      setTicket(refreshed);
      setFeedback({ type: "success", message: `Priority updated to ${newPriority}` });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setFeedback({
        type: "error",
        message: apiErr.response?.data?.error?.message || "Failed to update priority",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReassign = async (newAssigneeId: string) => {
    if (!ticket || isUpdating) return;
    setIsUpdating(true);
    setFeedback(null);

    try {
      const assigneeValue = newAssigneeId === "unassigned" ? null : newAssigneeId;
      await TicketService.reassignTicket(ticket.id, assigneeValue);
      const refreshed = await TicketService.getTicketById(ticket.id);
      setTicket(refreshed);
      setFeedback({ type: "success", message: "Ticket assignee updated successfully" });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      setFeedback({
        type: "error",
        message: apiErr.response?.data?.error?.message || "Failed to reassign ticket",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCommentAdded = async () => {
    if (!ticket) return;
    // Refresh to update comments list, count, and immutable audit logs
    const refreshed = await TicketService.getTicketById(ticket.id);
    setTicket(refreshed);
    setFeedback({ type: "success", message: "Comment recorded successfully" });
  };

  const handleAttachmentUploaded = async () => {
    if (!ticket) return;
    // Refresh to update attachments and immutable audit logs
    const refreshed = await TicketService.getTicketById(ticket.id);
    setTicket(refreshed);
    setFeedback({ type: "success", message: "File attached successfully" });
  };

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
          <div className="h-5 w-48 rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-44 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
            <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
          </div>
          <div className="space-y-6">
            <div className="h-72 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
            <div className="h-64 rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Not Found State
  if (isNotFound) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <AlertTriangle className="h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Ticket Not Found
        </h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          The requested ticket does not exist or you do not have permission to view it.
        </p>
        <Link
          to="/tickets"
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Return to Ticket Queue</span>
        </Link>
      </div>
    );
  }

  // Error State
  if (error || !ticket) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
        <h3 className="text-sm font-bold">Failed to load ticket inspector</h3>
        <p className="mt-1 text-xs text-rose-600 dark:text-rose-300">
          {error || "An unexpected error occurred while communicating with the service desk."}
        </p>
        <button
          type="button"
          onClick={handleRetry}
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const isResolved = ticket.status === "RESOLVED" || ticket.status === "CLOSED";
  const createdDate = new Date(ticket.createdAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const updatedDate = new Date(ticket.updatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

  return (
    <div className="space-y-6">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/tickets"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to Ticket Queue</span>
        </Link>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`mt-3 flex items-center justify-between rounded-lg p-3 text-xs ${
              feedback.type === "success"
                ? "border border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "border border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === "success" ? (
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                {ticket.ticketNumber}
              </span>
              <StatusBadge status={ticket.status} size="sm" />
              <PriorityBadge priority={ticket.priority} size="sm" />
              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <Folder className="h-3 w-3" />
                {ticket.category}
              </span>
            </div>
            <h1 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {ticket.title}
            </h1>
          </div>

          {/* SLA Timer Pill */}
          <div className="self-start sm:self-center">
            <SlaTimer
              dueAt={ticket.resolveDueAt}
              isBreached={ticket.slaBreached}
              isResolved={isResolved}
            />
          </div>
        </div>
      </div>

      {/* Main 2-Column Inspector Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols wide): Description, Comments, Attachments */}
        <div className="space-y-6 lg:col-span-2">
          {/* Incident Description */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Incident Description
            </h2>
            <div className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-slate-800 dark:text-slate-200">
              {ticket.description}
            </div>
          </div>

          {/* Conversation & Internal Notes */}
          <CommentSection
            ticketId={ticket.id}
            comments={ticket.comments}
            userRole={user?.role || "END_USER"}
            onCommentAdded={handleCommentAdded}
          />

          {/* Attachment Repository */}
          <AttachmentSection
            ticketId={ticket.id}
            attachments={ticket.attachments}
            onAttachmentUploaded={handleAttachmentUploaded}
          />
        </div>

        {/* Right Column: Metadata, Lifecycle Actions, and Immutable Audit Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Incident Metadata
            </h3>

            <div className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
              {/* Creator */}
              <div className="flex items-center justify-between py-2.5 first:pt-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  Creator
                </span>
                <div className="text-right">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {ticket.creator.name}
                  </div>
                  <div className="text-[11px] text-slate-400">{ticket.creator.department}</div>
                </div>
              </div>

              {/* Assignee */}
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <User className="h-3.5 w-3.5" />
                  Assignee
                </span>
                <div className="text-right">
                  {ticket.assignee ? (
                    <>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {ticket.assignee.name}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {ticket.assignee.department}
                      </div>
                    </>
                  ) : (
                    <span className="font-medium text-amber-600 dark:text-amber-400">
                      Unassigned
                    </span>
                  )}
                </div>
              </div>

              {/* Created */}
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Calendar className="h-3.5 w-3.5" />
                  Created
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {createdDate}
                </span>
              </div>

              {/* Last Updated */}
              <div className="flex items-center justify-between py-2.5">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <RotateCcw className="h-3.5 w-3.5" />
                  Updated
                </span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {updatedDate}
                </span>
              </div>

              {/* SLA Target Deadline */}
              <div className="flex items-center justify-between py-2.5 last:pb-0">
                <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5" />
                  Resolution SLA
                </span>
                <span
                  className={`font-mono font-semibold ${
                    ticket.slaBreached
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {new Date(ticket.resolveDueAt).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Lifecycle Action Panel (Authorized Staff Roles Only) */}
          {canManageLifecycle && (
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Incident Lifecycle Controls
              </h3>

              <div className="mt-4 space-y-4">
                {/* Status Transition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Transition Status
                  </label>
                  <select
                    value={ticket.status}
                    disabled={isUpdating}
                    onChange={(e) => handleStatusChange(e.target.value as TicketStatus)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="PENDING_CUSTOMER">Pending Customer</option>
                    <option value="RESOLVED">Resolved</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>

                {/* Priority Transition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Modify Severity Priority
                  </label>
                  <select
                    value={ticket.priority}
                    disabled={isUpdating}
                    onChange={(e) => handlePriorityChange(e.target.value as TicketPriority)}
                    className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option value="P1_CRITICAL">P1 - Critical</option>
                    <option value="P2_HIGH">P2 - High</option>
                    <option value="P3_MEDIUM">P3 - Medium</option>
                    <option value="P4_LOW">P4 - Low</option>
                  </select>
                </div>

                {/* Reassignment Control (Team Lead and Admin Only) */}
                {canReassign && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Assignee Reallocation
                    </label>
                    <select
                      value={ticket.assigneeId || "unassigned"}
                      disabled={isUpdating}
                      onChange={(e) => handleReassign(e.target.value)}
                      className="mt-1 block w-full rounded-lg border border-slate-300 bg-white p-2 text-xs font-medium text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <option value="unassigned">-- Unassigned --</option>
                      {availableAgents.map((agent) => (
                        <option key={agent.id} value={agent.id}>
                          {agent.name} ({agent.department}) — {agent.activeTicketCount} active
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Immutable Audit Timeline */}
          <AuditTimeline auditLogs={ticket.auditLogs} />
        </div>
      </div>
    </div>
  );
};
