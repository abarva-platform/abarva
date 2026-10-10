/** Count only reached pages as observed; later phases are never a pass or fail. */
export function phaseReachable(currentPhase: number, phase: number): boolean {
  return Number.isInteger(currentPhase) && phase <= currentPhase;
}

export type WalkViewStatus = "pass" | "fail" | "known_gap" | "not_reachable";

export function walkCoverage(
  statuses: readonly WalkViewStatus[],
  expectedTotal = statuses.length,
): {
  total: number;
  reached: number;
  passed: number;
  knownGap: number;
  failed: number;
  notReachable: number;
  unassessed: number;
} {
  if (expectedTotal < statuses.length) {
    throw new Error("Walk observed more pages than the registered view count");
  }
  const count = (status: WalkViewStatus) =>
    statuses.filter((item) => item === status).length;
  const notReachable = count("not_reachable");
  return {
    total: expectedTotal,
    reached: statuses.length - notReachable,
    passed: count("pass"),
    knownGap: count("known_gap"),
    failed: count("fail"),
    notReachable,
    unassessed: expectedTotal - statuses.length,
  };
}
