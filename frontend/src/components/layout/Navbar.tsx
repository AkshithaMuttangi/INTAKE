import React from "react";
import { ShieldCheck, LogOut, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";

const roleBadgeMap: Record<UserRole, { label: string; color: string }> = {
  ADMIN: {
    label: "Admin",
    color: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800",
  },
  TEAM_LEAD: {
    label: "Team Lead",
    color: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800",
  },
  SUPPORT_AGENT: {
    label: "Support Agent",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800",
  },
  END_USER: {
    label: "End User",
    color: "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
};

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "IN";

  const roleInfo = user?.role
    ? roleBadgeMap[user.role]
    : { label: "Guest", color: "bg-slate-100 text-slate-700 border-slate-200" };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-6">
      {/* Brand Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/20">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              INTAKE
            </span>
            <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
              v1.0
            </span>
          </div>
          <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Enterprise Service Desk
          </p>
        </div>
      </div>

      {/* Authenticated User & Actions */}
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="hidden flex-col items-end text-right sm:flex">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  {user.name}
                </span>
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${roleInfo.color}`}
                >
                  {roleInfo.label}
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                <Building2 className="h-3 w-3" />
                <span>{user.department || "General"}</span>
              </div>
            </div>

            {/* Avatar Pill */}
            <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-slate-100 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {initials}
            </div>

            {/* Logout Action */}
            <button
              onClick={() => logout()}
              title="Sign out of INTAKE"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/40 dark:hover:text-rose-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </>
        ) : (
          <span className="text-xs text-slate-500">Not authenticated</span>
        )}
      </div>
    </header>
  );
};
