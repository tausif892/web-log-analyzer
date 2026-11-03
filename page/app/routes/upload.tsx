import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  FileSpreadsheet,
  LoaderCircle,
  UploadCloud,
} from "lucide-react";
import { fetchAnalytics, type Analytics } from "../services/analytics";
import "./Upload.css";

type JobStatus = "idle" | "running" | "succeeded" | "failed";

const EMPTY_ANALYTICS: Analytics = {
  highVolume: [],
  repeatedFailures: [],
  serverErrors: [],
  lastUpdated: "",
};

export default function Upload() {
  const [csvPath, setCsvPath] = useState("");
  const [status, setStatus] = useState<JobStatus>("idle");
  const [analytics, setAnalytics] = useState<Analytics>(EMPTY_ANALYTICS);
  const [error, setError] = useState<string | null>(null);
  const [output, setOutput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function readStatus() {
    const response = await fetch("/api/analysis", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Could not retrieve analysis status.");
    }

    const result: {
      status: JobStatus;
      error: string | null;
      output: string;
    } = await response.json();

    setStatus(result.status);
    setOutput(result.output || "");

    if (result.status === "failed") {
      throw new Error(result.error || "The analysis failed.");
    }

    return result.status;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPath = csvPath.trim();
    if (!trimmedPath) {
      setError("Enter the path to a CSV file.");
      return;
    }

    setSubmitting(true);
    setStatus("running");
    setError(null);
    setAnalytics(EMPTY_ANALYTICS);
    setOutput("");

    try {
      const response = await fetch("/api/analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvPath: trimmedPath }),
      });

      const startResult = await response.json();

      if (!response.ok) {
        throw new Error(startResult.error || "Could not start the analysis.");
      }

      const deadline = Date.now() + 10 * 60 * 1000;
      let currentStatus: JobStatus = "running";

      while (currentStatus === "running") {
        if (Date.now() > deadline) {
          throw new Error("Analysis timed out after 10 minutes.");
        }

        await new Promise((resolve) => setTimeout(resolve, 1500));
        currentStatus = await readStatus();
      }

      if (currentStatus !== "succeeded") {
        throw new Error("The analysis did not complete successfully.");
      }

      const reports = await fetchAnalytics();
      setAnalytics(reports);
    } catch (err) {
      setStatus("failed");
      setError(
        err instanceof Error ? err.message : "Unable to process this CSV file.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const totalFindings =
    analytics.highVolume.length +
    analytics.repeatedFailures.length +
    analytics.serverErrors.length;

  return (
    <main className="upload-page">
      <header className="upload-header">
        <Link to="/" className="upload-back">
          <ArrowLeft size={17} />
          Dashboard
        </Link>
        <span className="upload-brand">LOGWATCH</span>
      </header>

      <section className="upload-content">
        <div className="upload-heading">
          <div className="upload-heading-icon">
            <FileSpreadsheet size={25} />
          </div>
          <p className="upload-eyebrow">CUSTOM ANALYSIS</p>
          <h1>Analyze a CSV file</h1>
          <p>
            Provide a local CSV path. LOGWATCH will upload it to Google Cloud
            Storage, run Apache Pig on this machine, and retrieve the resulting
            insights.
          </p>
        </div>

        <form className="upload-form" onSubmit={handleSubmit}>
          <label htmlFor="csvPath">Local CSV file path</label>
          <input
            id="csvPath"
            type="text"
            value={csvPath}
            onChange={(event) => setCsvPath(event.target.value)}
            placeholder="/home/tausif/Downloads/access_logs.csv"
            disabled={submitting}
            autoComplete="off"
            spellCheck={false}
          />
          <p className="upload-hint">
            Use an absolute path or a path relative to the web-log-analyzer
            project directory.
          </p>

          <button type="submit" disabled={submitting || !csvPath.trim()}>
            {submitting ? (
              <>
                <LoaderCircle className="upload-spinner" size={18} />
                Processing CSV...
              </>
            ) : (
              <>
                <UploadCloud size={18} />
                Upload and analyze
              </>
            )}
          </button>
        </form>

        {status === "running" && (
          <div className="upload-notice">
            <LoaderCircle className="upload-spinner" size={19} />
            <div>
              <strong>Analysis in progress</strong>
              <p>Uploading the file, running Pig and publishing reports.</p>
            </div>
          </div>
        )}

        {error && (
          <div className="upload-error">
            <AlertCircle size={19} />
            <div>
              <strong>Analysis failed</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {status === "succeeded" && (
          <div className="upload-success">
            <CheckCircle2 size={20} />
            <div>
              <strong>Analysis completed</strong>
              <p>Your reports have been refreshed successfully.</p>
            </div>
          </div>
        )}

        {output && (
          <details className="upload-log">
            <summary>Analysis log</summary>
            <pre>{output}</pre>
          </details>
        )}

        {status === "succeeded" && (
          <section className="insights">
            <div className="insights-title">
              <div>
                <p className="upload-eyebrow">RESULTS</p>
                <h2>Analysis insights</h2>
              </div>
              <span>{totalFindings} findings</span>
            </div>

            <div className="insight-cards">
              <article>
                <span>High-volume IPs</span>
                <strong>{analytics.highVolume.length}</strong>
              </article>
              <article>
                <span>Repeated failures</span>
                <strong>{analytics.repeatedFailures.length}</strong>
              </article>
              <article>
                <span>Server-error endpoints</span>
                <strong>{analytics.serverErrors.length}</strong>
              </article>
            </div>

            <div className="insight-section">
              <h3>High-volume traffic</h3>
              {analytics.highVolume.length ? (
                <ul>
                  {analytics.highVolume.map((item) => (
                    <li key={item.ip}>
                      <code>{item.ip}</code>
                      <strong>{item.requests} requests</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="insight-empty">No high-volume IPs detected.</p>
              )}
            </div>

            <div className="insight-section">
              <h3>Repeated authentication failures</h3>
              {analytics.repeatedFailures.length ? (
                <ul>
                  {analytics.repeatedFailures.map((item) => (
                    <li key={item.ip}>
                      <code>{item.ip}</code>
                      <strong>{item.failures} failures</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="insight-empty">No repeated failures detected.</p>
              )}
            </div>

            <div className="insight-section">
              <h3>Server errors</h3>
              {analytics.serverErrors.length ? (
                <ul>
                  {analytics.serverErrors.map((item) => (
                    <li key={item.endpoint}>
                      <code>{item.endpoint}</code>
                      <strong>{item.errors} errors</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="insight-empty">No server errors detected.</p>
              )}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
