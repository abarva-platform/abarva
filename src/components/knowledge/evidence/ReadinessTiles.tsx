"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import type { ReadinessState } from "@/lib/knowledge/providers/types";

const LABELS: Record<ReadinessState, string> = {
  decision_ready: "Decision-ready",
  directional: "Directional",
  blocked_missing_input: "Blocked -- missing input",
  blocked_sources_disagree: "Blocked -- sources disagree",
  not_assessed: "Not assessed",
};

const TONE: Record<ReadinessState, "neutral" | "candidate" | "gap"> = {
  decision_ready: "neutral",
  directional: "candidate",
  blocked_missing_input: "gap",
  blocked_sources_disagree: "gap",
  not_assessed: "neutral",
};

/** Matrix row gate: "Do not compute readiness client-side from partial data" --
 * this reads a server-computed summary only, it never derives counts itself
 * from whatever partial gap/decision lists happen to be loaded. */
export function ReadinessTiles() {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.getDecisionReadinessSummary(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decision readiness"
      emptyTitle="Decision-readiness summary withheld"
      emptyBody="The readiness taxonomy and its underlying gap/program data have not both resolved for airline-demo-new."
    >
      {(summary) => (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(Object.keys(LABELS) as ReadinessState[]).map((key) => (
            <div
              key={key}
              className="rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
            >
              <p className="text-2xl font-semibold text-[#2c2c2a]">
                {summary.countsWithheldReason
                  ? "Withheld"
                  : summary.counts[key]}
              </p>
              <p
                className={`mt-1 text-xs font-medium ${TONE[key] === "gap" ? "text-[#a32d2d]" : TONE[key] === "candidate" ? "text-[#ba7517]" : "text-[#5f5e5a]"}`}
              >
                {LABELS[key]}
              </p>
            </div>
          ))}
          {summary.countsWithheldReason ? (
            <p className="col-span-full text-xs text-[#ba7517]">
              {summary.countsWithheldReason}
            </p>
          ) : null}
        </div>
      )}
    </GatedSection>
  );
}
