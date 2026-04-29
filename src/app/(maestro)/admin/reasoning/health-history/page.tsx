// /admin/reasoning/health-history — Reconstructed health score timeline.
//
// Pure server component. For each instance derives a historical health score
// at every stage/phase transition by estimating what the score WOULD HAVE BEEN
// given the gates available at that stage. No live health history exists — we
// reconstruct it deterministically from stageHistory timestamps.
//
// Derivation formula (per task spec):
//   gatesMet = round((stageIndex / max(totalStages - 1, 1)) × totalGates)
//   score    = round((gatesMet / max(totalGates, 1)) × 60 + 30 + 10)
//
// The +10 base assumes no active contradictions at derivation time.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Health history · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type Trend = 'improving' | 'stable' | 'declining';

interface HealthPoint {
  date: string;     // ISO date string
  stage: string;    // stage or phase label
  score: number;    // derived health score at this point
  delta: number | null; // change from previous point (null for first)
  trend: Trend | null;  // null for first point
}

interface InstanceHistory {
  id: string;
  name: string;
  type: 'source' | 'program';
  currentScore: number;
  points: HealthPoint[];
  lastActiveAt: string; // ISO date of most recent transition
}

// ─── Derivation helpers ────────────────────────────────────────────────────────

function derivedScore(stageIndex: number, totalStages: number, totalGates: number): number {
  const gatesMet = Math.round((stageIndex / Math.max(totalStages - 1, 1)) * totalGates);
  return Math.round((gatesMet / Math.max(totalGates, 1)) * 60 + 30 + 10); // assume no contradictions
}

function trend(delta: number): Trend {
  if (delta > 2) return 'improving';
  if (delta < -2) return 'declining';
  return 'stable';
}

// ─── Source instance history builder ──────────────────────────────────────────

function buildSourceHistories(): InstanceHistory[] {
  const patterns = getAllLifecyclePatterns();
  const histories: InstanceHistory[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = patterns.find((p) => p.patternId === inst.patternId);
    const totalStages = pattern ? pattern.stages.length : Math.max(inst.stageHistory.length, 1);
    const totalGates = pattern ? pattern.gateCriteria.length : 0;

    const points: HealthPoint[] = [];
    let prevScore: number | null = null;

    for (let i = 0; i < inst.stageHistory.length; i++) {
      const transition = inst.stageHistory[i];
      const score = derivedScore(i, totalStages, totalGates);
      const delta = prevScore !== null ? score - prevScore : null;

      points.push({
        date: transition.enteredAt,
        stage: transition.stageId,
        score,
        delta,
        trend: delta !== null ? trend(delta) : null,
      });

      prevScore = score;
    }

    const currentScore = points.length > 0 ? points[points.length - 1].score : 40;
    const lastActiveAt =
      inst.stageHistory.length > 0
        ? inst.stageHistory[inst.stageHistory.length - 1].enteredAt
        : '1970-01-01';

    histories.push({
      id: inst.id,
      name: inst.name,
      type: 'source',
      currentScore,
      points,
      lastActiveAt,
    });
  }

  return histories;
}

// ─── Program instance history builder ─────────────────────────────────────────

const PHASE_LABELS = ['Originate', 'Discovery', 'Synthesis', 'Design', 'Build', 'Activate', 'Operate'];

function buildProgramHistories(): InstanceHistory[] {
  const histories: InstanceHistory[] = [];

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const totalStages = 7; // program lifecycle is always 7 phases
    const totalGates = pattern ? pattern.gateCriteria.length : 7; // fallback: 1 gate per phase

    // Build points from phases that have enteredAt (completed or current)
    const points: HealthPoint[] = [];
    let prevScore: number | null = null;

    const doneAndCurrent = inst.phases.filter(
      (ph) => (ph.status === 'done' || ph.status === 'current') && ph.enteredAt !== undefined,
    );

    for (const phase of doneAndCurrent) {
      const stageIndex = phase.phaseId;
      const score = derivedScore(stageIndex, totalStages, totalGates);
      const delta = prevScore !== null ? score - prevScore : null;

      points.push({
        date: phase.enteredAt!,
        stage: `P${phase.phaseId} ${PHASE_LABELS[phase.phaseId] ?? phase.phaseLabel}`,
        score,
        delta,
        trend: delta !== null ? trend(delta) : null,
      });

      prevScore = score;
    }

    const currentScore = points.length > 0 ? points[points.length - 1].score : 40;

    // Most recently entered phase date
    const allDates = doneAndCurrent
      .map((ph) => ph.enteredAt ?? '')
      .filter(Boolean)
      .sort();
    const lastActiveAt = allDates.length > 0 ? allDates[allDates.length - 1] : '1970-01-01';

    histories.push({
      id: inst.id,
      name: inst.name,
      type: 'program',
      currentScore,
      points,
      lastActiveAt,
    });
  }

  return histories;
}

// ─── Page data ─────────────────────────────────────────────────────────────────

function buildAllHistories(): InstanceHistory[] {
  const all = [...buildSourceHistories(), ...buildProgramHistories()];
  // Most recently active first
  return all.sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
}

// ─── UI helpers ────────────────────────────────────────────────────────────────

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
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 12,
  color: `${COLORS.ink}cc`,
};

function formatDate(iso: string): string {
  if (!iso || iso === '1970-01-01') return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ─── SummaryStrip ─────────────────────────────────────────────────────────────

function SummaryStrip({ histories }: { histories: InstanceHistory[] }) {
  const totalPoints = histories.reduce((sum, h) => sum + h.points.length, 0);
  const avgScore =
    histories.length === 0
      ? 0
      : Math.round(histories.reduce((sum, h) => sum + h.currentScore, 0) / histories.length);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: SPACING.md,
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
          Health history
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
          {histories.length} instance{histories.length === 1 ? '' : 's'}
        </div>
      </div>
      <div style={{ display: 'flex', gap: SPACING.md, flexWrap: 'wrap', alignItems: 'center' }}>
        <StatChip label="data points" value={totalPoints} />
        <StatChip label="avg current score" value={avgScore} />
      </div>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: COLORS.skyPale,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        minWidth: 100,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 24,
          color: COLORS.navy,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: COLORS.navy,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: 600,
          marginTop: 2,
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ─── TrendArrow ───────────────────────────────────────────────────────────────

function TrendArrow({ t }: { t: Trend | null }) {
  if (t === null) {
    return <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>—</span>;
  }
  if (t === 'improving') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: COLORS.mintSoft,
          color: COLORS.mintInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        ↑ improving
      </span>
    );
  }
  if (t === 'declining') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          background: COLORS.coralSoft,
          color: COLORS.coralInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        ↓ declining
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: COLORS.amberSoft,
        color: COLORS.amberInk,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      → stable
    </span>
  );
}

// ─── DeltaCell ────────────────────────────────────────────────────────────────

function DeltaCell({ delta }: { delta: number | null }) {
  if (delta === null) {
    return <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>—</span>;
  }
  const sign = delta > 0 ? '+' : '';
  const color = delta > 2 ? COLORS.mintInk : delta < -2 ? COLORS.coralInk : COLORS.amberInk;
  return (
    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, fontWeight: 700, color }}>
      {sign}{delta}
    </span>
  );
}

// ─── TypeBadge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: 'source' | 'program' }) {
  const isSource = type === 'source';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : `${COLORS.ink}0a`,
        color: isSource ? COLORS.navy : `${COLORS.ink}88`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      {type}
    </span>
  );
}

// ─── ScoreBadge ───────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number }) {
  const bg =
    score >= 70
      ? COLORS.mintSoft
      : score >= 50
        ? COLORS.amberSoft
        : COLORS.coralSoft;
  const fg =
    score >= 70
      ? COLORS.mintInk
      : score >= 50
        ? COLORS.amberInk
        : COLORS.coralInk;
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '3px 12px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        letterSpacing: '0.02em',
        minWidth: 36,
        textAlign: 'center',
      }}
    >
      {score}
    </span>
  );
}

// ─── HealthHistoryTable ────────────────────────────────────────────────────────

function HealthHistoryTable({ history }: { history: InstanceHistory }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Instance header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, flexWrap: 'wrap' }}>
            <h2
              style={{
                fontFamily: TYPOGRAPHY.serif,
                fontSize: 18,
                color: COLORS.ink,
                margin: 0,
                letterSpacing: '-0.01em',
              }}
            >
              {history.name}
            </h2>
            <TypeBadge type={history.type} />
          </div>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}66`,
            }}
          >
            {history.id} · {history.points.length} data point{history.points.length === 1 ? '' : 's'}
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: `${COLORS.ink}66`,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Current score
          </span>
          <ScoreBadge score={history.currentScore} />
        </div>
      </header>

      {history.points.length === 0 ? (
        <div
          style={{
            padding: SPACING.lg,
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            color: `${COLORS.ink}88`,
          }}
        >
          No stage history recorded for this instance.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
            <thead>
              <tr>
                <th style={HEADER_CELL}>Date</th>
                <th style={HEADER_CELL}>Stage / Phase</th>
                <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Est. score</th>
                <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Delta</th>
                <th style={HEADER_CELL}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {history.points.map((pt, idx) => (
                <tr
                  key={`${pt.date}-${pt.stage}-${idx}`}
                  style={{
                    background: idx === history.points.length - 1 ? COLORS.skyPale : undefined,
                  }}
                >
                  <td style={MONO_CELL}>{formatDate(pt.date)}</td>
                  <td style={{ ...BODY_CELL, fontWeight: idx === history.points.length - 1 ? 600 : undefined }}>
                    {pt.stage}
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <ScoreBadge score={pt.score} />
                  </td>
                  <td style={{ ...BODY_CELL, textAlign: 'right' }}>
                    <DeltaCell delta={pt.delta} />
                  </td>
                  <td style={BODY_CELL}>
                    <TrendArrow t={pt.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function HealthHistoryPage() {
  const histories = buildAllHistories();

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
        eyebrow="Reasoning · Health"
        title="Health history"
        subtitle="Reconstructed health score timeline for every instance — derived from stage transition history. At each stage entry, estimates the score that would have resulted from the gates available at that point in the lifecycle."
      >
        <SummaryStrip histories={histories} />
        {histories.map((h) => {
          const table = <HealthHistoryTable history={h} />;
          return <div key={h.id}>{table}</div>;
        })}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
