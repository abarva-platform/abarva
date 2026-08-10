'use client';

import { useState, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { ANALYTICS } from './analytics-tokens';
import type { StageGateView } from './view-model';

interface ScopeGateProps {
  gate: StageGateView;
  /** Stage display name, for the H1 and the copy. */
  stageName: string;
  eventId?: string;
  stageKey?: string;
}

/**
 * Beat 3 — gate readiness. This page prepares a gate decision; the formal
 * decision/rationale belongs in the event approval workspace. Honest: a box goes green
 * because the evidence reached its target state — never because someone clicked
 * "mark met."
 */
export function ScopeGate({ gate, stageName, eventId }: ScopeGateProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState<ReadonlySet<number>>(new Set());
  const allConfirmed = confirmed.size === gate.confirms.length;
  const last = gate.nextStageName === null;
  const canOpenApprovalWorkspace = allConfirmed && Boolean(eventId);

  const cardStyle: CSSProperties = {
    border: `1px solid ${ANALYTICS.LINE}`,
    borderRadius: ANALYTICS.RADIUS_LG,
    background: ANALYTICS.CARD,
    padding: '20px 22px',
  };

  return (
    <section style={cardStyle} data-testid="scope-gate">
      <h3
        style={{
          fontFamily: ANALYTICS.SERIF,
          fontSize: 18,
          fontWeight: 700,
          letterSpacing: '-0.3px',
          color: ANALYTICS.INK,
          margin: 0,
        }}
      >
        {stageName} · gate
      </h3>
      <p
        style={{
          fontSize: 13.5,
          color: ANALYTICS.MUTED,
          lineHeight: 1.5,
          margin: '8px 0 18px',
          maxWidth: '58ch',
        }}
      >
        {gate.approver} confirms three things before {stageName} advances
        {last
          ? ' and the event closes.'
          : `. This page prepares the gate; the formal decision happens in the event approval workspace.`}
      </p>

      <div
        style={{
          border: `1px solid ${ANALYTICS.LINE_SOFT}`,
          borderRadius: ANALYTICS.RADIUS,
          background: ANALYTICS.SOFT,
          padding: '12px 14px',
          marginBottom: 14,
          fontSize: 12.5,
          color: ANALYTICS.INK_2,
          lineHeight: 1.5,
        }}
      >
        <b>What good looks like here:</b> inputs are complete, exceptions are
        visible, and the approval packet is ready to review. The event approval
        workspace records the human rationale and advances the event.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {gate.confirms.map((confirm, i) => {
          const on = confirmed.has(i);
          return (
            <button
              key={confirm.label}
              type="button"
              onClick={() =>
                setConfirmed((prev) => {
                  const next = new Set(prev);
                  if (next.has(i)) next.delete(i);
                  else next.add(i);
                  return next;
                })
              }
              aria-pressed={on}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '14px 16px',
                border: `1px solid ${on ? ANALYTICS.GREEN : ANALYTICS.LINE}`,
                borderRadius: 11,
                cursor: 'pointer',
                background: on ? ANALYTICS.GREEN_TINT : ANALYTICS.CARD,
                textAlign: 'left',
                width: '100%',
                fontFamily: ANALYTICS.SANS,
              }}
            >
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  border: `1.5px solid ${on ? ANALYTICS.GREEN : ANALYTICS.LINE_STRONG}`,
                  background: on ? ANALYTICS.GREEN : ANALYTICS.CARD,
                  color: on ? '#fff' : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              >
                ✓
              </span>
              <span style={{ fontSize: 14, fontWeight: 600, color: ANALYTICS.INK }}>
                {confirm.label}
                <span
                  style={{
                    display: 'block',
                    fontWeight: 400,
                    color: ANALYTICS.MUTED,
                    fontSize: 13,
                    marginTop: 2,
                  }}
                >
                  {confirm.detail}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: '13px 15px',
          borderRadius: ANALYTICS.RADIUS,
          background: ANALYTICS.AMBER_TINT,
          marginTop: 16,
          fontSize: 12.5,
          color: ANALYTICS.INK_2,
          lineHeight: 1.5,
        }}
      >
        <span style={{ color: ANALYTICS.AMBER, fontWeight: 800, flexShrink: 0 }}>!</span>
        <div>
          A gate item is green because the evidence reached its target state —{' '}
          <b style={{ color: ANALYTICS.AMBER_TEXT }}>never</b> because someone clicked
          &ldquo;mark met.&rdquo; Value figures stay ranges with confidence, never a
          guaranteed %.
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            color: ANALYTICS.FAINT,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Prepared for approval
        </div>
        <div
          style={{
            border: `1px dashed ${ANALYTICS.LINE_STRONG}`,
            borderRadius: 11,
            padding: '15px 17px',
            background: ANALYTICS.SOFT,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {gate.generates.map((deliverable) => (
              <div
                key={deliverable.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontSize: 13.5,
                  color: deliverable.isReadinessPack ? ANALYTICS.AMBER_TEXT : ANALYTICS.INK_2,
                  fontWeight: deliverable.isReadinessPack ? 600 : 400,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: deliverable.isReadinessPack
                      ? ANALYTICS.AMBER
                      : ANALYTICS.BLUE,
                    flexShrink: 0,
                  }}
                />
                {deliverable.label}
                {deliverable.code ? (
                  <code
                    style={{
                      fontFamily: ANALYTICS.MONO,
                      fontSize: 12,
                      color: ANALYTICS.MUTED,
                    }}
                  >
                    {deliverable.code}
                  </code>
                ) : null}
              </div>
            ))}
          </div>
          <div
            style={{
              fontSize: 12.5,
              color: ANALYTICS.MUTED,
              marginTop: 11,
              paddingTop: 11,
              borderTop: `1px solid ${ANALYTICS.LINE_SOFT}`,
              lineHeight: 1.5,
            }}
          >
            <b style={{ color: ANALYTICS.INK_2 }}>Nothing is generated yet.</b> These are
            prepared automatically after the approval decision — there is no build step on
            this stage page.
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          type="button"
          disabled={!canOpenApprovalWorkspace}
          onClick={() => {
            if (!eventId) return;
            router.push(`/source/events/${eventId}/approval`);
          }}
          style={{
            border: 'none',
            borderRadius: ANALYTICS.RADIUS_SM,
            background: canOpenApprovalWorkspace ? ANALYTICS.INK : 'rgba(10,10,11,0.12)',
            color: canOpenApprovalWorkspace ? '#fff' : ANALYTICS.FAINT,
            fontFamily: ANALYTICS.SANS,
            fontSize: 13.5,
            fontWeight: 600,
            padding: '11px 18px',
            cursor: canOpenApprovalWorkspace ? 'pointer' : 'not-allowed',
          }}
        >
          {last ? 'Open final approval ->' : 'Open event approval page ->'}
        </button>
        {!canOpenApprovalWorkspace ? (
          <span style={{ fontSize: 11.5, color: ANALYTICS.FAINT }}>
            {allConfirmed ? 'Event workspace context required' : 'Confirm all three above'}
          </span>
        ) : null}
      </div>
    </section>
  );
}
