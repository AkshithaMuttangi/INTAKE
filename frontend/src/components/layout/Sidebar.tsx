import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Inbox,
  BarChart3,
  Users2,
  HelpCircle,
  Activity,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import type { UserRole } from "../../types/api";

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Tickets",
    to: "/tickets",
    icon: Inbox,
  },
  {
    label: "Incident Analytics",
    to: "/analytics",
    icon: BarChart3,
    allowedRoles: ["SUPPORT_AGENT", "TEAM_LEAD", "ADMIN"],
  },
  {
    label: "Team Workload",
    to: "/workload",
    icon: Users2,
    allowedRoles: ["TEAM_LEAD", "ADMIN"],
  },
];

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const visibleItems = navItems.filter((item) => {
    if (!item.allowedRoles) return true;
    return hasRole(item.allowedRoles);
  });

  return (
    <aside className="flex h-[calc(100vh-4rem)] w-64 flex-col justify-between border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      {/* Navigation Links */}
      <div className="p-3">
        <div className="mb-2 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Navigation
        </div>
        <nav className="space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-blue-50 text-blue-700 font-semibold dark:bg-blue-950/60 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
                  }`
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* System Status / User Department Footer */}
      <div className="border-t border-slate-200 p-4 dark:border-slate-800">
        <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 text-xs dark:bg-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              SLA Engine
            </span>
          </div>
          <span className="font-mono text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            Active (1m)
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between px-1 text-[11px] text-slate-400">
          <div className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5 text-blue-500" />
            <span>Role: {user?.role || "GUEST"}</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle className="h-3.5 w-3.5" />
            <span>Help</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
