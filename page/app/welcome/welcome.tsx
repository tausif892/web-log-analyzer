
import { useCallback, useEffect, useState } from "react";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  LayoutDashboard,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
} from "lucide-react";

import {
  BarChart,
  Bar,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  fetchAnalytics,
  type Analytics,
} from "../services/analytics";

// --------------------------------------------------
// Initial state
// --------------------------------------------------

const EMPTY_ANALYTICS: Analytics = {
  highVolume: [],
  repeatedFailures: [],
  serverErrors: [],
  lastFetched: "",
};

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>

        <div className={`rounded-lg p-2 ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <h2 className="mt-4 text-3xl font-semibold text-white">
        {value}
      </h2>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-white">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-400">
        {subtitle}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex h-full min-h-48 items-center justify-center text-center">
      <div>
        <CheckCircle2
          size={28}
          className="mx-auto mb-3 text-emerald-400"
        />

        <p className="text-sm text-slate-400">
          {message}
        </p>
      </div>
    </div>
  );
}

// --------------------------------------------------
// Dashboard
// --------------------------------------------------

export default function Welcome() {
  const [analytics, setAnalytics] =
    useState<Analytics>(EMPTY_ANALYTICS);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState<string | null>(null);

  // ------------------------------------------------
  // Retrieve analytics from GCS
  // ------------------------------------------------

  const loadAnalytics = useCallback(async () => {
    try {
      setError(null);

      const result = await fetchAnalytics();

      setAnalytics(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to retrieve analytics."
      );
    }
  }, []);

  // ------------------------------------------------
  // Initial page load
  // ------------------------------------------------

  useEffect(() => {
    let active = true;

    async function initializeDashboard() {
      try {
        setLoading(true);
        setError(null);

        const result = await fetchAnalytics();

        if (active) {
          setAnalytics(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to retrieve analytics."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeDashboard();

    return () => {
      active = false;
    };
  }, []);

  // ------------------------------------------------
  // Manual dashboard refresh
  // ------------------------------------------------

  async function handleRefresh() {
    setRefreshing(true);

    try {
      await loadAnalytics();
    } finally {
      setRefreshing(false);
    }
  }

  // ------------------------------------------------
  // Derived data
  // ------------------------------------------------

  const highVolumeData = analytics.highVolume;

  const failureData = analytics.repeatedFailures;

  const serverErrorData = analytics.serverErrors;

  const totalFindings =
    highVolumeData.length +
    failureData.length +
    serverErrorData.length;

  const totalHighVolumeRequests = highVolumeData.reduce(
    (sum, item) => sum + item.requests,
    0
  );

  const totalFailures = failureData.reduce(
    (sum, item) => sum + item.failures,
    0
  );

  const totalServerErrors = serverErrorData.reduce(
    (sum, item) => sum + item.errors,
    0
  );

  // ------------------------------------------------
  // Reusable chart tooltip styling
  // ------------------------------------------------

  const tooltipStyle = {
    backgroundColor: "#0c1322",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#e2e8f0",
  };

  // ------------------------------------------------
  // Render
  // ------------------------------------------------

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200">

      <div className="flex min-h-screen">

        {/* ==========================================
            SIDEBAR
        ========================================== */}

        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#0c1322] p-6 md:block">

          {/* Logo */}

          <div className="mb-10 flex items-center gap-3">

            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">
                LOGWATCH
              </h1>

              <p className="text-xs text-slate-500">
                Log Analytics Platform
              </p>
            </div>

          </div>

          {/* Navigation */}

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">

            <a
              href="#overview"
              className="flex items-center gap-3 rounded-lg bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-400"
            >
              <LayoutDashboard size={18} />
              Overview
            </a>

            <a
              href="#analytics"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <BarChart3 size={18} />
              Log Analytics
            </a>

            <a
              href="#detections"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <ShieldAlert size={18} />
              Threat Detection
            </a>

            <a
              href="#reports"
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm text-slate-400 transition hover:bg-slate-800 hover:text-white"
            >
              <Terminal size={18} />
              Reports
            </a>

          </nav>

          {/* Engine status */}

          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-4">

            <div className="flex items-center gap-2 text-emerald-400">
              <Activity size={16} />

              <span className="text-xs font-medium">
                Analysis engine
              </span>
            </div>

            <p className="mt-2 text-sm font-semibold text-white">
              Apache Pig
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Reports retrieved from GCS
            </p>

          </div>

        </aside>

        {/* ==========================================
            MAIN CONTENT
        ========================================== */}

        <main className="min-w-0 flex-1 p-5 md:p-8">

          {/* ========================================
              HEADER
          ======================================== */}

          <header
            id="overview"
            className="mb-8 flex flex-wrap items-center justify-between gap-4"
          >

            <div>

              <p className="text-sm text-slate-500">
                Workspace / Overview
              </p>

              <h1 className="mt-2 text-2xl font-bold text-white md:text-3xl">
                Security Dashboard
              </h1>

              <p className="mt-2 text-sm text-slate-400">
                Monitor and analyze your web server access logs.
              </p>

              {analytics.lastFetched && (
                <p className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <Clock size={13} />

                  Last fetched: {analytics.lastFetched}
                </p>
              )}

            </div>

            <div className="flex flex-wrap items-center gap-3">

              {/* Status */}

              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">

                <span
                  className={`h-2 w-2 rounded-full ${
                    loading
                      ? "bg-yellow-400"
                      : error
                        ? "bg-red-400"
                        : "bg-emerald-400"
                  }`}
                />

                {loading
                  ? "Loading reports"
                  : error
                    ? "Data unavailable"
                    : "Reports loaded"}

              </div>

              {/* Refresh */}

              <button
                onClick={handleRefresh}
                disabled={loading || refreshing}
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >

                <RefreshCw
                  size={16}
                  className={
                    refreshing ? "animate-spin" : ""
                  }
                />

                Refresh

              </button>

            </div>

          </header>

          {/* ========================================
              ERROR MESSAGE
          ======================================== */}

          {error && (

            <div className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4">

              <AlertTriangle
                size={20}
                className="shrink-0 text-red-400"
              />

              <div>
                <p className="text-sm font-medium text-red-400">
                  Unable to load analytics
                </p>

                <p className="mt-1 text-xs text-red-300/80">
                  {error}
                </p>

                <p className="mt-2 text-xs text-slate-400">
                  Check your GCS bucket name, object permissions,
                  CORS configuration and published report files.
                </p>
              </div>

            </div>

          )}

          {/* ========================================
              LOADING STATE
          ======================================== */}

          {loading && (

            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-6 text-center">

              <RefreshCw
                size={24}
                className="mx-auto animate-spin text-cyan-400"
              />

              <p className="mt-3 text-sm text-slate-300">
                Retrieving analytical reports...
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Connecting to Google Cloud Storage
              </p>

            </div>

          )}

          {/* ========================================
              KPI CARDS
          ======================================== */}

          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard
              title="Total Findings"
              value={loading ? "..." : totalFindings}
              description="Records across all three reports"
              icon={Globe}
              color="bg-cyan-500/10 text-cyan-400"
            />

            <StatCard
              title="High Volume IPs"
              value={loading ? "..." : highVolumeData.length}
              description={`${totalHighVolumeRequests} requests across flagged IPs`}
              icon={Users}
              color="bg-orange-500/10 text-orange-400"
            />

            <StatCard
              title="Repeated Failures"
              value={loading ? "..." : failureData.length}
              description={`${totalFailures} failed requests detected`}
              icon={AlertTriangle}
              color="bg-red-500/10 text-red-400"
            />

            <StatCard
              title="Server Error Endpoints"
              value={loading ? "..." : serverErrorData.length}
              description={`${totalServerErrors} server errors detected`}
              icon={Server}
              color="bg-purple-500/10 text-purple-400"
            />

          </section>

          {/* ========================================
              ANALYTICS CHARTS
          ======================================== */}

          <section
            id="analytics"
            className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2"
          >

            {/* HIGH VOLUME TRAFFIC */}

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

              <SectionTitle
                title="High Volume Traffic"
                subtitle="Requests grouped by IP address"
              />

              <div className="h-64">

                {!loading && !error && highVolumeData.length === 0 ? (

                  <EmptyState message="No high-volume IPs detected." />

                ) : (

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart data={highVolumeData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#253044"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="ip"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        stroke="#64748b"
                        allowDecimals={false}
                      />

                      <Tooltip contentStyle={tooltipStyle} />

                      <Bar
                        dataKey="requests"
                        name="Requests"
                        fill="#22d3ee"
                        radius={[5, 5, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

            {/* REPEATED FAILURES */}

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">

              <SectionTitle
                title="Repeated Authentication Failures"
                subtitle="401 and 403 responses grouped by IP"
              />

              <div className="h-64">

                {!loading && !error && failureData.length === 0 ? (

                  <EmptyState message="No repeated authentication failures detected." />

                ) : (

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart data={failureData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#253044"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="ip"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        stroke="#64748b"
                        allowDecimals={false}
                      />

                      <Tooltip contentStyle={tooltipStyle} />

                      <Bar
                        dataKey="failures"
                        name="Failures"
                        fill="#f87171"
                        radius={[5, 5, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

            {/* SERVER ERRORS */}

            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 xl:col-span-2">

              <SectionTitle
                title="Server Error Distribution"
                subtitle="HTTP 5xx errors grouped by endpoint"
              />

              <div className="h-64">

                {!loading && !error && serverErrorData.length === 0 ? (

                  <EmptyState message="No server errors detected." />

                ) : (

                  <ResponsiveContainer width="100%" height="100%">

                    <BarChart data={serverErrorData}>

                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#253044"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="endpoint"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                      />

                      <YAxis
                        stroke="#64748b"
                        allowDecimals={false}
                      />

                      <Tooltip contentStyle={tooltipStyle} />

                      <Bar
                        dataKey="errors"
                        name="Server Errors"
                        fill="#a78bfa"
                        radius={[5, 5, 0, 0]}
                      />

                    </BarChart>

                  </ResponsiveContainer>

                )}

              </div>

            </div>

          </section>

          {/* ========================================
              DETECTION SUMMARY
          ======================================== */}

          <section
            id="detections"
            className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5"
          >

            <SectionTitle
              title="Detection Summary"
              subtitle="Results generated by your Pig Latin analysis"
            />

            {loading ? (

              <p className="text-sm text-slate-400">
                Loading detection results...
              </p>

            ) : error ? (

              <p className="text-sm text-red-400">
                Detection results are currently unavailable.
              </p>

            ) : totalFindings === 0 ? (

              <EmptyState message="No matching records found in the latest analysis." />

            ) : (

              <div className="space-y-4">

                {highVolumeData.map((item) => (

                  <div
                    key={item.ip}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4"
                  >

                    <div className="flex items-start gap-3">

                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-orange-400" />

                      <div>

                        <p className="text-sm font-medium text-white">
                          High request volume
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.ip} generated {item.requests} requests
                        </p>

                      </div>

                    </div>

                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Threshold reached
                    </span>

                  </div>

                ))}

                {failureData.map((item) => (

                  <div
                    key={item.ip}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4"
                  >

                    <div className="flex items-start gap-3">

                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-red-400" />

                      <div>

                        <p className="text-sm font-medium text-white">
                          Repeated authentication failures
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.ip} generated {item.failures} failed requests
                        </p>

                      </div>

                    </div>

                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Threshold reached
                    </span>

                  </div>

                ))}

                {serverErrorData.map((item) => (

                  <div
                    key={item.endpoint}
                    className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4"
                  >

                    <div className="flex items-start gap-3">

                      <span className="mt-1.5 h-2.5 w-2.5 rounded-full bg-purple-400" />

                      <div>

                        <p className="text-sm font-medium text-white">
                          Server errors detected
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {item.endpoint} returned {item.errors} server errors
                        </p>

                      </div>

                    </div>

                    <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                      Detected
                    </span>

                  </div>

                ))}

              </div>

            )}

          </section>

          {/* ========================================
              REPORT TABLES
          ======================================== */}

          <section
            id="reports"
            className="grid grid-cols-1 gap-6 xl:grid-cols-2"
          >

            {/* HIGH VOLUME TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

              <div className="border-b border-slate-800 p-5">

                <h2 className="font-semibold text-white">
                  High Volume IP Addresses
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Requests exceeding the configured threshold
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">

                    <tr>
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3 text-right">Requests</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && highVolumeData.map((item) => (

                      <tr
                        key={item.ip}
                        className="border-t border-slate-800"
                      >

                        <td className="px-5 py-4 font-mono text-cyan-400">
                          {item.ip}
                        </td>

                        <td className="px-5 py-4 text-right text-white">
                          {item.requests}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && highVolumeData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="px-5 py-8 text-center text-slate-500"
                        >
                          No records found.
                        </td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* REPEATED FAILURES TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

              <div className="border-b border-slate-800 p-5">

                <h2 className="font-semibold text-white">
                  Repeated Failed Requests
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  IP addresses with repeated authentication failures
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">

                    <tr>
                      <th className="px-5 py-3">IP Address</th>
                      <th className="px-5 py-3 text-right">Failures</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && failureData.map((item) => (

                      <tr
                        key={item.ip}
                        className="border-t border-slate-800"
                      >

                        <td className="px-5 py-4 font-mono text-red-400">
                          {item.ip}
                        </td>

                        <td className="px-5 py-4 text-right text-white">
                          {item.failures}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && failureData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="px-5 py-8 text-center text-slate-500"
                        >
                          No records found.
                        </td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

            {/* SERVER ERRORS TABLE */}

            <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 xl:col-span-2">

              <div className="border-b border-slate-800 p-5">

                <h2 className="font-semibold text-white">
                  Server Error Endpoints
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Endpoints with HTTP 5xx responses
                </p>

              </div>

              <div className="overflow-x-auto">

                <table className="w-full text-left text-sm">

                  <thead className="bg-slate-800/50 text-xs uppercase text-slate-400">

                    <tr>
                      <th className="px-5 py-3">Endpoint</th>
                      <th className="px-5 py-3 text-right">Errors</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && serverErrorData.map((item) => (

                      <tr
                        key={item.endpoint}
                        className="border-t border-slate-800"
                      >

                        <td className="px-5 py-4 font-mono text-purple-400">
                          {item.endpoint}
                        </td>

                        <td className="px-5 py-4 text-right text-white">
                          {item.errors}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && serverErrorData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="px-5 py-8 text-center text-slate-500"
                        >
                          No records found.
                        </td>
                      </tr>

                    )}

                  </tbody>

                </table>

              </div>

            </div>

          </section>

          {/* ========================================
              FOOTER
          ======================================== */}

          <footer className="mt-8 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">

            LOGWATCH · Powered by Apache Pig · Google Cloud Storage

          </footer>

        </main>

      </div>

    </div>
  );
}
