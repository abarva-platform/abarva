"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/** Matrix row gate: "Hide the benchmark row entirely for any metric without
 * both a tenant observation and a cohort value" -- filtered here per row,
 * not just at the panel level, so a partially-populated benchmark set still
 * shows the rows that ARE complete. */
export function BenchmarksPanel() {
  const { provider, providerCtx, lensId, openDrawer } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listIndustryBenchmarks({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Industry position"
      emptyTitle="Industry benchmarks withheld"
    >
      {(benchmarks) => {
        const rows = benchmarks.filter(
          (b) =>
            b.tenantValue !== null && b.tenantValueAvailability === "available",
        );
        if (rows.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No metric here has both a tenant observation and a cohort value
              yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {rows.map((b) => {
              const pct = Math.min(
                100,
                ((b.tenantValue as number) / b.cohortMax) * 100,
              );
              const medianPct = Math.min(
                100,
                (b.cohortMedian / b.cohortMax) * 100,
              );
              return (
                <button
                  key={b.metricId}
                  type="button"
                  onClick={() =>
                    openDrawer({
                      kind: "Benchmark",
                      title: b.metricLabel,
                      subtitle: "Industry comparison",
                      evidence: [],
                      attributes: [
                        {
                          label: "This enterprise",
                          value: `${b.tenantValue}${b.unit}`,
                        },
                        {
                          label: "Cohort median",
                          value: `${b.cohortMedian}${b.unit}`,
                        },
                        {
                          label: "Cohort top quartile",
                          value: `${b.cohortTopQuartile}${b.unit}`,
                        },
                        { label: "Cohort", value: b.cohortDefinition },
                      ],
                    })
                  }
                  className="block w-full rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
                >
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-[#2c2c2a]">
                      {b.metricLabel}
                    </span>
                    <span className="text-[#5f5e5a]">
                      {b.tenantValue}
                      {b.unit}
                    </span>
                  </div>
                  <div className="relative h-2 rounded-full bg-[rgba(10,10,11,0.08)]">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-[#0c1a3a]"
                      style={{ width: `${pct}%` }}
                    />
                    <div
                      className="absolute top-[-2px] h-3 w-0.5 bg-[#888780]"
                      style={{ left: `${medianPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-[#888780]">
                    {b.cohortDefinition}
                  </p>
                </button>
              );
            })}
          </div>
        );
      }}
    </GatedSection>
  );
}
