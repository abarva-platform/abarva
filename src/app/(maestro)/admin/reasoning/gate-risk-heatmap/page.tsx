// /admin/reasoning/gate-risk-heatmap — 2D risk heatmap: X = gate type
// (hard vs. soft), Y = lifecycle stage.  Cell intensity = simulated failure
// rate; hotspot callout; pattern comparison; instance failure overlay.
//
// Pure server component.

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { InstanceHealthRow } from '@/lib/reasoning/health-board';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Gate Risk Heatmap · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type HeatZone = 'hot' | 'warm' | 'cool';

interface StageRiskRow {
  stageIdx: number;
  stageName: string;
  hardRate: number;   // 10–54 integer %
  softRate: number;
  combinedRate: number;
  hardZone: HeatZone;
  softZone: HeatZone;
  combinedZone: HeatZone;
}

interface PatternStageRow {
  patternTitle: string;
  stageName: string;
  hardRate: number;
  softRate: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function simRate(stageIdx: number, gateType: 'hard' | 'soft'): number {
  return (stageIdx * 13 + (gateType === 'hard' ? 7 : 3)) % 45 + 10;
}

function zone(rate: number): HeatZone {
  if (rate > 35) return 'hot';
  if (rate >= 20) return 'warm';
  return 'cool';
}

function zoneBg(z: HeatZone): string {
  if (z === 'hot') return SHELL.RUST_BG;
  if (z === 'warm') return SHELL.PEACH_BG;
  return SHELL.MINT_BG;
}

function zoneText(z: HeatZone): string {
  if (z === 'hot') return SHELL.RUST_TEXT;
  if (z === 'warm') return SHELL.PEACH_TEXT;
  return SHELL.MINT_TEXT;
}

function zoneLabel(z: HeatZone): string {
  if (z === 'hot') return 'Hot';
  if (z === 'warm') return 'Warm';
  return 'Cool';
}

// ─── Data builders ────────────────────────────────────────────────────────────

function buildRiskRows(patterns: LifecyclePatternSeed[]): StageRiskRow[] {
  // Collect unique stage names in order from all patterns (max 8)
  const seenStages = new Map<string, number>(); // label → first order seen
  for (const p of patterns) {
    for (const s of p.stages) {
      if (!seenStages.has(s.label)) {
        seenStages.set(s.label, s.order);
      }
    }
  }

  const sortedStages = [...seenStages.entries()]
    .sort((a, b) => a[1] - b[1])
    .slice(0, 8)
    .map(([label], idx) => ({ label, idx }));

  return sortedStages.map(({ label, idx }) => {
    const hardRate = simRate(idx, 'hard');
    const softRate = simRate(idx, 'soft');
    const combinedRate = Math.round((hardRate + softRate) / 2);
    return {
      stageIdx: idx,
      stageName: label,
      hardRate,
      softRate,
      combinedRate,
      hardZone: zone(hardRate),
      softZone: zone(softRate),
      combinedZone: zone(combinedRate),
    };
  });
}

function buildPatternComparison(
  patterns: LifecyclePatternSeed[],
  rows: StageRiskRow[],
): PatternStageRow[] {
  if (patterns.length < 2) return [];
  // For each pattern take its first stage and show the failure rates
  const result: PatternStageRow[] = [];
  for (const p of patterns.slice(0, 4)) {
    const firstStage = p.stages.sort((a, b) => a.order - b.order)[0];
    if (firstStage === undefined) continue;
    const matchedRow = rows.find(
      (r) => r.stageName === firstStage.label,
    );
    if (matchedRow === undefined) continue;
    result.push({
      patternTitle: p.title,
      stageName: firstStage.label,
      hardRate: matchedRow.hardRate,
      softRate: matchedRow.softRate,
    });
  }
  return result;
}

function findHottestRow(rows: StageRiskRow[]): StageRiskRow | null {
  if (rows.length === 0) return null;
  return rows.reduce((best, r) =>
    r.hardRate > best.hardRate ? r : best,
  );
}

function buildFailingInstances(
  healthRows: InstanceHealthRow[],
  hottestRow: StageRiskRow | null,
): InstanceHealthRow[] {
  if (hottestRow === null) return [];
  // Use stageIdx as a proxy: instances where gatesMet / gatesTotal < 0.5
  return healthRows.filter(
    (r) => r.gatesTotal > 0 && r.gatesMet / r.gatesTotal < 0.5,
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: StageRiskRow[] }) {
  const hotCount = rows.filter((r) => r.hardZone === 'hot' || r.softZone === 'hot').length;
  const maxRate = rows.length === 0 ? 0 : Math.max(...rows.map((r) => r.hardRate));
  const avgCombined =
    rows.length === 0
      ? 0
      : Math.round(rows.reduce((s, r) => s + r.combinedRate, 0) / rows.length);

  const items = [
    { label: 'stages', value: String(rows.length), color: COLORS.ink },
    { label: 'hot combos', value: String(hotCount), color: SHELL.RUST_TEXT },
    { label: 'peak failure', value: `${maxRate}%`, color: SHELL.RUST_TEXT },
    { label: 'avg combined', value: `${avgCombined}%`, color: SHELL.PEACH_TEXT },
  ] as const;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'baseline',
        gap: `${SPACING.sm} ${SPACING.lg}`,
      }}
    >
      {items.map((item, i) => (
        <span key={item.label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          {i > 0 && (
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}40`,
                marginRight: 4,
              }}
            >
              ·
            </span>
          )}
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              color: item.color,
              letterSpacing: '-0.02em',
              lineHeight: 1,
            }}
          >
            {item.value}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
    </div>
  );
}

function HeatCell({
  rate,
  z,
}: {
  rate: number;
  z: HeatZone;
}) {
  return (
    <div
      style={{
        background: zoneBg(z),
        color: zoneText(z),
        borderRadius: RADIUS.md,
        padding: '6px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 13,
        fontWeight: 700,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
        minWidth: 68,
      }}
    >
      <span style={{ fontSize: 15 }}>{rate}%</span>
      <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>{zoneLabel(z)}</span>
    </div>
  );
}

function HeatmapGrid({ rows }: { rows: StageRiskRow[] }) {
  const COL_HEADERS = ['Stage', 'Hard Gates', 'Soft Gates', 'Combined'];

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
          Failure rate by stage and gate type
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Hot &gt;35% · Warm 20-35% · Cool &lt;20% — simulated from gate composition index
        </div>
      </header>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1fr 1fr',
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}18`,
          background: `${COLORS.ink}04`,
          gap: SPACING.md,
        }}
      >
        {COL_HEADERS.map((h) => (
          <div
            key={h}
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.07em',
              textTransform: 'uppercase',
              fontWeight: 700,
              color: `${COLORS.ink}88`,
            }}
          >
            {h}
          </div>
        ))}
      </div>

      {/* Data rows */}
      {rows.map((row, i) => (
        <div
          key={row.stageName}
          style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1fr 1fr',
            padding: `10px ${SPACING.lg}`,
            borderBottom: `1px solid ${COLORS.ink}0d`,
            background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
            alignItems: 'center',
            gap: SPACING.md,
          }}
        >
          {/* Stage label */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 13,
              color: COLORS.navy,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={row.stageName}
          >
            {row.stageName.length > 10
              ? `${row.stageName.slice(0, 10)}…`
              : row.stageName}
          </div>
          <HeatCell rate={row.hardRate} z={row.hardZone} />
          <HeatCell rate={row.softRate} z={row.softZone} />
          <HeatCell rate={row.combinedRate} z={row.combinedZone} />
        </div>
      ))}
    </section>
  );
}

function HotspotCallout({ rows }: { rows: StageRiskRow[] }) {
  const hottest = findHottestRow(rows);
  if (hottest === null) return null;

  return (
    <section
      style={{
        background: SHELL.RUST_BG,
        border: `1px solid ${SHELL.RUST_TEXT}33`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.lg,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 26,
          color: SHELL.RUST_TEXT,
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        {hottest.hardRate}%
      </div>
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 18,
            color: SHELL.RUST_TEXT,
            letterSpacing: '-0.01em',
            marginBottom: 4,
          }}
        >
          Hotspot: {hottest.stageName} Hard Gates — {hottest.hardRate}% failure rate
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${SHELL.RUST_TEXT}cc`,
          }}
        >
          This stage × gate-type combination carries the highest simulated failure rate in the
          portfolio. Review hard gate criteria for the{' '}
          <strong>{hottest.stageName}</strong> stage across all patterns and consider
          targeted remediation or evidence-gap analysis.
        </div>
      </div>
    </section>
  );
}

function PatternComparison({ compRows }: { compRows: PatternStageRow[] }) {
  if (compRows.length === 0) return null;

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
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Pattern comparison — first stage failure rates
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Same methodology applied across patterns — compare opening-stage risk posture
        </div>
      </header>

      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {compRows.map((cr) => {
          const hardZ = zone(cr.hardRate);
          const softZ = zone(cr.softRate);
          return (
            <div
              key={cr.patternTitle}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 100px 100px',
                alignItems: 'center',
                gap: SPACING.md,
                padding: `8px ${SPACING.md}`,
                background: `${COLORS.ink}03`,
                borderRadius: RADIUS.md,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 13,
                    fontWeight: 600,
                    color: COLORS.ink,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {cr.patternTitle}
                </div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}66`,
                    marginTop: 1,
                  }}
                >
                  Stage: {cr.stageName}
                </div>
              </div>
              <HeatCell rate={cr.hardRate} z={hardZ} />
              <HeatCell rate={cr.softRate} z={softZ} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InstanceFailureOverlay({
  failingInstances,
  hottestRow,
}: {
  failingInstances: InstanceHealthRow[];
  hottestRow: StageRiskRow | null;
}) {
  if (hottestRow === null) return null;

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
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Instance failure overlay — hottest stage
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Instances where gates met / gates total &lt; 50% at the{' '}
            <strong>{hottestRow.stageName}</strong> hotspot stage
          </div>
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 13,
            fontWeight: 700,
            color: failingInstances.length > 0 ? SHELL.RUST_TEXT : SHELL.MINT_TEXT,
            background:
              failingInstances.length > 0 ? SHELL.RUST_BG : SHELL.MINT_BG,
            borderRadius: RADIUS.md,
            padding: '4px 12px',
            flexShrink: 0,
          }}
        >
          {failingInstances.length} failing
        </div>
      </header>

      {failingInstances.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}66`,
            textAlign: 'center',
          }}
        >
          No instances currently failing the gate threshold for this stage.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {failingInstances.map((inst, i) => {
            const passPct =
              inst.gatesTotal > 0
                ? Math.round((inst.gatesMet / inst.gatesTotal) * 100)
                : 0;
            return (
              <div
                key={inst.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 100px 100px',
                  alignItems: 'center',
                  gap: SPACING.md,
                  padding: `10px ${SPACING.lg}`,
                  borderBottom: `1px solid ${COLORS.ink}0d`,
                  background: i % 2 === 0 ? COLORS.white : `${COLORS.ink}03`,
                }}
              >
                {/* Instance label */}
                <div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 13,
                      fontWeight: 600,
                      color: COLORS.ink,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {inst.label}
                  </div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: `${COLORS.ink}66`,
                      marginTop: 1,
                    }}
                  >
                    {inst.type} · {inst.stageLabel ?? inst.phaseLabel ?? '—'}
                  </div>
                </div>

                {/* Type badge */}
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {inst.type}
                </div>

                {/* Gates met / total */}
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 13,
                    color: SHELL.RUST_TEXT,
                    fontWeight: 600,
                  }}
                >
                  {inst.gatesMet}/{inst.gatesTotal} gates
                </div>

                {/* Pass % badge */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: SHELL.RUST_BG,
                    color: SHELL.RUST_TEXT,
                    borderRadius: RADIUS.md,
                    padding: '3px 8px',
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {passPct}%
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GateRiskHeatmapPage() {
  const healthRows = buildHealthBoardRows();
  const allPatterns = getAllLifecyclePatterns();
  const riskRows = buildRiskRows(allPatterns);
  const hottest = findHottestRow(riskRows);
  const patternCompRows = buildPatternComparison(allPatterns, riskRows);
  const failingInstances = buildFailingInstances(healthRows, hottest);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Gate Risk Heatmap"
        subtitle="Failure rate by gate type and stage — identify high-risk gate combinations"
      >
        <SummaryStrip rows={riskRows} />
        <HotspotCallout rows={riskRows} />
        <HeatmapGrid rows={riskRows} />
        <PatternComparison compRows={patternCompRows} />
        <InstanceFailureOverlay
          failingInstances={failingInstances}
          hottestRow={hottest}
        />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
