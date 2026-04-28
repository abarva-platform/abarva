// source-commercial-signals-view.ts — TOWER1
//
// Deterministic view model for the Source commercial signals panel
// in the Control Tower.
//
// Answers: "What does the user need to know or do next about sourcing?"
//
// Surfaces AMS Vendor Consolidation 2026 pricing, BAFO, and selection
// readiness signals in the executive control tower surface.
//
// Deterministic: no live clocks, no randomness, no network IO, no DB writes.
// Does NOT import from src/lib/source/** — standalone tower domain fixture.

// ─── Output types ─────────────────────────────────────────────────────────────

export type CommercialSignalSeverity = 'critical' | 'high' | 'medium' | 'info';

export type CommercialSignalDomain =
  | 'pricing'
  | 'bafo'
  | 'selection_readiness'
  | 'vendor_risk'
  | 'programme_alignment';

export interface CommercialSignalAction {
  actionId: string;
  label: string;
  owner: string;
  deadline: string;
}

export interface CommercialSignal {
  signalId: string;
  domain: CommercialSignalDomain;
  severity: CommercialSignalSeverity;
  title: string;
  narrative: string;
  /** Recommended next action for executive / delivery owner. */
  recommendedAction: string;
  actions: CommercialSignalAction[];
}

export interface SourceCommercialEventSummary {
  eventId: string;
  eventName: string;
  stage: string;
  stageLabel: string;
  /** Number of active vendors. */
  activeVendorCount: number;
  /** Number of signals requiring immediate attention. */
  criticalSignalCount: number;
  highSignalCount: number;
  /** Whether the event is on track for selection. */
  selectionReadiness: 'on_track' | 'at_risk' | 'blocked';
  selectionReadinessLabel: string;
}

export interface SourceCommercialSignalsView {
  headline: string;
  contextLine: string;
  eventSummary: SourceCommercialEventSummary;
  signals: CommercialSignal[];
  /** Cross-event guidance for the executive. */
  executiveGuidance: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const AMS_SIGNALS: CommercialSignal[] = [
  {
    signalId: 'tower-ams-s1',
    domain: 'vendor_risk',
    severity: 'critical',
    title: 'Vendor B SOC-2 attestation gap blocks full evaluation',
    narrative:
      'Vendor B has not submitted a current SOC-2 Type II report, blocking security evaluation. Award stage gate cannot open until this is resolved. Deadline for escalation is May 2, 2026.',
    recommendedAction:
      'Escalate to Vendor B procurement contact directly. If not resolved by May 2, brief selection committee on Vendor B exclusion risk.',
    actions: [
      {
        actionId: 'ams-a1',
        label: 'Escalate SOC-2 requirement to Vendor B',
        owner: 'Procurement Lead',
        deadline: 'May 2, 2026',
      },
    ],
  },
  {
    signalId: 'tower-ams-s2',
    domain: 'pricing',
    severity: 'high',
    title: 'Vendor C below-median pricing requires scope validation',
    narrative:
      'Vendor C\'s YR2+ run cost ($1.8M) is 14% below market median. Nexus flags structural pricing risk — scope assumptions or exclusions may be understating the true cost. Using this as a competitive anchor before validation could backfire.',
    recommendedAction:
      'Issue scope confirmation request to Vendor C. Require written confirmation that $1.8M covers the full 160-application RFP scope before using in BAFO negotiation.',
    actions: [
      {
        actionId: 'ams-a2',
        label: 'Issue Vendor C scope confirmation request',
        owner: 'Commercial Lead',
        deadline: 'May 5, 2026',
      },
    ],
  },
  {
    signalId: 'tower-ams-s3',
    domain: 'programme_alignment',
    severity: 'high',
    title: 'Vendor selection linked to APX-CDP-2026 Design gate',
    narrative:
      'Vendor architecture selection for AMS must align with the APX-CDP-2026 P3 Design gate. If Design gate is delayed (currently pending), the AMS Award stage may need to hold to avoid scope lock-in with an incompatible vendor architecture.',
    recommendedAction:
      'Monitor APX-CDP-2026 gate status. If Design gate slips past June 2026, convene a joint meeting to assess AMS award timeline impact.',
    actions: [
      {
        actionId: 'ams-a3',
        label: 'Review CDP gate alignment in next steering session',
        owner: 'Program Director',
        deadline: 'May 15, 2026',
      },
    ],
  },
  {
    signalId: 'tower-ams-s4',
    domain: 'bafo',
    severity: 'medium',
    title: 'Application count inconsistency across vendors reduces comparability',
    narrative:
      'Vendor A scoped 160 applications, Vendor B 142, Vendor C 155. Inconsistent scope baseline makes headline BAFO price comparison unreliable. Standardisation is required before selection committee can make a defensible recommendation.',
    recommendedAction:
      'Issue a BAFO clarification instruction to all vendors to reconfirm price on a common 160-application basis.',
    actions: [
      {
        actionId: 'ams-a4',
        label: 'Issue BAFO application count standardisation instruction',
        owner: 'Commercial Lead',
        deadline: 'May 8, 2026',
      },
    ],
  },
  {
    signalId: 'tower-ams-s5',
    domain: 'selection_readiness',
    severity: 'info',
    title: 'Vendor A leads on TCO — YR2+ base case $2.1M after normalisation',
    narrative:
      'Vendor A is the only vendor with a partially comparable BAFO submission. Base scenario negotiation could reduce YR2+ cost to $1.95M. Conservative scenario (rate escalation + governance cadence changes) yields $75K annualised saving.',
    recommendedAction:
      'Issue conservative and base scenario clarification questions to Vendor A as part of BAFO round close.',
    actions: [
      {
        actionId: 'ams-a5',
        label: 'Issue Vendor A BAFO clarification questions',
        owner: 'Commercial Lead',
        deadline: 'May 10, 2026',
      },
    ],
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the source commercial signals view for the Control Tower.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildSourceCommercialSignalsView(): SourceCommercialSignalsView {
  const eventSummary: SourceCommercialEventSummary = {
    eventId: 'src-ams-2026',
    eventName: 'AMS Vendor Consolidation 2026',
    stage: 'bafo',
    stageLabel: 'Stage 7 — BAFO',
    activeVendorCount: 3,
    criticalSignalCount: AMS_SIGNALS.filter((s) => s.severity === 'critical').length,
    highSignalCount: AMS_SIGNALS.filter((s) => s.severity === 'high').length,
    selectionReadiness: 'at_risk',
    selectionReadinessLabel: 'At risk — Vendor B blocker and scope gaps require resolution',
  };

  return {
    headline: 'Source commercial signals',
    contextLine: 'SRC-AMS-2026 · AMS Vendor Consolidation 2026 · BAFO · 5 active signals',
    eventSummary,
    signals: AMS_SIGNALS,
    executiveGuidance:
      'Two actions require executive attention before May 2: (1) escalate Vendor B SOC-2 requirement and (2) issue Vendor C scope confirmation. These are gates — without them, the selection committee cannot make a defensible recommendation by the BAFO deadline.',
    honestDisclaimer:
      'Deterministic seed · SRC-AMS-2026 commercial signals reflect fixture context only. ' +
      'Live vendor submission status, gate readiness, and programme alignment are deferred.',
    deterministicSeed: true,
  };
}
