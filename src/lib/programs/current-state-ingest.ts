// =============================================================================
// Moves consulting engine — E2: current-state CSV ingest (parse -> commit).
// -----------------------------------------------------------------------------
// Turns an uploaded current-state CSV into COMMITTED rows in the canonical
// tower_* table for the tenant, plus an evidence_ledger citation. The readiness
// resolver (current-state-readiness.ts) then reads those committed rows and flips
// the instrument to "committed".
//
// HONESTY (AGENTS.md truth standard + standin charter): CSV auto-commits only on
// schema validation; every committed dataset is cited in evidence_ledger as
// source_type=document_extract with explicit `datasetProvenance` — when the file
// is a representative/synthetic estate export (SkyHarbor pilot has no real client
// export), it is flagged `representative_synthetic` and never labelled a real
// client export nor given higher trust. States are reported separately:
//   parsedRows (local parse passed) vs committedRows (rows in the tower table).
// Retrieval proof is the resolver reading the committed rows post-commit.
//
// Engine-general: FAMILY_INGESTORS maps a family -> {parse, commit}. DORA is wired
// first (charter); CMDB/workforce slot in behind the same contract.
// =============================================================================

import "server-only";
import { getAzureWriteFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";

export type DatasetProvenance = "client_export" | "representative_synthetic";

export interface IngestResult {
  family: string;
  parsedRows: number;
  committedRows: number;
  ledgerEntries: number;
  provenance: DatasetProvenance;
  errors: string[];
}

// ── CSV parsing (minimal, quote-aware) ───────────────────────────────────────

/** Split a single CSV line, honoring double-quoted fields with embedded commas. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQ) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

/** Parse CSV text into header-keyed records. Skips blank lines. */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map((h) => h.toLowerCase());
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => (rec[h] = cells[i] ?? ""));
    return rec;
  });
}

// ── DORA family ──────────────────────────────────────────────────────────────

export interface DoraRow {
  repo: string;
  team: string;
  period_start: string;
  period_end: string;
  deployment_frequency_per_day: number;
  lead_time_for_changes_hours: number;
  change_failure_rate_pct: number;
  mttr_hours: number;
  sample_size_deploys: number;
}

const DORA_REQUIRED = [
  "repo",
  "team",
  "period_start",
  "period_end",
  "deployment_frequency_per_day",
  "lead_time_for_changes_hours",
  "change_failure_rate_pct",
  "mttr_hours",
  "sample_size_deploys",
] as const;

const isDate = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
const num = (s: string) => (s === "" ? NaN : Number(s));

export function parseDoraCsv(text: string): {
  rows: DoraRow[];
  errors: string[];
} {
  const records = parseCsv(text);
  const errors: string[] = [];
  const rows: DoraRow[] = [];
  if (records.length === 0) {
    return { rows, errors: ["empty or header-only CSV"] };
  }
  const have = Object.keys(records[0]);
  const missing = DORA_REQUIRED.filter((h) => !have.includes(h));
  if (missing.length) {
    return { rows, errors: [`missing columns: ${missing.join(", ")}`] };
  }

  records.forEach((r, idx) => {
    const line = idx + 2; // 1-based + header
    const df = num(r.deployment_frequency_per_day);
    const lt = num(r.lead_time_for_changes_hours);
    const cfr = num(r.change_failure_rate_pct);
    const mttr = num(r.mttr_hours);
    const sample = num(r.sample_size_deploys);
    const rowErrs: string[] = [];
    if (!r.repo) rowErrs.push("repo empty");
    if (!isDate(r.period_start) || !isDate(r.period_end))
      rowErrs.push("period_start/period_end must be YYYY-MM-DD");
    if (r.period_end < r.period_start)
      rowErrs.push("period_end < period_start");
    if ([df, lt, cfr, mttr, sample].some((n) => Number.isNaN(n)))
      rowErrs.push("non-numeric metric");
    if (cfr < 0 || cfr > 100)
      rowErrs.push("change_failure_rate_pct out of 0–100");
    if ([df, lt, mttr, sample].some((n) => n < 0))
      rowErrs.push("negative metric");
    if (rowErrs.length) {
      errors.push(`row ${line}: ${rowErrs.join("; ")}`);
      return;
    }
    rows.push({
      repo: r.repo,
      team: r.team || "unspecified",
      period_start: r.period_start,
      period_end: r.period_end,
      deployment_frequency_per_day: df,
      lead_time_for_changes_hours: lt,
      change_failure_rate_pct: cfr,
      mttr_hours: mttr,
      sample_size_deploys: sample,
    });
  });

  return { rows, errors };
}

async function commitDora(
  ctx: TenancyCtx,
  rows: DoraRow[],
  fileRef: string,
  provenance: DatasetProvenance,
  nowIso: string,
): Promise<{ committed: number; ledger: number }> {
  const sb = getAzureWriteFluentClient();
  let committed = 0;
  for (const r of rows) {
    const { error } = await sb.from("tower_dora_metrics").upsert(
      {
        client_id: ctx.clientId,
        repo: r.repo,
        team: r.team,
        period_start: r.period_start,
        period_end: r.period_end,
        deployment_frequency_per_day: r.deployment_frequency_per_day,
        lead_time_for_changes_hours: r.lead_time_for_changes_hours,
        change_failure_rate_pct: r.change_failure_rate_pct,
        mttr_hours: r.mttr_hours,
        sample_size_deploys: r.sample_size_deploys,
        source:
          provenance === "representative_synthetic"
            ? "representative_csv_upload"
            : "client_csv_upload",
        source_file_id: fileRef,
        created_by: ctx.userId,
        updated_by: ctx.userId,
      },
      { onConflict: "client_id,repo,period_start,period_end" },
    );
    if (!error) committed += 1;
  }

  let ledger = 0;
  if (committed > 0) {
    const synthetic = provenance === "representative_synthetic";
    const { error } = await sb.from("evidence_ledger").insert({
      client_id: ctx.clientId,
      surface: "moves",
      artifact_type: "metric",
      artifact_ref: `current_state:eng_performance_dora:${fileRef}`,
      claim_text: `DORA engineering baseline ingested: ${committed} repo-period rows (deploy frequency, lead time, change-failure rate, MTTR)${synthetic ? " — REPRESENTATIVE/SYNTHETIC dataset, not a real client export" : ""}.`,
      source_type: "document_extract",
      source_ref: {
        fileRef,
        family: "eng_performance_dora",
        datasetProvenance: provenance,
        tenantKey: ctx.clientKey ?? null,
        rows: committed,
      },
      freshness_at: nowIso,
      confidence: synthetic ? 0.6 : 0.8,
      confidence_basis: synthetic
        ? "Representative/synthetic illustrative dataset ingested via the governed upload path; flagged document_extract, not a real client export."
        : "Client-supplied CSV ingested via the governed upload path; document_extract.",
      not_enough_data_flag: false,
      created_by: ctx.userId ?? "system",
    });
    if (!error) ledger = 1;
  }

  return { committed, ledger };
}

// ── Family registry + dispatch ───────────────────────────────────────────────

export type IngestFamily = "eng_performance_dora";

/**
 * Ingest a current-state CSV for a family: parse -> validate -> commit to the
 * canonical tower table + evidence_ledger. Returns the honest ladder counts.
 * `nowIso` is injected for testability (server passes new Date().toISOString()).
 */
export async function ingestCurrentStateCsv(
  ctx: TenancyCtx,
  family: IngestFamily,
  text: string,
  fileRef: string,
  provenance: DatasetProvenance,
  nowIso: string,
): Promise<IngestResult> {
  if (family !== "eng_performance_dora") {
    return {
      family,
      parsedRows: 0,
      committedRows: 0,
      ledgerEntries: 0,
      provenance,
      errors: [`family not yet wired for CSV ingest: ${family}`],
    };
  }

  const { rows, errors } = parseDoraCsv(text);
  if (rows.length === 0) {
    return {
      family,
      parsedRows: 0,
      committedRows: 0,
      ledgerEntries: 0,
      provenance,
      errors: errors.length ? errors : ["no valid rows parsed"],
    };
  }

  const { committed, ledger } = await commitDora(
    ctx,
    rows,
    fileRef,
    provenance,
    nowIso,
  );
  return {
    family,
    parsedRows: rows.length,
    committedRows: committed,
    ledgerEntries: ledger,
    provenance,
    errors,
  };
}
