import type { TowerAiView } from "./types";

/** A usage-count bar's visual width never establishes an adoption percentage. */
export function recordedAdoptionRate(item: TowerAiView): number | null {
  const rate = item.adoptionActualPct;
  return typeof rate === "number" && Number.isFinite(rate) && rate >= 0 && rate <= 100
    ? rate
    : null;
}
