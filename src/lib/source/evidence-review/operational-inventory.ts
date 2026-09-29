import { createHash } from "node:crypto";
import Papa from "papaparse";

import { parseFileToRows } from "@/lib/source/facts/extraction/file-to-rows";

const REQUIRED_COLUMNS = [
  "Service ID", "Service Name", "Scope Boundary", "Criticality",
  "Lifecycle State", "Service Owner", "Source Basis", "As Of Date",
] as const;

const CRITICALITIES = new Set(["low", "medium", "high", "critical"]);

function cell(value: string | number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value).trim();
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

export async function reviewOperationalInventory(input: {
  artifact: { originalName: string; mimeType: string; sha256: string };
  bytes: Buffer;
}): Promise<{ ok: true; rowCount: number; sourceSha256: string } | { ok: false; reason: string }> {
  const { artifact, bytes } = input;
  const kind = artifact.originalName.toLowerCase().endsWith(".csv") ? "csv" :
    artifact.originalName.toLowerCase().endsWith(".xlsx") ? "xlsx" : null;
  const expectedMime = kind === "csv" ? new Set(["text/csv", "application/csv", "application/vnd.ms-excel"]) :
    new Set(["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]);
  if (!kind || !expectedMime.has(artifact.mimeType)) {
    return { ok: false, reason: "A CSV or XLSX inventory with a matching MIME type is required." };
  }
  const sourceSha256 = createHash("sha256").update(bytes).digest("hex");
  if (sourceSha256 !== artifact.sha256.toLowerCase()) {
    return { ok: false, reason: "The stored inventory bytes do not match its registered hash." };
  }
  if (kind === "csv") {
    const parsed = Papa.parse<string[]>(bytes.toString("utf8"), {
      header: false,
      skipEmptyLines: "greedy",
    });
    const headerWidth = parsed.data[0]?.length;
    if (parsed.errors.length > 0 ||
        !headerWidth ||
        parsed.data.some((row) => !Array.isArray(row) || row.length !== headerWidth)) {
      return { ok: false, reason: "Inventory CSV has malformed or uneven rows." };
    }
  }
  let upload;
  try {
    upload = await parseFileToRows({
      bytes,
      filename: artifact.originalName,
      mimeType: artifact.mimeType,
      preferredWorksheet: "Intake",
    });
  } catch {
    return { ok: false, reason: "The inventory could not be parsed as CSV or XLSX." };
  }
  if (new Set(upload.headers.map((header) => header.toLowerCase())).size !== upload.headers.length) {
    return { ok: false, reason: "Inventory headers must be unique." };
  }
  const missing = REQUIRED_COLUMNS.filter((header) => !upload.headers.includes(header));
  if (missing.length > 0) {
    return { ok: false, reason: `Missing inventory columns: ${missing.join(", ")}.` };
  }
  if (upload.rows.length === 0) {
    return { ok: false, reason: "The inventory has no service rows." };
  }
  const ids = new Set<string>();
  for (const [index, row] of upload.rows.entries()) {
    const id = cell(row["Service ID"]).toLowerCase();
    const date = cell(row["As Of Date"]);
    const criticality = cell(row.Criticality).toLowerCase();
    if (REQUIRED_COLUMNS.some((header) => !cell(row[header])) ||
        !CRITICALITIES.has(criticality) ||
        !isCalendarDate(date)) {
      return { ok: false, reason: `Inventory row ${index + 1} lacks a valid service identity, boundary, criticality, lifecycle, owner, source or as-of date.` };
    }
    if (ids.has(id)) {
      return { ok: false, reason: `Duplicate service ID at row ${index + 1}.` };
    }
    ids.add(id);
  }
  return { ok: true, rowCount: upload.rows.length, sourceSha256 };
}
