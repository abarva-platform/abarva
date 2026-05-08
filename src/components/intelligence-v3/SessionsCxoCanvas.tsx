'use client';

// Intelligence v3 · Sessions (CXO mode · PR-K2.4).
//
// Two views: threaded list (default · pinned + recent) · timeline.

import { useState } from 'react';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { CanvasHead } from './CanvasHead';
import { MERIDIAN_SESSIONS, type SessionRow } from './cxo-fixtures';

type SessionsView = 'threaded' | 'timeline';

const VIEWS: ReadonlyArray<{ key: SessionsView; label: string }> = [
  { key: 'threaded', label: 'Threaded' },
  { key: 'timeline', label: 'Timeline' },
];

interface Props {
  rows?: ReadonlyArray<SessionRow>;
}

export function SessionsCxoCanvas({ rows = MERIDIAN_SESSIONS }: Props) {
  const [view, setView] = useState<SessionsView>('threaded');

  const pinned = rows.filter((r) => r.pinned);
  const recent = rows.filter((r) => !r.pinned);

  return (
    <section data-canvas="sessions" data-view={view}>
      <CanvasHead
        eyebrow={
          <>
            Stage · <span style={{ color: COLORS.ink }}>Sessions</span>
          </>
        }
        title="Pick up an earlier thread · or scan what you've been working on."
        lead="Three pinned threads stay surfaced. Recent sessions cluster around the current focus areas. Search by topic via the right rail."
        meta={
          <>
            <strong style={{ color: COLORS.ink }}>132</strong> total conversations ·{' '}
            <strong style={{ color: COLORS.ink }}>8</strong> in the last 3 days
          </>
        }
        views={VIEWS}
        activeView={view}
        onViewChange={setView}
      />

      {view === 'threaded' && <ThreadedView pinned={pinned} recent={recent} />}
      {view === 'timeline' && <TimelineView rows={rows} />}
    </section>
  );
}

function ThreadedView({
  pinned,
  recent,
}: {
  pinned: ReadonlyArray<SessionRow>;
  recent: ReadonlyArray<SessionRow>;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <div>
        <SectionEyebrow>Pinned threads</SectionEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
          {pinned.map((r) => (
            <SessionCard key={r.thread} row={r} />
          ))}
        </div>
      </div>
      <div>
        <SectionEyebrow>Recent</SectionEyebrow>
        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xs }}>
          {recent.map((r) => (
            <SessionCard key={r.thread} row={r} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SessionCard({ row }: { row: SessionRow }) {
  return (
    <article
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderLeft: row.pinned ? `3px solid ${COLORS.amber}` : `3px solid ${COLORS.border}`,
        borderRadius: RADIUS.sm,
        padding: `${SPACING.sm}px ${SPACING.lg}px`,
        display: 'grid',
        gridTemplateColumns: '1fr 100px 70px',
        gap: SPACING.lg,
        alignItems: 'center',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: FONT.body,
            fontSize: 13.5,
            fontWeight: 600,
            color: COLORS.ink,
            display: 'flex',
            alignItems: 'center',
            gap: SPACING.xs,
          }}
        >
          {row.pinned && (
            <span aria-hidden="true" style={{ color: COLORS.amber }}>
              ★
            </span>
          )}
          {row.thread}
        </div>
        <div
          style={{
            fontSize: 12,
            color: COLORS.muted,
            marginTop: 2,
            lineHeight: 1.5,
          }}
        >
          {row.lastTurn}
        </div>
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10.5,
          color: COLORS.muted,
          letterSpacing: '0.06em',
          textAlign: 'right',
        }}
      >
        {row.exchanges} {row.exchanges === 1 ? 'turn' : 'turns'}
      </div>
      <div
        style={{
          fontFamily: FONT.mono,
          fontSize: 10,
          color: COLORS.mutedSoft,
          letterSpacing: '0.08em',
          textAlign: 'right',
        }}
      >
        {row.ageLabel}
      </div>
    </article>
  );
}

function TimelineView({ rows }: { rows: ReadonlyArray<SessionRow> }) {
  // Buckets sessions into "today / this week / earlier" for the timeline read.
  const buckets: Array<{ label: string; rows: SessionRow[] }> = [
    { label: 'Today', rows: [] },
    { label: 'This week', rows: [] },
    { label: 'Earlier', rows: [] },
  ];
  for (const r of rows) {
    const m = r.ageLabel.match(/(\d+)([hdw])/);
    if (!m) {
      buckets[2]!.rows.push(r);
      continue;
    }
    const n = parseInt(m[1]!, 10);
    const unit = m[2];
    if (unit === 'h') buckets[0]!.rows.push(r);
    else if (unit === 'd' && n <= 7) buckets[1]!.rows.push(r);
    else buckets[2]!.rows.push(r);
  }
  return (
    <div
      style={{
        background: COLORS.card,
        border: BORDER.hairline,
        borderRadius: RADIUS.md,
        padding: `${SPACING.lg}px ${SPACING.xxl}px`,
      }}
    >
      {buckets.map((b, i) => (
        <div
          key={b.label}
          style={{
            paddingBottom: SPACING.md,
            marginBottom: SPACING.md,
            borderBottom: i === buckets.length - 1 ? 'none' : BORDER.hairlineSoft,
          }}
        >
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              marginBottom: SPACING.sm,
            }}
          >
            {b.label} · {b.rows.length}
          </div>
          {b.rows.length === 0 ? (
            <div
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                color: COLORS.mutedSoft,
                letterSpacing: '0.06em',
                paddingLeft: SPACING.xs,
              }}
            >
              — none —
            </div>
          ) : (
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {b.rows.map((r) => (
                <li
                  key={r.thread}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '60px 1fr auto',
                    gap: SPACING.md,
                    padding: `${SPACING.xs}px 0`,
                    borderBottom: BORDER.hairlineSoft,
                    alignItems: 'baseline',
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      color: COLORS.muted,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {r.ageLabel}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.body,
                      fontSize: 13,
                      color: COLORS.ink,
                      fontWeight: r.pinned ? 600 : 500,
                    }}
                  >
                    {r.pinned && (
                      <span aria-hidden="true" style={{ color: COLORS.amber, marginRight: 6 }}>
                        ★
                      </span>
                    )}
                    {r.thread}
                  </span>
                  <span
                    style={{
                      fontFamily: FONT.mono,
                      fontSize: 10,
                      color: COLORS.muted,
                    }}
                  >
                    {r.exchanges}t
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: COLORS.muted,
        marginBottom: SPACING.sm,
      }}
    >
      {children}
    </div>
  );
}
