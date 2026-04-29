// /admin/reasoning/vendor-tracker — Vendor participation tracker.
//
// Server component. Collects all vendors across SOURCE_EVENT_INSTANCES,
// deduplicates by name, aggregates participation counts, and renders a
// sorted table with color-coded status pills.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import type { VendorStatus } from '@/lib/source/source-event-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Vendor tracker · AbarVa Admin',
};

// ─── Data types ───────────────────────────────────────────────────────────────

interface VendorEventSlot {
  instanceId: string;
  instanceName: string;
  status: VendorStatus;
  pricingBand: 'low' | 'medium' | 'high' | null;
}

interface VendorRow {
  /** Normalised (lowercase trim) key used for dedup */
  key: string;
  name: string;
  slots: VendorEventSlot[];
  /** Worst-case / leading status for sort ordering */
  leadStatus: VendorStatus;
}

// ─── Sort helpers ─────────────────────────────────────────────────────────────

const STATUS_SORT_ORDER: Record<VendorStatus, number> = {
  selected: 0,
  'invited-bafo': 1,
  shortlisted: 2,
  active: 3,
  declined: 4,
  disqualified: 5,
};

function leadStatusFrom(statuses: VendorStatus[]): VendorStatus {
  return statuses.reduce((best, s) =>
    STATUS_SORT_ORDER[s] < STATUS_SORT_ORDER[best] ? s : best,
  );
}

// ─── Data computation ─────────────────────────────────────────────────────────

interface TrackerData {
  vendors: VendorRow[];
  totalUnique: number;
  totalParticipations: number;
  statusCounts: Record<VendorStatus, number>;
}

function buildTrackerData(): TrackerData {
  const byKey = new Map<string, VendorRow>();

  for (const instance of SOURCE_EVENT_INSTANCES) {
    for (const vendor of instance.vendors) {
      const key = vendor.name.toLowerCase().trim();
      let row = byKey.get(key);
      if (!row) {
        row = { key, name: vendor.name, slots: [], leadStatus: vendor.status };
        byKey.set(key, row);
      }
      row.slots.push({
        instanceId: instance.id,
        instanceName: instance.name,
        status: vendor.status,
        pricingBand: vendor.pricingBand,
      });
    }
  }

  // Derive leadStatus and sort slots by status order within each vendor
  const vendors: VendorRow[] = [];
  for (const row of byKey.values()) {
    row.leadStatus = leadStatusFrom(row.slots.map((s) => s.status));
    row.slots.sort((a, b) => STATUS_SORT_ORDER[a.status] - STATUS_SORT_ORDER[b.status]);
    vendors.push(row);
  }

  // Sort vendors: selected first, then invited-bafo, shortlisted, active, declined, disqualified
  vendors.sort(
    (a, b) => STATUS_SORT_ORDER[a.leadStatus] - STATUS_SORT_ORDER[b.leadStatus],
  );

  // Aggregate stats
  const totalParticipations = vendors.reduce((sum, v) => sum + v.slots.length, 0);

  const statusCounts: Record<VendorStatus, number> = {
    selected: 0,
    'invited-bafo': 0,
    shortlisted: 0,
    active: 0,
    declined: 0,
    disqualified: 0,
  };
  for (const vendor of vendors) {
    for (const slot of vendor.slots) {
      statusCounts[slot.status]++;
    }
  }

  return {
    vendors,
    totalUnique: vendors.length,
    totalParticipations,
    statusCounts,
  };
}

// ─── Status pill rendering ────────────────────────────────────────────────────

function statusPillStyle(status: VendorStatus): React.CSSProperties {
  switch (status) {
    case 'selected':
      return {
        background: SHELL.MINT_BG,
        color: SHELL.MINT_TEXT,
        border: `1px solid ${SHELL.MINT_LINE}`,
      };
    case 'invited-bafo':
    case 'shortlisted':
      return {
        background: SHELL.PEACH_BG,
        color: SHELL.PEACH_TEXT,
        border: `1px solid ${SHELL.PEACH_LINE}`,
      };
    case 'active':
      return {
        background: SHELL.GRAY_BG,
        color: SHELL.INK_MUTED,
        border: `1px solid ${SHELL.GRAY_LINE}`,
      };
    case 'declined':
    case 'disqualified':
      return {
        background: SHELL.RUST_BG,
        color: SHELL.RUST_TEXT,
        border: `1px solid ${SHELL.RUST_BG}`,
        opacity: 0.85,
      };
    default:
      return {
        background: SHELL.GRAY_BG,
        color: SHELL.INK_MUTED,
        border: `1px solid ${SHELL.GRAY_LINE}`,
      };
  }
}

function statusLabel(status: VendorStatus): string {
  switch (status) {
    case 'invited-bafo':
      return 'invited BAFO';
    default:
      return status;
  }
}

function StatusPill({ status }: { status: VendorStatus }) {
  return (
    <span
      style={{
        ...statusPillStyle(status),
        display: 'inline-block',
        borderRadius: RADIUS.pill,
        padding: '2px 9px',
        fontFamily: SHELL.SANS,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
        textTransform: 'capitalize' as const,
        whiteSpace: 'nowrap' as const,
      }}
    >
      {statusLabel(status)}
    </span>
  );
}

// ─── Summary strip ────────────────────────────────────────────────────────────

function SummaryCapsule({ label, value }: { label: string; value: string | number }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        gap: 2,
        padding: `${SPACING.sm} ${SPACING.md}`,
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.md,
        minWidth: 90,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: `${COLORS.ink}88`,
          fontWeight: 600,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 24,
          color: COLORS.ink,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}
      >
        {value}
      </span>
    </div>
  );
}

function SummaryStrip({ data }: { data: TrackerData }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: SPACING.sm,
        alignItems: 'stretch',
      }}
    >
      <SummaryCapsule label="Unique vendors" value={data.totalUnique} />
      <SummaryCapsule label="Participations" value={data.totalParticipations} />
      <SummaryCapsule label="Selected" value={data.statusCounts.selected} />
      <SummaryCapsule label="Invited BAFO" value={data.statusCounts['invited-bafo']} />
      <SummaryCapsule label="Shortlisted" value={data.statusCounts.shortlisted} />
      <SummaryCapsule label="Active" value={data.statusCounts.active} />
      <SummaryCapsule label="Declined" value={data.statusCounts.declined} />
      <SummaryCapsule
        label="Disqualified"
        value={data.statusCounts.disqualified}
      />
    </div>
  );
}

// ─── Status distribution pills bar ───────────────────────────────────────────

function StatusDistribution({ statusCounts }: { statusCounts: TrackerData['statusCounts'] }) {
  const entries: Array<[VendorStatus, number]> = [
    ['selected', statusCounts.selected],
    ['invited-bafo', statusCounts['invited-bafo']],
    ['shortlisted', statusCounts.shortlisted],
    ['active', statusCounts.active],
    ['declined', statusCounts.declined],
    ['disqualified', statusCounts.disqualified],
  ];

  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexWrap: 'wrap' as const,
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: `${COLORS.ink}99`,
          fontWeight: 600,
          flexShrink: 0,
        }}
      >
        Status distribution
      </span>
      <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: SPACING.sm }}>
        {entries.map(([status, count]) =>
          count > 0 ? (
            <span
              key={status}
              style={{
                ...statusPillStyle(status),
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                borderRadius: RADIUS.pill,
                padding: '4px 12px',
                fontFamily: SHELL.SANS,
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {statusLabel(status)}
              <span
                style={{
                  background: 'rgba(0,0,0,0.12)',
                  borderRadius: RADIUS.pill,
                  padding: '1px 6px',
                  fontSize: 10,
                  fontFamily: SHELL.MONO,
                  fontWeight: 700,
                }}
              >
                {count}
              </span>
            </span>
          ) : null,
        )}
      </div>
    </div>
  );
}

// ─── Vendor table ─────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}0e`,
  verticalAlign: 'top',
};

function VendorTable({ vendors }: { vendors: VendorRow[] }) {
  if (vendors.length === 0) {
    return (
      <div
        style={{
          padding: SPACING.xl,
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          color: `${COLORS.ink}88`,
          textAlign: 'center',
        }}
      >
        No vendor data found across source event instances.
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
        <thead>
          <tr>
            <th style={HEADER_CELL}>Vendor</th>
            <th style={HEADER_CELL}>Participations</th>
            <th style={HEADER_CELL}>Events &amp; status</th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((vendor) => (
            <tr key={vendor.key}>
              {/* Vendor name */}
              <td
                style={{
                  ...BODY_CELL,
                  fontWeight: 700,
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {vendor.name}
              </td>

              {/* Participation count badge */}
              <td style={{ ...BODY_CELL, whiteSpace: 'nowrap' as const }}>
                <span
                  style={{
                    display: 'inline-block',
                    background: SHELL.GRAY_BG,
                    color: SHELL.INK_SOFT,
                    border: `1px solid ${SHELL.GRAY_LINE}`,
                    borderRadius: RADIUS.pill,
                    padding: '2px 10px',
                    fontFamily: SHELL.MONO,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {vendor.slots.length}
                </span>
              </td>

              {/* Event rows with status pills */}
              <td style={{ ...BODY_CELL }}>
                <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                  {vendor.slots.map((slot) => (
                    <div
                      key={`${slot.instanceId}-${slot.status}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: SPACING.sm,
                        flexWrap: 'wrap' as const,
                      }}
                    >
                      <StatusPill status={slot.status} />
                      <span
                        style={{
                          fontFamily: SHELL.MONO,
                          fontSize: 11,
                          color: SHELL.INK_MUTED,
                        }}
                      >
                        {slot.instanceName}
                      </span>
                      {slot.pricingBand !== null && (
                        <span
                          style={{
                            fontFamily: SHELL.MONO,
                            fontSize: 10,
                            color: SHELL.INK_MUTED,
                            opacity: 0.7,
                          }}
                        >
                          · {slot.pricingBand} price
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorTrackerPage() {
  const data = buildTrackerData();

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
        eyebrow="Reasoning · Admin"
        title="Vendor tracker"
        subtitle="All vendor participants across source events with selection status."
      >
        <SummaryStrip data={data} />
        <StatusDistribution statusCounts={data.statusCounts} />

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
                All vendors
              </h2>
              <div
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}88`,
                  marginTop: 2,
                }}
              >
                Sorted by selection status — selected first, declined last
              </div>
            </div>
            <span
              style={{
                fontFamily: SHELL.MONO,
                fontSize: 11,
                color: `${COLORS.ink}88`,
              }}
            >
              {data.totalUnique} vendor{data.totalUnique === 1 ? '' : 's'} · {data.totalParticipations} participation{data.totalParticipations === 1 ? '' : 's'}
            </span>
          </header>
          <VendorTable vendors={data.vendors} />
        </section>
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
