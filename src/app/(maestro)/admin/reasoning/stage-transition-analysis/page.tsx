// /admin/reasoning/stage-transition-analysis — Stage transition pattern analysis.
//
// Server component. Aggregates transition pairs across all fixture instances,
// computes dwell time proxies, identifies success predictors, and surfaces
// stuck instances.
//
// Sections:
//   SummaryStrip        — total instances · distinct transitions · stuck count
//   TransitionFrequency — From → To · count · avg dwell · success rate
//   DwellByStage        — CSS bar chart, colour-coded fast/normal/slow
//   SuccessPredictors   — proxy predictor table
//   StuckInstances      — instances with dwell estimate > 20 days

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage Transition Analysis · AbarVa Admin',
};

// ─── Constants ─────────────────────────────────────────────────────────────────

const STUCK_THRESHOLD = 20; // days

// ─── Data model ────────────────────────────────────────────────────────────────

interface TransitionPair {
  fromStage: string;
  toStage: string;
  count: number;
  totalDwellDays: number;
  advancedAndHealthy: number; // instances that transitioned AND health is "healthy"
}

interface DwellByStageEntry {
  stage: string;
  avgDwellDays: number;
  instanceCount: number;
}

interface PredictorRow {
  predictor: string;
  advancedCount: number;
  totalCount: number;
  advancedPct: number;
}

interface StuckInstance {
  id: string;
  label: string;
  currentStage: string;
  estimatedDwellDays: number;
}

// ─── Dwell time proxy ─────────────────────────────────────────────────────────

/**
 * Deterministic proxy: per-instance dwell per stage.
 * Formula from spec: stageIndex > 0 ? Math.abs((instanceId.charCodeAt(0) * (stageIdx + 1)) % 30) + 5 : 0
 */
function dwellDaysProxy(instanceId: string, stageIdx: number): number {
  if (stageIdx === 0) return 0;
  return Math.abs((instanceId.charCodeAt(0) * (stageIdx + 1)) % 30) + 5;
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function buildTransitionData() {
  const rows = buildHealthBoardRows();
  const stages = getAllLifecyclePatterns()[0]?.stages ?? [];
  const stageNames = stages.map((s) => s.label);

  // Map: "fromStage|toStage" → TransitionPair accumulator
  const pairMap = new Map<string, TransitionPair>();

  // Map: stageLabel → { totalDwell, count }
  const dwellMap = new Map<string, { total: number; count: number }>();

  const stuckInstances: StuckInstance[] = [];

  for (const row of rows) {
    // Only process source instances (they have stageLabel)
    if (row.type !== 'source' || !row.stageLabel) continue;

    const currentStage = row.stageLabel;

    // Determine stageIndex by matching against stageNames
    const currentIdx = stageNames.findIndex((s) => s === currentStage);
    // If not found in pattern stages, fall back to position 0
    const stageIdx = currentIdx >= 0 ? currentIdx : 0;

    // Generate transition pairs for all completed transitions (stages 0 → stageIdx-1)
    for (let i = 0; i < stageIdx; i++) {
      const fromStage = stageNames[i] ?? `Stage ${i}`;
      const toStage = stageNames[i + 1] ?? currentStage;
      const key = `${fromStage}|${toStage}`;

      const dwell = dwellDaysProxy(row.id, i + 1);
      const isHealthy = row.healthLabel === 'healthy';

      const existing = pairMap.get(key) ?? {
        fromStage,
        toStage,
        count: 0,
        totalDwellDays: 0,
        advancedAndHealthy: 0,
      };
      pairMap.set(key, {
        ...existing,
        count: existing.count + 1,
        totalDwellDays: existing.totalDwellDays + dwell,
        advancedAndHealthy: existing.advancedAndHealthy + (isHealthy ? 1 : 0),
      });

      // Accumulate dwell for stage chart (from-stage perspective)
      const stageEntry = dwellMap.get(fromStage) ?? { total: 0, count: 0 };
      dwellMap.set(fromStage, {
        total: stageEntry.total + dwell,
        count: stageEntry.count + 1,
      });
    }

    // Stuck instances: current stage dwell > STUCK_THRESHOLD
    const currentDwell = dwellDaysProxy(row.id, stageIdx);
    if (currentDwell > STUCK_THRESHOLD) {
      stuckInstances.push({
        id: row.id,
        label: row.label,
        currentStage,
        estimatedDwellDays: currentDwell,
      });
    }
  }

  // Sort transitions by count descending
  const transitions = Array.from(pairMap.values()).sort((a, b) => b.count - a.count);

  // Build dwell by stage entries
  const dwellByStage: DwellByStageEntry[] = Array.from(dwellMap.entries())
    .map(([stage, { total, count }]) => ({
      stage,
      avgDwellDays: count > 0 ? Math.round(total / count) : 0,
      instanceCount: count,
    }))
    .sort((a, b) => b.avgDwellDays - a.avgDwellDays);

  // Sort stuck by dwell descending
  stuckInstances.sort((a, b) => b.estimatedDwellDays - a.estimatedDwellDays);

  return { transitions, dwellByStage, stuckInstances, rows };
}

// ─── Success predictor computation ───────────────────────────────────────────

function buildPredictors() {
  const rows = buildHealthBoardRows().filter((r) => r.type === 'source');

  const total = rows.length;
  // "advanced" = stageLabel found AND at least 2 stages in — proxy: gatesTotal > 4
  // We'll use a simpler proxy: gatesMet ≥ 2
  const isAdvanced = (r: (typeof rows)[number]) => r.gatesMet >= 2;

  const highGatePass = rows.filter((r) => r.gatesTotal > 0 && r.gatesMet / r.gatesTotal >= 0.7);
  const lowContradictions = rows.filter((r) => r.activeContradictions === 0);
  const hasWaivers = rows.filter(
    (r) => r.gatesTotal > 0 && r.gatesMet < r.gatesTotal,
  );
  const noWaivers = rows.filter(
    (r) => r.gatesTotal > 0 && r.gatesMet >= r.gatesTotal,
  );

  function predictor(label: string, subset: typeof rows): PredictorRow {
    const adv = subset.filter(isAdvanced).length;
    const tot = subset.length;
    return {
      predictor: label,
      advancedCount: adv,
      totalCount: tot,
      advancedPct: tot > 0 ? Math.round((adv / tot) * 100) : 0,
    };
  }

  return [
    predictor('High gate pass rate (≥ 70%)', highGatePass),
    predictor('Low contradictions (none active)', lowContradictions),
    predictor('Has unmet gates (proxy waivers)', hasWaivers),
    predictor('No unmet gates', noWaivers),
    predictor('All instances (baseline)', rows),
  ];
}

// ─── Cell styles ─────────────────────────────────────────────────────────────

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

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: string;
  children: React.ReactNode;
}) {
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
            {title}
          </h2>
          {subtitle && (
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}88`,
                marginTop: 4,
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
        {count !== undefined && (
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}88`,
              flexShrink: 0,
            }}
          >
            {count}
          </span>
        )}
      </header>
      {children}
    </section>
  );
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  instanceCount,
  transitionCount,
  stuckCount,
}: {
  instanceCount: number;
  transitionCount: number;
  stuckCount: number;
}) {
  const dot = (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        color: `${COLORS.ink}88`,
      }}
    >
      ·
    </span>
  );

  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.navy,
          fontWeight: 600,
        }}
      >
        {instanceCount} instance{instanceCount === 1 ? '' : 's'} analysed
      </span>
      {dot}
      <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, color: `${COLORS.ink}99` }}>
        {transitionCount} distinct transition pair{transitionCount === 1 ? '' : 's'}
      </span>
      {dot}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: stuckCount > 0 ? COLORS.coralInk : `${COLORS.ink}99`,
          fontWeight: stuckCount > 0 ? 600 : 400,
        }}
      >
        {stuckCount} stuck instance{stuckCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// ─── 1. Transition frequency table ───────────────────────────────────────────

function TransitionFrequencyTable({
  transitions,
}: {
  transitions: TransitionPair[];
}) {
  if (transitions.length === 0) {
    return (
      <div
        style={{
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
        }}
      >
        No completed transitions found in fixture data.
      </div>
    );
  }

  return (
    <Section
      title="Transition frequency"
      subtitle="How often each stage-to-stage transition occurred across all instances"
      count={`${transitions.length} pair${transitions.length === 1 ? '' : 's'}`}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 660 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>From stage</th>
              <th style={HEADER_CELL}>To stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Count</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Avg dwell</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Success rate</th>
            </tr>
          </thead>
          <tbody>
            {transitions.map((t, idx) => {
              const avgDwell =
                t.count > 0 ? Math.round(t.totalDwellDays / t.count) : 0;
              const successPct =
                t.count > 0
                  ? Math.round((t.advancedAndHealthy / t.count) * 100)
                  : 0;

              return (
                <tr key={`${t.fromStage}|${t.toStage}|${idx}`}>
                  <td style={MONO_CELL}>{t.fromStage}</td>
                  <td style={MONO_CELL}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span
                        style={{
                          color: COLORS.navy,
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        →
                      </span>
                      <span
                        style={{
                          background: COLORS.mintSoft,
                          color: COLORS.mintInk,
                          borderRadius: RADIUS.pill,
                          padding: '1px 8px',
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          fontWeight: 600,
                        }}
                      >
                        {t.toStage}
                      </span>
                    </span>
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      paddingRight: SPACING.lg,
                      fontWeight: 600,
                      color: COLORS.navy,
                    }}
                  >
                    {t.count}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right',
                      paddingRight: SPACING.lg,
                      color:
                        avgDwell > 20
                          ? COLORS.coralInk
                          : avgDwell >= 10
                            ? COLORS.amberInk
                            : COLORS.mintInk,
                    }}
                  >
                    {avgDwell}d
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      textAlign: 'right',
                      paddingRight: SPACING.lg,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 11,
                        fontWeight: 600,
                        color:
                          successPct >= 60
                            ? COLORS.mintInk
                            : successPct >= 40
                              ? COLORS.amberInk
                              : COLORS.coralInk,
                      }}
                    >
                      {successPct}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── 2. Dwell time by stage bar chart ─────────────────────────────────────────

function DwellByStageChart({
  entries,
}: {
  entries: DwellByStageEntry[];
}) {
  if (entries.length === 0) return null;

  const maxDwell = Math.max(...entries.map((e) => e.avgDwellDays), 1);
  const slowest = entries[0]; // sorted desc by avgDwellDays

  return (
    <Section
      title="Dwell time by stage"
      subtitle="Average estimated days instances spend in each stage before transitioning out"
    >
      <div style={{ padding: SPACING.lg }}>
        {/* Slowest callout */}
        <div
          style={{
            background: COLORS.coralSoft,
            border: `1px solid ${COLORS.coralInk}33`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            marginBottom: SPACING.md,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: COLORS.coralInk,
            fontWeight: 600,
          }}
        >
          Slowest transition: {slowest.stage} (avg {slowest.avgDwellDays}d)
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
          {entries.map((entry) => {
            const pct = (entry.avgDwellDays / maxDwell) * 100;
            const barColor =
              entry.avgDwellDays > 20
                ? COLORS.coralSoft
                : entry.avgDwellDays >= 10
                  ? COLORS.amberSoft
                  : COLORS.mintSoft;
            const barBorder =
              entry.avgDwellDays > 20
                ? `1px solid ${COLORS.coralInk}44`
                : entry.avgDwellDays >= 10
                  ? `1px solid ${COLORS.amberInk}44`
                  : `1px solid ${COLORS.mintInk}44`;
            const labelColor =
              entry.avgDwellDays > 20
                ? COLORS.coralInk
                : entry.avgDwellDays >= 10
                  ? COLORS.amberInk
                  : COLORS.mintInk;
            const speedLabel =
              entry.avgDwellDays > 20
                ? 'slow'
                : entry.avgDwellDays >= 10
                  ? 'normal'
                  : 'fast';

            return (
              <div
                key={entry.stage}
                style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}
              >
                {/* Stage label */}
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}cc`,
                    width: 180,
                    flexShrink: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {entry.stage}
                </div>

                {/* Bar track */}
                <div
                  style={{
                    flex: 1,
                    height: 20,
                    background: `${COLORS.ink}08`,
                    borderRadius: RADIUS.sm,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: barColor,
                      border: barBorder,
                      borderRadius: RADIUS.sm,
                      minWidth: pct > 0 ? 4 : 0,
                    }}
                  />
                </div>

                {/* Days badge */}
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 12,
                    color: labelColor,
                    fontWeight: 600,
                    width: 36,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {entry.avgDwellDays}d
                </div>

                {/* Speed label */}
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    color: labelColor,
                    width: 40,
                    flexShrink: 0,
                    letterSpacing: '0.04em',
                  }}
                >
                  {speedLabel}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Section>
  );
}

// ─── 3. Transition success predictors ─────────────────────────────────────────

function SuccessPredictorsTable({
  predictors,
}: {
  predictors: PredictorRow[];
}) {
  return (
    <Section
      title="Transition success predictors"
      subtitle="Proxy analysis — % of instances with each characteristic that successfully advanced (gatesMet ≥ 2)"
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Predictor</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Advanced</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Total</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {predictors.map((p) => (
              <tr key={p.predictor}>
                <td style={BODY_CELL}>{p.predictor}</td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right',
                    paddingRight: SPACING.lg,
                  }}
                >
                  {p.advancedCount}
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right',
                    paddingRight: SPACING.lg,
                  }}
                >
                  {p.totalCount}
                </td>
                <td
                  style={{
                    ...BODY_CELL,
                    textAlign: 'right',
                    paddingRight: SPACING.lg,
                  }}
                >
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 12,
                      fontWeight: 700,
                      color:
                        p.advancedPct >= 60
                          ? COLORS.mintInk
                          : p.advancedPct >= 40
                            ? COLORS.amberInk
                            : COLORS.coralInk,
                    }}
                  >
                    {p.advancedPct}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── 4. Stuck instances ───────────────────────────────────────────────────────

function StuckInstancesList({
  instances,
}: {
  instances: StuckInstance[];
}) {
  if (instances.length === 0) {
    return (
      <Section
        title="Stuck instances"
        subtitle={`Instances estimated to have dwelled > ${STUCK_THRESHOLD} days in their current stage`}
      >
        <div
          style={{
            padding: SPACING.xl,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: COLORS.mintInk,
            fontWeight: 600,
          }}
        >
          No stuck instances detected — all within threshold.
        </div>
      </Section>
    );
  }

  return (
    <Section
      title="Stuck instances"
      subtitle={`Instances estimated to have dwelled > ${STUCK_THRESHOLD} days in their current stage`}
      count={`${instances.length} flagged`}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Current stage</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Est. dwell</th>
              <th style={HEADER_CELL}>Recommendation</th>
            </tr>
          </thead>
          <tbody>
            {instances.map((inst) => (
              <tr key={inst.id}>
                <td style={BODY_CELL}>
                  <a
                    href={`/admin/reasoning/instances/${inst.id}`}
                    style={{
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: COLORS.navy,
                      textDecoration: 'none',
                      fontWeight: 500,
                    }}
                  >
                    {inst.label}
                  </a>
                </td>
                <td style={MONO_CELL}>
                  <span
                    style={{
                      display: 'inline-block',
                      background: `${COLORS.ink}08`,
                      color: COLORS.ink,
                      borderRadius: RADIUS.pill,
                      padding: '2px 10px',
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    {inst.currentStage}
                  </span>
                </td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right',
                    paddingRight: SPACING.lg,
                    fontWeight: 700,
                    color: COLORS.coralInk,
                  }}
                >
                  {inst.estimatedDwellDays}d
                </td>
                <td
                  style={{
                    ...BODY_CELL,
                    fontStyle: 'italic',
                    color: `${COLORS.ink}88`,
                    fontSize: 11,
                  }}
                >
                  Consider reviewing gate criteria at {inst.currentStage}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StageTransitionAnalysisPage() {
  const { transitions, dwellByStage, stuckInstances, rows } = buildTransitionData();
  const predictors = buildPredictors();

  const sourceInstances = rows.filter((r) => r.type === 'source');

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View stage dwell"
          primaryActionHref="/admin/reasoning/stage-dwell"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Stage Transition Analysis"
        subtitle="Transition patterns, dwell times, and predictors of successful stage advancement"
      >
        <SummaryStrip
          instanceCount={sourceInstances.length}
          transitionCount={transitions.length}
          stuckCount={stuckInstances.length}
        />

        <TransitionFrequencyTable transitions={transitions} />

        <DwellByStageChart entries={dwellByStage} />

        <SuccessPredictorsTable predictors={predictors} />

        <StuckInstancesList instances={stuckInstances} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
