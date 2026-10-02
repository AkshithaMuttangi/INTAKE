import { Router } from "express";
import authRoutes from "./auth.routes";
import ticketRoutes from "./ticket.routes";
import analyticsRoutes from "./analytics.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "INTAKE – Enterprise Service Desk API",
    timestamp: new Date().toISOString(),
  });
});

router.use("/auth", authRoutes);
router.use("/tickets", ticketRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
