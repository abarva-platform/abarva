// Expert Kernel — phase playbook: Design & Plan.
//
// Design & Plan is the DEPTH phase. Discover sized the problem and Charter
// committed a value hypothesis; here the Move is turned into a solution
// architecture, a phased + costed roadmap, a human+agent RACI, and a full
// costed business case. This playbook is the canonical expert mind for that
// phase: the diagnostic question tree, the evidence that must be on the table,
// the traps a real delivery expert watches for, and the named kill triggers.
//
// Pure module: deterministic, no I/O. It encodes expert priors as data — the
// agent reads this playbook, it does not free-form the phase.

/** A node in the Design & Plan diagnostic question tree. */
export interface PlaybookQuestion {
  /** Stable key. */
  key: string;
  /** The question an expert would ask. */
  question: string;
  /** Why it matters — what a wrong answer does to the case. */
  rationale: string;
  /** Which kernel module the answer feeds. */
  feeds:
    | 'roadmap'
    | 'effort-estimator'
    | 'value-forecast'
    | 'raci'
    | 'business-case-compiler';
}

/** Evidence the phase must have before its deliverables are credible. */
export interface RequiredEvidence {
  key: string;
  label: string;
  /** What the evidence is used to decide. */
  usedFor: string;
  /** True when its absence should block, not merely caveat, the case. */
  blocking: boolean;
}

/** A phase trap — a way Design & Plan routinely goes wrong. */
export interface PhaseTrap {
  key: string;
  /** The trap, named. */
  trap: string;
  /** How the kernel guards against it. */
  guard: string;
}

/** A named kill trigger — a condition under which Moves says "do not fund". */
export interface KillTrigger {
  code: string;
  /** The condition that fires the kill. */
  condition: string;
  /** The fix-condition — "revisit when X is true" (spec §5.2). */
  fixCondition: string;
}

export interface DesignPlanPlaybook {
  phase: 'design_plan';
  questionTree: PlaybookQuestion[];
  requiredEvidence: RequiredEvidence[];
  traps: PhaseTrap[];
  killTriggers: KillTrigger[];
}

// ---------------------------------------------------------------------------
// The playbook
// ---------------------------------------------------------------------------

const QUESTION_TREE: PlaybookQuestion[] = [
  {
    key: 'q_architecture_options',
    question:
      'What are the 2-3 viable solution architectures, and what is the ' +
      'reversible-vs-irreversible decision in choosing between them?',
    rationale:
      'A roadmap costed against one unexamined architecture hides its ' +
      'biggest risk. The build cost and integration surface are downstream ' +
      'of this choice.',
    feeds: 'roadmap',
  },
  {
    key: 'q_foundational_capabilities',
    question:
      'Which capabilities are foundational — required before the AI build ' +
      'delivers value (data unification, identity, eventing, model gateway) ' +
      '— and are they already in place or net-new?',
    rationale:
      'Foundational work is the most common roadmap omission. If it is ' +
      'net-new it is a phase-0 dependency, not an optional later workstream.',
    feeds: 'roadmap',
  },
  {
    key: 'q_phase_value_milestones',
    question:
      'What is the first phase that produces measurable value, and what ' +
      'value milestone does each phase commit to?',
    rationale:
      'A roadmap with value only at the end is unfundable. Each phase needs ' +
      'a milestone Tower can later verify.',
    feeds: 'roadmap',
  },
  {
    key: 'q_process_redesign_depth',
    question:
      'How much of the target process must be redesigned for the AI to ' +
      'land, and who owns that redesign?',
    rationale:
      'Moves does not design the operating model, but value is captured ' +
      'through changed work. Under-scoping this is the dominant failure mode.',
    feeds: 'effort-estimator',
  },
  {
    key: 'q_change_adoption_load',
    question:
      'How many roles change, how deep is the behaviour change, and what ' +
      'is the training / hypercare / incentive-change load?',
    rationale:
      'Change & adoption is a real workstream with a real cost. A thin ' +
      'line item produces an optimistic payback.',
    feeds: 'effort-estimator',
  },
  {
    key: 'q_role_mix',
    question:
      'What is the role mix and on/offshore split per workstream, and does ' +
      'it reconcile with the Source should-cost engine?',
    rationale:
      'Effort with no role mix is a guess. The same role-mix math must ' +
      'drive Moves and Source so the numbers reconcile.',
    feeds: 'effort-estimator',
  },
  {
    key: 'q_decision_rights',
    question:
      'For each major decision in the build, who is Responsible, ' +
      'Accountable, Consulted, Informed — and which steps can an AI agent ' +
      'own vs. only assist?',
    rationale:
      'A human+agent RACI with no Accountable human per decision is not a ' +
      'governable plan. Agent autonomy must be explicit, not assumed.',
    feeds: 'raci',
  },
  {
    key: 'q_sensitivity_drivers',
    question:
      'Which three assumptions move ~80% of the outcome, and what is the ' +
      'conservative case if all three break together?',
    rationale:
      'A single ROI is not a business case. The CFO funds the downside, ' +
      'not the point estimate.',
    feeds: 'business-case-compiler',
  },
];

const REQUIRED_EVIDENCE: RequiredEvidence[] = [
  {
    key: 'ev_baseline_locked',
    label: 'Baseline metrics locked (or seed gaps explicitly owned)',
    usedFor: 'Anchoring the value forecast and the Tower handoff.',
    blocking: false,
  },
  {
    key: 'ev_value_hypothesis',
    label: 'Quantified value hypothesis carried from Charter',
    usedFor: 'The gross-value range the haircut model discounts.',
    blocking: true,
  },
  {
    key: 'ev_architecture_choice',
    label: 'A chosen solution architecture with the alternatives recorded',
    usedFor: 'Costing the AI-build and integration workstreams.',
    blocking: true,
  },
  {
    key: 'ev_foundational_audit',
    label: 'Foundational-capability audit (in place vs. net-new)',
    usedFor: 'Sequencing phase 0 and identifying hard dependencies.',
    blocking: true,
  },
  {
    key: 'ev_process_scope',
    label: 'Process-redesign scope and a named redesign owner',
    usedFor: 'Sizing the business-change half of the effort.',
    blocking: false,
  },
  {
    key: 'ev_rate_card',
    label: 'A rate card — client-specific if available, planning default if not',
    usedFor: 'Converting role mix to cost. Provenance must be labelled.',
    blocking: false,
  },
  {
    key: 'ev_sponsor_decision_rights',
    label: 'Sponsor and decision-rights confirmed for each gate',
    usedFor: 'The RACI and the governability of the roadmap.',
    blocking: false,
  },
];

const TRAPS: PhaseTrap[] = [
  {
    key: 'trap_build_only_roadmap',
    trap:
      'Roadmap costs the AI build and quietly omits process redesign, ' +
      'change & adoption, and data governance.',
    guard:
      'The roadmap requires all eight workstream types and the kernel ' +
      'surfaces the AI-build-vs-business-change split explicitly.',
  },
  {
    key: 'trap_foundational_as_later',
    trap:
      'Foundational data / platform work is scheduled "later" when it is ' +
      'actually a precondition for any value.',
    guard:
      'Foundational capabilities are flagged and forced to be dependencies ' +
      'of the first value-producing phase.',
  },
  {
    key: 'trap_value_at_the_end',
    trap:
      'All value lands in the final phase, so the early phases are pure ' +
      'cost with no checkpoint to kill on.',
    guard:
      'Every phase carries a value milestone; a phase with cost and no ' +
      'milestone is flagged by the roadmap validator.',
  },
  {
    key: 'trap_optimistic_agent_autonomy',
    trap:
      'The RACI hands an AI agent accountability for decisions a human ' +
      'must own (funding, scope, go-live).',
    guard:
      'The RACI module forbids agent-Accountable on governance decisions ' +
      'and every decision must have exactly one accountable human.',
  },
  {
    key: 'trap_single_point_roi',
    trap:
      'The business case is presented as one ROI number with the ' +
      'sensitivity buried.',
    guard:
      'The compiler emits base / conservative / upside, what-breaks-the-' +
      'case, and the three 80%-mover assumptions as first-class output.',
  },
];

const KILL_TRIGGERS: KillTrigger[] = [
  {
    code: 'kill_dp_no_value_phase',
    condition:
      'No phase in the roadmap produces measurable value before the total ' +
      'spend exceeds the conservative-case net return.',
    fixCondition:
      'Re-sequence the roadmap so a value milestone lands before the ' +
      'cumulative spend crosses the conservative net return.',
  },
  {
    code: 'kill_dp_foundational_unfunded',
    condition:
      'A net-new foundational capability the AI build depends on is not ' +
      'funded in the roadmap.',
    fixCondition:
      'Fund the foundational capability as phase 0, or descope the AI ' +
      'build to what the current foundation supports.',
  },
  {
    code: 'kill_dp_change_underbudgeted',
    condition:
      'Business-change effort (process redesign + change & adoption + data ' +
      'governance) is under 15% of total effort for a Move whose value ' +
      'depends on changed work.',
    fixCondition:
      'Re-estimate the change workstreams with the impacted-role and ' +
      'hypercare load, or accept a deeper value haircut for adoption risk.',
  },
  {
    code: 'kill_dp_conservative_negative',
    condition:
      'The conservative-case net return is negative and no assumption in ' +
      'the top-3 movers can credibly lift it above zero.',
    fixCondition:
      'Re-shape scope to protect the downside, or revisit when the ' +
      'highest-impact assumption has been validated with tenant data.',
  },
];

/** The Design & Plan playbook — the canonical expert mind for the depth phase. */
export const DESIGN_PLAN_PLAYBOOK: DesignPlanPlaybook = {
  phase: 'design_plan',
  questionTree: QUESTION_TREE,
  requiredEvidence: REQUIRED_EVIDENCE,
  traps: TRAPS,
  killTriggers: KILL_TRIGGERS,
};

/** Look up a kill trigger by code. */
export function killTrigger(code: string): KillTrigger | null {
  return DESIGN_PLAN_PLAYBOOK.killTriggers.find((k) => k.code === code) ?? null;
}
