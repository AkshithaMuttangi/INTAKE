import { z } from "zod";

export const PriorityEnum = z.enum(["P1_CRITICAL", "P2_HIGH", "P3_MEDIUM", "P4_LOW"]);
export const StatusEnum = z.enum(["OPEN", "IN_PROGRESS", "PENDING_CUSTOMER", "RESOLVED", "CLOSED"]);

export const createTicketSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(255),
  description: z.string().min(10, "Description must be at least 10 characters"),
  priority: PriorityEnum.default("P3_MEDIUM"),
  category: z.string().min(2, "Category is required").default("IT Infrastructure"),
});

export const updateTicketStatusSchema = z.object({
  status: StatusEnum,
});

export const updateTicketPrioritySchema = z.object({
  priority: PriorityEnum,
});

export const reassignTicketSchema = z.object({
  assigneeId: z.string().uuid("Invalid assignee ID").nullable(),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty"),
  isInternalOnly: z.boolean().default(false),
});

export const ticketFilterQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  category: z.string().optional(),
  assigneeId: z.string().optional(),
  creatorId: z.string().optional(),
  slaBreached: z
    .preprocess((val) => {
      if (typeof val === "string") {
        if (val.toLowerCase() === "true") return true;
        if (val.toLowerCase() === "false") return false;
      }
      return val;
    }, z.boolean().optional())
    .optional(),
  search: z.string().optional(),
  sortBy: z.enum(["createdAt", "priority", "status", "resolveDueAt"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});
