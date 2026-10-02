import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { api, setAccessToken, getAccessToken } from "../services/api";
import type {
  AuthUser,
  UserRole,
  LoginCredentials,
  RegisterData,
  ApiResponse,
  AuthResponseData,
} from "../types/api";

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  isEndUser: boolean;
  isAgent: boolean;
  isTeamLead: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Refreshes the session using the HTTP-only cookie
   */
  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const response = await api.post<ApiResponse<AuthResponseData>>("/auth/refresh-token");
      const data = response.data.data;

      if (data?.accessToken && data?.user) {
        setAccessToken(data.accessToken);
        setUser(data.user);
        return data.user;
      }

      setAccessToken(null);
      setUser(null);
      return null;
    } catch {
      setAccessToken(null);
      setUser(null);
      return null;
    }
  }, []);

  /**
   * Initial authentication bootstrap on application mount
   */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const token = getAccessToken();

        if (token) {
          // Verify existing access token with /auth/me
          try {
            const res = await api.get<ApiResponse<{ user: AuthUser }>>("/auth/me");
            if (isMounted && res.data.data?.user) {
              setUser(res.data.data.user);
              setIsLoading(false);
              return;
            }
          } catch {
            // Token may have expired; attempt refresh flow below
          }
        }

        // Attempt silent session restoration via HTTP-only refresh cookie
        if (isMounted) {
          await refreshSession();
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setAccessToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for unauthorized events emitted by the Axios response interceptor
    const handleUnauthorized = () => {
      if (isMounted) {
        setUser(null);
        setAccessToken(null);
      }
    };

    window.addEventListener("intake:auth:unauthorized", handleUnauthorized);

    return () => {
      isMounted = false;
      window.removeEventListener("intake:auth:unauthorized", handleUnauthorized);
    };
  }, [refreshSession]);

  /**
   * Login handler
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    const response = await api.post<ApiResponse<AuthResponseData>>("/auth/login", credentials);
    const data = response.data.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error(response.data.message || "Failed to authenticate");
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Register handler
   */
  const register = useCallback(async (registerData: RegisterData): Promise<AuthUser> => {
    const response = await api.post<ApiResponse<AuthResponseData>>("/auth/register", registerData);
    const data = response.data.data;

    if (!data?.accessToken || !data?.user) {
      throw new Error(response.data.message || "Registration failed");
    }

    setAccessToken(data.accessToken);
    setUser(data.user);
    return data.user;
  }, []);

  /**
   * Logout handler
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Continue client cleanup even if network request fails
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  /**
   * RBAC role check helper
   */
  const hasRole = useCallback(
    (roles: UserRole | UserRole[]): boolean => {
      if (!user) return false;
      if (Array.isArray(roles)) {
        return roles.includes(user.role);
      }
      return user.role === roles;
    },
    [user]
  );

  const isEndUser = useMemo(() => user?.role === "END_USER", [user]);
  const isAgent = useMemo(() => user?.role === "SUPPORT_AGENT", [user]);
  const isTeamLead = useMemo(() => user?.role === "TEAM_LEAD", [user]);
  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      hasRole,
      isEndUser,
      isAgent,
      isTeamLead,
      isAdmin,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      hasRole,
      isEndUser,
      isAgent,
      isTeamLead,
      isAdmin,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
