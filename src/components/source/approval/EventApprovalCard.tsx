"use client";

import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { SHELL } from "@/lib/shell/shell-tokens";
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from "@/lib/source/source-governance-enforcement";
import {
  ApprovalRoutingPanel,
  type ApprovalPerson,
} from "./ApprovalRoutingPanel";
import { IntakeChatTrail, type IntakeChatTurn } from "./IntakeChatTrail";
import { IntakeFactsReview, type IntakeFact } from "./IntakeFactsReview";
import type { ApprovalLedgerRow } from "@/lib/source/approval-ledger-model";

interface EventApprovalCardProps {
  eventId: string;
  eventName: string;
  eventCode: string;
  lifecycleState: string;
  createdBy: ApprovalPerson;
  createdAt: string;
  evidenceUpdatedAt: string | null;
  capturedFacts: readonly IntakeFact[];
  intakeChatTurns: readonly IntakeChatTurn[];
  approvalLedger?: readonly ApprovalLedgerRow[];
  artifactAcceptances?: readonly ApprovalArtifactAcceptance[];
  sponsor: ApprovalPerson;
  coApprover?: ApprovalPerson | null;
  pilotMode: boolean;
  currentUserId: string | null;
  currentUserCanApprove: boolean;
  currentStageHref: string;
  /** When true, approving also generates the strategy memo (Strategy-at-P0). */
  generateMemoOnApprove?: boolean;
}

type ApprovalAction =
  | "approve"
  | "route-to-co-approver"
  | "request-changes"
  | "reject";

interface ActionResult {
  ok?: boolean;
  redirectTo?: string;
  eventId?: string;
  newLifecycleState?: string;
  /** Stage the event advanced to on approval (Strategy-at-P0 → "scope"). The
   *  approve route returns `stageAdvancedTo`; `advancedToStage` kept as a
   *  backward-compatible fallback. */
  advancedToStage?: string;
  stageAdvancedTo?: string;
  detail?: string;
  error?: string;
}

export interface ApprovalArtifactAcceptance {
  id: string;
  artifactId: string;
  artifactName: string;
  stageKey: string;
  acceptedBy: string;
  acceptedAt: string;
  contentDriftStatus: string;
  gatePreconditionStatus: string;
  approvalRationale: string;
}

export function EventApprovalCard({
  eventId,
  eventName,
  eventCode,
  lifecycleState,
  createdBy,
  createdAt,
  evidenceUpdatedAt,
  capturedFacts,
  intakeChatTurns,
  approvalLedger = [],
  artifactAcceptances = [],
  sponsor,
  coApprover,
  pilotMode,
  currentUserId,
  currentUserCanApprove,
  currentStageHref,
  generateMemoOnApprove = false,
}: EventApprovalCardProps) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [strategyGate, setStrategyGate] = useState({
    sponsor: false,
    value: false,
    archetype: false,
  });
  const [busyAction, setBusyAction] = useState<ApprovalAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reasonReady = reason.trim().length >= SOURCE_APPROVAL_REASON_MIN_LENGTH;
  // Strategy-at-P0 makes approval the strategy gate: the three GATE-STRATEGY
  // criteria are confirmed here as explicit checkboxes. Other tenants keep the
  // single accountable-decision confirm.
  const gateReady = generateMemoOnApprove
    ? strategyGate.sponsor && strategyGate.value && strategyGate.archetype
    : confirmed;
  const actionReady =
    currentUserCanApprove && reasonReady && gateReady && !busyAction;
  const isSelfApproval = Boolean(
    currentUserId && createdBy.userId && currentUserId === createdBy.userId,
  );
  const ageLabel = useMemo(() => formatAge(createdAt), [createdAt]);
  const evidenceFreshnessLabel = useMemo(
    () => formatFreshness(evidenceUpdatedAt),
    [evidenceUpdatedAt],
  );
  const briefFacts = capturedFacts.slice(0, 5);
  const recordedApprovalRows = approvalLedger.filter(
    (row) => row.state === "approved" || row.approvedAtIso,
  );
  const artifactAcceptanceRows = artifactAcceptances.filter(
    (acceptance) => acceptance.acceptedAt,
  );
  const blockerLabel = !currentUserCanApprove
    ? "You do not have approval rights for this event."
    : !reasonReady
      ? `Add an audit rationale of at least ${SOURCE_APPROVAL_REASON_MIN_LENGTH} characters.`
      : !gateReady
        ? generateMemoOnApprove
          ? "Confirm all three strategy-gate checks."
          : "Confirm the accountable human decision."
        : "Ready to approve.";

  async function submitAction(action: ApprovalAction) {
    if (!actionReady) return;
    setBusyAction(action);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(endpointFor(action, eventId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: action === "reject" ? "reject" : "approve",
          notes:
            action !== "reject" && generateMemoOnApprove
              ? `${reason}\n\nStrategy gate confirmed at approval — sponsor sign-off, value target set, archetype confirmed.`
              : reason,
          // The approve route validates `confirmations` (all three required keys)
          // via evaluateSourceApprovalDecision — sending a bare `confirmed` flag
          // 422s for gate tenants. Map the gate checkboxes (or the single confirm
          // for non-gate tenants) onto the canonical confirmation keys. The
          // in-canvas Strategy gate sends the same shape.
          confirmed: true,
          confirmations: {
            strategyMemoReviewed: generateMemoOnApprove
              ? strategyGate.sponsor
              : confirmed,
            valueTargetConfirmed: generateMemoOnApprove
              ? strategyGate.value
              : confirmed,
            archetypeRigorConfirmed: generateMemoOnApprove
              ? strategyGate.archetype
              : confirmed,
          },
          // The event-creation approval unlocks the working canvas where the
          // strategy memo is actually drafted — the GATE-STRATEGY-01 readiness
          // check it would otherwise trigger belongs to a LATER, separate
          // stage-advance action (leaving Strategy once the memo exists), not
          // to this first approval. In pilot mode, a self-approving creator is
          // authorized to bypass that computed-readiness check here; the
          // server independently re-verifies this is safe (rejects the bypass
          // outright when GATE_APPROVAL_STRICT_MODE is on, regardless of what
          // the client sends).
          selfApproveIfAuthorized:
            action === "approve" && isSelfApproval && pilotMode,
        }),
      });
      const payload = (await response.json().catch(() => ({}))) as ActionResult;
      if (!response.ok || payload.error) {
        setError(payload.detail ?? payload.error ?? "Approval action failed.");
        return;
      }
      // Strategy-at-P0: approving also produces the strategy memo, as part of
      // the same click. We chain the existing governed generate route (which is
      // heartbeat-protected for the ~30-60s Anthropic call). Best-effort: if the
      // memo can't be produced, the approval still stands and we navigate on —
      // the strategy substance lives in the captured intake facts regardless.
      if (action === "approve" && generateMemoOnApprove) {
        setNotice("Approved — generating your strategy memo…");
        try {
          await fetch(
            `/api/v1/source/${eventId}/artifacts/d01_strategy_memo/generate`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({}),
            },
          );
        } catch {
          // non-fatal — the memo can be drafted later from the Workspace
        }
      }
      if (payload.redirectTo) {
        router.push(payload.redirectTo);
        router.refresh();
        return;
      }
      if (action === "approve") {
        // Land on the stage the event actually advanced to. With Strategy-at-P0
        // the approve route advances to Scope and returns `advancedToStage`;
        // `currentStageHref` was built from the pre-approve stage, so using it
        // would drop the user back on the now-completed Strategy view.
        const advancedTo = payload.stageAdvancedTo ?? payload.advancedToStage;
        const target = advancedTo
          ? `/source/events/${eventId}?stage=${advancedTo}`
          : currentStageHref;
        router.push(target);
        router.refresh();
        return;
      }
      setNotice(successCopy(action));
      router.refresh();
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main data-testid="source-approval-page" style={PAGE_STYLE}>
      <header style={BANNER_STYLE}>
        <span style={STATUS_CHIP_STYLE}>Pending approval</span>
        <span style={BANNER_TEXT_STYLE}>
          {stateLabel(lifecycleState)} · {ageLabel} aged · {eventCode} · opened
          by {createdBy.displayName}, {createdBy.role}
        </span>
      </header>

      <section style={HEADER_STYLE}>
        <div>
          <div style={EYEBROW_STYLE}>Source Approval</div>
          <h1 style={H1_STYLE}>{eventName}</h1>
          <p style={LEDE_STYLE}>
            Approve the event intake before the working canvas unlocks. AbarVa
            assists with the record; the client owns the decision.
          </p>
        </div>
      </section>

      <section style={GRID_STYLE}>
        <div style={LEFT_COL_STYLE}>
          <section data-testid="source-approval-brief" style={BRIEF_CARD_STYLE}>
            <div style={SECTION_HEADER_STYLE}>
              <div>
                <div style={EYEBROW_STYLE}>Approval brief</div>
                <h2 style={SECTION_TITLE_STYLE}>What you are approving</h2>
              </div>
              <span style={READY_CHIP_STYLE}>
                {actionReady ? "Ready" : "Needs input"}
              </span>
            </div>
            <dl style={FACT_LIST_STYLE}>
              {briefFacts.map((fact) => (
                <div key={fact.id} style={FACT_ROW_STYLE}>
                  <dt style={FACT_LABEL_STYLE}>{fact.label}</dt>
                  <dd style={FACT_VALUE_STYLE}>{fact.value}</dd>
                </div>
              ))}
            </dl>
            <div style={actionReady ? READY_STRIP_STYLE : BLOCKER_STRIP_STYLE}>
              <strong>Next required step</strong>
              <span>{blockerLabel}</span>
            </div>
          </section>

          <details
            data-testid="source-approval-evidence-disclosure"
            style={DISCLOSURE_STYLE}
          >
            <summary style={DISCLOSURE_SUMMARY_STYLE}>
              Evidence reviewed · {capturedFacts.length} facts ·{" "}
              {evidenceFreshnessLabel}
            </summary>
            <div style={DISCLOSURE_BODY_STYLE}>
              <IntakeFactsReview facts={capturedFacts} />
            </div>
          </details>

          <details
            data-testid="source-approval-audit-disclosure"
            style={DISCLOSURE_STYLE}
          >
            <summary style={DISCLOSURE_SUMMARY_STYLE}>
              Audit history · {intakeChatTurns.length} intake turn
              {intakeChatTurns.length === 1 ? "" : "s"} ·{" "}
              {recordedApprovalRows.length} approval
              {recordedApprovalRows.length === 1 ? "" : "s"} ·{" "}
              {artifactAcceptanceRows.length} acceptance
              {artifactAcceptanceRows.length === 1 ? "" : "s"}
            </summary>
            <div style={DISCLOSURE_BODY_STYLE}>
              <GovernanceHistory
                approvalRows={recordedApprovalRows}
                artifactAcceptances={artifactAcceptanceRows}
              />
              <IntakeChatTrail turns={intakeChatTurns} />
            </div>
          </details>
        </div>

        <aside style={RIGHT_PANEL_STYLE}>
          <section style={ACTION_PANEL_HEADER_STYLE}>
            <div style={EYEBROW_STYLE}>Decision</div>
            <h2 style={ACTION_TITLE_STYLE}>Approve or send back</h2>
            <p style={ACTION_COPY_STYLE}>
              Complete only the controls needed for this step. Supporting
              evidence stays available on the left.
            </p>
          </section>

          {isSelfApproval && pilotMode ? (
            <div style={SELF_NOTICE_STYLE}>
              Self-approval notice: you are the recorded event creator. The
              audit log will flag this action.
            </div>
          ) : null}

          <label style={FIELD_STYLE}>
            <span style={FIELD_LABEL_STYLE}>
              Rationale required for audit log
            </span>
            <textarea
              data-testid="source-approval-rationale"
              value={reason}
              disabled={!currentUserCanApprove || Boolean(busyAction)}
              onChange={(event) => setReason(event.target.value)}
              rows={4}
              placeholder="Record what you reviewed and why this event should move."
              style={TEXTAREA_STYLE}
            />
            <span style={FIELD_HELP_STYLE}>
              Minimum {SOURCE_APPROVAL_REASON_MIN_LENGTH} characters.
            </span>
          </label>

          {generateMemoOnApprove ? (
            <div style={{ display: "grid", gap: 8, marginBottom: 4 }}>
              <div style={EYEBROW_STYLE}>Confirm the strategy gate</div>
              <label style={CHECKBOX_ROW_STYLE}>
                <input
                  data-testid="source-approval-gate-sponsor"
                  type="checkbox"
                  checked={strategyGate.sponsor}
                  disabled={!currentUserCanApprove || Boolean(busyAction)}
                  onChange={(event) =>
                    setStrategyGate((g) => ({
                      ...g,
                      sponsor: event.target.checked,
                    }))
                  }
                />
                <span>
                  Sponsor sign-off — the decision owners endorse this event.
                </span>
              </label>
              <label style={CHECKBOX_ROW_STYLE}>
                <input
                  data-testid="source-approval-gate-value"
                  type="checkbox"
                  checked={strategyGate.value}
                  disabled={!currentUserCanApprove || Boolean(busyAction)}
                  onChange={(event) =>
                    setStrategyGate((g) => ({
                      ...g,
                      value: event.target.checked,
                    }))
                  }
                />
                <span>
                  Value target set — the savings and outcome envelope is agreed.
                </span>
              </label>
              <label style={CHECKBOX_ROW_STYLE}>
                <input
                  data-testid="source-approval-gate-archetype"
                  type="checkbox"
                  checked={strategyGate.archetype}
                  disabled={!currentUserCanApprove || Boolean(busyAction)}
                  onChange={(event) =>
                    setStrategyGate((g) => ({
                      ...g,
                      archetype: event.target.checked,
                    }))
                  }
                />
                <span>
                  Archetype confirmed — the sourcing archetype fits the work.
                </span>
              </label>
            </div>
          ) : (
            <label style={CHECKBOX_ROW_STYLE}>
              <input
                data-testid="source-approval-confirmation"
                type="checkbox"
                checked={confirmed}
                disabled={!currentUserCanApprove || Boolean(busyAction)}
                onChange={(event) => setConfirmed(event.target.checked)}
              />
              <span>
                I confirm this is my accountable human approval decision.
              </span>
            </label>
          )}

          <div style={ACTION_ROW_STYLE}>
            <details style={MORE_STYLE}>
              <summary style={MORE_SUMMARY_STYLE}>Other decisions</summary>
              <div style={MORE_MENU_STYLE}>
                <button
                  type="button"
                  data-testid="source-approval-request-changes"
                  disabled={!actionReady}
                  onClick={() => void submitAction("request-changes")}
                  style={SECONDARY_BUTTON_STYLE}
                >
                  Request changes
                </button>
                <button
                  type="button"
                  data-testid="source-approval-reject"
                  disabled={!actionReady}
                  onClick={() => void submitAction("reject")}
                  style={DANGER_BUTTON_STYLE}
                >
                  Reject
                </button>
              </div>
            </details>
            <button
              type="button"
              data-testid="source-approval-co-approver"
              disabled={!actionReady}
              onClick={() => void submitAction("route-to-co-approver")}
              style={SECONDARY_BUTTON_STYLE}
            >
              {coApprover
                ? `Send to ${coApprover.displayName}`
                : "Send to co-approver"}
            </button>
            <button
              type="button"
              data-testid="source-approval-approve"
              disabled={!actionReady}
              onClick={() => void submitAction("approve")}
              style={{
                ...PRIMARY_BUTTON_STYLE,
                opacity: actionReady ? 1 : 0.45,
              }}
            >
              {busyAction === "approve" ? "Approving..." : "Approve"}
            </button>
          </div>

          {error ? <div style={ERROR_STYLE}>{error}</div> : null}
          {notice ? <div style={NOTICE_STYLE}>{notice}</div> : null}

          <details style={PANEL_DISCLOSURE_STYLE}>
            <summary style={DISCLOSURE_SUMMARY_STYLE}>
              Routing and audit details
            </summary>
            <div style={PANEL_DISCLOSURE_BODY_STYLE}>
              <ApprovalRoutingPanel
                sponsor={sponsor}
                coApprover={coApprover}
                lifecycleState={lifecycleState}
                currentUserCanApprove={currentUserCanApprove}
              />
              <div style={NEXT_STYLE}>
                <strong>What happens next</strong>
                <span>
                  {generateMemoOnApprove
                    ? "Approve: the strategy gate is cleared here — the event advances to Scope and the memo drafts."
                    : "Approve: event unlocks at Stage 1 Strategy."}
                </span>
                <span>
                  Co-approve: the event stays on this page until routed.
                </span>
                <span>
                  Request changes: the intake reopens with the current facts.
                </span>
                <span>
                  Reject: event closes and the audit log keeps the record.
                </span>
              </div>
            </div>
          </details>
        </aside>
      </section>
    </main>
  );
}

function endpointFor(action: ApprovalAction, eventId: string): string {
  if (action === "route-to-co-approver") {
    return `/api/v1/source/events/${eventId}/route-to-co-approver`;
  }
  if (action === "request-changes") {
    return `/api/v1/source/events/${eventId}/request-changes`;
  }
  return `/api/v1/source/events/${eventId}/approve`;
}

function successCopy(action: ApprovalAction): string {
  if (action === "route-to-co-approver") {
    return "Co-approval requested. This page will remain the system of record.";
  }
  if (action === "request-changes") {
    return "Changes requested. The intake can be revised before approval.";
  }
  if (action === "reject") return "Event rejected and closed.";
  return "Approved.";
}

function stateLabel(state: string): string {
  return state
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(createdAt: string): string {
  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return "New";
  const minutes = Math.max(0, Math.floor((Date.now() - created) / 60000));
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours} hr`;
  return `${Math.floor(hours / 24)} d`;
}

function formatFreshness(updatedAt: string | null): string {
  if (!updatedAt) return "freshness unavailable";
  return `updated ${formatAge(updatedAt)} ago`;
}

function GovernanceHistory({
  approvalRows,
  artifactAcceptances,
}: {
  approvalRows: readonly ApprovalLedgerRow[];
  artifactAcceptances: readonly ApprovalArtifactAcceptance[];
}) {
  const hasApprovals = approvalRows.length > 0;
  const hasAcceptances = artifactAcceptances.length > 0;

  return (
    <section
      data-testid="source-approval-governance-history"
      style={GOVERNANCE_STYLE}
    >
      <div style={GOVERNANCE_SECTION_STYLE}>
        <div style={GOVERNANCE_HEADER_STYLE}>
          <span>Stage approvals</span>
          <span>
            {approvalRows.length} recorded approval
            {approvalRows.length === 1 ? "" : "s"}
          </span>
        </div>
        {hasApprovals ? (
          <div style={GOVERNANCE_LIST_STYLE}>
            {approvalRows.map((row) => (
              <article
                key={row.stageKey}
                data-testid={`source-approval-governance-ledger-row-${row.stageKey}`}
                style={GOVERNANCE_ROW_STYLE}
              >
                <div style={GOVERNANCE_ROW_MAIN_STYLE}>
                  <strong>
                    {String(row.index).padStart(2, "0")} · {row.stageLabel}
                  </strong>
                  <span>
                    {row.approverName ?? "Approver not recorded"}
                    {row.approvedAtIso
                      ? ` · ${new Date(row.approvedAtIso).toLocaleDateString()}`
                      : ""}
                  </span>
                </div>
                <p style={GOVERNANCE_NOTE_STYLE}>{row.authorizationNote}</p>
                {row.approverRationale ? (
                  <p style={GOVERNANCE_NOTE_STYLE}>
                    Rationale: {row.approverRationale}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p style={GOVERNANCE_EMPTY_STYLE}>
            No prior stage approvals are recorded for this event yet.
          </p>
        )}
      </div>

      <div style={GOVERNANCE_SECTION_STYLE}>
        <div style={GOVERNANCE_HEADER_STYLE}>
          <span>Artifact acceptances</span>
          <span>
            {artifactAcceptances.length} recorded acceptance
            {artifactAcceptances.length === 1 ? "" : "s"}
          </span>
        </div>
        {hasAcceptances ? (
          <div style={GOVERNANCE_LIST_STYLE}>
            {artifactAcceptances.map((acceptance) => (
              <article
                key={acceptance.id}
                data-testid={`source-approval-artifact-acceptance-${acceptance.id}`}
                style={GOVERNANCE_ROW_STYLE}
              >
                <div style={GOVERNANCE_ROW_MAIN_STYLE}>
                  <strong>{acceptance.artifactName}</strong>
                  <span>
                    Accepted by {acceptance.acceptedBy} ·{" "}
                    {new Date(acceptance.acceptedAt).toLocaleDateString()}
                  </span>
                </div>
                <p style={GOVERNANCE_NOTE_STYLE}>
                  {acceptance.approvalRationale}
                </p>
                <div style={GOVERNANCE_META_STYLE}>
                  Stage: {acceptance.stageKey.replaceAll("_", " ")} · Drift:{" "}
                  {acceptance.contentDriftStatus.replaceAll("_", " ")} · Gate:{" "}
                  {acceptance.gatePreconditionStatus.replaceAll("_", " ")}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p style={GOVERNANCE_EMPTY_STYLE}>
            No artifact acceptances are recorded for this event yet.
          </p>
        )}
      </div>
    </section>
  );
}

const PAGE_STYLE: CSSProperties = {
  minHeight: "100%",
  background: SHELL.PAPER,
  padding: "20px clamp(24px, 4vw, 52px) 36px",
  overflow: "auto",
};

const BANNER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 8,
  background: SHELL.PEACH_BG,
  padding: "9px 13px",
  marginBottom: 16,
};

const STATUS_CHIP_STYLE: CSSProperties = {
  borderRadius: 999,
  padding: "4px 9px",
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.PEACH_TEXT,
  background: "#fff7ed",
  border: `1px solid ${SHELL.PEACH_LINE}`,
};

const BANNER_TEXT_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 16,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const H1_STYLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: "clamp(22px, 1.45vw, 28px)",
  lineHeight: 1.12,
  fontWeight: 400,
  letterSpacing: 0,
  color: SHELL.INK,
  maxWidth: 980,
};

const LEDE_STYLE: CSSProperties = {
  maxWidth: 760,
  margin: "7px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.72fr)",
  gap: 18,
  alignItems: "start",
};

const LEFT_COL_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
};

const BRIEF_CARD_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: 15,
  boxShadow: "0 12px 34px rgba(15,23,42,0.05)",
};

const SECTION_HEADER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 16,
};

const SECTION_TITLE_STYLE: CSSProperties = {
  margin: "4px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.18,
  letterSpacing: 0,
  color: SHELL.INK,
};

const READY_CHIP_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  background: SHELL.PAPER,
  color: SHELL.INK_SOFT,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  padding: "5px 9px",
  whiteSpace: "nowrap",
};

const FACT_LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 0,
  margin: 0,
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
};

const FACT_ROW_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(150px, 0.34fr) minmax(0, 1fr)",
  gap: 16,
  padding: "10px 0",
  borderBottom: `1px solid ${SHELL.CARD_LINE}`,
};

const FACT_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const FACT_VALUE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 13.5,
  fontWeight: 700,
  lineHeight: 1.35,
  color: SHELL.INK,
};

const BLOCKER_STRIP_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 8,
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  padding: "10px 12px",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.35,
};

const READY_STRIP_STYLE: CSSProperties = {
  ...BLOCKER_STRIP_STYLE,
  border: `1px solid ${SHELL.MINT_LINE}`,
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
};

const RIGHT_PANEL_STYLE: CSSProperties = {
  position: "sticky",
  top: 20,
  display: "grid",
  gap: 12,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: 15,
  boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
};

const ACTION_PANEL_HEADER_STYLE: CSSProperties = {
  display: "grid",
  gap: 6,
};

const ACTION_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SERIF,
  fontSize: 18,
  fontWeight: 400,
  lineHeight: 1.18,
  letterSpacing: 0,
  color: SHELL.INK,
};

const ACTION_COPY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const SELF_NOTICE_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 8,
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  padding: "9px 11px",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
};

const FIELD_STYLE: CSSProperties = {
  display: "grid",
  gap: 7,
};

const FIELD_LABEL_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const TEXTAREA_STYLE: CSSProperties = {
  width: "100%",
  resize: "vertical",
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  padding: 10,
  fontFamily: SHELL.SANS,
  fontSize: 13.5,
  lineHeight: 1.45,
  color: SHELL.INK,
};

const FIELD_HELP_STYLE: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
};

const CHECKBOX_ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  gap: 9,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
  color: SHELL.INK,
};

const ACTION_ROW_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const MORE_STYLE: CSSProperties = {
  position: "relative",
};

const MORE_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_SOFT,
};

const MORE_MENU_STYLE: CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 8,
};

const DISCLOSURE_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  overflow: "hidden",
};

const DISCLOSURE_SUMMARY_STYLE: CSSProperties = {
  cursor: "pointer",
  padding: "12px 14px",
  fontFamily: SHELL.SANS,
  fontSize: 13,
  fontWeight: 700,
  color: SHELL.INK,
};

const DISCLOSURE_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 14,
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  padding: 14,
};

const GOVERNANCE_STYLE: CSSProperties = {
  display: "grid",
  gap: 12,
};

const GOVERNANCE_SECTION_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: "#fbfaf7",
  padding: "12px 14px",
};

const GOVERNANCE_HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const GOVERNANCE_LIST_STYLE: CSSProperties = {
  display: "grid",
  gap: 10,
};

const GOVERNANCE_ROW_STYLE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  paddingTop: 10,
};

const GOVERNANCE_ROW_MAIN_STYLE: CSSProperties = {
  display: "grid",
  gap: 4,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.35,
  color: SHELL.INK,
};

const GOVERNANCE_NOTE_STYLE: CSSProperties = {
  margin: "6px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.4,
  color: SHELL.INK_SOFT,
};

const GOVERNANCE_META_STYLE: CSSProperties = {
  marginTop: 6,
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
};

const GOVERNANCE_EMPTY_STYLE: CSSProperties = {
  margin: 0,
  fontFamily: SHELL.SANS,
  fontSize: 13,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};

const PANEL_DISCLOSURE_STYLE: CSSProperties = {
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 4,
};

const PANEL_DISCLOSURE_BODY_STYLE: CSSProperties = {
  display: "grid",
  gap: 14,
  paddingTop: 12,
};

const BASE_BUTTON_STYLE: CSSProperties = {
  borderRadius: 8,
  padding: "10px 14px",
  fontFamily: SHELL.MONO,
  fontSize: 11,
  fontWeight: 700,
  cursor: "pointer",
};

const PRIMARY_BUTTON_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: `1px solid ${SHELL.INK}`,
  background: SHELL.INK,
  color: SHELL.CARD_WHITE,
};

const SECONDARY_BUTTON_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  background: SHELL.CARD_WHITE,
  color: SHELL.INK,
};

const DANGER_BUTTON_STYLE: CSSProperties = {
  ...BASE_BUTTON_STYLE,
  border: "1px solid #fecaca",
  background: "#fff7f7",
  color: "#991b1b",
};

const ERROR_STYLE: CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: 8,
  padding: "10px 12px",
  background: "#fff7f7",
  color: "#991b1b",
  fontFamily: SHELL.SANS,
  fontSize: 13,
};

const NOTICE_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.MINT_LINE}`,
  borderRadius: 8,
  padding: "10px 12px",
  background: SHELL.MINT_BG,
  color: SHELL.MINT_TEXT,
  fontFamily: SHELL.SANS,
  fontSize: 13,
};

const NEXT_STYLE: CSSProperties = {
  display: "grid",
  gap: 5,
  borderTop: `1px solid ${SHELL.CARD_LINE}`,
  paddingTop: 14,
  fontFamily: SHELL.SANS,
  fontSize: 12.5,
  lineHeight: 1.45,
  color: SHELL.INK_SOFT,
};
