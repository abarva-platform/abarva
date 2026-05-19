// Expert Kernel — Discover phase playbook + deliverables.
//
// The Discover phase is the diagnostic walk a top consultant makes BEFORE a
// use case is sized: what is the problem, what is the current state, how big
// is the opportunity, and — honestly — should this go forward at all.
//
// This file provides:
//   1. A `discoverPlaybook(archetype)` — the canonical expert question tree
//      (the diagnostic path), the required evidence per question, the phase
//      traps, and the kill triggers. Archetype-keyed so the contact-centre
//      walk is one branch of a generalised playbook.
//   2. `buildDiscoverDeliverables()` — wires the Discover deliverables through
//      the kernel: problem statement, current-state baseline (via the shipped
//      `baseline-model`), opportunity sizing, and a kill-capable go/no-go.
//
// Honesty rules:
//   - Missing evidence is a seed gap, never a fabricated answer.
//   - The go/no-go must be genuinely able to return 'no-go' — a kill trigger
//     that fires, or a baseline too thin to size against, stops the Move.
//
// Pure module: deterministic, no I/O. Same input → same output.
//
// Collision boundary: this file owns ONLY the Discover phase. Charter,
// Design & Plan, and Mobilize playbooks live in their own files.

import {
  buildBaselineModel,
  type BaselineModel,
  type BaselineMetricInput,
} from '../baseline-model';
import { round2 } from '../types';
import type { Confidence } from '../types';

// ---------------------------------------------------------------------------
// Archetype key — a local, additive alias of the taxonomy's archetype keys.
// Kept local so this file stays self-contained (collision rule: no shared-type
// edits). The contact-centre AI Routing Move classifies as
// `human_in_loop_agent` per the Apex audit.
// ---------------------------------------------------------------------------

export type PlaybookArchetype =
  | 'human_in_loop_agent'
  | 'assistant'
  | 'automation'
  | 'retrieval_copilot'
  | 'full_agentic_workflow'
  | 'data_remediation'
  | 'vendor_led_implementation'
  | 'process_redesign'
  | 'generic';

// ---------------------------------------------------------------------------
// The expert question tree
// ---------------------------------------------------------------------------

/** A category of diagnostic question in the Discover walk. */
export type DiscoverTopic =
  | 'demand' // how much work arrives
  | 'cost' // what the work costs today
  | 'quality' // how well the work is done
  | 'tooling' // what systems run the work
  | 'history' // what has been tried before
  | 'constraints' // workforce, union, compliance limits
  | 'sponsorship'; // who owns the outcome

/**
 * A single node in the Discover expert question tree. Each question names the
 * evidence a top consultant would demand before treating an answer as fact.
 */
export interface DiscoverQuestion {
  /** Stable id, e.g. 'cc_call_volume'. */
  id: string;
  topic: DiscoverTopic;
  /** The question, as a consultant would ask it. */
  question: string;
  /**
   * The baseline metric key this question feeds, when it maps onto a
   * quantitative baseline metric. Null for qualitative questions.
   */
  baselineMetricKey: string | null;
  /** What evidence makes the answer decision-grade (not an opinion). */
  requiredEvidence: string;
  /** True when, without this answer, the use case cannot be honestly sized. */
  blocksSizing: boolean;
}

/** A Discover-phase trap — a way the diagnosis goes wrong. */
export interface DiscoverTrap {
  code: string;
  /** What the trap is. */
  description: string;
  /** How a top consultant avoids it. */
  mitigation: string;
}

/**
 * A kill trigger — a condition a top consultant would see in Discover and
 * stop on. If it fires, the go/no-go returns 'no-go' (or 'reshape').
 */
export interface DiscoverKillTrigger {
  code: string;
  /** What the consultant would see. */
  condition: string;
  /** Whether firing this kills the Move outright or sends it back to reshape. */
  effect: 'no-go' | 'reshape';
}

export interface DiscoverPlaybook {
  archetype: PlaybookArchetype;
  /** The diagnostic path — ordered question tree. */
  questionTree: DiscoverQuestion[];
  traps: DiscoverTrap[];
  killTriggers: DiscoverKillTrigger[];
}

// --- Generic spine — every archetype inherits these ------------------------

const GENERIC_QUESTIONS: DiscoverQuestion[] = [
  {
    id: 'gen_problem_named',
    topic: 'demand',
    question:
      'What is the specific, observable problem — stated as a measured gap, ' +
      'not a desire for technology?',
    baselineMetricKey: null,
    requiredEvidence:
      'A named metric below target, with the target and the trend, from a ' +
      'system of record.',
    blocksSizing: true,
  },
  {
    id: 'gen_cost_today',
    topic: 'cost',
    question: 'What does the current state cost — in labour, spend, or value lost?',
    baselineMetricKey: 'cost_per_unit_usd',
    requiredEvidence:
      'A unit-economics figure (cost per contact / claim / order) from ' +
      'finance or an instrumented system — not a benchmark.',
    blocksSizing: true,
  },
  {
    id: 'gen_tooling',
    topic: 'tooling',
    question: 'What systems run the work today, and what is their condition?',
    baselineMetricKey: null,
    requiredEvidence:
      'IT landscape entry with run cost, renewal date, and a vendor risk note.',
    blocksSizing: false,
  },
  {
    id: 'gen_history',
    topic: 'history',
    question: 'What has been tried before, and why did it under-deliver?',
    baselineMetricKey: null,
    requiredEvidence:
      'A prior initiative or pilot with a recorded outcome — or an explicit ' +
      '"nothing tried" note.',
    blocksSizing: false,
  },
  {
    id: 'gen_constraints',
    topic: 'constraints',
    question:
      'What workforce, union, regulatory, or compliance constraints bound ' +
      'the solution space?',
    baselineMetricKey: null,
    requiredEvidence:
      'A policy, contract clause, or risk-register entry — named, not assumed.',
    blocksSizing: false,
  },
  {
    id: 'gen_sponsor',
    topic: 'sponsorship',
    question: 'Who owns the outcome, and will they still own it in 12 months?',
    baselineMetricKey: null,
    requiredEvidence:
      'A named executive sponsor with budget authority over the impacted P&L.',
    blocksSizing: false,
  },
];

const GENERIC_TRAPS: DiscoverTrap[] = [
  {
    code: 'trap_solution_first',
    description:
      'Discover starts from "we want an AI agent" instead of from a measured ' +
      'problem. The use case is then shaped to justify the tool.',
    mitigation:
      'Refuse to size until the problem is a named metric below target.',
  },
  {
    code: 'trap_benchmark_as_baseline',
    description:
      'An industry benchmark is treated as the tenant baseline because the ' +
      'real number was not seeded.',
    mitigation:
      'Record the absent metric as a seed gap; never let a benchmark stand ' +
      'in silently.',
  },
  {
    code: 'trap_average_hides_variance',
    description:
      'A single average (e.g. handle time) hides the distribution that the ' +
      'opportunity actually lives in.',
    mitigation:
      'Demand the spread or segment cut before sizing against the mean.',
  },
];

const GENERIC_KILLS: DiscoverKillTrigger[] = [
  {
    code: 'kill_no_measured_problem',
    condition:
      'No measured problem exists — every "baseline" is a benchmark or an ' +
      'opinion. There is nothing to size.',
    effect: 'no-go',
  },
  {
    code: 'kill_no_sponsor',
    condition:
      'No executive owns the outcome P&L. A Move with no accountable sponsor ' +
      'will not survive its first budget review.',
    effect: 'reshape',
  },
  {
    code: 'kill_baseline_too_thin',
    condition:
      'Baseline coverage is below 50% AND a sizing-blocking metric is absent ' +
      '— the opportunity cannot be honestly quantified.',
    effect: 'reshape',
  },
];

// --- Contact-centre archetype branch ---------------------------------------
// The canonical Discover walk for contact-centre AI: call volume, handle time,
// containment, transfer rate, QA error rate, labour cost, channel mix, current
// tooling, bot-deflection history, workforce/union, compliance exposure.

const CONTACT_CENTRE_QUESTIONS: DiscoverQuestion[] = [
  {
    id: 'cc_call_volume',
    topic: 'demand',
    question: 'What is the annual agent-handled contact volume, by channel?',
    baselineMetricKey: 'contact_volume_annual',
    requiredEvidence:
      'A volume figure from the ACD / CXone platform, not a benchmark for ' +
      'a retailer of this size.',
    blocksSizing: true,
  },
  {
    id: 'cc_handle_time',
    topic: 'cost',
    question: 'What is average handle time, and is it trending up or down?',
    baselineMetricKey: 'aht_minutes',
    requiredEvidence:
      'AHT from the ACD platform with a trend; note whether deflection of ' +
      'easy calls is inflating it.',
    blocksSizing: false,
  },
  {
    id: 'cc_containment',
    topic: 'demand',
    question: 'What share of contacts are contained in self-service today?',
    baselineMetricKey: 'containment_pct',
    requiredEvidence:
      'Containment from the ACD platform; reconcile against any competing ' +
      'IT dashboard figure before trusting it.',
    blocksSizing: false,
  },
  {
    id: 'cc_transfer_rate',
    topic: 'quality',
    question: 'What is the transfer / repeat-transfer rate?',
    baselineMetricKey: 'repeat_transfer_pct',
    requiredEvidence:
      'Routing-export data; distinguish first-pass transfer from repeat ' +
      'transfer.',
    blocksSizing: false,
  },
  {
    id: 'cc_qa_error_rate',
    topic: 'quality',
    question: 'What is the contact-centre QA error / defect rate?',
    baselineMetricKey: 'qa_error_rate_pct',
    requiredEvidence:
      'A quality-assurance scorecard metric from the QA programme.',
    blocksSizing: false,
  },
  {
    id: 'cc_labour_cost',
    topic: 'cost',
    question: 'What is the fully-loaded cost per contact?',
    baselineMetricKey: 'cost_per_contact_usd',
    requiredEvidence:
      'Labour cost per contact from finance — the single highest-leverage ' +
      'input for the value case.',
    blocksSizing: true,
  },
  {
    id: 'cc_channel_mix',
    topic: 'demand',
    question: 'What is the channel mix — voice / chat / IVR / messaging?',
    baselineMetricKey: 'channel_mix',
    requiredEvidence:
      'A structured channel split from the platform; "IVR + chatbot" prose ' +
      'is not a split.',
    blocksSizing: false,
  },
  {
    id: 'cc_tooling',
    topic: 'tooling',
    question: 'What is the incumbent ACD / routing platform and its condition?',
    baselineMetricKey: null,
    requiredEvidence:
      'Vendor scorecard with run cost, renewal date, and a replacement-risk ' +
      'note.',
    blocksSizing: false,
  },
  {
    id: 'cc_deflection_history',
    topic: 'history',
    question:
      'What is the bot-deflection history — have prior IVR / chatbot ' +
      'deflection efforts delivered or stalled?',
    baselineMetricKey: null,
    requiredEvidence:
      'A prior deflection initiative with a recorded outcome, or an explicit ' +
      'absence note.',
    blocksSizing: false,
  },
  {
    id: 'cc_workforce_constraints',
    topic: 'constraints',
    question:
      'What workforce or union constraints bound headcount change — and ' +
      'does the WFM lead prefer agent-assist over deflection?',
    baselineMetricKey: null,
    requiredEvidence:
      'WFM lead position on record; any union agreement clause on automation ' +
      'or headcount.',
    blocksSizing: false,
  },
  {
    id: 'cc_compliance_exposure',
    topic: 'constraints',
    question:
      'What compliance exposure does customer-facing inference and ' +
      'transcript use create?',
    baselineMetricKey: null,
    requiredEvidence:
      'A privacy / AI-governance review milestone with a date and an owner.',
    blocksSizing: false,
  },
  {
    id: 'cc_sponsor',
    topic: 'sponsorship',
    question:
      'Who owns the contact-centre outcome — care, IT, and data sponsors?',
    baselineMetricKey: null,
    requiredEvidence:
      'Named VP Customer Care + CIO + CDO with budget authority.',
    blocksSizing: false,
  },
];

const CONTACT_CENTRE_TRAPS: DiscoverTrap[] = [
  {
    code: 'trap_containment_double_count',
    description:
      'AHT is rising AND containment is being lifted — but the value case ' +
      'counts both as savings without noticing containment removes the easy ' +
      'calls, pushing AHT up.',
    mitigation:
      'Model containment uplift and AHT together; do not sum them as ' +
      'independent savings.',
  },
  {
    code: 'trap_utilization_ceiling',
    description:
      'Labour-takeout value is sized as if freed hours convert to savings, ' +
      'while agent utilization is already above target — there is no slack ' +
      'to harvest.',
    mitigation:
      'Cap labour-takeout value at the gap between current utilization and ' +
      'a sustainable ceiling.',
  },
  {
    code: 'trap_csat_survey_bias',
    description:
      'CSAT is read as a clean baseline when the survey response rate is low ' +
      'and biased toward extreme experiences.',
    mitigation: 'Carry the response-bias caveat into every CSAT-derived claim.',
  },
  ...GENERIC_TRAPS,
];

const CONTACT_CENTRE_KILLS: DiscoverKillTrigger[] = [
  {
    code: 'kill_cc_no_unit_cost',
    condition:
      'Cost per contact is not recorded — the opportunity cannot be ' +
      'expressed in dollars, only in operational hours.',
    effect: 'reshape',
  },
  {
    code: 'kill_cc_no_volume',
    condition:
      'Annual contact volume is not recorded — AHT and containment deltas ' +
      'cannot be converted into FTE-hours or dollars.',
    effect: 'reshape',
  },
  {
    code: 'kill_cc_compliance_blocks',
    condition:
      'A privacy / AI-governance review is expected to remove customer-facing ' +
      'inference or transcript use — the solution loses its core mechanism.',
    effect: 'no-go',
  },
  {
    code: 'kill_cc_no_capacity',
    condition:
      'Agent utilization is at or above a sustainable ceiling with no ' +
      'attrition headroom — labour-takeout value has nowhere to land.',
    effect: 'reshape',
  },
  ...GENERIC_KILLS,
];

/**
 * Return the Discover playbook for an archetype. The contact-centre walk is
 * carried by `human_in_loop_agent` and `assistant` (the contact-centre AI
 * Routing Move classifies as `human_in_loop_agent`). Every other archetype
 * falls back to the generic diagnostic spine.
 */
export function discoverPlaybook(
  archetype: PlaybookArchetype,
): DiscoverPlaybook {
  if (archetype === 'human_in_loop_agent' || archetype === 'assistant') {
    return {
      archetype,
      questionTree: CONTACT_CENTRE_QUESTIONS,
      traps: CONTACT_CENTRE_TRAPS,
      killTriggers: CONTACT_CENTRE_KILLS,
    };
  }
  return {
    archetype,
    questionTree: GENERIC_QUESTIONS,
    traps: GENERIC_TRAPS,
    killTriggers: GENERIC_KILLS,
  };
}

// ---------------------------------------------------------------------------
// Discover deliverables
// ---------------------------------------------------------------------------

/** 1 — Problem statement: the use case as a measured gap. */
export interface ProblemStatement {
  moveName: string;
  /** The problem as an observable gap. */
  statement: string;
  /** The primary metric the problem is anchored on. */
  anchorMetricKey: string | null;
  /** True when the anchor metric is a recorded baseline fact, not an opinion. */
  anchorIsMeasured: boolean;
}

/** 3 — Opportunity sizing: how big, and how honestly it can be expressed. */
export interface OpportunitySizing {
  /** Plain statement of the opportunity. */
  statement: string;
  /**
   * The unit the opportunity can honestly be expressed in. 'dollars' only
   * when unit economics are recorded; otherwise 'operational_hours' or
   * 'directional' (a qualitative-only opportunity).
   */
  expressibleAs: 'dollars' | 'operational_hours' | 'directional';
  /** Metric keys whose absence caps how the opportunity can be expressed. */
  cappedBySeedGaps: string[];
  confidence: Confidence;
}

/** A go/no-go evaluation that is genuinely able to say "no". */
export type GoNoGoDecision = 'go' | 'reshape' | 'no-go';

export interface GoNoGo {
  decision: GoNoGoDecision;
  rationale: string;
  /** Kill triggers that fired during Discover. */
  firedKillTriggers: DiscoverKillTrigger[];
  /** What must become true for a 'reshape' Move to advance. */
  fixConditions: string[];
}

export interface DiscoverDeliverables {
  moveName: string;
  tenantKey: string;
  archetype: PlaybookArchetype;
  playbook: DiscoverPlaybook;
  /** 1 — problem statement. */
  problemStatement: ProblemStatement;
  /** 2 — current-state baseline (via the shipped baseline-model). */
  baseline: BaselineModel;
  /** 3 — opportunity sizing. */
  opportunity: OpportunitySizing;
  /** 4 — kill-capable go/no-go. */
  goNoGo: GoNoGo;
  /** Which question-tree nodes are still unanswered (seed gaps). */
  unansweredSizingQuestions: DiscoverQuestion[];
}

export interface DiscoverDeliverablesInput {
  moveName: string;
  tenantKey: string;
  archetype: PlaybookArchetype;
  /** The problem stated as a measured gap. */
  problemStatement: string;
  /** Metric key the problem is anchored on (must be a baseline metric key). */
  anchorMetricKey: string | null;
  /** Current-state baseline metrics (fed straight to `buildBaselineModel`). */
  baselineMetrics: BaselineMetricInput[];
  /** Plain statement of the opportunity. */
  opportunityStatement: string;
  /**
   * Kill-trigger codes the caller has independently confirmed as fired (e.g.
   * a compliance review that is known to block). The playbook's data-driven
   * triggers fire automatically; this is for evidence-based triggers the
   * caller observed.
   */
  observedKillTriggerCodes?: string[];
}

/**
 * Build the four Discover deliverables and run the kill-capable go/no-go.
 * Deterministic — no I/O.
 *
 * The go/no-go is genuinely able to return 'no-go': a fired `no-go` kill
 * trigger, or a baseline with no measured anchor, stops the Move.
 */
export function buildDiscoverDeliverables(
  input: DiscoverDeliverablesInput,
): DiscoverDeliverables {
  const playbook = discoverPlaybook(input.archetype);
  const baseline = buildBaselineModel({
    moveName: input.moveName,
    tenantKey: input.tenantKey,
    metrics: input.baselineMetrics,
  });

  // --- 1. Problem statement ------------------------------------------------
  const anchorMetric =
    input.anchorMetricKey === null
      ? null
      : baseline.metrics.find((m) => m.key === input.anchorMetricKey) ?? null;
  const anchorIsMeasured = anchorMetric !== null && anchorMetric.recorded;
  const problemStatement: ProblemStatement = {
    moveName: input.moveName,
    statement: input.problemStatement,
    anchorMetricKey: input.anchorMetricKey,
    anchorIsMeasured,
  };

  // --- Which sizing-blocking questions are unanswered ----------------------
  // A sizing question is "unanswered" when its baseline metric is a seed gap
  // (or simply not present in the baseline at all).
  const recordedKeys = new Set(baseline.recordedMetrics.map((m) => m.key));
  const unansweredSizingQuestions = playbook.questionTree.filter(
    (q) =>
      q.blocksSizing &&
      q.baselineMetricKey !== null &&
      !recordedKeys.has(q.baselineMetricKey),
  );

  // --- 3. Opportunity sizing ----------------------------------------------
  // The opportunity can only be expressed as honestly as the data allows.
  const costGapKeys = ['cost_per_contact_usd', 'cost_per_unit_usd'];
  const volumeGapKeys = ['contact_volume_annual'];
  const cappedBySeedGaps = unansweredSizingQuestions
    .map((q) => q.baselineMetricKey as string)
    .filter((k, i, arr) => arr.indexOf(k) === i);
  const missingCost = cappedBySeedGaps.some((k) => costGapKeys.includes(k));
  const missingVolume = cappedBySeedGaps.some((k) => volumeGapKeys.includes(k));

  let expressibleAs: OpportunitySizing['expressibleAs'];
  if (!missingCost && !missingVolume) {
    expressibleAs = 'dollars';
  } else if (missingCost && !missingVolume) {
    // Volume is known but unit cost is not — value lands in operational hours.
    expressibleAs = 'operational_hours';
  } else {
    // Volume itself is missing — only a directional opportunity is honest.
    expressibleAs = 'directional';
  }
  const opportunityConfidence: Confidence =
    expressibleAs === 'dollars'
      ? baseline.weakestConfidence ?? 'medium'
      : expressibleAs === 'operational_hours'
        ? 'low'
        : 'low';
  const opportunity: OpportunitySizing = {
    statement: input.opportunityStatement,
    expressibleAs,
    cappedBySeedGaps,
    confidence: opportunityConfidence,
  };

  // --- 4. Kill-capable go/no-go -------------------------------------------
  const observed = new Set(input.observedKillTriggerCodes ?? []);
  const firedKillTriggers: DiscoverKillTrigger[] = [];

  for (const trigger of playbook.killTriggers) {
    if (observed.has(trigger.code)) {
      firedKillTriggers.push(trigger);
      continue;
    }
    // Data-driven triggers the kernel can evaluate itself, deterministically.
    if (
      trigger.code === 'kill_no_measured_problem' &&
      !anchorIsMeasured &&
      baseline.recordedMetrics.length === 0
    ) {
      firedKillTriggers.push(trigger);
    } else if (
      trigger.code === 'kill_baseline_too_thin' &&
      baseline.coverage < 0.5 &&
      unansweredSizingQuestions.length > 0
    ) {
      firedKillTriggers.push(trigger);
    } else if (
      (trigger.code === 'kill_cc_no_unit_cost' ||
        trigger.code === 'kill_cc_no_volume') &&
      cappedBySeedGaps.length > 0
    ) {
      const targets =
        trigger.code === 'kill_cc_no_unit_cost' ? costGapKeys : volumeGapKeys;
      if (cappedBySeedGaps.some((k) => targets.includes(k))) {
        firedKillTriggers.push(trigger);
      }
    }
  }

  const goNoGo = decideGoNoGo({
    anchorIsMeasured,
    baseline,
    firedKillTriggers,
    unansweredSizingQuestions,
  });

  return {
    moveName: input.moveName,
    tenantKey: input.tenantKey,
    archetype: input.archetype,
    playbook,
    problemStatement,
    baseline,
    opportunity,
    goNoGo,
    unansweredSizingQuestions,
  };
}

interface GoNoGoContext {
  anchorIsMeasured: boolean;
  baseline: BaselineModel;
  firedKillTriggers: DiscoverKillTrigger[];
  unansweredSizingQuestions: DiscoverQuestion[];
}

/**
 * The honest go/no-go. Returns 'no-go' when the Move cannot honestly proceed,
 * 'reshape' when it can proceed only after a fix condition is met, and 'go'
 * when Discover is clean enough to advance to Charter.
 */
function decideGoNoGo(ctx: GoNoGoContext): GoNoGo {
  const { anchorIsMeasured, baseline, firedKillTriggers } = ctx;
  const hardKills = firedKillTriggers.filter((t) => t.effect === 'no-go');
  const reshapeKills = firedKillTriggers.filter((t) => t.effect === 'reshape');

  const fixConditions = reshapeKills.map((t) => t.condition);

  // A problem with no measured anchor cannot be sized — that is a no-go even
  // if no kill trigger names it explicitly.
  if (!anchorIsMeasured && baseline.recordedMetrics.length === 0) {
    return {
      decision: 'no-go',
      rationale:
        'The problem statement has no measured anchor and the baseline has ' +
        'no recorded metrics — there is nothing to size. Discover cannot ' +
        'advance this Move.',
      firedKillTriggers,
      fixConditions,
    };
  }

  if (hardKills.length > 0) {
    return {
      decision: 'no-go',
      rationale:
        `${hardKills.length} kill trigger(s) fired with a no-go effect: ` +
        `${hardKills.map((t) => t.code).join(', ')}. The Move cannot proceed ` +
        'as scoped.',
      firedKillTriggers,
      fixConditions,
    };
  }

  if (reshapeKills.length > 0) {
    return {
      decision: 'reshape',
      rationale:
        `${reshapeKills.length} kill trigger(s) fired with a reshape effect — ` +
        'the Move may advance only once the fix conditions are met. The ' +
        'opportunity can be stated, but not yet sized to the standard a ' +
        'CFO gate requires.',
      firedKillTriggers,
      fixConditions,
    };
  }

  if (!anchorIsMeasured) {
    return {
      decision: 'reshape',
      rationale:
        'The baseline carries recorded metrics, but the problem statement is ' +
        'not anchored on one of them — re-anchor the problem on a measured ' +
        'metric before advancing to Charter.',
      firedKillTriggers,
      fixConditions: [
        ...fixConditions,
        'Re-anchor the problem statement on a recorded baseline metric.',
      ],
    };
  }

  return {
    decision: 'go',
    rationale:
      `Discover is clean: the problem is anchored on a measured metric, ` +
      `baseline coverage is ${round2(baseline.coverage * 100)}%, and no kill ` +
      'trigger fired. Advance to Charter, carrying the open seed gaps as ' +
      'tracked assumptions.',
    firedKillTriggers,
    fixConditions,
  };
}
