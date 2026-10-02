import app from "./app";
import { logger } from "./utils/logger";
import { startSlaDaemon, stopSlaDaemon } from "./cron/slaBreachDaemon";
import { prisma, pool } from "./config/prisma";

const PORT = parseInt(process.env.PORT || "5000", 10);

const server = app.listen(PORT, () => {
  logger.info(`==================================================`);
  logger.info(`🚀 INTAKE Service Desk API running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`   Database: PostgreSQL 18 (Active)`);
  logger.info(`==================================================`);

  // Start automated SLA deadline tracking background daemon
  startSlaDaemon();
});

// Graceful Shutdown Handling
const handleShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Initiating graceful shutdown...`);
  stopSlaDaemon();

  server.close(async () => {
    logger.info("HTTP server closed.");
    try {
      await prisma.$disconnect();
      await pool.end();
      logger.info("Database connection pools closed successfully.");
      process.exit(0);
    } catch (err: any) {
      logger.error(`Error during graceful shutdown: ${err.message}`);
      process.exit(1);
    }
  });

  // Force shutdown after 10s if dangling connections remain
  setTimeout(() => {
    logger.error("Forced shutdown due to timeout.");
    process.exit(1);
  }, 10000);
};

process.on("SIGTERM", () => handleShutdown("SIGTERM"));
process.on("SIGINT", () => handleShutdown("SIGINT"));

export default server;
