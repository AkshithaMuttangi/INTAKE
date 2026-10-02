import type { TicketPriority, TicketStatus, UserRole } from "./api";

export interface TicketCreator {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface TicketAssignee {
  id: string;
  name: string;
  email: string;
  department: string;
}

export interface TicketListItem {
  id: string;
  ticketNumber: string;
  title: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  slaBreached: boolean;
  responseDueAt: string;
  resolveDueAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TicketCreator;
  assignee: TicketAssignee | null;
  _count: {
    comments: number;
    attachments: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface TicketQueryParams {
  page?: number;
  limit?: number;
  status?: TicketStatus | "";
  priority?: TicketPriority | "";
  category?: string;
  assigneeId?: string;
  creatorId?: string;
  slaBreached?: boolean;
  search?: string;
  sortBy?: "createdAt" | "priority" | "status" | "resolveDueAt";
  sortOrder?: "asc" | "desc";
}

export interface TicketsApiResponse {
  success: boolean;
  data: TicketListItem[];
  pagination: PaginationMeta;
}

export type AuditAction =
  | "STATUS_CHANGE"
  | "REASSIGNMENT"
  | "PRIORITY_UPDATE"
  | "COMMENT_ADDED"
  | "TICKET_CREATED"
  | "ATTACHMENT_ADDED";

export interface AuditLogEntry {
  id: string;
  ticketId: string;
  performedById: string;
  performedBy: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  action: AuditAction;
  oldValue: string | null;
  newValue: string | null;
  timestamp: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  isInternalOnly: boolean;
  author: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  ticketId: string;
  uploaderId: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath: string;
  uploader: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
}

export interface TicketDetail {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  category: string;
  creatorId: string;
  assigneeId: string | null;
  slaBreached: boolean;
  responseDueAt: string;
  resolveDueAt: string;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator: TicketCreator;
  assignee: TicketAssignee | null;
  auditLogs: AuditLogEntry[];
  comments: TicketComment[];
  attachments: TicketAttachment[];
}

export interface TicketDetailApiResponse {
  success: boolean;
  data: TicketDetail;
}

export interface CommentApiResponse {
  success: boolean;
  data: TicketComment;
}

export interface AttachmentApiResponse {
  success: boolean;
  data: TicketAttachment;
}
