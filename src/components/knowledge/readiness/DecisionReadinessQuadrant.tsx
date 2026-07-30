"use client";

import {
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Omit the quadrant; do not plot an estimated
 * value-at-stake position as if it were a governed figure" -- points whose
 * value is only an estimate are still plotted (the prototype itself plots
 * estimates), but marked distinctly rather than hidden, since the row's own
 * text says the estimate itself is a legitimate thing to show as long as it
 * is labeled as an estimate, not disguised as a funded figure. */
export function DecisionReadinessQuadrant() {
  const { provider, providerCtx, setMode } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listDecisionReadinessQuadrant(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decision-readiness quadrant"
      emptyTitle="Readiness quadrant withheld"
    >
      {(points) => (
        <div className="h-72 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-2">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 10 }}>
              <XAxis
                type="number"
                dataKey="evidenceReadinessPct"
                name="Evidence readiness"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#888780" }}
              />
              <YAxis
                type="number"
                dataKey="valueAtStakePct"
                name="Value at stake"
                unit="%"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#888780" }}
              />
              <ZAxis range={[80, 80]} />
              <Tooltip
                cursor={{ strokeDasharray: "3 3" }}
                formatter={(value, name) => [`${value}%`, String(name)]}
                labelFormatter={() => ""}
              />
              <Scatter
                data={points.map((p) => ({ ...p }))}
                fill="#0066CC"
                onClick={(payload: unknown) => {
                  void payload;
                  setMode("explore");
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
          {points.some((p) => p.valueAtStakeIsEstimated) ? (
            <p className="px-1 text-xs text-[#888780]">
              Points marked as estimated derive value-at-stake from dependency
              scope, not a funded business case.
            </p>
          ) : null}
        </div>
      )}
    </GatedSection>
  );
}
