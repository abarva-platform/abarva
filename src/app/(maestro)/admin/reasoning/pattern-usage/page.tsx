// /admin/reasoning/pattern-usage — Pattern adoption analytics.
//
// Pure server component. Aggregates all lifecycle pattern instances across the
// source-event and program fixture corpora, breaking down usage by tenant.
// Shows a summary strip, top-5 usage chart, and a full usage table.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Pattern usage · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface InstanceSummary {
  id: string;
  label: string;
  tenantId: string;
}

interface PatternUsageRow {
  patternId: string;
  patternTitle: string;
  domain: string;
  instanceCount: number;
  tenants: string[];
  instances: InstanceSummary[];
}

// ─── Build aggregates ─────────────────────────────────────────────────────────

function buildPatternUsageRows(): PatternUsageRow[] {
  const allPatterns = getAllLifecyclePatterns();
  const patternMap = new Map<string, { title: string; domain: string }>();
  for (const p of allPatterns) {
    patternMap.set(p.patternId, { title: p.title, domain: p.domain });
  }

  // patternId → { instances, tenantSet }
  const grouped = new Map<string, { instances: InstanceSummary[]; tenantSet: Set<string> }>();

  const addInstance = (id: string, label: string, tenantId: string, patternId: string) => {
    let entry = grouped.get(patternId);
    if (!entry) {
      entry = { instances: [], tenantSet: new Set() };
      grouped.set(patternId, entry);
    }
    entry.instances.push({ id, label, tenantId });
    entry.tenantSet.add(tenantId);
  };

  for (const inst of SOURCE_EVENT_INSTANCES) {
    addInstance(inst.id, inst.name ?? inst.id, inst.tenantId, inst.patternId);
  }

  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    addInstance(inst.id, inst.name ?? inst.id, inst.tenantId, inst.patternId);
  }

  const rows: PatternUsageRow[] = [];

  for (const [patternId, entry] of grouped.entries()) {
    const meta = patternMap.get(patternId);
    rows.push({
      patternId,
      patternTitle: meta?.title ?? patternId,
      domain: meta?.domain ?? 'unknown',
      instanceCount: entry.instances.length,
      tenants: Array.from(entry.tenantSet).sort(),
      instances: entry.instances,
    });
  }

  // Sort by instanceCount descending
  return rows.sort((a, b) => b.instanceCount - a.instanceCount);
}

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({
  patternCount,
  totalInstances,
  tenantCount,
}: {
  patternCount: number;
  totalInstances: number;
  tenantCount: number;
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
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 13,
        color: `${COLORS.ink}99`,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {patternCount} pattern{patternCount !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {totalInstances} total instance{totalInstances !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {tenantCount} tenant{tenantCount !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span>sorted by instance count descending</span>
    </div>
  );
}

function TopPatternsChart({ rows }: { rows: PatternUsageRow[] }) {
  const top5 = rows.slice(0, 5);
  if (top5.length === 0) return null;
  const maxCount = top5[0].instanceCount;

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 17,
          fontWeight: 700,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
          lineHeight: 1.2,
        }}
      >
        Top patterns by usage
      </span>

      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {top5.map((row) => {
          const pct = maxCount > 0 ? Math.round((row.instanceCount / maxCount) * 100) : 0;
          return (
            <div key={row.patternId} style={{ display: 'flex', alignItems: 'center', gap: SPACING.md }}>
              {/* Pattern label */}
              <div
                style={{
                  width: 200,
                  flexShrink: 0,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: COLORS.ink,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={row.patternTitle}
              >
                {row.patternTitle}
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
                    width: `${pct}%`,
                    height: '100%',
                    background: COLORS.navy,
                    borderRadius: RADIUS.pill,
                    minWidth: row.instanceCount > 0 ? 4 : 0,
                  }}
                />
              </div>
              {/* Count */}
              <span
                style={{
                  width: 28,
                  textAlign: 'right',
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 12,
                  fontWeight: 700,
                  color: COLORS.ink,
                  flexShrink: 0,
                }}
              >
                {row.instanceCount}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PatternUsageTable({ rows }: { rows: PatternUsageRow[] }) {
  if (rows.length === 0) {
    return (
      <div
        style={{
          background: COLORS.white,
          border: `1px dashed ${COLORS.ink}33`,
          borderRadius: RADIUS.lg,
          padding: SPACING.xl,
          textAlign: 'center',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}aa`,
        }}
      >
        No pattern usage data — no fixture instances found.
      </div>
    );
  }

  const maxCount = rows[0]?.instanceCount ?? 1;

  const headerStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 10,
    fontWeight: 700,
    color: `${COLORS.ink}66`,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
    padding: `${SPACING.sm} ${SPACING.md}`,
    textAlign: 'left' as const,
    borderBottom: `1px solid ${COLORS.ink}14`,
    whiteSpace: 'nowrap' as const,
  };

  const cellStyle: React.CSSProperties = {
    fontFamily: TYPOGRAPHY.sans,
    fontSize: 13,
    color: COLORS.ink,
    padding: `${SPACING.sm} ${SPACING.md}`,
    verticalAlign: 'middle' as const,
    borderBottom: `1px solid ${COLORS.ink}08`,
  };

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: `${COLORS.ink}04` }}>
              <th style={headerStyle}>Pattern name</th>
              <th style={headerStyle}>Domain</th>
              <th style={{ ...headerStyle, textAlign: 'center' as const }}>Instances</th>
              <th style={headerStyle}>Tenants</th>
              <th style={headerStyle}>Usage</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const barPct = maxCount > 0 ? Math.round((row.instanceCount / maxCount) * 100) : 0;
              return (
                <tr key={row.patternId} style={{ background: COLORS.white }}>
                  {/* Pattern name */}
                  <td style={cellStyle}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontWeight: 500, color: COLORS.ink }}>
                        {row.patternTitle}
                      </span>
                      <span
                        style={{
                          fontFamily: TYPOGRAPHY.mono,
                          fontSize: 10,
                          color: `${COLORS.ink}66`,
                        }}
                      >
                        {row.patternId}
                      </span>
                    </div>
                  </td>

                  {/* Domain */}
                  <td style={cellStyle}>
                    <span
                      style={{
                        display: 'inline-block',
                        background: COLORS.skyPale,
                        color: COLORS.navy,
                        borderRadius: RADIUS.pill,
                        padding: '2px 8px',
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.04em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {row.domain.replace(/_/g, ' ')}
                    </span>
                  </td>

                  {/* Instance count */}
                  <td style={{ ...cellStyle, textAlign: 'center' as const }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.mono,
                        fontSize: 14,
                        fontWeight: 700,
                        color: COLORS.ink,
                      }}
                    >
                      {row.instanceCount}
                    </span>
                  </td>

                  {/* Tenants */}
                  <td style={{ ...cellStyle, maxWidth: 220 }}>
                    <span
                      style={{
                        fontFamily: TYPOGRAPHY.sans,
                        fontSize: 12,
                        color: `${COLORS.ink}88`,
                        wordBreak: 'break-word',
                      }}
                    >
                      {row.tenants.join(', ')}
                    </span>
                  </td>

                  {/* Usage bar */}
                  <td style={{ ...cellStyle, minWidth: 120 }}>
                    <div
                      style={{
                        height: 8,
                        background: `${COLORS.ink}0c`,
                        borderRadius: RADIUS.pill,
                        overflow: 'hidden',
                        minWidth: 80,
                      }}
                    >
                      <div
                        style={{
                          width: `${barPct}%`,
                          height: '100%',
                          background: COLORS.navy,
                          borderRadius: RADIUS.pill,
                          minWidth: row.instanceCount > 0 ? 4 : 0,
                        }}
                      />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PatternUsagePage() {
  const rows = buildPatternUsageRows();
  const totalInstances = rows.reduce((s, r) => s + r.instanceCount, 0);
  const allTenants = new Set(rows.flatMap((r) => r.tenants));
  const tenantCount = allTenants.size;

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
        title="Pattern usage"
        subtitle="Pattern adoption analytics — instance count per lifecycle pattern broken down by tenant."
      >
        <SummaryStrip
          patternCount={rows.length}
          totalInstances={totalInstances}
          tenantCount={tenantCount}
        />
        <TopPatternsChart rows={rows} />
        <PatternUsageTable rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
