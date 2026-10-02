export type UserRole = "END_USER" | "SUPPORT_AGENT" | "TEAM_LEAD" | "ADMIN";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department: string;
  createdAt?: string;
}

export interface AuthResponseData {
  user: AuthUser;
  accessToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  department?: string;
  role?: UserRole;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  correlationId?: string;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}
