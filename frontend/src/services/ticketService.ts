import { api } from "./api";
import type {
  TicketQueryParams,
  TicketsApiResponse,
  TicketDetail,
  TicketDetailApiResponse,
  TicketComment,
  CommentApiResponse,
  TicketAttachment,
  AttachmentApiResponse,
} from "../types/ticket";
import type { TicketPriority, TicketStatus } from "../types/api";

export class TicketService {
  /**
   * Fetches paginated, filtered tickets from the backend API.
   * Leverages composite database indexes for sub-100ms response times.
   */
  public static async getTickets(params: TicketQueryParams): Promise<TicketsApiResponse> {
    const cleanedParams: Record<string, unknown> = {};

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        cleanedParams[key] = value;
      }
    });

    const response = await api.get<TicketsApiResponse>("/tickets", {
      params: cleanedParams,
    });

    return response.data;
  }

  /**
   * Retrieves single ticket with complete lifecycle history, attachments, and comments.
   */
  public static async getTicketById(id: string): Promise<TicketDetail> {
    const response = await api.get<TicketDetailApiResponse>(`/tickets/${id}`);
    return response.data.data;
  }

  /**
   * Updates ticket status with lifecycle resolution tracking and audit log.
   */
  public static async updateStatus(id: string, status: TicketStatus): Promise<TicketDetail> {
    const response = await api.patch<TicketDetailApiResponse>(`/tickets/${id}/status`, {
      status,
    });
    return response.data.data;
  }

  /**
   * Updates priority and recalculates SLA deadlines.
   */
  public static async updatePriority(id: string, priority: TicketPriority): Promise<TicketDetail> {
    const response = await api.patch<TicketDetailApiResponse>(`/tickets/${id}/priority`, {
      priority,
    });
    return response.data.data;
  }

  /**
   * Reassigns ticket to a specified support engineer or unassigns it.
   */
  public static async reassignTicket(
    id: string,
    assigneeId: string | null
  ): Promise<TicketDetail> {
    const response = await api.patch<TicketDetailApiResponse>(`/tickets/${id}/reassign`, {
      assigneeId,
    });
    return response.data.data;
  }

  /**
   * Adds conversation comment or internal support note.
   */
  public static async addComment(
    id: string,
    content: string,
    isInternalOnly = false
  ): Promise<TicketComment> {
    const response = await api.post<CommentApiResponse>(`/tickets/${id}/comments`, {
      content,
      isInternalOnly,
    });
    return response.data.data;
  }

  /**
   * Uploads an attachment to the ticket.
   */
  public static async uploadAttachment(id: string, file: File): Promise<TicketAttachment> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post<AttachmentApiResponse>(`/tickets/${id}/attachments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    return response.data.data;
  }

  /**
   * Securely downloads an attachment via Axios blob stream.
   */
  public static async downloadAttachment(attachmentId: string, filename: string): Promise<void> {
    const response = await api.get(`/tickets/attachments/${attachmentId}/download`, {
      responseType: "blob",
    });

    const blob = new Blob([response.data as BlobPart]);
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);
  }
}
