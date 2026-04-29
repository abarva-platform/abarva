// /admin/reasoning/resolution-flow — Contradiction resolution history.
//
// Pure server component showing how contradictions were resolved over time:
// which instances resolved contradictions, which resolution paths were chosen,
// and a breakdown of paths used across the resolved corpus.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Resolution flow · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResolvedRow {
  /** Compound id: `{instanceId}::{templateId}` */
  compoundId: string;
  instanceId: string;
  instanceName: string;
  contradictionId: string;
  contradictionLabel: string;
  resolutionPath: string;
  resolvedAt: string;
}

// ─── Instance name lookup ─────────────────────────────────────────────────────

function buildInstanceNameMap(): Map<string, string> {
  const map = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    map.set(inst.id, inst.name ?? inst.id);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    map.set(inst.id, inst.name ?? inst.id);
  }
  return map;
}

// ─── Template lookup map {templateId → { label, resolutionPath }} ─────────────

function buildTemplateMap(): Map<string, { label: string; resolutionPath: string }> {
  const map = new Map<string, { label: string; resolutionPath: string }>();
  for (const pattern of getAllLifecyclePatterns()) {
    for (const tpl of pattern.contradictionTemplates) {
      if (!map.has(tpl.id)) {
        map.set(tpl.id, { label: tpl.label, resolutionPath: tpl.resolutionPath });
      }
    }
  }
  return map;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildResolvedRows(): ResolvedRow[] {
  const rawEntries = getResolvedEntries();
  const instanceNames = buildInstanceNameMap();
  const templateMap = buildTemplateMap();

  const rows: ResolvedRow[] = [];

  for (const entry of rawEntries) {
    // Compound id format: `{instanceId}::{templateId}`
    const separatorIdx = entry.id.indexOf('::');
    const instanceId = separatorIdx >= 0 ? entry.id.slice(0, separatorIdx) : '';
    const contradictionId = separatorIdx >= 0 ? entry.id.slice(separatorIdx + 2) : entry.id;

    const instanceName = instanceNames.get(instanceId) ?? (instanceId || '—');
    const tpl = templateMap.get(contradictionId);
    const contradictionLabel = tpl?.label ?? contradictionId;
    const resolutionPath = tpl?.resolutionPath ?? '—';

    rows.push({
      compoundId: entry.id,
      instanceId,
      instanceName,
      contradictionId,
      contradictionLabel,
      resolutionPath,
      resolvedAt: entry.resolvedAt,
    });
  }

  // Sort by resolvedAt descending (most recent first)
  return rows.sort((a, b) => {
    const ta = new Date(a.resolvedAt).getTime();
    const tb = new Date(b.resolvedAt).getTime();
    return tb - ta;
  });
}

// ─── Path breakdown ───────────────────────────────────────────────────────────

interface PathCount {
  path: string;
  count: number;
  pct: number;
}

function buildPathBreakdown(rows: ResolvedRow[]): PathCount[] {
  if (rows.length === 0) return [];

  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.resolutionPath === '—' ? 'Unknown' : row.resolutionPath;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const total = rows.length;
  const result: PathCount[] = [];
  for (const [path, count] of counts.entries()) {
    result.push({ path, count, pct: Math.round((count / total) * 100) });
  }

  return result.sort((a, b) => b.count - a.count);
}

// ─── Formatting helpers ───────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  resolutionCount,
  instanceCount,
  uniquePathCount,
}: {
  resolutionCount: number;
  instanceCount: number;
  uniquePathCount: number;
}) {
  const items = [
    { label: 'Resolutions', value: String(resolutionCount) },
    { label: 'Instances', value: String(instanceCount) },
    { label: 'Unique paths', value: String(uniquePathCount) },
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      {items.map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              color: `${COLORS.ink}88`,
              fontWeight: 600,
            }}
          >
            {label}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 18,
              color: COLORS.ink,
              fontWeight: 700,
            }}
          >
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

function EmptyStateBanner() {
  return (
    <div
      style={{
        background: SHELL.MINT_BG,
        border: `1px solid ${SHELL.MINT_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.MINT_TEXT,
        fontWeight: 500,
      }}
    >
      No contradictions resolved yet. Resolve a contradiction from a Source or Programs detail
      page to see the history here.
    </div>
  );
}

function ResolutionPathPill({ path }: { path: string }) {
  const isUnknown = path === '—' || path === 'Unknown';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isUnknown ? SHELL.GRAY_BG : SHELL.BLUE_BG,
        color: isUnknown ? SHELL.GRAY_TEXT : SHELL.INK_MID,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
        flexShrink: 0,
        maxWidth: 220,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap' as const,
      }}
      title={path}
    >
      {isUnknown ? 'unknown' : path.length > 30 ? path.slice(0, 30) + '…' : path}
    </span>
  );
}

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 10,
  fontWeight: 700,
  color: `${COLORS.ink}66`,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: `${SPACING.sm} ${SPACING.md}`,
  textAlign: 'left',
  borderBottom: `1px solid ${COLORS.ink}14`,
  whiteSpace: 'nowrap',
};

const CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  verticalAlign: 'middle',
  borderBottom: `1px solid ${COLORS.ink}08`,
};

const MONO_CELL: React.CSSProperties = {
  ...CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

function ResolutionTable({ rows }: { rows: ResolvedRow[] }) {
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
            Resolution history
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All resolved contradictions, sorted by resolution time descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} row{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr style={{ background: `${COLORS.ink}04` }}>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Contradiction</th>
              <th style={HEADER_CELL}>Resolution path</th>
              <th style={HEADER_CELL}>Resolved by</th>
              <th style={HEADER_CELL}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.compoundId}>
                {/* Instance */}
                <td style={CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500 }}>{row.instanceName}</span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.instanceId}
                    </span>
                  </div>
                </td>

                {/* Contradiction label */}
                <td style={CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }} title={row.contradictionLabel}>
                      {row.contradictionLabel}
                    </span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {row.contradictionId}
                    </span>
                  </div>
                </td>

                {/* Resolution path pill */}
                <td style={CELL}>
                  <ResolutionPathPill path={row.resolutionPath} />
                </td>

                {/* Resolved by */}
                <td style={MONO_CELL}>
                  <span style={{ color: `${COLORS.ink}99` }}>system</span>
                </td>

                {/* Timestamp */}
                <td style={MONO_CELL}>{formatTimestamp(row.resolvedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PathBreakdown({ breakdown }: { breakdown: PathCount[] }) {
  if (breakdown.length === 0) return null;

  const maxCount = breakdown[0].count;

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
          Path breakdown
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Distribution of resolution paths chosen across all resolved contradictions
        </div>
      </header>

      <div
        style={{
          padding: SPACING.lg,
          display: 'flex',
          flexDirection: 'column',
          gap: SPACING.md,
        }}
      >
        {breakdown.map((item) => {
          const barPct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
          return (
            <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              {/* Path label */}
              <div
                style={{
                  width: 260,
                  flexShrink: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={item.path}
              >
                {item.path.length > 42 ? item.path.slice(0, 42) + '…' : item.path}
              </div>

              {/* Bar track */}
              <div
                style={{
                  flex: 1,
                  height: 14,
                  background: `${COLORS.ink}0c`,
                  borderRadius: RADIUS.pill,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${barPct}%`,
                    height: '100%',
                    background: COLORS.navy,
                    borderRadius: RADIUS.pill,
                    minWidth: item.count > 0 ? 4 : 0,
                  }}
                />
              </div>

              {/* Count + pct */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  flexShrink: 0,
                  minWidth: 72,
                  justifyContent: 'flex-end',
                }}
              >
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {item.count}
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 11,
                    color: `${COLORS.ink}88`,
                  }}
                >
                  {item.pct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResolutionFlowPage() {
  const rows = buildResolvedRows();
  const instanceIds = new Set(rows.map((r) => r.instanceId).filter(Boolean));
  const breakdown = buildPathBreakdown(rows);

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
        title="Resolution flow"
        subtitle="Contradiction resolution history — which paths were chosen and how resolutions distribute across instances."
      >
        <SummaryStrip
          resolutionCount={rows.length}
          instanceCount={instanceIds.size}
          uniquePathCount={breakdown.length}
        />

        {rows.length === 0 ? (
          <EmptyStateBanner />
        ) : (
          <>
            <ResolutionTable rows={rows} />
            <PathBreakdown breakdown={breakdown} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
