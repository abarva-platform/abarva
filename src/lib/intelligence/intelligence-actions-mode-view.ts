/**
 * W32B — Intelligence Actions Mode View Model
 *
 * Pure TypeScript read-model for the Intelligence "Actions" mode tab.
 * This view provides a priority-ordered list of recommended actions derived
 * from Sentinel's pattern detections, for the current tenant context.
 *
 * No React. No network calls. No model calls. Deterministic seed output only.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionPriority = 'immediate' | 'this_week' | 'this_month' | 'deferred';
export type ActionAgent = 'sentinel' | 'nexus' | 'steward' | 'atlas';

export interface IntelligenceAction {
  id: string;
  title: string;
  description: string;
  priority: ActionPriority;
  agent: ActionAgent;
  affectedSurface: string;
  evidenceBasis: string;
  blockedBy: string | null;
  deterministicSeed: true;
}

export interface IntelligenceActionsMode {
  mode: 'actions';
  actions: IntelligenceAction[];
  lowContextDisclosure: string | null;
  deterministicSeed: true;
  caveat: string;
}

// ---------------------------------------------------------------------------
// Apex Retail seed actions — priority-ordered
// ---------------------------------------------------------------------------

const APEX_RETAIL_ACTIONS: IntelligenceAction[] = [
  {
    id: 'ACT-APX-001',
    title: 'Resolve vendor assumption divergence before BAFO',
    description:
      'Workshop 4 commitments diverge from current connector stubs on 2 of 4 data-sharing ' +
      'obligations. Reconcile with vendors before issuing the BAFO pack to avoid contractual ' +
      'risk at the AMS outsourcing evaluation stage.',
    priority: 'immediate',
    agent: 'sentinel',
    affectedSurface: 'AMS Outsourcing Programme (APX-AMS-2026)',
    evidenceBasis:
      'Sentinel pattern: PAT-VENDOR-ASSUMPTION-DIVERGENCE — Workshop 4 notes vs connector readiness stub.',
    blockedBy: null,
    deterministicSeed: true,
  },
  {
    id: 'ACT-APX-002',
    title: 'Close BAFO readiness gap — 2 vendors pending',
    description:
      'Two AMS vendors have not submitted complete BAFO responses. Issue a clarification notice ' +
      'with deadline and escalate unresolved SLA governance terms to procurement leadership.',
    priority: 'immediate',
    agent: 'nexus',
    affectedSurface: 'AMS Outsourcing Programme (APX-AMS-2026)',
    evidenceBasis:
      'Sentinel pattern: PAT-BAFO-READINESS-GAP — BAFO tracking document, SLA exception log.',
    blockedBy: null,
    deterministicSeed: true,
  },
  {
    id: 'ACT-APX-003',
    title: 'Upload CDP evidence to close evidence gap',
    description:
      'CDP activation is blocked by missing data-sharing consent framework evidence. ' +
      'Upload the consent framework documentation to the evidence fabric to unblock ' +
      'the G3 hard gate review.',
    priority: 'this_week',
    agent: 'steward',
    affectedSurface: 'Customer Data Platform Programme (APX-CDP-2026)',
    evidenceBasis:
      'Sentinel pattern: PAT-EVIDENCE-GAP-CDP — Phase 5 gate G3 requires consent framework evidence.',
    blockedBy:
      'Evidence upload connector not yet wired — manual upload required via Admin evidence intake.',
    deterministicSeed: true,
  },
  {
    id: 'ACT-APX-004',
    title: 'Finalise Contact Center AI evaluation criteria',
    description:
      'Workshop 3 evaluation matrix is incomplete — 3 of 7 criteria lack supporting evidence. ' +
      'Schedule a criteria alignment session with the evaluation team before moving to vendor scoring.',
    priority: 'this_week',
    agent: 'nexus',
    affectedSurface: 'Contact Center AI Programme (APX-CAI-2026)',
    evidenceBasis:
      'Sentinel pattern: PAT-DESIGN-CRITERIA-GAP — Workshop 3 notes, evaluation matrix stub.',
    blockedBy: null,
    deterministicSeed: true,
  },
  {
    id: 'ACT-APX-005',
    title: 'Establish CDP value baseline before Phase 5 gate',
    description:
      'G3 gate requires a confirmed value baseline for the CDP programme. ' +
      'Work with the programme sponsor to define the measurement framework and ' +
      'document the baseline in the evidence fabric.',
    priority: 'this_month',
    agent: 'atlas',
    affectedSurface: 'Customer Data Platform Programme (APX-CDP-2026)',
    evidenceBasis:
      'Control Tower scorecard: value-baseline blocked — deterministic Wave 2 seed.',
    blockedBy: 'G3 gate pending — cannot establish baseline until consent framework is uploaded.',
    deterministicSeed: true,
  },
];

// ---------------------------------------------------------------------------
// Meridian (thin tenant) actions
// ---------------------------------------------------------------------------

const MERIDIAN_ACTIONS: IntelligenceAction[] = [
  {
    id: 'ACT-MER-001',
    title: 'Upload evidence to enable pattern detection',
    description:
      'This tenant has a limited evidence base. Upload programme documentation, ' +
      'vendor responses, and workshop notes to enable Sentinel to detect patterns ' +
      'with higher confidence.',
    priority: 'this_week',
    agent: 'steward',
    affectedSurface: 'All Meridian programmes',
    evidenceBasis:
      'Sentinel: low-context signal — evidence base insufficient for high-confidence detection.',
    blockedBy: null,
    deterministicSeed: true,
  },
];

const LOW_CONTEXT_DISCLOSURE_MERIDIAN =
  'Recommended actions are limited because this tenant has a thin evidence base. ' +
  'Upload more evidence to enable Sentinel to generate programme-specific action recommendations.';

const DETERMINISTIC_CAVEAT =
  'Recommended actions are deterministic seed data derived from Sentinel pattern detections. ' +
  'Priority ordering and action descriptions will update when live evidence ingestion is wired.';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Builds the Intelligence Actions Mode view for the given tenant.
 */
export function buildIntelligenceActionsModeView(
  tenantSlug: string,
): IntelligenceActionsMode {
  if (tenantSlug === 'apex-retail') {
    return {
      mode: 'actions',
      actions: APEX_RETAIL_ACTIONS,
      lowContextDisclosure: null,
      deterministicSeed: true,
      caveat: DETERMINISTIC_CAVEAT,
    };
  }

  if (tenantSlug === 'meridian') {
    return {
      mode: 'actions',
      actions: MERIDIAN_ACTIONS,
      lowContextDisclosure: LOW_CONTEXT_DISCLOSURE_MERIDIAN,
      deterministicSeed: true,
      caveat: DETERMINISTIC_CAVEAT,
    };
  }

  // Unknown / shell tenant
  return {
    mode: 'actions',
    actions: [],
    lowContextDisclosure:
      'No intelligence actions are available for this tenant. ' +
      'Upload evidence to enable Sentinel to generate action recommendations.',
    deterministicSeed: true,
    caveat: DETERMINISTIC_CAVEAT,
  };
}
