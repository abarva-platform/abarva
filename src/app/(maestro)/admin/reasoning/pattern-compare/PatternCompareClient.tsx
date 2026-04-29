'use client';

import React, { useState, useMemo } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

// ─── Serialized types (JSON-safe, passed from server) ─────────────────────────

export interface SerializedStage {
  id: string;
  label: string;
  order: number;
}

export interface SerializedGateCriterion {
  id: string;
  stageId: string;
  gateType: 'hard' | 'soft';
  description: string;
}

export interface SerializedContradictionTemplate {
  id: string;
  label: string;
  severity: 'low' | 'medium' | 'high';
}

export interface SerializedFailureMode {
  id: string;
  label: string;
}

export interface SerializedPattern {
  id: string;
  title: string;
  stages: SerializedStage[];
  gateCriteria: SerializedGateCriterion[];
  contradictionTemplates: SerializedContradictionTemplate[];
  failureModes: SerializedFailureMode[];
}

export interface PatternCompareClientProps {
  patterns: SerializedPattern[];
}

// ─── Style constants ─────────────────────────────────────────────────────────

const CARD: React.CSSProperties = {
  background: SHELL.CARD_WHITE,
  border: `1px solid ${SHELL.CARD_LINE}`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const SECTION_HEADER: React.CSSProperties = {
  padding: `${SPACING.md} ${SPACING.lg}`,
  borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  background: SHELL.PAPER_SOFT,
};

const H2: React.CSSProperties = {
  fontFamily: SHELL.SERIF,
  fontSize: 20,
  color: SHELL.INK,
  margin: 0,
  letterSpacing: '-0.01em',
};

const LABEL_UPPER: React.CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 11,
  letterSpacing: '0.1em',
  textTransform: 'uppercase' as const,
  color: SHELL.INK_MUTED,
  fontWeight: 600,
};

const MONO: React.CSSProperties = {
  fontFamily: SHELL.MONO,
  fontSize: 12,
  color: SHELL.INK_SOFT,
};

const BADGE_BASE: React.CSSProperties = {
  display: 'inline-block',
  borderRadius: RADIUS.pill,
  padding: '2px 10px',
  fontFamily: SHELL.SANS,
  fontSize: 11,
  fontWeight: 600,
};

function RustBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...BADGE_BASE, background: SHELL.RUST_BG, color: SHELL.RUST_TEXT }}>
      {children}
    </span>
  );
}

function MintBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...BADGE_BASE, background: SHELL.MINT_BG, color: SHELL.MINT_TEXT }}>
      {children}
    </span>
  );
}

function GrayBadge({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ ...BADGE_BASE, background: SHELL.GRAY_BG, color: SHELL.GRAY_TEXT }}>
      {children}
    </span>
  );
}

// ─── Pattern selector ─────────────────────────────────────────────────────────

function PatternSelector({
  label,
  value,
  patterns,
  onChange,
  excludeId,
}: {
  label: string;
  value: string;
  patterns: SerializedPattern[];
  onChange: (id: string) => void;
  excludeId?: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
      <div style={LABEL_UPPER}>{label}</div>
      <select
        value={value}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
        style={{
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.INK,
          background: SHELL.CARD_WHITE,
          border: `1px solid ${SHELL.CARD_LINE}`,
          borderRadius: RADIUS.md,
          padding: `${SPACING.sm} ${SPACING.md}`,
          cursor: 'pointer',
          width: '100%',
        }}
      >
        {patterns.map((p) => (
          <option key={p.id} value={p.id} disabled={p.id === excludeId}>
            {p.id} — {p.title}
          </option>
        ))}
      </select>
    </div>
  );
}

// ─── Summary cards ────────────────────────────────────────────────────────────

interface PatternStats {
  stageCount: number;
  totalGates: number;
  hardGates: number;
  softGates: number;
  contradictions: number;
  failureModes: number;
}

function getPatternStats(p: SerializedPattern): PatternStats {
  const hard = p.gateCriteria.filter((g) => g.gateType === 'hard').length;
  return {
    stageCount: p.stages.length,
    totalGates: p.gateCriteria.length,
    hardGates: hard,
    softGates: p.gateCriteria.length - hard,
    contradictions: p.contradictionTemplates.length,
    failureModes: p.failureModes.length,
  };
}

function SummaryTable({ patternA, patternB }: { patternA: SerializedPattern; patternB: SerializedPattern }) {
  const statsA = getPatternStats(patternA);
  const statsB = getPatternStats(patternB);

  const rows: Array<{ label: string; a: number; b: number }> = [
    { label: 'Stages', a: statsA.stageCount, b: statsB.stageCount },
    { label: 'Total gate criteria', a: statsA.totalGates, b: statsB.totalGates },
    { label: 'Hard gates', a: statsA.hardGates, b: statsB.hardGates },
    { label: 'Soft gates', a: statsA.softGates, b: statsB.softGates },
    { label: 'Contradiction templates', a: statsA.contradictions, b: statsB.contradictions },
    { label: 'Failure modes', a: statsA.failureModes, b: statsB.failureModes },
  ];

  const HEADER_CELL: React.CSSProperties = {
    fontFamily: SHELL.SERIF,
    fontSize: 13,
    fontWeight: 700,
    color: SHELL.INK,
    textAlign: 'left',
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  };

  const CELL: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 13,
    color: SHELL.INK,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
    verticalAlign: 'middle',
  };

  const META_CELL: React.CSSProperties = {
    fontFamily: SHELL.SANS,
    fontSize: 13,
    color: SHELL.INK_SOFT,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  };

  return (
    <section style={CARD}>
      <div style={SECTION_HEADER}>
        <h2 style={H2}>Summary</h2>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Metric</th>
              <th style={{ ...HEADER_CELL, color: SHELL.INK_MID }}>
                <span style={{ ...MONO, fontSize: 11 }}>{patternA.id}</span>
              </th>
              <th style={{ ...HEADER_CELL, color: SHELL.INK_MID }}>
                <span style={{ ...MONO, fontSize: 11 }}>{patternB.id}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td style={META_CELL}>{row.label}</td>
                <td style={{
                  ...CELL,
                  background: row.a > row.b ? SHELL.BLUE_BG : row.a < row.b ? SHELL.GRAY_BG : 'transparent',
                }}>
                  {row.a}
                </td>
                <td style={{
                  ...CELL,
                  background: row.b > row.a ? SHELL.BLUE_BG : row.b < row.a ? SHELL.GRAY_BG : 'transparent',
                }}>
                  {row.b}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Stage comparison ─────────────────────────────────────────────────────────

function StageComparison({ patternA, patternB }: { patternA: SerializedPattern; patternB: SerializedPattern }) {
  // Collect all unique stage IDs, ordered by appearance in A then B
  const stageMap = new Map<string, { label: string; order: number; source: 'A' | 'B' | 'both' }>();

  for (const s of patternA.stages) {
    stageMap.set(s.id, { label: s.label, order: s.order, source: 'A' });
  }
  for (const s of patternB.stages) {
    if (stageMap.has(s.id)) {
      stageMap.set(s.id, { ...stageMap.get(s.id)!, source: 'both' });
    } else {
      stageMap.set(s.id, { label: s.label, order: s.order + 1000, source: 'B' });
    }
  }

  const allStages = Array.from(stageMap.entries()).sort((a, b) => a[1].order - b[1].order);

  const gatesByStageA = new Map<string, number>();
  for (const g of patternA.gateCriteria) {
    gatesByStageA.set(g.stageId, (gatesByStageA.get(g.stageId) ?? 0) + 1);
  }

  const gatesByStageB = new Map<string, number>();
  for (const g of patternB.gateCriteria) {
    gatesByStageB.set(g.stageId, (gatesByStageB.get(g.stageId) ?? 0) + 1);
  }

  const HEADER_CELL: React.CSSProperties = {
    fontFamily: SHELL.SERIF,
    fontSize: 13,
    fontWeight: 700,
    color: SHELL.INK,
    textAlign: 'left',
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE}`,
  };

  const CELL: React.CSSProperties = {
    fontFamily: SHELL.MONO,
    fontSize: 12,
    color: SHELL.INK,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
    textAlign: 'center' as const,
  };

  const LABEL_CELL: React.CSSProperties = {
    fontFamily: SHELL.SANS,
    fontSize: 13,
    color: SHELL.INK,
    padding: `${SPACING.sm} ${SPACING.md}`,
    borderBottom: `1px solid ${SHELL.CARD_LINE_SOFT}`,
  };

  return (
    <section style={CARD}>
      <div style={SECTION_HEADER}>
        <h2 style={H2}>Stage comparison</h2>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_MUTED, marginTop: 2 }}>
          Amber rows indicate stages present in one pattern but not the other
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>
                <span style={{ ...MONO, fontSize: 11 }}>{patternA.id}</span>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontWeight: 400 }}>
                  gates
                </div>
              </th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>
                <span style={{ ...MONO, fontSize: 11 }}>{patternB.id}</span>
                <div style={{ fontFamily: SHELL.SANS, fontSize: 10, color: SHELL.INK_MUTED, fontWeight: 400 }}>
                  gates
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {allStages.map(([stageId, meta]) => {
              const countA = gatesByStageA.get(stageId);
              const countB = gatesByStageB.get(stageId);
              const mismatch = (countA === undefined) !== (countB === undefined);
              const rowBg = mismatch ? SHELL.PEACH_BG : 'transparent';

              return (
                <tr key={stageId} style={{ background: rowBg }}>
                  <td style={LABEL_CELL}>
                    <span style={{ fontWeight: 600 }}>{meta.label}</span>
                    <span style={{ ...MONO, fontSize: 10, marginLeft: 8, color: SHELL.INK_MUTED }}>
                      {stageId}
                    </span>
                  </td>
                  <td style={CELL}>
                    {countA !== undefined ? (
                      <span style={{ color: SHELL.INK }}>{countA}</span>
                    ) : (
                      <span style={{ color: SHELL.INK_MUTED }}>—</span>
                    )}
                  </td>
                  <td style={CELL}>
                    {countB !== undefined ? (
                      <span style={{ color: SHELL.INK }}>{countB}</span>
                    ) : (
                      <span style={{ color: SHELL.INK_MUTED }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Gate criteria overlap ────────────────────────────────────────────────────

function GateCriteriaOverlap({ patternA, patternB }: { patternA: SerializedPattern; patternB: SerializedPattern }) {
  const idsA = new Set(patternA.gateCriteria.map((g) => g.id));
  const idsB = new Set(patternB.gateCriteria.map((g) => g.id));

  const onlyA = patternA.gateCriteria.filter((g) => !idsB.has(g.id));
  const onlyB = patternB.gateCriteria.filter((g) => !idsA.has(g.id));
  const inBoth = patternA.gateCriteria.filter((g) => idsB.has(g.id));

  return (
    <section style={CARD}>
      <div style={SECTION_HEADER}>
        <h2 style={H2}>Gate criteria overlap</h2>
      </div>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
        {/* Summary counts */}
        <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <RustBadge>{onlyA.length}</RustBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              only in {patternA.id}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <MintBadge>{onlyB.length}</MintBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              only in {patternB.id}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <GrayBadge>{inBoth.length}</GrayBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              in both
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: SPACING.md }}>
          {/* Only in A */}
          {onlyA.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>Only in {patternA.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onlyA.map((g) => (
                  <div key={g.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: SPACING.sm,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    background: SHELL.RUST_BG,
                    borderRadius: RADIUS.sm,
                  }}>
                    <span style={{ ...BADGE_BASE, background: 'transparent', color: SHELL.RUST_TEXT, fontSize: 10, padding: '1px 4px', flexShrink: 0 }}>
                      {g.gateType.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.RUST_TEXT, lineHeight: 1.4 }}>
                      {g.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Only in B */}
          {onlyB.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>Only in {patternB.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onlyB.map((g) => (
                  <div key={g.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: SPACING.sm,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    background: SHELL.MINT_BG,
                    borderRadius: RADIUS.sm,
                  }}>
                    <span style={{ ...BADGE_BASE, background: 'transparent', color: SHELL.MINT_TEXT, fontSize: 10, padding: '1px 4px', flexShrink: 0 }}>
                      {g.gateType.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.MINT_TEXT, lineHeight: 1.4 }}>
                      {g.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* In both */}
          {inBoth.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>In both</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inBoth.map((g) => (
                  <div key={g.id} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: SPACING.sm,
                    padding: `${SPACING.xs} ${SPACING.sm}`,
                    background: SHELL.GRAY_BG,
                    borderRadius: RADIUS.sm,
                  }}>
                    <span style={{ ...BADGE_BASE, background: 'transparent', color: SHELL.GRAY_TEXT, fontSize: 10, padding: '1px 4px', flexShrink: 0 }}>
                      {g.gateType.toUpperCase()}
                    </span>
                    <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>
                      {g.description}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Contradiction template overlap ──────────────────────────────────────────

function SeverityPill({ severity }: { severity: 'low' | 'medium' | 'high' }) {
  const palette =
    severity === 'high'
      ? { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT }
      : severity === 'medium'
        ? { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT }
        : { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT };
  return (
    <span style={{
      ...BADGE_BASE,
      background: palette.bg,
      color: palette.fg,
      fontSize: 10,
      padding: '1px 6px',
      flexShrink: 0,
    }}>
      {severity}
    </span>
  );
}

function renderTemplateItem(item: SerializedContradictionTemplate, bg: string, fg: string) {
  return (
    <div key={item.id} style={{
      display: 'flex',
      alignItems: 'center',
      gap: SPACING.sm,
      padding: `${SPACING.xs} ${SPACING.sm}`,
      background: bg,
      borderRadius: RADIUS.sm,
    }}>
      <SeverityPill severity={item.severity} />
      <span style={{ fontFamily: SHELL.SANS, fontSize: 12, color: fg, lineHeight: 1.4 }}>
        {item.label}
      </span>
      <span style={{ ...MONO, fontSize: 10, color: fg, opacity: 0.6, marginLeft: 'auto', flexShrink: 0 }}>
        {item.id}
      </span>
    </div>
  );
}

function ContradictionOverlap({ patternA, patternB }: { patternA: SerializedPattern; patternB: SerializedPattern }) {
  const idsA = new Set(patternA.contradictionTemplates.map((c) => c.id));
  const idsB = new Set(patternB.contradictionTemplates.map((c) => c.id));

  const onlyA = patternA.contradictionTemplates.filter((c) => !idsB.has(c.id));
  const onlyB = patternB.contradictionTemplates.filter((c) => !idsA.has(c.id));
  const inBoth = patternA.contradictionTemplates.filter((c) => idsB.has(c.id));

  if (patternA.contradictionTemplates.length === 0 && patternB.contradictionTemplates.length === 0) {
    return (
      <section style={CARD}>
        <div style={SECTION_HEADER}>
          <h2 style={H2}>Contradiction template overlap</h2>
        </div>
        <div style={{ padding: SPACING.lg, fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED }}>
          Neither pattern has contradiction templates defined.
        </div>
      </section>
    );
  }

  return (
    <section style={CARD}>
      <div style={SECTION_HEADER}>
        <h2 style={H2}>Contradiction template overlap</h2>
      </div>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
        {/* Summary counts */}
        <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <RustBadge>{onlyA.length}</RustBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              only in {patternA.id}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <MintBadge>{onlyB.length}</MintBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT }}>
              only in {patternB.id}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
            <GrayBadge>{inBoth.length}</GrayBadge>
            <span style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_SOFT, marginLeft: SPACING.sm }}>
              in both
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: SPACING.md }}>
          {onlyA.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>Only in {patternA.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onlyA.map((c) => renderTemplateItem(c, SHELL.RUST_BG, SHELL.RUST_TEXT))}
              </div>
            </div>
          )}

          {onlyB.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>Only in {patternB.id}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {onlyB.map((c) => renderTemplateItem(c, SHELL.MINT_BG, SHELL.MINT_TEXT))}
              </div>
            </div>
          )}

          {inBoth.length > 0 && (
            <div>
              <div style={{ ...LABEL_UPPER, marginBottom: SPACING.sm }}>In both</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {inBoth.map((c) => renderTemplateItem(c, SHELL.GRAY_BG, SHELL.GRAY_TEXT))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export function PatternCompareClient({ patterns }: PatternCompareClientProps) {
  const [patternAId, setPatternAId] = useState<string>(patterns[0]?.id ?? '');
  const [patternBId, setPatternBId] = useState<string>(patterns[1]?.id ?? '');

  const patternA = useMemo(() => patterns.find((p) => p.id === patternAId), [patterns, patternAId]);
  const patternB = useMemo(() => patterns.find((p) => p.id === patternBId), [patterns, patternBId]);

  if (patterns.length < 2) {
    return (
      <div style={{
        background: SHELL.CARD_WHITE,
        border: `1px dashed ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.xl,
        textAlign: 'center',
        fontFamily: SHELL.SANS,
        fontSize: 14,
        color: SHELL.INK_MUTED,
      }}>
        At least two lifecycle patterns are required to compare.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.lg }}>
      {/* Selector bar */}
      <div style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        gap: SPACING.lg,
        flexWrap: 'wrap',
        alignItems: 'flex-end',
      }}>
        <PatternSelector
          label="Pattern A"
          value={patternAId}
          patterns={patterns}
          onChange={setPatternAId}
          excludeId={patternBId}
        />
        <div style={{
          fontFamily: SHELL.SERIF,
          fontSize: 24,
          color: SHELL.INK_MUTED,
          paddingBottom: 6,
          flexShrink: 0,
        }}>
          vs
        </div>
        <PatternSelector
          label="Pattern B"
          value={patternBId}
          patterns={patterns}
          onChange={setPatternBId}
          excludeId={patternAId}
        />
      </div>

      {/* Pattern titles */}
      {patternA && patternB && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: SPACING.md,
        }}>
          {[patternA, patternB].map((p, i) => (
            <div key={p.id} style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE}`,
              borderRadius: RADIUS.lg,
              padding: SPACING.md,
            }}>
              <div style={LABEL_UPPER}>{i === 0 ? 'Pattern A' : 'Pattern B'}</div>
              <div style={{
                fontFamily: SHELL.SERIF,
                fontSize: 18,
                color: SHELL.INK,
                marginTop: 4,
                letterSpacing: '-0.01em',
              }}>
                {p.title}
              </div>
              <div style={{ ...MONO, fontSize: 11, marginTop: 2, color: SHELL.INK_MUTED }}>
                {p.id}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Comparison sections */}
      {patternA && patternB && patternA.id !== patternB.id && (
        <>
          <SummaryTable patternA={patternA} patternB={patternB} />
          <StageComparison patternA={patternA} patternB={patternB} />
          <GateCriteriaOverlap patternA={patternA} patternB={patternB} />
          <ContradictionOverlap patternA={patternA} patternB={patternB} />
        </>
      )}

      {patternA && patternB && patternA.id === patternB.id && (
        <div style={{
          background: SHELL.PEACH_BG,
          border: `1px solid ${SHELL.PEACH_LINE}`,
          borderRadius: RADIUS.lg,
          padding: SPACING.lg,
          fontFamily: SHELL.SANS,
          fontSize: 14,
          color: SHELL.PEACH_TEXT,
        }}>
          Select two different patterns to see a comparison.
        </div>
      )}
    </div>
  );
}
