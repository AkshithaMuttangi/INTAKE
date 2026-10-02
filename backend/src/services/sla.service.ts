import { Priority, Status, Role, AuditAction } from "@prisma/client";
import { prisma } from "../config/prisma";
import { logger } from "../utils/logger";
import { AuditService } from "./audit.service";

export const SLA_TARGETS: Record<Priority, { responseHours: number; resolveHours: number }> = {
  [Priority.P1_CRITICAL]: { responseHours: 1, resolveHours: 4 },
  [Priority.P2_HIGH]: { responseHours: 2, resolveHours: 8 },
  [Priority.P3_MEDIUM]: { responseHours: 4, resolveHours: 24 },
  [Priority.P4_LOW]: { responseHours: 8, resolveHours: 48 },
};

export class SlaService {
  /**
   * Calculates responseDueAt and resolveDueAt based on ticket priority and creation time.
   */
  public static calculateDeadlines(priority: Priority, createdAt: Date = new Date()) {
    const targets = SLA_TARGETS[priority] || SLA_TARGETS[Priority.P3_MEDIUM];
    const createdTimeMs = createdAt.getTime();

    const responseDueAt = new Date(createdTimeMs + targets.responseHours * 3600 * 1000);
    const resolveDueAt = new Date(createdTimeMs + targets.resolveHours * 3600 * 1000);

    return { responseDueAt, resolveDueAt };
  }

  /**
   * Workload Balancing Algorithm:
   * Finds the active SUPPORT_AGENT with the lowest number of unresolved tickets.
   */
  public static async assignTicketToLeastBusyAgent(
    department?: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _category?: string
  ): Promise<string | null> {
    try {
      // 1. Query candidate agents
      let agents = await prisma.user.findMany({
        where: {
          role: Role.SUPPORT_AGENT,
          ...(department ? { department } : {}),
        },
        select: { id: true, name: true, department: true },
      });

      // Fallback to any support agent if department has no specific agent assigned
      if (agents.length === 0) {
        agents = await prisma.user.findMany({
          where: { role: Role.SUPPORT_AGENT },
          select: { id: true, name: true, department: true },
        });
      }

      if (agents.length === 0) {
        return null;
      }

      // 2. Count active unresolved tickets per agent using grouped aggregate
      const openStatuses: Status[] = [
        Status.OPEN,
        Status.IN_PROGRESS,
        Status.PENDING_CUSTOMER,
      ];

      const agentTicketCounts = await prisma.ticket.groupBy({
        by: ["assigneeId"],
        where: {
          assigneeId: { in: agents.map((a) => a.id) },
          status: { in: openStatuses },
        },
        _count: {
          id: true,
        },
      });

      const countMap = new Map<string, number>();
      for (const a of agents) {
        countMap.set(a.id, 0);
      }
      for (const group of agentTicketCounts) {
        if (group.assigneeId) {
          countMap.set(group.assigneeId, group._count.id);
        }
      }

      // Sort by open ticket count ascending
      agents.sort((a, b) => (countMap.get(a.id) || 0) - (countMap.get(b.id) || 0));

      const leastBusy = agents[0];
      logger.info(`Workload balance selected agent ${leastBusy.name} (${leastBusy.id}) with ${countMap.get(leastBusy.id)} open tickets`);

      return leastBusy.id;
    } catch (error: any) {
      logger.error(`Error in workload balancing algorithm: ${error.message}`);
      return null;
    }
  }

  /**
   * Scans for tickets whose resolve deadline has passed without resolution,
   * updates slaBreached flag, and writes an audit log.
   */
  public static async checkAndProcessSlaBreaches(): Promise<number> {
    const now = new Date();
    const openStatuses: Status[] = [
      Status.OPEN,
      Status.IN_PROGRESS,
      Status.PENDING_CUSTOMER,
    ];

    try {
      // Find breached tickets using the composite index [slaBreached, status]
      const breachedTickets = await prisma.ticket.findMany({
        where: {
          slaBreached: false,
          status: { in: openStatuses },
          resolveDueAt: { lt: now },
        },
        select: { id: true, ticketNumber: true, resolveDueAt: true, creatorId: true },
        take: 200, // Batch limit per cycle
      });

      if (breachedTickets.length === 0) {
        return 0;
      }

      const ticketIds = breachedTickets.map((t) => t.id);

      // Batch update breach status
      await prisma.ticket.updateMany({
        where: { id: { in: ticketIds } },
        data: { slaBreached: true },
      });

      // Write audit entries for each breach
      for (const ticket of breachedTickets) {
        await AuditService.record({
          ticketId: ticket.id,
          performedById: ticket.creatorId,
          action: AuditAction.STATUS_CHANGE,
          oldValue: "SLA_HEALTHY",
          newValue: `SLA_BREACHED: Deadline passed at ${ticket.resolveDueAt.toISOString()}`,
        });
      }

      logger.warn(`SLA daemon detected and flagged ${breachedTickets.length} SLA breaches`);
      return breachedTickets.length;
    } catch (error: any) {
      logger.error(`Error processing SLA breaches: ${error.message}`);
      return 0;
    }
  }
}
