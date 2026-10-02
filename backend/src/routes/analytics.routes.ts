import { Router } from "express";
import { Role } from "@prisma/client";
import { AnalyticsController } from "../controllers/analytics.controller";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";

const router = Router();

router.get(
  "/dashboard",
  authenticateJWT,
  authorizeRoles([Role.SUPPORT_AGENT, Role.TEAM_LEAD, Role.ADMIN]),
  AnalyticsController.getDashboardMetrics
);

export default router;
