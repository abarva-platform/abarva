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

/** Governance lineage recorded for every uploaded evidence file. */
export interface EvidenceLineage {
  moveId: string;
  archetypeId: string;
  phase: number;
  family: string;
  tenantKey: string | null;
  sourceBasis: DatasetProvenance;
}

export interface IngestResult {
  family: string;
  parsedRows: number;
  committedRows: number;
  ledgerEntries: number;
  provenance: DatasetProvenance;
  /** Honest ladder: committed means rows landed; agent_ready is NEVER set here
   *  (it requires the governed promotion workflow). */
  readinessState: "missing" | "committed";
  promotedToAgent: false;
  lineage: EvidenceLineage;
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
  lineage: EvidenceLineage,
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
      artifact_ref: `current_state:eng_performance_dora:${lineage.moveId}:${fileRef}`,
      claim_text: `DORA engineering baseline ingested: ${committed} repo-period rows (deploy frequency, lead time, change-failure rate, MTTR)${synthetic ? " — REPRESENTATIVE/SYNTHETIC dataset, not a real client export" : ""}.`,
      source_type: "document_extract",
      source_ref: {
        fileRef,
        family: "eng_performance_dora",
        datasetProvenance: provenance,
        tenantKey: ctx.clientKey ?? null,
        rows: committed,
        // Governance lineage tags (PR-4).
        moveId: lineage.moveId,
        archetypeId: lineage.archetypeId,
        phase: lineage.phase,
        readinessState: "committed",
        // agent_ready is NEVER set on ingest — only via governed promotion.
        promotedToAgent: false,
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

// ── Shared evidence_ledger writer ────────────────────────────────────────────

async function writeLedger(
  sb: ReturnType<typeof getAzureWriteFluentClient>,
  ctx: TenancyCtx,
  family: string,
  artifactType: string,
  committed: number,
  fileRef: string,
  provenance: DatasetProvenance,
  nowIso: string,
  lineage: EvidenceLineage,
  claimText: string,
): Promise<number> {
  const synthetic = provenance === "representative_synthetic";
  const { error } = await sb.from("evidence_ledger").insert({
    client_id: ctx.clientId,
    surface: "moves",
    artifact_type: artifactType,
    artifact_ref: `current_state:${family}:${lineage.moveId}:${fileRef}`,
    claim_text: `${claimText}${synthetic ? " — REPRESENTATIVE/SYNTHETIC dataset, not a real client export" : ""}.`,
    source_type: "document_extract",
    source_ref: {
      fileRef,
      family,
      datasetProvenance: provenance,
      tenantKey: ctx.clientKey ?? null,
      rows: committed,
      moveId: lineage.moveId,
      archetypeId: lineage.archetypeId,
      phase: lineage.phase,
      readinessState: "committed",
      promotedToAgent: false,
    },
    freshness_at: nowIso,
    confidence: synthetic ? 0.6 : 0.8,
    confidence_basis: synthetic
      ? "Representative/synthetic illustrative dataset ingested via the governed upload path; document_extract, not a real client export."
      : "Client-supplied CSV ingested via the governed upload path; document_extract.",
    not_enough_data_flag: false,
    created_by: ctx.userId ?? "system",
  });
  return error ? 0 : 1;
}

// ── CMDB family (IT systems & application landscape) ──────────────────────────

const CMDB_REQUIRED = [
  "ci_sys_id",
  "ci_name",
  "ci_type",
  "ci_class",
  "lifecycle_state",
  "owner_team",
  "business_service",
  "criticality",
  "environment",
] as const;

export function parseCmdbCsv(text: string): {
  rows: Record<string, string>[];
  errors: string[];
} {
  const records = parseCsv(text);
  if (records.length === 0)
    return { rows: [], errors: ["empty or header-only CSV"] };
  const missing = CMDB_REQUIRED.filter((h) => !(h in records[0]));
  if (missing.length)
    return { rows: [], errors: [`missing columns: ${missing.join(", ")}`] };
  const errors: string[] = [];
  const rows = records.filter((r, i) => {
    if (!r.ci_sys_id || !r.ci_name) {
      errors.push(`row ${i + 2}: ci_sys_id/ci_name required`);
      return false;
    }
    return true;
  });
  return { rows, errors };
}

async function commitCmdb(
  ctx: TenancyCtx,
  rows: Record<string, string>[],
  fileRef: string,
  provenance: DatasetProvenance,
  nowIso: string,
  lineage: EvidenceLineage,
): Promise<{ committed: number; ledger: number }> {
  const sb = getAzureWriteFluentClient();
  let committed = 0;
  for (const r of rows) {
    const { error } = await sb.from("tower_cmdb_cis").upsert(
      {
        client_id: ctx.clientId, // TEXT column; tenant uuid as text (read-consistent)
        ci_sys_id: r.ci_sys_id,
        ci_name: r.ci_name,
        ci_type: r.ci_type || "application",
        ci_class: r.ci_class || "cmdb_ci_appl",
        lifecycle_state: r.lifecycle_state || "production",
        owner_team: r.owner_team || "unassigned",
        business_service: r.business_service || "unspecified",
        // tower_cmdb_cis.criticality CHECK IN (tier_1..tier_4); normalize "1".."4".
        criticality: /^tier_[1-4]$/.test(r.criticality)
          ? r.criticality
          : `tier_${["1", "2", "3", "4"].includes(r.criticality) ? r.criticality : "3"}`,
        environment: r.environment || "production",
        source_system:
          provenance === "representative_synthetic"
            ? "representative_csv_upload"
            : "client_csv_upload",
      },
      { onConflict: "client_id,ci_sys_id" },
    );
    if (!error) committed += 1;
  }
  const sb2 = getAzureWriteFluentClient();
  const ledger =
    committed > 0
      ? await writeLedger(
          sb2,
          ctx,
          "it_systems_landscape",
          "citation",
          committed,
          fileRef,
          provenance,
          nowIso,
          lineage,
          `IT systems & application landscape ingested: ${committed} configuration items (type, criticality, owner, environment)`,
        )
      : 0;
  return { committed, ledger };
}

// ── Workforce family (IT / engineering org structure) ─────────────────────────

const WORKFORCE_REQUIRED = [
  "employee_id",
  "function",
  "start_date",
  "as_of_date",
] as const;

export function parseWorkforceCsv(text: string): {
  rows: Record<string, string>[];
  errors: string[];
} {
  const records = parseCsv(text);
  if (records.length === 0)
    return { rows: [], errors: ["empty or header-only CSV"] };
  const missing = WORKFORCE_REQUIRED.filter((h) => !(h in records[0]));
  if (missing.length)
    return { rows: [], errors: [`missing columns: ${missing.join(", ")}`] };
  const errors: string[] = [];
  const rows = records.filter((r, i) => {
    if (!r.employee_id || !r.function) {
      errors.push(`row ${i + 2}: employee_id/function required`);
      return false;
    }
    if (!isDate(r.start_date) || !isDate(r.as_of_date)) {
      errors.push(`row ${i + 2}: start_date/as_of_date must be YYYY-MM-DD`);
      return false;
    }
    return true;
  });
  return { rows, errors };
}

async function commitWorkforce(
  ctx: TenancyCtx,
  rows: Record<string, string>[],
  fileRef: string,
  provenance: DatasetProvenance,
  nowIso: string,
  lineage: EvidenceLineage,
): Promise<{ committed: number; ledger: number }> {
  const sb = getAzureWriteFluentClient();
  let committed = 0;
  for (const r of rows) {
    const { error } = await sb.from("tower_workforce").upsert(
      {
        client_id: ctx.clientId,
        employee_id: r.employee_id,
        function: r.function,
        sub_function: r.sub_function || null,
        location: r.location || null,
        level: r.level || null,
        contractor_flag: /^(true|1|yes|y)$/i.test(r.contractor_flag ?? ""),
        start_date: r.start_date,
        as_of_date: r.as_of_date,
      },
      { onConflict: "client_id,employee_id,as_of_date" },
    );
    if (!error) committed += 1;
  }
  const sb2 = getAzureWriteFluentClient();
  const ledger =
    committed > 0
      ? await writeLedger(
          sb2,
          ctx,
          "it_org_structure",
          "citation",
          committed,
          fileRef,
          provenance,
          nowIso,
          lineage,
          `IT / engineering org structure ingested: ${committed} workforce records (function, level, location, contractor mix)`,
        )
      : 0;
  return { committed, ledger };
}

// ── Family registry + dispatch ───────────────────────────────────────────────

export type IngestFamily =
  | "eng_performance_dora"
  | "it_systems_landscape"
  | "it_org_structure";

interface FamilyHandler {
  parse: (text: string) => { rows: unknown[]; errors: string[] };
  commit: (
    ctx: TenancyCtx,
    rows: never[],
    fileRef: string,
    provenance: DatasetProvenance,
    nowIso: string,
    lineage: EvidenceLineage,
  ) => Promise<{ committed: number; ledger: number }>;
}

const FAMILY_INGESTORS: Record<IngestFamily, FamilyHandler> = {
  eng_performance_dora: {
    parse: parseDoraCsv as FamilyHandler["parse"],
    commit: commitDora as FamilyHandler["commit"],
  },
  it_systems_landscape: {
    parse: parseCmdbCsv as FamilyHandler["parse"],
    commit: commitCmdb as FamilyHandler["commit"],
  },
  it_org_structure: {
    parse: parseWorkforceCsv as FamilyHandler["parse"],
    commit: commitWorkforce as FamilyHandler["commit"],
  },
};

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
  tags: { moveId: string; archetypeId: string; phase: number },
): Promise<IngestResult> {
  const lineage: EvidenceLineage = {
    moveId: tags.moveId,
    archetypeId: tags.archetypeId,
    phase: tags.phase,
    family,
    tenantKey: ctx.clientKey ?? null,
    sourceBasis: provenance,
  };
  const base = {
    family,
    parsedRows: 0,
    committedRows: 0,
    ledgerEntries: 0,
    provenance,
    readinessState: "missing" as const,
    promotedToAgent: false as const,
    lineage,
  };

  const handler = FAMILY_INGESTORS[family];
  if (!handler) {
    return {
      ...base,
      errors: [`family not yet wired for CSV ingest: ${family}`],
    };
  }

  const { rows, errors } = handler.parse(text);
  if (rows.length === 0) {
    return {
      ...base,
      errors: errors.length ? errors : ["no valid rows parsed"],
    };
  }

  const { committed, ledger } = await handler.commit(
    ctx,
    rows as never[],
    fileRef,
    provenance,
    nowIso,
    lineage,
  );
  return {
    family,
    parsedRows: rows.length,
    committedRows: committed,
    ledgerEntries: ledger,
    provenance,
    // Honest separated state: committed when rows landed; agent_ready stays false.
    readinessState: committed > 0 ? "committed" : "missing",
    promotedToAgent: false,
    lineage,
    errors,
  };
}
