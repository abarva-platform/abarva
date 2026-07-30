"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { readinessPresentation } from "../state/gate-utils";

/**
 * The real consumption contract has no canonical Decision/lane object yet
 * (governance.decision is not a ratified type -- see the reconciliation
 * matrix's `listDecisionLanes` row). What the assembler CAN honestly compute
 * is a per-domain readiness rollup (`getDecisionsWaiting`), so this panel
 * renders that -- one row per domain, its own readiness state -- rather than
 * the original Fund/Resolve/Validate/Act lane grouping, which has no real
 * data behind it today.
 */
export function DecisionLanesPanel() {
  const { assembler, runtime, tenantKey, lensId, setMode } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getDecisionsWaiting({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decisions waiting"
      emptyBody="A canonical Decision/lane object does not yet exist in the consumption contract. Not synthesized from domain readiness in the meantime."
    >
      {({ rollups }) => {
        if (rollups.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No domain has a real readiness rollup recorded yet.
            </p>
          );
        }
        return (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {rollups.map((rollup) => {
              const presentation = readinessPresentation(rollup.readiness);
              return (
                <div
                  key={rollup.domainKey ?? rollup.label}
                  className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
                >
                  <p className="text-sm font-semibold text-[#0c1a3a]">
                    {rollup.label}
                  </p>
                  <p className="mb-2 text-xs text-[#888780]">
                    {presentation.title}
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode("evidence")}
                    className="w-full text-left text-sm text-[#2c2c2a] hover:underline"
                  >
                    Open in Evidence &amp; gaps
                  </button>
                  {rollup.openGapCount !== null ? (
                    <p className="text-xs text-[#888780]">
                      {rollup.openGapCount} open gap
                      {rollup.openGapCount === 1 ? "" : "s"}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        );
      }}
    </GatedSection>
  );
}
