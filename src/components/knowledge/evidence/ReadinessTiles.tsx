"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import type { ComponentReadinessState } from "@/lib/knowledge/view-model";

const TILE_GROUPS: readonly {
  readonly label: string;
  readonly states: readonly ComponentReadinessState[];
  readonly attention: boolean;
}[] = [
  {
    label: "Ready",
    states: ["ENABLED_AND_PROVEN", "DATA_RECONCILED_BUT_UI_UNPROVEN"],
    attention: false,
  },
  {
    label: "Source incomplete",
    states: ["SOURCE_INCOMPLETE"],
    attention: true,
  },
  {
    label: "Not loaded",
    states: ["PROJECTION_UNAVAILABLE", "CUBE_UNPROVEN"],
    attention: true,
  },
  {
    label: "Sources disagree",
    states: ["DISPUTED"],
    attention: true,
  },
  {
    label: "Not assessed",
    states: ["NOT_ASSESSED", "NOT_MEASURED"],
    attention: false,
  },
];

/** A per-domain readiness rollup, tiled by real ComponentReadinessState
 * buckets -- this reads a server-composed summary only (getDecisionReadiness),
 * it never derives counts client-side from whatever partial data happens to
 * be loaded elsewhere on the page. */
export function ReadinessTiles() {
  const { assembler, runtime, tenantKey, lensId } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => assembler.getDecisionReadiness({ runtime, tenantKey, lens: lensId }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection envelope={envelope} label="Decision readiness">
      {(readiness) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TILE_GROUPS.map((group) => {
            const count = readiness.domains.filter((d) =>
              group.states.includes(d.readiness),
            ).length;
            return (
              <div
                key={group.label}
                className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
              >
                <p className="text-2xl font-semibold text-[#2c2c2a]">{count}</p>
                <p
                  className={`mt-1 text-xs font-medium ${group.attention ? "text-[#a32d2d]" : "text-[#5f5e5a]"}`}
                >
                  {group.label}
                </p>
              </div>
            );
          })}
          {readiness.overallEvidenceCoverage !== null ? (
            <p className="col-span-full text-xs text-[#888780]">
              Overall evidence coverage:{" "}
              {Math.round(readiness.overallEvidenceCoverage * 100)}%
            </p>
          ) : (
            <p className="col-span-full text-xs text-[#ba7517]">
              Overall evidence coverage withheld -- evidence_gap_v1 has not
              resolved for this baseline.
            </p>
          )}
        </div>
      )}
    </GatedSection>
  );
}
