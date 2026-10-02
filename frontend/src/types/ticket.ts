import type { TicketPriority, TicketStatus } from "./api";

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
