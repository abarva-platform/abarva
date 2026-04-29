// /admin/reasoning/evidence-staleness — Evidence freshness analysis.
//
// Pure server component. Uses hash-derived ages to categorize evidence items
// across all fixture instances (source + programs) as Fresh (0-14 d), Aging
// (15-45 d), or Stale (46+ d). Renders:
//   1. Portfolio KPI cards — % Fresh / Aging / Stale
//   2. Staleness breakdown by instance — table sorted by staleness score desc
//   3. Most stale instances — top-3 cards with action prompt
//   4. Freshness over time — simulated 30-day decline table

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence Staleness · AbarVa Admin',
};

// ── Staleness helpers ─────────────────────────────────────────────────────────

function evidenceAge(evidenceId: string, instanceId: string): number {
  // Returns days old (0–120), deterministic hash-derived
  const seed = (evidenceId + instanceId)
    .split('')
    .reduce((a, c) => a + c.charCodeAt(0), 0);
  return seed % 121;
}

type StalenessCategory = 'fresh' | 'aging' | 'stale';

function categorize(age: number): StalenessCategory {
  if (age <= 14) return 'fresh';
  if (age <= 45) return 'aging';
  return 'stale';
}

// ── Data model ────────────────────────────────────────────────────────────────

interface InstanceStalenessRow {
  instanceId: string;
  instanceName: string;
  type: 'source' | 'program';
  total: number;
  freshCount: number;
  agingCount: number;
  staleCount: number;
  stalenessScore: number;
  maxAge: number;
}

interface PortfolioKpis {
  totalItems: number;
  freshCount: number;
  agingCount: number;
  staleCount: number;
  freshPct: number;
  agingPct: number;
  stalePct: number;
}

function buildData(): {
  rows: InstanceStalenessRow[];
  kpis: PortfolioKpis;
} {
  const rows: InstanceStalenessRow[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    let freshCount = 0;
    let agingCount = 0;
    let staleCount = 0;
    let maxAge = 0;

    inst.evidence.forEach((item, idx) => {
      const eid = item.id ?? String(idx);
      const age = evidenceAge(eid, inst.id);
      if (age > maxAge) maxAge = age;
      const cat = categorize(age);
      if (cat === 'fresh') freshCount++;
      else if (cat === 'aging') agingCount++;
      else staleCount++;
    });

    const total = inst.evidence.length;
    const stalenessScore = (agingCount * 1 + staleCount * 3) / Math.max(total, 1);
    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      type: 'source',
      total,
      freshCount,
      agingCount,
      staleCount,
      stalenessScore,
      maxAge,
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    let freshCount = 0;
    let agingCount = 0;
    let staleCount = 0;
    let maxAge = 0;

    inst.evidence.forEach((item, idx) => {
      const eid = item.id ?? String(idx);
      const age = evidenceAge(eid, inst.id);
      if (age > maxAge) maxAge = age;
      const cat = categorize(age);
      if (cat === 'fresh') freshCount++;
      else if (cat === 'aging') agingCount++;
      else staleCount++;
    });

    const total = inst.evidence.length;
    const stalenessScore = (agingCount * 1 + staleCount * 3) / Math.max(total, 1);
    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      type: 'program',
      total,
      freshCount,
      agingCount,
      staleCount,
      stalenessScore,
      maxAge,
    });
  }

  // Sort by staleness score descending
  rows.sort((a, b) => b.stalenessScore - a.stalenessScore);

  const totalItems = rows.reduce((s, r) => s + r.total, 0);
  const freshCount = rows.reduce((s, r) => s + r.freshCount, 0);
  const agingCount = rows.reduce((s, r) => s + r.agingCount, 0);
  const staleCount = rows.reduce((s, r) => s + r.staleCount, 0);

  return {
    rows,
    kpis: {
      totalItems,
      freshCount,
      agingCount,
      staleCount,
      freshPct: totalItems > 0 ? (freshCount / totalItems) * 100 : 0,
      agingPct: totalItems > 0 ? (agingCount / totalItems) * 100 : 0,
      stalePct: totalItems > 0 ? (staleCount / totalItems) * 100 : 0,
    },
  };
}

// ── Style constants ───────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
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

// ── Category palette helper ───────────────────────────────────────────────────

function categoryPalette(cat: StalenessCategory) {
  if (cat === 'fresh') return { bg: COLORS.mintSoft, fg: COLORS.mintInk };
  if (cat === 'aging') return { bg: COLORS.amberSoft, fg: COLORS.amberInk };
  return { bg: COLORS.coralSoft, fg: COLORS.coralInk };
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  pct,
  count,
  cat,
}: {
  label: string;
  pct: number;
  count: number;
  cat: StalenessCategory;
}) {
  const { bg, fg } = categoryPalette(cat);
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        flex: '1 1 180px',
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          alignSelf: 'flex-start',
          background: bg,
          color: fg,
          borderRadius: RADIUS.pill,
          padding: '2px 12px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 44,
          color: fg,
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {pct.toFixed(1)}%
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {count} item{count === 1 ? '' : 's'}
      </div>
    </div>
  );
}

// ── Category badge ────────────────────────────────────────────────────────────

function CategoryBadge({ count, cat }: { count: number; cat: StalenessCategory }) {
  const { bg, fg } = categoryPalette(cat);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        minWidth: 28,
        textAlign: 'center',
      }}
    >
      {count}
    </span>
  );
}

// ── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const palette =
    type === 'source'
      ? { bg: COLORS.skyPale, fg: COLORS.navy }
      : { bg: `${COLORS.ink}10`, fg: `${COLORS.ink}aa` };
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}
    >
      {type}
    </span>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: import('react').ReactNode }) {
  return (
    <h2
      style={{
        fontFamily: TYPOGRAPHY.serif,
        fontSize: 22,
        color: COLORS.ink,
        margin: 0,
        letterSpacing: '-0.01em',
      }}
    >
      {children}
    </h2>
  );
}

// ── Section 1: Portfolio KPI cards ───────────────────────────────────────────

function PortfolioKpiSection({ kpis }: { kpis: PortfolioKpis }) {
  return (
    <section
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.md,
      }}
    >
      <div key="kpi-fresh">
        <KpiCard label="Fresh" pct={kpis.freshPct} count={kpis.freshCount} cat="fresh" />
      </div>
      <div key="kpi-aging">
        <KpiCard label="Aging" pct={kpis.agingPct} count={kpis.agingCount} cat="aging" />
      </div>
      <div key="kpi-stale">
        <KpiCard label="Stale" pct={kpis.stalePct} count={kpis.staleCount} cat="stale" />
      </div>
    </section>
  );
}

// ── Section 2: Staleness breakdown by instance ────────────────────────────────

function StalenessBreakdownTable({ rows }: { rows: InstanceStalenessRow[] }) {
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
        <SectionHeading>Staleness breakdown by instance</SectionHeading>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          sorted by staleness score ↓
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, width: 70 }}>Type</th>
              <th style={{ ...HEADER_CELL, width: 60, textAlign: 'right' }}>Total</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'center' }}>Fresh</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'center' }}>Aging</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'center' }}>Stale</th>
              <th style={{ ...HEADER_CELL, width: 110, textAlign: 'right' }}>Staleness score</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.instanceId}>
                <td style={BODY_CELL}>
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      color: COLORS.ink,
                      fontWeight: 500,
                    }}
                  >
                    {row.instanceName}
                  </span>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}55`,
                      marginTop: 2,
                    }}
                  >
                    {row.instanceId}
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <TypeBadge type={row.type} />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.total}</td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CategoryBadge count={row.freshCount} cat="fresh" />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CategoryBadge count={row.agingCount} cat="aging" />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CategoryBadge count={row.staleCount} cat="stale" />
                </td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                  <span
                    style={{
                      color:
                        row.stalenessScore >= 2
                          ? COLORS.coralInk
                          : row.stalenessScore >= 1
                            ? COLORS.amberInk
                            : COLORS.mintInk,
                      fontWeight: 600,
                    }}
                  >
                    {row.stalenessScore.toFixed(2)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Section 3: Most stale instances ──────────────────────────────────────────

function MostStaleInstancesSection({ rows }: { rows: InstanceStalenessRow[] }) {
  const top3 = rows
    .slice()
    .sort((a, b) => b.staleCount - a.staleCount)
    .slice(0, 3);

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
      <SectionHeading>Most stale instances</SectionHeading>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.md }}>
        {top3.map((row, i) => (
          <div
            key={row.instanceId}
            style={{
              flex: '1 1 220px',
              background: COLORS.white,
              border: `1px solid ${COLORS.coralInk}33`,
              borderRadius: RADIUS.lg,
              padding: SPACING.lg,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.sm,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLORS.coralInk,
                  background: COLORS.coralSoft,
                  borderRadius: RADIUS.pill,
                  padding: '2px 10px',
                }}
              >
                #{i + 1}
              </span>
              <TypeBadge type={row.type} />
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 17,
                color: COLORS.ink,
                letterSpacing: '-0.01em',
                lineHeight: 1.3,
              }}
            >
              {row.instanceName}
            </div>
            <div
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: COLORS.coralInk,
                fontWeight: 600,
              }}
            >
              {row.staleCount} stale item{row.staleCount === 1 ? '' : 's'} · est. oldest {row.maxAge} d
            </div>
            <div
              style={{
                marginTop: SPACING.sm,
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: `${COLORS.ink}88`,
                background: `${COLORS.ink}06`,
                borderRadius: RADIUS.sm,
                padding: `${SPACING.xs} ${SPACING.sm}`,
                borderLeft: `3px solid ${COLORS.coralInk}66`,
              }}
            >
              Action: refresh evidence for this instance
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Section 4: Freshness over time ────────────────────────────────────────────

interface FreshnessTimeRow {
  label: string;
  freshCount: number;
  total: number;
  freshPct: number;
}

function buildFreshnessOverTime(rows: InstanceStalenessRow[]): FreshnessTimeRow[] {
  // "Today": items with age < 14
  // "30 days ago": items that were fresh 30 days ago, i.e. age + 30 < 14 => age < -16 (impossible)
  // Per spec: "30 days ago" = count evidence with age < 44 days now (age + 30 < 44 → age < 14+30)
  // Recompute per-item to simulate time shift
  let totalToday = 0;
  let freshToday = 0;
  let total30 = 0;
  let fresh30 = 0;

  const allInstances = [
    ...SOURCE_EVENT_INSTANCES.map((inst) => ({
      id: inst.id,
      items: inst.evidence.map((item, idx) => item.id ?? String(idx)),
    })),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((inst) => ({
      id: inst.id,
      items: inst.evidence.map((item, idx) => item.id ?? String(idx)),
    })),
  ];

  for (const inst of allInstances) {
    for (const eid of inst.items) {
      const age = evidenceAge(eid, inst.id);
      totalToday++;
      if (age < 14) freshToday++;

      total30++;
      // Simulate 30 days ago: evidence was age+30 older from today's perspective,
      // so if (age+30) < 14 → never. Use spec: age < 44 for "was fresh 30 days ago"
      if (age < 44) fresh30++;
    }
  }

  return [
    {
      label: '30 days ago (simulated)',
      freshCount: fresh30,
      total: total30,
      freshPct: total30 > 0 ? (fresh30 / total30) * 100 : 0,
    },
    {
      label: 'Today',
      freshCount: freshToday,
      total: totalToday,
      freshPct: totalToday > 0 ? (freshToday / totalToday) * 100 : 0,
    },
  ];
}

function FreshnessOverTimeSection({ rows }: { rows: InstanceStalenessRow[] }) {
  const timeRows = buildFreshnessOverTime(rows);

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
        <SectionHeading>Freshness over time</SectionHeading>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}66`,
            marginTop: 4,
          }}
        >
          Simulated — shows how evidence freshness declines as items age
        </div>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Period</th>
              <th style={{ ...HEADER_CELL, width: 100, textAlign: 'right' }}>Fresh items</th>
              <th style={{ ...HEADER_CELL, width: 80, textAlign: 'right' }}>Total</th>
              <th style={{ ...HEADER_CELL, width: 120, textAlign: 'right' }}>% Fresh</th>
            </tr>
          </thead>
          <tbody>
            {timeRows.map((row) => (
              <tr key={row.label}>
                <td style={BODY_CELL}>{row.label}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.freshCount}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>{row.total}</td>
                <td style={{ ...MONO_CELL, textAlign: 'right' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        row.freshPct >= 50
                          ? COLORS.mintInk
                          : row.freshPct >= 25
                            ? COLORS.amberInk
                            : COLORS.coralInk,
                    }}
                  >
                    {row.freshPct.toFixed(1)}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function EvidenceStalenessPage() {
  const { rows, kpis } = buildData();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Source detail"
          primaryActionHref="/source"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Evidence"
        title="Evidence Staleness"
        subtitle="Evidence freshness by instance — identify aging and stale evidence before gates fail"
      >
        <PortfolioKpiSection kpis={kpis} />
        <StalenessBreakdownTable rows={rows} />
        <MostStaleInstancesSection rows={rows} />
        <FreshnessOverTimeSection rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
