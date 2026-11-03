
export interface HighVolumeRecord {
  ip: string;
  requests: number;
}

export interface FailureRecord {
  ip: string;
  failures: number;
}

export interface ServerErrorRecord {
  endpoint: string;
  errors: number;
}

export interface Analytics {
  highVolume: HighVolumeRecord[];
  repeatedFailures: FailureRecord[];
  serverErrors: ServerErrorRecord[];
  lastUpdated: string;
}

const BUCKET_NAME = "web-logs-bucket-cloud-computing";

const BASE_URL =
  `https://storage.googleapis.com/${BUCKET_NAME}/output`;

async function fetchReport(filename: string): Promise<string> {
  const url = `${BASE_URL}/${filename}?t=${Date.now()}`;

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Could not retrieve ${filename}: HTTP ${response.status}`
    );
  }

  return response.text();
}

// PigStorage may produce tab-separated or comma-separated output.
// This parser supports either format.
function parseRows(content: string): string[][] {
  if (!content.trim()) return [];

  return content
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const delimiter = line.includes("\t") ? "\t" : ",";
      return line.split(delimiter).map((value) => value.trim());
    });
}

function parseHighVolume(content: string): HighVolumeRecord[] {
  return parseRows(content).map(([ip, requests]) => ({
    ip,
    requests: Number(requests),
  }));
}

function parseFailures(content: string): FailureRecord[] {
  return parseRows(content).map(([ip, failures]) => ({
    ip,
    failures: Number(failures),
  }));
}

function parseServerErrors(content: string): ServerErrorRecord[] {
  return parseRows(content).map(([endpoint, errors]) => ({
    endpoint,
    errors: Number(errors),
  }));
}

export async function fetchAnalytics(): Promise<Analytics> {
  const [
    highVolumeCSV,
    failuresCSV,
    serverErrorsCSV,
  ] = await Promise.all([
    fetchReport("high_volume.csv"),
    fetchReport("repeated_failures.csv"),
    fetchReport("server_errors.csv"),
  ]);

  return {
    highVolume: parseHighVolume(highVolumeCSV),
    repeatedFailures: parseFailures(failuresCSV),
    serverErrors: parseServerErrors(serverErrorsCSV),
    lastUpdated: new Date().toLocaleString(),
  };
}
