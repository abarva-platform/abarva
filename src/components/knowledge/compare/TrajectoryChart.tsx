"use client";

import {
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Omit the chart; do not draw a projected line from an
 * assumption not tied to a real funded initiative" -- the projected segment
 * only renders when projectionFundedInitiativeRef is present. */
export function TrajectoryChart({ metricId }: { readonly metricId: string }) {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getMetricTrajectory(providerCtx, metricId),
    [provider, providerCtx, metricId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Trajectory"
      emptyTitle="No measured trajectory yet"
    >
      {(trajectory) => {
        const measured = trajectory.points.filter((p) => !p.isProjected);
        const projected = trajectory.points.filter((p) => p.isProjected);
        const showProjection =
          projected.length > 0 &&
          Boolean(trajectory.projectionFundedInitiativeRef);
        const data = showProjection ? trajectory.points : measured;

        if (measured.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No measured trajectory yet for {trajectory.metricLabel}.
            </p>
          );
        }

        return (
          <div className="h-64 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data.map((p) => ({
                  period: p.period,
                  value: p.value,
                  projected: p.isProjected,
                }))}
              >
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: "#888780" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#888780" }}
                  unit={trajectory.unit}
                />
                <Tooltip />
                {trajectory.boardTargetValue !== null ? (
                  <ReferenceLine
                    y={trajectory.boardTargetValue}
                    stroke="#ba7517"
                    strokeDasharray="4 3"
                    label="Board target"
                  />
                ) : null}
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#0c1a3a"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
            {!showProjection && projected.length > 0 ? (
              <p className="px-1 text-xs text-[#ba7517]">
                A projected path exists but is not tied to a funded initiative
                -- omitted from this chart.
              </p>
            ) : null}
          </div>
        );
      }}
    </GatedSection>
  );
}
