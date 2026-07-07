// Expert Kernel — effort-estimator.
//
// Decomposes a Move into workstreams (AI build, integration, data,
// foundational, data governance, process redesign, change & adoption, run),
// each estimated as a role-mix effort with base / conservative / upside
// ranges and a human/agent split.
//
// Reuses the should-cost role-mix engine (`src/lib/source/should-cost/`) — the
// same blended-rate, on/offshore math is the single source of truth for
// labour economics across Source and Moves.
//
// Pure module: deterministic, no I/O.

import {
  buildShouldCostEstimate,
  type RoleMixEntry,
  type RoleRateCard,
} from '@/lib/source/should-cost/should-cost-model';
import {
  estimateAiOperatingCost,
  type AiOperatingCostInput,
  type AiOpsCostEstimate,
} from './ai-ops-cost';
import {
  buildEffortCostDistribution,
  type EffortCostDistribution,
  type ProbabilisticInputs,
} from './probabilistic';
import { RESEARCHED_PLANNING_RATES } from './rate-card/derived-planning-rate-card';
import { rangeOf, round2, sumRanges, type Range } from './types';

/** The eight standard Move workstreams. */
export type WorkstreamId =
  | 'ai_build'
  | 'integration'
  | 'data'
  | 'foundational'
  | 'data_governance'
  | 'process_redesign'
  | 'change_adoption'
  | 'run';

export const WORKSTREAM_LABELS: Record<WorkstreamId, string> = {
  ai_build: 'AI build',
  integration: 'Integration',
  data: 'Data',
  foundational: 'Foundational',
  data_governance: 'Data governance',
  process_redesign: 'Process redesign',
  change_adoption: 'Change & adoption',
  run: 'Run (year-1 operations)',
};

export interface WorkstreamInput {
  id: WorkstreamId;
  /** Proposed role mix for this workstream. */
  roleMix: RoleMixEntry[];
  /** Duration of this workstream in months. */
  durationMonths: number;
  /**
   * Fraction (0..1) of the workstream's labour that an AI agent performs
   * rather than a human. 0 = fully human, e.g. change & adoption.
   */
  agentSplit: number;
  /** Conservative multiplier on base effort (>= 1). Default 1.4. */
  conservativeMultiplier?: number;
  /** Upside (best-case) multiplier on base effort (<= 1). Default 0.85. */
  upsideMultiplier?: number;
}

export interface EffortEstimatorInput {
  moveName: string;
  /**
   * Shared fully-loaded rate card. Either a bare `RoleRateCard[]` (treated as
   * a planning default) or a labelled `KernelRateCard` carrying provenance.
   */
  rateCard: RoleRateCard[] | KernelRateCard;
  /** Engagement-level default offshore fraction (0..1). */
  offshoreRatio: number;
  workstreams: WorkstreamInput[];
  /** Optional AI operating-cost model. Omitted preserves the legacy effort estimate. */
  aiOps?: AiOperatingCostInput | null;
  /** Optional probabilistic wrapper inputs. Omitted preserves deterministic output. */
  probabilistic?: ProbabilisticInputs | null;
}

/**
 * Workstreams classified as "business change" rather than "AI build". The
 * spec (§2, §5.3) requires Moves to surface the build-vs-change effort split
 * explicitly — change is routinely the larger, under-budgeted half.
 */
export const BUSINESS_CHANGE_WORKSTREAMS: ReadonlySet<WorkstreamId> = new Set([
  'process_redesign',
  'change_adoption',
  'data_governance',
]);

export interface WorkstreamEstimate {
  id: WorkstreamId;
  label: string;
  /** base / conservative / upside as a cost Range (low=upside, high=conservative). */
  cost: Range;
  /** Fully-loaded base labour cost (the role-mix point estimate). */
  baseCost: number;
  /** Cost attributable to human effort. */
  humanCost: number;
  /** Cost attributable to AI-agent effort. */
  agentCost: number;
  agentSplit: number;
  totalHeadcount: number;
  durationMonths: number;
}

/**
 * The AI-build vs. business-change effort split — surfaced explicitly because
 * a Move that under-budgets the change half is the single most common way an
 * AI business case fails on contact (spec §2, §5.3).
 */
export interface BuildVsChangeSplit {
  /** Base cost of AI-build-side workstreams (ai_build, integration, data, foundational, run). */
  aiBuildCost: number;
  /** Base cost of business-change workstreams (process redesign, change & adoption, data governance). */
  businessChangeCost: number;
  /** Fraction (0..1) of total base effort that is business change. */
  businessChangeFraction: number;
  /** Three-year AI operating cost, when modeled; 0 when not supplied. */
  aiOpsCost: number;
  /** A plain-language read of whether the split looks credible. */
  note: string;
}

export interface EffortEstimate {
  moveName: string;
  workstreams: WorkstreamEstimate[];
  /** Total cost across all workstreams as a base/conservative/upside range. */
  totalCost: Range;
  /** Total human-effort cost (base). */
  totalHumanCost: number;
  /** Total agent-effort cost (base). */
  totalAgentCost: number;
  /** Fraction (0..1) of base effort delivered by AI agents. */
  effectiveAgentSplit: number;
  /** AI-build vs. business-change effort split. */
  buildVsChange: BuildVsChangeSplit;
  /** Optional AI run-cost estimate; null keeps non-AI-ops Moves backward compatible. */
  aiOpsCost: AiOpsCostEstimate | null;
  /** Optional distribution wrapper for the total effort cost. */
  probabilistic?: EffortCostDistribution | null;
  /** The resolved, provenance-labelled rate card the estimate was built on. */
  rateCard: KernelRateCard;
}

const DEFAULT_CONSERVATIVE = 1.4;
const DEFAULT_UPSIDE = 0.85;

// ---------------------------------------------------------------------------
// Rate-card abstraction
// ---------------------------------------------------------------------------
//
// The effort-estimator consumes a rate card through a labelled abstraction so
// a client-specific card always replaces the default cleanly. The default,
// `DEFAULT_PLANNING_RATE_CARD`, is the RESEARCHED benchmark card projected
// onto the six should-cost roles (see `rate-card/derived-planning-rate-card`).
// It is still a planning range, NEVER a quote (spec §5.4) — every band is a
// market-derived benchmark and is always client-overridable.

/** Provenance of a rate card — drives how it is labelled in the UI. */
export type RateCardProvenance =
  | 'planning_default' // bare role rates with no recorded provenance
  | 'researched_benchmark' // 3-D researched benchmark (SI × location × spec)
  | 'client_specific' // overrides everything — the client's own rate card
  | 'comprehensive'; // governed blend of client/vendor/internal rows + fallback

/** A rate card plus its provenance. The estimator consumes this, not raw rows. */
export interface KernelRateCard {
  provenance: RateCardProvenance;
  /** Human label surfaced in the UI, e.g. "Planning default — not a quote". */
  label: string;
  rates: RoleRateCard[];
}

/**
 * The kernel's default planning rate card. Fully-loaded annual cost per FTE,
 * derived from the researched 3-D SI benchmark card
 * (`rate-card/benchmark-rate-card.ts`) projected onto the six should-cost
 * roles. It is a researched planning benchmark — market-derived bands, NOT a
 * quote — and is always overridable by a client-specific card.
 */
export const DEFAULT_PLANNING_RATE_CARD: KernelRateCard = {
  provenance: 'researched_benchmark',
  label:
    'Researched benchmark rate card — fully-loaded annual rates derived from ' +
    'the 3-D SI benchmark (US Tier-1 archetype), a market planning range and ' +
    'NOT a quote. Override with a client-specific card before any commitment.',
  rates: RESEARCHED_PLANNING_RATES,
};

/**
 * Resolve a rate card for the estimator. Accepts either a bare `RoleRateCard[]`
 * (treated as planning-default) or a labelled `KernelRateCard`. Always returns
 * a labelled card so the provenance is never lost downstream.
 */
export function resolveRateCard(
  input: RoleRateCard[] | KernelRateCard | undefined,
): KernelRateCard {
  if (!input) return DEFAULT_PLANNING_RATE_CARD;
  if (Array.isArray(input)) {
    return {
      provenance: 'planning_default',
      label:
        'Planning rate card — bare role rates with no recorded provenance, ' +
        'NOT a quote. Override with a client-specific card before commitment.',
      rates: input,
    };
  }
  return input;
}

/**
 * Build an effort estimate. The per-workstream base cost is the should-cost
 * role-mix labour base; conservative and upside scale it. Throws on invalid
 * input (e.g. agentSplit outside 0..1).
 */
export function buildEffortEstimate(
  input: EffortEstimatorInput,
): EffortEstimate {
  if (input.workstreams.length === 0) {
    throw new Error('Effort estimate needs at least one workstream.');
  }

  const rateCard = resolveRateCard(input.rateCard);

  const workstreams: WorkstreamEstimate[] = input.workstreams.map((ws) => {
    if (ws.agentSplit < 0 || ws.agentSplit > 1) {
      throw new Error(
        `Workstream '${ws.id}' agentSplit must be within 0..1.`,
      );
    }
    const conservative = ws.conservativeMultiplier ?? DEFAULT_CONSERVATIVE;
    const upside = ws.upsideMultiplier ?? DEFAULT_UPSIDE;
    if (conservative < 1) {
      throw new Error(
        `Workstream '${ws.id}' conservativeMultiplier must be >= 1.`,
      );
    }
    if (upside > 1) {
      throw new Error(`Workstream '${ws.id}' upsideMultiplier must be <= 1.`);
    }

    // Reuse the should-cost engine purely for its role-mix labour base. The
    // hidden-layer / vendor layers are deliberately neutralised here — this
    // module estimates *delivery effort*, not vendor TCO.
    const estimate = buildShouldCostEstimate({
      estimateLabel: `${input.moveName}:${ws.id}`,
      vendorQuotedCost: 0,
      vendorMarginRatio: 0,
      roleMix: ws.roleMix,
      rateCard: rateCard.rates,
      durationMonths: ws.durationMonths,
      offshoreRatio: input.offshoreRatio,
      transitionCost: 0,
      consumption: { monthlyCloudCost: 0, monthlyModelCost: 0 },
      hiddenLayerDrivers: {
        integration: 0,
        dataMigration: 0,
        changeManagement: 0,
        operationsPerYear: 0,
        exit: 0,
      },
    });

    const baseCost = estimate.roleMix.implementationLabourBase;
    const cost = rangeOf(
      round2(baseCost * upside),
      round2(baseCost * conservative),
    );
    // Override the auto-derived midpoint with the true base estimate.
    cost.point = baseCost;

    return {
      id: ws.id,
      label: WORKSTREAM_LABELS[ws.id],
      cost,
      baseCost,
      humanCost: round2(baseCost * (1 - ws.agentSplit)),
      agentCost: round2(baseCost * ws.agentSplit),
      agentSplit: ws.agentSplit,
      totalHeadcount: estimate.roleMix.totalHeadcount,
      durationMonths: ws.durationMonths,
    };
  });

  const totalCost = sumRanges(workstreams.map((w) => w.cost));
  const totalBase = round2(workstreams.reduce((s, w) => s + w.baseCost, 0));
  const totalHumanCost = round2(
    workstreams.reduce((s, w) => s + w.humanCost, 0),
  );
  const totalAgentCost = round2(
    workstreams.reduce((s, w) => s + w.agentCost, 0),
  );
  // Re-anchor the total point on the summed base, not the midpoint of the sum.
  totalCost.point = totalBase;

  // AI-build vs. business-change split.
  const businessChangeCost = round2(
    workstreams
      .filter((w) => BUSINESS_CHANGE_WORKSTREAMS.has(w.id))
      .reduce((s, w) => s + w.baseCost, 0),
  );
  const aiBuildCost = round2(totalBase - businessChangeCost);
  const businessChangeFraction =
    totalBase > 0 ? round2(businessChangeCost / totalBase) : 0;
  const buildVsChange: BuildVsChangeSplit = {
    aiBuildCost,
    businessChangeCost,
    businessChangeFraction,
    aiOpsCost: 0,
    note: buildSplitNote(businessChangeFraction),
  };
  const aiOpsCost = input.aiOps ? estimateAiOperatingCost(input.aiOps) : null;
  if (aiOpsCost) {
    buildVsChange.aiOpsCost = aiOpsCost.threeYearTotal;
  }
  const probabilistic = buildEffortCostDistribution(
    totalCost,
    input.probabilistic,
  );

  return {
    moveName: input.moveName,
    workstreams,
    totalCost,
    totalHumanCost,
    totalAgentCost,
    effectiveAgentSplit:
      totalBase > 0 ? round2(totalAgentCost / totalBase) : 0,
    buildVsChange,
    aiOpsCost,
    probabilistic,
    rateCard,
  };
}

/** Plain-language credibility read on the build-vs-change split. */
function buildSplitNote(changeFraction: number): string {
  const pct = Math.round(changeFraction * 100);
  if (changeFraction < 0.2) {
    return (
      `Business change is only ${pct}% of effort — this is the classic ` +
      'under-budgeting trap. AI value lands through changed work, not code; ' +
      'pressure-test whether process redesign, adoption and governance are ' +
      'realistically estimated.'
    );
  }
  if (changeFraction > 0.55) {
    return (
      `Business change is ${pct}% of effort — change-heavy. This is honest ` +
      'for a deep operating-model shift, but confirm the AI build is not ' +
      'being under-scoped to flatter the ratio.'
    );
  }
  return (
    `Business change is ${pct}% of effort — a credible build-vs-change ` +
    'balance for an AI Move where value depends on people changing how ' +
    'they work.'
  );
}
