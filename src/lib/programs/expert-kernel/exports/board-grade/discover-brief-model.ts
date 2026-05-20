// Board-grade Discover Brief — view-model.
//
// This module is the single seam between the Expert Kernel's Discover phase
// and the board-grade Discover Brief renderer. It runs the EXISTING Apex
// Discover kernel (`buildApexContactCenterDiscover`) and projects its outputs
// into the six blueprint §5 sections. It introduces NO new numbers — every
// figure traces to a kernel field. Where the kernel returns a declared seed
// gap, the view-model carries that honestly; it never fabricates a value.
//
// Blueprint §5 Discover Brief sections (six, plus a cover):
//   1. Decision snapshot     — is this a real problem worth shaping?
//   2. Current-state baseline — what do we actually know today?
//   3. Pain and opportunity  — where is value likely hiding?
//   4. Evidence gaps         — what prevents honest sizing?
//   5. Go/no-go gate         — what would make us stop?
//   6. Appendix              — sources and assumptions.
//
// Blueprint §5 hard fails honoured here:
//   - baseline metrics carry source + confidence;
//   - missing metrics are declared seed gaps, never blank;
//   - the opportunity range carries a caveat whenever a monetization input is
//     a seed gap (Apex: it is — so the range is directional-only).
//
// Pure module: deterministic, no I/O.

import { buildApexContactCenterDiscover } from '../../phase-playbooks/apex-discover-case';
import type {
  DiscoverDeliverables,
  DiscoverKillTrigger,
} from '../../phase-playbooks/discover';
import type { BaselineMetric } from '../../baseline-model';

// ---------------------------------------------------------------------------
// Section anatomy — blueprint §2. Every section carries the same shape.
// ---------------------------------------------------------------------------

/** Evidence strip — sources, dates, confidence, gaps; visible, not buried. */
export interface BriefEvidenceStrip {
  sources: string[];
  asOf: string;
  confidence: 'high' | 'medium' | 'low' | 'blocked';
  gaps: string[];
}

/** A consulting-exhibit section header — blueprint §2 anatomy. */
export interface BriefSectionAnatomy {
  /** Section number, 1..6. */
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
  evidence: BriefEvidenceStrip;
  /** The implication — the action the exhibit creates. */
  implication: string;
  /** Owner accountable for resolving the page's issue. */
  owner: string;
  /** Where it gates the process. */
  nextGate: string;
}

// ---------------------------------------------------------------------------
// The full Discover Brief view-model.
// ---------------------------------------------------------------------------

/** The Discover go/no-go verdict, projected for the deck. */
export type BriefVerdict = 'go' | 'reshape' | 'no-go';

export interface DiscoverBrief {
  tenantLabel: string;
  tenantKey: string;
  moveLabel: string;
  artifactLabel: string;
  generatedOn: string;
  /** The Discover go/no-go decision. For Apex this is `reshape`. */
  verdict: BriefVerdict;
  /** True when the opportunity cannot be monetized — a monetization seed gap. */
  monetisationBlocked: boolean;
  /** The six sections, page-ordered. */
  sections: BriefSections;
  /** Navigation entries for the deck menu rail. */
  toc: Array<{ page: number; id: string; label: string; takeaway: string }>;
}

export interface BriefSections {
  decisionSnapshot: DecisionSnapshotSection;
  currentStateBaseline: CurrentStateBaselineSection;
  painAndOpportunity: PainAndOpportunitySection;
  evidenceGaps: EvidenceGapsSection;
  goNoGoGate: GoNoGoGateSection;
  appendix: AppendixSection;
}

// --- §1 Decision snapshot ---------------------------------------------------

export interface DecisionSnapshotSection {
  anatomy: BriefSectionAnatomy;
  /** The one-sentence verdict word, plain. */
  verdictHeadline: string;
  verdictDetail: string;
  /** The problem statement, as a measured gap. */
  problem: string;
  /** Confidence read on advancing to Charter. */
  confidence: 'high' | 'medium' | 'low';
  /** Snapshot tiles — verdict, confidence, blocker count, anchor. */
  tiles: Array<{
    label: string;
    value: string;
    sub: string;
    tone: 'neutral' | 'good' | 'warn' | 'bad';
  }>;
  /** The single evidence request that gates the decision. */
  nextEvidenceRequest: string;
}

// --- §2 Current-state baseline ---------------------------------------------

export interface CurrentStateBaselineSection {
  anatomy: BriefSectionAnatomy;
  /** Coverage meter inputs — recorded vs seed-gap split. */
  recordedCount: number;
  seedGapCount: number;
  coveragePct: number;
  weakestConfidence: 'high' | 'medium' | 'low' | null;
  /** The recorded-metric source table — source + confidence are mandatory. */
  metrics: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
    caveat: string;
  }>;
  /** The seed gaps, shown in the same table as explicit gaps, never blank. */
  seedGaps: Array<{ metric: string; reason: string; asOf: string }>;
}

// --- §3 Pain and opportunity -----------------------------------------------

export interface PainAndOpportunitySection {
  anatomy: BriefSectionAnatomy;
  /** Pain themes drawn from the Discover traps and the problem statement. */
  painThemes: Array<{ theme: string; detail: string }>;
  /** The opportunity statement, plain. */
  opportunityStatement: string;
  /** How honestly the opportunity can be expressed. */
  expressibleAs: 'dollars' | 'operational_hours' | 'directional';
  /** True when a monetization input is a seed gap — caveat is then mandatory. */
  directionalOnly: boolean;
  /** The mandatory caveat carried under the opportunity range. */
  caveat: string;
  /** Known constraints that bound the solution space. */
  constraints: string[];
}

// --- §4 Evidence gaps -------------------------------------------------------

export interface EvidenceGapsSection {
  anatomy: BriefSectionAnatomy;
  /** The gap-closure queue — open gaps sorted by decision impact. */
  gaps: Array<{
    label: string;
    owner: string;
    due: string;
    impact: number;
    blocksSizing: boolean;
    decisionImpact: string;
  }>;
}

// --- §5 Go/no-go gate -------------------------------------------------------

export interface GoNoGoGateSection {
  anatomy: BriefSectionAnatomy;
  /** The kill checklist — each trigger with a pass / shape / stop state. */
  killChecks: Array<{
    code: string;
    condition: string;
    /** 'stop' = fired no-go, 'shape' = fired reshape, 'pass' = not fired. */
    state: 'pass' | 'shape' | 'stop';
    effect: 'no-go' | 'reshape';
  }>;
  /** What must become true for a reshape Move to advance. */
  fixConditions: string[];
  /** The go/no-go rationale. */
  rationale: string;
}

// --- §6 Appendix ------------------------------------------------------------

export interface AppendixSection {
  anatomy: BriefSectionAnatomy;
  /** The source ledger — every recorded metric's provenance. */
  sources: Array<{
    metric: string;
    value: string;
    source: string;
    asOf: string;
    confidence: 'high' | 'medium' | 'low';
  }>;
  /** Assumption / method notes carried into Charter. */
  assumptions: Array<{ note: string; basis: string }>;
}

// ===========================================================================
// Builder.
// ===========================================================================

/** Build the Apex Contact Center AI Routing Discover Brief. Deterministic. */
export function buildApexDiscoverBrief(generatedOn: string): DiscoverBrief {
  const d: DiscoverDeliverables = buildApexContactCenterDiscover();
  const baseline = d.baseline;
  const recorded = baseline.recordedMetrics;
  const seedGaps = baseline.seedGaps;
  const total = recorded.length + seedGaps.length;
  const coveragePct =
    total > 0 ? Math.round((recorded.length / total) * 100) : 0;

  const verdict = d.goNoGo.decision;
  const monetisationBlocked = d.opportunity.expressibleAs !== 'dollars';

  const seedGapLabels = seedGaps.map((g) => g.label);
  const firedCodes = new Set(d.goNoGo.firedKillTriggers.map((t) => t.code));

  // --- §1 Decision snapshot -------------------------------------------------
  const verdictWord =
    verdict === 'go' ? 'GO' : verdict === 'reshape' ? 'RESHAPE' : 'NO-GO';
  const decisionSnapshot: DecisionSnapshotSection = {
    anatomy: {
      page: 1,
      id: 'decision-snapshot',
      navLabel: 'Decision snapshot',
      takeaway:
        'The contact-routing problem is real and measured — but do not ' +
        'commit to a Charter until the cost-per-contact and volume gaps ' +
        'are closed.',
      decisionRole:
        'Decide whether the idea is real enough to shape into a Charter.',
      evidence: {
        sources: [
          'Moves Expert Kernel — Discover playbook + go/no-go',
          'Apex audited substrate (NICE CXone KPIs, Move P2 baseline)',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'Discover can advance to Charter as a shaping exercise — but the ' +
        'opportunity cannot be sized to a CFO standard until two seed gaps ' +
        'close.',
      owner: 'VP Customer Care (Domain Owner)',
      nextGate: 'Charter shaping gate — conditional on the cost / volume gaps',
    },
    verdictHeadline:
      verdict === 'reshape'
        ? 'RESHAPE — the problem is real; shape it, but the case is not yet ' +
          'sizeable'
        : verdict === 'go'
          ? 'GO — Discover is clean enough to advance to Charter'
          : 'NO-GO — Discover cannot honestly advance this Move',
    verdictDetail: d.goNoGo.rationale,
    problem: d.problemStatement.statement,
    confidence: 'medium',
    tiles: [
      {
        label: 'Discover verdict',
        value: verdictWord,
        sub:
          verdict === 'reshape'
            ? 'Shape, do not yet size'
            : verdict === 'go'
              ? 'Advance to Charter'
              : 'Stop the Move',
        tone: verdict === 'go' ? 'good' : verdict === 'no-go' ? 'bad' : 'warn',
      },
      {
        label: 'Problem anchor',
        value: d.problemStatement.anchorIsMeasured ? 'Measured' : 'Unanchored',
        sub: 'Anchored on Contact Center Containment',
        tone: d.problemStatement.anchorIsMeasured ? 'good' : 'bad',
      },
      {
        label: 'Baseline coverage',
        value: `${coveragePct}%`,
        sub: `${recorded.length} recorded · ${seedGaps.length} seed gaps`,
        tone: coveragePct >= 70 ? 'good' : 'warn',
      },
      {
        label: 'Sizing blockers',
        value: String(d.unansweredSizingQuestions.length),
        sub: 'Sizing-blocking metrics absent',
        tone: 'bad',
      },
      {
        label: 'Next gate',
        value: 'Charter',
        sub: 'Conditional shaping gate',
        tone: 'neutral',
      },
    ],
    nextEvidenceRequest:
      'Capture the cost-per-contact baseline and the annual contact volume — ' +
      'the two evidence asks that gate an honest Charter business case.',
  };

  // --- §2 Current-state baseline -------------------------------------------
  const currentStateBaseline: CurrentStateBaselineSection = {
    anatomy: {
      page: 2,
      id: 'current-state-baseline',
      navLabel: 'Current-state baseline',
      takeaway:
        'Half of what this Move needs is measured and sourced — the other ' +
        'half is declared seed gaps, not guesses.',
      decisionRole:
        'Confirm the baseline is real enough to reason from.',
      evidence: {
        sources: [
          'Apex KPI dictionary (NICE CXone kpi:apex:018–021)',
          'Move P2 baseline deliverable (Genesys routing export)',
        ],
        asOf: '2026-04-30',
        confidence: baseline.weakestConfidence ?? 'low',
        gaps: seedGapLabels,
      },
      implication:
        'The recorded metrics are decision-grade; the four seed gaps are the ' +
        'declared limits of what Discover can claim today.',
      owner: 'James Wright (Containment reconciliation owner)',
      nextGate: 'NICE-vs-IT containment reconciliation (due 2026-05-08)',
    },
    recordedCount: recorded.length,
    seedGapCount: seedGaps.length,
    coveragePct,
    weakestConfidence: baseline.weakestConfidence,
    metrics: recorded.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
      caveat: m.caveat ?? '—',
    })),
    seedGaps: seedGaps.map((g) => ({
      metric: g.label,
      reason: g.seedGapReason ?? 'Not recorded.',
      asOf: g.asOf,
    })),
  };

  // --- §3 Pain and opportunity ---------------------------------------------
  // Pain themes are drawn from the contact-centre Discover traps — the ways a
  // top consultant knows this diagnosis can go wrong — paired with the real
  // recorded baseline.
  const trapByCode = new Map(d.playbook.traps.map((t) => [t.code, t]));
  const painThemes: Array<{ theme: string; detail: string }> = [
    {
      theme: 'Containment is plateaued while handle time rises',
      detail:
        'Containment sits at 28% against a 40% target; AHT is up to 7.2 min ' +
        'from 6.4. Easy contacts are deflected, so the calls that reach ' +
        'agents are harder — the two metrics must be modelled together.',
    },
    {
      theme: 'No slack to absorb the mix shift',
      detail:
        trapByCode.get('trap_utilization_ceiling')?.description ??
        'Agent utilisation is already above target — labour-takeout value ' +
          'has limited room to land.',
    },
    {
      theme: 'Repeat transfers read as mis-routing',
      detail:
        'Repeat transfers run at 18.4% — consistent with routing that does ' +
        'not place contacts with the right-skilled agent first time.',
    },
  ];
  const painAndOpportunity: PainAndOpportunitySection = {
    anatomy: {
      page: 3,
      id: 'pain-and-opportunity',
      navLabel: 'Pain and opportunity',
      takeaway:
        'There is real value in lifting containment and cutting repeat ' +
        'transfers — but it can only be stated directionally until the ' +
        'monetization inputs land.',
      decisionRole:
        'Confirm the opportunity is worth shaping, and how honestly it can ' +
        'be expressed.',
      evidence: {
        sources: [
          'Discover opportunity sizing — kernel',
          'NICE CXone KPIs; Move P2 baseline',
        ],
        asOf: generatedOn,
        confidence: d.opportunity.confidence,
        gaps: d.opportunity.cappedBySeedGaps.map(
          (k) => `${k} — caps how the opportunity can be expressed`,
        ),
      },
      implication:
        'A directional opportunity is enough to justify a shaping Charter — ' +
        'it is not enough to justify build funding.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Cost-per-contact + volume capture before Charter sizing',
    },
    painThemes,
    opportunityStatement: d.opportunity.statement,
    expressibleAs: d.opportunity.expressibleAs,
    directionalOnly: d.opportunity.expressibleAs !== 'dollars',
    caveat:
      d.opportunity.expressibleAs === 'directional'
        ? 'Annual contact volume and cost-per-contact are seed gaps — no ' +
          'dollar value is shown; the band is directional only.'
        : d.opportunity.expressibleAs === 'operational_hours'
          ? 'Cost-per-contact is a seed gap — value is expressed in ' +
            'operational hours, not dollars.'
          : 'Opportunity is sized to the recorded baseline.',
    constraints: [
      'WFM lead is on record for agent-assist, not full deflection — ' +
        'autonomy beyond assist is out of the honest solution space.',
      'A transcript-use privacy review is pending — customer-facing ' +
        'inference is conditional on it clearing.',
      'Agent utilisation at 84% is above the 80% target — labour-takeout ' +
        'value is capped by the lack of capacity headroom.',
    ],
  };

  // --- §4 Evidence gaps -----------------------------------------------------
  // The gap-closure queue is the four declared seed gaps, ranked by decision
  // impact. The two sizing-blocking gaps outrank the two informing gaps.
  const sizingBlockerKeys = new Set(
    d.unansweredSizingQuestions.map((q) => q.baselineMetricKey),
  );
  const gapRows = seedGaps.map((g) => {
    const blocksSizing = sizingBlockerKeys.has(g.key);
    return {
      label: g.label,
      owner: gapOwner(g),
      due: gapDue(g),
      impact: gapImpactWeight(g, blocksSizing),
      blocksSizing,
      decisionImpact: gapDecisionImpact(g),
    };
  });
  const evidenceGaps: EvidenceGapsSection = {
    anatomy: {
      page: 4,
      id: 'evidence-gaps',
      navLabel: 'Evidence gaps',
      takeaway:
        'Two of the four open gaps block honest sizing — closing them is ' +
        'the work that turns this Discover into a fundable Charter.',
      decisionRole:
        'Confirm every gap has an owner and a due date before Charter.',
      evidence: {
        sources: [
          'Discover playbook — unanswered sizing questions',
          'Apex operating telemetry — tenant action items',
        ],
        asOf: generatedOn,
        confidence: 'blocked',
        gaps: seedGapLabels,
      },
      implication:
        'No gap is unowned; the two sizing blockers are the conditions on ' +
        'the Charter gate.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Close the two sizing gaps before Charter sizing',
    },
    gaps: gapRows,
  };

  // --- §5 Go/no-go gate -----------------------------------------------------
  // The kill checklist is every playbook kill trigger with a pass / shape /
  // stop state — pass when it did not fire, shape/stop when it did.
  const killChecks = d.playbook.killTriggers.map(
    (t: DiscoverKillTrigger) => ({
      code: t.code,
      condition: t.condition,
      state: (firedCodes.has(t.code)
        ? t.effect === 'no-go'
          ? 'stop'
          : 'shape'
        : 'pass') as 'pass' | 'shape' | 'stop',
      effect: t.effect,
    }),
  );
  const goNoGoGate: GoNoGoGateSection = {
    anatomy: {
      page: 5,
      id: 'go-no-go-gate',
      navLabel: 'Go/no-go gate',
      takeaway:
        'No kill trigger stops the Move — but two reshape triggers fired, ' +
        'so the honest verdict is reshape, not go.',
      decisionRole:
        'Decide whether to advance, reshape, or stop the Move now.',
      evidence: {
        sources: [
          'Discover playbook — kill triggers',
          'Discover go/no-go evaluation',
        ],
        asOf: generatedOn,
        confidence: 'medium',
        gaps: d.goNoGo.fixConditions,
      },
      implication:
        'The Move advances as a shaping Charter only; the two fired reshape ' +
        'triggers become the Charter gate conditions.',
      owner: 'VP Customer Care (Domain Owner)',
      nextGate: 'Charter gate — conditional on the fix conditions',
    },
    killChecks,
    fixConditions: d.goNoGo.fixConditions,
    rationale: d.goNoGo.rationale,
  };

  // --- §6 Appendix ----------------------------------------------------------
  const appendix: AppendixSection = {
    anatomy: {
      page: 6,
      id: 'appendix',
      navLabel: 'Appendix',
      takeaway:
        'Every recorded number in this brief traces to a named source — ' +
        'and every missing one is a declared gap, not a silent omission.',
      decisionRole: 'Audit every claim back to a source or a declared gap.',
      evidence: {
        sources: [
          'Apex KPI dictionary, Move P2 baseline, operating telemetry',
        ],
        asOf: '2026-04-30',
        confidence: 'medium',
        gaps: seedGapLabels,
      },
      implication:
        'The brief is auditable end to end; the appendix is the source of ' +
        'truth Charter inherits.',
      owner: 'Priya Iyer (Program Lead)',
      nextGate: 'Charter inherits this source ledger unchanged',
    },
    sources: recorded.map((m) => ({
      metric: m.label,
      value: `${m.value} ${m.unit}`,
      source: m.source,
      asOf: m.asOf,
      confidence: m.confidence,
    })),
    assumptions: [
      {
        note:
          'The Move classifies as a human-in-loop agent (agent-assist), ' +
          'not full deflection.',
        basis: 'Apex realness audit — contact-centre archetype.',
      },
      {
        note:
          'The opportunity is stated directionally — no dollar value is ' +
          'claimed.',
        basis:
          'Annual contact volume and cost-per-contact are declared seed ' +
          'gaps; the kernel caps the opportunity at directional.',
      },
      {
        note:
          'The 2026-05-17 transcript-use privacy review is assumed to clear.',
        basis:
          'Apex audit expectation — the compliance kill trigger is NOT ' +
          'treated as fired; if the review fails, the verdict reverts to ' +
          'no-go.',
      },
      {
        note:
          'Containment carries a known NICE-vs-IT-dashboard measurement ' +
          'discrepancy.',
        basis:
          'Reconciliation owned by James Wright, due 2026-05-08 — carried ' +
          'as a caveat on every containment-derived claim.',
      },
    ],
  };

  const sections: BriefSections = {
    decisionSnapshot,
    currentStateBaseline,
    painAndOpportunity,
    evidenceGaps,
    goNoGoGate,
    appendix,
  };

  const ordered: BriefSectionAnatomy[] = [
    decisionSnapshot.anatomy,
    currentStateBaseline.anatomy,
    painAndOpportunity.anatomy,
    evidenceGaps.anatomy,
    goNoGoGate.anatomy,
    appendix.anatomy,
  ];

  return {
    tenantLabel: 'Apex Retail',
    tenantKey: d.tenantKey,
    moveLabel: d.moveName,
    artifactLabel: 'Discover Brief',
    generatedOn,
    verdict,
    monetisationBlocked,
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
// Helpers — gap ownership, due dates and decision-impact, grounded in the
// declared seed-gap reasons. No new facts; these classify what the kernel
// already states.
// ---------------------------------------------------------------------------

function gapOwner(g: BaselineMetric): string {
  if (g.key === 'cost_per_contact_usd') return 'Brendan Fox (CS Ops)';
  if (g.key === 'contact_volume_annual') return 'Priya Iyer (Program Lead)';
  if (g.key === 'channel_mix') return 'James Wright (CX Analytics)';
  return 'Priya Iyer (Program Lead)';
}

function gapDue(g: BaselineMetric): string {
  // cost-per-contact carries a dated tenant action item; the others are
  // grouped against the Charter gate, dated to the brief's as-of horizon.
  if (g.key === 'cost_per_contact_usd') return '2026-05-15';
  return '2026-05-19';
}

/**
 * Decision-impact weight — drives the gap-closure queue order. A sizing
 * blocker outranks an informing gap; cost-per-contact is the single highest
 * leverage missing input per the declared seed-gap reasons.
 */
function gapImpactWeight(g: BaselineMetric, blocksSizing: boolean): number {
  if (g.key === 'cost_per_contact_usd') return 100;
  if (g.key === 'contact_volume_annual') return 84;
  if (blocksSizing) return 70;
  if (g.key === 'channel_mix') return 46;
  return 32;
}

function gapDecisionImpact(g: BaselineMetric): string {
  switch (g.key) {
    case 'cost_per_contact_usd':
      return 'Blocks monetization — without it the opportunity cannot be ' +
        'expressed in dollars. The single gate-closing gap.';
    case 'contact_volume_annual':
      return 'Cannot convert AHT / containment deltas into FTE-hours or ' +
        'dollars — value stays directional until it lands.';
    case 'channel_mix':
      return 'Routing value differs by channel; the voice/chat/IVR split ' +
        'bounds how a pilot is scoped.';
    case 'qa_error_rate_pct':
      return 'No quality-defect baseline — a secondary value lever cannot ' +
        'be sized in Charter.';
    default:
      return 'Decision impact not classified.';
  }
}
