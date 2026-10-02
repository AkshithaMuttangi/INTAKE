import { Response, NextFunction } from "express";
import { AnalyticsService } from "../services/analytics.service";
import { AuthenticatedRequest } from "../types";

export class AnalyticsController {
  public static async getDashboardMetrics(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data = await AnalyticsService.getDashboardMetrics();
      res.status(200).json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }
}
