"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";

export interface RelationshipPreset {
  readonly presetId: string;
  readonly questionText: string;
  readonly focalEntityRef: string;
}

/**
 * Named focal-graph questions. Per the reconciliation matrix's
 * `listRelationshipPresets` row (UI_VIEW_MODEL_ONLY): this is pure UI/
 * operational config, not a real provider query -- the assembler defines no
 * preset-list method. PR B's own judgment call: the preset list below is
 * built against the real focal entity refs present in the fixture graph
 * (fixture-airline-demo-new), so every preset opens onto real nodes rather
 * than an invented id. "Resolved" is checked against one real
 * getRelationshipNeighborhood(hopDepth: 2) call's node set, not assumed.
 */
export const RELATIONSHIP_PRESETS: readonly RelationshipPreset[] = [
  {
    presetId: "crew-scheduling",
    questionText: "What does the crew scheduling system depend on?",
    focalEntityRef: "app-crew-sched",
  },
  {
    presetId: "dispatch",
    questionText: "What depends on dispatch and load planning?",
    focalEntityRef: "app-dispatch",
  },
  {
    presetId: "irops-control",
    questionText: "What surrounds the IROPS control desk?",
    focalEntityRef: "app-ops-control",
  },
  {
    presetId: "irops-risk",
    questionText: "What contributes to irregular-operations exposure?",
    focalEntityRef: "risk-irrops",
  },
  {
    presetId: "vendor-concentration",
    questionText: "Where does vendor concentration risk come from?",
    focalEntityRef: "risk-vendor-concentration",
  },
];

export function PresetPicker() {
  const {
    assembler,
    runtime,
    tenantKey,
    lensId,
    relationshipPresetId,
    setRelationshipPresetId,
  } = useKnowledgeApp();
  const envelope = useEnvelope(
    () =>
      assembler.getRelationshipNeighborhood({
        runtime,
        tenantKey,
        lens: lensId,
        focalEntityRefs: RELATIONSHIP_PRESETS.map((p) => p.focalEntityRef),
        hopDepth: 2,
      }),
    [assembler, runtime, tenantKey, lensId],
  );

  return (
    <GatedSection
      envelope={envelope}
      label="Preset questions"
      emptyTitle="No preset questions resolve yet"
      emptyBody="Every preset's focal node needs to resolve in the relationship node projection before it can be offered -- none do yet."
    >
      {(neighborhood) => {
        const nodeIds = new Set(neighborhood.nodes.map((n) => n.nodeId));
        const resolved = RELATIONSHIP_PRESETS.filter((p) =>
          nodeIds.has(p.focalEntityRef),
        );
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
