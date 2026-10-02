import { Request } from "express";
import { Role } from "@prisma/client";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  department: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
  correlationId?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export interface TicketFilterQuery {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  category?: string;
  assigneeId?: string;
  creatorId?: string;
  slaBreached?: boolean;
  search?: string;
  sortBy?: "createdAt" | "priority" | "status" | "resolveDueAt";
  sortOrder?: "asc" | "desc";
  startDate?: string;
  endDate?: string;
}
