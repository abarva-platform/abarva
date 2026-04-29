// /admin/reasoning/stage-transitions — Stage Transition Log
//
// Server component. Collects all stage transitions from all SOURCE_EVENT_INSTANCES,
// attaches instanceId and instanceName to each, sorts descending by enteredAt,
// and renders a timeline table with duration, gate ref, and current-stage highlighting.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Stage Transition Log · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

interface EnrichedTransition {
  instanceId: string;
  instanceName: string;
  stageId: string;
  enteredAt: string;
  exitedAt?: string;
  advancedBy: string;
  gateApprovalRef?: string;
  isCurrent: boolean;
  durationDays?: number;
}

// ─── Data ──────────────────────────────────────────────────────────────────────

function collectTransitions(): EnrichedTransition[] {
  const all: EnrichedTransition[] = [];

  for (const instance of SOURCE_EVENT_INSTANCES) {
    for (const t of instance.stageHistory) {
      const isCurrent = t.exitedAt === undefined;
      let durationDays: number | undefined;
      if (t.exitedAt) {
        const entered = new Date(t.enteredAt).getTime();
        const exited = new Date(t.exitedAt).getTime();
        const diff = exited - entered;
        if (!Number.isNaN(diff) && diff >= 0) {
          durationDays = Math.round(diff / 86_400_000);
        }
      }
      all.push({
        instanceId: instance.id,
        instanceName: instance.name,
        stageId: t.stageId,
        enteredAt: t.enteredAt,
        exitedAt: t.exitedAt,
        advancedBy: t.advancedBy,
        gateApprovalRef: t.gateApprovalRef,
        isCurrent,
        durationDays,
      });
    }
  }

  // Sort descending by enteredAt — most recent first.
  all.sort((a, b) => {
    const ta = new Date(a.enteredAt).getTime();
    const tb = new Date(b.enteredAt).getTime();
    return tb - ta;
  });

  return all;
}

// ─── Formatting ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const utc = d.toISOString(); // always has T and Z
  // If time is midnight (00:00:00) just show date
  const timePart = utc.slice(11, 19);
  if (timePart === '00:00:00') {
    return utc.slice(0, 10);
  }
  // Otherwise show YYYY-MM-DD HH:MM
  return utc.slice(0, 10) + ' ' + utc.slice(11, 16);
}

// ─── Table styles ─────────────────────────────────────────────────────────────

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

// ─── Components ────────────────────────────────────────────────────────────────

function SummaryStrip({
  totalCount,
  instanceCount,
}: {
  totalCount: number;
  instanceCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        color: `${COLORS.ink}99`,
      }}
    >
      <span style={{ fontWeight: 700, color: COLORS.ink }}>{totalCount}</span>
      <span>total transitions</span>
      <span style={{ color: `${COLORS.ink}33`, margin: `0 ${SPACING.xs}` }}>·</span>
      <span>across</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>{instanceCount}</span>
      <span>instance{instanceCount === 1 ? '' : 's'}</span>
    </div>
  );
}

function StageChip({ stageId }: { stageId: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.GRAY_BG,
        color: SHELL.INK,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {stageId}
    </span>
  );
}

function TransitionTable({ transitions }: { transitions: EnrichedTransition[] }) {
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
          Transition log
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {transitions.length} row{transitions.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Date</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Duration</th>
              <th style={HEADER_CELL}>Advanced by</th>
              <th style={HEADER_CELL}>Gate ref</th>
            </tr>
          </thead>
          <tbody>
            {transitions.map((t, idx) => {
              const rowStyle: React.CSSProperties = t.isCurrent
                ? { borderLeft: `3px solid ${COLORS.mintSoft}` }
                : {};
              const cellBase = t.isCurrent
                ? { background: `${COLORS.mintSoft}33` }
                : {};

              return (
                <tr key={`${t.instanceId}-${t.stageId}-${idx}`} style={rowStyle}>
                  {/* Date */}
                  <td style={{ ...MONO_CELL, ...cellBase }}>
                    {formatDate(t.enteredAt)}
                  </td>

                  {/* Instance — linked to detail page */}
                  <td style={{ ...BODY_CELL, ...cellBase }}>
                    <a
                      href={`/admin/reasoning/instances/${t.instanceId}`}
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.navy,
                        textDecoration: 'none',
                        fontWeight: 500,
                      }}
                    >
                      {t.instanceName}
                    </a>
                  </td>

                  {/* Stage chip */}
                  <td style={{ ...BODY_CELL, ...cellBase }}>
                    <StageChip stageId={t.stageId} />
                  </td>

                  {/* Duration */}
                  <td style={{ ...MONO_CELL, ...cellBase }}>
                    {t.isCurrent ? (
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.sans,
                          fontSize: 11,
                          fontWeight: 600,
                          color: COLORS.mintInk,
                          background: COLORS.mintSoft,
                          borderRadius: RADIUS.pill,
                          padding: '2px 8px',
                        }}
                      >
                        current
                      </span>
                    ) : t.durationDays !== undefined ? (
                      `${t.durationDays}d`
                    ) : (
                      '—'
                    )}
                  </td>

                  {/* Advanced by */}
                  <td style={{ ...MONO_CELL, ...cellBase }}>
                    {t.advancedBy}
                  </td>

                  {/* Gate ref */}
                  <td style={{ ...MONO_CELL, ...cellBase }}>
                    {t.gateApprovalRef ? (
                      <code
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 11,
                          color: COLORS.navy,
                          background: COLORS.skyPale,
                          borderRadius: RADIUS.sm,
                          padding: '1px 6px',
                        }}
                      >
                        {t.gateApprovalRef}
                      </code>
                    ) : (
                      <span style={{ color: `${COLORS.ink}44` }}>—</span>
                    )}
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

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function StageTransitionsPage() {
  const transitions = collectTransitions();
  const instanceCount = new Set(transitions.map((t) => t.instanceId)).size;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View instances"
          primaryActionHref="/admin/reasoning/health"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Stage transition log"
        subtitle="All stage advancement events across source event instances, newest first."
      >
        <SummaryStrip totalCount={transitions.length} instanceCount={instanceCount} />
        <TransitionTable transitions={transitions} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
