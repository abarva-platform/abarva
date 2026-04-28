/**
 * Pattern card helpers — pure summarisation utilities for the pattern index
 * page card view. Deterministic: no IO, no randomness.
 *
 * Used by `src/app/(maestro)/source/patterns/page.tsx`.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

/** Coarse domain bucket derived from the lifecycle `patternId` prefix. */
export type LifecyclePatternDomain = 'source-event' | 'program' | 'unknown';

/** Card-shaped summary of a lifecycle pattern. */
export interface PatternCardSummary {
  patternId: string;
  title: string;
  domain: LifecyclePatternDomain;
  tier: string;
  stageCount: number;
  gateCriteriaCount: number;
  expectedArtifactCount: number;
  applicabilitySummary: string;
  durationLabel: string;
  href: string;
}

/**
 * Derive the coarse domain bucket from a lifecycle `patternId`. Source-event
 * patterns prefix `PAT-SRC-*`; program patterns prefix `PAT-PRG-*`. Anything
 * else is `unknown` (defensive — should not happen for catalogued patterns).
 */
export function deriveLifecyclePatternDomain(
  patternId: string,
): LifecyclePatternDomain {
  if (patternId.startsWith('PAT-SRC-')) return 'source-event';
  if (patternId.startsWith('PAT-PRG-')) return 'program';
  return 'unknown';
}

/**
 * Truncate an applicability blurb to at most 140 characters, appending an
 * ellipsis when truncation occurred. Returns the input unchanged if it is
 * already short enough or empty.
 */
export function truncateApplicability(
  applicability: string,
  maxChars = 140,
): string {
  const trimmed = (applicability ?? '').trim();
  if (trimmed.length <= maxChars) return trimmed;
  return `${trimmed.slice(0, maxChars - 1).trimEnd()}…`;
}

/** Format a `{min, max}` day range as `"{min}–{max} days"` (en-dash). */
export function formatDurationLabel(range: {
  min: number;
  max: number;
}): string {
  return `${range.min}–${range.max} days`;
}

/**
 * Summarise a lifecycle pattern into the shape consumed by the index card.
 * Pure: no formatting beyond the helpers above; no IO.
 */
export function summarizePatternForCard(
  pattern: LifecyclePatternSeed,
): PatternCardSummary {
  return {
    patternId: pattern.patternId,
    title: pattern.title,
    domain: deriveLifecyclePatternDomain(pattern.patternId),
    tier: pattern.tier,
    stageCount: pattern.stages.length,
    gateCriteriaCount: pattern.gateCriteria.length,
    expectedArtifactCount: pattern.expectedArtifacts.length,
    applicabilitySummary: truncateApplicability(pattern.applicability),
    durationLabel: formatDurationLabel(pattern.typicalDurationDays),
    href: `/source/patterns/${pattern.patternId}`,
  };
}
