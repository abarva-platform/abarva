// /admin/reasoning/evidence-timeline — Chronological evidence ingestion log.
//
// Pure server component. Collects all evidence items from the in-memory
// ingestion store for every SOURCE_EVENT_INSTANCE, flattens them into a single
// timeline sorted newest-first, and groups by calendar day.
//
// Data is ephemeral — the store resets on process restart.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Evidence timeline · AbarVa Admin',
};

// ─── Data model ────────────────────────────────────────────────────────────────

interface IngestionRecord {
  instanceId: string;
  instanceName: string;
  stage: string;
  evidenceType: string;
  payload: string;
  ingestedAt: string; // ISO timestamp
  day: string;        // YYYY-MM-DD prefix
}

// ─── Data derivation ──────────────────────────────────────────────────────────

function extractField(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const val = item[key];
    if (typeof val === 'string' && val.length > 0) return val;
  }
  return '—';
}

function buildIngestionRecords(): IngestionRecord[] {
  const records: IngestionRecord[] = [];

  for (const inst of SOURCE_EVENT_INSTANCES) {
    const items = getEvidenceFor(inst.id);
    const timestamps = getEvidenceTimestampsFor(inst.id);

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const ingestedAt = timestamps[i] ?? new Date().toISOString();
      const day = ingestedAt.slice(0, 10); // YYYY-MM-DD

      const stage = extractField(item, ['stage', 'currentStage', 'stageId']);
      const evidenceType = extractField(item, ['kind', 'type', 'evidenceType', 'field']);

      // Build a readable payload preview from the item
      const payload = buildPayloadPreview(item);

      records.push({
        instanceId: inst.id,
        instanceName: inst.name,
        stage,
        evidenceType,
        payload,
        ingestedAt,
        day,
      });
    }
  }

  // Sort newest first
  records.sort((a, b) => b.ingestedAt.localeCompare(a.ingestedAt));
  return records;
}

function buildPayloadPreview(item: Record<string, unknown>): string {
  // Try a few natural serialisations
  const value = item['value'];
  if (typeof value === 'string') {
    return truncate(`value: ${value}`, 80);
  }
  if (value !== undefined) {
    return truncate(`value: ${JSON.stringify(value)}`, 80);
  }
  // Fall back to a compact JSON of the item
  try {
    return truncate(JSON.stringify(item), 80);
  } catch {
    return '(unserializable)';
  }
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

interface DayGroup {
  day: string;   // YYYY-MM-DD
  label: string; // e.g. "Wed 29 Apr 2026"
  records: IngestionRecord[];
}

function groupByDay(records: IngestionRecord[]): DayGroup[] {
  const map = new Map<string, IngestionRecord[]>();
  for (const r of records) {
    const list = map.get(r.day) ?? [];
    list.push(r);
    map.set(r.day, list);
  }
  // Sort days descending
  const sorted = Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  return sorted.map(([day, recs]) => ({
    day,
    label: formatDay(day),
    records: recs,
  }));
}

function formatDay(yyyyMMDD: string): string {
  const d = new Date(`${yyyyMMDD}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return yyyyMMDD;
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTHS = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  return `${WEEKDAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(11, 19) + 'Z';
}

// ─── Cell styles ──────────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left' as const,
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
  verticalAlign: 'top' as const,
};

const MONO_CELL: React.CSSProperties = {
  ...BODY_CELL,
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
};

// ─── Stage pill ───────────────────────────────────────────────────────────────

function StagePill({ stage }: { stage: string }) {
  const isEmpty = stage === '—';
  return (
    <span
      style={{
        display: 'inline-block',
        background: isEmpty ? `${COLORS.ink}08` : COLORS.skyPale,
        color: isEmpty ? `${COLORS.ink}66` : COLORS.navy,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        fontWeight: isEmpty ? 400 : 600,
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {stage}
    </span>
  );
}

// ─── Summary strip ─────────────────────────────────────────────────────────────

function SummaryStrip({
  ingestionCount,
  instanceCount,
}: {
  ingestionCount: number;
  instanceCount: number;
}) {
  return (
    <div
      style={{
        background: COLORS.skyPale,
        border: `1px solid ${COLORS.navy}22`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.lg,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.navy,
        }}
      >
        {ingestionCount} ingestion{ingestionCount === 1 ? '' : 's'}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}88`,
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.ink}99`,
        }}
      >
        across {instanceCount} instance{instanceCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}

// ─── Empty state banner ────────────────────────────────────────────────────────

function EmptyBanner() {
  return (
    <div
      style={{
        background: COLORS.mintSoft,
        border: `1px solid ${COLORS.mintInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 14,
          fontWeight: 600,
          color: COLORS.mintInk,
        }}
      >
        No evidence ingested yet
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.mintInk}aa`,
        }}
      >
        — use the Evidence Ingest tool to add some
      </span>
    </div>
  );
}

// ─── Day section ──────────────────────────────────────────────────────────────

function DaySection({ group }: { group: DayGroup }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Day header */}
      <header
        style={{
          padding: `${SPACING.sm} ${SPACING.lg}`,
          background: `${COLORS.ink}06`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 15,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
          }}
        >
          {group.label}
        </span>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}66`,
          }}
        >
          {group.records.length} ingestion{group.records.length === 1 ? '' : 's'}
        </span>
      </header>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 720 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Evidence type</th>
              <th style={HEADER_CELL}>Payload preview</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' as const }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {group.records.map((rec, idx) => {
              return (
                <tr
                  key={idx}
                  style={{ background: idx % 2 === 0 ? COLORS.white : `${COLORS.ink}02` }}
                >
                  <td
                    style={{
                      ...BODY_CELL,
                      fontWeight: 500,
                      maxWidth: 200,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={rec.instanceId}
                  >
                    {rec.instanceName}
                  </td>
                  <td style={BODY_CELL}>
                    <StagePill stage={rec.stage} />
                  </td>
                  <td style={MONO_CELL}>{rec.evidenceType}</td>
                  <td
                    style={{
                      ...BODY_CELL,
                      maxWidth: 360,
                      color: `${COLORS.ink}cc`,
                      fontFamily: TYPOGRAPHY.mono,
                      fontSize: 11,
                      wordBreak: 'break-all',
                    }}
                    title={rec.payload}
                  >
                    {rec.payload}
                  </td>
                  <td
                    style={{
                      ...MONO_CELL,
                      textAlign: 'right' as const,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {formatTime(rec.ingestedAt)}
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

export default function EvidenceTimelinePage() {
  const allRecords = buildIngestionRecords();
  const groups = groupByDay(allRecords);

  const instanceCount = new Set(allRecords.map((r) => r.instanceId)).size;

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open Evidence Ingest"
          primaryActionHref="/admin/reasoning/evidence-ingest"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Evidence timeline"
        subtitle="Chronological log of all evidence ingestions across instances — grouped by day. Resets on server restart."
      >
        <SummaryStrip
          ingestionCount={allRecords.length}
          instanceCount={instanceCount}
        />

        {allRecords.length === 0 ? (
          <EmptyBanner />
        ) : (
          groups.map((group, gIdx) => {
            return <DaySection key={gIdx} group={group} />;
          })
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
