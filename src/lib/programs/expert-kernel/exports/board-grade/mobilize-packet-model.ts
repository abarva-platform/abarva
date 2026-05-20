// Board-grade Mobilize & Go-Decision Packet — view-model.
//
// This module is the single seam between the Expert Kernel's Mobilize phase
// and the board-grade Mobilize & Go-Decision Packet renderer. It runs the
// EXISTING Apex Mobilize case (`buildApexMobilizeCase`, which composes the
// adoption approach, the measurement→Tower handoff, and the go-decision pack)
// plus the Design & Plan full case for the RACI, and projects their outputs
// into the eight blueprint §11 / Appendix A.7 sections. It introduces NO new
// numbers — every figure traces to a kernel field. The go-decision verdict is
// rendered EXACTLY as the kernel returns it: for Apex, `no_go` (two Mobilize
// kill triggers fired) — never upgraded.
//
// Blueprint §11 / A.7 sections (eight, plus a cover):
//   1. Go / no-go answer       — are we ready to mobilize?
//   2. 30/60/90 mobilization   — what happens first?
//   3. Owners & decision rights — who owns execution and exceptions?
//   4. Adoption & change       — what must change in the business?
//   5. Controls & readiness    — what must be true before launch?
//   6. Tower measurement handoff — what will be measured after launch?
//   7. Open action queue       — what blocks go-live?
//   8. Signoff                 — who has approved what?
//
// Blueprint §11 hard fails honoured here:
//   - the verdict NEVER says go while kill triggers remain (Apex = no_go);
//   - Tower metrics are tied to the Discover baseline (the handoff wires them);
//   - the adoption & change section is structured, not generic prose;
//   - every open-action gate item carries an owner.
//
// Pure module: deterministic, no I/O.

import {
  buildApexMobilizeCase,
  buildApexContactCenterFullCase,
} from '../../apex-contact-center-case';
import { CHANGE_DIMENSION_LABELS } from '../../adoption-approach';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface MobilizeEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface MobilizeSectionAnatomy {
  /** Section number, 1..8. */
  page: number;
  /** Anchor id for the deck slide. */
  id: string;
  /** Short menu / eyebrow label. */
  navLabel: string;
  /** Takeaway title — a sentence with a point of view (NOT a label). */
  takeaway: string;
  /** The decision this page supports. */
  decisionRole: string;
  /** Evidence strip — sources, dates, confidence, gaps. */
  evidence: MobilizeEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full Mobilize & Go-Decision Packet view-model.
// ---------------------------------------------------------------------------

/** The go-decision verdict, as the kernel returns it. */
export type GoVerdict = 'go' | 'conditional_go' | 'no_go';

export interface MobilizePacket {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The go-decision verdict. For Apex this is `no_go`. */
  verdict: GoVerdict;
  /** The eight sections, page-ordered. */
  sections: MobilizeSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface MobilizeSections {
  goDecision: GoDecisionSection;
  mobilizationPlan: MobilizationPlanSection;
  ownersDecisionRights: OwnersDecisionRightsSection;
  adoptionChange: AdoptionChangeSection;
  controlsReadiness: ControlsReadinessSection;
  towerHandoff: TowerHandoffSection;
  openActions: OpenActionsSection;
  signoff: SignoffSection;
}

// --- §1 Go / no-go answer ---------------------------------------------------

export interface GoDecisionSection {
  anatomy: MobilizeSectionAnatomy;
  verdictHeadline: string;
  verdictDetail: string;
  /** Mobilize readiness — the three Mobilize questions, answered. */
  readiness: { owned: boolean; adoptable: boolean; measurable: boolean };
  /** Headline tiles. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** Kill triggers that fired — verbatim, never hidden. */
  firedTriggers: Array<{ code: string; observation: string; fix: string }>;
  /** Conditions that must be met before the verdict can be upgraded. */
  conditions: Array<{ code: string; condition: string }>;
}

// --- §2 30/60/90 mobilization plan -----------------------------------------

export interface MobilizationPlanSection {
  anatomy: MobilizeSectionAnatomy;
  /** Three time bands, each with milestones. */
  bands: Array<{ label: string; milestones: string[] }>;
}

// --- §3 Owners & decision rights (RACI) ------------------------------------

export interface OwnersDecisionRightsSection {
  anatomy: MobilizeSectionAnatomy;
  /** Parties — human and agent. */
  parties: Array<{ name: string; kind: 'human' | 'agent' }>;
  /** RACI rows — one per decision. */
  decisions: Array<{
    decision: string;
    accountable: string;
    responsible: string;
    consulted: string[];
    informed: string[];
    agentAutonomy: string | null;
  }>;
}

// --- §4 Adoption & change ---------------------------------------------------

export interface AdoptionChangeSection {
  anatomy: MobilizeSectionAnatomy;
  operatingModelOwner: string;
  overallChangeLoad: string;
  adoptionConfidence: number;
  hypercareWeeks: number;
  /** Impacted roles. */
  impactedRoles: Array<{
    role: string;
    changeMagnitude: string;
    whatChanges: string;
    headcountIsProxy: boolean;
  }>;
  /** The seven-dimension change assessment. */
  dimensions: Array<{
    dimension: string;
    magnitude: string;
    recommendation: string;
    ownerRole: string;
    restsOnSeedGap: boolean;
  }>;
}

// --- §5 Controls & readiness ------------------------------------------------

export interface ControlsReadinessSection {
  anatomy: MobilizeSectionAnatomy;
  /** Readiness rows — ready / partial / blocked. */
  rows: Array<{
    label: string;
    state: 'ready' | 'partial' | 'blocked';
    note: string;
  }>;
}

// --- §6 Tower measurement handoff ------------------------------------------

export interface TowerHandoffSection {
  anatomy: MobilizeSectionAnatomy;
  wiredCount: number;
  unwiredCount: number;
  wiringCoverage: number;
  loopCloses: boolean;
  /** Measurement metrics — wired to a Discover baseline or flagged. */
  metrics: Array<{
    label: string;
    baseline: string;
    target: string;
    cadence: string;
    owner: string;
    wired: boolean;
    readinessNote: string;
  }>;
}

// --- §7 Open action queue ---------------------------------------------------

export interface OpenActionsSection {
  anatomy: MobilizeSectionAnatomy;
  /** Open actions — each with an owner and a gate impact. */
  actions: Array<{
    action: string;
    owner: string;
    due: string;
    gateImpact: string;
    blocksGoLive: boolean;
  }>;
}

// --- §8 Signoff -------------------------------------------------------------

export interface SignoffSection {
  anatomy: MobilizeSectionAnatomy;
  /** Signoff rows — one per reviewer role. */
  rows: Array<{
    role: string;
    reviewer: string;
    status: 'cleared' | 'conditional' | 'blocked';
    note: string;
  }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** Build the Apex Contact Center AI Routing Mobilize & Go-Decision Packet. */
export function buildApexMobilizePacket(generatedOn: string): MobilizePacket {
  const mob = buildApexMobilizeCase();
  const full = buildApexContactCenterFullCase();

  const goPack = mob.goPack;
  const adoption = mob.adoption;
  const measurement = mob.measurement;
  const raci = full.raci;
  const verdict = goPack.decision;

  const verdictWord =
    verdict === 'go'
      ? 'GO'
      : verdict === 'conditional_go'
        ? 'CONDITIONAL GO'
        : 'NO-GO';

  // --- §1 Go / no-go answer -------------------------------------------------
  const goDecision: GoDecisionSection = {
    anatomy: {
      page: 1,
      id: 'go-decision',
      navLabel: 'Go / no-go answer',
      takeaway:
        verdict === 'no_go'
          ? 'Do not mobilize — two Mobilize kill triggers fired; the Move ' +
            'is not ready to leave Moves.'
          : verdict === 'conditional_go'
            ? 'Mobilize only on conditions — the Move clears the gates but ' +
              'the business case still shapes.'
            : 'Mobilize — every readiness gate clears and the value loop ' +
              'closes.',
      decisionRole:
        'Decide whether to proceed to execution, reshape, or no-go.',
      evidence: {
        sources: [
          'Moves Expert Kernel — go-decision pack',
          'Mobilize playbook — kill triggers',
        ],
        asOf: generatedOn,
        confidence: verdict === 'no_go' ? 'blocked' : 'medium',
        gaps: goPack.firedKillTriggers.map((f) => f.trigger.code),
      },
      implication:
        verdict === 'no_go'
          ? 'The Move stays in Moves until the fired kill triggers are ' +
            'cleared — the conditions below are tracked, not waived.'
          : 'The conditions below are the gate to a clean go.',
      owner: 'Executive Sponsor (CIO)',
      nextGate: 'Launch gate — held until the fired triggers clear',
    },
    verdictHeadline:
      verdict === 'no_go'
        ? 'NO-GO — the Move cannot mobilize until the fired kill triggers ' +
          'are cleared'
        : verdict === 'conditional_go'
          ? 'CONDITIONAL GO — mobilize only once the conditions are met'
          : 'GO — the Move is ready to mobilize',
    verdictDetail: goPack.rationale,
    readiness: goPack.readiness,
    tiles: [
      {
        label: 'Go-decision',
        value: verdictWord,
        sub:
          verdict === 'no_go'
            ? 'Not ready to mobilize'
            : verdict === 'conditional_go'
              ? 'Proceed on conditions'
              : 'Proceed to execution',
        tone:
          verdict === 'go'
            ? 'good'
            : verdict === 'no_go'
              ? 'bad'
              : 'warn',
      },
      {
        label: 'Owned',
        value: goPack.readiness.owned ? 'Yes' : 'No',
        sub: 'Named operating-model owner',
        tone: goPack.readiness.owned ? 'good' : 'bad',
      },
      {
        label: 'Adoptable',
        value: goPack.readiness.adoptable ? 'Yes' : 'No',
        sub: 'Change approach supports the curve',
        tone: goPack.readiness.adoptable ? 'good' : 'bad',
      },
      {
        label: 'Measurable',
        value: goPack.readiness.measurable ? 'Yes' : 'No',
        sub: 'Value loop closes to Tower',
        tone: goPack.readiness.measurable ? 'good' : 'bad',
      },
      {
        label: 'Kill triggers fired',
        value: String(goPack.firedKillTriggers.length),
        sub: 'Mobilize playbook triggers',
        tone: goPack.firedKillTriggers.length > 0 ? 'bad' : 'good',
      },
    ],
    firedTriggers: goPack.firedKillTriggers.map((f) => ({
      code: f.trigger.code,
      observation: f.observation,
      fix: f.trigger.fixCondition,
    })),
    conditions: goPack.conditions.map((c) => ({
      code: c.code,
      condition: c.condition,
    })),
  };

  // --- §2 30/60/90 mobilization plan ---------------------------------------
  // The plan is read off the costed roadmap's first phases — the foundational
  // and pilot phases — staged into 30/60/90 mobilization bands. No new facts:
  // the milestones restate the roadmap phase value milestones and the kernel's
  // declared mobilization work.
  const p0 = full.roadmap.phases[0];
  const p1 = full.roadmap.phases[1];
  const mobilizationPlan: MobilizationPlanSection = {
    anatomy: {
      page: 2,
      id: 'mobilization-plan',
      navLabel: '30/60/90 plan',
      takeaway:
        'The first 90 days stand up the operating spine — owner, ' +
        'governance and the foundational data work — before any pilot value ' +
        'is claimed.',
      decisionRole:
        'Confirm the first-90-day mobilization sequence is specific.',
      evidence: {
        sources: ['Moves Expert Kernel — costed roadmap (phases 0 and 1)'],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'Mobilization starts on governance and foundations — value-bearing ' +
        'pilot work follows, it does not lead.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Day-30 mobilization checkpoint',
    },
    bands: [
      {
        label: 'Days 0–30 · Stand up',
        milestones: [
          'Confirm Mariana Rojas as operating-model owner; charter the ' +
            'execution PMO.',
          'Open the transcript-use privacy review with AI Governance as ' +
            'the gating control.',
          'Kick off the foundational data-and-platform phase: ' +
            `${p0?.label ?? 'Phase 0'} (${p0?.durationMonths ?? 5} mo).`,
        ],
      },
      {
        label: 'Days 31–60 · Wire the loop',
        milestones: [
          'Capture the cost-per-contact baseline (owner Brendan Fox, ' +
            'due 2026-05-15) to clear the measurement_unwired trigger.',
          'Stand up the Tower measurement handoff: wire containment, AHT ' +
            'and CSAT to the Discover baseline.',
          'Reconcile the NICE-vs-IT containment discrepancy before the ' +
            'baseline is locked.',
        ],
      },
      {
        label: 'Days 61–90 · Ready the pilot',
        milestones: [
          'Resolve the business-case critic blocker so the case clears ' +
            'the open-blocker trigger.',
          `Sequence the routing pilot: ${p1?.label ?? 'Phase 1'} ` +
            `(${p1?.durationMonths ?? 7} mo) on Customer Care queues.`,
          'Re-run the go-decision once both fired triggers are cleared — ' +
            'the launch gate stays held until then.',
        ],
      },
    ],
  };

  // --- §3 Owners & decision rights -----------------------------------------
  const partyById = new Map(raci.parties.map((p) => [p.id, p]));
  const ownersDecisionRights: OwnersDecisionRightsSection = {
    anatomy: {
      page: 3,
      id: 'owners-decision-rights',
      navLabel: 'Owners & decision rights',
      takeaway:
        'Every execution decision has a single accountable owner — and ' +
        'where an AI agent acts, its autonomy is bounded explicitly.',
      decisionRole:
        'Confirm accountability and the human-in-the-loop boundary.',
      evidence: {
        sources: ['Moves Expert Kernel — human + agent RACI matrix'],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: raci.violations.map((v) => v.message),
      },
      implication:
        'No decision is unowned; agent autonomy is recommend / ' +
        'act-with-approval — never unbounded.',
      owner: 'Executive Sponsor (CIO)',
      nextGate: 'RACI confirmed at the launch gate',
    },
    parties: raci.parties.map((p) => ({ name: p.name, kind: p.kind })),
    decisions: raci.decisions.map((d) => {
      const nameOf = (id: string): string =>
        partyById.get(id)?.name ?? id;
      const byRole = (role: string): string[] =>
        d.assignments
          .filter((a) => a.role === role)
          .map((a) => nameOf(a.partyId));
      return {
        decision: d.decision,
        accountable: byRole('accountable')[0] ?? 'NOT NAMED',
        responsible: byRole('responsible')[0] ?? '—',
        consulted: byRole('consulted'),
        informed: byRole('informed'),
        agentAutonomy: d.agentAutonomy ?? null,
      };
    }),
  };

  // --- §4 Adoption & change -------------------------------------------------
  const adoptionChange: AdoptionChangeSection = {
    anatomy: {
      page: 4,
      id: 'adoption-change',
      navLabel: 'Adoption & change',
      takeaway:
        'The change approach is structured across seven dimensions — not a ' +
        'paragraph — and the manager layer is named as the highest risk.',
      decisionRole:
        'Confirm the business change is real, owned, and decision-grade.',
      evidence: {
        sources: ['Moves Expert Kernel — adoption & change approach'],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: adoption.risks
          .filter((r) => r.severity !== 'blocker')
          .map((r) => r.message),
      },
      implication:
        'Adoption confidence is ' +
        `${Math.round(adoption.adoptionConfidence * 100)}% — the change ` +
        'approach supports the modelled adoption curve, but the manager ' +
        'layer must be resourced.',
      owner: adoption.operatingModelOwner ?? 'NOT NAMED',
      nextGate: 'Change approach validated before the pilot rollout',
    },
    operatingModelOwner: adoption.operatingModelOwner ?? 'NOT NAMED',
    overallChangeLoad: adoption.overallChangeLoad,
    adoptionConfidence: adoption.adoptionConfidence,
    hypercareWeeks: adoption.hypercareWeeks,
    impactedRoles: adoption.impactedRoles.map((r) => ({
      role: r.role,
      changeMagnitude: r.changeMagnitude,
      whatChanges: r.whatChanges,
      headcountIsProxy: r.headcountIsProxy ?? false,
    })),
    dimensions: adoption.dimensions.map((d) => ({
      dimension: CHANGE_DIMENSION_LABELS[d.dimension],
      magnitude: d.magnitude,
      recommendation: d.recommendation,
      ownerRole: d.ownerRole,
      restsOnSeedGap: d.restsOnSeedGap ?? false,
    })),
  };

  // --- §5 Controls & readiness ---------------------------------------------
  // The readiness rows are derived from the kernel's declared state — the
  // measurement loop, the operating-model owner, the privacy review, the
  // business-case blocker, the hypercare window, the data-readiness haircut.
  const controlsReadiness: ControlsReadinessSection = {
    anatomy: {
      page: 5,
      id: 'controls-readiness',
      navLabel: 'Controls & readiness',
      takeaway:
        'Two readiness gates are blocked — the measurement loop and the ' +
        'open business-case blocker — and those are exactly what hold the ' +
        'go-decision at no-go.',
      decisionRole:
        'See what must be true before launch, and what is not yet.',
      evidence: {
        sources: [
          'Moves Expert Kernel — go-decision readiness + measurement handoff',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: goPack.firedKillTriggers.map((f) => f.trigger.code),
      },
      implication:
        'The blocked gates are the no-go reasons — clearing them is the ' +
        'work that converts no-go into a conditional go.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Launch readiness review',
    },
    rows: [
      {
        label: 'Operating-model owner',
        state: goPack.readiness.owned ? 'ready' : 'blocked',
        note: goPack.readiness.owned
          ? `Named: ${adoption.operatingModelOwner}.`
          : 'No owner has accepted run accountability.',
      },
      {
        label: 'Adoption & change approach',
        state: goPack.readiness.adoptable ? 'ready' : 'blocked',
        note: goPack.readiness.adoptable
          ? `Structured across seven dimensions; confidence ${Math.round(
              adoption.adoptionConfidence * 100,
            )}%.`
          : 'A blocker-severity adoption risk is open.',
      },
      {
        label: 'Value-measurement loop to Tower',
        state: measurement.loopCloses ? 'ready' : 'blocked',
        note: measurement.loopCloses
          ? 'Every committed metric wired to a Discover baseline.'
          : `${measurement.unwiredMetrics.length} metric(s) unwired — the ` +
            'cost-per-contact baseline is a seed gap.',
      },
      {
        label: 'Business-case critic',
        state: full.fullCase.skeleton.critic.hasBlocker ? 'blocked' : 'ready',
        note: full.fullCase.skeleton.critic.hasBlocker
          ? `${full.fullCase.skeleton.critic.blockers.length} open blocker(s) ` +
            'on the Design & Plan business case.'
          : 'No open critic blocker.',
      },
      {
        label: 'Transcript-use privacy review',
        state: 'partial',
        note: 'The 2026-05-17 privacy-review milestone is in progress — ' +
          'customer-facing inference is conditional on it clearing.',
      },
      {
        label: 'Hypercare window',
        state: adoption.hypercareWeeks > 0 ? 'ready' : 'blocked',
        note:
          adoption.hypercareWeeks > 0
            ? `A ${adoption.hypercareWeeks}-week hypercare window is planned.`
            : 'No hypercare window is planned.',
      },
      {
        label: 'Data readiness',
        state: 'partial',
        note: 'CDP consolidation gap — intent / transcript data not yet ' +
          'unified; carried as a value-forecast haircut factor.',
      },
    ],
  };

  // --- §6 Tower measurement handoff ----------------------------------------
  const towerHandoff: TowerHandoffSection = {
    anatomy: {
      page: 6,
      id: 'tower-handoff',
      navLabel: 'Tower handoff',
      takeaway:
        'Three of four committed metrics are wired to the Discover ' +
        'baseline — the fourth, cost per contact, is an honest seed gap that ' +
        'holds the loop open.',
      decisionRole:
        'Confirm what Tower will measure, and that it ties to the baseline.',
      evidence: {
        sources: ['Moves Expert Kernel — value-measurement → Tower handoff'],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: measurement.unwiredMetrics.map((m) => m.label),
      },
      implication:
        'The value loop does not close until the cost-per-contact baseline ' +
        'is captured — Tower cannot verify financial value before then.',
      owner: 'Tower Owner (with CS Ops on the cost-per-contact gap)',
      nextGate: 'Loop closes when cost-per-contact is wired',
    },
    wiredCount: measurement.wiredMetrics.length,
    unwiredCount: measurement.unwiredMetrics.length,
    wiringCoverage: measurement.wiringCoverage,
    loopCloses: measurement.loopCloses,
    metrics: measurement.metrics.map((m) => ({
      label: m.label,
      baseline:
        m.baselineValue !== null
          ? `${m.baselineValue} ${m.baselineUnit}`
          : 'SEED GAP — not recorded',
      target:
        m.targetValue !== null
          ? `${m.targetValue} ${m.baselineUnit}`
          : 'Not yet committable',
      cadence: m.cadence,
      owner: m.measurementOwnerRole,
      wired: m.wired,
      readinessNote: m.readinessNote,
    })),
  };

  // --- §7 Open action queue -------------------------------------------------
  // The open actions are the fired kill triggers (gate-blocking) plus the
  // declared, dated tenant work that closes them. Every action has an owner.
  const gateActions: OpenActionsSection['actions'] =
    goPack.firedKillTriggers.map((f) => ({
      action: triggerAction(f.trigger.code),
      owner: triggerOwner(f.trigger.code),
      due: triggerDue(f.trigger.code),
      gateImpact:
        `Fires the ${f.trigger.code} kill trigger — the launch gate is ` +
        'held until this clears.',
      blocksGoLive: true,
    }));
  const supportingActions: OpenActionsSection['actions'] = [
    {
      action: 'Reconcile the NICE-vs-IT containment dashboard discrepancy.',
      owner: 'James Wright (CX Analytics)',
      due: '2026-05-08',
      gateImpact:
        'Containment is a Tower metric — its baseline cannot be locked ' +
        'until the discrepancy is reconciled.',
      blocksGoLive: false,
    },
    {
      action:
        'Clear the transcript-use privacy review without scope cuts that ' +
        'remove agent-assist features.',
      owner: 'Elena Fischer (AI Governance)',
      due: '2026-05-17',
      gateImpact:
        'Customer-facing inference is conditional on the review clearing.',
      blocksGoLive: false,
    },
  ];
  const openActions: OpenActionsSection = {
    anatomy: {
      page: 7,
      id: 'open-actions',
      navLabel: 'Open action queue',
      takeaway:
        'Every action that blocks go-live has a named owner and a due ' +
        'date — nothing that gates the launch is unowned.',
      decisionRole: 'Confirm every gate blocker has an owner and a date.',
      evidence: {
        sources: [
          'Moves Expert Kernel — fired kill triggers + tenant action items',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: [],
      },
      implication:
        'The two gate-blocking actions are the critical path to a ' +
        'conditional go.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Launch gate — held until the gate-blocking actions close',
    },
    actions: [...gateActions, ...supportingActions],
  };

  // --- §8 Signoff -----------------------------------------------------------
  const signoff: SignoffSection = {
    anatomy: {
      page: 8,
      id: 'signoff',
      navLabel: 'Signoff',
      takeaway:
        'Signoff records what each reviewer has cleared — it is not ' +
        'approval; two reviewers are blocked, which is why the verdict is ' +
        'no-go.',
      decisionRole:
        'See who has cleared what — and that signoff is not final approval.',
      evidence: {
        sources: ['Moves Expert Kernel — go-decision readiness'],
        asOf: generatedOn,
        confidence: verdict === 'no_go' ? 'blocked' : 'medium',
        gaps: [],
      },
      implication:
        'Signoff is a readiness record, not a green light — the launch gate ' +
        'is a separate, later decision.',
      owner: 'Executive Sponsor (CIO)',
      nextGate: 'Launch gate — after all reviewers clear',
    },
    rows: [
      {
        role: 'Executive sponsor',
        reviewer: 'CIO (Executive Sponsor)',
        status: verdict === 'no_go' ? 'conditional' : 'cleared',
        note: 'Sponsorship confirmed; awaiting the cleared go-decision.',
      },
      {
        role: 'Finance',
        reviewer: 'Transformation Finance',
        status: 'conditional',
        note:
          'The business case recommends shape — payback is blocked by the ' +
          'cost-per-contact seed gap.',
      },
      {
        role: 'Risk / governance',
        reviewer: 'Elena Fischer (AI Governance)',
        status: 'conditional',
        note:
          'Conditional on the transcript-use privacy review clearing ' +
          '(2026-05-17).',
      },
      {
        role: 'Delivery',
        reviewer: 'Priya Iyer (Program Lead)',
        status: full.fullCase.skeleton.critic.hasBlocker
          ? 'blocked'
          : 'cleared',
        note: full.fullCase.skeleton.critic.hasBlocker
          ? 'An open business-case critic blocker holds delivery signoff.'
          : 'Delivery plan and RACI are governable.',
      },
      {
        role: 'Tower',
        reviewer: 'Tower Owner',
        status: measurement.loopCloses ? 'cleared' : 'blocked',
        note: measurement.loopCloses
          ? 'Every committed metric is wired to a baseline.'
          : 'The value-measurement loop does not close — cost-per-contact ' +
            'is unwired.',
      },
    ],
  };

  const sections: MobilizeSections = {
    goDecision,
    mobilizationPlan,
    ownersDecisionRights,
    adoptionChange,
    controlsReadiness,
    towerHandoff,
    openActions,
    signoff,
  };

  const ordered: MobilizeSectionAnatomy[] = [
    goDecision.anatomy,
    mobilizationPlan.anatomy,
    ownersDecisionRights.anatomy,
    adoptionChange.anatomy,
    controlsReadiness.anatomy,
    towerHandoff.anatomy,
    openActions.anatomy,
    signoff.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: goPack.tenantKey,
    moveLabel: goPack.moveName,
    artifactLabel: 'Mobilize & Go-Decision Packet',
    generatedOn,
    verdict,
    sections,
    toc: ordered.map((a) => ({
      page: a.page,
      id: a.id,
      label: a.navLabel,
      takeaway: a.takeaway,
    })),
  };
}

// ---------------------------------------------------------------------------
// Helpers — classify the open actions that close the fired kill triggers.
// No new facts; these name the declared, dated tenant work.
// ---------------------------------------------------------------------------

function triggerAction(code: string): string {
  switch (code) {
    case 'measurement_unwired':
      return 'Capture the cost-per-contact baseline so the committed value ' +
        'metric can be wired to a recorded Discover baseline.';
    case 'business_case_blocker_open':
      return 'Resolve the open business-case critic blocker on the Design & ' +
        'Plan case.';
    case 'no_operating_model_owner':
      return 'Name an operating-model owner who accepts run accountability ' +
        'after go-live.';
    case 'adoption_unfunded':
      return 'Budget the change & adoption workstream in the effort estimate.';
    default:
      return `Clear the ${code} kill trigger.`;
  }
}

function triggerOwner(code: string): string {
  switch (code) {
    case 'measurement_unwired':
      return 'Brendan Fox (CS Ops)';
    case 'business_case_blocker_open':
      return 'Priya Iyer (Program Lead)';
    case 'no_operating_model_owner':
      return 'Executive Sponsor (CIO)';
    default:
      return 'Priya Iyer (Program Lead)';
  }
}

function triggerDue(code: string): string {
  // The cost-per-contact baseline carries a dated tenant action item; the
  // others are grouped against the launch gate horizon.
  return code === 'measurement_unwired' ? '2026-05-15' : '2026-05-29';
}
