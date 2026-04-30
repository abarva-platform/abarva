'use client';

// AdminSourceEventApprovalQueue
//
// Renders a compact approval queue card for sourcing events that were
// created via the commit_source_event agent tool and are waiting for
// admin review (lifecycle_state = 'waiting_on_client'). Only visible
// to admin role users; mounted on the /source/events page server component.

import { useState } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceEventRow } from '@/lib/source/queries';

interface Props {
  events: SourceEventRow[];
}

export function AdminSourceEventApprovalQueue({ events: initialEvents }: Props) {
  const [events, setEvents] = useState(initialEvents);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});
  const [results, setResults] = useState<Record<string, 'approved' | 'rejected'>>({});

  if (events.length === 0) return null;

  async function handleAction(eventId: string, action: 'approve' | 'reject') {
    setProcessing((p) => ({ ...p, [eventId]: true }));
    try {
      const res = await fetch(`/api/v1/source/events/${eventId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        setResults((r) => ({ ...r, [eventId]: action === 'approve' ? 'approved' : 'rejected' }));
        // Remove from queue after a short delay so the user sees the result
        setTimeout(() => {
          setEvents((ev) => ev.filter((e) => e.id !== eventId));
          setResults((r) => {
            const next = { ...r };
            delete next[eventId];
            return next;
          });
        }, 2000);
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

          return (
            <div
              key={ev.id}
              style={{
                padding: '10px 16px',
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                alignItems: 'center',
                gap: 12,
                borderBottom: '1px solid #f5efc8',
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
                    color: result === 'approved' ? '#065f46' : '#991b1b',
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: result === 'approved' ? '#d1fae5' : '#fee2e2',
                  }}
                >
                  {result}
                </span>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAction(ev.id, 'approve')}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 999,
                      border: 'none',
                      background: '#0c1a3a',
                      color: '#f8f7f4',
                      fontFamily: SHELL.MONO,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      cursor: busy ? 'not-allowed' : 'pointer',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    {busy ? '…' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAction(ev.id, 'reject')}
                    style={{
                      padding: '6px 14px',
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
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
