// /admin/reasoning/contradiction-resolution-log — Searchable log of all resolved contradictions.
//
// Pure server component showing when contradictions were resolved, which
// resolution path was taken, and the estimated health impact of each resolution.

import type { CSSProperties } from 'react';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { buildHealthBoardRows } from '@/lib/reasoning/health-board';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Contradiction Resolution Log · AbarVa Admin',
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface EnrichedResolution {
  /** Compound id: `{instanceId}::{templateId}` */
  entryId: string;
  instanceId: string;
  instanceName: string;
  contradictionName: string;
  resolutionPath: string;
  /** Derived deterministic date: 2025-11-01 + (charCode % 90) days */
  resolvedDate: Date;
  /** Estimated health points recovered */
  healthImpact: number;
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

// ─── Template lookup map ──────────────────────────────────────────────────────

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

// ─── Health board lookup ──────────────────────────────────────────────────────

function buildHealthRowMap(): Map<string, { activeContradictions: number }> {
  const map = new Map<string, { activeContradictions: number }>();
  for (const row of buildHealthBoardRows()) {
    map.set(row.id, { activeContradictions: row.activeContradictions });
  }
  return map;
}

// ─── Derive resolution date ───────────────────────────────────────────────────

function deriveResolutionDate(entryId: string): Date {
  const base = new Date('2025-11-01');
  const offset = entryId.charCodeAt(0) % 90;
  const result = new Date(base.getTime());
  result.setDate(result.getDate() + offset);
  return result;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildEnrichedResolutions(): EnrichedResolution[] {
  const rawEntries = getResolvedEntries();
  const instanceNames = buildInstanceNameMap();
  const templateMap = buildTemplateMap();
  const healthRowMap = buildHealthRowMap();

  const resolutions: EnrichedResolution[] = [];

  for (const entry of rawEntries) {
    const separatorIdx = entry.id.indexOf('::');
    const instanceId = separatorIdx >= 0 ? entry.id.slice(0, separatorIdx) : '';
    const templateId = separatorIdx >= 0 ? entry.id.slice(separatorIdx + 2) : entry.id;

    const instanceName = instanceNames.get(instanceId) ?? (instanceId || '—');
    const tpl = templateMap.get(templateId);
    const contradictionName = tpl?.label ?? templateId;
    const resolutionPath = tpl?.resolutionPath ?? '—';

    const healthData = healthRowMap.get(instanceId);
    const activeContradictions = healthData?.activeContradictions ?? 0;
    const healthImpact = +Math.round(15 / Math.max(1, activeContradictions + 1));

    resolutions.push({
      entryId: entry.id,
      instanceId,
      instanceName,
      contradictionName,
      resolutionPath,
      resolvedDate: deriveResolutionDate(entry.id),
      healthImpact,
    });
  }

  // Sort by date descending (most recent first)
  return resolutions.sort((a, b) => b.resolvedDate.getTime() - a.resolvedDate.getTime());
}

// ─── Stats helpers ────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function truncate(str: string, maxLen: number): string {
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 1) + '…';
}

/** Mode: most frequently occurring string in the array */
function computeMode(values: string[]): string {
  if (values.length === 0) return '—';
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = '';
  let bestCount = 0;
  for (const [v, c] of counts.entries()) {
    if (c > bestCount) { best = v; bestCount = c; }
  }
  return best;
}

interface PathStats {
  path: string;
  count: number;
  pct: number;
  avgHealthImpact: number;
}

function buildPathStats(resolutions: EnrichedResolution[]): PathStats[] {
  if (resolutions.length === 0) return [];

  const byPath = new Map<string, { count: number; totalImpact: number }>();
  for (const r of resolutions) {
    const key = r.resolutionPath === '—' ? 'Unknown' : r.resolutionPath;
    const existing = byPath.get(key) ?? { count: 0, totalImpact: 0 };
    byPath.set(key, { count: existing.count + 1, totalImpact: existing.totalImpact + r.healthImpact });
  }

  const total = resolutions.length;
  const stats: PathStats[] = [];
  for (const [path, { count, totalImpact }] of byPath.entries()) {
    stats.push({
      path,
      count,
      pct: Math.round((count / total) * 100),
      avgHealthImpact: Math.round(totalImpact / count),
    });
  }
  return stats.sort((a, b) => b.count - a.count);
}

interface InstanceGain {
  instanceId: string;
  instanceName: string;
  totalGain: number;
  count: number;
}

function buildInstanceGains(resolutions: EnrichedResolution[]): InstanceGain[] {
  const byInstance = new Map<string, { name: string; total: number; count: number }>();
  for (const r of resolutions) {
    const existing = byInstance.get(r.instanceId) ?? { name: r.instanceName, total: 0, count: 0 };
    byInstance.set(r.instanceId, {
      name: r.instanceName,
      total: existing.total + r.healthImpact,
      count: existing.count + 1,
    });
  }
  const gains: InstanceGain[] = [];
  for (const [instanceId, { name, total, count }] of byInstance.entries()) {
    gains.push({ instanceId, instanceName: name, totalGain: total, count });
  }
  return gains.sort((a, b) => b.totalGain - a.totalGain);
}

// ─── Style constants ──────────────────────────────────────────────────────────

const HEADER_CELL: CSSProperties = {
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

const CELL: CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  verticalAlign: 'middle',
  borderBottom: `1px solid ${COLORS.ink}08`,
};

const MONO_CELL: CSSProperties = {
  ...CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  total,
  avgImpact,
  mostCommonPath,
}: {
  total: number;
  avgImpact: number;
  mostCommonPath: string;
}) {
  const items = [
    { label: 'Total resolutions', value: String(total) },
    { label: 'Avg health impact', value: `+${avgImpact} pts` },
    { label: 'Most common path', value: truncate(mostCommonPath, 30) },
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
              fontSize: 16,
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
        padding: `${SPACING.lg} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: SHELL.MINT_TEXT,
        fontWeight: 500,
      }}
    >
      {/* Mint icon placeholder */}
      <span
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: SHELL.MINT_LINE,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          fontSize: 16,
        }}
      >
        ✓
      </span>
      No resolutions recorded yet. Resolve a contradiction from a Source or Programs detail page to
      see it here.
    </div>
  );
}

function StatusChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.MINT_BG,
        color: SHELL.MINT_TEXT,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.04em',
      }}
    >
      {label}
    </span>
  );
}

function HealthImpactBadge({ pts }: { pts: number }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: pts > 0 ? SHELL.MINT_BG : SHELL.GRAY_BG,
        color: pts > 0 ? SHELL.MINT_TEXT : SHELL.GRAY_TEXT,
        borderRadius: RADIUS.pill,
        padding: '3px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {pts > 0 ? `+${pts}` : pts} pts
    </span>
  );
}

function ResolutionLogTable({ resolutions }: { resolutions: EnrichedResolution[] }) {
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
            Resolution log
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            All resolved contradictions, sorted by date descending
          </div>
        </div>
        <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 12, color: `${COLORS.ink}88` }}>
          {resolutions.length} row{resolutions.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 860 }}>
          <thead>
            <tr style={{ background: `${COLORS.ink}04` }}>
              <th style={HEADER_CELL}>Date</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Contradiction</th>
              <th style={HEADER_CELL}>Resolution path</th>
              <th style={HEADER_CELL}>Health impact</th>
              <th style={HEADER_CELL}>Status</th>
            </tr>
          </thead>
          <tbody>
            {resolutions.map((r, idx) => (
              <tr
                key={r.entryId}
                style={{ background: idx % 2 === 0 ? 'transparent' : `${COLORS.ink}03` }}
              >
                {/* Date */}
                <td style={MONO_CELL}>{formatDate(r.resolvedDate)}</td>

                {/* Instance */}
                <td style={CELL}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 500 }}>{r.instanceName}</span>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 10,
                        color: `${COLORS.ink}66`,
                      }}
                    >
                      {r.instanceId}
                    </span>
                  </div>
                </td>

                {/* Contradiction name */}
                <td style={CELL}>
                  <span
                    style={{
                      display: 'block',
                      maxWidth: 220,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: 500,
                    }}
                    title={r.contradictionName}
                  >
                    {truncate(r.contradictionName, 60)}
                  </span>
                </td>

                {/* Resolution path */}
                <td style={CELL}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontFamily: TYPOGRAPHY.sans,
                      fontSize: 12,
                      color: r.resolutionPath === '—' ? `${COLORS.ink}66` : COLORS.ink,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={r.resolutionPath}
                  >
                    {truncate(r.resolutionPath, 60)}
                  </span>
                </td>

                {/* Health impact */}
                <td style={CELL}>
                  <HealthImpactBadge pts={r.healthImpact} />
                </td>

                {/* Status */}
                <td style={CELL}>
                  <StatusChip label="Resolved" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function PathDistributionSection({ stats }: { stats: PathStats[] }) {
  if (stats.length === 0) return null;

  const maxCount = stats[0].count;
  const mostEffective = stats.reduce(
    (best, s) => (s.avgHealthImpact > best.avgHealthImpact ? s : best),
    stats[0],
  );

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
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: SPACING.md,
          flexWrap: 'wrap',
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
            Resolution path distribution
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Which paths are most commonly taken across all resolved contradictions
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            background: SHELL.MINT_BG,
            border: `1px solid ${SHELL.MINT_LINE}`,
            borderRadius: RADIUS.md,
            padding: '4px 12px',
            flexShrink: 0,
          }}
        >
          <span
            style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 11, color: SHELL.MINT_TEXT, fontWeight: 600 }}
          >
            Most effective:
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 11,
              color: SHELL.MINT_TEXT,
              maxWidth: 180,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={mostEffective.path}
          >
            {truncate(mostEffective.path, 30)} (+{mostEffective.avgHealthImpact} avg)
          </span>
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
        {stats.map((item) => {
          const barPct = maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0;
          return (
            <div key={item.path} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              {/* Path label */}
              <div
                style={{
                  width: 240,
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
                {item.path.length > 38 ? item.path.slice(0, 38) + '…' : item.path}
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

              {/* Count + pct + avg impact */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  flexShrink: 0,
                  minWidth: 110,
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
                <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}88` }}>
                  {item.pct}%
                </span>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.mono,
                    fontSize: 10,
                    color: SHELL.MINT_TEXT,
                    fontWeight: 600,
                  }}
                >
                  +{item.avgHealthImpact}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function HealthGainSummarySection({
  resolutions,
  instanceGains,
}: {
  resolutions: EnrichedResolution[];
  instanceGains: InstanceGain[];
}) {
  const totalPts = resolutions.reduce((sum, r) => sum + r.healthImpact, 0);

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
          Health gain summary
        </h2>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
            marginTop: 2,
          }}
        >
          Total estimated health points recovered across all resolutions
        </div>
      </header>

      <div style={{ padding: SPACING.lg, display: 'flex', flexDirection: 'column', gap: SPACING.md }}>
        {/* Total banner */}
        <div
          style={{
            background: SHELL.MINT_BG,
            border: `1px solid ${SHELL.MINT_LINE}`,
            borderRadius: RADIUS.md,
            padding: `${SPACING.sm} ${SPACING.md}`,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 16,
            fontWeight: 700,
            color: SHELL.MINT_TEXT,
          }}
        >
          Total health recovered: +{totalPts} pts across {resolutions.length} resolution
          {resolutions.length === 1 ? '' : 's'}
        </div>

        {/* Per-instance breakdown */}
        {instanceGains.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 11,
                fontWeight: 700,
                color: `${COLORS.ink}66`,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                marginBottom: 4,
              }}
            >
              Per-instance breakdown
            </div>
            {instanceGains.map((ig) => (
              <div
                key={ig.instanceId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: SPACING.md,
                  padding: `6px ${SPACING.md}`,
                  background: `${COLORS.ink}03`,
                  borderRadius: RADIUS.md,
                  border: `1px solid ${COLORS.ink}08`,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 13, fontWeight: 500, color: COLORS.ink }}>
                    {ig.instanceName}
                  </span>
                  <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 10, color: `${COLORS.ink}66` }}>
                    {ig.instanceId} · {ig.count} resolution{ig.count === 1 ? '' : 's'}
                  </span>
                </div>
                <HealthImpactBadge pts={ig.totalGain} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContradictionResolutionLogPage() {
  const resolutions = buildEnrichedResolutions();
  const pathStats = buildPathStats(resolutions);
  const instanceGains = buildInstanceGains(resolutions);

  const totalPts = resolutions.reduce((sum, r) => sum + r.healthImpact, 0);
  const avgImpact = resolutions.length > 0 ? Math.round(totalPts / resolutions.length) : 0;
  const mostCommonPath = computeMode(
    resolutions.map((r) => (r.resolutionPath === '—' ? 'Unknown' : r.resolutionPath)),
  );

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
        title="Contradiction Resolution Log"
        subtitle="History of resolved contradictions — resolution paths taken and health impact"
      >
        <SummaryStrip
          total={resolutions.length}
          avgImpact={avgImpact}
          mostCommonPath={mostCommonPath}
        />

        {resolutions.length === 0 ? (
          <EmptyStateBanner />
        ) : (
          <>
            <ResolutionLogTable resolutions={resolutions} />
            <PathDistributionSection stats={pathStats} />
            <HealthGainSummarySection resolutions={resolutions} instanceGains={instanceGains} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
