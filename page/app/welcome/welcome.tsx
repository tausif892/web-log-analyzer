
import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Globe,
  LayoutDashboard,
  Search,
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
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

// Replace these values with API data when your backend is ready.
const analytics = {
  totalLogs: 18,
  highVolume: [
    { ip: "192.168.1.10", requests: 5 },
  ],
  repeatedFailures: [
    { ip: "192.168.1.20", failures: 4 },
  ],
  serverErrors: [
    { endpoint: "/api/data", errors: 2 },
  ],
};

const StatCard = ({
  title,
  value,
  description,
  icon: Icon,
  color,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm text-slate-400">{title}</p>
      <div className={`rounded-lg p-2 ${color}`}>
        <Icon size={19} />
      </div>
    </div>

    <h2 className="mt-4 text-3xl font-semibold text-white">{value}</h2>
    <p className="mt-2 text-xs text-slate-500">{description}</p>
  </div>
);

const SectionTitle = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
  <div className="mb-5">
    <h2 className="text-lg font-semibold text-white">{title}</h2>
    <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
  </div>
);

export default function Welcome() {
  const highVolumeData = analytics.highVolume;
  const failureData = analytics.repeatedFailures;
  const serverErrorData = analytics.serverErrors;

  return (
    <div className="min-h-screen bg-[#080d18] text-slate-200">
      <div className="flex min-h-screen">

        {/* Sidebar */}
        <aside className="hidden w-64 shrink-0 border-r border-slate-800 bg-[#0c1322] p-6 md:block">
          <div className="mb-10 flex items-center gap-3">
            <div className="rounded-lg bg-cyan-500/10 p-2 text-cyan-400">
              <ShieldCheck size={25} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-wide text-white">
                LOGWATCH
              </h1>
              <p className="text-xs text-slate-500">Log Analytics Platform</p>
            </div>
          </div>

          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-2">
            <a
              href="/dashboard"
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

          <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="flex items-center gap-2 text-emerald-400">
              <Activity size={16} />
              <span className="text-xs font-medium">Analysis engine</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">
              Apache Pig
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Local analysis results loaded
            </p>
          </div>
        </aside>

        {/* Main content */}
        <main className="min-w-0 flex-1 p-5 md:p-8">

          {/* Header */}
          <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
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
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-sm text-slate-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                Analysis complete
              </div>
            </div>
          </header>

          {/* Overview cards */}
          <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Log Entries"
              value={analytics.totalLogs}
              description="Records processed by Apache Pig"
              icon={Globe}
              color="bg-cyan-500/10 text-cyan-400"
            />

            <StatCard
              title="High Volume IPs"
              value={highVolumeData.length}
              description="IPs exceeding the request threshold"
              icon={Users}
              color="bg-orange-500/10 text-orange-400"
            />

            <StatCard
              title="Repeated Failures"
              value={failureData.length}
              description="IPs with repeated 401/403 responses"
              icon={AlertTriangle}
              color="bg-red-500/10 text-red-400"
            />

            <StatCard
              title="Server Error Endpoints"
              value={serverErrorData.length}
              description="Endpoints returning HTTP 5xx"
              icon={Server}
              color="bg-purple-500/10 text-purple-400"
            />
          </section>

          {/* Charts */}
          <section id="analytics" className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">

            {/* High volume chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <SectionTitle
                title="High Volume Traffic"
                subtitle="Requests grouped by IP address"
              />

              <div className="h-64">
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
                    <Tooltip
                      contentStyle={{
                        background: "#0c1322",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="requests" fill="#22d3ee" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Failed requests chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
              <SectionTitle
                title="Repeated Authentication Failures"
                subtitle="401 and 403 responses grouped by IP"
              />

              <div className="h-64">
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
                    <Tooltip
                      contentStyle={{
                        background: "#0c1322",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="failures" fill="#f87171" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Server errors chart */}
            <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 xl:col-span-2">
              <SectionTitle
                title="Server Error Distribution"
                subtitle="HTTP 5xx errors grouped by endpoint"
              />

              <div className="h-64">
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
                    />
                    <YAxis
                      stroke="#64748b"
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "#0c1322",
                        border: "1px solid #334155",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="errors" fill="#a78bfa" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Detection summary */}
          <section id="detections" className="mb-8 rounded-xl border border-slate-800 bg-slate-900 p-5">
            <SectionTitle
              title="Detection Summary"
              subtitle="Results generated by your Pig Latin analysis"
            />

            <div className="space-y-4">
              {[
                {
                  name: "High request volume",
                  detail: "192.168.1.10 generated 5 requests",
                  status: "Threshold reached",
                  color: "bg-orange-400",
                },
                {
                  name: "Repeated authentication failures",
                  detail: "192.168.1.20 generated 4 failed requests",
                  status: "Threshold reached",
                  color: "bg-red-400",
                },
                {
                  name: "Server errors detected",
                  detail: "/api/data returned 2 server errors",
                  status: "Detected",
                  color: "bg-purple-400",
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4 last:border-0 last:pb-0"
                >
                  <div className="flex items-start gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${item.color}`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {item.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {item.detail}
                      </p>
                    </div>
                  </div>

                  <span className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Tables */}
          <section id="reports" className="grid grid-cols-1 gap-6 xl:grid-cols-2">

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
                    {highVolumeData.map((item) => (
                      <tr key={item.ip} className="border-t border-slate-800">
                        <td className="px-5 py-4 font-mono text-cyan-400">
                          {item.ip}
                        </td>
                        <td className="px-5 py-4 text-right text-white">
                          {item.requests}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                    {failureData.map((item) => (
                      <tr key={item.ip} className="border-t border-slate-800">
                        <td className="px-5 py-4 font-mono text-red-400">
                          {item.ip}
                        </td>
                        <td className="px-5 py-4 text-right text-white">
                          {item.failures}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

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
                    {serverErrorData.map((item) => (
                      <tr key={item.endpoint} className="border-t border-slate-800">
                        <td className="px-5 py-4 font-mono text-purple-400">
                          {item.endpoint}
                        </td>
                        <td className="px-5 py-4 text-right text-white">
                          {item.errors}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <footer className="mt-8 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">
            LOGWATCH · Powered by Apache Pig · Web Log Analytics
          </footer>
        </main>
      </div>
    </div>
  );
}
