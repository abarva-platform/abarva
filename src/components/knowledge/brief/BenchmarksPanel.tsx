"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * Industry position -- BenchmarkV1 rows filtered to contentClass ===
 * "industry_benchmark". The real projection carries a governed value and a
 * free-text peer-context line, not the original prototype's numeric
 * cohort-median/cohort-max/top-quartile breakdown (no such fields exist in
 * BenchmarkV1) -- so this renders as a labelled value list with peer context,
 * not a comparison bar chart, per the real contract's actual shape.
 */
export function BenchmarksPanel() {
  const { assembler, runtime, tenantKey, lensId, openDrawer } =
    useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getIndustryContext({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Industry position">
      {({ benchmarks }) => {
        const rows = benchmarks.filter(
          (b) => b.value !== null && b.value.availabilityState === "available",
        );
        if (rows.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No benchmark here has a governed tenant value yet.
            </p>
          );
        }
        return (
          <div className="space-y-3">
            {rows.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() =>
                  openDrawer({
                    kind: "Benchmark",
                    title: b.label,
                    subtitle: "Industry comparison",
                    evidence: runtime.resolveEvidence(b.evidenceRefs),
                  })
                }
                className="block w-full rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium text-[#2c2c2a]">{b.label}</span>
                  <span className="text-[#5f5e5a]">
                    {b.value?.value}
                    {b.value?.unit ?? ""}
                  </span>
                </div>
                {b.peerContext ? (
                  <p className="mt-1 text-xs text-[#888780]">{b.peerContext}</p>
                ) : null}
              </button>
            ))}
          </div>
        );
      }}
    </GatedSection>
  );
}
