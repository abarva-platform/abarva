"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  specByCode,
  type SourceArtifactSpec,
} from "@/lib/source/canonical-specs";
import type { SourceEventArtifactState } from "@/lib/source/canvas-substrate";
import type { SourceArtifactRegistryRecord } from "@/lib/source/artifact-registry/types";
import {
  artifactDisplayName,
  artifactStatusDisplayName,
} from "@/lib/source/artifact-display-names";
import { CANVAS } from "../canvas-tokens";

interface StrategyStageViewProps {
  artifacts: SourceEventArtifactState[];
  registryArtifacts?: SourceArtifactRegistryRecord[];
  selectedCode?: string;
  onSelectCode?: (code: string) => void;
  documentWorkspace: ReactNode;
}

const STRATEGY_PURPOSE_BY_CODE: Record<string, string> = {
  d01_strategy_memo:
    "Why we are sourcing now, what is in scope, the value target, and the rigor level.",
  d02_value_target:
    "The savings and outcome envelope this sourcing event is accountable to.",
  d03_archetype_decision:
    "Records the sourcing archetype and why it fits; captured when the choice needs a clear rationale.",
};

export function StrategyStageView({
  artifacts,
  registryArtifacts = [],
  selectedCode,
  onSelectCode,
  documentWorkspace,
}: StrategyStageViewProps) {
  const ordered = orderStrategyArtifacts(artifacts);
  // A "draft" exists if the artifact has an authored body OR if the registry
  // has a generated document for this code (e.g. auto-drafted strategy memo
  // stored in source_artifacts but not yet promoted back into the state body).
  // registry record.artifactKind == artifact_code in source_event_artifact_states
  const registryCodeSet = new Set(
    registryArtifacts.map((r) => r.artifactKind).filter(Boolean),
  );
  const hasAnyAuthoredBody = ordered.some(
    (artifact) =>
      Boolean(artifact.body?.trim()) ||
      registryCodeSet.has(artifact.artifactCode),
  );

  return (
    <div data-testid="source-strategy-stage-view" style={WRAP_STYLE}>
      <section
        data-testid="source-strategy-deliverables"
        aria-labelledby="source-strategy-deliverables-title"
        style={DELIVERABLES_WRAP_STYLE}
      >
        <div>
          <div style={SECTION_EYEBROW_STYLE}>What this stage produces</div>
          <h2
            id="source-strategy-deliverables-title"
            style={SECTION_TITLE_STYLE}
          >
            Strategy outputs
          </h2>
        </div>
        <div style={DELIVERABLES_GRID_STYLE}>
          {ordered.map((artifact) => (
            <StrategyDeliverableCard
              key={artifact.artifactCode}
              artifact={artifact}
              spec={specByCode(artifact.artifactCode)}
              selected={artifact.artifactCode === selectedCode}
              hasRegistryDraft={registryCodeSet.has(artifact.artifactCode)}
              onOpen={() => onSelectCode?.(artifact.artifactCode)}
            />
          ))}
        </div>
      </section>

      {!hasAnyAuthoredBody ? (
        <div
          data-testid="source-strategy-export-empty"
          style={EXPORT_NOTE_STYLE}
        >
          Download and export options appear once the memo has been drafted.
          Nothing to export yet.
        </div>
      ) : null}

      <section
        data-testid="source-strategy-document-workspace"
        aria-label="Strategy document workspace"
        style={DOCUMENT_WORKSPACE_STYLE}
      >
        {documentWorkspace}
      </section>
    </div>
  );
}

function StrategyDeliverableCard({
  artifact,
  spec,
  selected,
  hasRegistryDraft = false,
  onOpen,
}: {
  artifact: SourceEventArtifactState;
  spec: SourceArtifactSpec | undefined;
  selected: boolean;
  hasRegistryDraft?: boolean;
  onOpen: () => void;
}) {
  const hasBody = Boolean(artifact.body?.trim());
  const hasDraft = hasBody || hasRegistryDraft;
  const requirementLabel =
    artifact.requirementLevel === "optional" ? "Optional" : "Required";
  const statusLabel = hasRegistryDraft && !hasBody
    ? "Draft exists (generated)"
    : artifactStatusDisplayName(artifact);
  return (
    <button
      type="button"
      data-testid={`source-strategy-deliverable-${artifact.artifactCode}`}
      onClick={onOpen}
      style={{
        ...DELIVERABLE_CARD_STYLE,
        borderColor: selected ? CANVAS.INK : CANVAS.HAIRLINE,
        boxShadow: selected
          ? "0 8px 18px rgba(12,26,58,0.08)"
          : "0 4px 10px rgba(12,26,58,0.04)",
      }}
    >
      <span style={ICON_STYLE} aria-hidden="true">
        {artifact.requirementLevel === "optional" ? "ADR" : "DOC"}
      </span>
      <span style={DELIVERABLE_COPY_STYLE}>
        <span style={DELIVERABLE_NAME_STYLE}>
          {artifactDisplayName(artifact.artifactCode, spec?.name)}
        </span>
        <span style={DELIVERABLE_DESC_STYLE}>
          {STRATEGY_PURPOSE_BY_CODE[artifact.artifactCode] ??
            spec?.description ??
            "A stage output used to support the next sourcing decision."}
        </span>
      </span>
      <span style={CARD_TAGS_STYLE}>
        <span style={REQUIREMENT_TAG_STYLE}>{requirementLabel}</span>
        <span
          style={{
            ...STATUS_TAG_STYLE,
            color: hasDraft ? "#2E7D32" : CANVAS.INK_SOFT,
            borderColor: hasDraft ? "rgba(46,125,50,0.28)" : CANVAS.HAIRLINE,
            background: hasDraft ? "rgba(46,125,50,0.08)" : "#fff",
          }}
        >
          {statusLabel}
        </span>
      </span>
    </button>
  );
}

function orderStrategyArtifacts(
  artifacts: SourceEventArtifactState[],
): SourceEventArtifactState[] {
  const order = new Map([
    ["d01_strategy_memo", 0],
    ["d02_value_target", 1],
    ["d03_archetype_decision", 2],
  ]);
  return [...artifacts].sort((a, b) => {
    const left = order.get(a.artifactCode) ?? 99;
    const right = order.get(b.artifactCode) ?? 99;
    if (left !== right) return left - right;
    if (a.requirementLevel !== b.requirementLevel) {
      return a.requirementLevel === "required" ? -1 : 1;
    }
    return a.artifactCode.localeCompare(b.artifactCode);
  });
}

const WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 18,
};

const DELIVERABLES_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
};

const SECTION_EYEBROW_STYLE: CSSProperties = {
  marginBottom: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: CANVAS.INK_MUTED,
};

const SECTION_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  lineHeight: 1.16,
  fontWeight: 400,
  color: CANVAS.INK,
};

const DELIVERABLES_GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: 12,
};

const DELIVERABLE_CARD_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "34px minmax(0, 1fr)",
  gap: 12,
  alignItems: "start",
  minHeight: 156,
  padding: 16,
  border: "1px solid",
  borderRadius: 8,
  background: "#fff",
  color: CANVAS.INK,
  textAlign: "left",
  cursor: "pointer",
};

const ICON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 34,
  height: 34,
  borderRadius: 8,
  border: `1px solid ${CANVAS.HAIRLINE}`,
  background: "rgba(29,78,216,0.07)",
  color: "#1d4ed8",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 800,
  letterSpacing: "0.08em",
};

const DELIVERABLE_COPY_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 0,
};

const DELIVERABLE_NAME_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 15,
  lineHeight: 1.25,
  fontWeight: 700,
  color: CANVAS.INK,
};

const DELIVERABLE_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: CANVAS.INK_SOFT,
};

const CARD_TAGS_STYLE: CSSProperties = {
  gridColumn: "1 / -1",
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  alignItems: "center",
  marginTop: "auto",
};

const REQUIREMENT_TAG_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 999,
  padding: "4px 8px",
  background: "#fff",
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK,
};

const STATUS_TAG_STYLE: CSSProperties = {
  ...REQUIREMENT_TAG_STYLE,
  textTransform: "none",
  letterSpacing: "0",
  fontFamily: CANVAS.SANS,
  fontSize: 11,
};

const EXPORT_NOTE_STYLE: CSSProperties = {
  padding: "14px 16px",
  border: `1px solid ${CANVAS.HAIRLINE}`,
  borderRadius: 8,
  background: "rgba(29,78,216,0.06)",
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
};

const DOCUMENT_WORKSPACE_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
};
