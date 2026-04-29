// /admin/reasoning/synthesis-audit — Confidence plausibility audit across all
// instances. Checks whether synthesis confidence scores are plausible given
// health, gate pass rate, and contradiction data. Flags suspicious outliers.
//
// Sections:
//   AuditSummaryStrip  — counts: Clean · Divergent · Over/Underconfident · Contradiction-blind
//   FlaggedTable       — instances with ≥1 flag, sorted by flag count / severity
//   CleanList          — compact mint chips for unflagged instances
//   InterpretationGuide — reference box explaining each flag type

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { computeSynthesisConfidence } from '@/lib/reasoning/synthesis-confidence';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Synthesis Audit | AbarVa Admin',
};

// ─── Flag types ───────────────────────────────────────────────────────────────

type AuditFlag =
  | 'Divergent'
  | 'Overconfident'
  | 'Underconfident'
  | 'Contradiction-blind';

// Severity order for sorting: higher index = higher severity
const FLAG_SEVERITY: Record<AuditFlag, number> = {
  Overconfident: 4,
  'Contradiction-blind': 3,
  Divergent: 2,
  Underconfident: 1,
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface AuditRow {
  instanceId: string;
  instanceName: string;
  instanceType: 'source' | 'program';
  healthScore: number;
  confidenceScore: number;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  flags: AuditFlag[];
}

// ─── Data assembly & plausibility checks ─────────────────────────────────────

function runPlausibilityChecks(
  confidenceScore: number,
  healthScore: number,
  gatesMet: number,
  gatesTotal: number,
  activeContradictions: number,
): AuditFlag[] {
  const flags: AuditFlag[] = [];
  const gateRatio = gatesTotal > 0 ? gatesMet / gatesTotal : 0;

  // 1. Confidence-health gap
  if (Math.abs(confidenceScore - healthScore) > 25) {
    flags.push('Divergent');
  }
  // 2. High confidence, low gates
  if (confidenceScore >= 70 && gateRatio < 0.5) {
    flags.push('Overconfident');
  }
  // 3. Low confidence, high gates
  if (confidenceScore < 40 && gateRatio > 0.75) {
    flags.push('Underconfident');
  }
  // 4. Contradiction overload
  if (activeContradictions >= 3 && confidenceScore >= 60) {
    flags.push('Contradiction-blind');
  }
  return flags;
}

function buildAuditRows(): AuditRow[] {
  const rows: AuditRow[] = [];

  // Source-event instances
  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const { score: confidenceScore } = computeSynthesisConfidence(ctx);
    const { score: healthScore } = computeInstanceHealth(ctx);
    const flags = runPlausibilityChecks(
      confidenceScore,
      healthScore,
      ctx.gatesSummary.met,
      ctx.gatesSummary.total,
      ctx.activeContradictions.length,
    );
    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'source',
      healthScore,
      confidenceScore,
      gatesMet: ctx.gatesSummary.met,
      gatesTotal: ctx.gatesSummary.total,
      activeContradictions: ctx.activeContradictions.length,
      flags,
    });
  }

  // Program instances
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const { score: confidenceScore } = computeSynthesisConfidence(ctx);
    const { score: healthScore } = computeInstanceHealth(ctx);
    const flags = runPlausibilityChecks(
      confidenceScore,
      healthScore,
      ctx.gatesSummary.met,
      ctx.gatesSummary.total,
      ctx.activeContradictions.length,
    );
    rows.push({
      instanceId: inst.id,
      instanceName: inst.name,
      instanceType: 'program',
      healthScore,
      confidenceScore,
      gatesMet: ctx.gatesSummary.met,
      gatesTotal: ctx.gatesSummary.total,
      activeContradictions: ctx.activeContradictions.length,
      flags,
    });
  }

  return rows;
}

function sortFlaggedRows(rows: AuditRow[]): AuditRow[] {
  return [...rows].sort((a, b) => {
    // Primary: most flags first
    if (b.flags.length !== a.flags.length) return b.flags.length - a.flags.length;
    // Secondary: highest max severity first
    const maxSev = (r: AuditRow) =>
      r.flags.reduce((max, f) => Math.max(max, FLAG_SEVERITY[f]), 0);
    return maxSev(b) - maxSev(a);
  });
}

// ─── Style constants ──────────────────────────────────────────────────────────

const TH: CSSProperties = {
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

const TD: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Flag badge palette ───────────────────────────────────────────────────────

function flagPalette(flag: AuditFlag): { bg: string; fg: string } {
  switch (flag) {
    case 'Overconfident':
      return { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT };
    case 'Contradiction-blind':
      return { bg: SHELL.PEACH_BG, fg: SHELL.PEACH_TEXT };
    case 'Divergent':
      return { bg: SHELL.PAPER_DEEP, fg: SHELL.AMBER_DOT };
    case 'Underconfident':
      return { bg: SHELL.BLUE_BG, fg: SHELL.INK_MID };
  }
}

// ─── FlagBadge ────────────────────────────────────────────────────────────────

function FlagBadge({ flag }: { flag: AuditFlag }) {
  const { bg, fg } = flagPalette(flag);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        marginRight: 4,
      }}
    >
      {flag}
    </span>
  );
}

// ─── ScorePair ────────────────────────────────────────────────────────────────

function ScorePill({ score, dimmed }: { score: number; dimmed?: boolean }) {
  const color = score >= 70
    ? SHELL.MINT_TEXT
    : score >= 40
      ? SHELL.AMBER_DOT
      : SHELL.RUST_TEXT;
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
        color: dimmed ? `${COLORS.ink}88` : color,
      }}
    >
      {score}
    </span>
  );
}

// ─── AuditSummaryStrip ────────────────────────────────────────────────────────

function AuditSummaryStrip({ rows }: { rows: AuditRow[] }) {
  const clean = rows.filter((r) => r.flags.length === 0).length;
  const divergent = rows.filter((r) => r.flags.includes('Divergent')).length;
  const overUnder = rows.filter(
    (r) => r.flags.includes('Overconfident') || r.flags.includes('Underconfident'),
  ).length;
  const contradictionBlind = rows.filter((r) =>
    r.flags.includes('Contradiction-blind'),
  ).length;

  const tiles: Array<{ label: string; count: number; color: string; bg: string }> = [
    { label: 'Clean', count: clean, color: SHELL.MINT_TEXT, bg: SHELL.MINT_BG },
    { label: 'Divergent', count: divergent, color: SHELL.AMBER_DOT, bg: SHELL.PAPER_DEEP },
    {
      label: 'Over / Under',
      count: overUnder,
      color: SHELL.RUST_TEXT,
      bg: SHELL.RUST_BG,
    },
    {
      label: 'Contradiction-blind',
      count: contradictionBlind,
      color: SHELL.PEACH_TEXT,
      bg: SHELL.PEACH_BG,
    },
  ];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: SPACING.md,
      }}
    >
      {tiles.map((tile) => (
        <div
          key={tile.label}
          style={{
            background: tile.bg,
            border: `1px solid ${tile.color}33`,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.md} ${SPACING.lg}`,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 28,
              fontWeight: 700,
              color: tile.color,
              lineHeight: 1,
            }}
          >
            {tile.count}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: COLORS.ink,
              fontWeight: 600,
            }}
          >
            {tile.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── FlaggedTable ─────────────────────────────────────────────────────────────

function FlaggedTable({ rows }: { rows: AuditRow[] }) {
  const flagged = sortFlaggedRows(rows.filter((r) => r.flags.length > 0));

  if (flagged.length === 0) {
    return (
      <section
        style={{
          background: SHELL.MINT_BG,
          border: `1px solid ${SHELL.MINT_TEXT}33`,
          borderRadius: RADIUS.lg,
          padding: `${SPACING.md} ${SPACING.lg}`,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: SHELL.MINT_TEXT,
          fontWeight: 600,
        }}
      >
        All instances passed plausibility checks — no flags raised.
      </section>
    );
  }

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
        <h2
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 20,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          Flagged instances
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {flagged.length} instance{flagged.length === 1 ? '' : 's'} — most flags first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 820 }}
        >
          <thead>
            <tr>
              <th style={TH}>Instance</th>
              <th style={{ ...TH, width: 70 }}>Health</th>
              <th style={{ ...TH, width: 80 }}>Confidence</th>
              <th style={{ ...TH, width: 90 }}>Gates Met %</th>
              <th style={{ ...TH, width: 90 }}>Contradictions</th>
              <th style={TH}>Flag(s)</th>
            </tr>
          </thead>
          <tbody>
            {flagged.map((row) => {
              const gatesPct =
                row.gatesTotal > 0
                  ? Math.round((row.gatesMet / row.gatesTotal) * 100)
                  : 0;
              return (
                <tr key={row.instanceId}>
                  <td style={TD}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 13,
                        fontWeight: 600,
                        color: COLORS.ink,
                      }}
                    >
                      {row.instanceName}
                    </span>
                    <div
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                        marginTop: 2,
                      }}
                    >
                      {row.instanceId}
                    </div>
                  </td>
                  <td style={TD_MONO}>
                    <ScorePill score={row.healthScore} />
                  </td>
                  <td style={TD_MONO}>
                    <ScorePill score={row.confidenceScore} />
                  </td>
                  <td style={TD_MONO}>
                    {gatesPct}%
                    <span
                      style={{
                        display: 'block',
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}55`,
                      }}
                    >
                      {row.gatesMet}/{row.gatesTotal}
                    </span>
                  </td>
                  <td style={TD_MONO}>{row.activeContradictions}</td>
                  <td style={{ ...TD, whiteSpace: 'nowrap' }}>
                    {row.flags.map((flag) => (
                      <div key={flag} style={{ display: 'inline-block' }}>
                        <FlagBadge flag={flag} />
                      </div>
                    ))}
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

// ─── CleanList ────────────────────────────────────────────────────────────────

function CleanList({ rows }: { rows: AuditRow[] }) {
  const clean = rows.filter((r) => r.flags.length === 0);
  if (clean.length === 0) return null;

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
          Clean instances
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 4,
          }}
        >
          {clean.length} instance{clean.length === 1 ? '' : 's'} passed all plausibility checks.
        </div>
      </header>
      <div
        style={{
          padding: SPACING.md,
          display: 'flex',
          flexWrap: 'wrap',
          gap: SPACING.xs,
        }}
      >
        {clean.map((row) => (
          <div key={row.instanceId}>
            <span
              style={{
                display: 'inline-block',
                background: SHELL.MINT_BG,
                color: SHELL.MINT_TEXT,
                border: `1px solid ${SHELL.MINT_TEXT}33`,
                borderRadius: RADIUS.pill,
                padding: '4px 12px',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              {row.instanceName}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── InterpretationGuide ──────────────────────────────────────────────────────

function InterpretationGuide() {
  const entries: Array<{ flag: AuditFlag; explanation: string }> = [
    {
      flag: 'Divergent',
      explanation:
        'Confidence and health are computed differently — large gaps may indicate evidence quality issues.',
    },
    {
      flag: 'Overconfident',
      explanation:
        'High synthesis confidence despite low gate pass rate — review evidence payload richness.',
    },
    {
      flag: 'Underconfident',
      explanation:
        'Low confidence despite strong gate performance — may indicate contradictions suppressing score.',
    },
    {
      flag: 'Contradiction-blind',
      explanation:
        'Many active contradictions not reflected in confidence — check contradiction detection coverage.',
    },
  ];

  return (
    <section
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderLeft: `4px solid ${COLORS.ink}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      <h3
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 16,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        Audit interpretation guide
      </h3>
      {entries.map((entry) => {
        const { bg, fg } = flagPalette(entry.flag);
        return (
          <div
            key={entry.flag}
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: SPACING.sm,
            }}
          >
            <span
              style={{
                display: 'inline-block',
                background: bg,
                color: fg,
                borderRadius: RADIUS.pill,
                padding: '1px 8px',
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {entry.flag}
            </span>
            <span
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}cc`,
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}
            >
              {entry.explanation}
            </span>
          </div>
        );
      })}
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SynthesisAuditPage() {
  const rows = buildAuditRows();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Confidence breakdown"
          primaryActionHref="/admin/reasoning/confidence-breakdown"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Synthesis"
        title="Synthesis Audit"
        subtitle="Confidence score plausibility checks — identify inflated or deflated synthesis outputs"
      >
        <AuditSummaryStrip rows={rows} />
        <FlaggedTable rows={rows} />
        <CleanList rows={rows} />
        <InterpretationGuide />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
