"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBanner } from "../state/StateBanner";
import { PresetPicker, RELATIONSHIP_PRESETS } from "./PresetPicker";
import { GraphCanvas } from "./GraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { RelationshipList } from "./RelationshipList";
import type { ComponentReadinessState } from "@/lib/knowledge/view-model";
import type {
  RelationshipEdgeV1,
  RelationshipNodeV1,
} from "@/lib/knowledge/consumption-contracts";

type ReadyEdge = RelationshipEdgeV1 & { readiness: ComponentReadinessState };

export function RelationshipsMode() {
  const {
    assembler,
    runtime,
    tenantKey,
    lensId,
    relationshipPresetId,
    relationshipHops,
    setRelationshipHops,
    showCandidateRelationships,
    setShowCandidateRelationships,
    showTargetState,
    setShowTargetState,
    openDrawer,
  } = useKnowledgeApp();

  const focalEntityRef = RELATIONSHIP_PRESETS.find(
    (p) => p.presetId === relationshipPresetId,
  )?.focalEntityRef;

  const neighborhoodEnvelope = useEnvelope(
    () =>
      focalEntityRef
        ? assembler.getRelationshipNeighborhood({
            runtime,
            tenantKey,
            lens: lensId,
            focalEntityRefs: [focalEntityRef],
            hopDepth: relationshipHops,
          })
        : Promise.resolve(undefined as never),
    [assembler, runtime, tenantKey, lensId, focalEntityRef, relationshipHops],
  );

  const hasTargetRows = false; // no per-node stateScope exists on RelationshipNodeV1 today

  function openNodeDrawer(node: RelationshipNodeV1) {
    openDrawer({
      kind: node.nodeType,
      title: node.label,
      evidence: [],
      attributes: [
        { label: "Type", value: node.nodeType },
        { label: "Authority", value: node.authorityState },
        { label: "Availability", value: node.availabilityState },
        { label: "Hop", value: String(node.hop) },
      ],
      // Real node id, not a placeholder -- lets the drawer offer a
      // current-vs-target comparison scoped to this exact entity.
      entityId: node.nodeId,
    });
  }

  async function openEdgeDrawer(edge: ReadyEdge) {
    if (!focalEntityRef) return;
    // Edge evidence (evidenceByEdge) is not part of the assembler's
    // RelationshipNeighborhoodViewModel -- it reads straight off the real
    // provider call, per the reconciliation matrix's RelationshipsMode row.
    const env = await runtime.provider.getRelationships({
      tenantKey,
      knowledgeBaselineRef: runtime.baselineRef,
      focalEntityRefs: [focalEntityRef],
      direction: "both",
      hopDepth: relationshipHops,
      currentTargetScope: "current",
      authorityMinimum: "accepted",
      maxNodes: 80,
      maxEdges: 150,
      includeCandidates: true,
    });
    const evidence = env.data.evidenceByEdge[edge.edgeId] ?? [];
    openDrawer({
      kind: "Relationship",
      title: `${edge.fromNodeId} -> ${edge.toNodeId}`,
      subtitle: edge.relationshipType,
      evidence,
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[240px_1fr] gap-6">
        <div>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#888780]">
            Questions
          </h3>
          <PresetPicker />
        </div>

        <div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <ToggleChip
              label="One hop"
              active={relationshipHops === 1}
              onClick={() => setRelationshipHops(1)}
            />
            <ToggleChip
              label="Two hops"
              active={relationshipHops === 2}
              onClick={() => setRelationshipHops(2)}
            />
            <ToggleChip
              label="Show candidates"
              active={showCandidateRelationships}
              onClick={() =>
                setShowCandidateRelationships(!showCandidateRelationships)
              }
            />
            <ToggleChip
              label="Target state"
              active={showTargetState}
              disabled={!hasTargetRows}
              title="No target-state scoping exists on the real relationship node projection yet"
              onClick={() => setShowTargetState(!showTargetState)}
            />
          </div>

          {!relationshipPresetId ? (
            <StateBanner
              decision={{
                tone: "neutral",
                title: "Select a question to open its graph",
                body: "Pick a preset question on the left, or ask aVa a dependency question from the companion dock.",
              }}
            />
          ) : (
            <GatedSection
              envelope={neighborhoodEnvelope}
              label="Relationship graph"
              emptyTitle="This graph has not been reconciled yet"
              emptyBody="One hop, accepted-only nodes must resolve server-side before this graph can render -- nothing is inferred to fill it in the meantime."
            >
              {(neighborhood) => (
                <div className="space-y-3">
                  <GraphCanvas
                    nodes={neighborhood.nodes}
                    edges={neighborhood.edges}
                    onNodeClick={openNodeDrawer}
                    onEdgeClick={openEdgeDrawer}
                  />
                  <GraphLegend />
                  <RelationshipList
                    edges={neighborhood.edges}
                    onEdgeClick={openEdgeDrawer}
                  />
                </div>
              )}
            </GatedSection>
          )}
        </div>
      </div>
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
  disabled,
  title,
}: {
  readonly label: string;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly disabled?: boolean;
  readonly title?: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title}
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-xs ${
        disabled
          ? "cursor-not-allowed border-[rgba(10,10,11,0.1)] text-[#b4b2a9]"
          : active
            ? "border-[#0c1a3a] bg-[#0c1a3a] text-white"
            : "border-[rgba(10,10,11,0.18)] bg-white text-[#5f5e5a]"
      }`}
    >
      {label}
    </button>
  );
}
