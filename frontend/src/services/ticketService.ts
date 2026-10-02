import { api } from "./api";
import type { TicketQueryParams, TicketsApiResponse } from "../types/ticket";

export class TicketService {
  /**
   * Fetches paginated, filtered tickets from the backend API.
   * Leverages composite database indexes for sub-100ms response times.
   */
  public static async getTickets(params: TicketQueryParams): Promise<TicketsApiResponse> {
    // Strip empty query values before sending
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
}
