'use client';

// PatternFilterView — client component for keyword search + category/family
// filtering of the pattern usage analytics table.
//
// Receives the full sorted rows from the server component and applies
// client-side filters via useState. No URL params — filter state is ephemeral.
//
// Also hosts the inline PatternBodyEditor — each row has an "Edit" ghost
// button that expands the editor below that row.

import React, { useState, useMemo } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { PatternUsageRow } from '@/lib/reasoning/pattern-usage-analytics';
import { PatternBodyEditor } from '@/components/admin/reasoning/PatternBodyEditor';

// ─── Types ────────────────────────────────────────────────────────────────────

type FamilyFilter = 'all' | 'source-event' | 'program';

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function formatPct(value: number): string {
  return `${(value * 100).toFixed(0)}%`;
}

function CoverageChip({
  covered,
  total,
}: {
  covered: number;
  total: number;
}) {
  if (total === 0) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}66`,
        }}
      >
        —
      </span>
    );
  }
  const ratio = covered / total;
  const palette =
    ratio >= 0.66
      ? { bg: COLORS.mintSoft, fg: COLORS.mintInk }
      : ratio >= 0.33
        ? { bg: COLORS.skyPale, fg: COLORS.navy }
        : { bg: COLORS.coralSoft, fg: COLORS.coralInk };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {covered} / {total} · {formatPct(ratio)}
    </span>
  );
}

function FamilyPill({ family }: { family: PatternUsageRow['family'] }) {
  const isProgram = family === 'program';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isProgram ? COLORS.skyPale : `${COLORS.ink}08`,
        color: isProgram ? COLORS.navy : `${COLORS.ink}99`,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {isProgram ? 'Program' : 'Source Event'}
    </span>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

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
  const isFiltered = filteredCount < totalCount;

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
      {/* Search input */}
      <input
        type="search"
        placeholder="Search patterns…"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        style={{
          ...INPUT_BASE,
          flex: '1 1 220px',
          minWidth: 160,
        }}
        aria-label="Search patterns by ID or label"
      />

      {/* Family / category select */}
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
        aria-label="Filter by category"
      >
        <option value="all">All categories</option>
        <option value="source-event">Source Event (PAT-SRC-*)</option>
        <option value="program">Program (PAT-PRG-*)</option>
      </select>

      {/* Count badge */}
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

      {/* Clear button — only shown when filters are active */}
      {isFiltered || query ? (
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

// ─── Table ────────────────────────────────────────────────────────────────────

function PatternUsageTable({
  rows,
  totalCount,
  patternBodies,
}: {
  rows: PatternUsageRow[];
  totalCount: number;
  patternBodies: Record<string, string>;
}) {
  const [openEditorId, setOpenEditorId] = useState<string | null>(null);

  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
        }}
      >
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Patterns by activity
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by total events desc ·{' '}
          {rows.length < totalCount
            ? `${rows.length} of ${totalCount} patterns`
            : `${rows.length} patterns`}
        </span>
      </header>

      {rows.length === 0 ? (
        <div
          style={{
            padding: `${SPACING.xl} ${SPACING.lg}`,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
          }}
        >
          No patterns match the current filters.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}
          >
            <thead>
              <tr>
                <th style={HEADER_CELL}>Pattern</th>
                <th style={HEADER_CELL}>Family</th>
                <th style={HEADER_CELL}>Instances</th>
                <th style={HEADER_CELL}>Contradiction coverage</th>
                <th style={HEADER_CELL}>Failure-mode coverage</th>
                <th style={HEADER_CELL}>Synthesis events</th>
                <th style={HEADER_CELL}>Cascade events</th>
                <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isOpen = openEditorId === row.patternId;
                const defaultBody = patternBodies[row.patternId] ?? '';
                return (
                  <React.Fragment key={row.patternId}>
                    <tr>
                      <td style={BODY_CELL}>
                        <a
                          href={`/source/patterns/${row.patternId}`}
                          style={{
                            textDecoration: 'none',
                            color: COLORS.ink,
                            display: 'block',
                          }}
                        >
                          <div
                            style={{
                              fontFamily: TYPOGRAPHY.mono,
                              fontSize: 11,
                              color: `${COLORS.ink}77`,
                              letterSpacing: '0.04em',
                            }}
                          >
                            {row.patternId}
                          </div>
                          <div
                            style={{
                              fontFamily: TYPOGRAPHY.serif,
                              fontSize: 14,
                              color: COLORS.navy,
                              marginTop: 2,
                            }}
                          >
                            {row.patternLabel}
                          </div>
                        </a>
                      </td>
                      <td style={BODY_CELL}>
                        <FamilyPill family={row.family} />
                      </td>
                      <td style={MONO_CELL}>
                        {row.instanceCount === 0 ? (
                          <span style={{ color: `${COLORS.ink}66` }}>0</span>
                        ) : (
                          row.instanceCount
                        )}
                      </td>
                      <td style={BODY_CELL}>
                        <CoverageChip
                          covered={row.contradictionTemplatesCovered}
                          total={row.contradictionTemplateCount}
                        />
                      </td>
                      <td style={BODY_CELL}>
                        <CoverageChip
                          covered={row.failureModesCovered}
                          total={row.failureModeTemplateCount}
                        />
                      </td>
                      <td style={MONO_CELL}>
                        {row.synthesisEventCount}
                        <span style={{ color: `${COLORS.ink}66`, marginLeft: 4 }}>
                          ({row.synthesisEventCountLast24h} in 24h)
                        </span>
                      </td>
                      <td style={MONO_CELL}>
                        {row.cascadeAsSourceCount}→ / →{row.cascadeAsTargetCount}
                      </td>
                      <td
                        style={{
                          ...BODY_CELL,
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <button
                          type="button"
                          aria-label={`Edit body for ${row.patternId}`}
                          onClick={() =>
                            setOpenEditorId(isOpen ? null : row.patternId)
                          }
                          style={{
                            fontFamily: TYPOGRAPHY.sans,
                            fontSize: 11,
                            fontWeight: 600,
                            color: isOpen ? COLORS.navy : COLORS.ink,
                            background: isOpen
                              ? `${COLORS.navy}10`
                              : 'transparent',
                            border: `1px solid ${isOpen ? COLORS.navy : COLORS.ink}22`,
                            borderRadius: RADIUS.sm,
                            padding: '4px 10px',
                            cursor: 'pointer',
                            letterSpacing: '0.02em',
                          }}
                        >
                          Edit ✏
                        </button>
                      </td>
                    </tr>
                    {isOpen ? (
                      <tr key={`${row.patternId}-editor`}>
                        <td
                          colSpan={8}
                          style={{
                            padding: `${SPACING.sm} ${SPACING.md} ${SPACING.md}`,
                            borderBottom: `1px solid ${COLORS.ink}10`,
                            background: `${COLORS.ink}02`,
                          }}
                        >
                          <PatternBodyEditor
                            patternId={row.patternId}
                            defaultBody={defaultBody}
                            onClose={() => setOpenEditorId(null)}
                          />
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PatternFilterView({
  rows,
  patternBodies,
}: {
  rows: PatternUsageRow[];
  patternBodies: Record<string, string>;
}) {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<FamilyFilter>('all');

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      // Family filter
      if (family !== 'all' && row.family !== family) return false;
      // Keyword filter — match against patternId or patternLabel
      if (needle) {
        const haystack = `${row.patternId} ${row.patternLabel}`.toLowerCase();
        if (!haystack.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, query, family]);

  return (
    <>
      <FilterBar
        query={query}
        onQueryChange={setQuery}
        family={family}
        onFamilyChange={setFamily}
        totalCount={rows.length}
        filteredCount={filtered.length}
      />
      <PatternUsageTable
        rows={filtered}
        totalCount={rows.length}
        patternBodies={patternBodies}
      />
    </>
  );
}
