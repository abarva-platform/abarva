// apex-retail-pattern-plan-view.ts — INT1
//
// Deterministic view model for the Apex Retail client-specific pattern plan
// on the Intelligence lens surface (tab key: 'pattern_plan').
//
// Answers: "Which intelligence patterns apply to THIS client's situation,
// where are the evidence gaps, and what should Sentinel prioritise next?"
//
// Surfaced as the Pattern Plan tab on IntelligenceLensTabs.
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ─────────────────────────────────────────────────────────────

export type PatternApplicationStatus =
  | 'active'        // pattern is actively driving decisions now
  | 'candidate'     // pattern applies but not yet acted upon
  | 'monitoring'    // conditions match but trigger threshold not yet reached
  | 'deferred'      // pattern applies but client has chosen to defer action
  | 'not_applicable'; // pattern does not match client situation

export type PatternEvidenceStrength = 'strong' | 'partial' | 'weak' | 'missing';

export type PatternDomain =
  | 'sourcing'
  | 'cdp'
  | 'ai_programs'
  | 'architecture'
  | 'meta';

export interface PatternEvidenceGap {
  gapId: string;
  label: string;
  /** What evidence is needed to close this gap. */
  needed: string;
  /** Which team or data source should provide it. */
  source: string;
}

export interface AppliedPattern {
  patternId: string;
  title: string;
  domain: PatternDomain;
  applicationStatus: PatternApplicationStatus;
  evidenceStrength: PatternEvidenceStrength;
  /** 1–3 sentence description of how this pattern applies to Apex Retail. */
  clientApplication: string;
  /** Known evidence supporting this pattern's relevance. */
  evidenceItems: string[];
  /** Open evidence gaps that reduce confidence. */
  evidenceGaps: PatternEvidenceGap[];
  /** Sentinel's recommended next action for this pattern. */
  sentinelNextAction: string | null;
}

export interface PatternPlanSummary {
  activeCount: number;
  candidateCount: number;
  monitoringCount: number;
  totalTracked: number;
  /** Count of patterns with at least one evidence gap. */
  patternsWithGapsCount: number;
  /** Overall plan confidence given current evidence. */
  planConfidence: PatternEvidenceStrength;
}

export interface ApexRetailPatternPlanView {
  headline: string;
  contextLine: string;
  summary: PatternPlanSummary;
  patterns: AppliedPattern[];
  /** Top 3 patterns Sentinel recommends activating or closing in the next 30 days. */
  priorityPatterns: string[];  // patternIds in priority order
  /** Atlas guidance on the overall pattern plan for the client engagement. */
  atlasGuidance: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const APPLIED_PATTERNS: AppliedPattern[] = [
  {
    patternId: 'BAFO-GOVERNANCE-001',
    title: 'BAFO as governed evidence sequence',
    domain: 'sourcing',
    applicationStatus: 'active',
    evidenceStrength: 'partial',
    clientApplication:
      'AMS Vendor Consolidation 2026 is at Stage 7 BAFO with three finalists. ' +
      'The pattern is actively applying: Vendor A leads on TCO, Vendor B is blocked by SOC-2, ' +
      'Vendor C has scope validation outstanding. BAFO is being run as a bounded workflow with ' +
      'named reviewers and a selection committee target date of May 30 2026.',
    evidenceItems: [
      'Three BAFO submissions received',
      'Selection committee named and meeting scheduled',
      'BAFO due date and response deadlines recorded',
    ],
    evidenceGaps: [
      {
        gapId: 'bg-001-soc2',
        label: 'Vendor B SOC-2 attestation',
        needed: 'SOC-2 Type II report from Vendor B to complete full evaluation',
        source: 'Vendor B / InfoSec',
      },
      {
        gapId: 'bg-001-vc-scope',
        label: 'Vendor C scope validation',
        needed: 'Scope confirmation from Vendor C before BAFO close',
        source: 'Vendor C / Procurement Lead',
      },
    ],
    sentinelNextAction:
      'Escalate Vendor B SOC-2 blocker to procurement lead — resolution needed before May 2 to preserve BAFO timeline.',
  },
  {
    patternId: 'PROPOSAL-QUALITY-001',
    title: 'Proposal completeness as decision input',
    domain: 'sourcing',
    applicationStatus: 'active',
    evidenceStrength: 'partial',
    clientApplication:
      'Vendor B\'s SOC-2 gap and Vendor C\'s below-median pricing are active proposal ' +
      'completeness issues flagged in the sourcing surface. The pricing normalization tab ' +
      'shows Vendor B as not comparable (1 blocker) and Vendor C as not comparable (1 blocker). ' +
      'This pattern confirms that proceeding to selection before completeness gaps are closed ' +
      'increases decision risk.',
    evidenceItems: [
      'Pricing normalization drilldown identifies 2 comparability blockers',
      'Vendor A confirmed as partially comparable',
    ],
    evidenceGaps: [
      {
        gapId: 'pq-001-tier2',
        label: 'Vendor A tier-2 pricing clarification',
        needed: 'Itemised YR1 steady-state vs. transition cost split from Vendor A',
        source: 'Vendor A via BAFO clarification round',
      },
    ],
    sentinelNextAction:
      'Issue BAFO clarification to Vendor A requesting itemised transition cost before BAFO close.',
  },
  {
    patternId: 'TEN-STAGE-SOURCING-001',
    title: 'Ten-stage sourcing lifecycle governance',
    domain: 'sourcing',
    applicationStatus: 'active',
    evidenceStrength: 'strong',
    clientApplication:
      'The AMS event is correctly anchored at Stage 7 (BAFO) in the ten-stage sourcing lifecycle. ' +
      'Stage gate discipline is visible — the event has not advanced to Selection (Stage 8) despite ' +
      'pressure, because two completeness blockers remain unresolved. This is the pattern working as intended.',
    evidenceItems: [
      'AMS event correctly tagged at stage 7 (orals_bafo)',
      'Stage gate approval record present',
      'No premature advancement to Selection stage',
    ],
    evidenceGaps: [],
    sentinelNextAction: null,
  },
  {
    patternId: 'CDP-AMS-ARCH-001',
    title: 'AMS vendor selection constrains CDP architecture',
    domain: 'cdp',
    applicationStatus: 'active',
    evidenceStrength: 'partial',
    clientApplication:
      'APX-CDP-2026 is in P3 Design with gate pending. The CDP architecture will determine the ' +
      'integration requirements for the new AMS vendor. If the AMS vendor is selected before the ' +
      'CDP P3 Design gate clears, there is a risk of architecture incompatibility requiring rework. ' +
      'Sentinel has flagged this as a cross-programme dependency requiring a coordinated decision.',
    evidenceItems: [
      'APX-CDP-2026 linked to SRC-AMS-2026 as dependent programme',
      'CDP P3 Design gate pending',
      'AMS BAFO deadline approaching before CDP gate resolves',
    ],
    evidenceGaps: [
      {
        gapId: 'ca-001-gate',
        label: 'CDP P3 Design gate resolution',
        needed: 'CDP P3 Design gate must clear before AMS vendor can be selected without integration risk',
        source: 'CDP Programme Lead / architecture review',
      },
    ],
    sentinelNextAction:
      'Convene out-of-cycle CDP P3 Design gate review before May 5 to unblock AMS selection decision.',
  },
  {
    patternId: 'AI-VENDOR-LOCK-001',
    title: 'AI vendor lock-in risk in AMS contracts',
    domain: 'ai_programs',
    applicationStatus: 'candidate',
    evidenceStrength: 'weak',
    clientApplication:
      'The AMS contract will govern which vendor manages AI-enabled managed services including ' +
      'ServiceNow and adjacent AI tooling. There is a candidate risk that the selected vendor\'s ' +
      'AMS architecture will create lock-in for AI tool selection in the 3-5 year contract window. ' +
      'This pattern has not yet been formally applied to the AMS event but Sentinel recommends activation.',
    evidenceItems: [
      'AMS BAFO includes AI tooling scope (ServiceNow, adjacent)',
    ],
    evidenceGaps: [
      {
        gapId: 'av-001-scope',
        label: 'AI tool lock-in scope in AMS BAFO',
        needed: 'Explicit mapping of AI tooling commitment per vendor in BAFO submissions',
        source: 'Procurement Lead — BAFO review',
      },
      {
        gapId: 'av-001-exit-clause',
        label: 'AI tooling exit clause analysis',
        needed: 'Review of exit and substitution clauses for AI tools in draft contracts',
        source: 'Legal / Procurement Lead',
      },
    ],
    sentinelNextAction:
      'Activate AI vendor lock-in pattern for AMS — request AI tooling exit clause review from Legal before BAFO close.',
  },
  {
    patternId: 'TRANSITION-RISK-001',
    title: 'AMS transition risk — incumbent knowledge gap',
    domain: 'sourcing',
    applicationStatus: 'monitoring',
    evidenceStrength: 'weak',
    clientApplication:
      'Transition readiness signals are being monitored. Current state shows incumbent contract ' +
      'expiry alignment risk and incomplete knowledge transfer plans from the leading vendor. ' +
      'The pattern is in monitoring state — it will become active when vendor selection is executed ' +
      'and transition planning begins in earnest.',
    evidenceItems: [
      'Vendor A partial knowledge transfer plan (Phase 1 only) on file',
    ],
    evidenceGaps: [
      {
        gapId: 'tr-001-phase2-ktp',
        label: 'Phase 2/3 knowledge transfer milestones',
        needed: 'Complete KTP covering Phase 2 and Phase 3 operational areas from all finalist vendors',
        source: 'Vendors via BAFO clarification',
      },
      {
        gapId: 'tr-001-incumbent-expiry',
        label: 'Incumbent contract expiry date confirmed',
        needed: 'Exact incumbent contract end date to model transition window risk',
        source: 'Procurement / Contracts team',
      },
    ],
    sentinelNextAction:
      'Confirm incumbent contract expiry date and request Phase 2/3 KTP milestones from Vendor A BAFO.',
  },
];

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the Apex Retail client-specific pattern plan view.
 *
 * Deterministic: derives from fixture data only.
 * Always returns a non-null view.
 */
export function buildApexRetailPatternPlanView(): ApexRetailPatternPlanView {
  const activeCount = APPLIED_PATTERNS.filter((p) => p.applicationStatus === 'active').length;
  const candidateCount = APPLIED_PATTERNS.filter((p) => p.applicationStatus === 'candidate').length;
  const monitoringCount = APPLIED_PATTERNS.filter((p) => p.applicationStatus === 'monitoring').length;
  const patternsWithGapsCount = APPLIED_PATTERNS.filter((p) => p.evidenceGaps.length > 0).length;

  const summary: PatternPlanSummary = {
    activeCount,
    candidateCount,
    monitoringCount,
    totalTracked: APPLIED_PATTERNS.length,
    patternsWithGapsCount,
    planConfidence: 'partial',
  };

  return {
    headline: 'Apex Retail · Applied pattern plan',
    contextLine: `${APPLIED_PATTERNS.length} patterns tracked · ${activeCount} active · ${patternsWithGapsCount} with evidence gaps`,
    summary,
    patterns: APPLIED_PATTERNS,
    priorityPatterns: [
      'BAFO-GOVERNANCE-001',   // SOC-2 + scope validation blocking BAFO close
      'CDP-AMS-ARCH-001',      // CDP gate must clear before AMS selection
      'AI-VENDOR-LOCK-001',    // candidate — needs activation before BAFO close
    ],
    atlasGuidance:
      'The three highest-priority patterns are BAFO governance (SOC-2 and scope blockers), ' +
      'CDP-AMS architecture dependency (gate must clear before selection), and the AI vendor ' +
      'lock-in candidate pattern (needs activation before BAFO close or it will be unaddressed ' +
      'for the full contract term). Resolving all three before May 5 protects both the selection ' +
      'decision and the long-term architecture position.',
    honestDisclaimer:
      'Deterministic seed · Pattern application status reflects fixture context for SRC-AMS-2026 ' +
      'at Stage 7 BAFO and APX-CDP-2026 at P3 Design. Live pattern activation tracking, dynamic ' +
      'evidence gap detection, and cross-client benchmarking are deferred.',
    deterministicSeed: true,
  };
}
