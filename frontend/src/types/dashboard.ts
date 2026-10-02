import type { TicketListItem } from "./ticket";
import type { TicketPriority, TicketStatus } from "./api";

export interface DashboardKpis {
  totalTickets: number;
  resolvedTickets: number;
  activeSlaBreaches: number;
  resolutionRatePercentage: number;
  overallSlaCompliancePercentage: number;
  avgResolutionHours: number;
}

export interface MonthlyVolume {
  month: string;
  total: number;
  resolved: number;
  breached: number;
}

export interface PriorityDistributionItem {
  priority: TicketPriority;
  label: string;
  count: number;
  percentage: number;
}

export interface StatusDistributionItem {
  status: TicketStatus;
  count: number;
}

export interface DepartmentSlaItem {
  department: string;
  total: number;
  breached: number;
  complianceRate: number;
}

export interface DashboardAnalyticsData {
  kpis: DashboardKpis;
  charts: {
    monthlyIncidentVolume: MonthlyVolume[];
    priorityDistribution: PriorityDistributionItem[];
    statusDistribution: StatusDistributionItem[];
    departmentSlaCompliance: DepartmentSlaItem[];
  };
}

export interface AgentWorkloadItem {
  id: string;
  name: string;
  email: string;
  department: string;
  activeTicketCount: number;
  breachedTicketCount: number;
}

export interface EndUserDashboardData {
  totalTickets: number;
  openTickets: number;
  pendingCustomerTickets: number;
  resolvedTickets: number;
  recentTickets: TicketListItem[];
}

export interface AgentDashboardData {
  assignedTotal: number;
  assignedOpen: number;
  assignedInProgress: number;
  assignedPending: number;
  assignedBreached: number;
  recentAssigned: TicketListItem[];
  analytics: DashboardAnalyticsData | null;
}

export interface TeamLeadDashboardData {
  analytics: DashboardAnalyticsData;
  workload: AgentWorkloadItem[];
  recentEscalations: TicketListItem[];
}

export interface AdminDashboardData {
  analytics: DashboardAnalyticsData;
  workload: AgentWorkloadItem[];
  criticalTickets: TicketListItem[];
}
