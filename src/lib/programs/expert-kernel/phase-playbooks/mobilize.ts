// Expert Kernel — Mobilize & Handoff phase playbook.
//
// Each Moves phase carries a canonical EXPERT PLAYBOOK: the diagnostic
// question tree, the evidence the phase cannot close without, the traps an
// expert watches for, and the kill triggers that stop the Move outright.
//
// Mobilize & Handoff is the FINAL phase. Discover captured the baseline;
// Charter quantified the hypothesis; Design & Plan costed it. Mobilize asks a
// narrower, sharper question: is this Move actually *ready to leave Moves* —
// owned, adoptable, measurable — or is the costed plan a paper plan?
//
// The playbook is data, not prose. The Mobilize agent walks the tree; it does
// not free-form the readiness verdict.
//
// Pure module: deterministic, no I/O. This file is OWNED by the Mobilize agent
// per the kernel collision rules — it never touches discover.ts / design-plan.ts.

import type { Confidence } from '../types';

/** The four Moves phases. Mobilize is the last. */
export type MovesPhase = 'discover' | 'charter' | 'design_plan' | 'mobilize';

/** Where a piece of phase evidence is expected to come from. */
export type EvidenceSourceKind =
  | 'tenant_substrate' // a seeded KPI / record / telemetry item
  | 'move_deliverable' // produced by an earlier Moves phase
  | 'named_owner' // asserted by an accountable human
  | 'governance' // an AI-governance / risk artifact
  | 'tower_contract'; // the Tower outcome-ledger handoff

/** One node in the phase's diagnostic question tree. */
export interface PlaybookQuestion {
  /** Stable key, e.g. 'operating_model_owner'. */
  key: string;
  /** The diagnostic question an expert asks at this node. */
  question: string;
  /** Why the question matters — what a wrong answer costs the Move. */
  rationale: string;
  /** Keys of required evidence that answer this question. */
  answeredBy: string[];
}

/** A piece of evidence the phase cannot be closed without. */
export interface RequiredEvidence {
  key: string;
  label: string;
  sourceKind: EvidenceSourceKind;
  /** What the phase does when the evidence is absent. */
  ifAbsent: string;
}

/** A trap — a plausible-looking answer that is quietly wrong. */
export interface PhaseTrap {
  key: string;
  /** The mistake. */
  trap: string;
  /** How an expert avoids it. */
  guard: string;
}

/**
 * A kill trigger — a condition that, if true at the gate, stops the Move.
 * Distinct from a business-case kill criterion: a trigger is about Move
 * READINESS, not economics. A Move can have a positive business case and
 * still fire a Mobilize kill trigger (e.g. no named operating-model owner).
 */
export interface KillTrigger {
  code: string;
  /** The condition that fires the trigger. */
  condition: string;
  /** The fix-condition — "revisit when X is true". Trust comes from saying no. */
  fixCondition: string;
}

/** A complete phase playbook. */
export interface PhasePlaybook {
  phase: MovesPhase;
  /** One-line statement of what the phase is for. */
  intent: string;
  questions: PlaybookQuestion[];
  requiredEvidence: RequiredEvidence[];
  traps: PhaseTrap[];
  killTriggers: KillTrigger[];
}

/**
 * The Mobilize & Handoff playbook.
 *
 * The defining kill trigger — `no_operating_model_owner` — encodes the spec's
 * scope boundary: Moves does NOT design the operating model, but it must not
 * hand off a Move that has no named human accountable for running it. A Move
 * with no operating-model owner is not ready, regardless of its ROI.
 */
export const MOBILIZE_PLAYBOOK: PhasePlaybook = {
  phase: 'mobilize',
  intent:
    'Confirm the costed Move is genuinely ready to leave Moves — owned, ' +
    'adoptable, and measurable — and assemble the go-decision pack.',

  questions: [
    {
      key: 'operating_model_owner',
      question:
        'Who is the named, accountable owner of the operating model once ' +
        'the Move goes live — and have they accepted it?',
      rationale:
        'Moves does not design the operating model, but a Move with no ' +
        'named owner has nobody accountable for running it. It will stall ' +
        'the moment delivery hands over.',
      answeredBy: ['operating_model_owner_record'],
    },
    {
      key: 'adoption_readiness',
      question:
        'Which roles change how they work, how large is the behaviour ' +
        'change, and is the change effort budgeted and resourced?',
      rationale:
        'The value forecast is adoption-adjusted. If the change approach is ' +
        'thin, the adoption curve in the business case is fiction.',
      answeredBy: ['change_approach', 'change_effort_line'],
    },
    {
      key: 'manager_adoption',
      question:
        'Are the frontline managers — not just the sponsor — bought in and ' +
        'equipped to reinforce the new way of working?',
      rationale:
        'Adoption fails at the manager layer far more often than at the ' +
        'sponsor or the frontline. Managers own the daily reinforcement.',
      answeredBy: ['change_approach'],
    },
    {
      key: 'measurement_wired',
      question:
        'Is every committed value metric wired to a Discover baseline value ' +
        'and handed to the Tower outcome ledger with a measurement cadence?',
      rationale:
        'Forecast value is only meaningful if realized value can be ' +
        'compared against it. An unwired metric cannot close the loop.',
      answeredBy: ['measurement_spec', 'tower_handoff_accepted'],
    },
    {
      key: 'baseline_gaps_closed',
      question:
        'Have the Discover seed gaps that block monetisation been closed, ' +
        'or is there a dated owned plan to close them before the gate?',
      rationale:
        'A measurement metric pointed at an absent baseline measures ' +
        'nothing. Tower would receive a target with no anchor.',
      answeredBy: ['measurement_spec'],
    },
    {
      key: 'hypercare_plan',
      question:
        'Is there a hypercare window — a defined period of elevated support ' +
        'after go-live — with an owner and an exit condition?',
      rationale:
        'The weeks after go-live are when adoption is won or lost. A Move ' +
        'with no hypercare drops its users at the most fragile moment.',
      answeredBy: ['change_approach'],
    },
    {
      key: 'go_decision_assembled',
      question:
        'Are all phase outputs assembled into a single decision pack a CXO ' +
        'can act on — in-app and exportable?',
      rationale:
        'A decision scattered across phases is not a decision. The pack is ' +
        'the artifact the gate is run against.',
      answeredBy: ['go_decision_pack'],
    },
  ],

  requiredEvidence: [
    {
      key: 'operating_model_owner_record',
      label: 'Named operating-model owner who has accepted accountability',
      sourceKind: 'named_owner',
      ifAbsent:
        'Fire the no_operating_model_owner kill trigger — the Move is not ' +
        'ready to hand off.',
    },
    {
      key: 'change_approach',
      label: 'Adoption & change approach (impacted roles, training, hypercare)',
      sourceKind: 'move_deliverable',
      ifAbsent:
        'Treat the adoption curve as unsupported; downgrade the go-decision ' +
        'to conditional and flag a seed gap.',
    },
    {
      key: 'change_effort_line',
      label: 'Change & adoption effort budgeted in the Design & Plan estimate',
      sourceKind: 'move_deliverable',
      ifAbsent:
        'Flag that adoption is unfunded — the value forecast over-claims.',
    },
    {
      key: 'measurement_spec',
      label: 'Value-measurement model wired to the Discover baseline',
      sourceKind: 'move_deliverable',
      ifAbsent:
        'The loop cannot close — Tower has nothing to compare realized ' +
        'value against. Block the go-decision.',
    },
    {
      key: 'tower_handoff_accepted',
      label: 'Tower outcome-ledger handoff drafted for every committed metric',
      sourceKind: 'tower_contract',
      ifAbsent:
        'Measurement is defined but not handed off — it will not be tracked.',
    },
    {
      key: 'go_decision_pack',
      label: 'Assembled go-decision pack, in-app and exportable',
      sourceKind: 'move_deliverable',
      ifAbsent: 'The phase is not complete — there is no decision artifact.',
    },
  ],

  traps: [
    {
      key: 'sponsor_mistaken_for_owner',
      trap:
        'Treating the executive sponsor as the operating-model owner. The ' +
        'sponsor funds and unblocks; they do not run the daily operation.',
      guard:
        'Require a named operating owner distinct from the sponsor, at the ' +
        'level that owns the changed process day to day.',
    },
    {
      key: 'training_mistaken_for_adoption',
      trap:
        'Assuming a training plan equals an adoption plan. Trained users ' +
        'who are not measured, incentivised, or reinforced revert.',
      guard:
        'The change approach must cover incentives, manager reinforcement, ' +
        'and hypercare — not just a training catalogue.',
    },
    {
      key: 'vanity_metric_handoff',
      trap:
        'Handing Tower a metric with no baseline ("improve CSAT") so the ' +
        'realized-vs-forecast comparison can never actually be computed.',
      guard:
        'Every handed-off metric must cite a recorded Discover baseline ' +
        'value, or carry an explicit dated plan to capture one.',
    },
    {
      key: 'measurement_designed_not_owned',
      trap:
        'Specifying a measurement cadence with no named owner — it lapses ' +
        'the first busy quarter.',
      guard:
        'Every measurement in the spec names a measurement owner role that ' +
        'Tower can hold accountable.',
    },
    {
      key: 'pack_without_critic',
      trap:
        'Assembling a go-decision pack that hides the business-case critic ' +
        'findings to make the recommendation look clean.',
      guard:
        'The go-decision pack always carries the critic findings and the ' +
        'open kill triggers verbatim.',
    },
  ],

  killTriggers: [
    {
      code: 'no_operating_model_owner',
      condition:
        'No named human has accepted accountability for the operating ' +
        'model after go-live (a sponsor does not count).',
      fixCondition:
        'Revisit when a named operating-model owner — distinct from the ' +
        'sponsor — is on record as having accepted the role.',
    },
    {
      code: 'adoption_unfunded',
      condition:
        'The change & adoption workstream has zero budgeted effort while ' +
        'the value forecast assumes a non-trivial adoption curve.',
      fixCondition:
        'Revisit when the Design & Plan estimate carries a credible change ' +
        '& adoption effort line consistent with the adoption assumption.',
    },
    {
      code: 'measurement_unwired',
      condition:
        'One or more committed value metrics cannot be wired to a baseline ' +
        '(recorded or with a dated capture plan) — the loop cannot close.',
      fixCondition:
        'Revisit when every committed metric is wired to a Discover ' +
        'baseline value or an owned, dated plan to capture one.',
    },
    {
      code: 'business_case_blocker_open',
      condition:
        'The Design & Plan business case still carries an unresolved ' +
        'critic blocker at the Mobilize gate.',
      fixCondition:
        'Revisit when the business-case critic reports no open blocker.',
    },
  ],
};

/** Look up a playbook question by key. */
export function mobilizeQuestion(key: string): PlaybookQuestion | null {
  return MOBILIZE_PLAYBOOK.questions.find((q) => q.key === key) ?? null;
}

/** Look up a Mobilize kill trigger by code. */
export function mobilizeKillTrigger(code: string): KillTrigger | null {
  return MOBILIZE_PLAYBOOK.killTriggers.find((t) => t.code === code) ?? null;
}

/** A confidence rung used by readiness scoring downstream. */
export type ReadinessConfidence = Confidence;
