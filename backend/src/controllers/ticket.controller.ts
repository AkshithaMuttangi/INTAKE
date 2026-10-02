import { Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import { TicketService } from "../services/ticket.service";
import { AuthenticatedRequest } from "../types";
import { AppError } from "../middleware/errorHandler";
import { prisma } from "../config/prisma";

export class TicketController {
  public static async getTickets(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await TicketService.getTickets(req.query as any, req.user!);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getTicketById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const ticket = await TicketService.getTicketById(id, req.user!);
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async createTicket(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { title, description, priority, category } = req.body;
      const ticket = await TicketService.createTicket({
        title,
        description,
        priority,
        category,
        creator: req.user!,
      });

      res.status(201).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const ticket = await TicketService.updateStatus(id, status, req.user!);
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updatePriority(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { priority } = req.body;
      const ticket = await TicketService.updatePriority(id, priority, req.user!);
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async reassignTicket(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { assigneeId } = req.body;
      const ticket = await TicketService.reassignTicket(id, assigneeId, req.user!);
      res.status(200).json({
        success: true,
        data: ticket,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async addComment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { content, isInternalOnly } = req.body;
      const comment = await TicketService.addComment({
        ticketId: id,
        author: req.user!,
        content,
        isInternalOnly,
      });
      res.status(201).json({
        success: true,
        data: comment,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async uploadAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      if (!req.file) {
        throw new AppError("No file uploaded or file rejected", 400, "MISSING_FILE");
      }

      const attachment = await TicketService.addAttachment({
        ticketId: id,
        uploader: req.user!,
        file: req.file,
      });

      res.status(201).json({
        success: true,
        data: attachment,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async downloadAttachment(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { attachmentId } = req.params;
      const attachment = await prisma.attachment.findUnique({
        where: { id: attachmentId },
      });

      if (!attachment) {
        throw new AppError("Attachment not found", 404, "ATTACHMENT_NOT_FOUND");
      }

      const filePath = path.resolve(attachment.filePath);
      if (!fs.existsSync(filePath)) {
        throw new AppError("File does not exist on storage server", 404, "FILE_NOT_FOUND");
      }

      res.download(filePath, attachment.originalName);
    } catch (error) {
      next(error);
    }
  }

  public static async getWorkload(
    _req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const metrics = await TicketService.getWorkloadMetrics();
      res.status(200).json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }
}
