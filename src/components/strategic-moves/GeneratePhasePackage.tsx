"use client";

// GeneratePhasePackage — per-document generate controls for the phase workspace.
//
// Shows every document in the phase from the registry. Each document routes
// through the GOVERNED, multi-pass async orchestrator (GenerateDeliverableButton →
// POST /api/v1/deliverables/generate, polled to completion with a live % band,
// plan + quality gates, blocked-state surface).
//
// This REPLACES the retired single-pass path (POST /api/v1/programs/:id/generate,
// which used streamAgentTurn with no quality gate and could fabricate). No Moves
// UI invokes that route anymore.

import {
  PHASE_CANONICAL_KEYS,
  DELIVERABLE_REGISTRY,
  FORMAT_LABELS,
  type DeliverableSpec,
  type DeliverableFormat,
} from "@/lib/programs/deliverable-registry";
import { AI_DECISION_SUPPORT_WATERMARK } from "@/lib/ai-liability/human-decision-controls";
import {
  MOVES_AI_DRAFT_LABEL,
  MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT,
} from "@/lib/programs/deliverable-canvas-polish-view";
import { GenerateDeliverableButton } from "@/components/deliverables/GenerateDeliverableButton";
import { orchestratorDeliverableType } from "@/lib/programs/orchestrated-deliverable-map";

interface Props {
  programId: string;
  phaseNum: number;
  phaseLabel: string;
  /** Move archetype — selects the orchestrator's archetype-specific brief. */
  archetype: string;
  /** Move name — orchestrator decision context + initiative label. */
  moveName: string;
  /** Tenant cover name — clientDisplayName for the orchestrated artifact. */
  clientDisplayName: string;
}

function FormatBadge({ format }: { format: DeliverableFormat }) {
  const labels = FORMAT_LABELS[format];
  const colors: Record<string, string> = {
    HTML: "#1B2B5C",
    Word: "#1D4ED8",
    Excel: "#15803D",
  };
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {labels.map((label) => (
        <span
          key={label}
          style={{
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: "0.06em",
            padding: "1px 5px",
            borderRadius: 3,
            fontFamily: "JetBrains Mono, monospace",
            backgroundColor: `${colors[label]}18`,
            color: colors[label] ?? "#525866",
          }}
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function AiDraftBadge() {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "0.07em",
        color: "#7C2D12",
        backgroundColor: "rgba(251,146,60,0.12)",
        border: "1px solid rgba(251,146,60,0.28)",
        padding: "1px 6px",
        borderRadius: 3,
        fontFamily: "JetBrains Mono, monospace",
        textTransform: "uppercase",
      }}
    >
      {MOVES_AI_DRAFT_LABEL}
    </span>
  );
}

function DocumentRow({
  spec,
  programId,
  phaseLabel,
  archetype,
  moveName,
  clientDisplayName,
}: {
  spec: DeliverableSpec;
  programId: string;
  phaseLabel: string;
  archetype: string;
  moveName: string;
  clientDisplayName: string;
}) {
  return (
    <div
      style={{
        padding: "14px 16px",
        background: "#FFFFFF",
        border: "1px solid #e5e5e5",
        borderLeft: `3px solid ${spec.gateArtifact ? "#1B2B5C" : "#e5e5e5"}`,
        borderRadius: 8,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 3,
            }}
          >
            <FormatBadge format={spec.formatRecommendation} />
            {spec.gateArtifact && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.07em",
                  color: "#1B2B5C",
                  backgroundColor: "rgba(27,43,92,0.07)",
                  border: "1px solid rgba(27,43,92,0.18)",
                  padding: "1px 6px",
                  borderRadius: 3,
                  fontFamily: "JetBrains Mono, monospace",
                  textTransform: "uppercase",
                }}
              >
                Gate
              </span>
            )}
            <AiDraftBadge />
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A18" }}>
            {spec.documentTitle}
          </div>
          <div style={{ fontSize: 11, color: "#9AA3B2", marginTop: 1 }}>
            {spec.audiencePrimary}
          </div>
          <div style={{ fontSize: 11, color: "#7C2D12", marginTop: 4 }}>
            {MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT}
          </div>
        </div>
      </div>

      {/* Governed async generation — % band, gates, blocked surface */}
      <GenerateDeliverableButton
        module="moves"
        deliverableType={orchestratorDeliverableType(spec.deliverableTypeKey)}
        useCaseArchetype={archetype}
        sourceArtifactRef={programId}
        decisionContext={`${moveName} — ${phaseLabel}: ${spec.documentPurpose}`}
        clientDisplayName={clientDisplayName}
        initiativeDisplayName={moveName}
        label={`Generate ${spec.documentTitle} →`}
      />
    </div>
  );
}

export function GeneratePhasePackage({
  programId,
  phaseNum,
  phaseLabel,
  archetype,
  moveName,
  clientDisplayName,
}: Props) {
  const canonicalKeys = PHASE_CANONICAL_KEYS[phaseNum] ?? [];
  const specs = canonicalKeys
    .map((key) =>
      DELIVERABLE_REGISTRY.find((d) => d.deliverableTypeKey === key),
    )
    .filter(Boolean) as DeliverableSpec[];

  if (specs.length === 0) {
    return (
      <div style={{ fontSize: 12, color: "#9AA3B2", fontStyle: "italic" }}>
        No documents configured for this phase.
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div
        style={{
          padding: "10px 12px",
          backgroundColor: "rgba(27,43,92,0.04)",
          border: "1px solid rgba(27,43,92,0.14)",
          borderRadius: 6,
          color: "#1B2B5C",
          fontSize: 11,
          lineHeight: 1.45,
        }}
      >
        <strong>{AI_DECISION_SUPPORT_WATERMARK}</strong>
        <div>{MOVES_EDIT_BEFORE_COMMIT_REQUIREMENT}</div>
        <div style={{ marginTop: 4, color: "#525866" }}>
          Each document is authored by the governed orchestrator (planning the
          structure · writing it section by section · assembling the final
          document) and held back by the quality gate if it does not meet the
          board-grade bar.
        </div>
      </div>

      {/* Per-document rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {specs.map((spec) => (
          <DocumentRow
            key={spec.deliverableTypeKey}
            spec={spec}
            programId={programId}
            phaseLabel={phaseLabel}
            archetype={archetype}
            moveName={moveName}
            clientDisplayName={clientDisplayName}
          />
        ))}
      </div>
    </div>
  );
}
