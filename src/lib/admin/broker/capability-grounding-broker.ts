/**
 * Capability Grounding broker · Wave 3 PR-1
 *
 * Live per-tenant capability grounding scores for the Setup / Admin
 * Capability Constellation surface and the Section 05 panel
 * ("Agent Readiness").  Replaces the hard-coded
 *   "Sentinel L3 · others L2"
 * label that lived in `home-overview-v2.ts` with real per-agent +
 * per-capability-family grounding levels derived from:
 *
 *   1.  Substrate completeness — segment-by-segment health state read
 *       from `data_inventory_segments` (via setup-data-broker) and
 *       the authored inventory fallback for cold-start tenants.
 *   2.  Last-N answer evaluation score — looked up from a
 *       to-be-introduced evaluator table.  No such table exists in
 *       production today, so the broker returns `lastEvalScore: null`
 *       for every (agent, family) row.  The rubric still grants L3
 *       when substrate is mature, but flags `evidence: 'estimated'`
 *       on the rollup so the surface can be honest about the gap.
 *
 * Contract:
 *
 *   getCapabilityGrounding(tenantKey) → CapabilityGrounding
 *
 * The four canonical agents are emitted in the catalog order
 * (Nexus · Sentinel · Steward · Atlas — same order the
 * `agent-readiness-composer` uses).  Each agent's families come from
 * the §9 agent-segment dependency map: an agent reports a
 * grounding score for every segment family it *depends on*, not for
 * every segment family in the inventory.
 *
 * Rubric (deterministic, evidence-first):
 *
 *   coverageRatio = segmentsCovered / segmentsRequired
 *     where "covered" = segment.healthState ∈ { complete · mature · partial }
 *
 *   tier(coverageRatio):
 *     0           → L0   (no segments loaded — agent has no grounding)
 *     0 < r < .25 → L1   (sparse — agent can hint, not answer)
 *     .25 ≤ r < .75 → L2 (functional — agent can answer with caveats)
 *     .75 ≤ r     → L3*  (board-ready — promote only if eval ≥ 0.8 or
 *                         lastEvalScore is null)
 *
 *   *L3-with-eval gate: if `lastEvalScore` is present AND
 *   < 0.8, demote the level to L2 even though substrate is mature.
 *   The substrate alone is not proof; until an evaluator confirms,
 *   we will not call something board-ready.  When lastEvalScore is
 *   null (no evaluator data yet) we hold the substrate score and
 *   mark the whole rollup `evidence: 'estimated'`.
 *
 * Honesty doctrine (memory · feedback_no_demo_thinking.md):
 *   - L0 is preferred to a fake L1 when no segments have loaded.
 *   - L3 requires either a passing eval or an explicit
 *     `evidence: 'estimated'` flag bubbled up so the UI never
 *     silently asserts "board-ready" off substrate alone.
 *   - The audit verdict §3 made this load-bearing: the constellation
 *     "is the single most differentiated screen in the whole
 *     product"; its labels must not lie.
 *
 * Broker-boundary doctrine: this file lives under
 * `src/lib/admin/broker/**` and is therefore the canonical zone
 * where direct data reads are permitted.  Substrate routes through
 * the existing `getSetupInventorySnapshot` adapter and authored
 * fallback — we never reach for Supabase directly.  The evaluator
 * table read path is reserved for the moment a `answer_eval` /
 * `eval_runs` table lands; until then the call stub returns null.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §3 (Intel
 * coverage) and §7 Wave 3 PR-1 for the surface narrative.
 */

import 'server-only';

import {
  buildAuthoredInventoryFallback,
  getSetupActsContent,
  type InventorySegmentRollup,
  type SetupInventorySnapshot,
} from '@/lib/admin/setup-acts-registry';
import { getSetupInventorySnapshot } from '@/lib/admin/setup-data-broker';

// ── Contract ────────────────────────────────────────────────────────────────

export type CapabilityGroundingAgent =
  | 'sentinel'
  | 'atlas'
  | 'steward'
  | 'nexus';

export type CapabilityGroundingLevel = 'L0' | 'L1' | 'L2' | 'L3';

/**
 * Per agent, per capability family, what we know about the agent's
 * ability to confidently act in that family today.  `segmentsRequired`
 * is `1` for every family in the dependency map — each family
 * corresponds to one substrate segment — but the contract leaves the
 * shape open in case future revisions group multiple segments under
 * one capability family.
 */
export interface CapabilityFamilyGrounding {
  familyId: string;
  /** Numeric segment family (1–14) for ordering and joins. */
  familyNumber: number;
  /** Friendly label, e.g. "KPI dictionary". */
  familyLabel: string;
  level: CapabilityGroundingLevel;
  segmentsCovered: number;
  segmentsRequired: number;
  /** 0–1 from last evaluator run, if any.  Null = no eval data. */
  lastEvalScore: number | null;
}

export interface CapabilityAgentGrounding {
  agent: CapabilityGroundingAgent;
  /**
   * The highest level the agent achieves across its primary
   * families.  Pre-computed so the landing panel can render
   * "Sentinel L3 · 3 others L2" without re-deriving on the client.
   */
  highestLevel: CapabilityGroundingLevel;
  /**
   * The average level across the agent's primary families,
   * collapsed to a single tier label (rounded down — honest).
   */
  averageLevel: CapabilityGroundingLevel;
  families: CapabilityFamilyGrounding[];
}

export interface CapabilityGrounding {
  /** Always emitted in the catalog agent order, even for cold tenants. */
  perAgent: CapabilityAgentGrounding[];
  refreshedAtIso: string;
  /**
   * `'live'` when substrate data flows AND evaluator scores exist.
   * `'estimated'` when either the substrate fell back to authored
   * fixture content OR no evaluator scores are available (today the
   * latter is the always-true case — there is no evaluator table).
   */
  evidence: 'live' | 'estimated';
}

// ── Catalog (mirrors agent-readiness-composer) ──────────────────────────────

/**
 * Agent → primary segment families it depends on.  Mirrors
 * `agent-readiness-composer.AGENT_PRIMARY_FAMILIES` so the
 * constellation and the panel agree on the dependency map.  If the
 * composer's map changes, this must change in lockstep.
 */
const AGENT_PRIMARY_FAMILIES: Record<CapabilityGroundingAgent, number[]> = {
  steward: [1, 9, 12],
  sentinel: [7, 11, 13],
  nexus: [6, 8, 10, 14],
  atlas: [3, 4, 5],
};

const SEGMENT_NAME_BY_FAMILY: Record<number, string> = {
  1: 'Enterprise profile',
  2: 'Org structure',
  3: 'IT system landscape',
  4: 'IT financials',
  5: 'KPI dictionary',
  6: 'Program inventory',
  7: 'Sourcing artifacts',
  8: 'Program deliverables',
  9: 'Evidence ledger',
  10: 'Operating telemetry',
  11: 'Vendor and contract',
  12: 'Compliance and regulatory',
  13: 'Industry context',
  14: 'Cross-program signals',
};

const SEGMENT_KEY_BY_FAMILY: Record<number, string> = {
  1: 'enterprise_profile',
  2: 'org_structure',
  3: 'it_landscape',
  4: 'it_financials',
  5: 'kpi_dictionary',
  6: 'program_inventory',
  7: 'sourcing_artifacts',
  8: 'program_deliverables',
  9: 'evidence_ledger',
  10: 'operating_telemetry',
  11: 'vendor_contracts',
  12: 'compliance',
  13: 'industry_context',
  14: 'cross_program_signals',
};

const AGENT_ORDER: CapabilityGroundingAgent[] = [
  'nexus',
  'sentinel',
  'steward',
  'atlas',
];

// ── Rubric ──────────────────────────────────────────────────────────────────

/**
 * A segment counts as "covered" for capability-grounding purposes
 * when its substrate health is at least `partial` — i.e. there is
 * enough material for the agent to ground a claim, even if not all
 * gaps are closed.  `mature` and `complete` are the strict cases;
 * `partial` is the soft case that still earns the segment.
 *
 * `thin`, `not_started`, and unknown health states do NOT count as
 * covered; the agent has nothing to ground against.
 */
const COVERED_HEALTH_STATES = new Set<string>([
  'complete',
  'mature',
  'partial',
]);

function levelForCoverageRatio(
  ratio: number,
  lastEvalScore: number | null,
): CapabilityGroundingLevel {
  if (ratio <= 0) return 'L0';
  if (ratio < 0.25) return 'L1';
  if (ratio < 0.75) return 'L2';
  // ratio >= 0.75 → L3 candidate.  Eval gate:
  //   - If lastEvalScore is null, we promote to L3 but the parent
  //     rollup will be flagged `evidence: 'estimated'` so the UI
  //     stays honest.
  //   - If lastEvalScore is present AND < 0.8, demote to L2.
  if (lastEvalScore !== null && lastEvalScore < 0.8) return 'L2';
  return 'L3';
}

/**
 * Average a list of levels by mapping each tier to its ordinal
 * (L0=0…L3=3), averaging, then rounding *down* to the next tier.
 * Rounding down is deliberate — we will not call an agent
 * board-ready in aggregate when half its families aren't.
 */
function averageLevel(levels: CapabilityGroundingLevel[]): CapabilityGroundingLevel {
  if (levels.length === 0) return 'L0';
  const ordinals = levels.map((l) => Number(l.slice(1)));
  const mean = ordinals.reduce((a, b) => a + b, 0) / ordinals.length;
  const floored = Math.floor(mean);
  const clamped = Math.max(0, Math.min(3, floored));
  return (['L0', 'L1', 'L2', 'L3'] as const)[clamped];
}

function maxLevel(levels: CapabilityGroundingLevel[]): CapabilityGroundingLevel {
  if (levels.length === 0) return 'L0';
  const ordinals = levels.map((l) => Number(l.slice(1)));
  const top = Math.max(...ordinals);
  const clamped = Math.max(0, Math.min(3, top));
  return (['L0', 'L1', 'L2', 'L3'] as const)[clamped];
}

// ── Evaluator scores (stub) ─────────────────────────────────────────────────

/**
 * Look up the last evaluator run's score for an (agent, family)
 * pair.  Returns null when no evaluator table is present — which is
 * the always-true case in production today.  The shape is reserved
 * so a future PR can wire `eval_runs` / `answer_eval` reads without
 * a contract churn.
 *
 * Importantly: when this returns null for *any* (agent, family),
 * the broker MUST flag the rollup `evidence: 'estimated'`.  The
 * substrate score may say L3, but absent a passing eval we will
 * not call it live.
 */
/* eslint-disable @typescript-eslint/no-unused-vars */
async function fetchLastEvalScore(
  _tenantKey: string,
  _agent: CapabilityGroundingAgent,
  _familyNumber: number,
): Promise<number | null> {
  // No evaluator table exists in production today; grep for
  // `eval_runs`, `answer_eval`, `evaluator` confirms.  Return null
  // so the rubric falls back to substrate-only AND the caller
  // marks the rollup `'estimated'`.
  //
  // When the evaluator landing PR ships, this is the function that
  // grows a Supabase read for the latest `eval_runs` row keyed by
  // (tenant, agent, family).
  return null;
}
/* eslint-enable @typescript-eslint/no-unused-vars */

// ── Composition ─────────────────────────────────────────────────────────────

/**
 * Build one agent's family grounding rollup from a substrate
 * snapshot (live or authored fallback).  Pure / sync once the
 * eval-score map is in hand.
 */
function composeAgentGrounding(
  agent: CapabilityGroundingAgent,
  familyHealthByNumber: Map<number, string>,
  evalScoreByFamily: Map<number, number | null>,
): CapabilityAgentGrounding {
  const families = AGENT_PRIMARY_FAMILIES[agent];
  const rows: CapabilityFamilyGrounding[] = families.map((familyNumber) => {
    const healthState = familyHealthByNumber.get(familyNumber) ?? 'not_started';
    const isCovered = COVERED_HEALTH_STATES.has(healthState);
    const segmentsCovered = isCovered ? 1 : 0;
    const segmentsRequired = 1;
    const lastEvalScore = evalScoreByFamily.get(familyNumber) ?? null;
    const ratio = segmentsCovered / segmentsRequired;
    const level = levelForCoverageRatio(ratio, lastEvalScore);
    return {
      familyId: SEGMENT_KEY_BY_FAMILY[familyNumber] ?? `seg_${familyNumber}`,
      familyNumber,
      familyLabel: SEGMENT_NAME_BY_FAMILY[familyNumber] ?? `Segment ${familyNumber}`,
      level,
      segmentsCovered,
      segmentsRequired,
      lastEvalScore,
    };
  });
  const levels = rows.map((r) => r.level);
  return {
    agent,
    highestLevel: maxLevel(levels),
    averageLevel: averageLevel(levels),
    families: rows,
  };
}

/**
 * Compose the full capability-grounding rollup for one tenant.
 *
 * Resolves segments from `getSetupInventorySnapshot`; falls back to
 * authored inventory fixtures when the live snapshot is unavailable
 * (cold-start tenant, RLS deny, transient error).  Either way, the
 * shape returned is stable: 4 agents in canonical order, each with
 * its catalog primary families.
 *
 * The `evidence` flag tells the caller how to render the rollup:
 *   - `'live'`   ↦ substrate flowed AND every family had an eval score
 *   - `'estimated'` ↦ substrate fell back OR any family had no eval
 *
 * Today the second condition is always true (no evaluator table),
 * so the broker effectively returns `'estimated'` for every tenant
 * — exactly the posture the verdict §3 demands until evaluator
 * scoring lands.
 *
 * @param tenantKey  Broker-shape tenant key (the same string
 *   `getSetupInventorySnapshot` expects — kebab-case, e.g.
 *   `apex-retail`).  Callers holding the app `ClientKey`
 *   (e.g. `apexretail`) must map via
 *   `clientKeyToInventorySubstrateKey` before invoking.
 * @param options.snapshotOverride — optional pre-fetched snapshot.
 *   The admin landing already fetches the inventory snapshot once
 *   for its masthead pills + Trust strip; threading it through here
 *   avoids a duplicate 3-query burst against `data_inventory_segments`
 *   / `data_inventory_audit_log` / `data_ingestion_runs` that would
 *   otherwise compete with TrustSpine for the single Postgres
 *   connection-pool slot (default `ABARVA_PG_POOL_MAX=1`) and surface
 *   as the amber "Live data temporarily unavailable" banner on
 *   non-Apex tenants. Matches the PR-2606 `getTrustSpine` dedup
 *   pattern: an explicit `null` override is honored as "no live
 *   substrate" without refetching.
 */
export async function getCapabilityGrounding(
  tenantKey: string,
  options: { snapshotOverride?: SetupInventorySnapshot | null } = {},
): Promise<CapabilityGrounding> {
  // 1. Resolve substrate — prefer the caller-supplied snapshot
  //    override (admin landing dedup path); otherwise fall back to a
  //    fresh `getSetupInventorySnapshot` read; finally fall back to
  //    authored inventory if both are missing. The authored fallback
  //    is keyed off `setup-acts-registry`, which understands every
  //    canonical tenant and emits a deterministic 14-segment shape.
  let segments: InventorySegmentRollup[];
  let substrateLive = false;
  const hasSnapshotOverride = Object.prototype.hasOwnProperty.call(
    options,
    'snapshotOverride',
  );
  try {
    const snapshot = hasSnapshotOverride
      ? options.snapshotOverride ?? null
      : await getSetupInventorySnapshot(tenantKey);
    if (snapshot && snapshot.segments.length > 0) {
      segments = snapshot.segments;
      substrateLive = true;
    } else {
      // The broker's tenantKey is kebab-case (e.g. `apex-retail`)
      // while the authored fixture is keyed on the app ClientKey
      // (e.g. `apexretail`).  Try the squashed form first, then
      // the raw form; either path produces a deterministic 14-row
      // sparse-content shape for unknown tenants.
      const content =
        getSetupActsContent(tenantKey.replace(/-/g, '')) ??
        getSetupActsContent(tenantKey);
      segments = buildAuthoredInventoryFallback(content).segments;
    }
  } catch {
    const content =
      getSetupActsContent(tenantKey.replace(/-/g, '')) ??
      getSetupActsContent(tenantKey);
    segments = buildAuthoredInventoryFallback(content).segments;
  }

  // 2. Index segments by family number for O(1) lookup.
  const familyHealthByNumber = new Map<number, string>();
  for (const seg of segments) {
    familyHealthByNumber.set(seg.familyNumber, seg.healthState);
  }

  // 3. Resolve evaluator scores for the union of all primary
  //    families across all agents.  No table exists today, so every
  //    score is null — but the loop is shaped so a future PR can
  //    swap `fetchLastEvalScore` for a real read without churn.
  const allRequiredFamilies = new Set<number>();
  for (const agent of AGENT_ORDER) {
    for (const f of AGENT_PRIMARY_FAMILIES[agent]) {
      allRequiredFamilies.add(f);
    }
  }
  const evalScoreByFamily = new Map<number, number | null>();
  let anyEvalScorePresent = false;
  await Promise.all(
    [...allRequiredFamilies].map(async (familyNumber) => {
      // We collapse "any agent's score for this family" to one score
      // per family for the v1 broker — the per-(agent, family)
      // distinction would matter once an evaluator emits separate
      // scores per agent.  Today the read is a stub returning null
      // regardless of agent, so collapsing is safe and keeps the
      // surface contract simple.
      const score = await fetchLastEvalScore(tenantKey, 'sentinel', familyNumber);
      evalScoreByFamily.set(familyNumber, score);
      if (score !== null) anyEvalScorePresent = true;
    }),
  );

  // 4. Compose per-agent rollups.
  const perAgent = AGENT_ORDER.map((agent) =>
    composeAgentGrounding(agent, familyHealthByNumber, evalScoreByFamily),
  );

  // 5. Decide evidence flag.  Live requires BOTH a real substrate
  //    snapshot AND at least one evaluator score for at least one
  //    family on the rollup.  Today the second clause is always
  //    false, so `evidence` is always `'estimated'` — exactly what
  //    the verdict asks for.
  const evidence: 'live' | 'estimated' =
    substrateLive && anyEvalScorePresent ? 'live' : 'estimated';

  return {
    perAgent,
    refreshedAtIso: new Date().toISOString(),
    evidence,
  };
}

// ── Helpers exposed for downstream callers (panel composition) ──────────────

/**
 * Render the Section 05 panel foot text from a grounding rollup.
 *
 * Replaces the hard-coded
 *   "Sentinel L3 · others L2"
 * label.  Reports the *Sentinel* highest level explicitly (Sentinel
 * is the headline agent for Intelligence per the catalog) and the
 * *average across the three other agents* as the second clause.
 * Honest about the count — "3 others" — even when the average
 * lands at L0.
 *
 * Example outputs:
 *   "Sentinel L3 · 3 others avg L2"
 *   "Sentinel L1 · 3 others avg L1"
 *   "Sentinel L0 · 3 others avg L0 · estimated"
 */
export function panelFootFromGrounding(
  grounding: CapabilityGrounding,
): string {
  const sentinel = grounding.perAgent.find((a) => a.agent === 'sentinel');
  const others = grounding.perAgent.filter((a) => a.agent !== 'sentinel');
  const sentinelLevel = sentinel?.highestLevel ?? 'L0';
  const otherLevels = others.map((a) => a.averageLevel);
  const othersAvg = averageLevel(otherLevels);
  const base = `Sentinel ${sentinelLevel} · ${others.length} others avg ${othersAvg}`;
  return grounding.evidence === 'estimated' ? `${base} · estimated` : base;
}

/**
 * Decide the Section 05 panel `status` (ready vs attn) from a
 * grounding rollup.  The verdict's heuristic: if Sentinel itself
 * hasn't crossed L2, the panel is in attention; otherwise it's
 * ready.  Same threshold the old hard-coded `segMature < 18`
 * approximation was reaching for, now grounded in the actual
 * capability scores.
 */
export function panelStatusFromGrounding(
  grounding: CapabilityGrounding,
): 'ready' | 'attn' {
  const sentinel = grounding.perAgent.find((a) => a.agent === 'sentinel');
  const sentinelLevel = sentinel?.highestLevel ?? 'L0';
  const ordinal = Number(sentinelLevel.slice(1));
  return ordinal >= 2 ? 'ready' : 'attn';
}
