'use client';

// OV2-2c · Tenant-admin approval queue · decision panel (client)
//
// Renders the rationale textarea + Approve/Reject buttons. POSTs to
// /api/admin/programs/approvals/[requestId]. On success, redirects
// back to /admin/programs/approvals so the queue re-renders.
//
// Client-side validation: rationale is required (non-empty) for
// 'rejected'. The server enforces the same rule.

import { useCallback, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface ApprovalDecisionPanelProps {
  requestId: string;
  /** When true, the panel renders read-only; used after a decision lands. */
  alreadyDecided?: boolean;
  /** Optional override for the post URL (test seam). */
  postUrl?: string;
}

type Decision = 'approved' | 'rejected';

interface ApiResponse {
  ok?: boolean;
  error?: string;
  detail?: string;
}

export function ApprovalDecisionPanel({
  requestId,
  alreadyDecided = false,
  postUrl,
}: ApprovalDecisionPanelProps) {
  const router = useRouter();
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rationaleId = useId();

  const submit = useCallback(
    async (decision: Decision) => {
      setError(null);
      const trimmed = rationale.trim();
      if (decision === 'rejected' && trimmed.length === 0) {
        setError('Rationale is required to reject.');
        return;
      }
      setSubmitting(decision);
      try {
        const url =
          postUrl ?? `/api/admin/programs/approvals/${requestId}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
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
        router.push('/admin/programs/approvals');
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'request failed');
        setSubmitting(null);
      }
    },
    [postUrl, rationale, requestId, router],
  );

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
        This request has already been decided. See the audit trail
        below.
      </section>
    );
  }

  const inFlight = submitting !== null;

  return (
    <section
      aria-label="Decision"
      data-testid="approval-decision-panel"
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <header>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
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
            margin: '6px 0 0',
            lineHeight: 1.55,
          }}
        >
          Your decision approves Phase 0 unlock or rejects with
          rationale. Both are audited.
        </p>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor={rationaleId}
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}80`,
            fontWeight: 600,
          }}
        >
          Rationale (required to reject)
        </label>
        <textarea
          id={rationaleId}
          data-testid="approval-rationale-textarea"
          value={rationale}
          onChange={(e) => setRationale(e.target.value)}
          rows={4}
          spellCheck
          disabled={inFlight}
          placeholder="Why are you approving or rejecting this brief? Optional for approve; required for reject."
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: COLORS.ink,
            padding: SPACING.md,
            borderRadius: RADIUS.md,
            border: `1px solid ${COLORS.ink}24`,
            background: COLORS.white,
            resize: 'vertical',
            minHeight: 100,
          }}
        />
      </div>

      {error ? (
        <div
          role="alert"
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

      <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
        <button
          type="button"
          data-testid="approval-approve-button"
          aria-label="Approve request"
          onClick={() => submit('approved')}
          disabled={inFlight}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.ink,
            color: COLORS.cream,
            borderRadius: RADIUS.md,
            border: 'none',
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor: inFlight ? 'progress' : 'pointer',
            opacity: inFlight ? 0.7 : 1,
          }}
        >
          {submitting === 'approved' ? 'Approving…' : 'Approve'}
        </button>
        <button
          type="button"
          data-testid="approval-reject-button"
          aria-label="Reject request"
          onClick={() => submit('rejected')}
          disabled={inFlight}
          style={{
            padding: `${SPACING.sm} ${SPACING.lg}`,
            background: COLORS.white,
            color: COLORS.coralInk,
            border: `1px solid ${COLORS.coralInk}`,
            borderRadius: RADIUS.md,
            fontFamily: TYPOGRAPHY.sans,
            fontWeight: 600,
            fontSize: 14,
            cursor: inFlight ? 'progress' : 'pointer',
            opacity: inFlight ? 0.7 : 1,
          }}
        >
          {submitting === 'rejected' ? 'Rejecting…' : 'Reject'}
        </button>
      </div>
    </section>
  );
}
