/**
 * Unified instance resolver for the reasoning layer.
 *
 * Source events (typed `SourceEventInstance`) and programs (typed
 * `ProgramInstance`) live in separate fixture modules. The reasoning runtime
 * (gate evaluator, contradiction detector, synthesis context builder) doesn't
 * care which kind it has — it only needs to know the kind so the correct
 * builder can be invoked.
 *
 * This module provides a deterministic lookup keyed by instance id across both
 * catalogues, plus a flat list of all known instance ids grouped by kind.
 *
 * Pure helpers — no IO, no randomness, same input → same output.
 */

import type { SourceEventInstance } from '@/lib/source/source-event-instance';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

/** A resolved instance, tagged with its kind so callers can branch correctly. */
export type ResolvedInstance =
  | { kind: 'source'; instance: SourceEventInstance }
  | { kind: 'program'; instance: ProgramInstance };

/**
 * Resolve any instance — source event or program — by id. Returns `null` if
 * no instance with that id exists in either catalogue.
 */
export function resolveAnyInstance(id: string): ResolvedInstance | null {
  if (!id) return null;

  const source = SOURCE_EVENT_INSTANCES.find((s) => s.id === id);
  if (source !== undefined) return { kind: 'source', instance: source };

  const program = APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === id);
  if (program !== undefined) return { kind: 'program', instance: program };

  return null;
}

/**
 * Returns the full set of known instance ids partitioned by kind. Useful for
 * rendering an instance picker in the comparison UI.
 */
export function getAllInstanceIds(): {
  sourceEvents: string[];
  programs: string[];
} {
  return {
    sourceEvents: SOURCE_EVENT_INSTANCES.map((s) => s.id),
    programs: APEX_RETAIL_PROGRAM_INSTANCES.map((p) => p.id),
  };
}
