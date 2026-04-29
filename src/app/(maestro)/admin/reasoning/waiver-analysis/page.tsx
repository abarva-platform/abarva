// /admin/reasoning/waiver-analysis — Gate waiver and approval analysis.
//
// Server component. Calls the audit route handler in-process to get the full
// merged dataset (live buffers + demo pre-seed), then filters down to
// gate_waiver / gate_approval / gate_reject entries and renders:
//   1. Summary stat row (waivers, approvals, rejections, unique instances)
//   2. Top waived criteria table
//   3. Per-instance gate action summary table
//   4. Recent activity timeline (last 10 gate actions, newest first)

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { GET } from '@/app/api/reasoning/audit/route';
import type { AuditEntry } from '@/app/api/reasoning/audit/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver analysis · AbarVa Admin',
};

// ─── Data loading ─────────────────────────────────────────────────────────────

async function loadGateEntries(): Promise<AuditEntry[]> {
  const response = await GET();
  const all = (await response.json()) as AuditEntry[];
  return all.filter(
    (e) =>
      e.type === 'gate_waiver' ||
      e.type === 'gate_approval' ||
      e.type === 'gate_reject',
  );
}

// ─── Derived analytics ────────────────────────────────────────────────────────

interface CriterionRow {
  criterionId: string;
  waiverCount: number;
  instancesAffected: number;
}

interface InstanceRow {
  instanceId: string;
  waivers: number;
  approvals: number;
  rejections: number;
  firstAction: string;
  lastAction: string;
}

function extractCriterionId(entry: AuditEntry): string {
  // Detail format: Gate criterion "<id>" waived/approved/rejected — <rest>
  const match = /Gate criterion "([^"]+)"/.exec(entry.detail);
  return match ? match[1] : entry.detail.slice(0, 40);
}

function buildCriterionRows(entries: AuditEntry[]): CriterionRow[] {
  const waiversOnly = entries.filter((e) => e.type === 'gate_waiver');

  const countMap = new Map<string, number>();
  const instanceSetMap = new Map<string, Set<string>>();

  for (const e of waiversOnly) {
    const cid = extractCriterionId(e);
    countMap.set(cid, (countMap.get(cid) ?? 0) + 1);
    const s = instanceSetMap.get(cid) ?? new Set<string>();
    s.add(e.instanceId);
    instanceSetMap.set(cid, s);
  }

  return Array.from(countMap.entries())
    .map(([criterionId, waiverCount]) => ({
      criterionId,
      waiverCount,
      instancesAffected: instanceSetMap.get(criterionId)?.size ?? 0,
    }))
    .sort((a, b) => b.waiverCount - a.waiverCount);
}

function buildInstanceRows(entries: AuditEntry[]): InstanceRow[] {
  const map = new Map<
    string,
    { waivers: number; approvals: number; rejections: number; timestamps: string[] }
  >();

  for (const e of entries) {
    const row = map.get(e.instanceId) ?? {
      waivers: 0,
      approvals: 0,
      rejections: 0,
      timestamps: [],
    };
    if (e.type === 'gate_waiver') row.waivers += 1;
    if (e.type === 'gate_approval') row.approvals += 1;
    if (e.type === 'gate_reject') row.rejections += 1;
    row.timestamps.push(e.timestamp);
    map.set(e.instanceId, row);
  }

  return Array.from(map.entries())
    .map(([instanceId, data]) => {
      const sorted = [...data.timestamps].sort();
      return {
        instanceId,
        waivers: data.waivers,
        approvals: data.approvals,
        rejections: data.rejections,
        firstAction: sorted[0] ?? '',
        lastAction: sorted[sorted.length - 1] ?? '',
      };
    })
    .sort((a, b) => b.lastAction.localeCompare(a.lastAction));
}

// ─── Formatting helpers ────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function typeLabel(type: AuditEntry['type']): string {
  if (type === 'gate_waiver') return 'Waiver';
  if (type === 'gate_approval') return 'Approval';
  if (type === 'gate_reject') return 'Rejection';
  return type;
}

// ─── Table style constants ────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontWeight: 700,
  color: `${COLORS.ink}cc`,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  background: COLORS.skyPale,
  borderBottom: `1px solid ${COLORS.ink}1a`,
  whiteSpace: 'nowrap',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0d`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}bb`,
};

// ─── Summary stats ────────────────────────────────────────────────────────────

interface StatTileProps {
  label: string;
  value: string | number;
  sub?: string;
}

function StatTile({ label, value, sub }: StatTileProps) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
        minHeight: 110,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: `${COLORS.ink}99`,
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 36,
          color: COLORS.ink,
          letterSpacing: '-0.02em',
          lineHeight: 1.05,
        }}
      >
        {value}
      </div>
      {sub ? (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 12,
            color: `${COLORS.ink}88`,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function SummaryRow({ entries }: { entries: AuditEntry[] }) {
  const waivers = entries.filter((e) => e.type === 'gate_waiver').length;
  const approvals = entries.filter((e) => e.type === 'gate_approval').length;
  const rejections = entries.filter((e) => e.type === 'gate_reject').length;
  const uniqueInstances = new Set(entries.map((e) => e.instanceId)).size;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: SPACING.md,
      }}
    >
      <StatTile label="Gate waivers" value={waivers} sub="in-session" />
      <StatTile label="Gate approvals" value={approvals} sub="in-session" />
      <StatTile label="Gate rejections" value={rejections} sub="in-session" />
      <StatTile
        label="Unique instances"
        value={uniqueInstances}
        sub="affected by any gate action"
      />
    </div>
  );
}

// ─── Type badge ────────────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: AuditEntry['type'] }) {
  let bg: string;
  let fg: string;
  if (type === 'gate_waiver') {
    bg = COLORS.amberSoft;
    fg = COLORS.amberInk;
  } else if (type === 'gate_approval') {
    bg = COLORS.mintSoft;
    fg = COLORS.mintInk;
  } else {
    bg = COLORS.coralSoft;
    fg = COLORS.coralInk;
  }

  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {typeLabel(type)}
    </span>
  );
}

// ─── Top waived criteria table ────────────────────────────────────────────────

function TopCriteriaTable({ rows }: { rows: CriterionRow[] }) {
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
            Top waived criteria
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Sorted by waiver count descending
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} criterion{rows.length === 1 ? '' : 'a'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 520 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Criterion ID</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Waiver count</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Instances affected</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              return (
                <tr key={row.criterionId}>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      fontSize: 12,
                      fontWeight: 600,
                      color: COLORS.navy,
                    }}
                  >
                    {row.criterionId}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    {row.waiverCount}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                    }}
                  >
                    {row.instancesAffected}
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

// ─── Per-instance gate action summary ─────────────────────────────────────────

function InstanceSummaryTable({ rows }: { rows: InstanceRow[] }) {
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
            Per-instance gate actions
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Instances that have had at least one gate action — sorted by most recent
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {rows.length} instance{rows.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}
        >
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance ID</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Waivers</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Approvals</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Rejections</th>
              <th style={HEADER_CELL}>First action</th>
              <th style={HEADER_CELL}>Last action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              return (
                <tr key={row.instanceId}>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      color: COLORS.navy,
                      fontWeight: 600,
                    }}
                  >
                    {row.instanceId}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      color:
                        row.waivers > 0 ? COLORS.amberInk : `${COLORS.ink}66`,
                    }}
                  >
                    {row.waivers}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      color:
                        row.approvals > 0
                          ? COLORS.mintInk
                          : `${COLORS.ink}66`,
                    }}
                  >
                    {row.approvals}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      textAlign: 'right',
                      color:
                        row.rejections > 0
                          ? COLORS.coralInk
                          : `${COLORS.ink}66`,
                    }}
                  >
                    {row.rejections}
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg }}>
                    {formatTimestamp(row.firstAction)}
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg }}>
                    {formatTimestamp(row.lastAction)}
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

// ─── Recent activity timeline ─────────────────────────────────────────────────

function RecentActivityTable({ entries }: { entries: AuditEntry[] }) {
  const recent = entries.slice(0, 10);

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
            Recent gate activity
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${COLORS.ink}88`,
              marginTop: 2,
            }}
          >
            Last 10 gate actions across waivers and approvals — newest first
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          showing {recent.length} of {entries.length}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table
          style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}
        >
          <thead>
            <tr>
              <th style={HEADER_CELL}>Time</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={HEADER_CELL}>Detail</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((entry, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? COLORS.white : `${COLORS.ink}04`;
              const criterionId = extractCriterionId(entry);
              return (
                <tr key={entry.id}>
                  <td style={{ ...MONO_CELL, background: rowBg, whiteSpace: 'nowrap' }}>
                    {formatTimestamp(entry.timestamp)}
                  </td>
                  <td style={{ ...BODY_CELL, background: rowBg }}>
                    <TypeBadge type={entry.type} />
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      background: rowBg,
                      color: COLORS.navy,
                      fontWeight: 600,
                    }}
                  >
                    {entry.instanceId}
                  </td>
                  <td style={{ ...MONO_CELL, background: rowBg }}>
                    {criterionId}
                  </td>
                  <td
                    style={{
                      ...BODY_CELL,
                      background: rowBg,
                      maxWidth: 300,
                      lineHeight: 1.4,
                      fontSize: 12,
                    }}
                  >
                    {entry.detail}
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

// ─── Empty state ───────────────────────────────────────────────────────────────

function EmptyState() {
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
        lineHeight: 1.8,
      }}
    >
      <div
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 20,
          color: COLORS.ink,
          marginBottom: SPACING.sm,
          letterSpacing: '-0.01em',
        }}
      >
        No gate actions yet
      </div>
      Use the waiver or approval buttons on a Source or Programs detail page to
      record gate actions. They will appear here once the server has processed at
      least one request.
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default async function WaiverAnalysisPage() {
  const entries = await loadGateEntries();
  const isEmpty = entries.length === 0;

  // Pre-sort newest-first for tables that need it (criteria/instance tables
  // do their own sort; this is consumed by the timeline and passed through).
  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  const criterionRows = buildCriterionRows(entries);
  const instanceRows = buildInstanceRows(entries);

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Back to reasoning"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Waiver analysis"
        title="Gate waiver &amp; approval analysis"
        subtitle="In-session view of every gate waiver, approval, and rejection — grouped by criterion and instance. All data is ephemeral: it resets on server restart."
      >
        <SummaryRow entries={entries} />
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            {criterionRows.length > 0 && (
              <TopCriteriaTable rows={criterionRows} />
            )}
            <InstanceSummaryTable rows={instanceRows} />
            <RecentActivityTable entries={sortedEntries} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
