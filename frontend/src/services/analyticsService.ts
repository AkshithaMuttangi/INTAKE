import { api } from "./api";
import type { ApiResponse } from "../types/api";
import type { DashboardAnalyticsData } from "../types/dashboard";

export class AnalyticsService {
  /**
   * Fetches high-level incident KPIs and chart time-series data from backend.
   * Authorized for SUPPORT_AGENT, TEAM_LEAD, and ADMIN.
   */
  public static async getDashboardMetrics(): Promise<DashboardAnalyticsData> {
    const response = await api.get<ApiResponse<DashboardAnalyticsData>>("/analytics/dashboard");
    if (!response.data.data) {
      throw new Error(response.data.message || "Failed to load incident analytics telemetry");
    }
    return response.data.data;
  }
}
