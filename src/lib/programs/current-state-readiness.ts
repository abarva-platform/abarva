// =============================================================================
// Current-state readiness — estate profile inference + archetype-driven resolver.
// -----------------------------------------------------------------------------
// WHAT current-state evidence is required at a phase is declared by the MOVE's
// ARCHETYPE (src/lib/programs/archetypes), refined by the client's real ESTATE
// (the MoveProfile inferred here). This module owns the ESTATE axis (profile
// inference + committed-row checks); the ARCHETYPE axis lives in the registry +
// resolver. There is NO hardcoded phase→family list here anymore.
//
// Honest ingestion ladder (AGENTS.md): missing -> staged -> parsing -> committed.
// v1 reports committed (rows in the backing tower_* table) vs missing.
// Read-only + defensive: every probe is wrapped; a missing/renamed table reads as
// "no committed data" rather than throwing.
// =============================================================================

import "server-only";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import { resolveArchetypeRequirements } from "@/lib/programs/archetypes/resolver";
import {
  resolveDocFamilyReviews,
  type DocFamilyReviewState,
} from "@/lib/programs/current-state-doc-ingest";
import type {
  StrategicMoveArchetype,
  PhaseKey,
  EvidenceKind,
} from "@/lib/programs/archetypes/types";

// ── Profile dimensions (the estate axis) ─────────────────────────────────────

export type TeamArchetype =
  | "full_stack_cloud"
  | "data_engineering"
  | "mainframe"
  | "legacy_data_analytics" // DataStage / Informatica
  | "packaged_cots" // SAP / Salesforce config
  | "embedded";

export type DeliveryMaturity =
  | "waterfall"
  | "hybrid"
  | "scrum"
  | "continuous"
  | "unknown";

export type OrgTopology =
  | "centralized_platform"
  | "federated_squads"
  | "vendor_heavy"
  | "mixed"
  | "unknown";

export type CloudPosture =
  | "aws"
  | "azure"
  | "gcp"
  | "on_prem"
  | "hybrid"
  | "multi"
  | "unknown";

export type UseCaseArchetype =
  | "code_generation"
  | "test_automation"
  | "reqs_design"
  | "legacy_modernization"
  | "data_pipeline"
  | "docs_review"
  | "unknown";

export type DimensionProvenance =
  | "context_layer"
  | "declared"
  | "default"
  | "unknown";

/**
 * The estate-inferred shape of a Move. All dimensions optional/explicitly
 * "unknown"; built up progressively (context-layer first, then declared signals).
 * `provenance` records HOW each dimension was set — the engine never silently
 * fabricates a profile.
 */
export interface MoveProfile {
  useCaseArchetype: UseCaseArchetype;
  teamArchetypes: TeamArchetype[];
  deliveryMaturity: DeliveryMaturity;
  orgTopology: OrgTopology;
  cloudPosture: CloudPosture;
  existingAiTools: string[];
  industryKey?: string;
  provenance: Partial<Record<keyof MoveProfile, DimensionProvenance>>;
}

export function emptyProfile(): MoveProfile {
  return {
    useCaseArchetype: "unknown",
    teamArchetypes: [],
    deliveryMaturity: "unknown",
    orgTopology: "unknown",
    cloudPosture: "unknown",
    existingAiTools: [],
    provenance: {},
  };
}

export type ReadinessStatus =
  | "committed"
  | "review_required"
  | "parsing"
  | "staged"
  | "missing";
export type Severity = "hard" | "soft";

// ── Estate discovery: infer the profile from what the tenant HAS ─────────────

/** Count committed rows for a table, scoped to the tenant. Never throws. */
async function tableCount(
  ctx: TenancyCtx,
  table: string,
  keyColumn: "client_id" | "tenant_key",
): Promise<number> {
  const keyVal =
    keyColumn === "client_id" ? ctx.clientId : (ctx.clientKey ?? "");
  if (!keyVal) return 0;
  try {
    const sb = getAzureReadFluentClient();
    const { count, error } = await sb
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(keyColumn, keyVal);
    if (error) return 0;
    return typeof count === "number" ? count : 0;
  } catch {
    return 0;
  }
}

/**
 * Infer a MoveProfile from the context layer (what the client HAS). v1 uses
 * presence signals in the tower_* tables; unknown dimensions stay explicitly
 * "unknown" (the engine then collects the estate to learn them — honest cold
 * start). `declared` (e.g. from P0 Nexus Q&A) overrides inferred dimensions.
 */
export async function inferMoveProfile(
  ctx: TenancyCtx,
  declared: Partial<MoveProfile> = {},
): Promise<MoveProfile> {
  const profile = emptyProfile();

  const [doraRows, aiToolRows] = await Promise.all([
    tableCount(ctx, "tower_dora_metrics", "client_id"),
    tableCount(ctx, "tower_ai_tool_usage", "client_id"),
  ]);

  // DORA present => the client ships via CI/CD => at least one cloud/full-stack team.
  if (doraRows > 0) {
    profile.teamArchetypes.push("full_stack_cloud");
    profile.deliveryMaturity = "scrum";
    profile.provenance.teamArchetypes = "context_layer";
    profile.provenance.deliveryMaturity = "context_layer";
  }
  if (aiToolRows > 0) {
    profile.existingAiTools = ["present"];
    profile.provenance.existingAiTools = "context_layer";
  }

  // Declared signals win (and are marked as such).
  for (const k of Object.keys(declared) as (keyof MoveProfile)[]) {
    const v = declared[k];
    if (v === undefined) continue;
    // @ts-expect-error heterogeneous assignment guarded by key
    profile[k] = v;
    if (k !== "provenance") profile.provenance[k] = "declared";
  }

  return profile;
}

// ── Archetype-driven readiness resolution ────────────────────────────────────

const PHASE_KEY_BY_NUM: Record<number, PhaseKey> = {
  0: "originate",
  1: "charter",
  2: "diagnose",
  3: "design",
  4: "roadmap_business_case",
  5: "mobilize",
};

export interface InstrumentReadiness {
  key: string;
  label: string;
  kind: EvidenceKind;
  whyNeeded: string;
  sourceDocHint: string;
  severity: Severity;
  status: ReadinessStatus;
  backingTable: string | null;
  committedRows: number;
  /** Why this requirement applies to THIS archetype + estate at this phase. */
  rationale: string;
  /** True when this family is satisfied via the governed document→review→commit
   *  path (no canonical tower_* table). */
  documentFamily: boolean;
  /** Pending document reviews a reviewer can promote (governed). Empty for
   *  structured/backing-table families. */
  pendingReviews: DocFamilyReviewState["pendingItems"];
  /** Real, citation-ready content from the committed evidence (decisions, risks,
   *  baselines for document families; committed-record summary for structured).
   *  Fed into grounded deliverables so they carry actual facts, not just status. */
  evidenceDigest: string[];
}

export interface ReadinessReport {
  phase: number;
  archetypeId: string;
  archetypeName: string;
  archetypeVersion: string;
  profile: MoveProfile;
  instruments: InstrumentReadiness[];
  /** 0–100, hard weighted 2×, soft 1× — "recommendation readiness". */
  coverageScore: number;
  hardGaps: string[];
  softGaps: string[];
}

const weightOf = (s: Severity): number => (s === "hard" ? 2 : 1);

/**
 * Resolve current-state readiness for a Move at a phase: the ARCHETYPE declares
 * the required evidence families (refined by the estate profile), and this
 * function reports committed-vs-missing per family plus a weighted coverage
 * score. Read-only; safe per render.
 */
export async function resolveCurrentStateReadiness(
  ctx: TenancyCtx,
  archetype: StrategicMoveArchetype,
  profile: MoveProfile,
  phase: number,
  moveId?: string,
): Promise<ReadinessReport> {
  const phaseKey = PHASE_KEY_BY_NUM[phase];
  const required = phaseKey
    ? resolveArchetypeRequirements(archetype, phaseKey, profile)
    : [];

  const instruments: InstrumentReadiness[] = [];
  for (const { family, severity, rationale } of required) {
    let committedRows = 0;
    let status: ReadinessStatus = "missing";
    let pendingReviews: DocFamilyReviewState["pendingItems"] = [];
    let evidenceDigest: string[] = [];
    const documentFamily = !family.backing;

    if (family.backing) {
      // Structured family — committed when rows exist in the canonical store.
      committedRows = await tableCount(
        ctx,
        family.backing.table,
        family.backing.keyColumn,
      );
      status = committedRows > 0 ? "committed" : "missing";
      if (status === "committed") {
        // NEVER embed the raw backing-table id in the human-facing digest — it
        // surfaces verbatim in client deliverables/cards. The source is carried
        // separately as the (humanized) citation; the digest stays clean prose.
        evidenceDigest = [
          `${family.label}: ${committedRows} record${
            committedRows === 1 ? "" : "s"
          } committed.`,
        ];
      }
    } else if (moveId) {
      // Document family — governed review ladder decides the state. Approved
      // (committed) > pending (review_required) > none (missing). Move-scoped.
      const reviews = await resolveDocFamilyReviews(ctx, moveId, family.key);
      pendingReviews = reviews.pendingItems;
      if (reviews.approved > 0) {
        committedRows = reviews.approved;
        status = "committed";
        // Carry the REAL approved content (decisions/risks/baselines) forward.
        evidenceDigest = reviews.committedSignals.length
          ? reviews.committedSignals
          : [`${family.label}: committed and approved for use.`];
      } else if (reviews.pending > 0) {
        status = "review_required";
      } else {
        status = "missing";
      }
    }
    // Without a moveId we cannot resolve document evidence — stays "missing"
    // (honest: tenant-scoped renders can't see move-scoped review state).

    instruments.push({
      key: family.key,
      label: family.label,
      kind: family.kind,
      whyNeeded: family.whyNeeded,
      sourceDocHint: family.sourceDocHint,
      severity,
      status,
      backingTable: family.backing?.table ?? null,
      committedRows,
      rationale,
      documentFamily,
      pendingReviews,
      evidenceDigest,
    });
  }

  const hardGaps = instruments
    .filter((i) => i.severity === "hard" && i.status !== "committed")
    .map((i) => i.key);
  const softGaps = instruments
    .filter((i) => i.severity === "soft" && i.status !== "committed")
    .map((i) => i.key);

  const totalW = required.reduce((a, r) => a + weightOf(r.severity), 0) || 1;
  const gotW = instruments
    .filter((i) => i.status === "committed")
    .reduce((a, i) => a + weightOf(i.severity), 0);
  const coverageScore = Math.round((gotW / totalW) * 100);

  return {
    phase,
    archetypeId: archetype.id,
    archetypeName: archetype.name,
    archetypeVersion: archetype.version,
    profile,
    instruments,
    coverageScore,
    hardGaps,
    softGaps,
  };
}
