// /admin/reasoning/health-attribution — Health score component attribution.
//
// Pure server component. For every instance, decomposes the health score into
// three additive components:
//   gate component         = (gatesMet / gatesTotal) * 60          (0–60 pts)
//   contradiction component = (1 - min(contradictions/5, 1)) * 30  (0–30 pts)
//   base component         = 10                                     (always 10 pts)
//
// Sections:
//   1. Formula explanation card  — bordered callout with the formula
//   2. Attribution table         — all instances, component fractions + stacked bar
//   3. Component analysis        — 3 stat cards for avg gate, avg contradiction, strong gate count
//   4. Optimization targets      — top 5 instances with largest gate component gap

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health Attribution · AbarVa Admin',
};

// ─── Attribution computation ───────────────────────────────────────────────────

interface AttributionRow {
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  gateComponent: number;       // 0–60
  contradictionComponent: number; // 0–30
  baseComponent: number;       // always 10
  totalHealth: number;         // sum of the three
  gateGap: number;             // 60 - gateComponent  (optimization headroom)
}

function computeAttributionRows(): AttributionRow[] {
  const healthRows: InstanceHealthRow[] = buildHealthBoardRows();

  return healthRows.map((row) => {
    const gateComponent = Math.round((row.gatesMet / Math.max(row.gatesTotal, 1)) * 60);
    const contradictionComponent = Math.round(
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30,
    );
    const baseComponent = 10;
    const totalHealth = gateComponent + contradictionComponent + baseComponent;

    return {
      instanceId: row.id,
      instanceName: row.label,
      instanceType: row.type,
      gatesMet: row.gatesMet,
      gatesTotal: row.gatesTotal,
      activeContradictions: row.activeContradictions,
      gateComponent,
      contradictionComponent,
      baseComponent,
      totalHealth,
      gateGap: 60 - gateComponent,
    };
  });
}

// ─── Style constants ───────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  whiteSpace: 'nowrap',
};

const BODY_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Health color helper ───────────────────────────────────────────────────────

function healthColors(score: number): { fg: string; bg: string } {
  if (score >= 75) return { fg: COLORS.mintInk, bg: COLORS.mintSoft };
  if (score >= 50) return { fg: COLORS.amberInk, bg: COLORS.amberSoft };
  return { fg: COLORS.coralInk, bg: COLORS.coralSoft };
}

// ─── Section 1: Formula explanation card ──────────────────────────────────────

function FormulaCard() {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `2px solid ${COLORS.ink}18`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
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
        Health score formula
      </h2>

      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: COLORS.ink,
          background: `${COLORS.ink}06`,
          borderRadius: RADIUS.md,
          padding: `${SPACING.sm} ${SPACING.md}`,
          letterSpacing: '0.01em',
          lineHeight: 1.7,
        }}
      >
        Health = (Gates Met / Total Gates) &times; 60 + (1 &minus; min(Contradictions/5, 1)) &times; 30 + 10
      </div>

      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        {[
          { label: 'Gate component', max: '60 pts', fg: COLORS.mintInk, bg: COLORS.mintSoft },
          {
            label: 'Contradiction component',
            max: '30 pts',
            fg: COLORS.amberInk,
            bg: COLORS.amberSoft,
          },
          { label: 'Base component', max: '10 pts', fg: `${COLORS.ink}99`, bg: `${COLORS.ink}08` },
        ].map(({ label, max, fg, bg }) => (
          <div
            key={label}
            style={{
              flex: '1 1 180px',
              background: bg,
              border: `1px solid ${fg}33`,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.07em',
                color: `${fg}99`,
              }}
            >
              {label}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 28,
                color: fg,
                letterSpacing: '-0.02em',
                lineHeight: 1,
              }}
            >
              {max}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Section 2: Attribution table ─────────────────────────────────────────────

function StackedBar({ row }: { row: AttributionRow }) {
  const total = 100;
  const gatePct = (row.gateComponent / total) * 100;
  const contPct = (row.contradictionComponent / total) * 100;
  const basePct = (row.baseComponent / total) * 100;

  return (
    <div
      style={{
        display: 'flex',
        height: 12,
        width: '100%',
        minWidth: 120,
        borderRadius: RADIUS.pill,
        overflow: 'hidden',
        background: `${COLORS.ink}10`,
      }}
    >
      <div
        title={`Gate: ${row.gateComponent} pts`}
        style={{
          width: `${gatePct}%`,
          background: COLORS.mintInk,
          flexShrink: 0,
        }}
      />
      <div
        title={`Contradiction: ${row.contradictionComponent} pts`}
        style={{
          width: `${contPct}%`,
          background: COLORS.amberInk,
          flexShrink: 0,
        }}
      />
      <div
        title={`Base: ${row.baseComponent} pts`}
        style={{
          width: `${basePct}%`,
          background: `${COLORS.ink}30`,
          flexShrink: 0,
        }}
      />
    </div>
  );
}

function AttributionTable({ rows }: { rows: AttributionRow[] }) {
  const sorted = [...rows].sort((a, b) => b.totalHealth - a.totalHealth);

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
            Instance health attribution
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 4,
            }}
          >
            Sorted by total health — mint = gate contribution, amber = contradiction contribution, grey = base
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
          {sorted.length} instance{sorted.length === 1 ? '' : 's'}
        </span>
      </header>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Gate (N/60)</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Contradiction (N/30)</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Base</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Total</th>
              <th style={HEADER_CELL}>Stacked bar</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const { fg, bg } = healthColors(row.totalHealth);
              return (
                <tr key={row.instanceId}>
                  <td style={BODY_CELL}>
                    <a
                      href={`/admin/reasoning/instances/${row.instanceId}`}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.navy,
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {row.instanceName}
                    </a>
                  </td>

                  <td style={BODY_CELL}>
                    <span
                      style={{
                        display: 'inline-block',
                        background:
                          row.instanceType === 'source' ? COLORS.skyPale : COLORS.amberSoft,
                        color: row.instanceType === 'source' ? COLORS.navy : COLORS.amberInk,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        fontWeight: 600,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.instanceType}
                    </span>
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      color: COLORS.mintInk,
                      fontWeight: 600,
                    }}
                  >
                    {row.gateComponent}/60
                  </td>

                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      color: COLORS.amberInk,
                      fontWeight: 600,
                    }}
                  >
                    {row.contradictionComponent}/30
                  </td>

                  <td style={{ ...MONO_CELL, textAlign: 'right', color: `${COLORS.ink}88` }}>
                    10
                  </td>

                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: bg,
                        color: fg,
                        borderRadius: RADIUS.pill,
                        padding: '2px 10px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {row.totalHealth}
                    </span>
                  </td>

                  <td style={{ ...BODY_CELL, minWidth: 160, paddingRight: SPACING.lg }}>
                    <StackedBar row={row} />
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

// ─── Section 3: Component analysis ────────────────────────────────────────────

function StatCard({
  value,
  label,
  sub,
  fg,
  bg,
}: {
  value: string;
  label: string;
  sub?: string;
  fg: string;
  bg: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 200px',
        background: bg,
        border: `1px solid ${fg}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: `${fg}99`,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 40,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: `${fg}bb` }}>{sub}</div>
      )}
    </div>
  );
}

function ComponentAnalysis({ rows }: { rows: AttributionRow[] }) {
  const n = rows.length || 1;
  const avgGate = rows.reduce((s, r) => s + r.gateComponent, 0) / n;
  const avgContradiction = rows.reduce((s, r) => s + r.contradictionComponent, 0) / n;
  const strongGateCount = rows.filter((r) => r.gateComponent > 45).length;

  return (
    <section
      style={{
        display: 'flex',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <StatCard
        value={`${avgGate.toFixed(1)}`}
        label="Avg gate contribution"
        sub="Out of 60 pts · portfolio average"
        fg={COLORS.mintInk}
        bg={COLORS.mintSoft}
      />
      <StatCard
        value={`${avgContradiction.toFixed(1)}`}
        label="Avg contradiction contribution"
        sub="Out of 30 pts · portfolio average"
        fg={COLORS.amberInk}
        bg={COLORS.amberSoft}
      />
      <StatCard
        value={String(strongGateCount)}
        label="Strong gate performers"
        sub="Gate component > 45 pts"
        fg={COLORS.navy}
        bg={COLORS.skyPale}
      />
    </section>
  );
}

// ─── Section 4: Optimization targets ──────────────────────────────────────────

function OptimizationTargets({ rows }: { rows: AttributionRow[] }) {
  // Sort by largest gate gap (most room to improve), take top 5
  const top5 = [...rows].sort((a, b) => b.gateGap - a.gateGap).slice(0, 5);

  if (top5.length === 0) return null;

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
          Optimization targets
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          Top 5 instances with the most gate component headroom — largest gap between current gate
          contribution and the 60-pt maximum
        </div>
      </header>

      <div style={{ padding: `${SPACING.sm} ${SPACING.md}` }}>
        {top5.map((row, idx) => (
          <div
            key={row.instanceId}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: SPACING.md,
              padding: `${SPACING.sm} ${SPACING.sm}`,
              borderBottom: `1px solid ${COLORS.ink}10`,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 18,
                color: `${COLORS.ink}44`,
                fontWeight: 700,
                flex: '0 0 auto',
                width: 28,
                paddingTop: 1,
              }}
            >
              {idx + 1}
            </span>

            <div style={{ flex: 1, minWidth: 200 }}>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {row.instanceName}
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}99`,
                  marginTop: 3,
                  lineHeight: 1.4,
                }}
              >
                Gate component at{' '}
                <strong style={{ color: COLORS.mintInk }}>{row.gateComponent}/60</strong> —{' '}
                <strong>{row.gateGap} pts</strong> available from better gate pass rate
              </div>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  color: `${COLORS.ink}66`,
                  marginTop: 2,
                }}
              >
                Current: {row.gatesMet}/{row.gatesTotal} gates met · total health {row.totalHealth}
              </div>
            </div>

            <div
              style={{
                flex: '0 0 auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
                gap: 4,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}88`,
                  background: `${COLORS.ink}08`,
                  borderRadius: RADIUS.pill,
                  padding: '2px 8px',
                }}
              >
                +{row.gateGap} pts gap
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: COLORS.mintInk,
                  background: COLORS.mintSoft,
                  borderRadius: RADIUS.pill,
                  padding: '2px 8px',
                }}
              >
                max reachable: {row.totalHealth + row.gateGap}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HealthAttributionPage() {
  const rows = computeAttributionRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Health Board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Health attribution"
        title="Health Attribution"
        subtitle="Decompose each instance's health score — gate pass rate, contradiction penalty, and base contributions"
      >
        <FormulaCard />
        <AttributionTable rows={rows} />
        <ComponentAnalysis rows={rows} />
        <OptimizationTargets rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
