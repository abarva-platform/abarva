/**
 * InstanceEventTimeline — server-friendly presentational component.
 *
 * Renders a vertical, newest-first list of `TimelineEntry` rows for a single
 * reasoning instance. Pure props in / JSX out (no hooks, no client-only
 * APIs), so callers can drop it into a server component or a client one.
 *
 * Empty list renders an inline hint instead of disappearing — this keeps the
 * card visible on freshly-loaded pages so users discover that interacting
 * with the instance populates the timeline.
 *
 * Palette: AbarVa SHELL tokens only.
 */

import {
  formatRelativeTime,
  type TimelineEntry,
  type TimelineEntryKind,
} from '@/lib/reasoning/instance-event-timeline';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface InstanceEventTimelineProps {
  /** Pre-built, newest-first timeline entries. */
  entries: TimelineEntry[];
  /** Cap the rendered rows. Defaults to 12 — matches the ribbon density target. */
  maxRows?: number;
  /** Optional override for the section title. */
  title?: string;
  /**
   * Optional override for "now" — exposed primarily so visual tests can pin
   * the relative-time output. Defaults to `Date.now()` at render time.
   */
  nowMs?: number;
}

const DEFAULT_TITLE = 'Reasoning events';
const DEFAULT_MAX_ROWS = 12;

const EMPTY_COPY =
  'No reasoning events yet · interact with this instance to populate';

export function InstanceEventTimeline({
  entries,
  maxRows = DEFAULT_MAX_ROWS,
  title = DEFAULT_TITLE,
  nowMs,
}: InstanceEventTimelineProps) {
  const visible = entries.slice(0, maxRows);
  const hidden = Math.max(0, entries.length - visible.length);

  if (entries.length === 0) {
    return (
      <section data-testid="instance-event-timeline-empty" style={sectionStyle}>
        <SectionHeader label={title} count={0} />
        <div style={emptyStyle}>{EMPTY_COPY}</div>
      </section>
    );
  }

  return (
    <section data-testid="instance-event-timeline" style={sectionStyle}>
      <SectionHeader label={title} count={entries.length} />
      <div style={listStyle}>
        {visible.map(entry => (
          <TimelineRow key={entry.id} entry={entry} nowMs={nowMs} />
        ))}
      </div>
      {hidden > 0 && (
        <div style={truncationStyle}>
          + {hidden} earlier event{hidden === 1 ? '' : 's'} not shown
        </div>
      )}
    </section>
  );
}

// ─── Internals ───────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  marginTop: 16,
  marginBottom: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
};

const listStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 8,
  background: SHELL.CARD_WHITE,
  padding: '10px 12px',
};

const emptyStyle: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  color: SHELL.INK_MUTED,
  background: SHELL.CARD_WHITE,
  border: `1px dashed ${SHELL.CARD_LINE_SOFT}`,
  borderRadius: 8,
  padding: '12px 14px',
  lineHeight: 1.5,
};

const truncationStyle: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 10,
  color: SHELL.INK_MUTED,
  letterSpacing: '0.06em',
  paddingLeft: 4,
};

function SectionHeader({ label, count }: { label: string; count: number }) {
  return (
    <div
      style={{
        fontFamily: SHELL.MONO,
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.14em',
        color: SHELL.INK_MUTED,
      }}
    >
      {label} · {count}
    </div>
  );
}

function TimelineRow({
  entry,
  nowMs,
}: {
  entry: TimelineEntry;
  nowMs?: number;
}) {
  const kindStyle = KIND_STYLE[entry.kind];
  const chips = pickInlineChips(entry);

  return (
    <article
      data-testid={`timeline-row-${entry.kind}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        paddingTop: 6,
        paddingBottom: 6,
        borderTop: `1px solid ${SHELL.CARD_LINE_SOFT}`,
      }}
    >
      <span
        aria-label={kindStyle.ariaLabel}
        title={kindStyle.ariaLabel}
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: kindStyle.dot,
          flexShrink: 0,
          marginTop: 6,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: SHELL.MONO,
              fontSize: 9,
              color: SHELL.INK_MUTED,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              minWidth: 60,
            }}
          >
            {formatRelativeTime(entry.timestamp, nowMs)}
          </span>
          <span
            style={{
              fontFamily: SHELL.SANS,
              fontSize: 12,
              color: SHELL.INK,
              lineHeight: 1.4,
            }}
          >
            {entry.label}
          </span>
        </div>
        {chips.length > 0 && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 4,
            }}
          >
            {chips.map((chip, i) => (
              <span key={`${entry.id}-chip-${i}`} style={chipStyle}>
                {chip}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

const chipStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontFamily: SHELL.MONO,
  fontSize: 9,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: SHELL.INK_SOFT,
  background: SHELL.GRAY_BG,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: 999,
  padding: '1px 7px',
  lineHeight: 1.4,
};

interface KindStyle {
  dot: string;
  ariaLabel: string;
}

const KIND_STYLE: Record<TimelineEntryKind, KindStyle> = {
  synthesis: { dot: SHELL.AMBER_DOT, ariaLabel: 'Synthesis event' },
  'evidence-ingested': { dot: SHELL.MINT_TEXT, ariaLabel: 'Evidence ingested' },
  'contradiction-resolved': {
    dot: SHELL.RUST_TEXT,
    ariaLabel: 'Contradiction resolved',
  },
};

function pickInlineChips(entry: TimelineEntry): string[] {
  const out: string[] = [];
  const meta = entry.meta;
  if (entry.kind === 'synthesis') {
    const cites = meta.citationCount;
    const contras = meta.contradictionCount;
    const fmodes = meta.failureModeCount;
    const pattern = meta.patternId;
    if (typeof cites === 'number' && cites > 0) out.push(`${cites} cite${cites === 1 ? '' : 's'}`);
    if (typeof contras === 'number' && contras > 0) out.push(`${contras} contradict${contras === 1 ? 'ion' : 'ions'}`);
    if (typeof fmodes === 'number' && fmodes > 0) out.push(`${fmodes} failure-mode${fmodes === 1 ? '' : 's'}`);
    if (typeof pattern === 'string' && pattern.length > 0) out.push(pattern);
  } else if (entry.kind === 'evidence-ingested') {
    const source = meta.source;
    const kind = meta.kind;
    if (typeof kind === 'string' && kind.length > 0) out.push(kind);
    if (typeof source === 'string' && source.length > 0) out.push(`via ${source}`);
  } else if (entry.kind === 'contradiction-resolved') {
    const tpl = meta.templateId;
    if (typeof tpl === 'string' && tpl.length > 0) out.push(tpl);
  }
  return out;
}
