'use client';

// PatternDoctrineSearch — client component for keyword search + family
// filter of the pattern doctrine library. Receives all patterns from the
// server component and applies ephemeral client-side filters via useState.
//
// Also provides the "Copy ID" functionality (clipboard) and the
// details/summary expander for full doctrine text.

import React, { useState, useMemo } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

// ─── Types ────────────────────────────────────────────────────────────────────

export type PatternFamily = 'source-event' | 'program' | 'sourcing-category';

export interface DoctrinePatternsEntry {
  id: string;
  title: string;
  body: string;
  family: PatternFamily;
}

type FamilyFilter = 'all' | PatternFamily;

// ─── Style constants ──────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}22`,
  borderRadius: RADIUS.md,
  padding: `6px ${SPACING.md}`,
  outline: 'none',
  lineHeight: 1.4,
};

// ─── Filter bar ───────────────────────────────────────────────────────────────

function FilterBar({
  query,
  onQueryChange,
  family,
  onFamilyChange,
  totalCount,
  filteredCount,
}: {
  query: string;
  onQueryChange: (v: string) => void;
  family: FamilyFilter;
  onFamilyChange: (v: FamilyFilter) => void;
  totalCount: number;
  filteredCount: number;
}) {
  const isFiltered = filteredCount < totalCount || query.trim().length > 0;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        flexWrap: 'wrap',
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.sm} ${SPACING.md}`,
      }}
    >
      <input
        type="search"
        placeholder="Search patterns by ID or keyword…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{
          ...INPUT_BASE,
          flex: '1 1 260px',
          minWidth: 180,
        }}
        aria-label="Search patterns"
      />

      <select
        value={family}
        onChange={(e) => onFamilyChange(e.target.value as FamilyFilter)}
        style={{
          ...INPUT_BASE,
          cursor: 'pointer',
          paddingRight: SPACING.xl,
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2307070799'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
          backgroundSize: '10px 6px',
        }}
        aria-label="Filter by family"
      >
        <option value="all">All families</option>
        <option value="source-event">Source Event</option>
        <option value="program">Program</option>
        <option value="sourcing-category">Sourcing Category</option>
      </select>

      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: isFiltered ? COLORS.navy : `${COLORS.ink}88`,
          fontWeight: isFiltered ? 600 : 400,
          whiteSpace: 'nowrap',
          marginLeft: SPACING.xs,
        }}
      >
        {isFiltered
          ? `${filteredCount} of ${totalCount} patterns`
          : `${totalCount} patterns`}
      </span>

      {isFiltered ? (
        <button
          type="button"
          onClick={() => {
            onQueryChange('');
            onFamilyChange('all');
          }}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: RADIUS.sm,
            textDecoration: 'underline',
          }}
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}

// ─── Pattern card ─────────────────────────────────────────────────────────────

function PatternCard({ entry }: { entry: DoctrinePatternsEntry }) {
  const [copied, setCopied] = useState(false);

  const preview = entry.body.length > 200 ? `${entry.body.slice(0, 200)}…` : entry.body;

  function handleCopy() {
    void navigator.clipboard.writeText(entry.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  const familyColor: React.CSSProperties =
    entry.family === 'program'
      ? { background: COLORS.skyPale, color: COLORS.navy }
      : entry.family === 'sourcing-category'
        ? { background: COLORS.mintSoft, color: COLORS.mintInk }
        : { background: `${COLORS.ink}08`, color: `${COLORS.ink}99` };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      {/* Header row: ID badge + family pill + copy button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <code
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11.5,
            color: COLORS.ink,
            background: COLORS.cream,
            padding: '2px 8px',
            borderRadius: RADIUS.sm,
            border: `1px solid ${COLORS.ink}14`,
            letterSpacing: '0.03em',
            flexShrink: 0,
          }}
        >
          {entry.id}
        </code>
        <span
          style={{
            display: 'inline-block',
            borderRadius: RADIUS.pill,
            padding: '2px 10px',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            flexShrink: 0,
            ...familyColor,
          }}
        >
          {entry.family === 'source-event'
            ? 'Source Event'
            : entry.family === 'program'
              ? 'Program'
              : 'Sourcing Category'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy pattern ID ${entry.id}`}
          title="Copy ID to clipboard"
          style={{
            marginLeft: 'auto',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            color: copied ? COLORS.mintInk : `${COLORS.ink}77`,
            background: copied ? COLORS.mintSoft : 'transparent',
            border: `1px solid ${copied ? COLORS.mintInk : COLORS.ink}22`,
            borderRadius: RADIUS.sm,
            padding: '3px 8px',
            cursor: 'pointer',
            transition: 'color 0.15s, background 0.15s',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span aria-hidden="true">📋</span>
          {copied ? 'Copied' : 'Copy ID'}
        </button>
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 17,
          fontWeight: 600,
          color: COLORS.ink,
          margin: 0,
          lineHeight: 1.3,
          letterSpacing: '-0.01em',
        }}
      >
        {entry.title}
      </p>

      {/* Body preview */}
      <p
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13.5,
          lineHeight: 1.6,
          color: `${COLORS.ink}bb`,
          margin: 0,
        }}
      >
        {preview}
      </p>

      {/* Expander: full doctrine */}
      {entry.body.length > 200 ? (
        <details>
          <summary
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12.5,
              color: COLORS.navy,
              cursor: 'pointer',
              userSelect: 'none',
              listStyle: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            View full doctrine →
          </summary>
          <div
            style={{
              marginTop: SPACING.md,
              paddingTop: SPACING.md,
              borderTop: `1px solid ${COLORS.ink}10`,
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 13.5,
              lineHeight: 1.7,
              color: `${COLORS.ink}cc`,
              whiteSpace: 'pre-wrap',
            }}
          >
            {entry.body}
          </div>
        </details>
      ) : null}
    </div>
  );
}

// ─── Group section ────────────────────────────────────────────────────────────

const FAMILY_META: Record<
  PatternFamily,
  { heading: (n: number) => string; order: number }
> = {
  'source-event': {
    heading: (n) => `Source Event Patterns (${n})`,
    order: 0,
  },
  program: {
    heading: (n) => `Program Patterns (${n})`,
    order: 1,
  },
  'sourcing-category': {
    heading: (n) => `Category Patterns (${n})`,
    order: 2,
  },
};

const FAMILY_ORDER: PatternFamily[] = ['source-event', 'program', 'sourcing-category'];

function GroupSection({
  family,
  entries,
}: {
  family: PatternFamily;
  entries: DoctrinePatternsEntry[];
}) {
  const meta = FAMILY_META[family];
  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 600,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          paddingBottom: SPACING.sm,
          borderBottom: `1px solid ${COLORS.ink}14`,
        }}
      >
        {meta.heading(entries.length)}
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(440px, 1fr))',
          gap: SPACING.lg,
        }}
      >
        {entries.map((entry) => (
          <PatternCard key={entry.id} entry={entry} />
        ))}
      </div>
    </section>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div
      style={{
        textAlign: 'center',
        padding: `${SPACING.xxl} ${SPACING.xl}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}77`,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
      }}
    >
      No patterns match the current filters.
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PatternDoctrineSearch({
  patterns,
}: {
  patterns: DoctrinePatternsEntry[];
}) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<FamilyFilter>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return patterns.filter((p) => {
      if (family !== 'all' && p.family !== family) return false;
      if (needle) {
        const haystack = `${p.id} ${p.title} ${p.body}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [patterns, query, family]);

  // Group filtered results by family, preserving order
  const grouped = useMemo(() => {
    const map = new Map<PatternFamily, DoctrinePatternsEntry[]>();
    for (const f of FAMILY_ORDER) {
      map.set(f, []);
    }
    for (const p of filtered) {
      map.get(p.family)?.push(p);
    }
    return map;
  }, [filtered]);

  const hasResults = filtered.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.xl }}>
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        family={family}
        onFamilyChange={setFamily}
        totalCount={patterns.length}
        filteredCount={filtered.length}
      />

      {hasResults ? (
        FAMILY_ORDER.filter((f) => (grouped.get(f)?.length ?? 0) > 0).map(
          (f) => (
            <GroupSection
              key={f}
              family={f}
              entries={grouped.get(f) ?? []}
            />
          ),
        )
      ) : (
        <EmptyState />
      )}
    </div>
  );
}
