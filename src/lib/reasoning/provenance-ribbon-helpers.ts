/**
 * Provenance ribbon helpers — REASON-27
 *
 * Pure formatting helpers that derive the ribbon's display fields from a
 * SynthesisContext. Kept separate from the component so they can be tested
 * deterministically without React.
 */

import type { CitationPointer, SynthesisContext } from '@/lib/reasoning/types';
import { SOURCING_PATTERNS } from '@/lib/intelligence/seed-patterns-sourcing';
import {
  PAT_SRC_AMS_001,
  PAT_SRC_RFP_001,
} from '@/lib/intelligence/source-lifecycle-patterns';
import type { PatternSeed } from '@/lib/intelligence/seed-types';

const PROVENANCE_PATTERN_INDEX: ReadonlyMap<string, PatternSeed> = (() => {
  const map = new Map<string, PatternSeed>();
  for (const pattern of SOURCING_PATTERNS) {
    map.set(pattern.id, pattern);
  }
  // Lifecycle patterns expose `patternId` (not `id`) for runtime gate logic.
  // Index them by both, so citation refs can resolve under either key.
  for (const lifecycle of [PAT_SRC_AMS_001, PAT_SRC_RFP_001]) {
    map.set(lifecycle.id, lifecycle);
    map.set(lifecycle.patternId, lifecycle);
  }
  return map;
})();

export interface CitedPattern {
  /** Stable id used in the citation ref. */
  patternId: string;
  /** Human-readable pattern title; falls back to patternId when unknown. */
  title: string;
  /** First section label that cited this pattern (for tooltip / a11y). */
  section: string;
}

/**
 * Deduplicate citations by their patternId, preserving original order, and
 * resolve each to a display title via the seed pattern catalog. Limit caps
 * the number returned to keep the ribbon visually compact.
 */
export function formatCitations(
  citations: readonly CitationPointer[],
  limit = 4,
): CitedPattern[] {
  const seen = new Set<string>();
  const out: CitedPattern[] = [];

  for (const citation of citations) {
    const id = citation.ref.patternId;
    if (seen.has(id)) continue;
    seen.add(id);

    const pattern = PROVENANCE_PATTERN_INDEX.get(id);
    out.push({
      patternId: id,
      title: pattern?.title ?? id,
      section: citation.ref.section,
    });

    if (out.length >= limit) break;
  }

  return out;
}

export interface GateSummaryView {
  total: number;
  cleared: number;
  pending: number;
  /** Whether any hard gate is currently blocking advancement. */
  hasBlocker: boolean;
}

/**
 * Compress the SynthesisContext.gatesSummary into a simple cleared/pending
 * view used by the ribbon. Cleared = met or waived. Pending = unmet.
 */
export function summarizeGates(
  gatesSummary: SynthesisContext['gatesSummary'],
): GateSummaryView {
  const total = gatesSummary.total;
  const cleared = gatesSummary.met;
  const pending = Math.max(0, total - cleared);
  const hasBlocker = gatesSummary.blocked.length > 0;
  return { total, cleared, pending, hasBlocker };
}

export interface BlockerSummaryView {
  /** Number of unmet hard gates plus any explicit blocker entries. */
  count: number;
  /** Severity tier for UI dot color. */
  severity: 'none' | 'amber' | 'red';
  /** Short label for the most urgent blocker, if any. */
  topLabel: string | null;
}

/**
 * Summarize blocker state from a SynthesisContext. Treats any unmet hard gate
 * (`gatesSummary.blocked`) as a blocker. `red` when count >= 2 or any blocker
 * has severity-equivalent semantics; `amber` when exactly one blocker is open;
 * `none` otherwise. Pure: deterministic over its inputs.
 */
export function summarizeBlockers(
  context: Pick<SynthesisContext, 'gatesSummary'>,
): BlockerSummaryView {
  const blocked = context.gatesSummary.blocked;
  const count = blocked.length;
  if (count === 0) {
    return { count: 0, severity: 'none', topLabel: null };
  }
  const severity: 'amber' | 'red' = count >= 2 ? 'red' : 'amber';
  const topLabel = blocked[0]?.description ?? blocked[0]?.criterionId ?? null;
  return { count, severity, topLabel };
}

export interface CascadeSummaryView {
  /** Total cascade impacts (linked instances/events) recorded in the context. */
  count: number;
  /** Whether any of those cascade impacts are blocking. */
  hasBlockingImpact: boolean;
}

/**
 * Summarize cascade context for the ribbon's "Linked: N events" chip.
 * A cascade entry with severity `'blocking'` toggles `hasBlockingImpact`.
 */
export function summarizeCascade(
  context: Pick<SynthesisContext, 'cascadeContext'>,
): CascadeSummaryView {
  const cascades = context.cascadeContext;
  const count = cascades.length;
  const hasBlockingImpact = cascades.some((c) => c.severity === 'blocking');
  return { count, hasBlockingImpact };
}

export interface PortfolioSummaryView {
  /** Number of program instances aggregated by the Tower context. */
  programCount: number;
  /** Number of source-event instances aggregated by the Tower context. */
  sourceEventCount: number;
  /** Total instances (programs + source events). */
  totalInstanceCount: number;
  /** Single-line headline used by the Tower ribbon's "Portfolio" chip. */
  headline: string;
}

/**
 * Summarize the portfolio shape captured in `context.instanceSnapshot` for the
 * Tower ribbon. The snapshot is typed as `Record<string, unknown>` so this
 * helper reads it defensively — missing or non-numeric fields fall back to
 * zero. Pure: deterministic over its inputs.
 *
 * Used only by the Tower (portfolio-level) ribbon. Per-instance ribbons can
 * ignore this helper.
 */
export function summarizePortfolio(
  context: Pick<SynthesisContext, 'instanceSnapshot'>,
): PortfolioSummaryView {
  const snap = context.instanceSnapshot ?? {};
  const programCount = readNonNegativeInt(snap, 'programCount');
  const sourceEventCount = readNonNegativeInt(snap, 'sourceEventCount');
  const totalInstanceCount =
    readNonNegativeInt(snap, 'totalInstanceCount') || programCount + sourceEventCount;

  const programLabel = `${programCount} program${programCount === 1 ? '' : 's'}`;
  const sourceLabel = `${sourceEventCount} source event${sourceEventCount === 1 ? '' : 's'}`;
  const headline = `${programLabel} · ${sourceLabel}`;

  return { programCount, sourceEventCount, totalInstanceCount, headline };
}

function readNonNegativeInt(snap: Record<string, unknown>, key: string): number {
  const v = snap[key];
  if (typeof v !== 'number' || !Number.isFinite(v) || v < 0) return 0;
  return Math.floor(v);
}
