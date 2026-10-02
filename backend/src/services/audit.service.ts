import { AuditAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";

export class AuditService {
  /**
   * Appends an immutable audit entry to the ticket history.
   * This table is append-only by design to ensure compliance and traceability.
   */
  public static async record({
    ticketId,
    performedById,
    action,
    oldValue,
    newValue,
  }: {
    ticketId: string;
    performedById: string;
    action: AuditAction;
    oldValue?: string | null;
    newValue?: string | null;
  }) {
    try {
      const log = await prisma.auditLog.create({
        data: {
          ticketId,
          performedById,
          action,
          oldValue: oldValue || null,
          newValue: newValue || null,
        },
      });

      logger.info(`Audit log recorded for ticket ${ticketId}`, {
        ticketId,
        action,
        performedById,
      });

      return log;
    } catch (error: any) {
      logger.error(`Failed to record audit log for ticket ${ticketId}: ${error.message}`);
      // Do not block the main transaction if an audit failure occurs, but log critical failure
      return null;
    }
  }

  public static async getTicketHistory(ticketId: string) {
    return prisma.auditLog.findMany({
      where: { ticketId },
      include: {
        performedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });
  }
}
