// /admin/reasoning/phase-matrix — Program × phase gate coverage matrix.
//
// Server component. Renders a 6-program × 7-phase grid where each cell shows
// the gate criteria completion % for that program at that phase.
// Color-coded: mint (≥80%), amber (40-79%), rust (<40%), gray (no criteria).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { evaluateStageGates } from '@/lib/reasoning/gate-evaluator';
import { buildProgramEvidenceMap } from '@/lib/programs/program-instance';
import { getWaiversForInstance } from '@/app/api/reasoning/gate-waiver/route';
import type { ProgramInstance } from '@/lib/programs/program-instance';
import type { LifecyclePatternSeed } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Phase Matrix · AbarVa Admin',
};

// ─── Phase definitions ────────────────────────────────────────────────────────

const PHASES: ReadonlyArray<{ id: string; abbr: string; label: string }> = [
  { id: 'P0-Originate', abbr: 'P0', label: 'Originate' },
  { id: 'P1-Discovery', abbr: 'P1', label: 'Discovery' },
  { id: 'P2-Synthesis', abbr: 'P2', label: 'Synthesis' },
  { id: 'P3-Design',    abbr: 'P3', label: 'Design' },
  { id: 'P4-Build',     abbr: 'P4', label: 'Build' },
  { id: 'P5-Activate',  abbr: 'P5', label: 'Activate' },
  { id: 'P6-Operate',   abbr: 'P6', label: 'Operate' },
];

// The 6 primary Apex Retail programs (not coverage fixtures).
const PRIMARY_PROGRAMS = APEX_RETAIL_PROGRAM_INSTANCES.slice(0, 6);

// ─── Cell computation ─────────────────────────────────────────────────────────

interface CellData {
  /** null = no criteria defined for this phase */
  coverage: number | null;
  metCount: number;
  total: number;
  isCurrent: boolean;
}

function computeCell(
  instance: ProgramInstance,
  pattern: LifecyclePatternSeed,
  phaseId: string,
  phaseIndex: number,
): CellData {
  const evidenceMap = buildProgramEvidenceMap(instance);

  // Augment evidence map with waivers from the in-memory store.
  // getWaiversForInstance returns { criterionId, reason, waivedAt }[].
  const waivers = getWaiversForInstance(instance.id);
  for (const waiver of waivers) {
    evidenceMap[`${waiver.criterionId}_waived`] = true;
  }

  const evaluations = evaluateStageGates(pattern, phaseId, evidenceMap);

  if (evaluations.length === 0) {
    return { coverage: null, metCount: 0, total: 0, isCurrent: instance.currentPhase === phaseIndex };
  }

  const metCount = evaluations.filter(
    (e) => e.status === 'met' || e.status === 'waived',
  ).length;
  const total = evaluations.length;
  const coverage = Math.round((metCount / total) * 100);

  return {
    coverage,
    metCount,
    total,
    isCurrent: instance.currentPhase === phaseIndex,
  };
}

// ─── Cell styling ─────────────────────────────────────────────────────────────

function cellBackground(coverage: number | null): string {
  if (coverage === null) return '#F3F2EF';
  if (coverage >= 80) return 'rgba(16,163,74,0.12)';
  if (coverage >= 40) return 'rgba(245,158,11,0.12)';
  return 'rgba(239,68,68,0.10)';
}

function cellBorder(coverage: number | null, isCurrent: boolean): string {
  if (!isCurrent) return `1px solid ${COLORS.ink}18`;
  // Current phase gets a 2px colored border.
  if (coverage === null) return `2px solid #9CA3AF`;
  if (coverage >= 80) return `2px solid rgba(16,163,74,0.7)`;
  if (coverage >= 40) return `2px solid rgba(245,158,11,0.7)`;
  return `2px solid rgba(239,68,68,0.6)`;
}

function cellTextColor(coverage: number | null): string {
  if (coverage === null) return `${COLORS.ink}66`;
  if (coverage >= 80) return COLORS.mintInk;
  if (coverage >= 40) return COLORS.amberInk;
  return COLORS.coralInk;
}

// ─── Matrix row data ──────────────────────────────────────────────────────────

interface MatrixRow {
  instance: ProgramInstance;
  cells: CellData[];
}

function buildMatrix(): MatrixRow[] {
  return PRIMARY_PROGRAMS.map((instance) => {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find(
      (p) => p.patternId === instance.patternId,
    );

    const cells = PHASES.map((phase, idx) => {
      if (!pattern) {
        return { coverage: null, metCount: 0, total: 0, isCurrent: instance.currentPhase === idx };
      }
      return computeCell(instance, pattern, phase.id, idx);
    });

    return { instance, cells };
  });
}

// ─── Summary computations ─────────────────────────────────────────────────────

interface MatrixSummary {
  portfolioAvg: number;
  mostAdvancedName: string;
  mostAdvancedPhase: number;
}

function computeSummary(rows: MatrixRow[]): MatrixSummary {
  // Portfolio average: mean coverage across all non-null cells.
  const allCoverages: number[] = rows.flatMap((row) =>
    row.cells.map((c) => c.coverage).filter((v): v is number => v !== null),
  );
  const portfolioAvg =
    allCoverages.length === 0
      ? 0
      : Math.round(allCoverages.reduce((sum, v) => sum + v, 0) / allCoverages.length);

  // Most advanced: highest currentPhase.
  let mostAdvancedName = rows[0]?.instance.name ?? '—';
  let mostAdvancedPhase = rows[0]?.instance.currentPhase ?? 0;
  for (const row of rows) {
    if (row.instance.currentPhase > mostAdvancedPhase) {
      mostAdvancedPhase = row.instance.currentPhase;
      mostAdvancedName = row.instance.name;
    }
  }

  return { portfolioAvg, mostAdvancedName, mostAdvancedPhase };
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const TH_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}18`,
  textAlign: 'center',
  whiteSpace: 'nowrap',
};

const ROW_HEADER_STYLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  fontWeight: 500,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  textAlign: 'left',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
};

// ─── Render helpers ───────────────────────────────────────────────────────────

function CoverageCell({ cell }: { cell: CellData }) {
  const bg = cellBackground(cell.coverage);
  const border = cellBorder(cell.coverage, cell.isCurrent);
  const textColor = cellTextColor(cell.coverage);

  return (
    <td
      style={{
        padding: 6,
        borderBottom: `1px solid ${COLORS.ink}10`,
        textAlign: 'center',
        verticalAlign: 'middle',
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: 52,
          height: 32,
          background: bg,
          border,
          borderRadius: RADIUS.md,
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: textColor,
          letterSpacing: '0.02em',
        }}
        title={
          cell.coverage !== null
            ? `${cell.metCount} of ${cell.total} gates met`
            : 'No gate criteria defined for this phase'
        }
      >
        {cell.coverage !== null ? `${cell.coverage}%` : '—'}
      </div>
    </td>
  );
}

function ProgramNameCell({ instance }: { instance: ProgramInstance }) {
  return (
    <td style={ROW_HEADER_STYLE}>
      <a
        href={`/programs/${instance.id}`}
        style={{
          color: COLORS.navy,
          textDecoration: 'none',
          fontWeight: 600,
          fontSize: 13,
          fontFamily: TYPOGRAPHY.sans,
        }}
      >
        {instance.name}
      </a>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 10,
          color: `${COLORS.ink}66`,
          marginTop: 2,
        }}
      >
        {instance.displayId}
      </div>
    </td>
  );
}

function MatrixTable({ rows }: { rows: MatrixRow[] }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          minWidth: 720,
        }}
      >
        <thead>
          <tr>
            <th
              style={{
                ...TH_STYLE,
                textAlign: 'left',
                minWidth: 220,
              }}
            >
              Program
            </th>
            {PHASES.map((phase) => (
              <th key={phase.id} style={TH_STYLE}>
                <div>{phase.abbr}</div>
                <div
                  style={{
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    fontWeight: 400,
                    letterSpacing: 0,
                    textTransform: 'none',
                    color: `${COLORS.ink}66`,
                    marginTop: 1,
                  }}
                >
                  {phase.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.instance.id}>
              <ProgramNameCell instance={row.instance} />
              {row.cells.map((cell, idx) => {
                const phaseId = PHASES[idx]?.id ?? String(idx);
                return <CoverageCell key={phaseId} cell={cell} />;
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LegendRow() {
  const items: Array<{ label: string; bg: string; textColor: string; border: string }> = [
    {
      label: '≥ 80%',
      bg: 'rgba(16,163,74,0.12)',
      textColor: COLORS.mintInk,
      border: `1px solid rgba(16,163,74,0.3)`,
    },
    {
      label: '40 – 79%',
      bg: 'rgba(245,158,11,0.12)',
      textColor: COLORS.amberInk,
      border: `1px solid rgba(245,158,11,0.3)`,
    },
    {
      label: '< 40%',
      bg: 'rgba(239,68,68,0.10)',
      textColor: COLORS.coralInk,
      border: `1px solid rgba(239,68,68,0.3)`,
    },
    {
      label: 'No criteria',
      bg: '#F3F2EF',
      textColor: `${COLORS.ink}66`,
      border: `1px solid ${COLORS.ink}18`,
    },
  ];

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: SPACING.md,
        padding: `${SPACING.sm} ${SPACING.lg}`,
        borderTop: `1px solid ${COLORS.ink}10`,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        Legend
      </span>
      {items.map((item) => (
        <span
          key={item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 28,
              height: 18,
              background: item.bg,
              border: item.border,
              borderRadius: RADIUS.sm,
            }}
          />
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}99`,
            }}
          >
            {item.label}
          </span>
        </span>
      ))}
      <span
        style={{
          marginLeft: 'auto',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          color: `${COLORS.ink}66`,
          fontStyle: 'italic',
        }}
      >
        Bold border = current phase
      </span>
    </div>
  );
}

function SummaryBar({ summary }: { summary: MatrixSummary }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: `${SPACING.md} ${SPACING.xl}`,
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Portfolio average
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
          }}
        >
          {summary.portfolioAvg}%
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          gate coverage across all phases
        </span>
      </div>
      <div
        style={{
          width: 1,
          height: 52,
          background: `${COLORS.ink}18`,
          alignSelf: 'center',
          flexShrink: 0,
        }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}99`,
            fontWeight: 600,
          }}
        >
          Most advanced
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            lineHeight: 1.2,
          }}
        >
          {summary.mostAdvancedName}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          P{summary.mostAdvancedPhase} · {PHASES[summary.mostAdvancedPhase]?.label ?? 'Unknown'}
        </span>
      </div>
    </div>
  );
}

function MatrixCard({ rows }: { rows: MatrixRow[] }) {
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
            Gate coverage matrix
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            % of gate criteria met or waived per program × phase
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {rows.length} programs · {PHASES.length} phases
        </span>
      </header>
      <MatrixTable rows={rows} />
      <LegendRow />
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PhaseMatrixPage() {
  const rows = buildMatrix();
  const summary = computeSummary(rows);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Programs"
          primaryActionHref="/programs"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Phase completion matrix"
        subtitle="Cross-program view of gate criteria coverage. Each cell shows what percentage of gate criteria are met or waived for a program at a given lifecycle phase."
      >
        <SummaryBar summary={summary} />
        <MatrixCard rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
