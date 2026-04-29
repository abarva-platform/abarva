// /admin/reasoning/audit — Reasoning Audit Trail
//
// Server component. Fetches the aggregated audit log from the in-memory stores
// via GET /api/reasoning/audit and renders it as a table. Never empty: the API
// route pre-seeds 5–8 demo entries.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import type { AuditEntry, AuditEntryType } from '@/app/api/reasoning/audit/route';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Reasoning Audit Trail · AbarVa Admin',
};

// ─── Data fetching ────────────────────────────────────────────────────────────

async function fetchAuditEntries(): Promise<AuditEntry[]> {
  // Intra-process call — no network hop in the Node.js dev/prod server.
  const { GET } = await import('@/app/api/reasoning/audit/route');
  const response = await GET();
  const data: unknown = await response.json();
  if (!Array.isArray(data)) return [];
  return data as AuditEntry[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function sevenDaysAgo(): number {
  return Date.now() - 7 * 86_400_000;
}

// ─── Type badge ───────────────────────────────────────────────────────────────

type BadgePalette = { bg: string; fg: string; label: string };

function typeBadgePalette(type: AuditEntryType): BadgePalette {
  switch (type) {
    case 'gate_waiver':
      return { bg: COLORS.amberSoft, fg: COLORS.amberInk, label: 'Gate waiver' };
    case 'gate_approval':
      return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Gate approved' };
    case 'gate_reject':
      return { bg: COLORS.coralSoft, fg: COLORS.coralInk, label: 'Gate rejected' };
    case 'contradiction_resolved':
      return { bg: COLORS.mintSoft, fg: COLORS.mintInk, label: 'Contradiction resolved' };
    case 'synthesis_feedback':
      return { bg: COLORS.skyPale, fg: COLORS.navy, label: 'Synthesis feedback' };
  }
}

function TypeBadge({ type }: { type: AuditEntryType }) {
  const { bg, fg, label } = typeBadgePalette(type);
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color: fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        letterSpacing: '0.02em',
      }}
    >
      {label}
    </span>
  );
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
};

const BODY_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 12,
  color: COLORS.ink,
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  verticalAlign: 'top',
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function SummaryCard({ count }: { count: number }) {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: SPACING.lg,
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        gap: SPACING.md,
      }}
    >
      <div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            fontWeight: 600,
          }}
        >
          Reasoning Audit Trail
        </div>
        <div
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 28,
            color: COLORS.ink,
            marginTop: 4,
            letterSpacing: '-0.01em',
            lineHeight: 1.1,
          }}
        >
          {count} action{count === 1 ? '' : 's'} in the last 7 days
        </div>
      </div>
      <div
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: `${COLORS.ink}99`,
        }}
      >
        Simulated · in-memory stores
      </div>
    </div>
  );
}

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
        lineHeight: 1.5,
      }}
    >
      No reasoning actions recorded yet
    </div>
  );
}

function AuditTable({ entries }: { entries: AuditEntry[] }) {
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
          Action log
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {entries.length} entr{entries.length === 1 ? 'y' : 'ies'} · newest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Timestamp</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Detail</th>
              <th style={HEADER_CELL}>Actor</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td style={MONO_CELL}>{formatTimestamp(entry.timestamp)}</td>
                <td style={BODY_CELL}>
                  <TypeBadge type={entry.type} />
                </td>
                <td style={MONO_CELL}>{entry.instanceId}</td>
                <td style={BODY_CELL}>{entry.detail}</td>
                <td style={MONO_CELL}>{entry.actor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ReasoningAuditPage() {
  const allEntries = await fetchAuditEntries();

  const cutoff = sevenDaysAgo();
  const recentCount = allEntries.filter(
    (e) => new Date(e.timestamp).getTime() >= cutoff,
  ).length;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Reasoning dashboard"
          primaryActionHref="/admin/reasoning"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Reasoning Audit Trail"
        subtitle="A log of all reasoning actions taken — gate waivers, contradiction resolutions, and synthesis feedback signals. Simulated demo data; resets on server restart."
      >
        <SummaryCard count={recentCount} />
        {allEntries.length === 0 ? (
          <EmptyState />
        ) : (
          <AuditTable entries={allEntries} />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
