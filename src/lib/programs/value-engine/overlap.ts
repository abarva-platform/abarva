/**
 * Moves value engine — overlap groups.
 *
 * Levers that claim the same underlying value (e.g. a shorter length of stay
 * and less emergency-department boarding both free the same beds) declare a
 * shared `overlapGroup`, and the group is counted ONCE: its declared primary
 * member when one is eligible, otherwise its largest member by base annual
 * value (the first in case order on a tie). Every other member is excluded
 * with an `overlap_exclusion` term naming the lever counted instead.
 *
 * Only levers that would otherwise be counted are eligible; a member already
 * at $0 (an unreleased non-cash lever) neither counts nor excludes.
 *
 * Pure, no I/O.
 */

export interface OverlapCandidate {
  leverId: string;
  overlapGroup: string | undefined;
  overlapPrimary: boolean;
  /** Base-scenario annual cents before any overlap exclusion. */
  baseCents: number;
  eligible: boolean;
}

/**
 * For each excluded lever id, the id of the lever counted instead. A lever
 * absent from the map is not excluded.
 */
export function resolveOverlapExclusions(
  candidates: readonly OverlapCandidate[],
): Map<string, string> {
  const groups = new Map<string, OverlapCandidate[]>();
  for (const candidate of candidates) {
    if (!candidate.eligible || !candidate.overlapGroup) continue;
    const members = groups.get(candidate.overlapGroup) ?? [];
    members.push(candidate);
    groups.set(candidate.overlapGroup, members);
  }
  const excluded = new Map<string, string>();
  for (const members of groups.values()) {
    if (members.length < 2) continue;
    let counted = members.find((member) => member.overlapPrimary);
    if (!counted) {
      counted = members[0];
      for (const member of members) {
        if (member.baseCents > counted.baseCents) counted = member;
      }
    }
    for (const member of members) {
      if (member.leverId !== counted.leverId) {
        excluded.set(member.leverId, counted.leverId);
      }
    }
  }
  return excluded;
}

/** Whether another lever shares this lever's overlap group. */
export function sharesOverlapGroup(
  leverId: string,
  overlapGroup: string | undefined,
  all: readonly { id: string; overlapGroup?: string }[],
): boolean {
  if (!overlapGroup) return false;
  return all.some(
    (other) => other.id !== leverId && other.overlapGroup === overlapGroup,
  );
}
