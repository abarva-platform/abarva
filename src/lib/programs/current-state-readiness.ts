// =============================================================================
// Moves consulting engine — E1: MoveProfile + estate-conditional current-state
// instrument library + readiness resolver.
// -----------------------------------------------------------------------------
// The engine collects comprehensively (scoped to the client's REAL estate) so it
// can later reason to a recommendation. WHAT current-state evidence is relevant is
// NON-LINEAR: it depends on the Move's profile (use case × team archetypes × tech
// estate × maturity), discovered from the context layer — NOT a fixed list, and
// NOT something the client self-declares as a decision.
//
// Design: docs/build/moves-design/moves-consulting-engine-arc.md (+ current-state-
// readiness-model.md R1/R2).
//
// This module is engine-general (no AI-SDLC hardcode): instruments carry
// applicability predicates over the profile; derivation filters the library by
// (phase, appliesWhen). Proven on the SkyHarbor AI-SDLC move.
//
// Honest ingestion ladder (AGENTS.md): missing -> staged -> parsing -> committed.
// Read-only + defensive: every backing-table probe is wrapped; a missing/renamed
// table or query error reads as "no committed data" rather than throwing.
// =============================================================================

import "server-only";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";

// ── Profile dimensions ───────────────────────────────────────────────────────

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
 * The estate-inferred shape of a Move. All dimensions are optional/explicitly
 * "unknown" — the profile is built up progressively (context-layer first, then
 * declared signals). `provenance` records HOW each dimension was set so the UI
 * can show confidence and the engine never silently fabricates a profile.
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

// ── Instrument library (estate-conditional) ──────────────────────────────────

export type ReadinessStatus = "committed" | "parsing" | "staged" | "missing";
export type Severity = "hard" | "soft";
export type InstrumentKind =
  | "metric_baseline"
  | "inventory"
  | "org"
  | "qualitative"
  | "document";

interface BackingSource {
  table: string;
  keyColumn: "client_id" | "tenant_key";
}

export interface EvidenceInstrument {
  key: string;
  label: string;
  kind: InstrumentKind;
  whyNeeded: string;
  sourceDocHint: string;
  acceptedFormats: string[];
  /** Phase at which the instrument first becomes relevant (1=Charter, 2=Diagnose). */
  phase: number;
  /** Estate predicate — is this instrument relevant for THIS profile? */
  appliesWhen: (p: MoveProfile) => boolean;
  /** Severity may depend on the profile (e.g. DORA harder for continuous-delivery teams). */
  severityFor: (p: MoveProfile) => Severity;
  /** Committed-data source, when the instrument is backed by a domain table. */
  backing?: BackingSource;
}

const has = (p: MoveProfile, ...t: TeamArchetype[]) =>
  t.some((x) => p.teamArchetypes.includes(x));
const archetypesUnknown = (p: MoveProfile) => p.teamArchetypes.length === 0;

/**
 * Engine-general instrument library. Each entry's `appliesWhen` branches on the
 * discovered estate — this is where the non-linearity lives. Estate-inventory
 * instruments (systems/org) always apply because they also REVEAL the archetypes;
 * archetype-deep instruments (DORA, mainframe, ETL) apply only when that estate
 * is present (or, at cold-start when archetypes are still unknown, the broadly
 * relevant ones are included to be pruned once the estate is discovered).
 */
export const INSTRUMENT_LIBRARY: EvidenceInstrument[] = [
  // ── Universal estate inventory + charter basics ──
  {
    key: "it_systems_landscape",
    label: "IT systems & dependency landscape",
    kind: "inventory",
    whyNeeded:
      "The estate inventory — applications, criticality, dependencies. Foundational: it also reveals which team/work archetypes exist (mainframe? cloud-native? packaged?).",
    sourceDocHint: "CMDB export (systems + dependencies) as CSV",
    acceptedFormats: ["csv"],
    phase: 1,
    appliesWhen: () => true,
    severityFor: () => "hard",
    backing: { table: "tower_cmdb_cis", keyColumn: "client_id" },
  },
  {
    key: "it_org_structure",
    label: "IT / engineering org structure",
    kind: "org",
    whyNeeded:
      "Teams, levels, contractor ratio, reporting lines, locations — who builds, who decides, and the change surface.",
    sourceDocHint: "HRIS/Workday export or org chart (CSV preferred)",
    acceptedFormats: ["csv", "xlsx"],
    phase: 1,
    appliesWhen: () => true,
    severityFor: () => "hard",
    backing: { table: "tower_workforce", keyColumn: "client_id" },
  },
  {
    key: "stakeholder_map",
    label: "Stakeholder / decision-rights map",
    kind: "qualitative",
    whyNeeded:
      "Named owners, contributors, and blockers — who decides, who builds, who can stop it.",
    sourceDocHint: "Captured in-charter with Nexus, or a stakeholder list",
    acceptedFormats: ["csv", "docx"],
    phase: 1,
    appliesWhen: () => true,
    severityFor: () => "hard",
  },
  // ── Archetype-conditional engineering baselines ──
  {
    key: "eng_performance_dora",
    label: "Engineering performance baseline (DORA)",
    kind: "metric_baseline",
    whyNeeded:
      "Deploy frequency, lead time, change-failure rate, MTTR — the measurable baseline for teams that actually ship via CI/CD. Targets are unsourced without it.",
    sourceDocHint: "CI/CD export (e.g. GitHub Actions deployments) as CSV",
    acceptedFormats: ["csv"],
    phase: 1,
    appliesWhen: (p) =>
      has(p, "full_stack_cloud", "data_engineering") || archetypesUnknown(p),
    // Hard where deployment is a practice; softer for waterfall/unknown cadence.
    severityFor: (p) =>
      p.deliveryMaturity === "scrum" ||
      p.deliveryMaturity === "continuous" ||
      archetypesUnknown(p)
        ? "hard"
        : "soft",
    backing: { table: "tower_dora_metrics", keyColumn: "client_id" },
  },
  {
    key: "delivery_quality_itsm",
    label: "Delivery quality / ITSM",
    kind: "metric_baseline",
    whyNeeded:
      "Incidents, changes, MTTR and change-success — the operational quality picture that complements DORA.",
    sourceDocHint: "ServiceNow ITSM export as CSV",
    acceptedFormats: ["csv"],
    phase: 2,
    appliesWhen: () => true,
    severityFor: () => "soft",
    backing: { table: "tower_itsm_records", keyColumn: "tenant_key" },
  },
  // ── Mainframe estate (only when present) ──
  {
    key: "mainframe_change_cadence",
    label: "Mainframe change cadence & batch profile",
    kind: "metric_baseline",
    whyNeeded:
      "For mainframe teams DORA deploy-frequency is meaningless — what matters is release/change cadence, batch windows, and incident exposure.",
    sourceDocHint: "Change calendar + batch schedule export",
    acceptedFormats: ["csv", "xlsx"],
    phase: 2,
    appliesWhen: (p) => has(p, "mainframe"),
    severityFor: () => "soft",
  },
  {
    key: "mainframe_modernization_candidates",
    label: "Mainframe code & modernization candidates",
    kind: "inventory",
    whyNeeded:
      "Program/COBOL inventory, code size/complexity, SME coverage — where AI-assisted modernization has leverage vs risk.",
    sourceDocHint: "Code inventory / static-analysis export",
    acceptedFormats: ["csv", "xlsx"],
    phase: 2,
    appliesWhen: (p) => has(p, "mainframe"),
    severityFor: () => "soft",
  },
  // ── Legacy data-analytics estate (DataStage/Informatica) ──
  {
    key: "etl_job_inventory",
    label: "ETL job inventory & run SLAs",
    kind: "inventory",
    whyNeeded:
      "For DataStage/Informatica teams: job inventory, schedules, run SLAs — the unit of AI leverage is the job/pipeline, not a deploy.",
    sourceDocHint: "ETL tool job export",
    acceptedFormats: ["csv"],
    phase: 2,
    appliesWhen: (p) => has(p, "legacy_data_analytics"),
    severityFor: () => "soft",
  },
  {
    key: "data_lineage",
    label: "Data lineage & quality",
    kind: "inventory",
    whyNeeded:
      "Lineage and data-quality posture for analytics estates — constrains what can be automated safely.",
    sourceDocHint: "Lineage/catalog export",
    acceptedFormats: ["csv"],
    phase: 2,
    appliesWhen: (p) => has(p, "legacy_data_analytics"),
    severityFor: () => "soft",
  },
  // ── Cross-cutting estate & readiness ──
  {
    key: "ai_tooling_today",
    label: "AI tooling adoption — benefits & gaps today",
    kind: "metric_baseline",
    whyNeeded:
      "What AI dev-tools they already use (Copilot/CodeWhisperer/Claude), where, adoption, and the benefits or gaps they see today — the 'before' for an AI-led SDLC.",
    sourceDocHint: "Tool admin export as CSV",
    acceptedFormats: ["csv"],
    phase: 2,
    appliesWhen: () => true,
    severityFor: () => "soft",
    backing: { table: "tower_ai_tool_usage", keyColumn: "client_id" },
  },
  {
    key: "change_readiness_culture",
    label: "Change readiness & ways of working",
    kind: "qualitative",
    whyNeeded:
      "Agility today, locations/ways-of-working, culture for change, prior transformation track record — drives adoption risk and sequencing.",
    sourceDocHint: "Captured with Nexus; prior assessments if any",
    acceptedFormats: ["docx", "csv"],
    phase: 2,
    appliesWhen: () => true,
    severityFor: () => "soft",
  },
];

export interface DerivedRequirement {
  instrument: EvidenceInstrument;
  severity: Severity;
}

/** Derive the applicable current-state instruments for a profile at a phase. */
export function deriveCurrentStateRequirements(
  profile: MoveProfile,
  phase: number,
): DerivedRequirement[] {
  return INSTRUMENT_LIBRARY.filter(
    (i) => i.phase <= phase && i.appliesWhen(profile),
  ).map((i) => ({ instrument: i, severity: i.severityFor(profile) }));
}

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
    profile.existingAiTools = ["present"]; // names resolved when the table is read in detail (E2)
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

// ── Readiness resolution over the derived set ────────────────────────────────

export interface InstrumentReadiness {
  key: string;
  label: string;
  kind: InstrumentKind;
  whyNeeded: string;
  sourceDocHint: string;
  severity: Severity;
  status: ReadinessStatus;
  backingTable: string | null;
  committedRows: number;
}

export interface ReadinessReport {
  phase: number;
  profile: MoveProfile;
  instruments: InstrumentReadiness[];
  /** 0–100, hard weighted 2×, soft 1× — "recommendation readiness". */
  coverageScore: number;
  hardGaps: string[];
  softGaps: string[];
}

const weightOf = (s: Severity): number => (s === "hard" ? 2 : 1);

/**
 * Resolve current-state readiness for a Move at a phase, given its (estate-
 * inferred) profile. Reports committed-vs-missing per DERIVED instrument, a
 * weighted coverage score, and the hard/soft gaps. Read-only; safe per render.
 */
export async function resolveCurrentStateReadiness(
  ctx: TenancyCtx,
  profile: MoveProfile,
  phase: number,
): Promise<ReadinessReport> {
  const required = deriveCurrentStateRequirements(profile, phase);
  const instruments: InstrumentReadiness[] = [];

  for (const { instrument, severity } of required) {
    let committedRows = 0;
    if (instrument.backing) {
      committedRows = await tableCount(
        ctx,
        instrument.backing.table,
        instrument.backing.keyColumn,
      );
    }
    const status: ReadinessStatus = committedRows > 0 ? "committed" : "missing";
    instruments.push({
      key: instrument.key,
      label: instrument.label,
      kind: instrument.kind,
      whyNeeded: instrument.whyNeeded,
      sourceDocHint: instrument.sourceDocHint,
      severity,
      status,
      backingTable: instrument.backing?.table ?? null,
      committedRows,
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

  return { phase, profile, instruments, coverageScore, hardGaps, softGaps };
}
