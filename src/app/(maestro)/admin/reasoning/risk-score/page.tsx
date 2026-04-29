// /admin/reasoning/risk-score — Composite instance risk score.
//
// Pure server component. Combines health, contradiction severity, stage dwell,
// gate gap, and waiver count into a single risk number (0–100) per instance.
// Higher score = more risk.
//
// Sections:
//   SummaryStrip      — N instances · X critical / Y elevated / Z low
//   RiskTable         — All instances ranked descending by risk score
//   RiskBreakdownCard — Component breakdown for top-3 riskiest instances

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance risk score · AbarVa Admin',
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const TODAY = new Date('2026-04-29');
const TODAY_MS = TODAY.getTime();

// ─── Types ─────────────────────────────────────────────────────────────────────

type RiskLevel = 'critical' | 'elevated' | 'low';

interface RiskComponents {
  healthRisk: number;
  contradictionRisk: number;
  dwellRisk: number;
  gateGapRisk: number;
  waiverRisk: number;
}

interface RiskRow {
  rank: number;
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  riskScore: number;
  riskLevel: RiskLevel;
  healthScore: number;
  activeContradictions: number;
  dwellDays: number;
  gateGap: number;
  waiverCount: number;
  components: RiskComponents;
}

// ─── Risk computation ─────────────────────────────────────────────────────────

function computeRiskScore(
  healthScore: number,
  activeContradictions: number,
  dwellDays: number,
  gateGap: number,
  waiverCount: number,
): { total: number; components: RiskComponents } {
  const healthRisk = Math.max(0, 100 - healthScore);
  const contradictionRisk = Math.min(activeContradictions * 15, 45);
  const dwellRisk = Math.min((dwellDays / 60) * 20, 20);
  const gateGapRisk = Math.min(gateGap * 3, 15);
  const waiverRisk = Math.min(waiverCount * 5, 10);
  const total = Math.round(
    healthRisk * 0.4 + contradictionRisk + dwellRisk + gateGapRisk + waiverRisk,
  );
  return {
    total,
    components: { healthRisk, contradictionRisk, dwellRisk, gateGapRisk, waiverRisk },
  };
}

function toRiskLevel(score: number): RiskLevel {
  if (score > 70) return 'critical';
  if (score >= 40) return 'elevated';
  return 'low';
}

// ─── Dwell computation ────────────────────────────────────────────────────────

function sourceDwellDays(instanceId: string): number {
  const inst = SOURCE_EVENT_INSTANCES.find((i) => i.id === instanceId);
  if (!inst) return 0;
  const history = (inst.stageHistory as Array<{ stageId?: string; enteredAt?: string }> | undefined) ?? [];
  const last = history.length > 0 ? history[history.length - 1] : null;
  const enteredAt = last?.enteredAt ?? '';
  if (!enteredAt) return 0;
  const entered = new Date(enteredAt).getTime();
  if (Number.isNaN(entered)) return 0;
  return Math.max(0, Math.floor((TODAY_MS - entered) / 86_400_000));
}

function programDwellDays(instanceId: string): number {
  const inst = APEX_RETAIL_PROGRAM_INSTANCES.find((i) => i.id === instanceId);
  if (!inst) return 0;
  const currentPhaseState = inst.phases.find((p) => p.phaseId === inst.currentPhase);
  const enteredAt = currentPhaseState?.enteredAt ?? '';
  if (!enteredAt) return 0;
  const entered = new Date(enteredAt).getTime();
  if (Number.isNaN(entered)) return 0;
  return Math.max(0, Math.floor((TODAY_MS - entered) / 86_400_000));
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildRiskRows(): RiskRow[] {
  const healthRows = buildHealthBoardRows();
  const allWaivers = getWaivers();

  // Build waiver count per instance
  const waiverCountById = new Map<string, number>();
  for (const w of allWaivers) {
    waiverCountById.set(w.instanceId, (waiverCountById.get(w.instanceId) ?? 0) + 1);
  }

  // Build health score lookup
  const healthScoreById = new Map<string, number>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    healthScoreById.set(inst.id, computeInstanceHealth(ctx).score);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    healthScoreById.set(inst.id, computeInstanceHealth(ctx).score);
  }

  const rows: RiskRow[] = healthRows.map((row) => {
    const healthScore = healthScoreById.get(row.id) ?? 0;
    const dwellDays =
      row.type === 'source' ? sourceDwellDays(row.id) : programDwellDays(row.id);
    const gateGap = row.gatesTotal - row.gatesMet;
    const waiverCount = waiverCountById.get(row.id) ?? 0;

    const { total, components } = computeRiskScore(
      healthScore,
      row.activeContradictions,
      dwellDays,
      gateGap,
      waiverCount,
    );

    return {
      rank: 0, // assigned after sort
      instanceId: row.id,
      instanceName: row.label,
      instanceType: row.type,
      riskScore: total,
      riskLevel: toRiskLevel(total),
      healthScore,
      activeContradictions: row.activeContradictions,
      dwellDays,
      gateGap,
      waiverCount,
      components,
    };
  });

  // Sort descending by risk score
  rows.sort((a, b) => b.riskScore - a.riskScore);

  // Assign ranks
  for (let i = 0; i < rows.length; i++) {
    rows[i]!.rank = i + 1;
  }

  return rows;
}

// ─── Shared table styles ──────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
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

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Risk level pill ──────────────────────────────────────────────────────────

function RiskLevelPill({ level }: { level: RiskLevel }) {
  const palette =
    level === 'critical'
      ? { bg: COLORS.coralSoft, fg: COLORS.coralInk }
      : level === 'elevated'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: COLORS.mintSoft, fg: COLORS.mintInk };
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
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {level}
    </span>
  );
}

// ─── Score bar ────────────────────────────────────────────────────────────────

function ScoreBar({ score, level }: { score: number; level: RiskLevel }) {
  const barColor =
    level === 'critical'
      ? COLORS.coralInk
      : level === 'elevated'
        ? COLORS.amberInk
        : COLORS.mintInk;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div
        style={{
          flex: 1,
          height: 6,
          background: `${COLORS.ink}10`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: barColor,
            borderRadius: RADIUS.pill,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: COLORS.ink,
          fontWeight: 700,
          minWidth: 24,
          textAlign: 'right',
        }}
      >
        {score}
      </span>
    </div>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: RiskRow[] }) {
  const total = rows.length;
  const critical = rows.filter((r) => r.riskLevel === 'critical').length;
  const elevated = rows.filter((r) => r.riskLevel === 'elevated').length;
  const low = rows.filter((r) => r.riskLevel === 'low').length;
  const avgRisk = total > 0 ? Math.round(rows.reduce((s, r) => s + r.riskScore, 0) / total) : 0;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.lg,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Portfolio risk
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {total} instance{total === 1 ? '' : 's'}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.md,
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        {[
          { label: 'Critical (>70)', value: critical, bg: COLORS.coralSoft, fg: COLORS.coralInk },
          { label: 'Elevated (40–69)', value: elevated, bg: COLORS.amberSoft, fg: COLORS.amberInk },
          { label: 'Low (<40)', value: low, bg: COLORS.mintSoft, fg: COLORS.mintInk },
          { label: 'Avg risk', value: avgRisk, bg: COLORS.skyPale, fg: COLORS.navy },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: item.bg,
              borderRadius: RADIUS.md,
              padding: `${SPACING.sm} ${SPACING.md}`,
              minWidth: 80,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 24,
                fontWeight: 700,
                color: item.fg,
                lineHeight: 1.1,
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                color: item.fg,
                opacity: 0.8,
                marginTop: 2,
                textAlign: 'center',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Risk table ───────────────────────────────────────────────────────────────

function RiskTable({ rows }: { rows: RiskRow[] }) {
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
            All instances
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Ranked by composite risk score, highest first
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={{ ...HEADER_CELL, width: 40 }}>#</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={{ ...HEADER_CELL, minWidth: 140 }}>Risk score</th>
              <th style={HEADER_CELL}>Health</th>
              <th style={HEADER_CELL}>Contradictions</th>
              <th style={HEADER_CELL}>Dwell (d)</th>
              <th style={HEADER_CELL}>Gate gap</th>
              <th style={HEADER_CELL}>Waivers</th>
              <th style={HEADER_CELL}>Risk level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.instanceId}>
                <td style={{ ...MONO_CELL, color: `${COLORS.ink}66` }}>{row.rank}</td>
                <td style={BODY_CELL}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{row.instanceName}</div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                      marginTop: 2,
                    }}
                  >
                    {row.instanceId} · {row.instanceType}
                  </div>
                </td>
                <td style={BODY_CELL}>
                  <ScoreBar score={row.riskScore} level={row.riskLevel} />
                </td>
                <td style={MONO_CELL}>{row.healthScore}</td>
                <td style={MONO_CELL}>{row.activeContradictions}</td>
                <td style={MONO_CELL}>{row.dwellDays}</td>
                <td style={MONO_CELL}>{row.gateGap}</td>
                <td style={MONO_CELL}>{row.waiverCount}</td>
                <td style={BODY_CELL}>
                  <RiskLevelPill level={row.riskLevel} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Risk breakdown card ──────────────────────────────────────────────────────

function ComponentBar({
  label,
  value,
  maxValue,
  color,
}: {
  label: string;
  value: number;
  maxValue: number;
  color: string;
}) {
  const pct = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
          width: 120,
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
      <div
        style={{
          flex: 1,
          height: 8,
          background: `${COLORS.ink}0d`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: RADIUS.pill,
            transition: 'width 0.2s',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: COLORS.ink,
          minWidth: 28,
          textAlign: 'right',
        }}
      >
        {Math.round(value)}
      </span>
    </div>
  );
}

function InstanceBreakdownCard({ row }: { row: RiskRow }) {
  const levelColor =
    row.riskLevel === 'critical'
      ? COLORS.coralInk
      : row.riskLevel === 'elevated'
        ? COLORS.amberInk
        : COLORS.mintInk;
  const levelBg =
    row.riskLevel === 'critical'
      ? COLORS.coralSoft
      : row.riskLevel === 'elevated'
        ? COLORS.amberSoft
        : COLORS.mintSoft;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${levelColor}44`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 17,
              fontWeight: 600,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {row.instanceName}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 10,
              color: `${COLORS.ink}66`,
              marginTop: 3,
            }}
          >
            {row.instanceId} · rank #{row.rank}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 32,
              fontWeight: 700,
              color: levelColor,
              lineHeight: 1,
            }}
          >
            {row.riskScore}
          </span>
          <span
            style={{
              display: 'inline-block',
              background: levelBg,
              color: levelColor,
              borderRadius: RADIUS.pill,
              padding: '2px 10px',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
            }}
          >
            {row.riskLevel}
          </span>
        </div>
      </div>

      {/* Component breakdown bars */}
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}88`,
            marginBottom: 10,
          }}
        >
          Component contributions
        </div>
        <ComponentBar
          label="Health risk (×0.4)"
          value={row.components.healthRisk * 0.4}
          maxValue={40}
          color={COLORS.coralInk}
        />
        <ComponentBar
          label="Contradictions"
          value={row.components.contradictionRisk}
          maxValue={45}
          color={COLORS.amberInk}
        />
        <ComponentBar
          label="Stage dwell"
          value={row.components.dwellRisk}
          maxValue={20}
          color={COLORS.navy}
        />
        <ComponentBar
          label="Gate gap"
          value={row.components.gateGapRisk}
          maxValue={15}
          color={`${COLORS.ink}88`}
        />
        <ComponentBar
          label="Waivers"
          value={row.components.waiverRisk}
          maxValue={10}
          color={`${COLORS.ink}55`}
        />
      </div>

      {/* Raw inputs */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.sm,
          paddingTop: SPACING.sm,
          borderTop: `1px solid ${COLORS.ink}10`,
        }}
      >
        {[
          { label: 'Health', value: row.healthScore },
          { label: 'Contradictions', value: row.activeContradictions },
          { label: 'Dwell days', value: row.dwellDays },
          { label: 'Gate gap', value: row.gateGap },
          { label: 'Waivers', value: row.waiverCount },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              background: `${COLORS.ink}06`,
              borderRadius: RADIUS.sm,
              padding: `${SPACING.xs} ${SPACING.sm}`,
              minWidth: 64,
            }}
          >
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 15,
                fontWeight: 700,
                color: COLORS.ink,
              }}
            >
              {item.value}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                color: `${COLORS.ink}77`,
                marginTop: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskBreakdownSection({ topRows }: { topRows: RiskRow[] }) {
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
          Top-3 risk breakdown
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Component contributions for the three riskiest instances
        </div>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: SPACING.md,
          padding: SPACING.md,
        }}
      >
        {topRows.map((row) => {
          const card = <InstanceBreakdownCard row={row} />;
          return <div key={row.instanceId}>{card}</div>;
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RiskScorePage() {
  const rows = buildRiskRows();
  const top3 = rows.slice(0, 3);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open health board"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Risk"
        title="Instance risk score"
        subtitle="Composite risk score combining health (40 % weight), active contradictions, stage dwell time, gate gap, and waiver count. Higher score = more risk. Instances above 70 are critical."
      >
        <SummaryStrip rows={rows} />
        <RiskTable rows={rows} />
        <RiskBreakdownSection topRows={top3} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
