'use client';

// Client-side filter island for the reasoning changelog page.
//
// The page is a server component; this island only handles the kind
// filter chips and the resulting list render. It receives a frozen
// snapshot of entries from the server and never re-fetches.

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type {
  ReasoningCommitEntry,
  ReasoningCommitKind,
} from '@/lib/reasoning/changelog-parser';

const KIND_ORDER: ReadonlyArray<ReasoningCommitKind> = [
  'feat',
  'fix',
  'refactor',
  'docs',
  'chore',
];

type Filter = 'all' | ReasoningCommitKind;

interface ChangelogListProps {
  entries: ReadonlyArray<ReasoningCommitEntry>;
  counts: Record<ReasoningCommitKind, number>;
}

const KIND_LABEL: Record<ReasoningCommitKind, string> = {
  feat: 'feat',
  fix: 'fix',
  refactor: 'refactor',
  docs: 'docs',
  chore: 'chore',
};

function chipStyle(active: boolean): CSSProperties {
  return {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
    padding: '6px 12px',
    borderRadius: RADIUS.pill,
    border: `1px solid ${active ? COLORS.navy : `${COLORS.ink}22`}`,
    background: active ? COLORS.skyPale : COLORS.white,
    color: active ? COLORS.navy : `${COLORS.ink}99`,
    cursor: 'pointer',
  };
}

function kindChipStyle(kind: ReasoningCommitKind): CSSProperties {
  // All chips share the AbarVa palette — no random color assignments.
  // We tint the background per kind using the locked soft surfaces and
  // ink palette, never inventing new hex.
  const palette: Record<ReasoningCommitKind, { bg: string; fg: string }> = {
    feat: { bg: COLORS.skyPale, fg: COLORS.navy },
    fix: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
    refactor: { bg: COLORS.cream, fg: COLORS.ink },
    docs: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
    chore: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  };
  const { bg, fg } = palette[kind];
  return {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    padding: '2px 10px',
    borderRadius: RADIUS.pill,
    background: bg,
    color: fg,
  };
}

const ENTRY_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: `${SPACING.sm} 0`,
  borderTop: `1px solid ${COLORS.ink}10`,
};

const DATE_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11.5,
  color: `${COLORS.ink}77`,
};

const SUBJECT_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 14.5,
  color: COLORS.ink,
  lineHeight: 1.5,
};

const META_ROW_STYLE: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: `${COLORS.ink}88`,
  display: 'flex',
  gap: SPACING.sm,
  flexWrap: 'wrap',
};

const LINK_STYLE: CSSProperties = {
  color: COLORS.navy,
  textDecoration: 'underline',
  textUnderlineOffset: '2px',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export function ChangelogList({ entries, counts }: ChangelogListProps) {
  const [filter, setFilter] = useState<Filter>('all');

  const visible = useMemo(() => {
    if (filter === 'all') return entries;
    return entries.filter((e) => e.kind === filter);
  }, [entries, filter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <div style={{ display: 'flex', gap: SPACING.sm, flexWrap: 'wrap' }}>
        <button
          type="button"
          style={chipStyle(filter === 'all')}
          onClick={() => setFilter('all')}
        >
          all · {entries.length}
        </button>
        {KIND_ORDER.map((kind) => (
          <button
            key={kind}
            type="button"
            style={chipStyle(filter === kind)}
            onClick={() => setFilter(kind)}
          >
            {KIND_LABEL[kind]} · {counts[kind]}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 14,
            color: `${COLORS.ink}88`,
            margin: 0,
          }}
        >
          No entries for this filter.
        </p>
      ) : (
        <ul
          style={{
            margin: 0,
            padding: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {visible.map((entry) => (
            <li key={entry.sha} style={ENTRY_STYLE}>
              <span style={DATE_STYLE}>{formatDate(entry.date)}</span>
              <span
                style={{
                  display: 'flex',
                  gap: SPACING.sm,
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                }}
              >
                <span style={kindChipStyle(entry.kind)}>{entry.kind}</span>
                <span style={SUBJECT_STYLE}>{entry.short}</span>
              </span>
              <span style={META_ROW_STYLE}>
                <span>{entry.author}</span>
                {entry.prNumber !== null ? (
                  <a
                    href={`https://github.com/anandsundaram-hash/abarva/pull/${entry.prNumber}`}
                    style={LINK_STYLE}
                    target="_blank"
                    rel="noreferrer"
                  >
                    #{entry.prNumber}
                  </a>
                ) : null}
                <span style={{ fontFamily: TYPOGRAPHY.mono }}>
                  {entry.sha.slice(0, 7)}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
