"use client";

import { useKnowledgeApp } from "../knowledge-app-context";
import { useEnvelope } from "../use-envelope";
import { GatedSection } from "../state/GatedSection";
import { StateBanner } from "../state/StateBanner";
import { PresetPicker } from "./PresetPicker";
import { GraphCanvas } from "./GraphCanvas";
import { GraphLegend } from "./GraphLegend";
import { RelationshipList } from "./RelationshipList";
import type {
  RelationshipEdgeDetailRow,
  RelationshipNodeRow,
} from "@/lib/knowledge/providers/read-models";

/** RelationshipEvidenceDetail.confidence uses a 3-value scale (high/medium/low)
 * distinct from EvidenceRef.confidence's 3-value scale (high/partial/unknown)
 * -- "medium" and "low" both honestly map to "partial" rather than pretending
 * finer granularity than the shared EvidenceRef shape carries. */
function toEvidenceConfidence(
  confidence: "high" | "medium" | "low" | null,
): "high" | "partial" | "unknown" {
  if (confidence === "high") return "high";
  if (confidence === "medium" || confidence === "low") return "partial";
  return "unknown";
}

export function RelationshipsMode() {
  const {
    provider,
    providerCtx,
    relationshipPresetId,
    relationshipHops,
    setRelationshipHops,
    showCandidateRelationships,
    setShowCandidateRelationships,
    showTargetState,
    setShowTargetState,
    openDrawer,
  } = useKnowledgeApp();

  const presetsEnvelope = useEnvelope(
    () => provider.listRelationshipPresets(providerCtx),
    [provider, providerCtx],
  );
  const focalNodeId =
    presetsEnvelope?.data?.find((p) => p.presetId === relationshipPresetId)
      ?.focalNodeId ?? "";

  const nodesEnvelope = useEnvelope(
    () =>
      focalNodeId
        ? provider.listRelationshipNodes(
            providerCtx,
            focalNodeId,
            relationshipHops,
          )
        : Promise.resolve(undefined as never),
    [provider, providerCtx, focalNodeId, relationshipHops],
  );
  const edgesEnvelope = useEnvelope(
    () =>
      focalNodeId
        ? provider.listRelationshipEdgeDetails(
            providerCtx,
            focalNodeId,
            relationshipHops,
          )
        : Promise.resolve(undefined as never),
    [provider, providerCtx, focalNodeId, relationshipHops],
  );

  const hasTargetRows = (nodesEnvelope?.data ?? []).some(
    (n) => n.stateScope === "target",
  );

  function openNodeDrawer(node: RelationshipNodeRow) {
    openDrawer({
      kind: node.nodeType,
      title: node.label,
      evidence: [],
      attributes: [
        { label: "Type", value: node.nodeType },
        {
          label: "Canonical type resolved",
          value: node.canonicalObjectTypeResolved
            ? "Yes"
            : "No -- UI framing label only",
        },
        {
          label: "Catalog-backed",
          value: node.endpointCatalogBacked
            ? "Yes"
            : "No -- cannot support a decision",
        },
        { label: "State", value: node.authorityState },
      ],
      // Real node id, not a placeholder -- lets the drawer offer a
      // current-vs-target comparison scoped to this exact entity.
      entityId: node.nodeId,
    });
  }

  async function openEdgeDrawer(edge: RelationshipEdgeDetailRow) {
    const evidence = await provider.getRelationshipEvidence(
      providerCtx,
      edge.edgeId,
    );
    openDrawer({
      kind: "Relationship",
      title: `${edge.fromNodeId} -> ${edge.toNodeId}`,
      subtitle: edge.relationshipTypeResolved
        ? (edge.relationshipTypeRef ?? undefined)
        : "relationship not typed",
      evidence: evidence.data
        ? [
            {
              sourceName: evidence.data.sourceCitation,
              sourceDate: evidence.data.effectiveFrom,
              citation: evidence.data.sourceCitation,
              reviewState: edge.authorityState,
              confidence: toEvidenceConfidence(evidence.data.confidence),
              effectivePeriod: {
                from: evidence.data.effectiveFrom,
                to: evidence.data.effectiveTo,
              },
              lineage: [],
              conflicts: edge.isConflict ? ["disputed"] : [],
              accessRestricted: false,
            },
          ]
        : [],
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
              title={
                !hasTargetRows
                  ? "No target state published for this entity"
                  : undefined
              }
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
              envelope={nodesEnvelope}
              label="Relationship graph"
              emptyTitle="This graph has not been reconciled yet"
              emptyBody="One hop, accepted-only nodes must resolve server-side before this graph can render -- nothing is inferred to fill it in the meantime."
            >
              {(nodes) => (
                <GatedSection
                  envelope={edgesEnvelope}
                  label="Relationship edges"
                >
                  {(edges) => (
                    <div className="space-y-3">
                      <GraphCanvas
                        nodes={nodes}
                        edges={edges}
                        onNodeClick={openNodeDrawer}
                        onEdgeClick={openEdgeDrawer}
                      />
                      <GraphLegend />
                      <RelationshipList
                        edges={edges}
                        onEdgeClick={openEdgeDrawer}
                      />
                    </div>
                  )}
                </GatedSection>
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
