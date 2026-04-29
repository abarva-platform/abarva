// /admin/reasoning/tenant-comparison — Cross-tenant reasoning health metrics.
//
// Pure server component. Groups all fixture instances by tenantId, computes
// per-tenant aggregate metrics (avg health score, avg gate pass rate, total
// contradictions, instance count), sorts descending by avg health score, and
// renders three sections:
//   1. SummaryStrip  — headline counts with best/worst tenant callout
//   2. TenantTable   — full metrics grid with inline score bar + status pill
//   3. TenantScoreCard — side-by-side cards for the top-3 tenants

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { buildHealthBoardRows, type InstanceHealthRow } from '@/lib/reasoning/health-board';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { SHELL } from '@/lib/shell/shell-tokens';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Tenant comparison · AbarVa Admin',
};

// ─── Score computation (mirrors scorecard formula) ────────────────────────────

function computeScore(row: InstanceHealthRow): number {
  return Math.round(
    (row.gatesMet / Math.max(row.gatesTotal, 1)) * 60 +
      (1 - Math.min(row.activeContradictions / 5, 1)) * 30 +
      10,
  );
}

// ─── Data model ───────────────────────────────────────────────────────────────

interface TenantInstance {
  id: string;
  label: string;
  score: number;
  gatesMet: number;
  gatesTotal: number;
  activeContradictions: number;
  type: 'source' | 'program';
}

interface TenantRow {
  tenantId: string;
  instances: TenantInstance[];
  instanceCount: number;
  avgScore: number;
  avgGatePassPct: number; // 0–100
  totalContradictions: number;
}

// ─── Build aggregates ─────────────────────────────────────────────────────────

function buildTenantRows(): TenantRow[] {
  // Build a tenantId lookup from raw instances (health-board rows don't include tenantId)
  const tenantMap = new Map<string, string>(); // instanceId → tenantId
  for (const inst of SOURCE_EVENT_INSTANCES) {
    tenantMap.set(inst.id, inst.tenantId);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    tenantMap.set(inst.id, inst.tenantId);
  }

  const healthRows = buildHealthBoardRows();

  // Group by tenant
  const byTenant = new Map<string, TenantInstance[]>();

  for (const row of healthRows) {
    const tenantId = tenantMap.get(row.id) ?? 'unknown';
    const score = computeScore(row);
    const list = byTenant.get(tenantId) ?? [];
    list.push({
      id: row.id,
      label: row.label,
      score,
      gatesMet: row.gatesMet,
      gatesTotal: row.gatesTotal,
      activeContradictions: row.activeContradictions,
      type: row.type,
    });
    byTenant.set(tenantId, list);
  }

  const result: TenantRow[] = [];

  for (const [tenantId, instances] of byTenant.entries()) {
    const instanceCount = instances.length;
    const avgScore =
      instanceCount === 0
        ? 0
        : Math.round(instances.reduce((s, i) => s + i.score, 0) / instanceCount);

    // avg gate pass %: mean of per-instance (gatesMet/gatesTotal * 100)
    const avgGatePassPct =
      instanceCount === 0
        ? 0
        : Math.round(
            instances.reduce(
              (s, i) => s + (i.gatesMet / Math.max(i.gatesTotal, 1)) * 100,
              0,
            ) / instanceCount,
          );

    const totalContradictions = instances.reduce((s, i) => s + i.activeContradictions, 0);

    result.push({
      tenantId,
      instances,
      instanceCount,
      avgScore,
      avgGatePassPct,
      totalContradictions,
    });
  }

  // Sort descending by avg health score
  return result.sort((a, b) => b.avgScore - a.avgScore);
}

// ─── Score band helpers ───────────────────────────────────────────────────────

type ScoreBand = 'mint' | 'amber' | 'rust';

function scoreBand(score: number): ScoreBand {
  if (score >= 70) return 'mint';
  if (score >= 40) return 'amber';
  return 'rust';
}

function bandPalette(band: ScoreBand): { bar: string; text: string; barBg: string } {
  if (band === 'mint') return { bar: SHELL.MINT_TEXT, text: SHELL.MINT_TEXT, barBg: SHELL.MINT_BG };
  if (band === 'amber')
    return { bar: SHELL.AMBER_DOT, text: SHELL.AMBER_DOT, barBg: SHELL.PAPER_DEEP };
  return { bar: SHELL.RUST_TEXT, text: SHELL.RUST_TEXT, barBg: SHELL.RUST_BG };
}

// ─── Status pill labels ───────────────────────────────────────────────────────

type StatusLabel = 'best' | 'avg' | 'worst';

function statusPalette(status: StatusLabel): { bg: string; text: string } {
  if (status === 'best') return { bg: SHELL.MINT_BG, text: SHELL.MINT_TEXT };
  if (status === 'worst') return { bg: SHELL.RUST_BG, text: SHELL.RUST_TEXT };
  return { bg: SHELL.GRAY_BG, text: SHELL.GRAY_TEXT };
}

function deriveStatus(idx: number, total: number): StatusLabel {
  if (total === 1) return 'avg';
  if (idx === 0) return 'best';
  if (idx === total - 1) return 'worst';
  return 'avg';
}

// ─── Table styles ─────────────────────────────────────────────────────────────

const TH: React.CSSProperties = {
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

const TD: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'middle',
};

const TD_MONO: React.CSSProperties = {
  ...TD,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryStrip({ rows }: { rows: TenantRow[] }) {
  const tenantCount = rows.length;
  const totalInstances = rows.reduce((s, r) => s + r.instanceCount, 0);
  const best = rows[0];
  const worst = rows[rows.length - 1];

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
        {tenantCount} tenant{tenantCount !== 1 ? 's' : ''}
      </span>
      <span style={{ color: `${COLORS.ink}44` }}>·</span>
      <span style={{ fontWeight: 700, color: COLORS.ink }}>
        {totalInstances} total instance{totalInstances !== 1 ? 's' : ''}
      </span>
      {best !== undefined && (
        <>
          <span style={{ color: `${COLORS.ink}44` }}>·</span>
          <span>
            Best:{' '}
            <span style={{ fontWeight: 700, color: SHELL.MINT_TEXT }}>
              {best.tenantId} ({best.avgScore})
            </span>
          </span>
        </>
      )}
      {worst !== undefined && worst !== best && (
        <>
          <span style={{ color: `${COLORS.ink}44` }}>·</span>
          <span>
            Worst:{' '}
            <span style={{ fontWeight: 700, color: SHELL.RUST_TEXT }}>
              {worst.tenantId} ({worst.avgScore})
            </span>
          </span>
        </>
      )}
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const band = scoreBand(score);
  const palette = bandPalette(band);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm, minWidth: 140 }}>
      <div
        style={{
          flex: 1,
          height: 8,
          background: `${COLORS.ink}0c`,
          borderRadius: RADIUS.pill,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: palette.bar,
            borderRadius: RADIUS.pill,
            minWidth: score > 0 ? 4 : 0,
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: palette.text,
          width: 32,
          textAlign: 'right',
          flexShrink: 0,
        }}
      >
        {score}
      </span>
    </div>
  );
}

function StatusPill({ status }: { status: StatusLabel }) {
  const palette = statusPalette(status);
  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.text,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {status}
    </span>
  );
}

function TenantTable({ rows }: { rows: TenantRow[] }) {
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
        No tenant data — no fixture instances found.
      </div>
    );
  }

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
          Tenant health metrics
        </h2>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr style={{ background: `${COLORS.ink}04` }}>
              <th style={TH}>Tenant</th>
              <th style={{ ...TH, textAlign: 'center' }}>Instances</th>
              <th style={{ ...TH, minWidth: 180 }}>Avg health score</th>
              <th style={{ ...TH, textAlign: 'center' }}>Avg gate pass %</th>
              <th style={{ ...TH, textAlign: 'center' }}>Total contradictions</th>
              <th style={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const status = deriveStatus(idx, rows.length);
              return (
                <tr key={row.tenantId} style={{ background: COLORS.white }}>
                  {/* Tenant */}
                  <td style={TD}>
                    <span style={{ fontWeight: 600, color: COLORS.ink }}>{row.tenantId}</span>
                  </td>

                  {/* Instance count */}
                  <td style={{ ...TD_MONO, textAlign: 'center' }}>{row.instanceCount}</td>

                  {/* Avg health score with bar */}
                  <td style={{ ...TD, minWidth: 180 }}>
                    <ScoreBar score={row.avgScore} />
                  </td>

                  {/* Avg gate pass % */}
                  <td style={{ ...TD_MONO, textAlign: 'center' }}>{row.avgGatePassPct}%</td>

                  {/* Total contradictions */}
                  <td
                    style={{
                      ...TD_MONO,
                      textAlign: 'center',
                      color:
                        row.totalContradictions > 0
                          ? SHELL.RUST_TEXT
                          : `${COLORS.ink}66`,
                    }}
                  >
                    {row.totalContradictions}
                  </td>

                  {/* Status pill */}
                  <td style={TD}>
                    <StatusPill status={status} />
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

function InstanceLine({ inst }: { inst: TenantInstance; key?: React.Key }) {
  const band = scoreBand(inst.score);
  const palette = bandPalette(band);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: SPACING.sm,
        padding: `${SPACING.xs} 0`,
        borderBottom: `1px solid ${COLORS.ink}08`,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: COLORS.ink,
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
        title={inst.label}
      >
        {inst.label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          fontWeight: 700,
          color: palette.text,
          flexShrink: 0,
          width: 28,
          textAlign: 'right',
        }}
      >
        {inst.score}
      </span>
    </div>
  );
}

function TenantCard({ row, rank }: { row: TenantRow; rank: number; key?: React.Key }) {
  const band = scoreBand(row.avgScore);
  const palette = bandPalette(band);
  const sorted = [...row.instances].sort((a, b) => b.score - a.score);

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        flex: '1 1 280px',
        minWidth: 0,
      }}
    >
      {/* Card header */}
      <div
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
          background: palette.barBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: SPACING.sm,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: `${COLORS.ink}88`,
              marginBottom: 2,
            }}
          >
            #{rank} tenant
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 17,
              fontWeight: 700,
              color: COLORS.ink,
              letterSpacing: '-0.01em',
            }}
          >
            {row.tenantId}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 28,
              fontWeight: 700,
              color: palette.text,
              lineHeight: 1,
            }}
          >
            {row.avgScore}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 10,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            avg score
          </div>
        </div>
      </div>

      {/* Metrics row */}
      <div
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}0c`,
          display: 'flex',
          gap: SPACING.lg,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            {row.avgGatePassPct}%
          </div>
          <div
            style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 10, color: `${COLORS.ink}88` }}
          >
            gate pass
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 14,
              fontWeight: 700,
              color: row.totalContradictions > 0 ? SHELL.RUST_TEXT : `${COLORS.ink}66`,
            }}
          >
            {row.totalContradictions}
          </div>
          <div
            style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 10, color: `${COLORS.ink}88` }}
          >
            contradictions
          </div>
        </div>
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 14,
              fontWeight: 700,
              color: COLORS.ink,
            }}
          >
            {row.instanceCount}
          </div>
          <div
            style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 10, color: `${COLORS.ink}88` }}
          >
            instances
          </div>
        </div>
      </div>

      {/* Instance list */}
      <div style={{ padding: `${SPACING.sm} ${SPACING.lg} ${SPACING.md}` }}>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: `${COLORS.ink}66`,
            marginBottom: SPACING.xs,
          }}
        >
          Instances
        </div>
        {sorted.map((inst) =>
          ((i: TenantInstance) => <InstanceLine key={i.id} inst={i} />)(inst),
        )}
      </div>
    </div>
  );
}

function TenantScoreCards({ rows }: { rows: TenantRow[] }) {
  const top3 = rows.slice(0, 3);
  if (top3.length === 0) return null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.md,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          letterSpacing: '-0.01em',
        }}
      >
        Top-3 tenant scorecards
      </div>
      <div
        style={{
          display: 'flex',
          gap: SPACING.md,
          flexWrap: 'wrap',
          alignItems: 'stretch',
        }}
      >
        {top3.map((row, idx) =>
          ((r: TenantRow, i: number) => <TenantCard key={r.tenantId} row={r} rank={i + 1} />)(row, idx),
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TenantComparisonPage() {
  const rows = buildTenantRows();

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
        title="Tenant comparison"
        subtitle="Cross-tenant reasoning health metrics — avg score, gate pass rate, contradiction rate, and instance breakdown by client."
      >
        <SummaryStrip rows={rows} />
        <TenantTable rows={rows} />
        <TenantScoreCards rows={rows} />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
