"use client";

// OV2-2c · Tenant-admin approval queue · decision panel (client)
//
// Renders the rationale textarea + Approve/Reject buttons. POSTs to
// /api/admin/programs/approvals/[requestId]. On success, redirects
// back to /admin/programs/approvals so the queue re-renders.
//
// PRE-W4-PR-4 · two new admin-initiated actions appear next to
// Approve/Reject:
//
//   • "Notify sponsor" (Tier 1 escalation) — increments notify_count
//     and bumps escalation_level 0 → 1. Logs `approval_sponsor_notified`
//     to admin_audit_log. Source of Wave 4 `approval.escalated` Tier 1.
//
//   • "Escalate to platform admin" (Tier 2) — flips escalation_level
//     to 2 and re-routes the request. Disabled once already escalated.
//     Logs `approval_escalated`. Source of Wave 4 `approval.escalated`
//     Tier 2.
//
// Both surface a SLA badge in the panel header so the admin sees how
// long the request has been pending before they act.
//
// Client-side validation: rationale is required (non-empty) for
// 'rejected'. The server enforces the same rule.

import { useCallback, useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  COLORS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
} from "@/lib/design/design-tokens";

export interface ApprovalDecisionPanelProps {
  requestId: string;
  /** When true, the panel renders read-only; used after a decision lands. */
  alreadyDecided?: boolean;
  /** Optional override for the post URL (test seam). */
  postUrl?: string;
  /** ISO of the original submission, drives the SLA badge in the header. */
  requestedAt?: string;
  /** Current notify_count from the row. Drives the notify-button palette. */
  notifyCount?: number;
  /** Current escalation_level. Drives the escalate-button state. */
  escalationLevel?: 0 | 1 | 2;
  /** ISO of the last reminder. Drives the banner copy after notify. */
  lastNotifiedAt?: string | null;
  /**
   * Test seams for the server-action calls. In production these
   * default to the real "use server" exports from
   * `src/app/(maestro)/admin/programs/approvals/_actions/*`.
   */
  notifySponsor?: (requestId: string) => Promise<NotifySponsorClientResult>;
  escalateApproval?: (
    requestId: string,
  ) => Promise<EscalateApprovalClientResult>;
}

export interface NotifySponsorClientResult {
  ok: boolean;
  notifiedAt: string | null;
  notifyCount: number;
  escalationLevel: 0 | 1 | 2;
  error?: string;
  detail?: string;
}

export interface EscalateApprovalClientResult {
  ok: boolean;
  escalationLevel: 0 | 1 | 2;
  escalatedToUserId: string | null;
  error?: string;
  detail?: string;
}

// ── SLA badge ──────────────────────────────────────────────────────────
//
// gray < 24h, amber 24-48h, red > 48h. Returns null when no
// `requestedAt` is supplied (defensive — the panel must still render).

export interface SlaBadgeProps {
  requestedAt: string;
  now?: Date;
}

export function computeSlaBucket(
  hoursPending: number,
): "fresh" | "warning" | "breach" {
  if (hoursPending >= 48) return "breach";
  if (hoursPending >= 24) return "warning";
  return "fresh";
}

export function SlaBadge({ requestedAt, now }: SlaBadgeProps) {
  const start = new Date(requestedAt).getTime();
  if (Number.isNaN(start)) return null;
  const ms = (now ?? new Date()).getTime() - start;
  const hours = Math.max(0, Math.round(ms / (60 * 60 * 1000)));
  const bucket = computeSlaBucket(hours);
  const palette =
    bucket === "breach"
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : bucket === "warning"
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}99` };
  return (
    <span
      data-testid="approval-sla-badge"
      data-sla-bucket={bucket}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: RADIUS.pill,
        background: palette.bg,
        color: palette.fg,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: "0.04em",
      }}
    >
      Pending {hours}h
    </span>
  );
}

type Decision = "approved" | "rejected";

interface ApiResponse {
  ok?: boolean;
  error?: string;
  detail?: string;
}

export function ApprovalDecisionPanel({
  requestId,
  alreadyDecided = false,
  postUrl,
  requestedAt,
  notifyCount = 0,
  escalationLevel = 0,
  lastNotifiedAt = null,
  notifySponsor,
  escalateApproval,
}: ApprovalDecisionPanelProps) {
  const router = useRouter();
  const [rationale, setRationale] = useState("");
  const [submitting, setSubmitting] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localNotifyCount, setLocalNotifyCount] = useState(notifyCount);
  const [localEscalationLevel, setLocalEscalationLevel] = useState<0 | 1 | 2>(
    escalationLevel,
  );
  const [localLastNotifiedAt, setLocalLastNotifiedAt] = useState<string | null>(
    lastNotifiedAt,
  );
  const [showEscalateConfirm, setShowEscalateConfirm] = useState(false);
  const [actionPending, startActionTransition] = useTransition();
  const rationaleId = useId();

  const submit = useCallback(
    async (decision: Decision) => {
      setError(null);
      const trimmed = rationale.trim();
      if (trimmed.length === 0) {
        setError(
          decision === "rejected"
            ? "Rationale is required to reject."
            : "Rationale is required to approve.",
        );
        return;
      }
      setSubmitting(decision);
      try {
        const url = postUrl ?? `/api/admin/programs/approvals/${requestId}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            decision,
            rationale: trimmed.length > 0 ? trimmed : undefined,
          }),
        });
        const json = (await res.json().catch(() => ({}))) as ApiResponse;
        if (!res.ok || !json.ok) {
          setError(
            json.detail ?? json.error ?? `Request failed (${res.status})`,
          );
          setSubmitting(null);
          return;
        }
        router.push("/admin/programs/approvals");
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "request failed");
        setSubmitting(null);
      }
    },
    [postUrl, rationale, requestId, router],
  );

  const handleNotifySponsor = useCallback(() => {
    if (!notifySponsor) {
      setError("notify-sponsor action is not wired in this surface.");
      return;
    }
    setError(null);
    setNotice(null);
    startActionTransition(() => {
      void (async () => {
        try {
          const result = await notifySponsor(requestId);
          if (!result.ok) {
            setError(result.detail ?? result.error ?? "notify-sponsor failed");
            return;
          }
          setLocalNotifyCount(result.notifyCount);
          setLocalEscalationLevel(result.escalationLevel);
          setLocalLastNotifiedAt(result.notifiedAt);
          const ts = result.notifiedAt
            ? new Date(result.notifiedAt).toLocaleString()
            : new Date().toLocaleString();
          setNotice(`Reminder logged · sponsor notified at ${ts}`);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "notify_failed");
        }
      })();
    });
  }, [notifySponsor, requestId, router]);

  const handleEscalateConfirmed = useCallback(() => {
    if (!escalateApproval) {
      setError("escalate-approval action is not wired in this surface.");
      setShowEscalateConfirm(false);
      return;
    }
    setError(null);
    setNotice(null);
    startActionTransition(() => {
      void (async () => {
        try {
          const result = await escalateApproval(requestId);
          if (!result.ok) {
            setError(result.detail ?? result.error ?? "escalate failed");
            setShowEscalateConfirm(false);
            return;
          }
          setLocalEscalationLevel(result.escalationLevel);
          setShowEscalateConfirm(false);
          // Bounce back to the queue so the admin sees the escalated
          // request has moved out of their primary review path.
          router.push("/admin/programs/approvals?banner=escalated");
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "escalate_failed");
          setShowEscalateConfirm(false);
        }
      })();
    });
  }, [escalateApproval, requestId, router]);

  if (alreadyDecided) {
    return (
      <section
        aria-label="Decision"
        data-testid="approval-decision-panel-decided"
        style={{
          background: COLORS.white,
          border: `1px solid ${COLORS.ink}12`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: TYPOGRAPHY.sans,
          color: `${COLORS.ink}99`,
          fontSize: 13,
          lineHeight: 1.5,
        }}
      >
        This request has already been decided. See the audit trail below.
      </section>
    );
  }

  const inFlight = submitting !== null;
  const rationaleEmpty = rationale.trim().length === 0;

  return (
    <section
      aria-label="Decision"
      data-testid="approval-decision-panel"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: "flex",
        flexDirection: "column",
        gap: SPACING.md,
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: SPACING.sm,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: COLORS.navy,
              fontWeight: 700,
            }}
          >
            Decision
          </span>
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13,
              color: `${COLORS.ink}99`,
              margin: "6px 0 0",
              lineHeight: 1.55,
            }}
          >
            Your decision approves Phase 0 unlock or rejects with rationale.
            Both are audited.
          </p>
        </div>
        {requestedAt ? <SlaBadge requestedAt={requestedAt} /> : null}
      </header>

      {notice ? (
        <div
          role="status"
          data-testid="approval-decision-notice"
          style={{
            background: COLORS.mintSoft,
            color: COLORS.mintInk,
            padding: SPACING.sm,
            borderRadius: RADIUS.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
          }}
        >
          {notice}
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label
          htmlFor={rationaleId}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: `${COLORS.ink}80`,
            fontWeight: 600,
          }}
        >
          Rationale (required)
        </label>
        <textarea
          id={rationaleId}
          data-testid="approval-rationale-textarea"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={4}
          spellCheck
          disabled={inFlight}
          placeholder="Why are you approving or rejecting this brief? Required for both."
          aria-describedby={`${rationaleId}-help${error ? ` ${rationaleId}-error` : ""}`}
          aria-invalid={error ? true : undefined}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: COLORS.ink,
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.ink}24`,
            background: COLORS.white,
            resize: "vertical",
            minHeight: 100,
          }}
        />
        <div
          id={`${rationaleId}-help`}
          style={{
            color: `${COLORS.ink}99`,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
          }}
        >
          Add a rationale before approving or rejecting this request.
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          id={`${rationaleId}-error`}
          data-testid="approval-decision-error"
          style={{
            background: COLORS.coralSoft,
            color: COLORS.coralInk,
            padding: SPACING.sm,
            borderRadius: RADIUS.sm,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      ) : null}

      <div style={{ display: "flex", gap: SPACING.sm, flexWrap: "wrap" }}>
        <button
          type="button"
          data-testid="approval-approve-button"
          aria-label="Approve request"
          onClick={() => submit("approved")}
          disabled={inFlight || actionPending || rationaleEmpty}
          title={rationaleEmpty ? "Add a rationale to approve" : undefined}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.ink,
            color: COLORS.cream,
            borderRadius: RADIUS.md,
            border: "none",
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor:
              inFlight || rationaleEmpty
                ? inFlight
                  ? "progress"
                  : "not-allowed"
                : "pointer",
            opacity: inFlight || rationaleEmpty ? 0.55 : 1,
          }}
        >
          {submitting === "approved" ? "Approving…" : "Approve"}
        </button>
        <button
          type="button"
          data-testid="approval-reject-button"
          aria-label="Reject request"
          onClick={() => submit("rejected")}
          disabled={inFlight || actionPending || rationaleEmpty}
          title={rationaleEmpty ? "Add a rationale to reject" : undefined}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.white,
            color: COLORS.coralInk,
            border: `1px solid ${COLORS.coralInk}`,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor:
              inFlight || rationaleEmpty
                ? inFlight
                  ? "progress"
                  : "not-allowed"
                : "pointer",
            opacity: inFlight || rationaleEmpty ? 0.55 : 1,
          }}
        >
          {submitting === "rejected" ? "Rejecting…" : "Reject"}
        </button>

        {/*
          PRE-W4-PR-4 · Tier 1 (notify) + Tier 2 (escalate) admin actions.
          Notify is amber-tinted once at least one reminder has fired so
          the admin sees "I've already nudged" at a glance.
        */}
        <button
          type="button"
          data-testid="approval-notify-sponsor-button"
          aria-label="Notify sponsor"
          onClick={handleNotifySponsor}
          disabled={inFlight || actionPending}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.white,
            color: localNotifyCount > 0 ? COLORS.amberInk : `${COLORS.ink}cc`,
            border: `1px solid ${
              localNotifyCount > 0 ? COLORS.amberInk : `${COLORS.ink}40`
            }`,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor: inFlight || actionPending ? "progress" : "pointer",
            opacity: inFlight || actionPending ? 0.7 : 1,
          }}
        >
          {actionPending
            ? "Notifying…"
            : localNotifyCount > 0
              ? `Notify sponsor (${localNotifyCount})`
              : "Notify sponsor"}
        </button>
        <button
          type="button"
          data-testid="approval-escalate-button"
          aria-label="Escalate to platform admin"
          onClick={() => {
            setError(null);
            setNotice(null);
            setShowEscalateConfirm(true);
          }}
          disabled={inFlight || actionPending || localEscalationLevel === 2}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.white,
            color: COLORS.coralInk,
            border: `1px solid ${
              localEscalationLevel === 0 ? COLORS.coralInk : `${COLORS.ink}40`
            }`,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor:
              inFlight || actionPending || localEscalationLevel === 2
                ? "not-allowed"
                : "pointer",
            opacity:
              inFlight || actionPending || localEscalationLevel === 2
                ? 0.55
                : 1,
          }}
        >
          {localEscalationLevel === 2
            ? "Escalated"
            : "Escalate to platform admin"}
        </button>
      </div>

      {localLastNotifiedAt ? (
        <div
          data-testid="approval-notify-meta"
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}80`,
          }}
        >
          Last sponsor reminder ·{" "}
          {new Date(localLastNotifiedAt).toLocaleString()}
        </div>
      ) : null}

      {showEscalateConfirm ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm escalation"
          data-testid="approval-escalate-confirm"
          style={{
            marginTop: SPACING.sm,
            padding: SPACING.md,
            background: COLORS.coralSoft,
            borderRadius: RADIUS.md,
            color: COLORS.coralInk,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            lineHeight: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: SPACING.sm,
          }}
        >
          <div>
            Re-route this request to the platform-admin queue? The tenant admin
            will no longer be responsible for the decision; the escalation is
            logged to the audit trail.
          </div>
          <div style={{ display: "flex", gap: SPACING.sm }}>
            <button
              type="button"
              data-testid="approval-escalate-confirm-button"
              onClick={handleEscalateConfirmed}
              disabled={actionPending}
              style={{
                padding: `${SPACING.xs} ${SPACING.md}`,
                background: COLORS.coralInk,
                color: COLORS.white,
                border: "none",
                borderRadius: RADIUS.sm,
                fontFamily: TYPOGRAPHY.sans,
                fontWeight: 600,
                fontSize: 13,
                cursor: actionPending ? "progress" : "pointer",
              }}
            >
              {actionPending ? "Escalating…" : "Yes, escalate"}
            </button>
            <button
              type="button"
              data-testid="approval-escalate-cancel-button"
              onClick={() => setShowEscalateConfirm(false)}
              disabled={actionPending}
              style={{
                padding: `${SPACING.xs} ${SPACING.md}`,
                background: COLORS.white,
                color: COLORS.coralInk,
                border: `1px solid ${COLORS.coralInk}`,
                borderRadius: RADIUS.sm,
                fontFamily: TYPOGRAPHY.sans,
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
