/**
 * Lifecycle pattern lookup — resolves a pattern ID to its
 * `LifecyclePatternSeed` from the union of source-event and program lifecycle
 * pattern catalogues.
 *
 * Pure helper extracted for reuse by the pattern detail page and the doctrine
 * link chip. Deterministic — no IO, no side effects.
 */

import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';

/** Returns the merged catalogue of lifecycle patterns (source + program). */
export function getAllLifecyclePatterns(): LifecyclePatternSeed[] {
  return [...SOURCE_LIFECYCLE_PATTERNS, ...PROGRAM_LIFECYCLE_PATTERNS];
}

/**
 * Look up a lifecycle pattern by ID. Returns `undefined` if no pattern with
 * that ID exists in either catalogue. Matches both the `id` and `patternId`
 * fields (which are equal in practice for lifecycle patterns).
 */
export function findLifecyclePattern(id: string): LifecyclePatternSeed | undefined {
  if (!id) return undefined;
  const all = getAllLifecyclePatterns();
  return all.find((p) => p.id === id || p.patternId === id);
}

/** Returns true when the given ID resolves to a known lifecycle pattern. */
export function isLifecyclePatternId(id: string): boolean {
  return findLifecyclePattern(id) !== undefined;
}

/** Returns the list of all known lifecycle pattern IDs. */
export function getAllLifecyclePatternIds(): string[] {
  return getAllLifecyclePatterns().map((p) => p.patternId);
}
