"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";
import { readinessPresentation } from "../state/gate-utils";

/**
 * The real contract has no ratified Decision object (see the reconciliation
 * matrix's `listDecisions` row) -- this renders the same per-domain
 * readiness rollup as `getDecisionsWaiting`, not hand-authored decision
 * text disconnected from real gaps.
 */
export function DecisionsList() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getDecisionsWaiting({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decisions and what closes them"
      emptyBody="The Decision object is not yet a ratified canonical type, and evidence_gap_v1 has not resolved -- omitting this list rather than hand-authoring decision text disconnected from real gaps."
    >
      {({ rollups }) => (
        <ul className="space-y-2">
          {rollups.map((rollup) => {
            const presentation = readinessPresentation(rollup.readiness);
            return (
              <li
                key={rollup.domainKey ?? rollup.label}
                className="flex items-start justify-between gap-3 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#2c2c2a]">
                    {rollup.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[#5f5e5a]">
                    {rollup.openGapCount !== null
                      ? `${rollup.openGapCount} open gap${rollup.openGapCount === 1 ? "" : "s"} closes this`
                      : "Gap count withheld"}
                  </p>
                </div>
                <StateBadge
                  tone={presentation.tone}
                  label={presentation.title}
                />
              </li>
            );
          })}
        </ul>
      )}
    </GatedSection>
  );
}
