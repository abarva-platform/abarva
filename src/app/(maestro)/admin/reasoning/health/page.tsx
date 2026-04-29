// /admin/reasoning/health — All-instances health board.
//
// Server component. Iterates every typed fixture instance (source events +
// programs), builds a SynthesisContext for each, runs computeInstanceHealth,
// then renders a summary bar and a sorted grid of instance cards.
//
// Sort order: critical (red) first, then degraded (amber), then healthy (green).
// No client JS needed — all signals are deterministic from fixture data.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { InstanceHealthBadge } from '@/components/_shared/InstanceHealthBadge';
import {
  computeInstanceHealth,
  type InstanceHealth,
  type InstanceHealthGrade,
} from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { SynthesisContext } from '@/lib/reasoning/types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Instance Health Board · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

type InstanceKind = 'SOURCE' | 'PROGRAM';

interface InstanceHealthRow {
  id: string;
  name: string;
  kind: InstanceKind;
  currentStage: string;
  health: InstanceHealth;
  contradictionCount: number;
  gatesMet: number;
  gatesTotal: number;
  evidenceCount: number;
}

// ─── Grade ordering helpers ───────────────────────────────────────────────────

const GRADE_ORDER: Record<InstanceHealthGrade, number> = {
  red: 0,
  amber: 1,
  green: 2,
};

function sortByHealth(rows: InstanceHealthRow[]): InstanceHealthRow[] {
  return [...rows].sort(
    (a, b) =>
      GRADE_ORDER[a.health.grade] - GRADE_ORDER[b.health.grade] ||
      a.health.score - b.health.score,
  );
}

// ─── Context & row builders ───────────────────────────────────────────────────

function buildRows(): InstanceHealthRow[] {
  const rows: InstanceHealthRow[] = [];

  // Source event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    let context: SynthesisContext;
    if (pattern !== undefined) {
      context = buildSourceSynthesisContext(inst, pattern);
    } else {
      // Fallback: empty context shape — should not occur for typed fixtures
      continue;
    }
    const health = computeInstanceHealth(context);
    rows.push({
      id: inst.id,
      name: inst.name,
      kind: 'SOURCE',
      currentStage: context.currentStage,
      health,
      contradictionCount: context.activeContradictions.length,
      gatesMet: context.gatesSummary.met,
      gatesTotal: context.gatesSummary.total,
      evidenceCount: inst.evidence.length,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const context = buildProgramSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(context);
    rows.push({
      id: inst.id,
      name: inst.name,
      kind: 'PROGRAM',
      currentStage: context.currentStage,
      health,
      contradictionCount: context.activeContradictions.length,
      gatesMet: context.gatesSummary.met,
      gatesTotal: context.gatesSummary.total,
      evidenceCount: inst.evidence.length,
    });
  }

  return sortByHealth(rows);
}

// ─── Grade palette helpers ────────────────────────────────────────────────────

interface GradePalette {
  dot: string;
  text: string;
  bg: string;
  border: string;
  label: string;
}

function gradePalette(grade: InstanceHealthGrade): GradePalette {
  if (grade === 'green') {
    return {
      dot: COLORS.mintInk,
      text: COLORS.mintInk,
      bg: COLORS.mintSoft,
      border: `${COLORS.mintInk}40`,
      label: 'Healthy',
    };
  }
  if (grade === 'amber') {
    return {
      dot: COLORS.amberInk,
      text: COLORS.amberInk,
      bg: COLORS.amberSoft,
      border: `${COLORS.amberInk}40`,
      label: 'Degraded',
    };
  }
  return {
    dot: COLORS.coralInk,
    text: COLORS.coralInk,
    bg: COLORS.coralSoft,
    border: `${COLORS.coralInk}40`,
    label: 'Critical',
  };
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryBar({
  healthy,
  degraded,
  critical,
}: {
  healthy: number;
  degraded: number;
  critical: number;
}) {
  const total = healthy + degraded + critical;
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
          Health snapshot
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
          {total} instance{total !== 1 ? 's' : ''}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.lg, flexWrap: 'wrap' }}>
        <SummaryBucket count={healthy} grade="green" label="healthy" />
        <SummaryBucket count={degraded} grade="amber" label="degraded" />
        <SummaryBucket count={critical} grade="red" label="critical" />
      </div>
    </div>
  );
}

function SummaryBucket({
  count,
  grade,
  label,
}: {
  count: number;
  grade: InstanceHealthGrade;
  label: string;
}) {
  const palette = gradePalette(grade);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        aria-hidden
        style={{
          width: 10,
          height: 10,
          borderRadius: '50%',
          background: palette.dot,
          flexShrink: 0,
          display: 'inline-block',
        }}
      />
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.ink,
          fontWeight: 600,
        }}
      >
        {count}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function KindBadge({ kind }: { kind: InstanceKind }) {
  const isSource = kind === 'SOURCE';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isSource ? COLORS.skyPale : `${COLORS.ink}0c`,
        color: isSource ? COLORS.navy : `${COLORS.ink}aa`,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}
    >
      {kind}
    </span>
  );
}

function InstanceCard({ row }: { row: InstanceHealthRow }) {
  const palette = gradePalette(row.health.grade);
  const hasContradictions = row.contradictionCount > 0;
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderLeft: `3px solid ${palette.dot}`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.sm,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 15,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
              lineHeight: 1.2,
            }}
          >
            {row.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {row.id}
            </span>
            <KindBadge kind={row.kind} />
          </div>
        </div>
        <InstanceHealthBadge health={row.health} />
      </div>

      {/* Stage */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}99`,
        }}
      >
        Stage:{' '}
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: COLORS.ink,
          }}
        >
          {row.currentStage}
        </span>
      </div>

      {/* Metric row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.md,
          flexWrap: 'wrap',
          paddingTop: 4,
          borderTop: `1px solid ${COLORS.ink}0c`,
        }}
      >
        {/* Contradictions */}
        <MetricChip
          label="Contradictions"
          value={String(row.contradictionCount)}
          warn={hasContradictions}
        />
        {/* Gate pass rate */}
        <MetricChip
          label="Gate criteria"
          value={`${row.gatesMet}/${row.gatesTotal} met`}
          warn={row.gatesMet < row.gatesTotal}
        />
        {/* Evidence */}
        <MetricChip label="Evidence" value={String(row.evidenceCount)} />
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  warn,
}: {
  label: string;
  value: string;
  warn?: boolean;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        {label}:
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          fontWeight: 700,
          color: warn === true ? COLORS.amberInk : COLORS.ink,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function HealthGrid({ rows }: { rows: InstanceHealthRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.mintInk}66`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: COLORS.mintInk,
          fontWeight: 600,
        }}
      >
        All instances healthy ✓
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {rows.map((row) => (
        <InstanceCard key={row.id} row={row} />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InstanceHealthBoardPage() {
  const rows = buildRows();
  const healthy = rows.filter((r) => r.health.grade === 'green').length;
  const degraded = rows.filter((r) => r.health.grade === 'amber').length;
  const critical = rows.filter((r) => r.health.grade === 'red').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to Reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Instance Health Board"
        subtitle="Deterministic Layer-3 health verdict for every typed fixture instance — source events and programs. Score starts at 100; deductions for pending hard gates, blocked criteria, high-severity contradictions, failure modes, and cascade impacts. Critical first."
      >
        <SummaryBar healthy={healthy} degraded={degraded} critical={critical} />
        <HealthGrid rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
