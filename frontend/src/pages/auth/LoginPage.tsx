import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ShieldCheck, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const from = location.state?.from?.pathname || "/dashboard";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password) {
      setError("Please provide both your email address and password.");
      return;
    }

    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const apiErr = err as {
        response?: { data?: { error?: { message?: string } } };
        message?: string;
      };
      const message =
        apiErr.response?.data?.error?.message ||
        apiErr.message ||
        "Authentication failed. Please verify your credentials.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestUserFill = (testEmail: string) => {
    setEmail(testEmail);
    setPassword("Password123!");
    setError(null);
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/25">
            <ShieldCheck className="h-7 w-7" />
          </div>
        </div>
        <h2 className="mt-4 text-center text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Sign in to INTAKE
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500 dark:text-slate-400">
          Enterprise Incident Management & Service Desk
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {/* Error Banner */}
          {error && (
            <div className="mb-5 flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Work Email
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Password
              </label>
              <div className="relative mt-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center rounded-lg bg-blue-600 py-2.5 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Quick Test-User Autofill Presets */}
          <div className="mt-6 border-t border-slate-100 pt-5 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Test Role Fill
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleTestUserFill("admin@intake.io")}
                className="flex items-center justify-center rounded border border-purple-200 bg-purple-50/60 py-1.5 px-2 font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-900 dark:bg-purple-950/40 dark:text-purple-300"
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => handleTestUserFill("lead@intake.io")}
                className="flex items-center justify-center rounded border border-blue-200 bg-blue-50/60 py-1.5 px-2 font-medium text-blue-700 transition hover:bg-blue-100 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
              >
                Team Lead
              </button>
              <button
                type="button"
                onClick={() => handleTestUserFill("agent1@intake.io")}
                className="flex items-center justify-center rounded border border-emerald-200 bg-emerald-50/60 py-1.5 px-2 font-medium text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
              >
                Agent
              </button>
              <button
                type="button"
                onClick={() => handleTestUserFill("user1@intake.io")}
                className="flex items-center justify-center rounded border border-slate-200 bg-slate-100/70 py-1.5 px-2 font-medium text-slate-700 transition hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                End User
              </button>
            </div>
          </div>

          {/* Registration Link */}
          <div className="mt-5 text-center text-xs text-slate-500 dark:text-slate-400">
            Need an enterprise account?{" "}
            <Link
              to="/register"
              className="font-semibold text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
