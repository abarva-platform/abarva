// /admin/reasoning/source-timeline — Visual lifecycle timeline for all source events.
//
// Server component. For each source event instance, determines the current stage
// (override if present, otherwise instance.currentStage), looks up the health
// label, and renders a horizontal grid with stage columns and instance rows.
// Color-coded dots mark which stage each instance is currently at.
//
// Stage columns are derived from the instance's bound lifecycle pattern, so each
// row may have a different column set. All known stage IDs across all patterns
// are unioned to build a complete column header set, ordered by pattern-natural
// order (earlier patterns first, earlier stages first).

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { SOURCE_LIFECYCLE_PATTERNS } from '@/lib/intelligence/source-lifecycle-patterns';
import { buildHealthBoardRows, type InstanceHealthLabel } from '@/lib/reasoning/health-board';
import { getStageOverride } from '@/lib/source/stage-overrides';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Source event timeline | AbarVa Admin',
};

// ─── Health colour mapping ────────────────────────────────────────────────────

function healthColor(label: InstanceHealthLabel): string {
  switch (label) {
    case 'healthy':
      return COLORS.mintSoft;
    case 'warning':
      return COLORS.amberSoft;
    case 'critical':
      return COLORS.coralSoft;
    default:
      return `${COLORS.ink}14`;
  }
}

function healthBorderColor(label: InstanceHealthLabel): string {
  switch (label) {
    case 'healthy':
      return COLORS.mintInk;
    case 'warning':
      return COLORS.amberInk;
    case 'critical':
      return COLORS.coralInk;
    default:
      return `${COLORS.ink}44`;
  }
}

function healthTextColor(label: InstanceHealthLabel): string {
  switch (label) {
    case 'healthy':
      return COLORS.mintInk;
    case 'warning':
      return COLORS.amberInk;
    case 'critical':
      return COLORS.coralInk;
    default:
      return `${COLORS.ink}88`;
  }
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface StageColumn {
  id: string;
  label: string;
}

interface InstanceRow {
  id: string;
  name: string;
  truncatedName: string;
  patternId: string;
  patternLabel: string;
  currentStageId: string;
  healthLabel: InstanceHealthLabel;
  /** Stage IDs that belong to this instance's pattern */
  patternStageIds: Set<string>;
}

// ─── Data builder ─────────────────────────────────────────────────────────────

function buildTimelineData(): {
  columns: StageColumn[];
  rows: InstanceRow[];
  totalCount: number;
  healthCount: number;
  firstStageName: string;
  lastStageName: string;
  firstStageCount: number;
  lastStageCount: number;
} {
  // Build health lookup
  const healthRows = buildHealthBoardRows();
  const healthByInstanceId = new Map<string, InstanceHealthLabel>();
  for (const row of healthRows) {
    if (row.type === 'source') {
      healthByInstanceId.set(row.id, row.healthLabel);
    }
  }

  // Walk all patterns in order — build a unified ordered stage list.
  // We use an ordered Map to dedup by stage ID while preserving insertion order.
  const stageMap = new Map<string, StageColumn>();
  for (const pattern of SOURCE_LIFECYCLE_PATTERNS) {
    for (const stage of pattern.stages) {
      if (!stageMap.has(stage.id)) {
        stageMap.set(stage.id, { id: stage.id, label: stage.label });
      }
    }
  }
  const columns = Array.from(stageMap.values());

  // Build pattern → stage ID set lookup
  const patternStageSetById = new Map<string, Set<string>>();
  const patternLabelById = new Map<string, string>();
  for (const pattern of SOURCE_LIFECYCLE_PATTERNS) {
    patternStageSetById.set(
      pattern.patternId,
      new Set(pattern.stages.map((s) => s.id)),
    );
    patternLabelById.set(pattern.patternId, pattern.title ?? pattern.patternId);
  }

  // Build rows from SOURCE_EVENT_INSTANCES
  const rows: InstanceRow[] = SOURCE_EVENT_INSTANCES.map((inst) => {
    const override = getStageOverride(inst.id);
    const currentStageId: string = override ?? inst.currentStage;
    const patternStageIds = patternStageSetById.get(inst.patternId) ?? new Set<string>();
    const patternLabel = patternLabelById.get(inst.patternId) ?? inst.patternId;
    const healthLabel = healthByInstanceId.get(inst.id) ?? 'unknown';

    const truncatedName =
      inst.name.length > 28 ? inst.name.slice(0, 27) + '…' : inst.name;

    return {
      id: inst.id,
      name: inst.name,
      truncatedName,
      patternId: inst.patternId,
      patternLabel,
      currentStageId,
      healthLabel,
      patternStageIds,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  // Summary stats
  const totalCount = rows.length;
  const healthCount = rows.filter((r) => r.healthLabel === 'healthy').length;
  const firstStageName = columns[0]?.label ?? '—';
  const lastStageName = columns[columns.length - 1]?.label ?? '—';
  const firstStageId = columns[0]?.id;
  const lastStageId = columns[columns.length - 1]?.id;
  const firstStageCount = rows.filter((r) => r.currentStageId === firstStageId).length;
  const lastStageCount = rows.filter((r) => r.currentStageId === lastStageId).length;

  return {
    columns,
    rows,
    totalCount,
    healthCount,
    firstStageName,
    lastStageName,
    firstStageCount,
    lastStageCount,
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryStrip({
  totalCount,
  healthCount,
  firstStageName,
  firstStageCount,
  lastStageName,
  lastStageCount,
}: {
  totalCount: number;
  healthCount: number;
  firstStageName: string;
  firstStageCount: number;
  lastStageName: string;
  lastStageCount: number;
}) {
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
      <Stat value={String(totalCount)} label="source events" />
      <Divider />
      <Stat value={String(firstStageCount)} label={`at earliest stage (${firstStageName})`} />
      <Divider />
      <Stat value={String(lastStageCount)} label={`at latest stage (${lastStageName})`} />
      <Divider />
      <Stat value={String(healthCount)} label="healthy" color={COLORS.mintInk} />
    </div>
  );
}

function Stat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: color ?? COLORS.ink,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          marginRight: 4,
          color: color ?? COLORS.ink,
        }}
      >
        {value}
      </span>
      {label}
    </span>
  );
}

function Divider() {
  return (
    <span
      aria-hidden="true"
      style={{
        color: `${COLORS.ink}33`,
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      ·
    </span>
  );
}

function HealthDot({
  healthLabel,
  visible,
}: {
  healthLabel: InstanceHealthLabel;
  visible: boolean;
}) {
  if (!visible) return null;
  return (
    <div
      title={healthLabel}
      style={{
        width: 12,
        height: 12,
        borderRadius: '50%',
        background: healthBorderColor(healthLabel),
        flexShrink: 0,
      }}
    />
  );
}

function StagePill({
  healthLabel,
}: {
  healthLabel: InstanceHealthLabel;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: healthColor(healthLabel),
        border: `2px solid ${healthBorderColor(healthLabel)}`,
        flexShrink: 0,
      }}
      title={healthLabel}
    />
  );
}

function TimelineGrid({
  columns,
  rows,
}: {
  columns: StageColumn[];
  rows: InstanceRow[];
}) {
  const INSTANCE_COL_WIDTH = 200;
  const STAGE_COL_WIDTH = 80;
  const ROW_HEIGHT = 36;
  const HEADER_HEIGHT = 56;

  return (
    <div
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
            Lifecycle position
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Each filled circle marks the current stage for that instance
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {columns.length} stages · {rows.length} instances
        </span>
      </header>

      {/* Scrollable grid */}
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            minWidth: INSTANCE_COL_WIDTH + columns.length * STAGE_COL_WIDTH,
          }}
        >
          <thead>
            <tr style={{ height: HEADER_HEIGHT }}>
              {/* Instance column header */}
              <th
                style={{
                  position: 'sticky',
                  left: 0,
                  background: COLORS.white,
                  zIndex: 2,
                  width: INSTANCE_COL_WIDTH,
                  minWidth: INSTANCE_COL_WIDTH,
                  textAlign: 'left',
                  padding: `${SPACING.sm} ${SPACING.md}`,
                  borderBottom: `1px solid ${COLORS.ink}22`,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 11,
                  fontWeight: 600,
                  color: `${COLORS.ink}88`,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}
              >
                Source event
              </th>
              {/* Stage column headers */}
              {columns.map((col) => (
                <th
                  key={col.id}
                  style={{
                    width: STAGE_COL_WIDTH,
                    minWidth: STAGE_COL_WIDTH,
                    textAlign: 'center',
                    padding: `${SPACING.sm} ${SPACING.xs}`,
                    borderBottom: `1px solid ${COLORS.ink}22`,
                    fontFamily: TYPOGRAPHY.sans,
                    fontSize: 10,
                    fontWeight: 600,
                    color: `${COLORS.ink}99`,
                    letterSpacing: '0.04em',
                    verticalAlign: 'bottom',
                  }}
                >
                  <div
                    style={{
                      writingMode: 'vertical-rl',
                      transform: 'rotate(180deg)',
                      whiteSpace: 'nowrap',
                      maxHeight: 48,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {col.label}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.id}
                style={{
                  height: ROW_HEIGHT,
                  background: rowIndex % 2 === 0 ? COLORS.white : COLORS.cream,
                }}
              >
                {/* Instance name cell */}
                <td
                  style={{
                    position: 'sticky',
                    left: 0,
                    background: rowIndex % 2 === 0 ? COLORS.white : COLORS.cream,
                    zIndex: 1,
                    padding: `${SPACING.xs} ${SPACING.md}`,
                    borderBottom: `1px solid ${COLORS.ink}08`,
                    verticalAlign: 'middle',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: SPACING.xs,
                    }}
                  >
                    <HealthDot healthLabel={row.healthLabel} visible />
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: COLORS.ink,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: INSTANCE_COL_WIDTH - 40,
                      }}
                      title={row.name}
                    >
                      {row.truncatedName}
                    </span>
                  </div>
                </td>
                {/* Stage cells */}
                {columns.map((col) => {
                  const isActive = row.currentStageId === col.id;
                  const isInPattern = row.patternStageIds.has(col.id);
                  return (
                    <td
                      key={col.id}
                      style={{
                        textAlign: 'center',
                        padding: `${SPACING.xs} 4px`,
                        borderBottom: `1px solid ${COLORS.ink}08`,
                        verticalAlign: 'middle',
                        // Faintly tint cells that belong to this row's pattern
                        background: isInPattern
                          ? `${COLORS.ink}04`
                          : 'transparent',
                      }}
                    >
                      {isActive ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <StagePill healthLabel={row.healthLabel} />
                        </div>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Legend() {
  const entries: { label: string; health: InstanceHealthLabel }[] = [
    { label: 'Healthy', health: 'healthy' },
    { label: 'Warning', health: 'warning' },
    { label: 'Critical', health: 'critical' },
    { label: 'Unknown', health: 'unknown' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          fontWeight: 600,
          color: `${COLORS.ink}88`,
        }}
      >
        Health
      </span>
      {entries.map((entry) => (
        <div
          key={entry.health}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 12,
              height: 12,
              borderRadius: '50%',
              background: healthBorderColor(entry.health),
            }}
          />
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: healthTextColor(entry.health),
            }}
          >
            {entry.label}
          </span>
        </div>
      ))}
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: `${COLORS.ink}66`,
          marginLeft: SPACING.sm,
        }}
      >
        · Shaded columns = stages belonging to that instance&apos;s pattern
      </span>
    </div>
  );
}

function Note() {
  return (
    <div
      style={{
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 12,
        color: `${COLORS.ink}66`,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: COLORS.cream,
        border: `1px solid ${COLORS.ink}0f`,
        borderRadius: RADIUS.md,
      }}
    >
      Stage positions reflect in-memory overrides. Reset on server restart.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SourceTimelinePage() {
  const {
    columns,
    rows,
    totalCount,
    healthCount,
    firstStageName,
    firstStageCount,
    lastStageName,
    lastStageCount,
  } = buildTimelineData();

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
        eyebrow="Reasoning · Source timeline"
        title="Source event lifecycle positions"
        subtitle="Every source event shown at its current procurement lifecycle stage. Color indicates health: mint = healthy, amber = warning, rust = critical. Shaded stage cells belong to the instance's bound lifecycle pattern."
      >
        <SummaryStrip
          totalCount={totalCount}
          healthCount={healthCount}
          firstStageName={firstStageName}
          firstStageCount={firstStageCount}
          lastStageName={lastStageName}
          lastStageCount={lastStageCount}
        />
        <Legend />
        <TimelineGrid columns={columns} rows={rows} />
        <Note />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
