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
 *
 * Pass `options.tenantId` to scope the lookup to a single tenant. When set,
 * an instance whose `tenantId` does not match is treated as if it did not
 * exist (returns `null`). When omitted, lookup is global and back-compat
 * with the original signature.
 */
export function resolveAnyInstance(
  id: string,
  options?: { tenantId?: string },
): ResolvedInstance | null {
  if (!id) return null;
  const tenantFilter = options?.tenantId;

  const source = SOURCE_EVENT_INSTANCES.find((s) => s.id === id);
  if (source !== undefined) {
    if (tenantFilter !== undefined && source.tenantId !== tenantFilter) {
      return null;
    }
    return { kind: 'source', instance: source };
  }

  const program = APEX_RETAIL_PROGRAM_INSTANCES.find((p) => p.id === id);
  if (program !== undefined) {
    if (tenantFilter !== undefined && program.tenantId !== tenantFilter) {
      return null;
    }
    return { kind: 'program', instance: program };
  }

  return null;
}

/**
 * Returns the full set of known instance ids partitioned by kind. Useful for
 * rendering an instance picker in the comparison UI.
 *
 * Pass `options.tenantId` to filter the result to a single tenant. When
 * omitted, every known id is returned (back-compat for existing callers).
 */
export function getAllInstanceIds(
  options?: { tenantId?: string },
): {
  sourceEvents: string[];
  programs: string[];
} {
  const tenantFilter = options?.tenantId;
  const sources =
    tenantFilter === undefined
      ? SOURCE_EVENT_INSTANCES
      : SOURCE_EVENT_INSTANCES.filter((s) => s.tenantId === tenantFilter);
  const programs =
    tenantFilter === undefined
      ? APEX_RETAIL_PROGRAM_INSTANCES
      : APEX_RETAIL_PROGRAM_INSTANCES.filter((p) => p.tenantId === tenantFilter);
  return {
    sourceEvents: sources.map((s) => s.id),
    programs: programs.map((p) => p.id),
  };
}
