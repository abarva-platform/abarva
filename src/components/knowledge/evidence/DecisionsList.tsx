"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";

export function DecisionsList() {
  const { provider, providerCtx } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listDecisions(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Decisions and what closes them"
      emptyTitle="Decisions list withheld"
      emptyBody="The Decision object is not yet a ratified canonical type, and evidence_gap_v1 has not resolved -- omitting this list rather than hand-authoring decision text disconnected from real gaps."
    >
      {(decisions) => (
        <ul className="space-y-2">
          {decisions.map((d) => (
            <li
              key={d.decisionId}
              className="flex items-start justify-between gap-3 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3"
            >
              <div>
                <p className="text-sm font-medium text-[#2c2c2a]">{d.title}</p>
                <p className="mt-0.5 text-xs text-[#5f5e5a]">
                  {d.closingDependencyText}
                </p>
              </div>
              <StateBadge
                tone={
                  d.readinessState === "decision_ready"
                    ? "neutral"
                    : d.readinessState.startsWith("blocked")
                      ? "gap"
                      : "candidate"
                }
                label={d.readinessState.replace(/_/g, " ")}
              />
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}
