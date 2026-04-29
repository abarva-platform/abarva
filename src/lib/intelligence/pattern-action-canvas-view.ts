// pattern-action-canvas-view.ts — INT2
//
// Deterministic view model for the Pattern Detail Action Canvas.
// Returns context-aware actions for a given pattern in the Apex Retail engagement.
//
// The action canvas answers: "Given THIS pattern is active (or a candidate),
// what should happen next — specifically, who does what, by when?"
//
// Rendered as a section within IntelligencePatternDetailPage.
//
// Deterministic: no live clocks, no randomness, no network IO.
// Does NOT import from src/lib/source/**, src/lib/programs/mock,
// src/lib/auth/**, or supabase.

// ─── Output types ─────────────────────────────────────────────────────────────

export type ActionPriority = 'immediate' | 'this_week' | 'this_month' | 'backlog';

export type ActionStatus = 'open' | 'in_progress' | 'blocked' | 'done';

export interface PatternAction {
  actionId: string;
  title: string;
  description: string;
  priority: ActionPriority;
  status: ActionStatus;
  owner: string;
  /** ISO date string or human-readable deadline. */
  deadline: string;
  /** What's blocking this action (if status === 'blocked'). */
  blockerNote: string | null;
  /** Cross-surface link text (e.g., links to Source tab or Programs page). */
  contextLink: string | null;
}

export interface PatternActionCanvasView {
  patternId: string;
  patternName: string;
  /** Whether this pattern has context-specific actions for the current engagement. */
  hasActions: boolean;
  actions: PatternAction[];
  /** Short Atlas synthesis of what the action set achieves. */
  atlasSynthesis: string;
  honestDisclaimer: string;
  deterministicSeed: true;
}

// ─── Fixture data ──────────────────────────────────────────────────────────────

const ACTION_REGISTRY: Record<string, PatternAction[]> = {
  'T3-H01': [
    {
      actionId: 'ah01-a1',
      title: 'Define outcome capture mechanism for Store Assoc Productivity program',
      description:
        'The Ambient AI in Retail pattern requires a defined feedback loop — what outcome is being measured, at what cadence, and how is model drift detected. APX-SA-2026 (Store Associate Productivity) is in Synthesis and must specify this before the Nexus gate can approve.',
      priority: 'this_week',
      status: 'open',
      owner: 'Program Lead — APX-SA-2026',
      deadline: 'May 7 2026',
      blockerNote: null,
      contextLink: 'Programs · APX-SA-2026 · Phase 2 Synthesis gate criteria',
    },
    {
      actionId: 'ah01-a2',
      title: 'Confirm latency budget for in-aisle inference decisions',
      description:
        'Pattern requires inference latency to be specified for the target decision (in-aisle markdown decision). Current program spec says "real-time" without a bound. Nexus will flag this as ambiguous at the P2 gate review.',
      priority: 'this_month',
      status: 'open',
      owner: 'Technical Lead — APX-SA-2026',
      deadline: 'May 15 2026',
      blockerNote: null,
      contextLink: null,
    },
    {
      actionId: 'ah01-a3',
      title: 'Document rollback path for ambient inference model drift',
      description:
        'Pattern anti-pattern check: rollback path must be defined before deployment. If the model drifts, associates must be able to revert to manual decision-making. This should be a P3 Build gate criterion.',
      priority: 'backlog',
      status: 'open',
      owner: 'Program Lead — APX-SA-2026',
      deadline: 'P3 Build gate',
      blockerNote: null,
      contextLink: null,
    },
  ],

  'T3-H03': [
    {
      actionId: 'h03-a1',
      title: 'Validate loyalty data quality baseline before CDP P3 Design gate',
      description:
        'Unified Loyalty Intelligence requires a data quality baseline for the loyalty event stream. APX-CDP-2026 is at P3 Design with gate pending. Loyalty data quality baseline should be a gate criterion to unblock the pattern from in-review to validated.',
      priority: 'immediate',
      status: 'blocked',
      owner: 'CDP Programme Lead / Data Engineering',
      deadline: 'Before CDP P3 Design gate (May 5 2026)',
      blockerNote: 'APX-CDP-2026 P3 Design gate pending — loyalty data quality work unblocked only after gate clears',
      contextLink: 'Programs · APX-CDP-2026 · P3 Design gate criteria',
    },
    {
      actionId: 'h03-a2',
      title: 'Map AMS vendor CDP integration requirements for Unified Loyalty',
      description:
        'The selected AMS vendor will need to integrate with the CDP platform to support the Unified Loyalty Intelligence pattern. This integration requirement should be a BAFO evaluation criterion before AMS vendor selection.',
      priority: 'immediate',
      status: 'open',
      owner: 'Procurement Lead / CDP Programme Lead',
      deadline: 'Before AMS BAFO close (May 5 2026)',
      blockerNote: null,
      contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Vendor C scope validation',
    },
    {
      actionId: 'h03-a3',
      title: 'Add Unified Loyalty Intelligence to P3 Design pattern evidence',
      description:
        'The pattern is in-review with 2 programs. Adding it formally to the P3 Design evidence base would strengthen the case for advancing the pattern to validated status.',
      priority: 'this_month',
      status: 'open',
      owner: 'Intelligence Lead / CDP Programme Lead',
      deadline: 'May 31 2026',
      blockerNote: null,
      contextLink: null,
    },
  ],

  'T1-F02': [
    {
      actionId: 'f02-a1',
      title: 'Anchor AI Governance Baseline to AMS contract terms',
      description:
        'The AMS vendor contract is the first AI-adjacent contract in scope. The AI Governance Baseline pattern (candidate) should be validated against the AMS contract governance clause before the pattern can advance to in-review. This is the natural first application.',
      priority: 'this_week',
      status: 'open',
      owner: 'Legal / AI Governance Lead',
      deadline: 'Before AMS BAFO close (May 5 2026)',
      blockerNote: null,
      contextLink: 'Source · SRC-AMS-2026 · BAFO tab · Contract terms',
    },
    {
      actionId: 'f02-a2',
      title: 'Define AI governance review cadence for Apex Retail AI programmes',
      description:
        'Pattern candidate requires a defined governance review cadence as its first evidence item. With 4 active AI programmes (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting), a quarterly governance review cadence should be proposed.',
      priority: 'this_month',
      status: 'open',
      owner: 'Chief AI Officer / Programme Governance Lead',
      deadline: 'May 31 2026',
      blockerNote: null,
      contextLink: null,
    },
  ],
};

const SYNTHESIS_REGISTRY: Record<string, string> = {
  'T3-H01':
    'The Ambient AI in Retail pattern is validated and active across 4 programs. ' +
    'The critical gap is the outcome capture mechanism for Store Associate Productivity — ' +
    'defining this before the P2 gate is the highest-priority action to prevent a gate hold.',

  'T3-H03':
    'Unified Loyalty Intelligence is in-review and blocked on CDP P3 Design gate. ' +
    'The AMS vendor integration requirement is the most time-sensitive action — ' +
    'it must be evaluated before BAFO close or it will be locked out of the AMS contract scope.',

  'T1-F02':
    'AI Governance Baseline is a candidate pattern with no current program anchoring. ' +
    'The AMS contract is the natural first application — anchoring governance terms there ' +
    'advances the pattern toward in-review and creates a reusable precedent for all 4 AI programs.',
};

// ─── Main builder ──────────────────────────────────────────────────────────────

/**
 * Build the action canvas view for a given pattern ID.
 *
 * Returns actions for known patterns. Returns a no-actions view for unknown
 * pattern IDs (e.g., deprecated patterns or patterns without Apex Retail context).
 *
 * Deterministic: derives from fixture data only.
 */
export function buildPatternActionCanvasView(
  patternId: string,
  patternName: string,
): PatternActionCanvasView {
  const actions = ACTION_REGISTRY[patternId] ?? [];
  const hasActions = actions.length > 0;
  const atlasSynthesis = SYNTHESIS_REGISTRY[patternId] ?? '';

  return {
    patternId,
    patternName,
    hasActions,
    actions,
    atlasSynthesis,
    honestDisclaimer:
      'Deterministic seed · Action canvas reflects fixture context for the Apex Retail engagement. ' +
      'Live action tracking, assignment, and deadline management are deferred to the ' +
      'programme action management module.',
    deterministicSeed: true,
  };
}
