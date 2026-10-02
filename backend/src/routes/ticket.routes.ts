import { Router } from "express";
import { Role } from "@prisma/client";
import { TicketController } from "../controllers/ticket.controller";
import { authenticateJWT, authorizeRoles } from "../middleware/auth";
import { validate } from "../middleware/validate";
import { uploadAttachment } from "../middleware/upload";
import {
  createTicketSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
  reassignTicketSchema,
  addCommentSchema,
  ticketFilterQuerySchema,
} from "../validators/ticket.validator";

const router = Router();

// Workload metrics (Team Leads and Admins)
router.get(
  "/workload",
  authenticateJWT,
  authorizeRoles([Role.TEAM_LEAD, Role.ADMIN]),
  TicketController.getWorkload
);

// Attachment download
router.get(
  "/attachments/:attachmentId/download",
  authenticateJWT,
  TicketController.downloadAttachment
);

// Ticket list with indexed queries and pagination
router.get(
  "/",
  authenticateJWT,
  validate(ticketFilterQuerySchema, "query"),
  TicketController.getTickets
);

// Single ticket detail
router.get("/:id", authenticateJWT, TicketController.getTicketById);

// Create new ticket (End Users and Staff)
router.post(
  "/",
  authenticateJWT,
  validate(createTicketSchema, "body"),
  TicketController.createTicket
);

// Update status
router.patch(
  "/:id/status",
  authenticateJWT,
  authorizeRoles([Role.SUPPORT_AGENT, Role.TEAM_LEAD, Role.ADMIN]),
  validate(updateTicketStatusSchema, "body"),
  TicketController.updateStatus
);

// Update priority
router.patch(
  "/:id/priority",
  authenticateJWT,
  authorizeRoles([Role.SUPPORT_AGENT, Role.TEAM_LEAD, Role.ADMIN]),
  validate(updateTicketPrioritySchema, "body"),
  TicketController.updatePriority
);

// Reassign ticket (Team Leads and Admins)
router.patch(
  "/:id/reassign",
  authenticateJWT,
  authorizeRoles([Role.TEAM_LEAD, Role.ADMIN]),
  validate(reassignTicketSchema, "body"),
  TicketController.reassignTicket
);

// Add comment / internal note
router.post(
  "/:id/comments",
  authenticateJWT,
  validate(addCommentSchema, "body"),
  TicketController.addComment
);

// Upload attachment
router.post(
  "/:id/attachments",
  authenticateJWT,
  uploadAttachment.single("file"),
  TicketController.uploadAttachment
);

export default router;
