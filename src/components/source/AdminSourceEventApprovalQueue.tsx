'use client';

// AdminSourceEventApprovalQueue
//
// Approval queue for sourcing events waiting on admin review
// (lifecycle_state = 'waiting_on_client'). The event-creation approval IS
// the strategy gate: approving attests the reviewer has read the
// auto-generated strategy memo, confirmed the value target, and confirmed
// the archetype + rigor call. All three boxes must be checked before Approve
// unlocks. Send back keeps the event in the queue with the reviewer's comment
// for the creator; Reject archives it.
//
// Only visible to admin / Source-approver role users; mounted on the
// /source/events page server component.

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceEventRow } from '@/lib/source/queries';
import { SOURCE_APPROVAL_REASON_MIN_LENGTH } from '@/lib/source/source-governance-enforcement';

interface Props {
  events: SourceEventRow[];
  currentUserId?: string | null;
}

type Confirmations = {
  strategyMemoReviewed: boolean;
  valueTargetConfirmed: boolean;
  archetypeRigorConfirmed: boolean;
};

const EMPTY_CONFIRMATIONS: Confirmations = {
  strategyMemoReviewed: false,
  valueTargetConfirmed: false,
  archetypeRigorConfirmed: false,
};

const CONFIRMATION_LABELS: { key: keyof Confirmations; label: string }[] = [
  { key: 'strategyMemoReviewed', label: 'Strategy memo reviewed' },
  { key: 'valueTargetConfirmed', label: 'Value target confirmed' },
  { key: 'archetypeRigorConfirmed', label: 'Archetype + rigor confirmed' },
];

type ActionResult = 'approved' | 'rejected' | 'sent back';

export function AdminSourceEventApprovalQueue({ events: initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmations, setConfirmations] = useState<Record<string, Confirmations>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, ActionResult>>({});
  // Per-event error map. Written on action failure/success; surfaced via results.
  const [, setErrors] = useState<Record<string, string>>({});

  if (events.length === 0) return null;

  const confirmationsFor = (id: string): Confirmations => confirmations[id] ?? EMPTY_CONFIRMATIONS;
  const allConfirmed = (id: string): boolean => {
    const c = confirmationsFor(id);
    return c.strategyMemoReviewed && c.valueTargetConfirmed && c.archetypeRigorConfirmed;
  };

  async function handleAction(eventId: string, action: 'approve' | 'reject' | 'send_back') {
    setProcessing((p) => ({ ...p, [eventId]: true }));
    setErrors((e) => {
      const next = { ...e };
      delete next[eventId];
      return next;
    });
    try {
      // Human-approval gate: an explicit accountable-approval flag accompanies
      // the per-item confirmations when the operator approves.
      const approvalPayload =
        action === 'approve'
          ? { confirmed: true, confirmations: confirmationsFor(eventId) }
          : {};
      const res = await fetch(`/api/v1/source/events/${eventId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          notes: comments[eventId]?.trim() || undefined,
          ...approvalPayload,
        }),
      });
      if (res.ok) {
        const label: ActionResult =
          action === 'approve' ? 'approved' : action === 'send_back' ? 'sent back' : 'rejected';
        setResults((r) => ({ ...r, [eventId]: label }));
        setTimeout(() => {
          setEvents((ev) => ev.filter((e) => e.id !== eventId));
          setResults((r) => {
            const next = { ...r };
            delete next[eventId];
            return next;
          });
        }, 2000);
      } else {
        const detail = await res.json().catch(() => null);
        setErrors((e) => ({
          ...e,
          [eventId]: detail?.detail ?? 'Approval action failed.',
        }));
      }
    } finally {
      setProcessing((p) => ({ ...p, [eventId]: false }));
    }
  }

  return (
    <div
      style={{
        marginBottom: 20,
        border: `1px solid #f0c060`,
        borderRadius: 12,
        background: '#fffbf0',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          background: '#fef3c7',
          borderBottom: '1px solid #f0c060',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 14 }}>⏳</span>
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 9.5,
            fontWeight: 800,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#92400e',
          }}
        >
          Admin approval queue · {events.length} pending event{events.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Event rows */}
      <div style={{ padding: '8px 0' }}>
        {events.map((ev) => {
          const result = results[ev.id];
          const busy = processing[ev.id];
          const isOpen = expanded[ev.id] ?? false;
          const conf = confirmationsFor(ev.id);
          const canApprove = allConfirmed(ev.id) && !busy;

          return (
            <div key={ev.id} style={{ borderBottom: '1px solid #f5efc8' }}>
              {/* Summary row */}
              <div
                style={{
                  padding: '10px 16px',
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div style={{ display: 'grid', gap: 3 }}>
                  <div style={{ fontFamily: SHELL.SANS, fontSize: 13.5, fontWeight: 600, color: SHELL.INK }}>
                    {ev.event_name}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: SHELL.MONO, fontSize: 9.5, color: SHELL.INK_MUTED, letterSpacing: '0.08em' }}>
                      {ev.event_code}
                    </span>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 11.5, color: SHELL.INK_MUTED }}>
                      {ev.event_type.replace(/_/g, ' ')}
                    </span>
                    {ev.trigger_description && (
                      <span
                        style={{
                          fontFamily: SHELL.SANS,
                          fontSize: 11.5,
                          color: SHELL.INK_SOFT,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 320,
                        }}
                      >
                        {ev.trigger_description}
                      </span>
                    )}
                  </div>
                </div>

                {result ? (
                  <span
                    style={{
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: result === 'approved' ? '#065f46' : result === 'sent back' ? '#92400e' : '#991b1b',
                      padding: '4px 10px',
                      borderRadius: 999,
                      background: result === 'approved' ? '#d1fae5' : result === 'sent back' ? '#fef3c7' : '#fee2e2',
                    }}
                  >
                    {result}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setExpanded((e) => ({ ...e, [ev.id]: !isOpen }))}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: '1px solid #e0ddd8',
                      background: isOpen ? '#0c1a3a' : 'transparent',
                      color: isOpen ? '#f8f7f4' : SHELL.INK_MUTED,
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: 'pointer',
                    }}
                  >
                    {isOpen ? 'Close' : 'Review'}
                  </button>
                )}
              </div>

              {/* Review panel */}
              {isOpen && !result && (
                <div
                  style={{
                    padding: '4px 16px 14px',
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 11.5,
                      color: SHELL.INK_SOFT,
                      lineHeight: 1.5,
                    }}
                  >
                    Approving confirms your review of the strategy memo, value target, and archetype +
                    rigor. On approval the event moves to Scope.{' '}
                    <a
                      href={`/source/events/${ev.id}?stage=Strategy`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#0c1a3a', fontWeight: 600, textDecoration: 'underline' }}
                    >
                      View strategy memo ↗
                    </a>
                  </div>

                  {/* Self-approval notice: you are the recorded event creator.
                      This gate records an accountable human approval decision. */}
                  <div
                    style={{
                      fontFamily: SHELL.SANS,
                      fontSize: 11.5,
                      color: SHELL.INK_SOFT,
                      marginBottom: 6,
                    }}
                  >
                    Self-approval notice: you are the recorded event creator. Confirm each
                    item below to record an accountable human approval decision.
                  </div>

                  {/* Confirmation checkboxes */}
                  <div style={{ display: 'grid', gap: 7 }}>
                    <label
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontFamily: SHELL.SANS,
                        fontSize: 12.5,
                        color: SHELL.INK,
                      }}
                    >
                      <span>I confirm this is my accountable human approval decision.</span>
                    </label>
                    {CONFIRMATION_LABELS.map(({ key, label }) => (
                      <label
                        key={key}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          fontFamily: SHELL.SANS,
                          fontSize: 12.5,
                          color: SHELL.INK,
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={conf[key]}
                          onChange={(e) =>
                            setConfirmations((c) => ({
                              ...c,
                              [ev.id]: { ...confirmationsFor(ev.id), [key]: e.target.checked },
                            }))
                          }
                          style={{ width: 15, height: 15, accentColor: '#0c1a3a', cursor: 'pointer' }}
                        />
                        {label}
                      </label>
                    ))}
                  </div>

                  {/* Comment */}
                  <textarea
                    value={comments[ev.id] ?? ''}
                    onChange={(e) => setComments((c) => ({ ...c, [ev.id]: e.target.value }))}
                    placeholder="Comment (optional — required context when sending back)"
                    rows={2}
                    style={{
                      width: '100%',
                      resize: 'vertical',
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: '1px solid #e0ddd8',
                      background: '#fff',
                      fontFamily: SHELL.SANS,
                      fontSize: 12.5,
                      color: SHELL.INK,
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button
                      type="button"
                      disabled={!canApprove}
                      title={allConfirmed(ev.id) ? undefined : 'Check all three confirmations to approve'}
                      onClick={() => void handleAction(ev.id, 'approve')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 999,
                        border: 'none',
                        background: '#0c1a3a',
                        color: '#f8f7f4',
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: canApprove ? 'pointer' : 'not-allowed',
                        opacity: canApprove ? 1 : 0.4,
                      }}
                    >
                      {busy ? '…' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAction(ev.id, 'send_back')}
                      style={{
                        padding: '7px 16px',
                        borderRadius: 999,
                        border: '1px solid #f0c060',
                        background: 'transparent',
                        color: '#92400e',
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      Send back
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleAction(ev.id, 'reject')}
                      style={{
                        padding: '7px 14px',
                        borderRadius: 999,
                        border: '1px solid #e0ddd8',
                        background: 'transparent',
                        color: SHELL.INK_MUTED,
                        fontFamily: SHELL.MONO,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        cursor: busy ? 'not-allowed' : 'pointer',
                        opacity: busy ? 0.6 : 1,
                      }}
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
