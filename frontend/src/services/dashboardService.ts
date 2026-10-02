import { api } from "./api";
import { TicketService } from "./ticketService";
import type { ApiResponse } from "../types/api";
import type {
  DashboardAnalyticsData,
  AgentWorkloadItem,
  EndUserDashboardData,
  AgentDashboardData,
  TeamLeadDashboardData,
  AdminDashboardData,
} from "../types/dashboard";

export class DashboardService {
  /**
   * Fetches high-level incident KPIs and distribution metrics from backend.
   * Authorized for SUPPORT_AGENT, TEAM_LEAD, and ADMIN.
   */
  public static async getAnalyticsDashboard(): Promise<DashboardAnalyticsData> {
    const response = await api.get<ApiResponse<DashboardAnalyticsData>>("/analytics/dashboard");
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to load analytics metrics");
    }
    return response.data.data;
  }

  /**
   * Fetches agent workload balancing metrics from backend.
   * Authorized for TEAM_LEAD and ADMIN.
   */
  public static async getWorkloadMetrics(): Promise<AgentWorkloadItem[]> {
    const response = await api.get<ApiResponse<AgentWorkloadItem[]>>("/tickets/workload");
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to load workload metrics");
    }
    return response.data.data;
  }

  /**
   * Aggregates personal ticket metrics for END_USER.
   * Scoped automatically by backend to the authenticated user's ID.
   */
  public static async getEndUserDashboardData(): Promise<EndUserDashboardData> {
    const [totalRes, openRes, pendingRes, resolvedRes, recentRes] = await Promise.all([
      TicketService.getTickets({ limit: 1 }),
      TicketService.getTickets({ status: "OPEN", limit: 1 }),
      TicketService.getTickets({ status: "PENDING_CUSTOMER", limit: 1 }),
      TicketService.getTickets({ status: "RESOLVED", limit: 1 }),
      TicketService.getTickets({ limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    ]);

    return {
      totalTickets: totalRes.pagination.total,
      openTickets: openRes.pagination.total,
      pendingCustomerTickets: pendingRes.pagination.total,
      resolvedTickets: resolvedRes.pagination.total,
      recentTickets: recentRes.data,
    };
  }

  /**
   * Aggregates personal operations queue data for SUPPORT_AGENT.
   */
  public static async getAgentDashboardData(agentId: string): Promise<AgentDashboardData> {
    const [
      totalRes,
      openRes,
      inProgressRes,
      pendingRes,
      breachedRes,
      recentRes,
      analyticsData,
    ] = await Promise.all([
      TicketService.getTickets({ assigneeId: agentId, limit: 1 }),
      TicketService.getTickets({ assigneeId: agentId, status: "OPEN", limit: 1 }),
      TicketService.getTickets({ assigneeId: agentId, status: "IN_PROGRESS", limit: 1 }),
      TicketService.getTickets({ assigneeId: agentId, status: "PENDING_CUSTOMER", limit: 1 }),
      TicketService.getTickets({ assigneeId: agentId, slaBreached: true, limit: 1 }),
      TicketService.getTickets({ assigneeId: agentId, limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
      DashboardService.getAnalyticsDashboard().catch(() => null),
    ]);

    return {
      assignedTotal: totalRes.pagination.total,
      assignedOpen: openRes.pagination.total,
      assignedInProgress: inProgressRes.pagination.total,
      assignedPending: pendingRes.pagination.total,
      assignedBreached: breachedRes.pagination.total,
      recentAssigned: recentRes.data,
      analytics: analyticsData,
    };
  }

  /**
   * Aggregates department metrics and workload balance for TEAM_LEAD.
   */
  public static async getTeamLeadDashboardData(): Promise<TeamLeadDashboardData> {
    const [analytics, workload, escalationsRes] = await Promise.all([
      DashboardService.getAnalyticsDashboard(),
      DashboardService.getWorkloadMetrics(),
      TicketService.getTickets({ slaBreached: true, limit: 5, sortBy: "resolveDueAt", sortOrder: "asc" }),
    ]);

    return {
      analytics,
      workload,
      recentEscalations: escalationsRes.data,
    };
  }

  /**
   * Aggregates global system health and critical ticket feed for ADMIN.
   */
  public static async getAdminDashboardData(): Promise<AdminDashboardData> {
    const [analytics, workload, criticalRes] = await Promise.all([
      DashboardService.getAnalyticsDashboard(),
      DashboardService.getWorkloadMetrics(),
      TicketService.getTickets({ priority: "P1_CRITICAL", limit: 5, sortBy: "createdAt", sortOrder: "desc" }),
    ]);

    return {
      analytics,
      workload,
      criticalTickets: criticalRes.data,
    };
  }
}
