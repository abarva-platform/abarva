// =============================================================================
// Moves consulting engine — E3: maturity scoring + two-gap model + AI-leverage×
// readiness ranking (the "where to start" engine).
// -----------------------------------------------------------------------------
// Reasons over the COMMITTED current-state evidence (tower_* tables) + the estate
// MoveProfile to produce: (a) an 8-dimension maturity profile (1–5) where every
// score carries a citation + confidence and is "insufficient_evidence" when
// unbacked (never silently zero); (b) the two-gap model → CapabilityGap[] tagged
// foundation vs use_case; (c) a transparent, cited AI-leverage×readiness ranking
// per team archetype = aiApplicability × normalizedReadiness × gapWeightedUpside,
// producing the recommended where-to-start sequence.
//
// Design: docs/build/moves-design/moves-consulting-engine-arc.md (E3) +
// discovery-engine-design.md (8 dimensions, two-gap). Charter decision 5.
//
// Scoring/ranking/gap logic is PURE (takes signals); only the signal-gather and
// the orchestrator touch the DB, and they are defensive (never throw).
// =============================================================================

import "server-only";
import { getAzureReadFluentClient } from "@/lib/data-plane/postgresCompat";
import type { TenancyCtx } from "@/lib/programs/types.db";
import type {
  MoveProfile,
  TeamArchetype,
} from "@/lib/programs/current-state-readiness";

// ── Maturity dimensions (discovery-engine 8) ─────────────────────────────────

export type MaturityDimension =
  | "data_architecture"
  | "data_governance"
  | "data_management_quality"
  | "platform_infrastructure"
  | "analytics_ai"
  | "operating_model_process"
  | "people_skills"
  | "adoption_change_readiness";

export type Confidence = "high" | "medium" | "low" | "insufficient_evidence";

const DIMENSION_LABELS: Record<MaturityDimension, string> = {
  data_architecture: "Data Architecture",
  data_governance: "Data Governance",
  data_management_quality: "Data Management & Quality",
  platform_infrastructure: "Platform & Infrastructure",
  analytics_ai: "Analytics & AI",
  operating_model_process: "Operating Model & Process",
  people_skills: "People & Skills",
  adoption_change_readiness: "Adoption & Change Readiness",
};

export interface DimensionScore {
  dimension: MaturityDimension;
  label: string;
  score: number | null; // 1–5, or null when insufficient evidence
  confidence: Confidence;
  basis: string;
  citation: string;
}

// ── Evidence signals (gathered defensively from committed tower_* rows) ───────

export interface MaturitySignals {
  dora?: {
    rows: number;
    avgDeployFreq: number;
    avgCfr: number;
    avgMttr: number;
    avgLeadTime: number;
  };
  cmdb?: { rows: number };
  workforce?: { rows: number };
  aiTooling?: { rows: number };
}

const AI_LED_TARGET = 4; // target maturity for an AI-led SDLC

// ── Pure scoring ─────────────────────────────────────────────────────────────

const insufficient = (
  dimension: MaturityDimension,
  reason: string,
): DimensionScore => ({
  dimension,
  label: DIMENSION_LABELS[dimension],
  score: null,
  confidence: "insufficient_evidence",
  basis: reason,
  citation: "no committed evidence",
});

/** Score the 8 maturity dimensions from committed signals + profile. Pure. */
export function scoreMaturity(
  profile: MoveProfile,
  signals: MaturitySignals,
): DimensionScore[] {
  const scores: DimensionScore[] = [];

  // Platform & Infrastructure — from deployment frequency (CI/CD maturity).
  if (signals.dora) {
    const f = signals.dora.avgDeployFreq;
    const score = f >= 3 ? 4 : f >= 1 ? 3 : f >= 0.2 ? 2 : 1;
    scores.push({
      dimension: "platform_infrastructure",
      label: DIMENSION_LABELS.platform_infrastructure,
      score,
      confidence: "medium",
      basis: `Avg deployment frequency ${f.toFixed(2)}/day across ${signals.dora.rows} repo-periods`,
      citation: "tower_dora_metrics",
    });
  } else {
    scores.push(
      insufficient(
        "platform_infrastructure",
        "No DORA/CI-CD evidence committed",
      ),
    );
  }

  // Operating Model & Process — from lead time, change-failure rate, MTTR.
  if (signals.dora) {
    const { avgLeadTime, avgCfr, avgMttr } = signals.dora;
    // Lower is better on all three; map to a 1–5 band.
    const ltScore = avgLeadTime <= 24 ? 4 : avgLeadTime <= 72 ? 3 : 2;
    const cfrScore = avgCfr <= 15 ? 4 : avgCfr <= 25 ? 3 : 2;
    const mttrScore = avgMttr <= 4 ? 4 : avgMttr <= 12 ? 3 : 2;
    const score = Math.round((ltScore + cfrScore + mttrScore) / 3);
    scores.push({
      dimension: "operating_model_process",
      label: DIMENSION_LABELS.operating_model_process,
      score,
      confidence: "medium",
      basis: `Lead time ${avgLeadTime.toFixed(1)}h, change-fail ${avgCfr.toFixed(1)}%, MTTR ${avgMttr.toFixed(1)}h`,
      citation: "tower_dora_metrics",
    });
  } else {
    scores.push(
      insufficient(
        "operating_model_process",
        "No delivery-flow evidence committed",
      ),
    );
  }

  // Analytics & AI — from current AI dev-tool adoption.
  if (signals.aiTooling && signals.aiTooling.rows > 0) {
    scores.push({
      dimension: "analytics_ai",
      label: DIMENSION_LABELS.analytics_ai,
      score: 3,
      confidence: "low",
      basis: `AI dev-tool usage recorded across ${signals.aiTooling.rows} tool-periods (adoption present, depth unverified)`,
      citation: "tower_ai_tool_usage",
    });
  } else {
    scores.push(
      insufficient("analytics_ai", "No AI-tooling adoption evidence committed"),
    );
  }

  // People & Skills — from workforce inventory.
  if (signals.workforce && signals.workforce.rows > 0) {
    scores.push({
      dimension: "people_skills",
      label: DIMENSION_LABELS.people_skills,
      score: 3,
      confidence: "low",
      basis: `Workforce inventory present (${signals.workforce.rows} records); skills depth not yet assessed`,
      citation: "tower_workforce",
    });
  } else {
    scores.push(
      insufficient("people_skills", "No workforce/org evidence committed"),
    );
  }

  // Adoption & Change Readiness — proxy from AI-tool active usage.
  if (signals.aiTooling && signals.aiTooling.rows > 0) {
    scores.push({
      dimension: "adoption_change_readiness",
      label: DIMENSION_LABELS.adoption_change_readiness,
      score: 2,
      confidence: "low",
      basis:
        "Some AI-tool usage present, but change-readiness/culture not yet assessed",
      citation: "tower_ai_tool_usage",
    });
  } else {
    scores.push(
      insufficient(
        "adoption_change_readiness",
        "No adoption/change-readiness evidence committed",
      ),
    );
  }

  // Data Architecture / Governance / Management-Quality — need data-estate
  // evidence (CMDB data-domain / catalog) not yet collected in v1.
  for (const d of [
    "data_architecture",
    "data_governance",
    "data_management_quality",
  ] as MaturityDimension[]) {
    if (signals.cmdb && signals.cmdb.rows > 0 && d === "data_architecture") {
      scores.push({
        dimension: d,
        label: DIMENSION_LABELS[d],
        score: 2,
        confidence: "low",
        basis: `Systems inventory present (${signals.cmdb.rows} CIs); data-architecture depth not yet assessed`,
        citation: "tower_cmdb_cis",
      });
    } else {
      scores.push(insufficient(d, "No data-estate evidence committed"));
    }
  }

  return scores;
}

// ── Two-gap model ────────────────────────────────────────────────────────────

export type GapType = "foundation" | "use_case";

export interface CapabilityGap {
  id: string;
  dimension: MaturityDimension;
  capability: string;
  currentScore: number | null;
  targetScore: number;
  gapType: GapType;
  severity: "foundational" | "high" | "medium" | "low";
  rationale: string;
  citation: string;
}

// Foundation dimensions serve all future use cases; use-case dimensions are
// specific to the immediate AI-led-SDLC play.
const FOUNDATION_DIMS = new Set<MaturityDimension>([
  "data_architecture",
  "data_governance",
  "data_management_quality",
  "platform_infrastructure",
]);

/** Derive capability gaps for dimensions scored below the AI-led target. Pure. */
export function deriveCapabilityGaps(
  scores: DimensionScore[],
  target = AI_LED_TARGET,
): CapabilityGap[] {
  const gaps: CapabilityGap[] = [];
  for (const s of scores) {
    if (s.score === null) {
      // Unassessed foundation dims are a real (foundational) gap: we cannot yet
      // reason about them — surfaced honestly, not hidden.
      gaps.push({
        id: `gap_${s.dimension}`,
        dimension: s.dimension,
        capability: s.label,
        currentScore: null,
        targetScore: target,
        gapType: FOUNDATION_DIMS.has(s.dimension) ? "foundation" : "use_case",
        severity: FOUNDATION_DIMS.has(s.dimension) ? "high" : "medium",
        rationale:
          "Unassessed — current-state evidence for this dimension is not yet collected",
        citation: s.citation,
      });
      continue;
    }
    const delta = target - s.score;
    if (delta <= 0) continue;
    const severity =
      delta >= 3 ? "foundational" : delta === 2 ? "high" : "medium";
    gaps.push({
      id: `gap_${s.dimension}`,
      dimension: s.dimension,
      capability: s.label,
      currentScore: s.score,
      targetScore: target,
      gapType: FOUNDATION_DIMS.has(s.dimension) ? "foundation" : "use_case",
      severity,
      rationale: `Current ${s.score}/5 vs target ${target}/5 (${s.basis})`,
      citation: s.citation,
    });
  }
  return gaps;
}

// ── AI-leverage × readiness ranking ──────────────────────────────────────────

// Archetype baseline: how AI-amenable the team's work is. This is the crux of
// non-linearity — full-stack/cloud work has a far higher AI ceiling than
// mainframe or packaged-COTS work.
const AI_APPLICABILITY: Record<TeamArchetype, number> = {
  full_stack_cloud: 0.9,
  data_engineering: 0.8,
  legacy_data_analytics: 0.5,
  packaged_cots: 0.45,
  mainframe: 0.35,
  embedded: 0.4,
};

const ARCHETYPE_LABEL: Record<TeamArchetype, string> = {
  full_stack_cloud: "Full-stack / cloud-native",
  data_engineering: "Data engineering",
  legacy_data_analytics: "Legacy data analytics (DataStage/Informatica)",
  packaged_cots: "Packaged / COTS config",
  mainframe: "Mainframe / COBOL",
  embedded: "Embedded / firmware",
};

// Dimensions that matter most for AI-led SDLC readiness.
const READINESS_DIMS: MaturityDimension[] = [
  "platform_infrastructure",
  "operating_model_process",
  "analytics_ai",
  "people_skills",
];

export interface TeamLeverageScore {
  teamArchetype: TeamArchetype;
  label: string;
  aiApplicability: number;
  aiApplicabilityBasis: string;
  normalizedReadiness: number;
  readinessBasis: string;
  gapUpside: number;
  gapUpsideBasis: string;
  score: number;
  confidence: Confidence;
  rank: number;
}

const SEVERITY_WEIGHT: Record<CapabilityGap["severity"], number> = {
  foundational: 1,
  high: 0.75,
  medium: 0.5,
  low: 0.25,
};

/** Rank team archetypes by AI-leverage × readiness × gap-upside. Pure + cited. */
export function rankLeverage(
  profile: MoveProfile,
  scores: DimensionScore[],
  gaps: CapabilityGap[],
): TeamLeverageScore[] {
  const scored = scores.filter(
    (s) => READINESS_DIMS.includes(s.dimension) && s.score !== null,
  );
  const readinessAvg =
    scored.length > 0
      ? scored.reduce((a, s) => a + (s.score as number), 0) / scored.length / 5
      : 0;

  // Use-case gap upside: more/bigger use-case gaps = more value to unlock.
  const ucGaps = gaps.filter((g) => g.gapType === "use_case");
  const gapUpside =
    ucGaps.length > 0
      ? Math.min(
          1,
          ucGaps.reduce((a, g) => a + SEVERITY_WEIGHT[g.severity], 0) /
            ucGaps.length,
        )
      : 0.3;

  const out: TeamLeverageScore[] = profile.teamArchetypes.map((t) => {
    const applicability = AI_APPLICABILITY[t] ?? 0.4;
    const confidence: Confidence =
      scored.length >= 3
        ? "medium"
        : scored.length >= 1
          ? "low"
          : "insufficient_evidence";
    const score = applicability * readinessAvg * gapUpside;
    return {
      teamArchetype: t,
      label: ARCHETYPE_LABEL[t],
      aiApplicability: applicability,
      aiApplicabilityBasis: `Archetype baseline — ${ARCHETYPE_LABEL[t]} work is ${applicability >= 0.8 ? "highly" : applicability >= 0.5 ? "moderately" : "weakly"} AI-amenable`,
      normalizedReadiness: Number(readinessAvg.toFixed(3)),
      readinessBasis:
        scored.length > 0
          ? `Mean of ${scored.length} scored readiness dimensions (${scored.map((s) => s.dimension).join(", ")})`
          : "No readiness dimensions scored yet",
      gapUpside: Number(gapUpside.toFixed(3)),
      gapUpsideBasis: `Mean severity of ${ucGaps.length} use-case capability gaps`,
      score: Number(score.toFixed(4)),
      confidence,
      rank: 0,
    };
  });

  out.sort((a, b) => b.score - a.score);
  out.forEach((o, i) => (o.rank = i + 1));
  return out;
}

// ── Orchestrator (defensive DB reads) ────────────────────────────────────────

async function readRows(
  table: string,
  keyColumn: "client_id" | "tenant_key",
  keyVal: string,
  cols: string,
): Promise<Record<string, unknown>[]> {
  if (!keyVal) return [];
  try {
    const sb = getAzureReadFluentClient();
    const { data, error } = await sb
      .from(table)
      .select(cols)
      .eq(keyColumn, keyVal)
      .limit(1000);
    if (error || !Array.isArray(data)) return [];
    return data as Record<string, unknown>[];
  } catch {
    return [];
  }
}

async function tableCount(
  table: string,
  keyColumn: "client_id" | "tenant_key",
  keyVal: string,
): Promise<number> {
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

const avg = (xs: number[]) =>
  xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;

/** Gather maturity signals from committed evidence. Defensive; never throws. */
export async function gatherMaturitySignals(
  ctx: TenancyCtx,
): Promise<MaturitySignals> {
  const signals: MaturitySignals = {};

  const dora = await readRows(
    "tower_dora_metrics",
    "client_id",
    ctx.clientId,
    "deployment_frequency_per_day,change_failure_rate_pct,mttr_hours,lead_time_for_changes_hours",
  );
  if (dora.length > 0) {
    signals.dora = {
      rows: dora.length,
      avgDeployFreq: avg(
        dora.map((r) => Number(r.deployment_frequency_per_day) || 0),
      ),
      avgCfr: avg(dora.map((r) => Number(r.change_failure_rate_pct) || 0)),
      avgMttr: avg(dora.map((r) => Number(r.mttr_hours) || 0)),
      avgLeadTime: avg(
        dora.map((r) => Number(r.lead_time_for_changes_hours) || 0),
      ),
    };
  }

  const [cmdb, workforce, aiTooling] = await Promise.all([
    tableCount("tower_cmdb_cis", "client_id", ctx.clientId),
    tableCount("tower_workforce", "client_id", ctx.clientId),
    tableCount("tower_ai_tool_usage", "client_id", ctx.clientId),
  ]);
  if (cmdb > 0) signals.cmdb = { rows: cmdb };
  if (workforce > 0) signals.workforce = { rows: workforce };
  if (aiTooling > 0) signals.aiTooling = { rows: aiTooling };

  return signals;
}

export interface CurrentStateRecommendation {
  profile: MoveProfile;
  maturity: DimensionScore[];
  gaps: CapabilityGap[];
  ranking: TeamLeverageScore[];
  whereToStart: string;
  overallConfidence: Confidence;
}

function overallConfidence(scores: DimensionScore[]): Confidence {
  const scored = scores.filter((s) => s.score !== null);
  if (scored.length === 0) return "insufficient_evidence";
  if (scored.length >= 5) return "medium";
  return "low";
}

function whereToStartNarrative(
  ranking: TeamLeverageScore[],
  scores: DimensionScore[],
): string {
  const assessed = scores.filter((s) => s.score !== null).length;
  if (ranking.length === 0) {
    return "No team archetypes discovered yet — collect the systems inventory and org structure to reveal where AI leverage is highest.";
  }
  const top = ranking[0];
  if (top.confidence === "insufficient_evidence" || assessed < 2) {
    return `Provisional: ${top.label} ranks first on AI-applicability, but readiness is under-evidenced (${assessed} dimension${assessed === 1 ? "" : "s"} assessed). Collect more current-state before committing the sequence.`;
  }
  return `Start with ${top.label} (leverage score ${top.score}): highest AI-applicability × current readiness × unlocked upside. ${ranking.length > 1 ? `Sequence the remaining ${ranking.length - 1} area(s) behind it.` : ""}`.trim();
}

/** Build the full current-state recommendation for a Move. Defensive. */
export async function buildCurrentStateRecommendation(
  ctx: TenancyCtx,
  profile: MoveProfile,
): Promise<CurrentStateRecommendation> {
  const signals = await gatherMaturitySignals(ctx);
  const maturity = scoreMaturity(profile, signals);
  const gaps = deriveCapabilityGaps(maturity);
  const ranking = rankLeverage(profile, maturity, gaps);
  return {
    profile,
    maturity,
    gaps,
    ranking,
    whereToStart: whereToStartNarrative(ranking, maturity),
    overallConfidence: overallConfidence(maturity),
  };
}
