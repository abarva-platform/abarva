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
import type { SourceCriterionApprovalView } from "@/lib/source/approval-routing";
import type { SourceStageKey } from "@/lib/source/types";
import { CANVAS } from "../canvas-tokens";

const STATE_LABEL: Record<SourceEventGateCriterionState, string> = {
  pending: "Pending",
  met: "Met",
  not_met: "Not met",
  waived: "Waived",
  deferred: "Deferred",
};

const VISUALLY_HIDDEN_STYLE: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
};

interface GateTabProps {
  fromStage: SourceStageKey;
  /** Per-event criterion states for this from-stage. */
  states: SourceEventGateCriterion[];
  assessment?: GateAssessment;
  recommendation?: StageRecommendation;
  approvalViewByCriterionId?: Record<string, SourceCriterionApprovalView>;
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
  approvalViewByCriterionId,
  onChangeCriterionState,
  pendingByCriterionId,
  onPromoteStage,
  promotePending,
}: GateTabProps) {
  const [promotionReason, setPromotionReason] = useState("");
  const [gapsPending, setGapsPending] = useState(false);
  const [activeCriterionId, setActiveCriterionId] = useState<string | null>(
    null,
  );
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
  const headerTone = gateHeaderTone({
    allMet,
    blockers,
    recommendation,
  });
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
          <div
            id={promoteHelpId}
            data-testid="source-stage-decision-status"
            style={GATE_HEADER_STATUS_STYLE}
            role="status"
          >
            <span
              aria-hidden
              style={{ ...HEADER_DOT_STYLE, background: headerTone.dot }}
            />
            <h2 style={TITLE_STYLE}>
              {SOURCE_STAGE_LABELS[fromStage]} → {targetLabel} gate
            </h2>
            <span style={{ ...HEADER_COUNT_STYLE, color: headerTone.fg }}>
              {met} of {total} cleared
            </span>
          </div>
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

      {total === 0 ? (
        <p style={EMPTY_BODY_STYLE}>
          No gate criteria defined for this stage transition.
        </p>
      ) : (
        <ul
          aria-label="Gate criteria"
          data-testid="source-gate-required-inputs"
          style={LIST_STYLE}
        >
          {ordered.map((s) => {
            const def = criterionById(s.criterionId);
            return (
              <CriterionRow
                key={s.criterionId}
                state={s}
                def={def}
                assessment={assessmentById.get(s.criterionId)}
                approvalView={approvalViewByCriterionId?.[s.criterionId]}
                onChangeState={onChangeCriterionState}
                pending={pendingByCriterionId?.[s.criterionId] ?? false}
                activeCriterionId={activeCriterionId}
                onOpenCriterion={setActiveCriterionId}
              />
            );
          })}
        </ul>
      )}
    </div>
  );
}

interface CriterionRowProps {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  assessment?: GateCriterionAssessment;
  approvalView?: SourceCriterionApprovalView;
  onChangeState?: (
    criterionId: string,
    next: SourceEventGateCriterionState,
    reason: string,
  ) => Promise<void>;
  pending: boolean;
  activeCriterionId: string | null;
  onOpenCriterion: (criterionId: string | null) => void;
}

interface CriterionViewModel {
  isMet: boolean;
  dotColor: string;
  ownerLabel: string | null;
  gapLine: string;
  missingInputs: GateCriterionAssessment["evidence"];
}

function criterionViewModel(args: {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  assessment?: GateCriterionAssessment;
}): CriterionViewModel {
  const { state, def, assessment } = args;
  const isMet = assessment
    ? isAssessmentMet(assessment)
    : state.state === "met" || state.state === "waived";
  const missingInputs =
    assessment?.evidence.filter((match) => !match.satisfied) ?? [];
  const dotColor = isMet
    ? CANVAS.ACTIVE
    : missingInputs.length > 0 || assessment?.displayState === "blocked_evidence"
      ? CANVAS.BLOCKED
      : CANVAS.WAITING;
  return {
    isMet,
    dotColor,
    ownerLabel: def?.ownerRole ? compactOwnerLabel(def.ownerRole) : null,
    gapLine: deriveGapLine({ state, def, assessment, missingInputs, isMet }),
    missingInputs,
  };
}

function deriveGapLine(args: {
  state: SourceEventGateCriterion;
  def: SourceGateCriterion | undefined;
  assessment?: GateCriterionAssessment;
  missingInputs: GateCriterionAssessment["evidence"];
  isMet: boolean;
}): string {
  const { state, def, assessment, missingInputs, isMet } = args;
  if (isMet) {
    if (assessment?.displayState === "met_auto_evidence") {
      return "Auto-assessed from evidence";
    }
    if (state.state === "waived") return "Waived for this stage";
    return "Cleared by human review";
  }
  if (missingInputs.length > 1) {
    return `${missingInputs.length} inputs not ready · see what's missing`;
  }
  if (missingInputs.length === 1) {
    const input = missingInputs[0];
    return `${input.label} · ${input.currentState.toString().toLowerCase()} → needs ${input.minimumState.toLowerCase()}`;
  }
  if (assessment?.reason && assessment.displayState !== "pending_review") {
    return assessment.reason;
  }
  // missingInputs is empty — data is present; user just needs to confirm
  return `Data present — confirm to clear · ${humanReviewAction(def)}`;
}

function compactOwnerLabel(ownerRole: string): string {
  return ownerRole
    .replace(/-/g, " ")
    .replace(/\bea council\b/i, "EA council")
    .replace(/\batlas\b/i, "AbarVa")
    .trim();
}

function humanReviewAction(def: SourceGateCriterion | undefined): string {
  const owner = def?.ownerRole?.toLowerCase() ?? "";
  const title = def?.title?.toLowerCase() ?? "";
  if (owner.includes("sponsor") || title.includes("sponsor")) {
    return "sponsor sign-off";
  }
  if (owner.includes("ea")) return "EA confirmation";
  if (owner.includes("legal")) return "legal review";
  if (owner.includes("sentinel")) return "aVa evidence review";
  return "owner confirmation";
}

function gateHeaderTone(args: {
  allMet: boolean;
  blockers: Array<{ assessment?: GateCriterionAssessment }>;
  recommendation?: StageRecommendation;
}): { dot: string; fg: string } {
  if (args.allMet) return { dot: CANVAS.ACTIVE, fg: "#2E7D32" };
  if (
    args.recommendation?.status === "blocked" ||
    args.blockers.some((blocker) =>
      blocker.assessment?.evidence.some((match) => !match.satisfied),
    )
  ) {
    return { dot: CANVAS.BLOCKED, fg: "#A65300" };
  }
  return { dot: CANVAS.WAITING, fg: "#A66400" };
}

function CriterionRow({
  state,
  def,
  assessment,
  approvalView,
  onChangeState,
  pending,
  activeCriterionId,
  onOpenCriterion,
}: CriterionRowProps) {
  const [reason, setReason] = useState("");
  const autoEvidenceReviewed =
    state.reviewerUserId === AUTO_EVIDENCE_REVIEWER_ID;
  const view = criterionViewModel({ state, def, assessment });
  const isConfirmOpen = activeCriterionId === state.criterionId;
  const isMetOrWaived = state.state === "met" || state.state === "waived";
  const reasonReady = reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH;
  const closeReasonForm = () => {
    setReason("");
    onOpenCriterion(null);
  };
  const markMet = async () => {
    if (!onChangeState || !reasonReady || pending) return;
    await onChangeState(state.criterionId, "met", reason.trim());
    closeReasonForm();
  };
  return (
    <li
      style={ROW_STYLE}
      data-testid={`source-canvas-gate-criterion-${state.criterionId}`}
    >
      <span aria-hidden style={{ ...DOT_STYLE, background: view.dotColor }} />
      <span
        data-testid={`source-canvas-gate-criterion-state-${state.state}`}
        style={VISUALLY_HIDDEN_STYLE}
      >
        {STATE_LABEL[state.state]}
      </span>
      {assessment ? (
        <span
          data-testid={`source-canvas-gate-criterion-assessment-${assessment.criterionId}`}
          style={VISUALLY_HIDDEN_STYLE}
        >
          {assessmentBadgeLabel(assessment)}
        </span>
      ) : null}
      <div style={ROW_BODY_STYLE}>
        <div style={ROW_TITLE_STYLE}>
          <span style={ROW_TITLE_TEXT}>{def?.title ?? state.criterionId}</span>
          {view.ownerLabel ? (
            <span title={def?.ownerRole} style={OWNER_CHIP_STYLE}>
              {view.ownerLabel}
            </span>
          ) : null}
          {approvalView ? (
            <span
              title={approvalView.detail}
              data-testid={`source-canvas-gate-criterion-approval-${state.criterionId}`}
              style={{
                ...APPROVAL_STATUS_STYLE,
                color: approvalTone(approvalView.status),
              }}
            >
              {approvalView.status === "unresolved"
                ? "Approval unresolved"
                : `${approvalView.label} · ${approvalView.status}`}
            </span>
          ) : null}
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
              <button
                type="button"
                disabled={pending}
                onClick={() => onOpenCriterion(state.criterionId)}
                data-testid={`source-canvas-gate-criterion-mark-met-${state.criterionId}`}
                style={{
                  ...(view.missingInputs.length === 0
                    ? ROW_PRIMARY_BUTTON_STYLE
                    : ROW_GHOST_BUTTON_STYLE),
                  opacity: pending ? 0.55 : 1,
                }}
              >
                {pending ? "Saving…" : "Mark met"}
              </button>
            )
          ) : null}
        </div>
        {view.missingInputs.length > 1 ? (
          <details
            data-testid={`source-gate-required-input-${state.criterionId}`}
            style={ROW_DISCLOSURE_STYLE}
          >
            <summary style={GAP_LINE_SUMMARY_STYLE}>{view.gapLine}</summary>
            <ul style={INPUT_DETAIL_LIST_STYLE}>
              {view.missingInputs.map((input) => (
                <li key={input.requirementId}>
                  {input.label} · {input.currentState.toString().toLowerCase()}{" "}
                  → needs {input.minimumState.toLowerCase()}
                </li>
              ))}
            </ul>
          </details>
        ) : (
          <div
            data-testid={`source-gate-required-input-${state.criterionId}`}
            style={GAP_LINE_STYLE}
          >
            {view.gapLine}
          </div>
        )}
        {!isMetOrWaived && onChangeState && isConfirmOpen ? (
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
            <div style={ROW_CONFIRM_ACTIONS_STYLE}>
              <button
                type="button"
                disabled={pending || !reasonReady}
                onClick={() => void markMet()}
                style={{
                  ...ROW_PRIMARY_BUTTON_STYLE,
                  marginLeft: 0,
                  opacity: pending || !reasonReady ? 0.55 : 1,
                }}
              >
                {pending ? "Saving..." : "Confirm"}
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={closeReasonForm}
                style={ROW_CANCEL_BUTTON_STYLE}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
        {isMetOrWaived && state.reviewedAt ? (
          <details
            style={AUDIT_DISCLOSURE_STYLE}
            data-testid={`source-canvas-gate-criterion-audit-${state.criterionId}`}
          >
            <summary style={AUDIT_DISCLOSURE_SUMMARY_STYLE}>
              {autoEvidenceReviewed
                ? "Auto-assessed from evidence"
                : `Cleared ${formatAuditTimestamp(state.reviewedAt)}`}
            </summary>
            <div style={ROW_AUDIT_STYLE}>
              {autoEvidenceReviewed
                ? "Auto-assessed by AbarVa evidence"
                : `Approved by ${state.reviewerUserId ?? "recorded user"}`}{" "}
              · {formatAuditTimestamp(state.reviewedAt)}
              {state.notes ? ` · Reason: ${state.notes}` : ""}
            </div>
          </details>
        ) : null}
        <details style={AUDIT_DISCLOSURE_STYLE}>
          <summary style={AUDIT_DISCLOSURE_SUMMARY_STYLE}>Details</summary>
          <div style={ROW_DETAIL_STACK_STYLE}>
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
                    {match.label}: {match.currentState}
                    {match.satisfied
                      ? " · ready"
                      : ` · needs ${match.minimumState}`}
                  </span>
                ))}
              </div>
            ) : null}
            <div style={ROW_REASON_WRAP_STYLE}>
              <div style={ROW_META_STYLE}>
                <span style={CRITERION_CODE}>{state.criterionId}</span>
                {def?.ownerRole ? (
                  <>
                    <span style={DOT_INLINE_STYLE}>·</span>
                    <span>Owner: {def.ownerRole.replace(/-/g, " ")}</span>
                  </>
                ) : null}
                {def?.linkedArtifactCodes &&
                def.linkedArtifactCodes.length > 0 ? (
                  <>
                    <span style={DOT_INLINE_STYLE}>·</span>
                    <span>Evidence: {def.linkedArtifactCodes.join(", ")}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </details>
      </div>
    </li>
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

function approvalTone(status: SourceCriterionApprovalView["status"]): string {
  if (status === "approved") return "#2E7D32";
  if (status === "unresolved") return "#A65300";
  return CANVAS.INK_MUTED;
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

const GATE_HEADER_STATUS_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const HEADER_DOT_STYLE: CSSProperties = {
  width: 11,
  height: 11,
  borderRadius: 999,
  flexShrink: 0,
};

const HEADER_COUNT_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: "0.10em",
  textTransform: "uppercase",
  fontWeight: 800,
  whiteSpace: "nowrap",
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
  borderTop: `1px solid ${CANVAS.HAIRLINE}`,
};

const ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "auto minmax(0, 1fr)",
  gap: 12,
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
  gap: 5,
  minWidth: 0,
};

const ROW_TITLE_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const ROW_REASON_WRAP_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  maxWidth: 540,
  marginTop: 6,
};

const ROW_CONFIRM_ACTIONS_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const ROW_CANCEL_BUTTON_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 10px",
  borderRadius: 5,
  border: `1px solid ${CANVAS.RULE}`,
  background: "transparent",
  color: CANVAS.INK_SOFT,
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  cursor: "pointer",
};

const ROW_DISCLOSURE_STYLE: CSSProperties = {
  marginTop: 6,
};

const GAP_LINE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.4,
};

const GAP_LINE_SUMMARY_STYLE: CSSProperties = {
  ...GAP_LINE_STYLE,
  cursor: "pointer",
  width: "fit-content",
};

const INPUT_DETAIL_LIST_STYLE: CSSProperties = {
  margin: "6px 0 0",
  paddingLeft: 18,
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  color: CANVAS.INK_SOFT,
  lineHeight: 1.5,
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

const OWNER_CHIP_STYLE: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  border: `1px solid ${CANVAS.RULE}`,
  borderRadius: 999,
  padding: "2px 7px",
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  color: CANVAS.GRAY_DK,
  background: "rgba(10,10,11,0.02)",
};

const APPROVAL_STATUS_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 12,
  fontWeight: 500,
  whiteSpace: "nowrap",
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

const ROW_DETAIL_STACK_STYLE: CSSProperties = {
  display: "grid",
  gap: 8,
  marginTop: 6,
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
