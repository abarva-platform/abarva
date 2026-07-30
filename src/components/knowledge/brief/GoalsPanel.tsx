"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBadge } from "../state/StateBanner";

const TONE: Record<string, "neutral" | "candidate" | "gap"> = {
  decision_ready: "neutral",
  directional: "candidate",
  blocked_missing_input: "gap",
  blocked_sources_disagree: "gap",
  not_assessed: "neutral",
};

export function GoalsPanel() {
  const { provider, providerCtx, lensId, setMode, setRelationshipPresetId } =
    useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listGoals({ ...providerCtx, lensId }),
    [provider, providerCtx, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Goals"
      emptyTitle="Goals not yet available"
      emptyBody="Goal is not yet a ratified canonical object type. Not synthesized from program titles in the meantime."
    >
      {(goals) => (
        <ul className="space-y-2">
          {goals.map((goal) => (
            <li key={goal.goalId}>
              <button
                type="button"
                onClick={() => {
                  if (goal.focalGraphKey) {
                    setRelationshipPresetId(goal.focalGraphKey);
                    setMode("relationships");
                  }
                }}
                className="flex w-full items-start justify-between gap-3 rounded-md border border-[rgba(10,10,11,0.1)] bg-white p-3 text-left"
              >
                <div>
                  <p className="text-sm font-medium text-[#2c2c2a]">
                    {goal.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#888780]">{goal.detail}</p>
                </div>
                <StateBadge
                  tone={TONE[goal.readinessState] ?? "neutral"}
                  label={goal.readinessState.replace(/_/g, " ")}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </GatedSection>
  );
}
