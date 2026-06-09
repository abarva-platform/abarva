// =============================================================================
// Current-state document-readiness model (Moves P0/P1/P2)
// -----------------------------------------------------------------------------
// Declares, per phase, the current-state evidence families a Move's charter must
// rest on (DORA engineering baseline, IT org, IT-systems landscape, etc.), and
// resolves how much of it is actually COMMITTED for the active tenant.
//
// Design: docs/build/moves-design/current-state-readiness-model.md
//
// Honest ingestion ladder (AGENTS.md context-ingestion truth standard):
//   missing -> staged -> parsing -> committed
// v1 (this module) reports `committed` (rows exist in the backing tower_* table
// for this client) vs `missing`. The `staged`/`parsing` states require the
// upload->family-tag seam (slice S4) and are part of the type now so the UI and
// resolver don't change shape later. We NEVER report `committed` until rows exist.
//
// Read-only + defensive: every backing-table probe is wrapped; a missing/renamed
// table or a query error reads as "no committed data" rather than throwing.
// =============================================================================

import "server-only";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";

export type FamilyKey =
  | "eng_performance_dora"
  | "it_org_structure"
  | "stakeholder_map"
  | "it_systems_landscape"
  | "delivery_quality_itsm"
  | "ai_tooling_adoption";

export type ReadinessStatus = "committed" | "parsing" | "staged" | "missing";
export type Severity = "hard" | "soft";

interface BackingSource {
  /** Tower/data-plane table that holds the COMMITTED current-state rows. */
  table: string;
  /** Tenant key column on that table (some Tower tables key on tenant_key). */
  keyColumn: "client_id" | "tenant_key";
}

export interface FamilySpec {
  key: FamilyKey;
  label: string;
  /** Plain-English reason the charter needs this — shown in the UI. */
  whyNeeded: string;
  /** What the user typically uploads to satisfy it. */
  sourceDocHint: string;
  /** Accepted upload formats for v1 deterministic ingest (CSV-first). */
  acceptedFormats: string[];
  /**
   * Committed-data source. Absent for families captured in-charter/chat
   * (e.g. stakeholder map) rather than ingested into a domain table.
   */
  backing?: BackingSource;
}

export const CURRENT_STATE_FAMILIES: Record<FamilyKey, FamilySpec> = {
  eng_performance_dora: {
    key: "eng_performance_dora",
    label: "Engineering performance baseline (DORA)",
    whyNeeded:
      "Sets the measurable baseline for Success metrics and Value range — deploy frequency, lead time, change-failure rate, MTTR. Targets are unsourced without it.",
    sourceDocHint: "CI/CD export (e.g. GitHub Actions deployments) as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_dora_metrics", keyColumn: "client_id" },
  },
  it_org_structure: {
    key: "it_org_structure",
    label: "IT / engineering org structure",
    whyNeeded:
      "Sponsor commitment and decision rights live in the org — teams, levels, contractor ratio, reporting lines.",
    sourceDocHint: "HRIS/Workday export or org chart (CSV preferred)",
    acceptedFormats: ["csv", "xlsx"],
    backing: { table: "tower_workforce", keyColumn: "client_id" },
  },
  stakeholder_map: {
    key: "stakeholder_map",
    label: "Stakeholder / decision-rights map",
    whyNeeded:
      "Named owners, contributors, and blockers for the Stakeholders section — who decides, who builds, who can stop it.",
    sourceDocHint: "Captured in-charter with Nexus, or a stakeholder list",
    acceptedFormats: ["csv", "docx"],
    // No domain table: captured in the charter / program_evidence_items (S4).
  },
  it_systems_landscape: {
    key: "it_systems_landscape",
    label: "IT systems & dependency landscape",
    whyNeeded:
      "Scopes which applications and dependencies the SDLC touches — precision the P0 scope boundary can't give.",
    sourceDocHint: "CMDB export (systems + dependencies) as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_cmdb_cis", keyColumn: "client_id" },
  },
  delivery_quality_itsm: {
    key: "delivery_quality_itsm",
    label: "Delivery quality / ITSM",
    whyNeeded:
      "Incidents, changes, MTTR and change-success — complements DORA for the current-state quality picture.",
    sourceDocHint: "ServiceNow ITSM export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_itsm_records", keyColumn: "tenant_key" },
  },
  ai_tooling_adoption: {
    key: "ai_tooling_adoption",
    label: "AI tooling adoption baseline",
    whyNeeded:
      "Current AI dev-tool penetration (Copilot / Claude Code) — the 'before' for an AI-powered SDLC.",
    sourceDocHint: "Tool admin export as CSV",
    acceptedFormats: ["csv"],
    backing: { table: "tower_ai_tool_usage", keyColumn: "client_id" },
  },
};

export interface RequiredFamily {
  key: FamilyKey;
  severity: Severity;
}

/**
 * Required current-state evidence families per phase. `phase` is the numeric
 * Move phase (0=Originate, 1=Charter, 2=Diagnose). The moveType arg is reserved
 * for future per-archetype variation; the AI-SDLC default is encoded here.
 */
export function requiredFamiliesForPhase(phase: number): RequiredFamily[] {
  switch (phase) {
    case 0:
      // Originate is lightweight — nothing blocks; use manifestForPhase() to
      // preview what P1 will need.
      return [];
    case 1:
      return [
        { key: "eng_performance_dora", severity: "hard" },
        { key: "it_org_structure", severity: "hard" },
        { key: "stakeholder_map", severity: "hard" },
        { key: "it_systems_landscape", severity: "hard" },
      ];
    case 2:
      return [
        { key: "eng_performance_dora", severity: "hard" },
        { key: "it_org_structure", severity: "hard" },
        { key: "it_systems_landscape", severity: "hard" },
        { key: "stakeholder_map", severity: "hard" },
        { key: "delivery_quality_itsm", severity: "soft" },
        { key: "ai_tooling_adoption", severity: "soft" },
      ];
    default:
      return [];
  }
}

/** Families to preview at a phase (P0 previews P1's needs for expectation-setting). */
export function manifestForPhase(phase: number): FamilyKey[] {
  const target = phase === 0 ? 1 : phase;
  return requiredFamiliesForPhase(target).map((f) => f.key);
}

export interface FamilyReadiness {
  key: FamilyKey;
  label: string;
  whyNeeded: string;
  sourceDocHint: string;
  severity: Severity;
  status: ReadinessStatus;
  backingTable: string | null;
  committedRows: number;
}

export interface ReadinessReport {
  phase: number;
  families: FamilyReadiness[];
  /** 0–100, hard families weighted 2×, soft 1×. */
  coverageScore: number;
  hardGaps: FamilyKey[];
  softGaps: FamilyKey[];
}

/** Count committed rows for a family's backing table, scoped to the tenant. Never throws. */
async function committedCount(
  ctx: TenancyCtx,
  spec: FamilySpec,
): Promise<number> {
  if (!spec.backing) return 0;
  const keyVal =
    spec.backing.keyColumn === "client_id"
      ? ctx.clientId
      : (ctx.clientKey ?? "");
  if (!keyVal) return 0;
  try {
    const sb = getAzureReadFluentClient();
    const { count, error } = await sb
      .from(spec.backing.table)
      .select("*", { count: "exact", head: true })
      .eq(spec.backing.keyColumn, keyVal);
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

const weightOf = (s: Severity): number => (s === "hard" ? 2 : 1);

/**
 * Resolve current-state readiness for a Move at a phase. Read-only; safe to call
 * on every render. Reports committed vs missing per required family + a weighted
 * coverage score and the hard/soft gaps.
 */
export async function resolveCurrentStateReadiness(
  ctx: TenancyCtx,
  phase: number,
): Promise<ReadinessReport> {
  const required = requiredFamiliesForPhase(phase);
  const families: FamilyReadiness[] = [];
  for (const rf of required) {
    const spec = CURRENT_STATE_FAMILIES[rf.key];
    const rows = await committedCount(ctx, spec);
    const status: ReadinessStatus = rows > 0 ? "committed" : "missing";
    families.push({
      key: spec.key,
      label: spec.label,
      whyNeeded: spec.whyNeeded,
      sourceDocHint: spec.sourceDocHint,
      severity: rf.severity,
      status,
      backingTable: spec.backing?.table ?? null,
      committedRows: rows,
    });
  }

  const hardGaps = families
    .filter((f) => f.severity === "hard" && f.status !== "committed")
    .map((f) => f.key);
  const softGaps = families
    .filter((f) => f.severity === "soft" && f.status !== "committed")
    .map((f) => f.key);

  const totalW = families.reduce((a, f) => a + weightOf(f.severity), 0) || 1;
  const gotW = families
    .filter((f) => f.status === "committed")
    .reduce((a, f) => a + weightOf(f.severity), 0);
  const coverageScore = Math.round((gotW / totalW) * 100);

  return { phase, families, coverageScore, hardGaps, softGaps };
}
