// /admin/reasoning/activity-feed
//
// Pure server component. Merges all recent system events — stage transitions,
// evidence ingestions, gate waivers, contradiction resolutions, and gate
// approvals — into a unified feed sorted by recency, styled as event cards.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SHELL } from '@/lib/shell/shell-tokens';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import {
  approvalAuditBuffer,
  waiverAuditBuffer,
} from '@/app/api/reasoning/audit/route';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import { getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Activity Feed · AbarVa Admin',
};

// ─── Types ─────────────────────────────────────────────────────────────────────

type FeedEventKind = 'stage' | 'evidence' | 'waiver' | 'resolution' | 'approval';

interface FeedEvent {
  id: string;
  kind: FeedEventKind;
  instanceId: string;
  instanceName: string;
  summary: string;
  actor: string;
  timestamp: string; // ISO-8601 or date string
}

// ─── Colour palette per event kind ────────────────────────────────────────────

const KIND_BORDER: Record<FeedEventKind, string> = {
  stage:      COLORS.navy,
  evidence:   COLORS.mintInk,
  waiver:     COLORS.amberInk,
  resolution: SHELL.INK_MUTED,
  approval:   '#2a6fd6',
};

const KIND_BG: Record<FeedEventKind, string> = {
  stage:      COLORS.skyPale,
  evidence:   COLORS.mintSoft,
  waiver:     COLORS.amberSoft,
  resolution: SHELL.GRAY_BG,
  approval:   '#deeaff',
};

const KIND_ICON: Record<FeedEventKind, string> = {
  stage:      '🔄',
  evidence:   '📄',
  waiver:     '⚡',
  resolution: '✅',
  approval:   '👍',
};

const KIND_LABEL: Record<FeedEventKind, string> = {
  stage:      'Stage transition',
  evidence:   'Evidence',
  waiver:     'Waiver',
  resolution: 'Resolution',
  approval:   'Approval',
};

// ─── Timestamp helpers ────────────────────────────────────────────────────────

/**
 * Derive a pseudo-deterministic timestamp offset from a string seed so that
 * events without a real ISO timestamp still appear to have plausible variation.
 * Returns an ISO string a bounded number of hours ago.
 */
function hashTimestamp(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) >>> 0;
  }
  // Spread across last 72 hours
  const offsetMs = (h % 72) * 3_600_000 + ((h >> 8) % 60) * 60_000;
  return new Date(Date.now() - offsetMs).toISOString();
}

function relativeTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const diffMs = Date.now() - d.getTime();
  if (diffMs < 0) return d.toISOString().slice(0, 10);

  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toISOString().slice(0, 10);
}

// ─── Data assembly ─────────────────────────────────────────────────────────────

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

function buildFeedEvents(): FeedEvent[] {
  const nameMap = buildInstanceNameMap();
  const events: FeedEvent[] = [];
  let seq = 0;

  // ── 1. Stage transitions ─────────────────────────────────────────────────
  for (const instance of SOURCE_EVENT_INSTANCES) {
    const hist = instance.stageHistory;
    for (let i = 0; i < hist.length; i++) {
      const t = hist[i];
      const prev = hist[i - 1];
      const from = prev ? prev.stageId : null;
      const summary = from
        ? `Advanced from ${from} to ${t.stageId}`
        : `Entered stage ${t.stageId}`;
      events.push({
        id: `stage-${instance.id}-${t.stageId}-${seq++}`,
        kind: 'stage',
        instanceId: instance.id,
        instanceName: instance.name,
        summary,
        actor: t.advancedBy,
        timestamp: t.enteredAt,
      });
    }
  }

  // ── 2. Evidence ingestions ───────────────────────────────────────────────
  const allInstances = [
    ...SOURCE_EVENT_INSTANCES,
    ...APEX_RETAIL_PROGRAM_INSTANCES,
  ];
  for (const inst of allInstances) {
    const items = getEvidenceFor(inst.id);
    const timestamps = getEvidenceTimestampsFor(inst.id);
    for (let i = 0; i < items.length; i++) {
      const item = items[i] as Record<string, unknown>;
      const gate =
        typeof item.field === 'string' ? item.field
        : typeof item.kind === 'string' ? item.kind
        : 'gate';
      const ts = timestamps[i] ?? hashTimestamp(`evidence-${inst.id}-${i}`);
      events.push({
        id: `evidence-${inst.id}-${i}-${seq++}`,
        kind: 'evidence',
        instanceId: inst.id,
        instanceName: nameMap.get(inst.id) ?? inst.id,
        summary: `Evidence ingested for ${gate} gate`,
        actor: typeof item.source === 'string' ? item.source : 'system',
        timestamp: ts,
      });
    }
  }

  // ── 3. Gate waivers (waiver store current state) ─────────────────────────
  for (const w of getWaivers()) {
    events.push({
      id: `waiver-store-${w.instanceId}-${w.criterionId}-${seq++}`,
      kind: 'waiver',
      instanceId: w.instanceId,
      instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
      summary: `Gate ${w.criterionId} waived`,
      actor: 'demo-user',
      timestamp: w.waivedAt,
    });
  }

  // ── 4. Waivers from the audit buffer (may have duplicates; dedupe by key) ─
  const seenWaiverKeys = new Set<string>();
  for (const w of waiverAuditBuffer) {
    const key = `${w.instanceId}::${w.criterionId}`;
    if (seenWaiverKeys.has(key)) continue;
    seenWaiverKeys.add(key);
    events.push({
      id: `waiver-buf-${w.instanceId}-${w.criterionId}-${seq++}`,
      kind: 'waiver',
      instanceId: w.instanceId,
      instanceName: nameMap.get(w.instanceId) ?? w.instanceId,
      summary: `Gate ${w.criterionId} waived`,
      actor: 'demo-user',
      timestamp: w.waivedAt,
    });
  }

  // ── 5. Contradiction resolutions ─────────────────────────────────────────
  for (const entry of getResolvedEntries()) {
    // ID format convention: "template::path" or just a raw ID
    const sep = entry.id.indexOf('::');
    const template = sep !== -1 ? entry.id.slice(0, sep) : entry.id;
    const path = sep !== -1 ? entry.id.slice(sep + 2) : 'default';
    events.push({
      id: `resolution-${entry.id}-${seq++}`,
      kind: 'resolution',
      instanceId: '',
      instanceName: 'System',
      summary: `Contradiction ${template} resolved via ${path}`,
      actor: 'operator',
      timestamp: entry.resolvedAt,
    });
  }

  // ── 6. Gate approvals from audit buffer ──────────────────────────────────
  for (const rec of approvalAuditBuffer) {
    if (rec.action !== 'approve') continue;
    events.push({
      id: `approval-${rec.instanceId}-${rec.criterionId}-${seq++}`,
      kind: 'approval',
      instanceId: rec.instanceId,
      instanceName: nameMap.get(rec.instanceId) ?? rec.instanceId,
      summary: `Gate advancement approved for ${rec.criterionId}`,
      actor: 'operator',
      timestamp: rec.actedAt,
    });
  }

  // ── Sort descending by timestamp ─────────────────────────────────────────
  events.sort((a, b) => {
    const ta = new Date(a.timestamp).getTime();
    const tb = new Date(b.timestamp).getTime();
    // Non-parseable timestamps go to end
    const validA = Number.isNaN(ta) ? 0 : ta;
    const validB = Number.isNaN(tb) ? 0 : tb;
    return validB - validA;
  });

  return events.slice(0, 50);
}

// ─── Components ────────────────────────────────────────────────────────────────

function FeedHeader({ count }: { count: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        gap: SPACING.sm,
        marginBottom: SPACING.md,
      }}
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 400,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
        }}
      >
        Activity Feed
      </h2>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: `${COLORS.ink}88`,
        }}
      >
        · {count} event{count === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function ActorBadge({ actor }: { actor: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        color: SHELL.INK_SOFT,
        background: SHELL.GRAY_BG,
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        letterSpacing: '0.02em',
        whiteSpace: 'nowrap',
      }}
    >
      {actor}
    </span>
  );
}

function KindBadge({ kind }: { kind: FeedEventKind }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 10,
        fontWeight: 600,
        color: KIND_BORDER[kind],
        background: KIND_BG[kind],
        borderRadius: RADIUS.pill,
        padding: '2px 8px',
        letterSpacing: '0.03em',
        whiteSpace: 'nowrap',
      }}
    >
      {KIND_LABEL[kind]}
    </span>
  );
}

function ActivityCard({ event }: { event: FeedEvent }) {
  const borderColor = KIND_BORDER[event.kind];
  const timeLabel = relativeTime(event.timestamp);

  return (
    <article
      style={{
        background: SHELL.CARD_WHITE,
        borderRadius: RADIUS.md,
        border: `1px solid ${COLORS.ink}12`,
        borderLeft: `3px solid ${borderColor}`,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xs,
      }}
    >
      {/* Top row: icon + summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: SPACING.sm,
        }}
      >
        <span
          style={{ fontSize: 16, lineHeight: 1.4, flexShrink: 0, marginTop: 1 }}
          role="img"
          aria-label={KIND_LABEL[event.kind]}
        >
          {KIND_ICON[event.kind]}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.ink,
              lineHeight: 1.4,
            }}
          >
            {event.instanceName !== 'System' ? (
              <a
                href={`/admin/reasoning/instances/${event.instanceId}`}
                style={{
                  color: COLORS.navy,
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                {event.instanceName}
              </a>
            ) : (
              <span style={{ color: SHELL.INK_SOFT }}>System</span>
            )}
          </span>
          <span
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              color: `${COLORS.ink}cc`,
              marginLeft: SPACING.xs,
            }}
          >
            — {event.summary}
          </span>
        </div>
      </div>

      {/* Bottom row: badges + timestamp */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          flexWrap: 'wrap',
          marginTop: 2,
        }}
      >
        <KindBadge kind={event.kind} />
        <ActorBadge actor={event.actor} />
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}55`,
            marginLeft: 'auto',
            whiteSpace: 'nowrap',
          }}
        >
          {timeLabel}
        </span>
      </div>
    </article>
  );
}

function FeedList({ events }: { events: FeedEvent[] }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.sm,
      }}
    >
      {events.map((event) => {
        const card = <ActivityCard event={event} />;
        return <div key={event.id}>{card}</div>;
      })}
    </div>
  );
}

function EmptyFeed() {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${COLORS.ink}12`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.xxl} ${SPACING.lg}`,
        textAlign: 'center',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 14,
        color: `${COLORS.ink}66`,
      }}
    >
      No recent activity. Trigger stage transitions, evidence ingestion, or gate waivers to see events here.
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function ActivityFeedPage() {
  const events = buildFeedEvents();

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="View instances"
          primaryActionHref="/admin/reasoning/instances"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Activity feed"
        subtitle="All recent system events — stage transitions, evidence, waivers, and resolutions — sorted by recency."
      >
        <FeedHeader count={events.length} />
        {events.length === 0 ? (
          <EmptyFeed />
        ) : (
          <FeedList events={events} />
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
