import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { useAuth } from "./context/AuthContext";

// Minimal route infrastructure placeholders (actual UI built in Feature 7, 8, 9, 10)
const DashboardPlaceholder: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h1 className="text-xl font-bold text-slate-900 dark:text-white">
        Welcome to INTAKE, {user?.name}
      </h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Authenticated as <span className="font-semibold">{user?.role}</span> ({user?.department}).
        Protected shell initialized and ready for upcoming Feature 7 (Tickets) and Feature 8 (Portals).
      </p>
    </div>
  );
};

const TicketsPlaceholder: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Tickets Queue</h1>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Route shell active. Ready for Feature 7 (Paginated & Advanced Filterable Ticket Table).
    </p>
  </div>
);

const AnalyticsPlaceholder: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Incident Analytics</h1>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Route shell active. Ready for Feature 10 (Incident Analytics Dashboard with Recharts).
    </p>
  </div>
);

const WorkloadPlaceholder: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Team Workload Balancing</h1>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Route shell active. Ready for Feature 8 (Team Lead / Admin Workload View).
    </p>
  </div>
);

function App() {
  return (
    <Routes>
      {/* Public Only Auth Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protected Enterprise Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPlaceholder />} />
          <Route path="/tickets" element={<TicketsPlaceholder />} />
          <Route path="/analytics" element={<AnalyticsPlaceholder />} />
          <Route path="/workload" element={<WorkloadPlaceholder />} />
        </Route>
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;