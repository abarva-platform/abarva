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

interface EventApprovalCardProps {
  eventId: string;
  eventName: string;
  eventCode: string;
  lifecycleState: string;
  createdBy: ApprovalPerson;
  createdAt: string;
  capturedFacts: readonly IntakeFact[];
  intakeChatTurns: readonly IntakeChatTurn[];
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

export function EventApprovalCard({
  eventId,
  eventName,
  eventCode,
  lifecycleState,
  createdBy,
  createdAt,
  capturedFacts,
  intakeChatTurns,
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
          <IntakeFactsReview facts={capturedFacts} />
          <IntakeChatTrail turns={intakeChatTurns} />
        </div>

        <aside style={RIGHT_PANEL_STYLE}>
          <ApprovalRoutingPanel
            sponsor={sponsor}
            coApprover={coApprover}
            lifecycleState={lifecycleState}
            currentUserCanApprove={currentUserCanApprove}
          />

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
              rows={5}
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
                    setStrategyGate((g) => ({ ...g, sponsor: event.target.checked }))
                  }
                />
                <span>Sponsor sign-off — the decision owners endorse this event.</span>
              </label>
              <label style={CHECKBOX_ROW_STYLE}>
                <input
                  data-testid="source-approval-gate-value"
                  type="checkbox"
                  checked={strategyGate.value}
                  disabled={!currentUserCanApprove || Boolean(busyAction)}
                  onChange={(event) =>
                    setStrategyGate((g) => ({ ...g, value: event.target.checked }))
                  }
                />
                <span>Value target set — the savings and outcome envelope is agreed.</span>
              </label>
              <label style={CHECKBOX_ROW_STYLE}>
                <input
                  data-testid="source-approval-gate-archetype"
                  type="checkbox"
                  checked={strategyGate.archetype}
                  disabled={!currentUserCanApprove || Boolean(busyAction)}
                  onChange={(event) =>
                    setStrategyGate((g) => ({ ...g, archetype: event.target.checked }))
                  }
                />
                <span>Archetype confirmed — the sourcing archetype fits the work.</span>
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

          <div style={NEXT_STYLE}>
            <strong>What happens next</strong>
            <span>
              {generateMemoOnApprove
                ? "Approve: the strategy gate is cleared here — the event advances to Scope and the memo drafts."
                : "Approve: event unlocks at Stage 1 Strategy."}
            </span>
            <span>Co-approve: the event stays on this page until routed.</span>
            <span>
              Request changes: the intake reopens with the current facts.
            </span>
            <span>
              Reject: event closes and the audit log keeps the record.
            </span>
          </div>
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

const PAGE_STYLE: CSSProperties = {
  minHeight: "100%",
  background: SHELL.PAPER,
  padding: "28px clamp(24px, 4vw, 56px) 48px",
  overflow: "auto",
};

const BANNER_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 8,
  background: SHELL.PEACH_BG,
  padding: "11px 14px",
  marginBottom: 24,
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
  fontSize: 13.5,
  color: SHELL.INK,
};

const HEADER_STYLE: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 24,
  marginBottom: 26,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  fontWeight: 700,
  color: SHELL.INK_MUTED,
};

const H1_STYLE: CSSProperties = {
  margin: "8px 0 0",
  fontFamily: SHELL.SERIF,
  fontSize: "clamp(36px, 4vw, 54px)",
  lineHeight: 1,
  fontWeight: 400,
  letterSpacing: 0,
  color: SHELL.INK,
};

const LEDE_STYLE: CSSProperties = {
  maxWidth: 760,
  margin: "12px 0 0",
  fontFamily: SHELL.SANS,
  fontSize: 15,
  lineHeight: 1.5,
  color: SHELL.INK_SOFT,
};

const GRID_STYLE: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1.1fr) minmax(360px, 0.72fr)",
  gap: 24,
  alignItems: "start",
};

const LEFT_COL_STYLE: CSSProperties = {
  display: "grid",
  gap: 16,
};

const RIGHT_PANEL_STYLE: CSSProperties = {
  position: "sticky",
  top: 20,
  display: "grid",
  gap: 16,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: 18,
  boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
};

const SELF_NOTICE_STYLE: CSSProperties = {
  border: `1px solid ${SHELL.PEACH_LINE}`,
  borderRadius: 8,
  background: SHELL.PEACH_BG,
  color: SHELL.PEACH_TEXT,
  padding: "10px 12px",
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
  padding: 11,
  fontFamily: SHELL.SANS,
  fontSize: 14,
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
  fontSize: 13,
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
