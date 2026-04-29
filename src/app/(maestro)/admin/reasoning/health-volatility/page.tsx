// /admin/reasoning/health-volatility — Health score volatility analysis.
//
// Pure server component, force-dynamic. For each instance computes how much
// the health score could swing based on:
//   - Upside: resolving all active contradictions
//   - Downside: removing all active waivers (gates revert to unmet)
//
// Sections:
//   VolatilitySummary  — 4 KPI cards (avg upside, avg downside, most volatile, stable count)
//   VolatilityTable    — All instances sorted by volatilityScore descending
//   UpsideDownsideBar  — CSS stacked bar chart (mint=upside, rust=downside)
//   FragileCallout     — Instances where downside > 15
//   QuickGainsCallout  — Instances where upside > 15

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import type { InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health Volatility · AbarVa Admin',
};

// ─── Volatility computation ────────────────────────────────────────────────────

function computeHealth(gatesMet: number, gatesTotal: number, contradictions: number): number {
  return Math.round(
    (gatesMet / Math.max(gatesTotal, 1)) * 60 +
      (1 - Math.min(contradictions / 5, 1)) * 30 +
      10,
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface VolatilityRow {
  id: string;
  label: string;
  type: string;
  currentHealth: number;
  bestCase: number;
  worstCase: number;
  upside: number;
  downside: number;
  volatilityScore: number;
  fragility: 'High' | 'Medium' | 'Low';
}

function buildVolatilityRows(): VolatilityRow[] {
  const healthRows: InstanceHealthRow[] = buildHealthBoardRows();
  const waivers = getWaivers();

  // Count waivers per instance
  const waiverCountByInstance = new Map<string, number>();
  for (const w of waivers) {
    waiverCountByInstance.set(w.instanceId, (waiverCountByInstance.get(w.instanceId) ?? 0) + 1);
  }

  const rows: VolatilityRow[] = healthRows.map((row) => {
    const currentHealth = clamp(
      computeHealth(row.gatesMet, row.gatesTotal, row.activeContradictions),
      10,
      100,
    );

    // Best case: contradictions all resolved → contradiction penalty = 0
    const bestCase = clamp(
      Math.round((row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 + 30 + 10),
      10,
      100,
    );

    // Worst case: all waivers removed → waivers gates revert to unmet
    const waiverCount = waiverCountByInstance.get(row.id) ?? 0;
    const gatesMetWithoutWaivers = Math.max(0, row.gatesMet - waiverCount);
    const worstCase = clamp(
      computeHealth(gatesMetWithoutWaivers, row.gatesTotal, row.activeContradictions),
      10,
      100,
    );

    const upside = bestCase - currentHealth;
    const downside = currentHealth - worstCase;
    const volatilityScore = upside + downside;

    let fragility: 'High' | 'Medium' | 'Low';
    if (volatilityScore > 20) {
      fragility = 'High';
    } else if (volatilityScore >= 10) {
      fragility = 'Medium';
    } else {
      fragility = 'Low';
    }

    return {
      id: row.id,
      label: row.label,
      type: row.type,
      currentHealth,
      bestCase,
      worstCase,
      upside,
      downside,
      volatilityScore,
      fragility,
    };
  });

  // Sort by volatilityScore descending
  return rows.sort((a, b) => b.volatilityScore - a.volatilityScore);
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
};

// ─── VolatilitySummary ────────────────────────────────────────────────────────

function VolatilitySummary({ rows }: { rows: VolatilityRow[] }) {
  const avgUpside =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.upside, 0) / rows.length);
  const avgDownside =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.downside, 0) / rows.length);
  const mostVolatile = rows.length === 0 ? null : rows[0];
  const stableCount = rows.filter((r) => r.volatilityScore <= 5).length;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: SPACING.md,
      }}
    >
      <KpiCard
        label="Avg upside potential"
        value={`+${avgUpside} pts`}
        sub="from contradiction resolution"
        valueColor={SHELL.MINT_TEXT}
        bg={SHELL.MINT_BG}
        border={SHELL.MINT_LINE}
      />
      <KpiCard
        label="Avg downside risk"
        value={`-${avgDownside} pts`}
        sub="from waiver removal"
        valueColor={SHELL.RUST_TEXT}
        bg={SHELL.RUST_BG}
        border={`${SHELL.RUST_TEXT}44`}
      />
      <KpiCard
        label="Most volatile"
        value={mostVolatile ? mostVolatile.label : '—'}
        sub={mostVolatile ? `score ${mostVolatile.volatilityScore}` : 'no data'}
        valueColor={COLORS.ink}
        bg={COLORS.white}
        border={`${COLORS.ink}14`}
        valueFontSize={14}
      />
      <KpiCard
        label="Stable instances"
        value={String(stableCount)}
        sub="volatility score ≤ 5"
        valueColor={SHELL.MINT_TEXT}
        bg={SHELL.MINT_BG}
        border={SHELL.MINT_LINE}
      />
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  valueColor,
  bg,
  border,
  valueFontSize = 24,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor: string;
  bg: string;
  border: string;
  valueFontSize?: number;
}) {
  return (
    <div
      style={{
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: valueFontSize,
          color: valueColor,
          letterSpacing: '-0.01em',
          lineHeight: 1.1,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}66`,
          lineHeight: 1.4,
        }}
      >
        {sub}
      </span>
    </div>
  );
}

// ─── Score badges ─────────────────────────────────────────────────────────────

function ScoreBadge({
  value,
  bg,
  fg,
}: {
  value: number;
  bg: string;
  fg: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  );
}

function FragilityBadge({ level }: { level: 'High' | 'Medium' | 'Low' }) {
  let bg: string;
  let fg: string;
  if (level === 'High') {
    bg = SHELL.RUST_BG;
    fg = SHELL.RUST_TEXT;
  } else if (level === 'Medium') {
    bg = COLORS.amberSoft;
    fg = COLORS.amberInk;
  } else {
    bg = SHELL.MINT_BG;
    fg = SHELL.MINT_TEXT;
  }
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {level}
    </span>
  );
}

// ─── VolatilityTable ──────────────────────────────────────────────────────────

function VolatilityTable({ rows }: { rows: VolatilityRow[] }) {
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
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Volatility by instance
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by volatility score descending — most fragile first
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            whiteSpace: 'nowrap',
          }}
        >
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Current health</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Best case</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Worst case</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Upside</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Downside</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Volatility</th>
              <th style={HEADER_CELL}>Fragility</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              return (
                <tr key={row.id} style={{ background: rowBg }}>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.label}
                    </div>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}77`,
                        marginTop: 2,
                      }}
                    >
                      {row.id} · {row.type}
                    </div>
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    <ScoreBadge
                      value={row.currentHealth}
                      bg={`${COLORS.ink}0d`}
                      fg={COLORS.ink}
                    />
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    <ScoreBadge
                      value={row.bestCase}
                      bg={SHELL.MINT_BG}
                      fg={SHELL.MINT_TEXT}
                    />
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    <ScoreBadge
                      value={row.worstCase}
                      bg={SHELL.RUST_BG}
                      fg={SHELL.RUST_TEXT}
                    />
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.upside > 0 ? SHELL.MINT_TEXT : `${COLORS.ink}66`,
                      }}
                    >
                      {row.upside > 0 ? `↑+${row.upside}` : `+${row.upside}`}
                    </span>
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg, textAlign: 'right' }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.downside > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}66`,
                      }}
                    >
                      {row.downside > 0 ? `↓-${row.downside}` : `-${row.downside}`}
                    </span>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      fontWeight: 700,
                      fontSize: 14,
                    }}
                  >
                    {row.volatilityScore}
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <FragilityBadge level={row.fragility} />
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

// ─── UpsideDownsideBar ────────────────────────────────────────────────────────

function UpsideDownsideBar({ rows }: { rows: VolatilityRow[] }) {
  // Use the top 15 most volatile for readability
  const display = rows.slice(0, 15);
  const maxRange = Math.max(...display.map((r) => r.upside + r.downside), 1);

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
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Upside / downside range
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Mint = potential gain from resolving contradictions · Rust = potential loss from waiver removal
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
            whiteSpace: 'nowrap',
          }}
        >
          top {display.length}
        </span>
      </header>
      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {display.map((row) => {
          const upsidePct = (row.upside / maxRange) * 100;
          const downsidePct = (row.downside / maxRange) * 100;
          return (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '180px 1fr 40px',
                alignItems: 'center',
                gap: SPACING.md,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontWeight: 500,
                }}
              >
                {row.label}
              </span>
              <div
                style={{
                  display: 'flex',
                  height: 18,
                  borderRadius: RADIUS.sm,
                  overflow: 'hidden',
                  background: `${COLORS.ink}08`,
                }}
              >
                {upsidePct > 0 && (
                  <div
                    style={{
                      width: `${upsidePct}%`,
                      background: SHELL.MINT_BG,
                      borderRight: upsidePct > 0 && downsidePct > 0 ? `1px solid ${SHELL.MINT_LINE}` : undefined,
                      transition: 'width 0.2s',
                    }}
                  />
                )}
                {downsidePct > 0 && (
                  <div
                    style={{
                      width: `${downsidePct}%`,
                      background: SHELL.RUST_BG,
                      borderLeft: upsidePct > 0 && downsidePct > 0 ? `1px solid ${SHELL.RUST_TEXT}33` : undefined,
                      transition: 'width 0.2s',
                    }}
                  />
                )}
              </div>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  textAlign: 'right',
                }}
              >
                {row.currentHealth}
              </span>
            </div>
          );
        })}
        <div
          style={{
            display: 'flex',
            gap: SPACING.lg,
            marginTop: SPACING.sm,
            flexWrap: 'wrap',
          }}
        >
          <LegendDot color={SHELL.MINT_BG} border={SHELL.MINT_LINE} label="Upside (contradiction resolution)" />
          <LegendDot color={SHELL.RUST_BG} border={`${SHELL.RUST_TEXT}33`} label="Downside (waiver removal)" />
        </div>
      </div>
    </section>
  );
}

function LegendDot({
  color,
  border,
  label,
}: {
  color: string;
  border: string;
  label: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: 2,
          background: color,
          border: `1px solid ${border}`,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── FragileCallout ───────────────────────────────────────────────────────────

function FragileCallout({ rows }: { rows: VolatilityRow[] }) {
  const fragile = rows.filter((r) => r.downside > 15);
  if (fragile.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid ${SHELL.RUST_TEXT}44`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.RUST_TEXT}22`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: SHELL.RUST_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Fragile instances
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.RUST_TEXT,
              marginTop: 2,
              opacity: 0.85,
            }}
          >
            These instances are at risk of significant health drop if waivers are revoked
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.RUST_TEXT,
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {fragile.length} instance{fragile.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {fragile.map((row) => (
          <div
            key={row.id}
            style={{
              background: COLORS.white,
              border: `1px solid ${SHELL.RUST_TEXT}22`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}77`,
                }}
              >
                {row.id}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <ScoreBadge value={row.currentHealth} bg={`${COLORS.ink}0d`} fg={COLORS.ink} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                }}
              >
                →
              </span>
              <ScoreBadge value={row.worstCase} bg={SHELL.RUST_BG} fg={SHELL.RUST_TEXT} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                  marginLeft: SPACING.xs,
                }}
              >
                ↓-{row.downside} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── QuickGainsCallout ────────────────────────────────────────────────────────

function QuickGainsCallout({ rows }: { rows: VolatilityRow[] }) {
  const gains = rows.filter((r) => r.upside > 15);
  if (gains.length === 0) return null;

  return (
    <section
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.MINT_LINE}`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 20,
              color: SHELL.MINT_TEXT,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Quick gains
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: SHELL.MINT_TEXT,
              marginTop: 2,
              opacity: 0.85,
            }}
          >
            These instances could gain significant health by resolving active contradictions
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: SHELL.MINT_TEXT,
            opacity: 0.8,
            whiteSpace: 'nowrap',
          }}
        >
          {gains.length} instance{gains.length === 1 ? '' : 's'}
        </span>
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.sm,
        }}
      >
        {gains.map((row) => (
          <div
            key={row.id}
            style={{
              background: COLORS.white,
              border: `1px solid ${SHELL.MINT_LINE}`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {row.label}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: `${COLORS.ink}77`,
                }}
              >
                {row.id}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: SPACING.sm,
                flexWrap: 'wrap',
              }}
            >
              <ScoreBadge value={row.currentHealth} bg={`${COLORS.ink}0d`} fg={COLORS.ink} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                }}
              >
                →
              </span>
              <ScoreBadge value={row.bestCase} bg={SHELL.MINT_BG} fg={SHELL.MINT_TEXT} />
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 13,
                  fontWeight: 700,
                  color: SHELL.MINT_TEXT,
                  marginLeft: SPACING.xs,
                }}
              >
                ↑+{row.upside} pts
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthVolatilityPage() {
  const rows = buildVolatilityRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Health Volatility"
        title="Health Volatility"
        subtitle="Health score sensitivity — how much each instance's score could swing from contradictions or waiver changes"
      >
        <VolatilitySummary rows={rows} />
        <VolatilityTable rows={rows} />
        <UpsideDownsideBar rows={rows} />
        <FragileCallout rows={rows} />
        <QuickGainsCallout rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
