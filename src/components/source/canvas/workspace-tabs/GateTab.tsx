import { useState, type CSSProperties } from "react";
import {
  criterionById,
  type SourceGateCriterion,
} from "@/lib/source/canonical-specs";
import type {
  SourceEventGateCriterion,
  SourceEventGateCriterionState,
} from "@/lib/source/canvas-substrate";
import {
  AUTO_EVIDENCE_REVIEWER_ID,
  isAssessmentMet,
  type GateAssessment,
  type GateCriterionAssessment,
  type StageRecommendation,
} from "@/lib/source/gate-auto-assessment";
import { SOURCE_STAGE_LABELS } from "@/lib/source/constants";
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

const STATE_LABEL: Record<SourceEventGateCriterionState, string> = {
  pending: "Pending",
  met: "Met",
  not_met: "Not met",
  waived: "Waived",
  deferred: "Deferred",
};

interface GateTabProps {
  fromStage: SourceStageKey;
  /** Per-event criterion states for this from-stage. */
  states: SourceEventGateCriterion[];
  assessment?: GateAssessment;
  recommendation?: StageRecommendation;
  /** Mutator — when omitted (SSR / read-only previews) the per-row
   * Mark met / Reopen buttons hide. */
  onChangeCriterionState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
    reason: string,
  ) => Promise<void>;
  /** Per-criterion pending flag — disables the button while in flight. */
  pendingByCriterionId?: Record<string, boolean>;
  /** Promote handler. Called when "Promote to {next}" is clicked
   * with all criteria met. Receives the target stage key. */
  onPromoteStage?: (toStage: SourceStageKey, reason: string) => Promise<void>;
  /** Disable the promote button while a promote is in flight. */
  promotePending?: boolean;
}

/**
 * Gate tab — criteria checklist for advancing from this stage to the next.
 * Reads from the canonical SourceGateCriterion catalog (titles, severity,
 * owner, linked artifacts) and overlays per-event state from
 * source_event_gate_criterion_states.
 */
export function GateTab({
  fromStage,
  states,
  assessment,
  recommendation,
  onChangeCriterionState,
  pendingByCriterionId,
  onPromoteStage,
  promotePending,
}: GateTabProps) {
  const [promotionReason, setPromotionReason] = useState("");
  const [gapsPending, setGapsPending] = useState(false);
  const ordered = [...states].sort((a, b) =>
    a.criterionId.localeCompare(b.criterionId),
  );
  const assessmentById = new Map(
    (assessment?.criteria ?? []).map((criterion) => [
      criterion.criterionId,
      criterion,
    ]),
  );
  const total = ordered.length;
  const met = ordered.filter((s) => {
    const assessed = assessmentById.get(s.criterionId);
    return assessed
      ? isAssessmentMet(assessed)
      : s.state === "met" || s.state === "waived";
  }).length;
  const allMet = total > 0 && met === total;
  const targetStage = ordered[0]?.toStage ?? null;
  const targetLabel =
    targetStage && targetStage !== "closed"
      ? SOURCE_STAGE_LABELS[targetStage as SourceStageKey]
      : "Closed";

  // B3 — explicit blocker summary. List the criteria that are
  // actually preventing promotion (pending / not_met) with their
  // titles, so the user has a diagnosis instead of a disabled button.
  const blockers = ordered
    .filter((s) => {
      const assessed = assessmentById.get(s.criterionId);
      return assessed
        ? !isAssessmentMet(assessed)
        : s.state !== "met" && s.state !== "waived";
    })
    .map((s) => ({
      state: s,
      def: criterionById(s.criterionId),
      assessment: assessmentById.get(s.criterionId),
    }));
  const promoteHelpId = "source-canvas-gate-promote-help";
  const promotionReasonReady =
    promotionReason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH;
  const canPromote =
    allMet &&
    promotionReasonReady &&
    Boolean(onPromoteStage) &&
    Boolean(targetStage) &&
    targetStage !== "closed" &&
    !promotePending;

  // Approve with gaps — the Maestro path. Open items are deferred with the
  // approver's rationale (recorded per criterion) and carried forward; the
  // stage then advances. Gaps are never hidden, and a rationale is required.
  const canApproveWithGaps =
    !allMet &&
    total > 0 &&
    promotionReasonReady &&
    Boolean(onPromoteStage) &&
    Boolean(onChangeCriterionState) &&
    Boolean(targetStage) &&
    targetStage !== "closed" &&
    !promotePending &&
    !gapsPending;

  const approveWithGaps = async () => {
    if (
      !canApproveWithGaps ||
      !onPromoteStage ||
      !onChangeCriterionState ||
      !targetStage
    )
      return;
    const reason = promotionReason.trim();
    setGapsPending(true);
    try {
      for (const b of blockers) {
        await onChangeCriterionState(
          b.state.criterionId,
          "deferred",
          `Approved with gaps: ${reason}`,
        );
      }
      await onPromoteStage(
        targetStage as SourceStageKey,
        `Approved with gaps: ${reason}`,
      );
    } finally {
      setGapsPending(false);
    }
  };

  const openCount = total - met;
  const promotionControls = (
    <>
      <label
        style={REASON_LABEL_STYLE}
        htmlFor="source-canvas-gate-promote-reason"
      >
        Promotion reason
      </label>
      <textarea
        id="source-canvas-gate-promote-reason"
        data-testid="source-canvas-gate-promote-reason"
        value={promotionReason}
        onChange={(event) => setPromotionReason(event.target.value)}
        placeholder="Record the human reason for advancing this sourcing stage."
        rows={3}
        style={REASON_TEXTAREA_STYLE}
      />
      <button
        type="button"
        disabled={!canPromote}
        aria-describedby={!allMet && total > 0 ? promoteHelpId : undefined}
        onClick={() => {
          if (canPromote && onPromoteStage && targetStage) {
            void onPromoteStage(
              targetStage as SourceStageKey,
              promotionReason.trim(),
            );
          }
        }}
        style={{
          ...PROMOTE_BUTTON_STYLE,
          background: canPromote ? CANVAS.INK : "rgba(10,10,11,0.08)",
          color: canPromote ? "#fff" : CANVAS.INK_MUTED,
          cursor: canPromote ? "pointer" : "not-allowed",
          opacity: promotePending ? 0.7 : 1,
        }}
        data-testid="source-canvas-gate-promote"
      >
        {promotePending
          ? "Promoting..."
          : `Approve & advance to ${targetLabel}`}
      </button>
      {!allMet && total > 0 && onChangeCriterionState && onPromoteStage ? (
        <button
          type="button"
          disabled={!canApproveWithGaps}
          onClick={() => void approveWithGaps()}
          style={{
            ...PROMOTE_BUTTON_STYLE,
            background: "transparent",
            border: `1px solid ${canApproveWithGaps ? CANVAS.INK : "rgba(10,10,11,0.15)"}`,
            color: canApproveWithGaps ? CANVAS.INK : CANVAS.INK_MUTED,
            cursor: canApproveWithGaps ? "pointer" : "not-allowed",
            opacity: gapsPending ? 0.7 : 1,
            marginTop: 8,
          }}
          data-testid="source-canvas-gate-approve-with-gaps"
        >
          {gapsPending
            ? "Approving with gaps..."
            : `Advance with ${openCount} open`}
        </button>
      ) : null}
      {!promotionReasonReady ? (
        <p style={{ ...SUBLINE_STYLE, marginTop: 6 }}>
          Add your reason above to enable approval
          {` (min ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters)`}.
        </p>
      ) : null}
    </>
  );

  return (
    <div data-testid="source-canvas-gate-tab" style={CONTAINER_STYLE}>
      <header style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>
            Gate · {SOURCE_STAGE_LABELS[fromStage]} → {targetLabel}
          </div>
          <h2 style={TITLE_STYLE}>
            {allMet
              ? `${SOURCE_STAGE_LABELS[fromStage]} inputs are ready`
              : `${SOURCE_STAGE_LABELS[fromStage]} needs ${openCount} ${openCount === 1 ? "input" : "inputs"}`}
          </h2>
          {!allMet && total > 0 ? (
            <p style={SUBLINE_STYLE}>
              Add the missing files or confirm the evidence before moving to{" "}
              {targetLabel}. Audit details stay available below, but the work
              list only shows what to do next.
            </p>
          ) : null}
          {allMet ? (
            <p style={SUBLINE_STYLE}>
              All inputs are ready. Write the reason and approve; the event advances
              to {targetLabel}.
            </p>
          ) : null}
        </div>
        {allMet ? (
          <div style={PROMOTE_CONTROL_STYLE}>{promotionControls}</div>
        ) : (
          <details style={ADVANCE_DETAILS_STYLE}>
            <summary style={ADVANCE_SUMMARY_STYLE}>Advance anyway</summary>
            <div style={{ ...PROMOTE_CONTROL_STYLE, marginTop: 10 }}>
              {promotionControls}
            </div>
          </details>
        )}
      </header>

      {recommendation ? (
        <StageDecisionStatusPanel recommendation={recommendation} />
      ) : null}

      {/* Compact fallback summary only when the stage-status panel is unavailable. */}
      {!recommendation && !allMet && blockers.length > 0 ? (
        <div
          id={promoteHelpId}
          data-testid="source-canvas-gate-blockers"
          style={BLOCKERS_STYLE}
          role="status"
        >
          <div style={BLOCKERS_TITLE_STYLE}>
            {blockers.length} {blockers.length === 1 ? "input" : "inputs"}{" "}
            still needed
          </div>
          <ul style={BLOCKERS_LIST_STYLE}>
            {blockers.map(({ state, def, assessment: criterionAssessment }) => (
              <li
                key={state.criterionId}
                style={BLOCKERS_LIST_ITEM_STYLE}
                data-testid={`source-canvas-gate-blocker-${state.criterionId}`}
              >
                <span style={BLOCKERS_BULLET_STYLE}>·</span>
                <span>
                  <span style={BLOCKERS_ITEM_TITLE_STYLE}>
                    {def?.title ?? state.criterionId}
                  </span>
                  <span style={BLOCKERS_STATE_STYLE}>
                    {" — "}
                    {criterionAssessment?.reason ?? STATE_LABEL[state.state]}
                    {def?.linkedArtifactCodes &&
                    def.linkedArtifactCodes.length > 0
                      ? ` · evidence ${def.linkedArtifactCodes.join(", ")}`
                      : ""}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {total === 0 ? (
        <p style={EMPTY_BODY_STYLE}>
          No gate criteria defined for this stage transition.
        </p>
      ) : (
        <>
          <RequiredInputsList
            items={ordered.map((state) => ({
              state,
              def: criterionById(state.criterionId),
              assessment: assessmentById.get(state.criterionId),
            }))}
          />
          <details
            data-testid="source-canvas-gate-advanced-details"
            style={ADVANCED_GATE_DETAILS_STYLE}
          >
            <summary style={ADVANCE_SUMMARY_STYLE}>
              Advanced gate details
            </summary>
            <ul style={{ ...LIST_STYLE, marginTop: 12 }}>
              {ordered.map((s) => {
                const def = criterionById(s.criterionId);
                return (
                  <CriterionRow
                    key={s.criterionId}
                    state={s}
                    def={def}
                    assessment={assessmentById.get(s.criterionId)}
                    onChangeState={onChangeCriterionState}
                    pending={pendingByCriterionId?.[s.criterionId] ?? false}
                  />
                );
              })}
            </ul>
          </details>
        </>
      )}
    </div>
  );
}

interface CriterionRowProps {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  assessment?: GateCriterionAssessment;
  onChangeState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
    reason: string,
  ) => Promise<void>;
  pending: boolean;
}

interface RequiredInputItem {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  assessment?: GateCriterionAssessment;
}

function RequiredInputsList({ items }: { items: RequiredInputItem[] }) {
  return (
    <section
      aria-label="Required inputs"
      data-testid="source-gate-required-inputs"
      style={REQUIRED_INPUTS_STYLE}
    >
      <div style={REQUIRED_INPUTS_HEADER_STYLE}>
        <span>Input</span>
        <span>Status</span>
      </div>
      {items.map((item) => {
        const status = requiredInputStatus(item);
        const tone = requiredInputTone(status);
        return (
          <div
            key={item.state.criterionId}
            style={REQUIRED_INPUT_ROW_STYLE}
            data-testid={`source-gate-required-input-${item.state.criterionId}`}
          >
            <div style={REQUIRED_INPUT_BODY_STYLE}>
              <div style={REQUIRED_INPUT_TITLE_STYLE}>
                {item.def?.title ?? item.state.criterionId}
              </div>
              <div style={REQUIRED_INPUT_HINT_STYLE}>
                {requiredInputHint(item)}
              </div>
            </div>
            <span
              style={{
                ...REQUIRED_INPUT_STATUS_STYLE,
                background: tone.bg,
                borderColor: tone.border,
                color: tone.fg,
              }}
            >
              {status}
            </span>
          </div>
        );
      })}
    </section>
  );
}

function requiredInputStatus(item: RequiredInputItem): string {
  if (item.assessment) {
    switch (item.assessment.displayState) {
      case "met_auto_evidence":
      case "met_manual":
      case "waived":
        return "Ready";
      case "pending_review":
        return "Review";
      case "deferred_manual":
        return "Deferred";
      case "not_met_manual":
        return "Needs work";
      case "blocked_evidence":
      default:
        return "Missing";
    }
  }
  switch (item.state.state) {
    case "met":
    case "waived":
      return "Ready";
    case "not_met":
      return "Needs work";
    case "deferred":
      return "Deferred";
    case "pending":
    default:
      return "Missing";
  }
}

function requiredInputHint(item: RequiredInputItem): string {
  const missingEvidence =
    item.assessment?.evidence
      .filter((match) => !match.satisfied)
      .map((match) => match.label) ?? [];
  const readyEvidence =
    item.assessment?.evidence
      .filter((match) => match.satisfied)
      .map((match) => match.label) ?? [];

  if (missingEvidence.length > 0) {
    return `Add or parse: ${missingEvidence.join(", ")}.`;
  }
  if (readyEvidence.length > 0) {
    return `Evidence ready: ${readyEvidence.join(", ")}.`;
  }
  if (item.assessment?.displayState === "pending_review") {
    return "Confirm the evidence with the named owner.";
  }
  if (item.state.state === "met") {
    return item.state.reviewerUserId === AUTO_EVIDENCE_REVIEWER_ID
      ? "AbarVa matched this from parsed evidence."
      : "Confirmed by a user.";
  }
  if (item.def?.description) {
    return item.def.description;
  }
  return "Upload the source file or confirm this input.";
}

function requiredInputTone(status: string): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (status) {
    case "Ready":
      return {
        bg: "rgba(46,125,50,0.08)",
        fg: "#2E7D32",
        border: "rgba(46,125,50,0.24)",
      };
    case "Review":
      return {
        bg: "rgba(57,96,168,0.08)",
        fg: "#315A9D",
        border: "rgba(57,96,168,0.24)",
      };
    case "Deferred":
    case "Needs work":
      return {
        bg: "rgba(186,117,23,0.08)",
        fg: "#A66400",
        border: "rgba(186,117,23,0.24)",
      };
    case "Missing":
    default:
      return {
        bg: "rgba(184,91,0,0.08)",
        fg: "#A65300",
        border: "rgba(184,91,0,0.24)",
      };
  }
}

function CriterionRow({
  state,
  def,
  assessment,
  onChangeState,
  pending,
}: CriterionRowProps) {
  const [reason, setReason] = useState("");
  const autoEvidenceReviewed =
    state.reviewerUserId === AUTO_EVIDENCE_REVIEWER_ID;
  const isMet = assessment
    ? isAssessmentMet(assessment)
    : state.state === "met" || state.state === "waived";
  const indicatorColor = isMet
    ? CANVAS.ACTIVE
    : state.state === "not_met"
      ? CANVAS.BLOCKED
      : state.state === "deferred"
        ? CANVAS.WAITING
        : CANVAS.GRAY;

  const isMetOrWaived = state.state === "met" || state.state === "waived";
  const reasonReady = reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH;
  return (
    <li
      style={ROW_STYLE}
      data-testid={`source-canvas-gate-criterion-${state.criterionId}`}
    >
      <span aria-hidden style={{ ...DOT_STYLE, background: indicatorColor }} />
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          <span style={ROW_TITLE_TEXT}>{def?.title ?? state.criterionId}</span>
          <StatePill state={state.state} />
          {assessment ? <AssessmentBadge assessment={assessment} /> : null}
          {onChangeState && state.state !== "waived" ? (
            isMetOrWaived ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => onChangeState(state.criterionId, "pending", "")}
                data-testid={`source-canvas-gate-criterion-reopen-${state.criterionId}`}
                style={{
                  ...ROW_GHOST_BUTTON_STYLE,
                  opacity: pending ? 0.55 : 1,
                }}
              >
                {pending ? "Reopening…" : "Reopen"}
              </button>
            ) : (
              null
            )
          ) : null}
        </div>
        {!isMetOrWaived && onChangeState ? (
          <details style={ROW_DISCLOSURE_STYLE}>
            <summary style={ROW_DISCLOSURE_SUMMARY_STYLE}>
              Confirm manually
            </summary>
            <div style={ROW_REASON_WRAP_STYLE}>
              <label style={REASON_LABEL_STYLE}>
                Approval reason
                <textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={2}
                  placeholder="Explain what evidence you reviewed and why this input is ready."
                  data-testid={`source-canvas-gate-criterion-reason-${state.criterionId}`}
                  style={{ ...REASON_TEXTAREA_STYLE, marginTop: 5 }}
                />
              </label>
              <button
                type="button"
                disabled={pending || !reasonReady}
                onClick={() =>
                  onChangeState(state.criterionId, "met", reason.trim())
                }
                data-testid={`source-canvas-gate-criterion-mark-met-${state.criterionId}`}
                style={{
                  ...ROW_PRIMARY_BUTTON_STYLE,
                  marginLeft: 0,
                  opacity: pending || !reasonReady ? 0.55 : 1,
                }}
              >
                {pending ? "Saving…" : "Confirm input"}
              </button>
            </div>
          </details>
        ) : null}
        {isMetOrWaived && state.reviewedAt ? (
          <div
            style={ROW_AUDIT_STYLE}
            data-testid={`source-canvas-gate-criterion-audit-${state.criterionId}`}
          >
            {autoEvidenceReviewed
              ? "Auto-assessed by AbarVa evidence"
              : `Approved by ${state.reviewerUserId ?? "recorded user"}`}{" "}
            ·{" "}
            {formatAuditTimestamp(state.reviewedAt)}
            {state.notes ? ` · Reason: ${state.notes}` : ""}
          </div>
        ) : null}
        {def?.description ? (
          <div style={ROW_DESC_STYLE}>{def.description}</div>
        ) : null}
        {assessment?.evidence.length ? (
          <div
            style={EVIDENCE_MATCH_STYLE}
            data-testid={`source-canvas-gate-criterion-evidence-${state.criterionId}`}
          >
            {assessment.evidence.map((match) => (
              <span key={match.requirementId}>
                {match.label} is {match.currentState}
                {match.satisfied ? " · ready" : ` · needs ${match.minimumState}`}
              </span>
            ))}
          </div>
        ) : null}
        <details style={AUDIT_DISCLOSURE_STYLE}>
          <summary style={AUDIT_DISCLOSURE_SUMMARY_STYLE}>Audit details</summary>
          <div style={ROW_META_STYLE}>
            <span style={CRITERION_CODE}>{state.criterionId}</span>
            {def?.ownerRole ? (
              <>
                <span style={DOT_INLINE_STYLE}>·</span>
                <span>Owner: {def.ownerRole.replace(/-/g, " ")}</span>
              </>
            ) : null}
            {def?.linkedArtifactCodes && def.linkedArtifactCodes.length > 0 ? (
              <>
                <span style={DOT_INLINE_STYLE}>·</span>
                <span>Evidence: {def.linkedArtifactCodes.join(", ")}</span>
              </>
            ) : null}
          </div>
        </details>
      </div>
    </li>
  );
}

function StageDecisionStatusPanel({
  recommendation,
}: {
  recommendation: StageRecommendation;
}) {
  const tone = recommendationTone(recommendation.status);
  return (
    <section
      data-testid="source-stage-decision-status"
      style={{
        ...DECISION_STATUS_STYLE,
        borderColor: tone.border,
        background: tone.bg,
      }}
      aria-label="Stage inputs"
    >
      <div style={DECISION_STATUS_HEADER_STYLE}>
        <span style={EYEBROW_STYLE}>Stage inputs</span>
        <span style={{ ...DECISION_STATUS_PILL_STYLE, color: tone.fg }}>
          {stageStatusLabel(recommendation.status)}
        </span>
      </div>
      <div style={DECISION_STATUS_METRIC_STYLE}>
        {recommendation.requiredMet} ready ·{" "}
        {recommendation.requiredTotal - recommendation.requiredMet} still needed
      </div>
      <div style={DECISION_REASON_STYLE}>{stageStatusIntro(recommendation)}</div>
    </section>
  );
}

function AssessmentBadge({
  assessment,
}: {
  assessment: GateCriterionAssessment;
}) {
  const label = assessmentBadgeLabel(assessment);
  const tone = assessmentBadgeTone(assessment);
  return (
    <span
      data-testid={`source-canvas-gate-criterion-assessment-${assessment.criterionId}`}
      title={assessment.reason}
      style={{
        ...ASSESSMENT_BADGE_STYLE,
        background: tone.bg,
        borderColor: tone.border,
        color: tone.fg,
      }}
    >
      {label}
    </span>
  );
}

function formatAuditTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function assessmentBadgeLabel(assessment: GateCriterionAssessment): string {
  switch (assessment.displayState) {
    case "met_auto_evidence":
      return "Ready";
    case "blocked_evidence":
      return "Missing input";
    case "pending_review":
      return "Review needed";
    case "met_manual":
      return "Confirmed";
    case "not_met_manual":
      return "Needs work";
    case "waived":
      return "Waived";
    case "deferred_manual":
      return "Deferred";
  }
}

function assessmentBadgeTone(assessment: GateCriterionAssessment): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (assessment.displayState) {
    case "met_auto_evidence":
      return {
        bg: "rgba(46,125,50,0.08)",
        fg: "#2E7D32",
        border: "rgba(46,125,50,0.28)",
      };
    case "blocked_evidence":
      return {
        bg: "rgba(184,91,0,0.08)",
        fg: "#A65300",
        border: "rgba(184,91,0,0.24)",
      };
    case "pending_review":
      return {
        bg: "rgba(57,96,168,0.08)",
        fg: "#315A9D",
        border: "rgba(57,96,168,0.24)",
      };
    default:
      return {
        bg: "rgba(10,10,11,0.05)",
        fg: CANVAS.INK_SOFT,
        border: "rgba(10,10,11,0.16)",
      };
  }
}

function stageStatusLabel(status: StageRecommendation["status"]): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "ready_with_warnings":
      return "Ready with warnings";
    case "needs_review":
      return "Review needed";
    case "blocked":
    default:
      return "Inputs needed";
  }
}

function stageStatusIntro(recommendation: StageRecommendation): string {
  switch (recommendation.status) {
    case "ready":
      return "All required inputs are ready for this stage.";
    case "ready_with_warnings":
      return "Required inputs are ready; review the open advisory items before advancing.";
    case "needs_review":
      return "Some inputs are ready from evidence and need a quick human review.";
    case "blocked":
    default:
      return "Load or confirm the missing inputs before moving to the next stage.";
  }
}

function recommendationTone(status: StageRecommendation["status"]): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (status) {
    case "ready":
      return {
        bg: "rgba(46,125,50,0.08)",
        fg: "#2E7D32",
        border: "rgba(46,125,50,0.24)",
      };
    case "ready_with_warnings":
      return {
        bg: "rgba(186,117,23,0.08)",
        fg: "#A66400",
        border: "rgba(186,117,23,0.24)",
      };
    case "needs_review":
      return {
        bg: "rgba(57,96,168,0.08)",
        fg: "#315A9D",
        border: "rgba(57,96,168,0.24)",
      };
    case "blocked":
    default:
      return {
        bg: "rgba(184,91,0,0.08)",
        fg: "#A65300",
        border: "rgba(184,91,0,0.24)",
      };
  }
}

function StatePill({ state }: { state: SourceEventGateCriterionState }) {
  const tone = stateTone(state);
  return (
    <span
      data-testid={`source-canvas-gate-criterion-state-${state}`}
      style={{
        ...STATE_PILL_STYLE,
        background: tone.bg,
        color: tone.fg,
        borderColor: tone.border,
      }}
    >
      {state === "pending" ? "Needed" : STATE_LABEL[state]}
    </span>
  );
}

function stateTone(state: SourceEventGateCriterionState): {
  bg: string;
  fg: string;
  border: string;
} {
  switch (state) {
    case "met":
      return {
        bg: "rgba(46,125,50,0.10)",
        fg: "#2E7D32",
        border: "rgba(46,125,50,0.32)",
      };
    case "not_met":
      return {
        bg: "rgba(211,84,0,0.10)",
        fg: "#B85B00",
        border: "rgba(211,84,0,0.30)",
      };
    case "deferred":
      return {
        bg: "rgba(186,117,23,0.10)",
        fg: "#A66400",
        border: "rgba(186,117,23,0.30)",
      };
    case "waived":
      return {
        bg: "rgba(10,10,11,0.06)",
        fg: CANVAS.INK,
        border: "rgba(10,10,11,0.22)",
      };
    case "pending":
    default:
      return {
        bg: "rgba(10,10,11,0.04)",
        fg: CANVAS.INK_SOFT,
        border: "rgba(10,10,11,0.14)",
      };
  }
}

const CONTAINER_STYLE: CSSProperties = {
  display: "grid",
  gap: 24,
  maxWidth: 880,
};

const HEADER_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto",
  alignItems: "end",
  gap: 16,
  paddingBottom: 16,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  marginBottom: 6,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: "-0.015em",
  color: CANVAS.INK,
  margin: 0,
  lineHeight: 1.2,
};

const SUBLINE_STYLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
};

const PROMOTE_BUTTON_STYLE: CSSProperties = {
  padding: "10px 16px",
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "none",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 500,
  whiteSpace: "nowrap",
  alignSelf: "center",
};

const PROMOTE_CONTROL_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  minWidth: 260,
  maxWidth: 320,
};

const ADVANCE_DETAILS_STYLE: CSSProperties = {
  justifySelf: "end",
  minWidth: 220,
  maxWidth: 320,
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  background: "#ffffff",
  padding: "10px 12px",
};

const ADVANCE_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: CANVAS.INK,
  width: "fit-content",
};

const REASON_LABEL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  fontWeight: 700,
};

const REASON_TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  boxSizing: "border-box",
  resize: "vertical",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  padding: "8px 10px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  lineHeight: 1.45,
  color: CANVAS.INK,
  background: "#ffffff",
};

const LIST_STYLE: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 0,
};

const REQUIRED_INPUTS_STYLE: CSSProperties = {
  display: "grid",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: CANVAS.RADIUS_TIGHT,
  overflow: "hidden",
  background: "#ffffff",
};

const REQUIRED_INPUTS_HEADER_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 120px",
  gap: 16,
  padding: "10px 14px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  background: "rgba(10,10,11,0.02)",
};

const REQUIRED_INPUT_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) 120px",
  alignItems: "center",
  gap: 16,
  padding: "13px 14px",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const REQUIRED_INPUT_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 3,
  minWidth: 0,
};

const REQUIRED_INPUT_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 650,
  color: CANVAS.INK,
  lineHeight: 1.3,
};

const REQUIRED_INPUT_HINT_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12.5,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.35,
};

const REQUIRED_INPUT_STATUS_STYLE: CSSProperties = {
  justifySelf: "start",
  border: "1px solid transparent",
  borderRadius: 999,
  padding: "5px 9px",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: 1,
};

const ADVANCED_GATE_DETAILS_STYLE: CSSProperties = {
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
  paddingTop: 10,
};

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 14,
  padding: "14px 0",
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const DOT_STYLE: CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: 999,
  marginTop: 5,
  flexShrink: 0,
};

const ROW_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const ROW_REASON_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 5,
  maxWidth: 540,
  marginTop: 4,
};

const ROW_DISCLOSURE_STYLE: CSSProperties = {
  marginTop: 6,
};

const ROW_DISCLOSURE_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  width: "fit-content",
};

const ROW_AUDIT_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  lineHeight: 1.5,
  color: CANVAS.GRAY_DK,
};

const ROW_TITLE_TEXT: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 14,
  fontWeight: 600,
  color: CANVAS.INK,
};

const ROW_DESC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.5,
  color: CANVAS.INK_SOFT,
};

const ROW_META_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.04em",
  color: CANVAS.GRAY_DK,
  flexWrap: "wrap",
};

const AUDIT_DISCLOSURE_STYLE: CSSProperties = {
  marginTop: 4,
};

const AUDIT_DISCLOSURE_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.GRAY_DK,
  width: "fit-content",
};

const CRITERION_CODE: CSSProperties = {
  fontWeight: 600,
  color: CANVAS.INK_SOFT,
};

const DOT_INLINE_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
};

const DECISION_STATUS_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "12px 14px",
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: "1px solid transparent",
};

const DECISION_STATUS_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const DECISION_STATUS_PILL_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  fontWeight: 800,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  whiteSpace: "nowrap",
};

const DECISION_STATUS_METRIC_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
};

const DECISION_REASON_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: CANVAS.INK_SOFT,
};

const BLOCKERS_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  padding: "12px 14px",
  borderRadius: CANVAS.RADIUS_TIGHT,
  border: `1px solid rgba(211,84,0,0.20)`,
  background: "rgba(211,84,0,0.04)",
};

const BLOCKERS_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  color: "#B85B00",
  fontWeight: 700,
};

const BLOCKERS_LIST_STYLE: CSSProperties = {
  listStyle: "none",
  padding: 0,
  margin: 0,
  display: "grid",
  gap: 4,
};

const BLOCKERS_LIST_ITEM_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto 1fr",
  gap: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK,
};

const BLOCKERS_BULLET_STYLE: CSSProperties = {
  color: CANVAS.GRAY,
};

const BLOCKERS_ITEM_TITLE_STYLE: CSSProperties = {
  fontWeight: 600,
};

const BLOCKERS_STATE_STYLE: CSSProperties = {
  color: CANVAS.INK_SOFT,
  fontSize: 12.5,
};

const ASSESSMENT_BADGE_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  padding: "2px 7px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};

const EVIDENCE_MATCH_STYLE: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 10px",
  marginTop: 8,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
};

const ROW_PRIMARY_BUTTON_STYLE: CSSProperties = {
  marginLeft: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 5,
  border: "none",
  background: CANVAS.INK,
  color: "#ffffff",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const ROW_GHOST_BUTTON_STYLE: CSSProperties = {
  marginLeft: 6,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "3px 9px",
  borderRadius: 5,
  border: `1px solid ${CANVAS.RULE}`,
  background: "transparent",
  color: CANVAS.INK,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 600,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const STATE_PILL_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  padding: "2px 7px",
  borderRadius: 999,
  border: "1px solid transparent",
  whiteSpace: "nowrap",
};
