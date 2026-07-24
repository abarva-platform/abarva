/**
 * Deterministic CSV read/write helpers for the Nexus Pricing Engine reference
 * pack (datasets/reference/pricing-engine-v1/).
 *
 * These are intentionally hand-rolled rather than routed through a general
 * CSV library for the *write* path: the reference-pack determinism
 * requirement (PR1 brief §6.2 — "produce a deterministic checksum") means the
 * byte layout (field quoting rules, line endings, trailing newline) must be
 * fully under our control and stable across Node/library versions. Reads use
 * `papaparse` (already a repo dependency — see `src/scripts/tower/ingest-jira.ts`
 * and `scripts/seed/load-tenant-substrate.ts` for precedent) since read-side
 * behavior doesn't need to be bit-for-bit reproduced, just correct.
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import Papa from "papaparse";

/** RFC 4180-ish field escaping: quote if the field contains a comma, quote,
 * newline, or leading/trailing whitespace; double any embedded quotes. */
function csvField(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s) || s !== s.trim()) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/**
 * Serialize an array of plain objects to a CSV string, using `headers` as the
 * exact column order and only those columns (extra object keys are ignored).
 * Caller is responsible for pre-sorting `rows` deterministically (by code,
 * never by object/Map iteration order) — this function does not sort.
 */
export function toCsv(
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
): string {
  const lines = [headers.map(csvField).join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvField(row[h])).join(","));
  }
  // Always LF line endings, single trailing newline — stable across OSes.
  return `${lines.join("\n")}\n`;
}

export function writeCsv(
  filePath: string,
  headers: readonly string[],
  rows: readonly Record<string, unknown>[],
): void {
  fs.writeFileSync(filePath, toCsv(headers, rows), "utf8");
}

export function readCsv(filePath: string): Record<string, string>[] {
  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });
  if (parsed.errors.length > 0) {
    throw new Error(
      `${filePath}: CSV parse error(s): ${parsed.errors
        .map((e) => `${e.message} (row ${e.row})`)
        .join("; ")}`,
    );
  }
  return parsed.data;
}

export function sha256Hex(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function sha256File(filePath: string): string {
  return sha256Hex(fs.readFileSync(filePath));
}
