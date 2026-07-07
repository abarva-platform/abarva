// Workforce Economics — estimate-twice compute engine (first slice).
//
// This module is the IN-PRODUCT economics engine that produces an
// "estimate-twice" view of a Move's delivery scope: a TRADITIONAL
// (people-only) estimate and an AI-NATIVE (people + agents on subscription)
// estimate, plus the honest DELTA between them.
//
// It is the code port of the `Estimation Engine` + `Business Case` sheets of
// the AbarVa Workforce Taxonomy workbook
// (`docs/workforce-economics/Workforce_Taxonomy_Master.xlsx`, built by
// `scripts/workforce-economics/build-workforce-taxonomy.py`). The WE-2
// CAPACITY model from `docs/codex-handoff/WORKFORCE_ECONOMICS_MOVES_BINDING_BRIEF.md`
// is the contract this file implements EXACTLY:
//
//   W            = total effort hours (sum of WBS estimate categories)
//   blendedRate  = blended geo/shore rate ($/hr)
//   // Traditional
//   tradMonths   = W / (tradHumans * hoursPerFteMonth)
//   tradCost     = W * blendedRate
//   // AI-Native (agents = added parallel capacity; humans billed for actual
//   //            time; agents on subscription — NO double-count)
//   agentCap     = agents * agentEquivFte * agentUtil       // FTE-equiv
//   aiCapacity   = aiHumans + agentCap
//   aiMonths     = W / (aiCapacity * hoursPerFteMonth)
//   aiHumanHours = aiHumans * aiMonths * hoursPerFteMonth
//   aiCost       = aiHumanHours * blendedRate
//                  + agentAnnualCost * (aiMonths / 12)
//   productivity = W / aiHumanHours
//
// HONESTY DISCIPLINE (mirrors `move-estimate-model.ts`): every output is a
// labelled PLANNING estimate, NOT a quote. AI productivity / automation factors
// are applied as PLANNING RANGES with explicit haircuts; the engine never
// fabricates precision. This is a CAPACITY model (FTE / effort / cost /
// duration) — it does not compress effort hours AND cut the team (that
// double-counts and was a bug caught + fixed in the workbook).
//
// Pure module: deterministic, no I/O, no model calls, no DB. Same input → same
// `WorkforceEstimateTwice`. Unit-testable in isolation.

// ===========================================================================
// INPUT MODEL — a Move / WorkPackage scope expressed in WBS + drivers.
// ===========================================================================

/**
 * The ten estimate categories the Move WBS decomposes into — the same ten the
 * brief and the workbook Estimation Engine use. A scope is a map of category →
 * effort hours; a category with no hours simply contributes zero.
 */
export type EstimateCategory =
  | 'business_analysis'
  | 'architecture'
  | 'engineering'
  | 'testing'
  | 'security'
  | 'training'
  | 'change_management'
  | 'deployment'
  | 'governance'
  | 'program_management';

/** A single WBS line — an estimate category and its planned effort hours. */
export interface WbsLine {
  category: EstimateCategory;
  /** Planned effort hours for this category. Must be finite and >= 0. */
  effortHours: number;
  /**
   * How amenable this category's work is to AI agents. Carried as honest
   * metadata for the assumptions block; the capacity model applies agent
   * capacity at the program level (per the workbook), so this does NOT
   * silently re-weight individual lines — it documents where the gain comes
   * from.
   */
  agentAmenability?: 'high' | 'medium' | 'low';
}

/**
 * The geo / shore mix the blended rate is built from. Fractions must be in
 * [0,1] and SHOULD sum to 1 (the engine normalizes and records a note if they
 * do not, rather than silently mis-pricing).
 */
export interface GeoShoreMix {
  /** Onshore fraction of the team (priced at the onshore rate). */
  onshoreFraction: number;
  /** Offshore fraction of the team (priced at the offshore rate). */
  offshoreFraction: number;
  /** Onshore loaded bill rate, $/hr. Traceable to the rate card. */
  onshoreRatePerHour: number;
  /** Offshore loaded bill rate, $/hr. Traceable to the rate card. */
  offshoreRatePerHour: number;
}

/** The AI agent platform economics — provider-neutral (anonymized). */
export interface AgentPlatform {
  /** Anonymized platform label, e.g. "AbarVa Agents" — never a real firm. */
  label: string;
  /** Equivalent engineer-FTE capacity per agent (1.0 = one human-equiv). */
  equivFtePerAgent: number;
  /** Sustained utilization of that capacity, [0,1]. */
  utilization: number;
  /** Annual subscription cost per the program's agent fleet, $. */
  annualCost: number;
}

/** The two team shapes the estimate-twice compares. */
export interface TeamShape {
  /** Human FTE on the TRADITIONAL (people-only) delivery. */
  traditionalHumans: number;
  /** Human FTE on the AI-NATIVE delivery. */
  aiNativeHumans: number;
  /** AI agent count on the AI-NATIVE delivery. */
  aiNativeAgents: number;
}

/** The full estimate-twice input — a Move/WorkPackage scope + drivers. */
export interface WorkforceEstimateInput {
  /** Human-readable scope label, e.g. the Move or WorkPackage name. */
  scopeLabel: string;
  /** The WBS — effort hours by estimate category. */
  wbs: WbsLine[];
  /** Geo/shore mix the blended rate is computed from. */
  geoMix: GeoShoreMix;
  /** The selected agent platform (AI-native side). */
  agentPlatform: AgentPlatform;
  /** Traditional vs AI-native team shapes. */
  team: TeamShape;
  /** Billable hours per FTE per month (workbook default 173). */
  hoursPerFteMonth: number;
  /** Reference delivery pod label, for traceability. Optional. */
  deliveryPodLabel?: string;
}

// ===========================================================================
// OUTPUT MODEL — Traditional, AI-Native, the Delta, and the honesty block.
// ===========================================================================

/** One costed delivery scenario (Traditional OR AI-Native). */
export interface WorkforceScenario {
  /** 'traditional' | 'ai_native'. */
  kind: 'traditional' | 'ai_native';
  /** Human FTE on this scenario. */
  humans: number;
  /** AI agents on this scenario (0 for Traditional). */
  agents: number;
  /** Effective delivery capacity in FTE-equivalents. */
  effectiveCapacityFte: number;
  /** Calendar duration in months at this capacity. */
  durationMonths: number;
  /** Human effort actually billed, in hours. */
  humanHoursBilled: number;
  /** Human labour cost, $ (humanHoursBilled * blendedRate). */
  humanCost: number;
  /** Agent subscription cost over the duration, $ (0 for Traditional). */
  agentCost: number;
  /** Total cost, $ (humanCost + agentCost). */
  totalCost: number;
}

/** The estimate-twice delta — savings, speed, and capacity gain. */
export interface WorkforceDelta {
  /** Absolute cost saving, $ (traditional - ai_native). Positive = cheaper. */
  costSaving: number;
  /** Cost reduction as a fraction of the traditional cost, [0,1]. */
  costReductionPct: number;
  /** Months saved (traditional - ai_native). Positive = faster. */
  monthsSaved: number;
  /** Timeline reduction as a fraction of traditional, [0,1]. */
  timelineReductionPct: number;
  /** Human FTE reduction (traditional - ai_native). */
  headcountReduction: number;
  /**
   * Productivity gain multiple — total effort / AI-native human hours. > 1
   * means each remaining human delivers more, because agents carry capacity.
   */
  productivityGain: number;
}

/** Honest confidence + assumptions block — never a bare assertion. */
export interface WorkforceAssumptions {
  /** Planning-grade confidence — this is an estimate, never a quote. */
  confidence: 'medium' | 'low';
  /**
   * The agent-capacity figure is a PLANNING RANGE, not a point promise. We
   * surface the modelled point alongside an honest conservative haircut so the
   * reader sees the downside, not just the headline.
   */
  agentCapacityRange: { conservative: number; modelled: number };
  /** The named drivers behind every figure — traceable, not magic. */
  drivers: string[];
  /** Explicit caveats — what would have to be true, and what is NOT proven. */
  caveats: string[];
  /** Any input-normalization notes (e.g. a geo mix that did not sum to 1). */
  notes: string[];
}

/** The full estimate-twice result. */
export interface WorkforceEstimateTwice {
  scopeLabel: string;
  deliveryPodLabel: string | null;
  /** Total effort hours W (sum of the WBS). */
  totalEffortHours: number;
  /** The blended geo/shore rate the cost runs on, $/hr. */
  blendedRatePerHour: number;
  /** The Traditional (people-only) scenario. */
  traditional: WorkforceScenario;
  /** The AI-Native (people + agents) scenario. */
  aiNative: WorkforceScenario;
  /** The delta between the two. */
  delta: WorkforceDelta;
  /** The honesty / confidence / assumptions block. */
  assumptions: WorkforceAssumptions;
}

// ===========================================================================
// Compute — the pure, deterministic estimate-twice function.
// ===========================================================================

/**
 * Conservative agent-utilization haircut applied to surface a planning RANGE
 * (not a point promise) for agent capacity. The modelled capacity uses the
 * platform's stated utilization; the conservative bound discounts it by this
 * factor, so the assumptions block can show the downside honestly.
 */
const AGENT_UTILIZATION_HAIRCUT = 0.75;

/**
 * Compute the estimate-twice (Traditional vs AI-Native) economics for a Move /
 * WorkPackage scope. Pure + deterministic.
 *
 * Implements the WE-2 capacity model EXACTLY (see the file header). AI-native
 * is cheaper because agents carry capacity on a subscription instead of being
 * billed at the human rate, and humans are billed only for the time they
 * actually work — never by compressing effort hours while also cutting the
 * team.
 *
 * @throws RangeError on structurally invalid input (negative hours, zero
 *   capacity, non-finite drivers) — fail loud rather than emit a fabricated
 *   number.
 */
export function computeWorkforceEstimate(
  input: WorkforceEstimateInput,
): WorkforceEstimateTwice {
  validateInput(input);

  const { geoMix, agentPlatform, team, hoursPerFteMonth } = input;

  // W — total effort hours (sum of the WBS).
  const W = input.wbs.reduce((sum, line) => sum + line.effortHours, 0);

  // Blended rate — normalize the mix so it sums to 1 (record a note if it did
  // not, rather than silently mis-pricing).
  const mixSum = geoMix.onshoreFraction + geoMix.offshoreFraction;
  const notes: string[] = [];
  let onFrac = geoMix.onshoreFraction;
  let offFrac = geoMix.offshoreFraction;
  if (mixSum > 0 && Math.abs(mixSum - 1) > 1e-9) {
    onFrac = geoMix.onshoreFraction / mixSum;
    offFrac = geoMix.offshoreFraction / mixSum;
    notes.push(
      `Geo/shore mix summed to ${round2(mixSum)}, not 1.0 — normalized to ` +
        `${round2(onFrac)} onshore / ${round2(offFrac)} offshore for pricing.`,
    );
  }
  const blendedRate =
    onFrac * geoMix.onshoreRatePerHour + offFrac * geoMix.offshoreRatePerHour;

  // --- TRADITIONAL (people-only) -----------------------------------------
  const tradCapacity = team.traditionalHumans;
  const tradMonths = W / (tradCapacity * hoursPerFteMonth);
  const tradHumanHours = W; // people-only: every hour is a human hour
  const tradCost = tradHumanHours * blendedRate;

  const traditional: WorkforceScenario = {
    kind: 'traditional',
    humans: team.traditionalHumans,
    agents: 0,
    effectiveCapacityFte: round2(tradCapacity),
    durationMonths: round1(tradMonths),
    humanHoursBilled: Math.round(tradHumanHours),
    humanCost: Math.round(tradCost),
    agentCost: 0,
    totalCost: Math.round(tradCost),
  };

  // --- AI-NATIVE (people + agents on subscription) -----------------------
  // Agents add PARALLEL capacity (FTE-equiv). They are billed by subscription,
  // not at the human rate. Humans are billed for the time they actually work.
  const agentCapacity =
    team.aiNativeAgents *
    agentPlatform.equivFtePerAgent *
    agentPlatform.utilization;
  const aiCapacity = team.aiNativeHumans + agentCapacity;
  const aiMonths = W / (aiCapacity * hoursPerFteMonth);
  const aiHumanHours = team.aiNativeHumans * aiMonths * hoursPerFteMonth;
  const agentCost = agentPlatform.annualCost * (aiMonths / 12);
  const aiHumanCost = aiHumanHours * blendedRate;
  const aiCost = aiHumanCost + agentCost;

  const aiNative: WorkforceScenario = {
    kind: 'ai_native',
    humans: team.aiNativeHumans,
    agents: team.aiNativeAgents,
    effectiveCapacityFte: round2(aiCapacity),
    durationMonths: round1(aiMonths),
    humanHoursBilled: Math.round(aiHumanHours),
    humanCost: Math.round(aiHumanCost),
    agentCost: Math.round(agentCost),
    totalCost: Math.round(aiCost),
  };

  // --- DELTA --------------------------------------------------------------
  const productivityGain = aiHumanHours > 0 ? W / aiHumanHours : 0;
  const delta: WorkforceDelta = {
    costSaving: Math.round(tradCost - aiCost),
    costReductionPct: tradCost > 0 ? round4((tradCost - aiCost) / tradCost) : 0,
    monthsSaved: round1(tradMonths - aiMonths),
    timelineReductionPct:
      tradMonths > 0 ? round4((tradMonths - aiMonths) / tradMonths) : 0,
    headcountReduction: team.traditionalHumans - team.aiNativeHumans,
    productivityGain: round2(productivityGain),
  };

  // --- ASSUMPTIONS / HONESTY ---------------------------------------------
  const conservativeAgentCapacity =
    team.aiNativeAgents *
    agentPlatform.equivFtePerAgent *
    agentPlatform.utilization *
    AGENT_UTILIZATION_HAIRCUT;

  const assumptions: WorkforceAssumptions = {
    confidence: 'medium',
    agentCapacityRange: {
      conservative: round2(conservativeAgentCapacity),
      modelled: round2(agentCapacity),
    },
    drivers: [
      `Total effort W = ${Math.round(W).toLocaleString()} hrs across ` +
        `${input.wbs.length} WBS categories.`,
      `Blended rate $${round2(blendedRate)}/hr = ` +
        `${round2(onFrac)}×$${round2(geoMix.onshoreRatePerHour)} onshore + ` +
        `${round2(offFrac)}×$${round2(geoMix.offshoreRatePerHour)} offshore.`,
      `Agent platform "${agentPlatform.label}": ` +
        `${agentPlatform.equivFtePerAgent} equiv-FTE/agent × ` +
        `${round2(agentPlatform.utilization)} utilization × ` +
        `${team.aiNativeAgents} agents = ${round2(agentCapacity)} FTE-equiv ` +
        `of parallel capacity on a $${agentPlatform.annualCost.toLocaleString()}/yr subscription.`,
      `Hours/FTE/month = ${hoursPerFteMonth} (planning basis).`,
    ],
    caveats: [
      'PLANNING ESTIMATE — not a quote. Rates trace to the workforce rate-card ' +
        'substrate (benchmark), not an executed client rate card.',
      'AI-native capacity is a modelled planning RANGE — the conservative bound ' +
        'applies a ' +
        `${Math.round((1 - AGENT_UTILIZATION_HAIRCUT) * 100)}% utilization ` +
        'haircut. Realized gain depends on the work actually being agent-amenable.',
      'Capacity model: AI-native is cheaper because agents are subscription-priced ' +
        'parallel capacity and humans are billed only for time worked — effort ' +
        'hours are NOT compressed while the team is cut (no double-count).',
      'Agent counts and team shapes are inputs (from the selected pod / scope), ' +
        'not derived — confirm them against the delivery plan before any commitment.',
    ],
    notes,
  };

  return {
    scopeLabel: input.scopeLabel,
    deliveryPodLabel: input.deliveryPodLabel ?? null,
    totalEffortHours: Math.round(W),
    blendedRatePerHour: round2(blendedRate),
    traditional,
    aiNative,
    delta,
    assumptions,
  };
}

// ---------------------------------------------------------------------------
// Validation + numeric helpers.
// ---------------------------------------------------------------------------

function validateInput(input: WorkforceEstimateInput): void {
  if (!input.wbs || input.wbs.length === 0) {
    throw new RangeError('WorkforceEstimateInput.wbs must be non-empty.');
  }
  for (const line of input.wbs) {
    if (!Number.isFinite(line.effortHours) || line.effortHours < 0) {
      throw new RangeError(
        `WBS line "${line.category}" effortHours must be finite and >= 0.`,
      );
    }
  }
  const { team, agentPlatform, hoursPerFteMonth } = input;
  if (!Number.isFinite(hoursPerFteMonth) || hoursPerFteMonth <= 0) {
    throw new RangeError('hoursPerFteMonth must be finite and > 0.');
  }
  if (!Number.isFinite(team.traditionalHumans) || team.traditionalHumans <= 0) {
    throw new RangeError('team.traditionalHumans must be finite and > 0.');
  }
  if (!Number.isFinite(team.aiNativeHumans) || team.aiNativeHumans < 0) {
    throw new RangeError('team.aiNativeHumans must be finite and >= 0.');
  }
  if (!Number.isFinite(team.aiNativeAgents) || team.aiNativeAgents < 0) {
    throw new RangeError('team.aiNativeAgents must be finite and >= 0.');
  }
  // AI-native capacity must be > 0 or duration is undefined.
  const aiCapacity =
    team.aiNativeHumans +
    team.aiNativeAgents *
      agentPlatform.equivFtePerAgent *
      agentPlatform.utilization;
  if (aiCapacity <= 0) {
    throw new RangeError(
      'AI-native effective capacity is 0 — need at least one human or agent.',
    );
  }
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
