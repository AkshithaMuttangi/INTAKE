import cron, { ScheduledTask } from "node-cron";
import { SlaService } from "../services/sla.service";
import { logger } from "../utils/logger";

let task: ScheduledTask | null = null;

export const startSlaDaemon = (): ScheduledTask => {
  logger.info("Initializing automated SLA deadline tracking daemon (running every minute)...");

  // Run every minute: "*/1 * * * *"
  task = cron.schedule("*/1 * * * *", async () => {
    try {
      logger.debug("SLA daemon running breach evaluation cycle...");
      const breachedCount = await SlaService.checkAndProcessSlaBreaches();
      if (breachedCount > 0) {
        logger.warn(`SLA daemon cycle completed: ${breachedCount} tickets marked breached`);
      }
    } catch (error: any) {
      logger.error(`SLA daemon cycle error: ${error.message}`);
    }
  });

  return task;
};

export const stopSlaDaemon = (): void => {
  if (task) {
    task.stop();
    logger.info("SLA daemon stopped");
  }
};
