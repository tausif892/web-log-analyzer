
import { useCallback, useEffect, useState } from "react";
import type { ElementType } from "react";
import "./Welcome.css";

import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Clock,
  Globe,
  FileSpreadsheet,
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
  lastUpdated: "",
};

// --------------------------------------------------
// Reusable components
// --------------------------------------------------

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  icon: ElementType;
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
    <div className="welcome-style-1">
      <div className="welcome-style-2">
        <p className="welcome-style-3">{title}</p>

        <div className={`welcome-stat-icon ${color}`}>
          <Icon size={19} />
        </div>
      </div>

      <h2 className="welcome-style-4">
        {value}
      </h2>

      <p className="welcome-style-5">
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
    <div className="welcome-style-6">
      <h2 className="welcome-style-7">
        {title}
      </h2>

      <p className="welcome-style-8">
        {subtitle}
      </p>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="welcome-style-9">
      <div>
        <CheckCircle2
          size={28}
          className="welcome-style-10"
        />

        <p className="welcome-style-11">
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

        // Step 1: Start the analysis engine (or join an existing run).
        const startResponse = await fetch("/api/analysis", {
          method: "POST",
        });

        if (!startResponse.ok) {
          const body = await startResponse.json().catch(() => null);
          throw new Error(
            body?.error || "Unable to start the analysis engine."
          );
        }

        // Step 2: Poll the server until the analysis has completed.
        let status: "idle" | "running" | "succeeded" | "failed" = "running";
        const deadline = Date.now() + 10 * 60 * 1000;

        while (active && status === "running") {
          if (Date.now() > deadline) {
            throw new Error("Analysis timed out after 10 minutes.");
          }

          await new Promise((resolve) => setTimeout(resolve, 1500));
          if (!active) return;

          const statusResponse = await fetch("/api/analysis", {
            method: "GET",
            cache: "no-store",
          });

          if (!statusResponse.ok) {
            throw new Error("Unable to retrieve analysis status.");
          }

          const result: { status?: string; error?: string } =
            await statusResponse.json();

          if (
            result.status !== "idle" &&
            result.status !== "running" &&
            result.status !== "succeeded" &&
            result.status !== "failed"
          ) {
            throw new Error("The analysis server returned an unknown status.");
          }

          status = result.status;

          if (status === "failed") {
            throw new Error(result.error || "The analysis engine failed.");
          }

          if (status === "idle") {
            throw new Error("The analysis engine did not start.");
          }
        }

        if (!active) return;

        if (status !== "succeeded") {
          throw new Error("The analysis did not complete successfully.");
        }

        // Step 3: Fetch the reports only after Pig has uploaded them.
        const result = await fetchAnalytics();

        if (active) {
          setAnalytics(result);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to initialize the dashboard."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initializeDashboard();

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
    <div className="welcome-style-12">

      <div className="welcome-style-13">

        {/* ==========================================
            SIDEBAR
        ========================================== */}

        <aside className="welcome-style-14">

          {/* Logo */}

          <div className="welcome-style-15">

            <div className="welcome-style-16">
              <ShieldCheck size={25} />
            </div>

            <div>
              <h1 className="welcome-style-17">
                LOGWATCH
              </h1>

              <p className="welcome-style-18">
                Log Analytics Platform
              </p>
            </div>

          </div>

          {/* Navigation */}

          <p className="welcome-style-19">
            Workspace
          </p>

          <nav className="welcome-style-20">

            <a
              href="#overview"
              className="welcome-style-21"
            >
              <LayoutDashboard size={18} />
              Overview
            </a>

            <a
              href="#analytics"
              className="welcome-style-22"
            >
              <BarChart3 size={18} />
              Log Analytics
            </a>

            <a
              href="#detections"
              className="welcome-style-23"
            >
              <ShieldAlert size={18} />
              Threat Detection
            </a>

            <a
              href="#reports"
              className="welcome-style-24"
            >
              <Terminal size={18} />
              Reports
            </a>

            <a
              href="/upload"
              className="welcome-style-24"
            >
              <FileSpreadsheet size={18} />
              Upload & Analyze
            </a>

          </nav>

          {/* Engine status */}

          <div className="welcome-style-25">

            <div className="welcome-style-26">
              <Activity size={16} />

              <span className="welcome-style-27">
                Analysis engine
              </span>
            </div>

            <p className="welcome-style-28">
              Apache Pig
            </p>

            <p className="welcome-style-29">
              Reports retrieved from GCS
            </p>

          </div>

        </aside>

        {/* ==========================================
            MAIN CONTENT
        ========================================== */}

        <main className="welcome-style-30">

          {/* ========================================
              HEADER
          ======================================== */}

          <header
            id="overview"
            className="welcome-style-31"
          >

            <div>

              <p className="welcome-style-32">
                Workspace / Overview
              </p>

              <h1 className="welcome-style-33">
                Security Dashboard
              </h1>

              <p className="welcome-style-34">
                Monitor and analyze your web server access logs.
              </p>

              {analytics.lastUpdated && (
                <p className="welcome-style-35">
                  <Clock size={13} />

                  Last fetched: {analytics.lastUpdated}
                </p>
              )}

            </div>

            <div className="welcome-style-36">

              {/* Status */}

              <div className="welcome-style-37">

                <span
                  className={`welcome-status-indicator ${
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
                className="welcome-style-38"
              >

                <RefreshCw
                  size={16}
                  className={refreshing ? "welcome-refresh-spinning" : ""}
                />

                Refresh

              </button>

            </div>

          </header>

          {/* ========================================
              ERROR MESSAGE
          ======================================== */}

          {error && (

            <div className="welcome-style-39">

              <AlertTriangle
                size={20}
                className="welcome-style-40"
              />

              <div>
                <p className="welcome-style-41">
                  Unable to load analytics
                </p>

                <p className="welcome-style-42">
                  {error}
                </p>

                <p className="welcome-style-43">
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

            <div className="welcome-style-44">

              <RefreshCw
                size={24}
                className="welcome-style-45"
              />

              <p className="welcome-style-46">
                Running Apache Pig analysis...
              </p>

              <p className="welcome-style-47">
                Processing access logs and uploading reports to Google Cloud Storage
              </p>

            </div>

          )}

          {/* ========================================
              KPI CARDS
          ======================================== */}

          <section className="welcome-style-48">

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
            className="welcome-style-49"
          >

            {/* HIGH VOLUME TRAFFIC */}

            <div className="welcome-style-50">

              <SectionTitle
                title="High Volume Traffic"
                subtitle="Requests grouped by IP address"
              />

              <div className="welcome-style-51">

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

            <div className="welcome-style-52">

              <SectionTitle
                title="Repeated Authentication Failures"
                subtitle="401 and 403 responses grouped by IP"
              />

              <div className="welcome-style-53">

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

            <div className="welcome-style-54">

              <SectionTitle
                title="Server Error Distribution"
                subtitle="HTTP 5xx errors grouped by endpoint"
              />

              <div className="welcome-style-55">

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
            className="welcome-style-56"
          >

            <SectionTitle
              title="Detection Summary"
              subtitle="Results generated by your Pig Latin analysis"
            />

            {loading ? (

              <p className="welcome-style-57">
                Loading detection results...
              </p>

            ) : error ? (

              <p className="welcome-style-58">
                Detection results are currently unavailable.
              </p>

            ) : totalFindings === 0 ? (

              <EmptyState message="No matching records found in the latest analysis." />

            ) : (

              <div className="welcome-style-59">

                {highVolumeData.map((item) => (

                  <div
                    key={item.ip}
                    className="welcome-style-60"
                  >

                    <div className="welcome-style-61">

                      <span className="welcome-style-62" />

                      <div>

                        <p className="welcome-style-63">
                          High request volume
                        </p>

                        <p className="welcome-style-64">
                          {item.ip} generated {item.requests} requests
                        </p>

                      </div>

                    </div>

                    <span className="welcome-style-65">
                      Threshold reached
                    </span>

                  </div>

                ))}

                {failureData.map((item) => (

                  <div
                    key={item.ip}
                    className="welcome-style-66"
                  >

                    <div className="welcome-style-67">

                      <span className="welcome-style-68" />

                      <div>

                        <p className="welcome-style-69">
                          Repeated authentication failures
                        </p>

                        <p className="welcome-style-70">
                          {item.ip} generated {item.failures} failed requests
                        </p>

                      </div>

                    </div>

                    <span className="welcome-style-71">
                      Threshold reached
                    </span>

                  </div>

                ))}

                {serverErrorData.map((item) => (

                  <div
                    key={item.endpoint}
                    className="welcome-style-72"
                  >

                    <div className="welcome-style-73">

                      <span className="welcome-style-74" />

                      <div>

                        <p className="welcome-style-75">
                          Server errors detected
                        </p>

                        <p className="welcome-style-76">
                          {item.endpoint} returned {item.errors} server errors
                        </p>

                      </div>

                    </div>

                    <span className="welcome-style-77">
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
            className="welcome-style-78"
          >

            {/* HIGH VOLUME TABLE */}

            <div className="welcome-style-79">

              <div className="welcome-style-80">

                <h2 className="welcome-style-81">
                  High Volume IP Addresses
                </h2>

                <p className="welcome-style-82">
                  Requests exceeding the configured threshold
                </p>

              </div>

              <div className="welcome-style-83">

                <table className="welcome-style-84">

                  <thead className="welcome-style-85">

                    <tr>
                      <th className="welcome-style-86">IP Address</th>
                      <th className="welcome-style-87">Requests</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && highVolumeData.map((item) => (

                      <tr
                        key={item.ip}
                        className="welcome-style-88"
                      >

                        <td className="welcome-style-89">
                          {item.ip}
                        </td>

                        <td className="welcome-style-90">
                          {item.requests}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && highVolumeData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="welcome-style-91"
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

            <div className="welcome-style-92">

              <div className="welcome-style-93">

                <h2 className="welcome-style-94">
                  Repeated Failed Requests
                </h2>

                <p className="welcome-style-95">
                  IP addresses with repeated authentication failures
                </p>

              </div>

              <div className="welcome-style-96">

                <table className="welcome-style-97">

                  <thead className="welcome-style-98">

                    <tr>
                      <th className="welcome-style-99">IP Address</th>
                      <th className="welcome-style-100">Failures</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && failureData.map((item) => (

                      <tr
                        key={item.ip}
                        className="welcome-style-101"
                      >

                        <td className="welcome-style-102">
                          {item.ip}
                        </td>

                        <td className="welcome-style-103">
                          {item.failures}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && failureData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="welcome-style-104"
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

            <div className="welcome-style-105">

              <div className="welcome-style-106">

                <h2 className="welcome-style-107">
                  Server Error Endpoints
                </h2>

                <p className="welcome-style-108">
                  Endpoints with HTTP 5xx responses
                </p>

              </div>

              <div className="welcome-style-109">

                <table className="welcome-style-110">

                  <thead className="welcome-style-111">

                    <tr>
                      <th className="welcome-style-112">Endpoint</th>
                      <th className="welcome-style-113">Errors</th>
                    </tr>

                  </thead>

                  <tbody>

                    {!loading && !error && serverErrorData.map((item) => (

                      <tr
                        key={item.endpoint}
                        className="welcome-style-114"
                      >

                        <td className="welcome-style-115">
                          {item.endpoint}
                        </td>

                        <td className="welcome-style-116">
                          {item.errors}
                        </td>

                      </tr>

                    ))}

                    {!loading && !error && serverErrorData.length === 0 && (

                      <tr>
                        <td
                          colSpan={2}
                          className="welcome-style-117"
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

          <footer className="welcome-style-118">

            LOGWATCH · Powered by Apache Pig · Google Cloud Storage

          </footer>

        </main>

      </div>

    </div>
  );
}
