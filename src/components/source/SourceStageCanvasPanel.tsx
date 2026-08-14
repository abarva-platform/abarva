"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { useAtlasPageState } from "@/components/shell/AtlasPageStateProvider";
import { StageAdvanceButton } from "@/components/source/StageAdvanceButton";
import { SHELL } from "@/lib/shell/shell-tokens";
import {
  getStageCanvasConfig,
  getStageLocalSteps,
  type StageLocalStep,
} from "@/lib/source/stage-canvas-config";
import {
  SOURCE_STAGE_ORDER,
  SOURCE_STAGE_LABELS,
  normalizeSourceStageKey,
} from "@/lib/source/constants";
import type {
  SourceArtifactStatus,
  SourceStageKey,
  SourceStageStatus,
  SourcingEventDetail,
} from "@/lib/source/types";
import type { GateEvaluation } from "@/lib/reasoning/types";

interface SourceStageCanvasPanelProps {
  stageKey: SourceStageKey;
  event: SourcingEventDetail;
  nextGateEvaluations?: GateEvaluation[];
}

export function SourceStageCanvasPanel({
  stageKey,
  event,
  nextGateEvaluations = [],
}: SourceStageCanvasPanelProps) {
  const config = getStageCanvasConfig(stageKey);
  const pageState = useAtlasPageState();
  const [showDeliverables, setShowDeliverables] = useState(false);

  if (!config) return null;

  const disabled = !pageState || pageState.isStreaming;
  const totalSteps = SOURCE_STAGE_ORDER.length;
  const stageLabel = SOURCE_STAGE_LABELS[stageKey] ?? stageKey;
  const isCurrentStage = event.currentStageKey === stageKey;

  const canonicalIndex = SOURCE_STAGE_ORDER.indexOf(
    config.stageKey as SourceStageKey,
  );
  const nextStageKey = SOURCE_STAGE_ORDER[canonicalIndex + 1];
  const nextStageLabel = nextStageKey
    ? SOURCE_STAGE_LABELS[nextStageKey]
    : null;

  // Entry criteria — what was required to arrive here (previous stage's exit criteria)
  const prevStageKey = SOURCE_STAGE_ORDER[canonicalIndex - 1];
  const prevConfig = prevStageKey ? getStageCanvasConfig(prevStageKey) : null;
  const prevStageLabel = prevStageKey
    ? SOURCE_STAGE_LABELS[prevStageKey]
    : null;
  const entryCriteria = prevConfig?.exitCriteria ?? [];

  // Gate criteria: live evaluations when on current stage; config exit criteria otherwise
  const gateCriteria =
    isCurrentStage && nextGateEvaluations.length > 0
      ? nextGateEvaluations.slice(0, 5).map((ev) => ({
          label: ev.criterionId
            .replaceAll("_", " ")
            .replace(/\b\w/g, (c) => c.toUpperCase()),
          status: ev.status,
        }))
      : config.exitCriteria.map((c) => ({
          label: c,
          status: "unmet" as const,
        }));

  // Blocking gate count — hard gates not met/waived (for advance button)
  const blockingHardGates = isCurrentStage
    ? nextGateEvaluations.filter(
        (ev) =>
          ev.gateType === "hard" &&
          ev.status !== "met" &&
          ev.status !== "waived",
      ).length
    : 0;
  const allHardGatesClear =
    isCurrentStage && blockingHardGates === 0 && nextGateEvaluations.length > 0;

  // Artifact shelf — match live artifacts or fall back to config stubs
  const artifactShelf = config.artifactIds.map((id) => {
    const friendlyLabel = id
      .replaceAll("_", " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const live = event.artifacts.find(
      (a) =>
        a.id.includes(id) ||
        a.title.toLowerCase().replace(/\s+/g, "_").includes(id),
    );
    return {
      id,
      label: live?.title ?? friendlyLabel,
      status: live?.status ?? "not_started",
    };
  });
  const stageStatus =
    event.stages.find(
      (stage) => normalizeSourceStageKey(stage.key) === config.stageKey,
    )?.status ?? (isCurrentStage ? "active" : "not_started");
  const currentStageIndex = SOURCE_STAGE_ORDER.indexOf(
    normalizeSourceStageKey(event.currentStageKey) ?? event.currentStageKey,
  );
  const localStepRows = deriveLocalStepRows({
    steps: getStageLocalSteps(stageKey),
    artifactShelf,
    stageStatus,
    canonicalIndex,
    currentStageIndex,
  });
  const localStepCompleteCount = localStepRows.filter(
    (step) => step.state === "complete",
  ).length;
  const activeLocalStep =
    localStepRows.find((step) => step.state === "current") ??
    localStepRows.find((step) => step.state === "blocked") ??
    localStepRows[localStepRows.length - 1] ??
    null;

  const artifactCount = event.artifacts.length;
  const dataReadyCount = event.dataReadiness.filter(
    (item) =>
      item.readinessState === "Usable Evidence" ||
      item.readinessState === "Available",
  ).length;
  const dataTotalCount = event.dataReadiness.length;

  const continueChoice = config.choices[0];

  return (
    <section aria-label={`Stage canvas — ${stageLabel}`} style={STAGE_PANEL}>
      {/* Context bundle strip */}
      <div style={CONTEXT_STRIP}>
        <BundleToken
          value={
            event.name.length > 26 ? event.name.slice(0, 24) + "…" : event.name
          }
        />
        <BundleDot />
        <BundleToken value={`Step ${config.stepNumber} of ${totalSteps}`} />
        {dataTotalCount > 0 && (
          <>
            <BundleDot />
            <BundleToken value={`Data ${dataReadyCount}/${dataTotalCount}`} />
          </>
        )}
        {artifactCount > 0 && (
          <>
            <BundleDot />
            <BundleToken value={`${artifactCount} artifacts`} />
          </>
        )}
      </div>

      {/* Stage frame */}
      <div style={STAGE_FRAME}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 8,
          }}
        >
          <div>
            <div style={STAGE_EYEBROW}>
              Step {config.stepNumber} · {config.leadAgent}
            </div>
            <h2 style={STAGE_HEADING}>{stageLabel}</h2>
          </div>
          {isCurrentStage && (
            <span style={CURRENT_BADGE} aria-label="Current stage">
              Active
            </span>
          )}
        </div>
        <p style={STAGE_INTENT}>{config.intent}</p>
      </div>

      {/* Local stage workflow */}
      {localStepRows.length > 0 && (
        <div
          style={LOCAL_WORKFLOW_SECTION}
          data-testid="source-stage-local-workflow"
        >
          <div style={LOCAL_WORKFLOW_HEADER}>
            <div>
              <div style={SECTION_LABEL}>
                Stage workflow · {localStepCompleteCount}/{localStepRows.length}{" "}
                complete
              </div>
              {activeLocalStep ? (
                <div style={LOCAL_ACTIVE_HINT}>
                  Do now: {activeLocalStep.label}
                </div>
              ) : null}
            </div>
          </div>
          <div style={LOCAL_STEP_LIST}>
            {localStepRows.map((step, index) => (
              <div
                key={step.key}
                style={localStepStyle(step.state)}
                data-testid={`source-stage-local-step-${step.key}`}
                data-local-step-state={step.state}
              >
                <span style={localStepDotStyle(step.state)} aria-hidden="true">
                  {step.state === "complete" ? "✓" : String(index + 1)}
                </span>
                <span style={LOCAL_STEP_TEXT}>
                  <span style={LOCAL_STEP_LABEL}>{step.label}</span>
                  <span style={LOCAL_STEP_REQUIREMENT}>
                    {step.state === "complete" ? step.output : step.requirement}
                  </span>
                </span>
                <span style={localStepBadgeStyle(step.state)}>
                  {localStepStateLabel(step.state)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Entry criteria — previous stage's exit requirements */}
      {entryCriteria.length > 0 && (
        <details style={ENTRY_CRITERIA_SECTION}>
          <summary style={ENTRY_CRITERIA_SUMMARY}>
            Entry criteria — from {prevStageLabel ?? "previous stage"} (
            {entryCriteria.length})
          </summary>
          <div style={{ display: "grid", gap: 4, marginTop: 6 }}>
            {entryCriteria.map((criterion, index) => (
              <div key={index} style={ENTRY_CRITERION_ROW}>
                <span style={ENTRY_CRITERION_DOT} aria-hidden="true" />
                <span style={ENTRY_CRITERION_TEXT}>{criterion}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Gate criteria */}
      <div style={GATE_SECTION}>
        <div style={SECTION_LABEL}>
          {nextStageLabel
            ? `Gate — advance to ${nextStageLabel}`
            : "Completion criteria"}
        </div>
        <div style={{ display: "grid", gap: 6 }}>
          {gateCriteria.map((criterion, index) => (
            <div key={index} style={GATE_ROW}>
              <span
                style={gateStatusDot(criterion.status)}
                aria-hidden="true"
              />
              <span style={GATE_CRITERION_TEXT}>{criterion.label}</span>
              {criterion.status === "met" && <span style={MET_BADGE}>met</span>}
              {criterion.status === "waived" && (
                <span style={WAIVED_BADGE}>waived</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Deliverables & templates */}
      {artifactShelf.length > 0 && (
        <div style={ARTIFACT_SECTION}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={SECTION_LABEL}>
              Step deliverables · {artifactShelf.length} required
            </div>
            <button
              type="button"
              onClick={() => setShowDeliverables((prev) => !prev)}
              style={EXPAND_TOGGLE}
              aria-expanded={showDeliverables}
              aria-label="Toggle step deliverables"
            >
              {showDeliverables ? "Collapse ↑" : "Show templates ↓"}
            </button>
          </div>

          {/* Compact summary tiles (always visible) */}
          <div style={ARTIFACT_GRID}>
            {artifactShelf.map((artifact) => (
              <div key={artifact.id} style={ARTIFACT_TILE}>
                <span
                  style={artifactStatusDot(artifact.status)}
                  aria-hidden="true"
                />
                <div style={ARTIFACT_TILE_LABEL}>{artifact.label}</div>
                <div style={ARTIFACT_STATUS_TEXT}>
                  {artifact.status.replaceAll("_", " ")}
                </div>
              </div>
            ))}
          </div>

          {/* Expanded deliverables panel — template download + upload actions */}
          {showDeliverables && (
            <div
              style={DELIVERABLES_PANEL}
              role="region"
              aria-label="Step templates and upload"
            >
              <div style={DELIVERABLES_HEADER}>
                Templates provisioned for this step. Download blank → fill →
                upload completed.
              </div>
              <div style={{ display: "grid", gap: 7 }}>
                {artifactShelf.map((artifact) => {
                  const gapCount =
                    artifact.status === "not_started" ||
                    artifact.status === "needs_inputs"
                      ? 1
                      : 0;
                  return (
                    <div key={artifact.id} style={DELIVERABLE_ROW}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={DELIVERABLE_LABEL}>{artifact.label}</div>
                        <div style={ARTIFACT_STATUS_TEXT}>
                          {artifact.status.replaceAll("_", " ")}
                          {gapCount > 0 && (
                            <span style={GAP_BADGE}> · gap</span>
                          )}
                        </div>
                      </div>
                      <div style={DELIVERABLE_ACTIONS}>
                        <a
                          href={`/source/templates/${artifact.id}.docx`}
                          download
                          style={TEMPLATE_LINK}
                          aria-label={`Download blank ${artifact.label} template`}
                        >
                          Download ↓
                        </a>
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() =>
                            pageState?.ask(
                              `I need to upload a completed ${artifact.label} for ${stageLabel}. What format should it be, what must it contain, and how will aVa validate it?`,
                            )
                          }
                          style={{
                            ...UPLOAD_BUTTON,
                            opacity: disabled ? 0.6 : 1,
                            cursor: disabled ? "not-allowed" : "pointer",
                          }}
                          aria-label={`Ask agent how to upload ${artifact.label}`}
                        >
                          Upload guide
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Gap review prompt */}
              <button
                type="button"
                disabled={disabled}
                onClick={() =>
                  pageState?.ask(
                    `Review the deliverables gap for ${stageLabel}. For each required artifact, tell me: what's missing, who needs to provide it, what format it must be, and how will aVa validate it once uploaded.`,
                  )
                }
                style={{
                  ...GAP_REVIEW_BUTTON,
                  opacity: disabled ? 0.6 : 1,
                  cursor: disabled ? "not-allowed" : "pointer",
                }}
                aria-label={`Ask ${config.leadAgent} to review deliverables gaps`}
              >
                <span style={GAP_REVIEW_LABEL}>
                  Ask {config.leadAgent} · review all gaps →
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gate status + stage advance — only on current stage */}
      {isCurrentStage && (
        <div style={GATE_ADVANCE_SECTION}>
          {allHardGatesClear ? (
            <div
              style={GATE_CLEAR_BANNER}
              role="status"
              aria-label="All gate criteria met"
            >
              <span style={GATE_CLEAR_DOT} aria-hidden="true" />
              <span style={GATE_CLEAR_TEXT}>
                All hard gates met — ready to advance
              </span>
            </div>
          ) : blockingHardGates > 0 ? (
            <div
              style={GATE_BLOCKED_BANNER}
              role="status"
              aria-label={`${blockingHardGates} blocking gates`}
            >
              <span style={GATE_BLOCKED_DOT} aria-hidden="true" />
              <span style={GATE_BLOCKED_TEXT}>
                {blockingHardGates} blocking gate
                {blockingHardGates > 1 ? "s" : ""} — self-approve to override
              </span>
            </div>
          ) : null}
          <StageAdvanceButton
            eventId={event.id}
            currentStageKey={event.currentStageKey}
            blockingGateCount={blockingHardGates}
            blockingGateLabel={nextStageLabel ?? undefined}
          />
        </div>
      )}

      {/* Secondary action — ask lead agent */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => pageState?.ask(continueChoice.prompt)}
        style={{
          ...CONTINUE_BUTTON,
          opacity: disabled ? 0.6 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        aria-label={`Ask ${config.leadAgent}: ${continueChoice.label}`}
      >
        <span style={CONTINUE_AGENT}>Ask {config.leadAgent}</span>
        <span style={CONTINUE_LABEL}>{continueChoice.label} →</span>
      </button>
    </section>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function BundleToken({ value }: { value: string }) {
  return <span style={BUNDLE_TOKEN}>{value}</span>;
}

function BundleDot() {
  return (
    <span style={BUNDLE_DOT} aria-hidden="true">
      ·
    </span>
  );
}

function gateStatusDot(status: string): CSSProperties {
  const color =
    status === "met"
      ? SHELL.MINT_TEXT
      : status === "waived"
        ? SHELL.INK_MUTED
        : status === "partial"
          ? SHELL.AMBER_DOT
          : SHELL.PEACH_TEXT;
  return {
    display: "inline-block",
    width: 7,
    height: 7,
    borderRadius: "50%",
    background: color,
    flexShrink: 0,
    marginTop: 2,
  };
}

function artifactStatusDot(status: string): CSSProperties {
  const color =
    status === "approved" || status === "locked"
      ? SHELL.MINT_TEXT
      : status === "draft" || status === "needs_review"
        ? SHELL.AMBER_DOT
        : SHELL.GRAY_LINE;
  return {
    display: "block",
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: color,
    marginBottom: 4,
  };
}

type LocalStepDisplayState = "complete" | "current" | "pending" | "blocked";

interface LocalStepRow extends StageLocalStep {
  state: LocalStepDisplayState;
}

function deriveLocalStepRows(input: {
  steps: readonly StageLocalStep[];
  artifactShelf: Array<{ id: string; status: SourceArtifactStatus | string }>;
  stageStatus: SourceStageStatus;
  canonicalIndex: number;
  currentStageIndex: number;
}): LocalStepRow[] {
  const {
    steps,
    artifactShelf,
    stageStatus,
    canonicalIndex,
    currentStageIndex,
  } = input;

  if (steps.length === 0) return [];

  const stageIsOpen =
    stageStatus === "active" ||
    stageStatus === "blocked" ||
    stageStatus === "needs_approval" ||
    stageStatus === "reopened";

  if (
    stageStatus === "complete" ||
    (!stageIsOpen &&
      currentStageIndex >= 0 &&
      canonicalIndex >= 0 &&
      canonicalIndex < currentStageIndex)
  ) {
    return steps.map((step) => ({ ...step, state: "complete" }));
  }

  if (
    stageStatus === "not_started" ||
    (!stageIsOpen &&
      currentStageIndex >= 0 &&
      canonicalIndex > currentStageIndex)
  ) {
    return steps.map((step) => ({ ...step, state: "pending" }));
  }

  if (stageStatus === "needs_approval") {
    return steps.map((step, index) => ({
      ...step,
      state: index === steps.length - 1 ? "current" : "complete",
    }));
  }

  let openStepAssigned = false;
  return steps.map((step) => {
    const requiredArtifactIds = step.artifactIds ?? [];
    const allArtifactsAccepted =
      requiredArtifactIds.length > 0 &&
      requiredArtifactIds.every((artifactId) => {
        const artifact = artifactShelf.find((item) => item.id === artifactId);
        return artifact
          ? artifact.status === "approved" || artifact.status === "locked"
          : false;
      });

    if (allArtifactsAccepted) {
      return { ...step, state: "complete" };
    }

    if (!openStepAssigned) {
      openStepAssigned = true;
      return {
        ...step,
        state: stageStatus === "blocked" ? "blocked" : "current",
      };
    }

    return { ...step, state: "pending" };
  });
}

function localStepStateLabel(state: LocalStepDisplayState): string {
  if (state === "complete") return "done";
  if (state === "blocked") return "blocked";
  if (state === "current") return "now";
  return "next";
}

function localStepStyle(state: LocalStepDisplayState): CSSProperties {
  const active = state === "current" || state === "blocked";
  return {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    border: `1px solid ${
      state === "complete"
        ? SHELL.MINT_LINE
        : active
          ? SHELL.INK
          : SHELL.CARD_LINE
    }`,
    borderRadius: 9,
    background:
      state === "complete"
        ? SHELL.MINT_BG
        : active
          ? SHELL.CARD_WHITE
          : "rgba(255, 255, 255, 0.48)",
    padding: "7px 8px",
    opacity: state === "pending" ? 0.66 : 1,
  };
}

function localStepDotStyle(state: LocalStepDisplayState): CSSProperties {
  const active = state === "current" || state === "blocked";
  return {
    width: 18,
    height: 18,
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
    border: `1px solid ${
      state === "complete"
        ? SHELL.MINT_TEXT
        : active
          ? SHELL.INK
          : SHELL.GRAY_LINE
    }`,
    background:
      state === "complete"
        ? SHELL.MINT_TEXT
        : active
          ? SHELL.INK
          : SHELL.CARD_WHITE,
    color: state === "pending" ? SHELL.INK_MUTED : "#ffffff",
    fontFamily: SHELL.MONO,
    fontSize: 9,
    fontWeight: 800,
    lineHeight: 1,
  };
}

function localStepBadgeStyle(state: LocalStepDisplayState): CSSProperties {
  const active = state === "current" || state === "blocked";
  return {
    display: "inline-flex",
    alignItems: "center",
    flexShrink: 0,
    border: `1px solid ${
      state === "complete"
        ? SHELL.MINT_LINE
        : active
          ? SHELL.INK
          : SHELL.CARD_LINE
    }`,
    borderRadius: 4,
    background:
      state === "complete"
        ? SHELL.MINT_BG
        : active
          ? SHELL.INK
          : SHELL.PAPER_SOFT,
    padding: "2px 5px",
    fontFamily: SHELL.MONO,
    fontSize: 7.5,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color:
      state === "complete"
        ? SHELL.MINT_TEXT
        : active
          ? "#ffffff"
          : SHELL.INK_MUTED,
    fontWeight: 700,
  };
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const STAGE_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 16,
  background: `linear-gradient(145deg, ${SHELL.CARD_WHITE} 0%, ${SHELL.BLUE_BG} 100%)`,
  padding: "13px 14px",
  display: "grid",
  gap: 12,
  boxShadow: "0 14px 32px rgba(12, 26, 58, 0.06)",
};

const CONTEXT_STRIP: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 5,
  paddingBottom: 10,
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const BUNDLE_TOKEN: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const BUNDLE_DOT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  lineHeight: 1,
};

const STAGE_FRAME: CSSProperties = {
  display: "grid",
  gap: 7,
};

const STAGE_EYEBROW: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const STAGE_HEADING: CSSProperties = {
  margin: "2px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: 22,
  lineHeight: 1.1,
  color: SHELL.INK,
  letterSpacing: "-0.02em",
};

const STAGE_INTENT: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.48,
  color: SHELL.INK_SOFT,
};

const CURRENT_BADGE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 999,
  background: SHELL.MINT_BG,
  padding: "3px 9px",
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.MINT_TEXT,
  fontWeight: 700,
  whiteSpace: "nowrap",
};

const LOCAL_WORKFLOW_SECTION: CSSProperties = {
  display: "grid",
  gap: 8,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: "rgba(253, 251, 246, 0.72)",
  padding: "10px 11px",
};

const LOCAL_WORKFLOW_HEADER: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 10,
};

const LOCAL_ACTIVE_HINT: CSSProperties = {
  marginTop: 4,
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.35,
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const LOCAL_STEP_LIST: CSSProperties = {
  display: "grid",
  gap: 6,
};

const LOCAL_STEP_TEXT: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: "grid",
  gap: 2,
};

const LOCAL_STEP_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.24,
  color: SHELL.INK,
  fontWeight: 700,
};

const LOCAL_STEP_REQUIREMENT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 10.6,
  lineHeight: 1.32,
  color: SHELL.INK_MUTED,
};

const GATE_SECTION: CSSProperties = {
  display: "grid",
  gap: 8,
};

const SECTION_LABEL: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
};

const GATE_ROW: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 7,
};

const GATE_CRITERION_TEXT: CSSProperties = {
  flex: 1,
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  lineHeight: 1.38,
  color: SHELL.INK_SOFT,
};

const MET_BADGE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 4,
  background: SHELL.MINT_BG,
  padding: "1px 5px",
  fontFamily: SHELL.MONO,
  fontSize: 7.5,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: SHELL.MINT_TEXT,
  fontWeight: 700,
  flexShrink: 0,
};

const WAIVED_BADGE: CSSProperties = {
  ...MET_BADGE,
  border: `1px solid ${SHELL.GRAY_LINE}`,
  background: SHELL.GRAY_BG,
  color: SHELL.GRAY_TEXT,
};

const ARTIFACT_SECTION: CSSProperties = {
  display: "grid",
  gap: 8,
};

const ARTIFACT_GRID: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 100px), 1fr))",
  gap: 7,
};

const ARTIFACT_TILE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 10,
  background: "rgba(253, 251, 246, 0.82)",
  padding: "7px 9px",
};

const ARTIFACT_TILE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 10.5,
  lineHeight: 1.3,
  color: SHELL.INK,
  fontWeight: 700,
};

const ARTIFACT_STATUS_TEXT: CSSProperties = {
  marginTop: 3,
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: "0.06em",
  color: SHELL.INK_MUTED,
};

const CONTINUE_BUTTON: CSSProperties = {
  appearance: "none",
  border: `1px solid ${SHELL.INK}`,
  borderRadius: 10,
  background: SHELL.INK,
  padding: "9px 12px",
  font: "inherit",
  textAlign: "left",
  display: "flex",
  flexDirection: "column",
  gap: 2,
};

const CONTINUE_AGENT: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.6)",
  fontWeight: 700,
};

const CONTINUE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  color: "#ffffff",
  fontWeight: 700,
};

const EXPAND_TOGGLE: CSSProperties = {
  appearance: "none",
  background: "none",
  border: "none",
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  cursor: "pointer",
  padding: "2px 0",
};

const DELIVERABLES_PANEL: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: "10px 11px",
  display: "grid",
  gap: 10,
};

const DELIVERABLES_HEADER: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  lineHeight: 1.38,
  color: SHELL.INK_MUTED,
};

const DELIVERABLE_ROW: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 8,
  paddingBottom: 7,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
};

const DELIVERABLE_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.8,
  color: SHELL.INK,
  fontWeight: 700,
  lineHeight: 1.3,
};

const DELIVERABLE_ACTIONS: CSSProperties = {
  display: "flex",
  gap: 5,
  flexShrink: 0,
};

const TEMPLATE_LINK: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 6,
  background: SHELL.PAPER_SOFT,
  padding: "3px 7px",
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.08em",
  color: SHELL.INK_SOFT,
  textDecoration: "none",
  fontWeight: 600,
};

const UPLOAD_BUTTON: CSSProperties = {
  appearance: "none",
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${SHELL.BLUE_LINE}`,
  borderRadius: 6,
  background: SHELL.BLUE_BG,
  padding: "3px 7px",
  fontFamily: SHELL.MONO,
  fontSize: 8.5,
  letterSpacing: "0.08em",
  color: SHELL.INK_SOFT,
  font: "inherit",
};

const GAP_BADGE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 8,
  letterSpacing: "0.08em",
  color: SHELL.PEACH_TEXT,
  fontWeight: 700,
};

const GAP_REVIEW_BUTTON: CSSProperties = {
  appearance: "none",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.PAPER_SOFT,
  padding: "7px 10px",
  font: "inherit",
  textAlign: "left",
  width: "100%",
};

const GAP_REVIEW_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: SHELL.INK_SOFT,
  fontWeight: 600,
};

const GATE_ADVANCE_SECTION: CSSProperties = {
  display: "grid",
  gap: 8,
};

const GATE_CLEAR_BANNER: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: "rgba(52,199,89,0.08)",
  border: "1px solid rgba(52,199,89,0.28)",
  borderRadius: 8,
  padding: "7px 11px",
};

const GATE_CLEAR_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#34C759",
  flexShrink: 0,
  display: "inline-block",
};

const GATE_CLEAR_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: "#1a7a38",
  fontWeight: 600,
};

const GATE_BLOCKED_BANNER: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  background: "rgba(255,149,0,0.07)",
  border: "1px solid rgba(255,149,0,0.28)",
  borderRadius: 8,
  padding: "7px 11px",
};

const GATE_BLOCKED_DOT: CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: "50%",
  background: "#FF9500",
  flexShrink: 0,
  display: "inline-block",
};

const GATE_BLOCKED_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11.5,
  color: "#7a4a00",
  fontWeight: 600,
};

const ENTRY_CRITERIA_SECTION: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: "6px 10px",
  background: SHELL.PAPER_SOFT,
};

const ENTRY_CRITERIA_SUMMARY: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: SHELL.INK_MUTED,
  fontWeight: 700,
  cursor: "pointer",
  listStyle: "none",
};

const ENTRY_CRITERION_ROW: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 6,
};

const ENTRY_CRITERION_DOT: CSSProperties = {
  width: 5,
  height: 5,
  borderRadius: "50%",
  background: SHELL.INK_MUTED,
  flexShrink: 0,
  marginTop: 4,
  display: "inline-block",
};

const ENTRY_CRITERION_TEXT: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  color: SHELL.INK_MUTED,
  lineHeight: 1.4,
};
