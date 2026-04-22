import type {
  EstimatePercentile,
  EstimateWorkUnit,
  TimelineResourceEstimate,
} from '@/types/estimation';

const CALIBRATION_MULTIPLIERS: Record<EstimatePercentile, number> = {
  P50: 1,
  P80: 1.14,
  P95: 1.32,
};

export function getPercentileMultiplier(percentile: EstimatePercentile) {
  return CALIBRATION_MULTIPLIERS[percentile];
}

export function summarizeCommitmentRisk(estimate: TimelineResourceEstimate) {
  const percentile = estimate.sponsor_approval.approval_percentile_commitment;
  const multiplier = getPercentileMultiplier(percentile);
  const weeks = estimate.summary.total_calendar_weeks_p80;
  return {
    percentile,
    multiplier,
    expected_commitment_weeks: Math.round(weeks * multiplier),
    flex_modes: estimate.flex_modes_applied.map((mode) => mode.flex_mode),
  };
}

export function countPoliticalRiskWorkUnits(workUnits: EstimateWorkUnit[]) {
  return workUnits.filter((unit) => unit.political_risk_flag).length;
}

export function countCapabilityRisingWorkUnits(workUnits: EstimateWorkUnit[]) {
  return workUnits.filter((unit) => unit.ai_capability_trajectory_flag).length;
}
