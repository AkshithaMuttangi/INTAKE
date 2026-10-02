import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import { PublicOnlyRoute } from "./components/auth/PublicOnlyRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { TicketsPage } from "./pages/tickets/TicketsPage";

import { DashboardPage } from "./pages/dashboard/DashboardPage";
import { WorkloadPage } from "./pages/workload/WorkloadPage";
import { TicketDetailPage } from "./pages/tickets/TicketDetailPage";

const AnalyticsPlaceholder: React.FC = () => (
  <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <h1 className="text-xl font-bold text-slate-900 dark:text-white">Incident Analytics</h1>
    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
      Route shell active. Ready for Feature 10 (Incident Analytics Dashboard with Recharts).
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
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
          <Route path="/analytics" element={<AnalyticsPlaceholder />} />
          <Route path="/workload" element={<WorkloadPage />} />
        </Route>
      </Route>

      {/* Catch-all Route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;