import type { CSSProperties } from 'react';
import { CANVAS } from '../canvas-tokens';

export interface ActivityEntry {
  id: string;
  /** ISO timestamp. */
  at: string;
  /** Short description. */
  body: string;
  /** Optional actor (agent name or person). */
  actor?: string;
}

interface LogTabProps {
  entries: ActivityEntry[];
}

export function LogTab({ entries }: LogTabProps) {
  if (entries.length === 0) {
    return (
      <div data-testid="source-canvas-log-tab" style={EMPTY_STYLE}>
        <p style={EMPTY_TITLE_STYLE}>No activity recorded yet.</p>
        <p style={EMPTY_BODY_STYLE}>
          When the agent updates artifacts, advances stages, marks gate
          criteria, or records evidence, those events show up here as the
          audit trail.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="source-canvas-log-tab" style={CONTAINER_STYLE}>
      <header style={HEADER_STYLE}>
        <div style={EYEBROW_STYLE}>Activity log</div>
        <h2 style={TITLE_STYLE}>Recent</h2>
      </header>
      <ul style={LIST_STYLE}>
        {entries.map((e) => (
          <li key={e.id} style={ROW_STYLE}>
            <time dateTime={e.at} style={TIME_STYLE}>
              {formatTimestamp(e.at)}
            </time>
            <div style={ROW_BODY_STYLE}>
              {e.actor ? <span style={ACTOR_STYLE}>{e.actor}</span> : null}
              <span style={BODY_STYLE}>{e.body}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CONTAINER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 16,
  maxWidth: 720,
};

const HEADER_STYLE: CSSProperties = {
  display: 'grid',
  gap: 4,
  paddingBottom: 14,
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
};

const EYEBROW_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
};

const TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 22,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const LIST_STYLE: CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: 0,
};

const ROW_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '110px minmax(0, 1fr)',
  gap: 14,
  padding: '12px 0',
  borderBottom: `1px solid ${CANVAS.HAIRLINE}`,
  alignItems: 'baseline',
};

const TIME_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 11,
  letterSpacing: '0.04em',
  color: CANVAS.GRAY_DK,
};

const ROW_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.55,
  color: CANVAS.INK,
  display: 'grid',
  gap: 2,
};

const ACTOR_STYLE: CSSProperties = {
  fontFamily: CANVAS.MONO,
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: CANVAS.GRAY_DK,
  fontWeight: 600,
};

const BODY_STYLE: CSSProperties = {
  color: CANVAS.INK,
};

const EMPTY_STYLE: CSSProperties = {
  display: 'grid',
  gap: 8,
  padding: '32px 0',
};

const EMPTY_TITLE_STYLE: CSSProperties = {
  fontFamily: CANVAS.SERIF,
  fontSize: 20,
  fontWeight: 400,
  color: CANVAS.INK,
  margin: 0,
};

const EMPTY_BODY_STYLE: CSSProperties = {
  fontFamily: CANVAS.SANS,
  fontSize: 13,
  lineHeight: 1.6,
  color: CANVAS.INK_SOFT,
  margin: 0,
  maxWidth: 480,
};
