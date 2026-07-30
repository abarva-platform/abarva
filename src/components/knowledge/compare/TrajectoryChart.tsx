"use client";

import { StateBanner } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * GovernedMetricValue carries exactly one `period`, not a time series, and
 * `consumption.metric_observation_v1` has no UI-facing query that exposes
 * historical points (see the reconciliation matrix's `getMetricTrajectory`
 * row: MISSING_PROVIDER_QUERY). This component is not currently mounted
 * anywhere in the shell (confirmed by repo-wide grep, same as it was before
 * this migration) -- it stays that way; this migration only removes its
 * dependency on the deleted duplicate provider and renders its honest
 * PROJECTION_UNAVAILABLE state rather than a fabricated projected line.
 */
export function TrajectoryChart({
  metricLabel,
}: {
  readonly metricLabel: string;
}) {
  const presentation = readinessPresentation("PROJECTION_UNAVAILABLE");
  return (
    <StateBanner
      decision={{
        tone: presentation.tone,
        title: `Trajectory for ${metricLabel} -- ${presentation.title.toLowerCase()}`,
        body: "No metric time-series query exists in the consumption contract yet -- GovernedMetricValue carries a single period, not a history.",
      }}
    />
  );
}
