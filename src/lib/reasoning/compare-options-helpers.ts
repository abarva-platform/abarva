/**
 * Helpers for the "Compare with…" dropdown on instance detail pages.
 *
 * Pure transform: given the current instance id and the full catalogue
 * (`{ sourceEvents, programs }` from `getAllInstanceIds()`), return a grouped
 * option list — one group per kind — with the current instance excluded.
 *
 * No IO, no randomness, same input → same output.
 */

export interface CompareOptionGroup {
  /** Display label for the group, e.g. "Source events". */
  label: string;
  /** Stable kind tag — useful if a caller wants to apply per-kind styling. */
  kind: 'source' | 'program';
  /** Option ids for this group. Order is preserved from the input. */
  options: string[];
}

export interface CompareOptionsResult {
  groups: CompareOptionGroup[];
  /** Flattened total option count after exclusion — handy for empty-state checks. */
  totalCount: number;
}

/**
 * Build the grouped option list for a "Compare with…" dropdown.
 *
 * - Excludes `currentId` from whichever group it appears in.
 * - Keeps group order: source events first, then programs.
 * - Drops empty groups so callers don't need to render a header for nothing.
 */
export function prepareCompareOptions(
  currentId: string,
  allIds: { sourceEvents: string[]; programs: string[] },
): CompareOptionsResult {
  const sourceEvents = allIds.sourceEvents.filter((id) => id !== currentId);
  const programs = allIds.programs.filter((id) => id !== currentId);

  const groups: CompareOptionGroup[] = [];
  if (sourceEvents.length > 0) {
    groups.push({ label: 'Source events', kind: 'source', options: sourceEvents });
  }
  if (programs.length > 0) {
    groups.push({ label: 'Programs', kind: 'program', options: programs });
  }

  return {
    groups,
    totalCount: sourceEvents.length + programs.length,
  };
}
