// transition-readiness-view.ts — SRC45
//
// Deterministic view model for the Transition Readiness placeholder lens
// on the SourceEventDetailPage (tab key: 'transition').
//
// Answers: "Are we ready to begin vendor transition — and what's blocking us?"
//
// Covers per-vendor transition readiness, cross-vendor go/no-go criteria,
// transition risk indicators, and an Atlas-guided recommended next action.
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/tower/**, src/lib/programs/**, or supabase.

// ─── Output types ─────────────────────────────────────────────────────────────

export type TransitionReadinessStatus =
  | 'ready'
  | 'partial'
  | 'blocked'
  | 'not_started'
  | 'deferred';

export type TransitionRiskSeverity = 'high' | 'medium' | 'low';

export interface TransitionCheckItem {
  checkId: string;
  label: string;
  status: TransitionReadinessStatus;
  /** Short note on what is needed to move to 'ready'. */
  blockerNote: string | null;
}

export interface VendorTransitionReadiness {
  vendorId: string;
  vendorLabel: string;
  overallStatus: TransitionReadinessStatus;
  checks: TransitionCheckItem[];
  /** True if this vendor is currently blocked from transition consideration. */
  transitionBlocked: boolean;
  blockerSummary: string | null;
}

export interface TransitionRiskItem {
  riskId: string;
  label: string;
  severity: TransitionRiskSeverity;
  narrative: string;
  mitigationNote: string;
}

export interface TransitionGoNoGoItem {
  criterionId: string;
  label: string;
  /** Whether this criterion has been met as of the deterministic seed. */
  met: boolean;
  /** Who is accountable for resolving unmet criteria. */
  owner: string;
}

export interface TransitionReadinessSummary {
  readyVendorCount: number;
  partialVendorCount: number;
  blockedVendorCount: number;
  goNoGoMetCount: number;
  goNoGoTotalCount: number;
  /** True when all go/no-go criteria are met for at least one vendor. */
  transitionClearToBegin: boolean;
}

export interface TransitionReadinessView {
  headline: string;
  contextLine: string;
  summary: TransitionReadinessSummary;
  vendors: VendorTransitionReadiness[];
  risks: TransitionRiskItem[];
  goNoGoCriteria: TransitionGoNoGoItem[];
  /** Atlas guidance for the highest-priority transition action. */
  atlasGuidance: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const VENDOR_READINESS: VendorTransitionReadiness[] = [
  {
    vendorId: 'vendor-a',
    vendorLabel: 'Vendor A',
    overallStatus: 'partial',
    transitionBlocked: false,
    blockerSummary: null,
    checks: [
      {
        checkId: 'va-ktp',
        label: 'Knowledge transfer plan submitted',
        status: 'partial',
        blockerNote: 'Draft plan received — Phase 1 scope only; Phase 2 and 3 transfer milestones pending',
      },
      {
        checkId: 'va-sla',
        label: 'Transition-period SLA terms agreed',
        status: 'partial',
        blockerNote: 'Base SLA terms agreed; P1-critical incident SLA during cutover window still under negotiation',
      },
      {
        checkId: 'va-timeline',
        label: '90-day transition timeline confirmed',
        status: 'ready',
        blockerNote: null,
      },
      {
        checkId: 'va-staffing',
        label: 'Transition staffing plan submitted',
        status: 'ready',
        blockerNote: null,
      },
      {
        checkId: 'va-references',
        label: 'Reference calls completed (3 of 3)',
        status: 'ready',
        blockerNote: null,
      },
      {
        checkId: 'va-integration',
        label: 'CDP integration architecture aligned',
        status: 'partial',
        blockerNote: 'Pending APX-CDP-2026 P3 Design gate — integration scope locked when gate clears',
      },
    ],
  },
  {
    vendorId: 'vendor-b',
    vendorLabel: 'Vendor B',
    overallStatus: 'blocked',
    transitionBlocked: true,
    blockerSummary: 'SOC-2 Type II attestation outstanding — blocks transition evaluation and contract execution',
    checks: [
      {
        checkId: 'vb-soc2',
        label: 'SOC-2 Type II attestation on file',
        status: 'blocked',
        blockerNote: 'Attestation outstanding — Vendor B cannot proceed to contract or transition planning until resolved',
      },
      {
        checkId: 'vb-ktp',
        label: 'Knowledge transfer plan submitted',
        status: 'not_started',
        blockerNote: 'Blocked pending SOC-2 resolution — not started',
      },
      {
        checkId: 'vb-sla',
        label: 'Transition-period SLA terms agreed',
        status: 'not_started',
        blockerNote: 'Blocked pending SOC-2 resolution — SLA negotiation deferred',
      },
      {
        checkId: 'vb-timeline',
        label: '90-day transition timeline confirmed',
        status: 'deferred',
        blockerNote: 'Deferred — timeline cannot be set until SOC-2 and contract gate resolve',
      },
      {
        checkId: 'vb-staffing',
        label: 'Transition staffing plan submitted',
        status: 'not_started',
        blockerNote: 'Not started — deferred pending contract',
      },
      {
        checkId: 'vb-references',
        label: 'Reference calls completed (3 of 3)',
        status: 'partial',
        blockerNote: '1 of 3 reference calls completed — remaining 2 scheduled but not yet held',
      },
    ],
  },
  {
    vendorId: 'vendor-c',
    vendorLabel: 'Vendor C',
    overallStatus: 'partial',
    transitionBlocked: false,
    blockerSummary: 'Scope unvalidated — transition planning contingent on BAFO scope confirmation',
    checks: [
      {
        checkId: 'vc-scope',
        label: 'BAFO scope validated and confirmed',
        status: 'partial',
        blockerNote: 'Scope validation in progress — below-median pricing under review for scope completeness',
      },
      {
        checkId: 'vc-ktp',
        label: 'Knowledge transfer plan submitted',
        status: 'not_started',
        blockerNote: 'Not started — pending scope validation',
      },
      {
        checkId: 'vc-sla',
        label: 'Transition-period SLA terms agreed',
        status: 'not_started',
        blockerNote: 'Not started — pending scope and BAFO close',
      },
      {
        checkId: 'vc-timeline',
        label: '90-day transition timeline confirmed',
        status: 'not_started',
        blockerNote: 'Not started — Vendor C has not confirmed transition timeline',
      },
      {
        checkId: 'vc-staffing',
        label: 'Transition staffing plan submitted',
        status: 'not_started',
        blockerNote: 'Not started',
      },
      {
        checkId: 'vc-references',
        label: 'Reference calls completed (3 of 3)',
        status: 'partial',
        blockerNote: '2 of 3 reference calls completed — third call pending scheduling',
      },
    ],
  },
];

const TRANSITION_RISKS: TransitionRiskItem[] = [
  {
    riskId: 'tr-incumbent-departure',
    label: 'Incumbent departure gap risk',
    severity: 'high',
    narrative:
      'Current incumbent AMS contract expires at the same time new vendor transition is expected to begin. ' +
      'If the transition start is delayed past the contract expiry, a gap period may require incumbent extension at ' +
      'premium rates or an unmanaged handoff.',
    mitigationNote:
      'Confirm current contract end date and negotiate 60-day extension option at current rates as a backstop.',
  },
  {
    riskId: 'tr-cdp-integration',
    label: 'CDP integration scope lock-in risk',
    severity: 'high',
    narrative:
      'The AMS vendor selected will be integrated with the CDP platform. The CDP P3 Design gate is pending. ' +
      'If the AMS vendor is selected before the CDP design is locked, there is a risk of architecture incompatibility ' +
      'that would require rework during the transition period.',
    mitigationNote:
      'Resolve APX-CDP-2026 P3 Design gate before AMS BAFO close to ensure integration architecture compatibility.',
  },
  {
    riskId: 'tr-parallel-run-cost',
    label: 'Parallel run cost overrun',
    severity: 'medium',
    narrative:
      'Standard AMS transitions require a 4–8 week parallel run period where both incumbent and new vendor are ' +
      'active. Cost modelling from Vendor A BAFO does not fully separate transition from YR1 steady-state cost. ' +
      'Parallel run could add $80–120K to the transition cost envelope.',
    mitigationNote:
      'Request itemised parallel run cost split from Vendor A BAFO before contract execution.',
  },
  {
    riskId: 'tr-knowledge-continuity',
    label: 'Institutional knowledge continuity',
    severity: 'medium',
    narrative:
      'AMS transition requires transfer of 4 years of operational knowledge from incumbent. Current knowledge ' +
      'transfer plans from Vendor A cover only Phase 1 scope. Gaps in Phase 2/3 transfer create a risk of ' +
      'service quality degradation in months 3–6 post-transition.',
    mitigationNote:
      'Require complete Phase 2/3 knowledge transfer milestones as a contract condition before signature.',
  },
];

const GO_NO_GO_CRITERIA: TransitionGoNoGoItem[] = [
  {
    criterionId: 'gng-vendor-selected',
    label: 'Vendor selection decision executed',
    met: false,
    owner: 'CPO / Procurement Lead',
  },
  {
    criterionId: 'gng-soc2-resolved',
    label: 'Selected vendor SOC-2 attestation on file (if Vendor B selected)',
    met: false,
    owner: 'InfoSec / Vendor B',
  },
  {
    criterionId: 'gng-cdp-gate',
    label: 'APX-CDP-2026 P3 Design gate cleared',
    met: false,
    owner: 'CDP Programme Lead',
  },
  {
    criterionId: 'gng-contract',
    label: 'Transition contract executed with selected vendor',
    met: false,
    owner: 'Legal / Procurement Lead',
  },
  {
    criterionId: 'gng-ktp-complete',
    label: 'Full knowledge transfer plan (all phases) approved',
    met: false,
    owner: 'AMS Programme Lead',
  },
  {
    criterionId: 'gng-incumbent-extension',
    label: 'Incumbent extension option confirmed as backstop',
    met: false,
    owner: 'Procurement Lead',
  },
  {
    criterionId: 'gng-transition-budget',
    label: 'Transition cost budget approved (inc. parallel run)',
    met: false,
    owner: 'CFO / Finance',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the transition readiness view for the Source event detail page.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildTransitionReadinessView(): TransitionReadinessView {
  const readyVendorCount = VENDOR_READINESS.filter((v) => v.overallStatus === 'ready').length;
  const partialVendorCount = VENDOR_READINESS.filter((v) => v.overallStatus === 'partial').length;
  const blockedVendorCount = VENDOR_READINESS.filter((v) => v.transitionBlocked).length;

  const goNoGoMetCount = GO_NO_GO_CRITERIA.filter((c) => c.met).length;
  const goNoGoTotalCount = GO_NO_GO_CRITERIA.length;
  const transitionClearToBegin = goNoGoMetCount === goNoGoTotalCount;

  const summary: TransitionReadinessSummary = {
    readyVendorCount,
    partialVendorCount,
    blockedVendorCount,
    goNoGoMetCount,
    goNoGoTotalCount,
    transitionClearToBegin,
  };

  return {
    headline: 'Transition readiness',
    contextLine: `${VENDOR_READINESS.length} vendors tracked · ${blockedVendorCount} blocked · ${goNoGoMetCount}/${goNoGoTotalCount} go/no-go criteria met`,
    summary,
    vendors: VENDOR_READINESS,
    risks: TRANSITION_RISKS,
    goNoGoCriteria: GO_NO_GO_CRITERIA,
    atlasGuidance:
      'Transition cannot begin until vendor selection is executed and the CDP P3 Design gate is cleared. ' +
      'The highest-risk item is the incumbent contract expiry overlap — confirm the extension backstop option ' +
      'now, before the BAFO close decision, to avoid a gap period.',
    honestDisclaimer:
      'Deterministic seed · Transition readiness reflects fixture data for SRC-AMS-2026 at Stage 7 (BAFO). ' +
      'Live transition tracking, vendor check submission, and go/no-go gate management are deferred to the ' +
      'Source transition module (post-selection).',
    deterministicSeed: true,
  };
}
