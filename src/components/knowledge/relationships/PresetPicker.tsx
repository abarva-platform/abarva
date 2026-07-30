"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

/**
 * Preset focal-graph question picker. Matrix row gate: "Hide a preset whose
 * focal node does not resolve, rather than opening an empty graph" -- the
 * filter to `focalNodeResolved` happens here, not just at graph-render time,
 * so a user never selects a question that can only ever open nothing.
 */
export function PresetPicker() {
  const {
    provider,
    providerCtx,
    relationshipPresetId,
    setRelationshipPresetId,
  } = useKnowledgeApp();
  const envelope = useEnvelope(
    () => provider.listRelationshipPresets(providerCtx),
    [provider, providerCtx],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Preset questions"
      emptyTitle="No preset questions resolve yet"
      emptyBody="Every preset's focal node needs to resolve in the relationship node projection before it can be offered -- none do yet for airline-demo-new."
    >
      {(presets) => {
        const resolved = presets.filter((p) => p.focalNodeResolved);
        if (resolved.length === 0) {
          return (
            <p className="text-sm italic text-[#888780]">
              No preset questions resolve yet -- every focal node they would
              open is unresolved.
            </p>
          );
        }
        return (
          <ul className="space-y-1">
            {resolved.map((preset) => (
              <li key={preset.presetId}>
                <button
                  type="button"
                  onClick={() => setRelationshipPresetId(preset.presetId)}
                  className={`w-full rounded-md border px-2.5 py-1.5 text-left text-sm ${
                    relationshipPresetId === preset.presetId
                      ? "border-[#0c1a3a] bg-[#0c1a3a] text-white"
                      : "border-[rgba(10,10,11,0.12)] bg-white text-[#2c2c2a]"
                  }`}
                >
                  {preset.questionText}
                </button>
              </li>
            ))}
          </ul>
        );
      }}
    </GatedSection>
  );
}
