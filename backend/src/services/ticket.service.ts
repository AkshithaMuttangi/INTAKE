import { Priority, Status, Role, AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../middleware/errorHandler";
import { AuthUser, PaginatedResult, TicketFilterQuery } from "../types";
import { SlaService } from "./sla.service";
import { AuditService } from "./audit.service";
import { logger } from "../utils/logger";

export class TicketService {
  /**
   * Generates a unique, human-friendly enterprise ticket number e.g. INTAKE-1042
   */
  private static async generateTicketNumber(): Promise<string> {
    const count = await prisma.ticket.count();
    const nextNum = 10001 + count;
    return `INTAKE-${nextNum}`;
  }

  /**
   * High-Performance Paginated Query with Index Utilization.
   * Tailored for sub-100ms response times across 10k+ tickets.
   */
  public static async getTickets(
    filter: TicketFilterQuery,
    user: AuthUser
  ): Promise<PaginatedResult<any>> {
    const page = Math.max(1, filter.page || 1);
    const limit = Math.min(100, Math.max(1, filter.limit || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.TicketWhereInput = {};

    // 1. Role-based scoping
    if (user.role === Role.END_USER) {
      where.creatorId = user.id;
    } else if (filter.creatorId) {
      where.creatorId = filter.creatorId;
    }

    // 2. Exact match filters leveraging composite indexes
    if (filter.status) {
      where.status = filter.status as Status;
    }
    if (filter.priority) {
      where.priority = filter.priority as Priority;
    }
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.assigneeId) {
      where.assigneeId = filter.assigneeId === "unassigned" ? null : filter.assigneeId;
    }
    if (filter.slaBreached !== undefined) {
      where.slaBreached = filter.slaBreached;
    }

    // 3. Date range filter
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) {
        where.createdAt.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.createdAt.lte = new Date(filter.endDate);
      }
    }

    // 4. Indexed search: check ticketNumber (unique index) or search query in title
    if (filter.search && filter.search.trim()) {
      const searchTrimmed = filter.search.trim();
      if (searchTrimmed.toUpperCase().startsWith("INTAKE-")) {
        where.ticketNumber = { equals: searchTrimmed.toUpperCase() };
      } else {
        where.OR = [
          { ticketNumber: { contains: searchTrimmed, mode: "insensitive" } },
          { title: { contains: searchTrimmed, mode: "insensitive" } },
        ];
      }
    }

    // 5. Sort field
    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = filter.sortOrder || "desc";
    const orderBy: Prisma.TicketOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    const startTime = performance.now();

    // Run count and data query concurrently for optimal latency
    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          id: true,
          ticketNumber: true,
          title: true,
          priority: true,
          status: true,
          category: true,
          slaBreached: true,
          responseDueAt: true,
          resolveDueAt: true,
          resolvedAt: true,
          createdAt: true,
          updatedAt: true,
          creator: {
            select: { id: true, name: true, email: true, department: true },
          },
          assignee: {
            select: { id: true, name: true, email: true, department: true },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
      }),
    ]);

    const queryDuration = performance.now() - startTime;
    logger.debug(`Tickets query executed in ${queryDuration.toFixed(2)}ms (found ${total} records)`);

    const totalPages = Math.ceil(total / limit);

    return {
      data: tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * Retrieves single ticket with complete lifecycle history, attachments, and comments.
   */
  public static async getTicketById(ticketIdOrNumber: string, user: AuthUser) {
    const isNumber = ticketIdOrNumber.toUpperCase().startsWith("INTAKE-");
    const where: Prisma.TicketWhereUniqueInput = isNumber
      ? { ticketNumber: ticketIdOrNumber.toUpperCase() }
      : { id: ticketIdOrNumber };

    const ticket = await prisma.ticket.findUnique({
      where,
      include: {
        creator: {
          select: { id: true, name: true, email: true, department: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, department: true },
        },
        auditLogs: {
          include: {
            performedBy: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { timestamp: "desc" },
        },
        attachments: {
          include: {
            uploader: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
        comments: {
          where: user.role === Role.END_USER ? { isInternalOnly: false } : {},
          include: {
            author: {
              select: { id: true, name: true, email: true, role: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    // Role check: End user can only access their own tickets
    if (user.role === Role.END_USER && ticket.creatorId !== user.id) {
      throw new AppError("Forbidden: You cannot access tickets created by other users", 403, "FORBIDDEN");
    }

    return ticket;
  }

  /**
   * Creates ticket with automated SLA deadlines and automated workload-balanced assignment.
   */
  public static async createTicket({
    title,
    description,
    priority,
    category,
    creator,
  }: {
    title: string;
    description: string;
    priority: Priority;
    category: string;
    creator: AuthUser;
  }) {
    const ticketNumber = await this.generateTicketNumber();
    const { responseDueAt, resolveDueAt } = SlaService.calculateDeadlines(priority);

    // Dynamic workload balancing: attempt auto-assignment to least busy agent
    const assignedAgentId = await SlaService.assignTicketToLeastBusyAgent(
      creator.department,
      category
    );

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        title,
        description,
        priority,
        status: Status.OPEN,
        category,
        creatorId: creator.id,
        assigneeId: assignedAgentId,
        responseDueAt,
        resolveDueAt,
      },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    // Record initial creation in immutable audit log
    await AuditService.record({
      ticketId: ticket.id,
      performedById: creator.id,
      action: AuditAction.TICKET_CREATED,
      oldValue: null,
      newValue: `Created ticket ${ticketNumber} with priority ${priority}`,
    });

    if (assignedAgentId) {
      await AuditService.record({
        ticketId: ticket.id,
        performedById: creator.id,
        action: AuditAction.REASSIGNMENT,
        oldValue: "Unassigned",
        newValue: `Auto-assigned via Workload Balancer to Agent (${ticket.assignee?.name})`,
      });
    }

    return ticket;
  }

  /**
   * Updates ticket status with lifecycle resolution tracking and audit log.
   */
  public static async updateStatus(ticketId: string, newStatus: Status, user: AuthUser) {
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const now = new Date();
    const updateData: Prisma.TicketUpdateInput = {
      status: newStatus,
    };

    if (newStatus === Status.RESOLVED || newStatus === Status.CLOSED) {
      updateData.resolvedAt = now;
      if (now.getTime() > existing.resolveDueAt.getTime()) {
        updateData.slaBreached = true;
      }
    } else if (existing.status === Status.RESOLVED && newStatus !== Status.RESOLVED) {
      // Re-opening ticket
      updateData.resolvedAt = null;
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await AuditService.record({
      ticketId: updated.id,
      performedById: user.id,
      action: AuditAction.STATUS_CHANGE,
      oldValue: existing.status,
      newValue: newStatus,
    });

    return updated;
  }

  /**
   * Updates priority and recalculates SLA deadlines if still unresolved.
   */
  public static async updatePriority(ticketId: string, newPriority: Priority, user: AuthUser) {
    const existing = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!existing) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const updateData: Prisma.TicketUpdateInput = {
      priority: newPriority,
    };

    // If still open, recalculate resolve deadline from creation time
    if (existing.status !== Status.RESOLVED && existing.status !== Status.CLOSED) {
      const { responseDueAt, resolveDueAt } = SlaService.calculateDeadlines(
        newPriority,
        existing.createdAt
      );
      updateData.responseDueAt = responseDueAt;
      updateData.resolveDueAt = resolveDueAt;
      if (new Date().getTime() > resolveDueAt.getTime()) {
        updateData.slaBreached = true;
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
    });

    await AuditService.record({
      ticketId: updated.id,
      performedById: user.id,
      action: AuditAction.PRIORITY_UPDATE,
      oldValue: existing.priority,
      newValue: newPriority,
    });

    return updated;
  }

  /**
   * Reassigns ticket to a specified agent or unassigns it.
   */
  public static async reassignTicket(
    ticketId: string,
    newAssigneeId: string | null,
    user: AuthUser
  ) {
    const existing = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { assignee: true },
    });

    if (!existing) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    let newAssignee = null;
    if (newAssigneeId) {
      newAssignee = await prisma.user.findUnique({
        where: { id: newAssigneeId },
        select: { id: true, name: true, role: true },
      });
      if (!newAssignee) {
        throw new AppError("Assignee user not found", 404, "USER_NOT_FOUND");
      }
      if (newAssignee.role === Role.END_USER) {
        throw new AppError("Cannot assign tickets to End Users", 400, "INVALID_ASSIGNEE");
      }
    }

    const updated = await prisma.ticket.update({
      where: { id: ticketId },
      data: { assigneeId: newAssigneeId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    await AuditService.record({
      ticketId: updated.id,
      performedById: user.id,
      action: AuditAction.REASSIGNMENT,
      oldValue: existing.assignee ? existing.assignee.name : "Unassigned",
      newValue: newAssignee ? newAssignee.name : "Unassigned",
    });

    return updated;
  }

  /**
   * Adds conversation comment or internal support note.
   */
  public static async addComment({
    ticketId,
    author,
    content,
    isInternalOnly = false,
  }: {
    ticketId: string;
    author: AuthUser;
    content: string;
    isInternalOnly?: boolean;
  }) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    if (author.role === Role.END_USER && isInternalOnly) {
      throw new AppError("End Users cannot post internal-only notes", 403, "FORBIDDEN");
    }

    const comment = await prisma.comment.create({
      data: {
        ticketId,
        authorId: author.id,
        content,
        isInternalOnly,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    await AuditService.record({
      ticketId,
      performedById: author.id,
      action: AuditAction.COMMENT_ADDED,
      oldValue: null,
      newValue: isInternalOnly ? "Added internal note" : "Added public comment",
    });

    return comment;
  }

  /**
   * Attaches uploaded file metadata to ticket and logs audit trail.
   */
  public static async addAttachment({
    ticketId,
    uploader,
    file,
  }: {
    ticketId: string;
    uploader: AuthUser;
    file: Express.Multer.File;
  }) {
    const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) {
      throw new AppError("Ticket not found", 404, "TICKET_NOT_FOUND");
    }

    const attachment = await prisma.attachment.create({
      data: {
        ticketId,
        uploaderId: uploader.id,
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        filePath: file.path,
      },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
      },
    });

    await AuditService.record({
      ticketId,
      performedById: uploader.id,
      action: AuditAction.ATTACHMENT_ADDED,
      oldValue: null,
      newValue: `Uploaded file '${file.originalname}' (${(file.size / 1024).toFixed(1)} KB)`,
    });

    return attachment;
  }

  /**
   * Retrieves department and agent workload statistics for Team Lead / Admin dashboard.
   */
  public static async getWorkloadMetrics() {
    const agents = await prisma.user.findMany({
      where: { role: Role.SUPPORT_AGENT },
      select: {
        id: true,
        name: true,
        email: true,
        department: true,
      },
    });

    const openStatuses: Status[] = [
      Status.OPEN,
      Status.IN_PROGRESS,
      Status.PENDING_CUSTOMER,
    ];

    const counts = await prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        status: { in: openStatuses },
      },
      _count: { id: true },
    });

    const breachCounts = await prisma.ticket.groupBy({
      by: ["assigneeId"],
      where: {
        status: { in: openStatuses },
        slaBreached: true,
      },
      _count: { id: true },
    });

    const countMap = new Map<string, number>();
    const breachMap = new Map<string, number>();

    for (const c of counts) {
      if (c.assigneeId) countMap.set(c.assigneeId, c._count.id);
    }
    for (const b of breachCounts) {
      if (b.assigneeId) breachMap.set(b.assigneeId, b._count.id);
    }

    return agents.map((agent) => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      department: agent.department,
      activeTicketCount: countMap.get(agent.id) || 0,
      breachedTicketCount: breachMap.get(agent.id) || 0,
    }));
  }
}
