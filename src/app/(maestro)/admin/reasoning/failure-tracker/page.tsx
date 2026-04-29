// /admin/reasoning/failure-tracker — Active vs. latent failure mode tracking.
//
// Pure server component. For every failure mode across all lifecycle patterns,
// computes how many instances are "at risk" or "triggered" based on health
// score and current stage membership.
//
// Heuristic:
//   "triggered" → instance health score < 30 AND instance is in one of the
//                 failure mode's affected stages
//   "at risk"   → instance health score 30–49 AND same stage check
//   "latent"    → failure mode exists but no qualifying instances

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { computeInstanceHealth } from '@/lib/reasoning/instance-health';
import { buildSourceSynthesisContext } from '@/lib/reasoning/synthesis-context-builder';
import { buildProgramSynthesisContext } from '@/lib/reasoning/program-synthesis-context-builder';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { PROGRAM_LIFECYCLE_PATTERNS } from '@/lib/intelligence/program-lifecycle-patterns';
import type { FailureMode } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Failure tracker · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type FailureModeStatus = 'triggered' | 'at-risk' | 'latent';

interface InstanceRef {
  id: string;
  label: string;
  score: number;
  status: 'triggered' | 'at-risk';
}

interface FailureModeRow {
  failureMode: FailureMode;
  patternTitle: string;
  patternId: string;
  triggered: InstanceRef[];
  atRisk: InstanceRef[];
  status: FailureModeStatus;
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

/**
 * Build an enriched list of { instanceId, label, score, currentStage } for all
 * fixture instances.  We re-derive scores here so we can use them for the
 * heuristic; health-board rows don't expose numeric scores, only grade labels.
 */
interface EnrichedInstance {
  id: string;
  label: string;
  score: number;
  currentStage: string;
}

function buildEnrichedInstances(): EnrichedInstance[] {
  const out: EnrichedInstance[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const pattern = SOURCE_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    if (!pattern) continue;
    const ctx = buildSourceSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(ctx);
    out.push({
      id: inst.id,
      label: inst.name,
      score: health.score,
      currentStage: ctx.currentStage ?? '',
    });
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    const pattern = PROGRAM_LIFECYCLE_PATTERNS.find((p) => p.patternId === inst.patternId);
    const ctx = buildProgramSynthesisContext(inst, pattern);
    const health = computeInstanceHealth(ctx);
    out.push({
      id: inst.id,
      label: inst.name,
      score: health.score,
      currentStage: ctx.currentStage ?? '',
    });
  }

  return out;
}

function buildFailureModeRows(): FailureModeRow[] {
  const patterns = getAllLifecyclePatterns();
  const instances = buildEnrichedInstances();

  const rows: FailureModeRow[] = [];

  for (const pattern of patterns) {
    for (const fm of pattern.failureModes ?? []) {
      const affectedStages = fm.stages ?? [];

      const triggered: InstanceRef[] = [];
      const atRisk: InstanceRef[] = [];

      for (const inst of instances) {
        const inAffectedStage =
          affectedStages.length === 0 ||
          affectedStages.some((s) => inst.currentStage.includes(s));

        if (!inAffectedStage) continue;

        if (inst.score < 30) {
          triggered.push({ id: inst.id, label: inst.label, score: inst.score, status: 'triggered' });
        } else if (inst.score < 50) {
          atRisk.push({ id: inst.id, label: inst.label, score: inst.score, status: 'at-risk' });
        }
      }

      const status: FailureModeStatus =
        triggered.length > 0 ? 'triggered' : atRisk.length > 0 ? 'at-risk' : 'latent';

      rows.push({
        failureMode: fm,
        patternTitle: pattern.title,
        patternId: pattern.patternId,
        triggered,
        atRisk,
        status,
      });
    }
  }

  // Sort: triggered count + at-risk count descending, then latent at end
  rows.sort((a, b) => {
    const scoreA = a.triggered.length * 2 + a.atRisk.length;
    const scoreB = b.triggered.length * 2 + b.atRisk.length;
    if (scoreB !== scoreA) return scoreB - scoreA;
    return a.failureMode.id.localeCompare(b.failureMode.id);
  });

  return rows;
}

// ─── Shared cell styles ───────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: `${COLORS.ink}99`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}18`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0c`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  totalModes,
  triggeredCount,
  atRiskCount,
  latentCount,
}: {
  totalModes: number;
  triggeredCount: number;
  atRiskCount: number;
  latentCount: number;
}) {
  const items: { label: string; value: number; bg: string; fg: string }[] = [
    {
      label: 'failure modes',
      value: totalModes,
      bg: COLORS.skyPale,
      fg: COLORS.navy,
    },
    {
      label: 'triggered',
      value: triggeredCount,
      bg: SHELL.RUST_BG,
      fg: SHELL.RUST_TEXT,
    },
    {
      label: 'at risk',
      value: atRiskCount,
      bg: COLORS.amberSoft,
      fg: COLORS.amberInk,
    },
    {
      label: 'latent',
      value: latentCount,
      bg: SHELL.MINT_BG,
      fg: SHELL.MINT_TEXT,
    },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap',
        gap: SPACING.md,
        alignItems: 'center',
      }}
    >
      {items.map((item) => (
        <div
          key={item.label}
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 6,
            background: item.bg,
            borderRadius: RADIUS.pill,
            padding: '4px 14px',
          }}
        >
          <span
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 22,
              fontWeight: 700,
              color: item.fg,
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
              fontWeight: 600,
              color: item.fg,
              opacity: 0.85,
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function StatusPill({ status }: { status: FailureModeStatus }) {
  const palette =
    status === 'triggered'
      ? { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT }
      : status === 'at-risk'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT };

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
        letterSpacing: '0.06em',
        whiteSpace: 'nowrap',
      }}
    >
      {status}
    </span>
  );
}

function CountBadge({
  count,
  variant,
}: {
  count: number;
  variant: 'triggered' | 'at-risk' | 'latent';
}) {
  if (count === 0) {
    return (
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}44`,
        }}
      >
        —
      </span>
    );
  }
  const palette =
    variant === 'triggered'
      ? { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT }
      : variant === 'at-risk'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT };

  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '1px 8px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {count}
    </span>
  );
}

function StageChips({ stages }: { stages: string[] }) {
  if (stages.length === 0) {
    return (
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>
        all
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {stages.map((s) => (
        <span
          key={s}
          style={{
            display: 'inline-block',
            background: COLORS.skyPale,
            color: COLORS.navy,
            borderRadius: RADIUS.sm,
            padding: '1px 6px',
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            fontWeight: 600,
          }}
        >
          {s}
        </span>
      ))}
    </div>
  );
}

function FailureModeTable({ rows }: { rows: FailureModeRow[] }) {
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
            Failure mode status
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Triggered when health &lt; 30 · At risk when health 30–49 · Stage-membership check applied
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} mode{rows.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Pattern</th>
              <th style={HEADER_CELL}>Failure mode</th>
              <th style={{ ...HEADER_CELL, maxWidth: 220 }}>Description</th>
              <th style={HEADER_CELL}>Affected stages</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Triggered</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>At risk</th>
              <th style={{ ...HEADER_CELL, textAlign: 'center' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.patternId}__${row.failureMode.id}`}>
                <td style={MONO_CELL}>
                  <span title={row.patternTitle} style={{ cursor: 'help' }}>
                    {row.patternId}
                  </span>
                </td>
                <td style={BODY_CELL}>
                  <div style={{ fontWeight: 600, marginBottom: 2 }}>{row.failureMode.label}</div>
                  <div
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      color: `${COLORS.ink}66`,
                    }}
                  >
                    {row.failureMode.id}
                  </div>
                </td>
                <td
                  style={{
                    ...BODY_CELL,
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  <span title={row.failureMode.description}>
                    {row.failureMode.description.length > 90
                      ? row.failureMode.description.slice(0, 87) + '…'
                      : row.failureMode.description}
                  </span>
                </td>
                <td style={BODY_CELL}>
                  <StageChips stages={row.failureMode.stages ?? []} />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CountBadge count={row.triggered.length} variant="triggered" />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <CountBadge count={row.atRisk.length} variant="at-risk" />
                </td>
                <td style={{ ...BODY_CELL, textAlign: 'center' }}>
                  <StatusPill status={row.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function TriggeredCard({ rows }: { rows: FailureModeRow[] }) {
  const triggeredRows = rows.filter((r) => r.triggered.length > 0);
  if (triggeredRows.length === 0) {
    return (
      <section
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}aa`,
          lineHeight: 1.5,
        }}
      >
        No failure modes are currently triggered — all instances are above the critical threshold.
      </section>
    );
  }

  return (
    <section
      style={{
        background: COLORS.white,
        border: `2px solid ${SHELL.RUST_BG}`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${SHELL.RUST_BG}`,
          background: `${SHELL.RUST_BG}55`,
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
            Triggered failure modes
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${SHELL.RUST_TEXT}cc`,
              marginTop: 2,
            }}
          >
            Instances with health score &lt; 30 in an affected stage — immediate attention required
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: SHELL.RUST_TEXT,
            fontWeight: 700,
          }}
        >
          {triggeredRows.length} mode{triggeredRows.length !== 1 ? 's' : ''}
        </span>
      </header>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
        }}
      >
        {triggeredRows.map((row, idx) => (
          <div
            key={`triggered-${row.patternId}__${row.failureMode.id}`}
            style={{
              padding: `${SPACING.md} ${SPACING.lg}`,
              borderBottom:
                idx < triggeredRows.length - 1
                  ? `1px solid ${SHELL.RUST_BG}`
                  : undefined,
            }}
          >
            {/* Header row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: SPACING.sm,
                flexWrap: 'wrap',
                marginBottom: SPACING.sm,
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  color: SHELL.RUST_TEXT,
                  opacity: 0.7,
                  letterSpacing: '0.04em',
                }}
              >
                {row.patternId}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 14,
                  fontWeight: 700,
                  color: SHELL.RUST_TEXT,
                }}
              >
                {row.failureMode.label}
              </span>
            </div>
            {/* Description */}
            <p
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                color: `${COLORS.ink}99`,
                margin: `0 0 ${SPACING.sm}`,
                lineHeight: 1.5,
              }}
            >
              {row.failureMode.description}
            </p>
            {/* Triggered instances */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  color: `${COLORS.ink}88`,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Instances:
              </span>
              {row.triggered.map((inst) => (
                <span
                  key={`inst-${inst.id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: SHELL.RUST_BG,
                    color: SHELL.RUST_TEXT,
                    borderRadius: RADIUS.pill,
                    padding: '2px 10px',
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  {inst.label}
                  <span
                    style={{
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 10,
                      opacity: 0.75,
                    }}
                  >
                    {inst.score}
                  </span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FailureTrackerPage() {
  const rows = buildFailureModeRows();

  const triggeredCount = rows.filter((r) => r.status === 'triggered').length;
  const atRiskCount = rows.filter((r) => r.status === 'at-risk').length;
  const latentCount = rows.filter((r) => r.status === 'latent').length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open failure modes"
          primaryActionHref="/admin/reasoning/failure-modes"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Failure modes"
        title="Failure tracker"
        subtitle="Active vs. latent failure mode tracking — which failure modes are triggered or at risk across all fixture instances, based on current health scores and stage membership."
      >
        <SummaryStrip
          totalModes={rows.length}
          triggeredCount={triggeredCount}
          atRiskCount={atRiskCount}
          latentCount={latentCount}
        />
        <TriggeredCard rows={rows} />
        <FailureModeTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
