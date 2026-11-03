import { spawn } from "node:child_process";
import { realpath, stat } from "node:fs/promises";
import { extname, resolve } from "node:path";

type AnalysisStatus = "idle" | "running" | "succeeded" | "failed";

interface AnalysisJob {
  status: AnalysisStatus;
  startedAt: string | null;
  finishedAt: string | null;
  output: string;
  error: string | null;
  inputFile: string | null;
}

const BUCKET = "gs://web-logs-bucket-cloud-computing";
const MAX_CSV_BYTES = 100 * 1024 * 1024;

const job: AnalysisJob = {
  status: "idle",
  startedAt: null,
  finishedAt: null,
  output: "",
  error: null,
  inputFile: null,
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });
}

function appendOutput(chunk: string) {
  job.output = (job.output + chunk).slice(-20000);
}

function runCommand(
  command: string,
  args: string[],
  cwd: string,
): Promise<number> {
  return new Promise((resolveCode, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });

    child.stdout?.on("data", (chunk: Buffer) => appendOutput(chunk.toString()));
    child.stderr?.on("data", (chunk: Buffer) => appendOutput(chunk.toString()));

    child.once("error", reject);
    child.once("close", (code) => resolveCode(code ?? 1));
  });
}

async function executeAnalysis(csvPath: string | null) {
  const projectRoot = resolve(process.cwd(), "..");
  const scriptPath = resolve(projectRoot, "run-analysis.sh");

  try {
    if (csvPath) {
      appendOutput(`[UPLOAD] Validating CSV: ${csvPath}\n`);

      const absolutePath = await realpath(
        resolve(projectRoot, csvPath),
      );
      const fileInfo = await stat(absolutePath);

      if (!fileInfo.isFile()) {
        throw new Error("The supplied path is not a regular file.");
      }

      if (extname(absolutePath).toLowerCase() !== ".csv") {
        throw new Error("Please provide a file with a .csv extension.");
      }

      if (fileInfo.size > MAX_CSV_BYTES) {
        throw new Error("The CSV exceeds the 100 MB upload limit.");
      }

      appendOutput("[UPLOAD] Uploading CSV to Google Cloud Storage...\n");

      const uploadCode = await runCommand(
        "gcloud",
        [
          "storage",
          "cp",
          absolutePath,
          `${BUCKET}/input/access_logs.csv`,
        ],
        projectRoot,
      );

      if (uploadCode !== 0) {
        throw new Error(`GCS upload failed with exit code ${uploadCode}.`);
      }

      appendOutput("[UPLOAD] CSV uploaded successfully.\n");
      job.inputFile = absolutePath;
    }

    appendOutput("[ANALYSIS] Starting run-analysis.sh...\n");

    const analysisCode = await runCommand(
      "bash",
      [scriptPath],
      projectRoot,
    );

    if (analysisCode !== 0) {
      throw new Error(`Analysis script exited with code ${analysisCode}.`);
    }

    job.status = "succeeded";
    appendOutput("[DONE] Analysis and report upload completed.\n");
  } catch (error) {
    job.status = "failed";
    job.error =
      error instanceof Error ? error.message : "Analysis failed unexpectedly.";
    appendOutput(`[ERROR] ${job.error}\n`);
  } finally {
    job.finishedAt = new Date().toISOString();
  }
}

// GET /api/analysis: return the current job state.
export function loader() {
  return json(job);
}

// POST /api/analysis: run the existing GCS input, or first upload a supplied CSV.
export async function action({ request }: { request: Request }) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let csvPath: string | null = null;

  try {
    const bodyText = await request.text();

    if (bodyText.trim()) {
      const body = JSON.parse(bodyText) as { csvPath?: unknown };

      if (body.csvPath !== undefined) {
        if (typeof body.csvPath !== "string" || !body.csvPath.trim()) {
          return json({ error: "csvPath must be a non-empty file path." }, 400);
        }

        csvPath = body.csvPath.trim();
      }
    }
  } catch {
    return json({ error: "Invalid JSON request body." }, 400);
  }

  if (job.status === "running") {
    if (csvPath) {
      return json(
        { ...job, error: "Another analysis is already running. Try again when it finishes." },
        409,
      );
    }

    // The dashboard's normal startup request can join the active run.
    return json(job, 202);
  }

  job.status = "running";
  job.startedAt = new Date().toISOString();
  job.finishedAt = null;
  job.output = "";
  job.error = null;
  job.inputFile = csvPath;

  // Run in the background; the browser polls the loader for status.
  void executeAnalysis(csvPath);

  return json(job, 202);
}
