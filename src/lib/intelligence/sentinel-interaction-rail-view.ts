// I8 · Sentinel Interaction Rail view model.
//
// Pure deterministic read model that powers the Sentinel Interaction
// Rail surface on intelligence pages. The rail answers "what is
// Sentinel actually surfacing right now, with what confidence, and what
// would it want me to do next?" with structured seed entries — never
// live runtime, never live retrieval, never a model call.
//
// Layered above (read-only):
//   - the canonical Sentinel pattern key tuple (I1) only as a string
//     vocabulary; this module does not import the I1 detection runtime
//
// No Date.now reads. No Math.random. No new Date. No fetch. No
// anthropic / openai. Same input → identical view object.
//
// This module does NOT import:
//   - src/lib/sentinel/**, src/lib/atlas/**, src/lib/nexus/**,
//     src/lib/agent/**
//   - src/components/agent/**
//   - src/lib/source/**, src/app/(maestro)/source/**
//   - src/app/programs/**, src/app/(maestro)/preview/**, src/app/demo/**
//   - src/lib/programs/mock.ts
//   - src/lib/auth/**, supabase/**
//   - any model SDK (anthropic / openai)

// ---------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------

export type SentinelInteractionSignalSeverity =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type SentinelInteractionConfidenceLabel = 'low' | 'medium' | 'high';

export interface SentinelInteractionRecentSignal {
  id: string;
  label: string;
  severity: SentinelInteractionSignalSeverity;
  /**
   * One-line summary of what Sentinel observed. Honest framing only —
   * no fabricated numbers, no fabricated citations.
   */
  summary: string;
}

export interface SentinelInteractionActivePattern {
  id: string;
  patternKey: string;
  patternName: string;
  /**
   * One-line framing of what makes this pattern active right now.
   */
  whyActive: string;
}

export interface SentinelInteractionEvidenceConfidence {
  label: SentinelInteractionConfidenceLabel;
  /**
   * One-line basis for the label. Names what would lift the label
   * (recurrence, retrieval, persisted citations, etc.).
   */
  basis: string;
}

export interface SentinelInteractionRecommendedAction {
  id: string;
  label: string;
  /**
   * One-line reason the action is recommended today.
   */
  reason: string;
  /**
   * Whether the action is wired today. False until a live Sentinel
   * runtime / handoff subscriber lands.
   */
  enabled: false;
}

export interface SentinelInteractionRailInput {
  /** Tenant display name; used in framing only. */
  tenantDisplayName: string;
  /**
   * Optional anchor pattern. If supplied, the view frames active
   * patterns and recommended actions around it; otherwise the view
   * carries a portfolio-wide framing.
   */
  anchorPatternKey?: string;
  anchorPatternName?: string;
  /**
   * Number of programs Sentinel is currently observing in the tenant
   * portfolio. Used in honest framing only — no derived dollar amount.
   */
  observedProgramCount: number;
}

export interface SentinelInteractionRailView {
  tenantDisplayName: string;
  anchorPatternKey: string | null;
  anchorPatternName: string | null;
  /** Eyebrow shown above the rail header. */
  eyebrow: 'SENTINEL · INTELLIGENCE RAIL';
  /** Rail header line. */
  title: string;
  /** Recent Sentinel signal list (deterministic, capped at 3). */
  recentSignals: readonly SentinelInteractionRecentSignal[];
  /** Active pattern list (deterministic, capped at 3). */
  activePatterns: readonly SentinelInteractionActivePattern[];
  /** Single confidence read across the rail surface. */
  evidenceConfidence: SentinelInteractionEvidenceConfidence;
  /** Recommended actions list (deterministic, capped at 3). */
  recommendedActions: readonly SentinelInteractionRecommendedAction[];
  /**
   * Honest single-sentence disclaimer rendered as the rail footer
   * caption.
   */
  disclaimer: string;
  /** Marker so consumers know this is not a live runtime output. */
  createdFrom: 'deterministic_sentinel_interaction_rail_seed';
}

// ---------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------

/**
 * Build the deterministic Sentinel Interaction Rail view from an
 * input. Pure: same input → identical view object across calls.
 */
export function buildSentinelInteractionRailView(
  input: SentinelInteractionRailInput,
): SentinelInteractionRailView {
  const tenantDisplayName = input.tenantDisplayName;
  const anchorPatternKey = input.anchorPatternKey ?? null;
  const anchorPatternName = input.anchorPatternName ?? null;
  const observed = Math.max(0, Math.trunc(input.observedProgramCount));

  return {
    tenantDisplayName,
    anchorPatternKey,
    anchorPatternName,
    eyebrow: 'SENTINEL · INTELLIGENCE RAIL',
    title: composeTitle(tenantDisplayName, anchorPatternName),
    recentSignals: composeRecentSignals(anchorPatternName, observed),
    activePatterns: composeActivePatterns(
      anchorPatternKey,
      anchorPatternName,
    ),
    evidenceConfidence: composeEvidenceConfidence(observed),
    recommendedActions: composeRecommendedActions(
      tenantDisplayName,
      anchorPatternName,
    ),
    disclaimer: composeDisclaimer(),
    createdFrom: 'deterministic_sentinel_interaction_rail_seed',
  };
}

// ---------------------------------------------------------------------
// Internal composition helpers
// ---------------------------------------------------------------------

function composeTitle(
  tenantDisplayName: string,
  anchorPatternName: string | null,
): string {
  if (anchorPatternName) {
    return `${tenantDisplayName} · Sentinel rail · ${anchorPatternName}`;
  }
  return `${tenantDisplayName} · Sentinel rail`;
}

function composeRecentSignals(
  anchorPatternName: string | null,
  observed: number,
): readonly SentinelInteractionRecentSignal[] {
  const programWord = observed === 1 ? 'program' : 'programs';
  const anchorClause = anchorPatternName
    ? ` against ${anchorPatternName.toLowerCase()}`
    : '';
  return [
    {
      id: 'sentinel-rail-signal-evidence-readiness',
      label: 'Evidence readiness',
      severity: 'medium',
      summary: `Evidence readiness is partial across ${observed} ${programWord}${anchorClause} — citations are not yet wired in this surface.`,
    },
    {
      id: 'sentinel-rail-signal-gate-coverage',
      label: 'Gate coverage',
      severity: 'medium',
      summary:
        'Gate coverage is partial; missing inputs are surfaced on the gate detail rather than fabricated here.',
    },
    {
      id: 'sentinel-rail-signal-recurrence',
      label: 'Recurrence tracking',
      severity: 'low',
      summary:
        'Sentinel persistence is deferred; recurrence is not yet measured from steering touchpoints.',
    },
  ] as const;
}

function composeActivePatterns(
  anchorPatternKey: string | null,
  anchorPatternName: string | null,
): readonly SentinelInteractionActivePattern[] {
  if (anchorPatternKey && anchorPatternName) {
    return [
      {
        id: 'sentinel-rail-pattern-anchor',
        patternKey: anchorPatternKey,
        patternName: anchorPatternName,
        whyActive:
          'This is the anchor pattern for the current intelligence surface; the rail frames signals and actions around it.',
      },
    ] as const;
  }
  return [
    {
      id: 'sentinel-rail-pattern-portfolio-context',
      patternKey: 'portfolio_context',
      patternName: 'Portfolio context',
      whyActive:
        'No anchor pattern is selected; the rail frames a portfolio-wide read until the surface narrows to a specific pattern.',
    },
  ] as const;
}

function composeEvidenceConfidence(
  observed: number,
): SentinelInteractionEvidenceConfidence {
  if (observed >= 3) {
    return {
      label: 'medium',
      basis: `Cross-program scope (${observed} programs) supports a medium read; live Sentinel persistence would lift this with recurrence history.`,
    };
  }
  if (observed >= 1) {
    return {
      label: 'low',
      basis: `${observed} program(s) observed; live Sentinel runtime would refine this with retrieval-backed evidence.`,
    };
  }
  return {
    label: 'low',
    basis:
      'No programs observed yet; the rail confidence is seed-only until a live runtime contributes.',
  };
}

function composeRecommendedActions(
  tenantDisplayName: string,
  anchorPatternName: string | null,
): readonly SentinelInteractionRecommendedAction[] {
  const anchorClause = anchorPatternName
    ? ` on ${anchorPatternName.toLowerCase()}`
    : '';
  return [
    {
      id: 'sentinel-rail-action-walk-evidence',
      label: 'Walk the evidence trail',
      reason: `Open the evidence trail${anchorClause} to inspect sourced rows and missing citations.`,
      enabled: false,
    },
    {
      id: 'sentinel-rail-action-handoff-atlas',
      label: 'Hand off to Atlas',
      reason: `Atlas can compose an executive editorial naming the Sentinel read for ${tenantDisplayName}.`,
      enabled: false,
    },
    {
      id: 'sentinel-rail-action-handoff-steward',
      label: 'Hand off to Steward',
      reason:
        'Steward can clear blocking inputs program by program and capture structured decisions.',
      enabled: false,
    },
  ] as const;
}

function composeDisclaimer(): string {
  return 'Source · deterministic Sentinel interaction rail seed · no live runtime, no live retrieval, no model invocation.';
}
