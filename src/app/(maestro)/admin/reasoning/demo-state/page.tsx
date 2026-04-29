// /admin/reasoning/demo-state — Demo control room.
//
// Server component. Reads every in-memory reasoning store directly (no HTTP
// round-trips) and renders a point-in-time view of all current state: gate
// waivers, contradiction resolutions, evidence ingestions, stage overrides,
// and the most-recent audit entries.
//
// Intentionally `force-dynamic` so each page load reflects the current
// in-process store state without any caching layer in the way.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getResolved, getResolvedEntries } from '@/lib/reasoning/contradiction-resolution-state';
import {
  getEvidenceFor,
  getEvidenceTimestampsFor,
} from '@/lib/reasoning/evidence-ingestion-store';
import {
  waiverAuditBuffer,
  approvalAuditBuffer,
  type AuditEntry,
  type AuditEntryType,
} from '@/app/api/reasoning/audit/route';
import { getResolvedEntries as getResolutionEntries } from '@/lib/reasoning/contradiction-resolution-state';
import { getRecentSynthesisEvents } from '@/lib/reasoning/synthesis-telemetry';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';
import { getStageOverride } from '@/lib/source/stage-overrides';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Demo state · AbarVa Admin',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace('T', ' ').slice(0, 19) + 'Z';
}

function truncate(text: string, max = 90): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─── Shared style primitives ──────────────────────────────────────────────────

const SECTION_CARD: React.CSSProperties = {
  background: COLORS.white,
  border: `1px solid ${COLORS.ink}14`,
  borderRadius: RADIUS.lg,
  overflow: 'hidden',
};

const SECTION_HEADER: React.CSSProperties = {
  padding: `${SPACING.md} ${SPACING.lg}`,
  borderBottom: `1px solid ${COLORS.ink}10`,
  display: 'flex',
  alignItems: 'baseline',
  gap: SPACING.sm,
};

const SECTION_TITLE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 18,
  fontWeight: 600,
  color: COLORS.ink,
  margin: 0,
  letterSpacing: '-0.01em',
};

const COUNT_BADGE: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  background: `${COLORS.ink}0e`,
  color: `${COLORS.ink}99`,
  borderRadius: RADIUS.pill,
  padding: '2px 10px',
  letterSpacing: '0.02em',
};

const SECTION_BODY: React.CSSProperties = {
  padding: `${SPACING.md} ${SPACING.lg}`,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const ENTRY_ROW: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.mono,
  fontSize: 11,
  color: `${COLORS.ink}cc`,
  padding: '3px 0',
  borderBottom: `1px solid ${COLORS.ink}08`,
  display: 'flex',
  gap: SPACING.sm,
  alignItems: 'baseline',
  flexWrap: 'wrap',
};

const NONE_LABEL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.sans,
  fontSize: 13,
  color: `${COLORS.ink}55`,
  fontStyle: 'italic',
  padding: `${SPACING.sm} 0`,
};

// ─── Components ───────────────────────────────────────────────────────────────

function AmberBanner() {
  return (
    <div
      style={{
        background: COLORS.amberSoft,
        border: `1px solid ${COLORS.amberInk}33`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: SPACING.md,
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 700,
          color: COLORS.amberInk,
          letterSpacing: '0.02em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Warning
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.amberInk,
          lineHeight: 1.5,
        }}
      >
        All state below is in-memory and resets on server restart. Use{' '}
        <a
          href="/admin/reasoning/demo-panel"
          style={{ color: COLORS.amberInk, fontWeight: 600 }}
        >
          Demo panel
        </a>{' '}
        to apply presets.
      </span>
    </div>
  );
}

function SectionCard({
  title,
  count,
  children,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div style={SECTION_CARD}>
      <header style={SECTION_HEADER}>
        <h2 style={SECTION_TITLE}>{title}</h2>
        <span style={COUNT_BADGE}>{count}</span>
      </header>
      <div style={SECTION_BODY}>{children}</div>
    </div>
  );
}

function NoneActive() {
  return <p style={NONE_LABEL}>None active</p>;
}

// ─── Gate waivers section ─────────────────────────────────────────────────────

function GateWaiversSection() {
  const waivers = getWaivers();
  return (
    <SectionCard title="Gate waivers" count={waivers.length}>
      {waivers.length === 0 ? (
        <NoneActive />
      ) : (
        waivers.map((w, i) => (
          <div key={i} style={ENTRY_ROW}>
            <span style={{ color: `${COLORS.ink}88` }}>{w.criterionId}</span>
            <span style={{ color: `${COLORS.ink}55` }}>·</span>
            <span>{w.instanceId}</span>
            {w.reason ? (
              <>
                <span style={{ color: `${COLORS.ink}55` }}>·</span>
                <span style={{ color: `${COLORS.ink}88`, fontStyle: 'italic' }}>
                  {truncate(w.reason, 60)}
                </span>
              </>
            ) : null}
            <span style={{ marginLeft: 'auto', color: `${COLORS.ink}55`, whiteSpace: 'nowrap' }}>
              {formatTimestamp(w.waivedAt)}
            </span>
          </div>
        ))
      )}
    </SectionCard>
  );
}

// ─── Contradiction resolutions section ───────────────────────────────────────

function ContradictionResolutionsSection() {
  const entries = getResolutionEntries();
  return (
    <SectionCard title="Contradiction resolutions" count={entries.length}>
      {entries.length === 0 ? (
        <NoneActive />
      ) : (
        entries.map((e) => (
          <div key={e.id} style={ENTRY_ROW}>
            <span>{e.id}</span>
            <span style={{ marginLeft: 'auto', color: `${COLORS.ink}55`, whiteSpace: 'nowrap' }}>
              {formatTimestamp(e.resolvedAt)}
            </span>
          </div>
        ))
      )}
    </SectionCard>
  );
}

// ─── Evidence ingestions section ──────────────────────────────────────────────

function EvidenceIngestionsSection() {
  // Collect all known instance IDs from both source event and program instances
  const allInstanceIds: string[] = [
    ...SOURCE_EVENT_INSTANCES.map((i) => i.id),
    ...APEX_RETAIL_PROGRAM_INSTANCES.map((i) => i.id),
  ];

  type EvidenceGroup = { instanceId: string; count: number; timestamps: string[] };
  const groups: EvidenceGroup[] = [];
  let totalCount = 0;

  for (const instanceId of allInstanceIds) {
    const items = getEvidenceFor(instanceId);
    if (items.length > 0) {
      const ts = getEvidenceTimestampsFor(instanceId);
      groups.push({ instanceId, count: items.length, timestamps: ts });
      totalCount += items.length;
    }
  }

  return (
    <SectionCard title="Evidence ingestions" count={totalCount}>
      {groups.length === 0 ? (
        <NoneActive />
      ) : (
        groups.map((g) => (
          <div key={g.instanceId} style={{ marginBottom: 6 }}>
            <div
              style={{
                fontFamily: TYPOGRAPHY.sans,
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.ink,
                marginBottom: 3,
              }}
            >
              {g.instanceId}
              <span
                style={{
                  marginLeft: 8,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  fontWeight: 400,
                  color: `${COLORS.ink}88`,
                }}
              >
                {g.count} item{g.count === 1 ? '' : 's'}
              </span>
            </div>
            {g.timestamps.map((ts, i) => (
              <div key={i} style={{ ...ENTRY_ROW, paddingLeft: 12 }}>
                <span style={{ color: `${COLORS.ink}55` }}>item {i + 1}</span>
                <span style={{ marginLeft: 'auto', color: `${COLORS.ink}55`, whiteSpace: 'nowrap' }}>
                  {formatTimestamp(ts)}
                </span>
              </div>
            ))}
          </div>
        ))
      )}
    </SectionCard>
  );
}

// ─── Stage overrides section ──────────────────────────────────────────────────

function StageOverridesSection() {
  const allInstanceIds: string[] = SOURCE_EVENT_INSTANCES.map((i) => i.id);

  type Override = { instanceId: string; stage: string };
  const overrides: Override[] = [];

  for (const instanceId of allInstanceIds) {
    const stage = getStageOverride(instanceId);
    if (stage !== undefined) {
      overrides.push({ instanceId, stage });
    }
  }

  return (
    <SectionCard title="Stage overrides" count={overrides.length}>
      {overrides.length === 0 ? (
        <NoneActive />
      ) : (
        overrides.map((o) => (
          <div key={o.instanceId} style={ENTRY_ROW}>
            <span>{o.instanceId}</span>
            <span style={{ color: `${COLORS.ink}55` }}>→</span>
            <span
              style={{
                background: COLORS.skyPale,
                borderRadius: RADIUS.pill,
                padding: '1px 8px',
                color: COLORS.navy,
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 11,
              }}
            >
              {o.stage}
            </span>
          </div>
        ))
      )}
    </SectionCard>
  );
}

// ─── Audit trail section ──────────────────────────────────────────────────────

const AUDIT_TYPE_LABELS: Record<AuditEntryType, string> = {
  gate_waiver: 'waiver',
  gate_approval: 'approval',
  gate_reject: 'reject',
  contradiction_resolved: 'resolved',
  synthesis_feedback: 'feedback',
};

const AUDIT_TYPE_COLORS: Record<AuditEntryType, { bg: string; ink: string }> = {
  gate_waiver: { bg: COLORS.amberSoft, ink: COLORS.amberInk },
  gate_approval: { bg: COLORS.mintSoft, ink: COLORS.mintInk },
  gate_reject: { bg: COLORS.coralSoft, ink: COLORS.coralInk },
  contradiction_resolved: { bg: COLORS.skyPale, ink: COLORS.navy },
  synthesis_feedback: { bg: `${COLORS.ink}0e`, ink: `${COLORS.ink}cc` },
};

function buildLiveAuditEntries(): AuditEntry[] {
  const entries: AuditEntry[] = [];

  for (const w of waiverAuditBuffer) {
    entries.push({
      id: `waiver::${w.instanceId}::${w.criterionId}`,
      type: 'gate_waiver',
      actor: 'demo-user',
      instanceId: w.instanceId,
      detail: `Gate criterion "${w.criterionId}" waived — ${w.reason}`,
      timestamp: w.waivedAt,
    });
  }

  for (const record of approvalAuditBuffer) {
    entries.push({
      id: `approval_${record.instanceId}_${record.criterionId}_${record.action}`,
      type: record.action === 'approve' ? 'gate_approval' : 'gate_reject',
      actor: 'demo-user',
      instanceId: record.instanceId,
      detail: `Gate criterion "${record.criterionId}" ${record.action === 'approve' ? 'approved' : 'rejected'} — ${record.justification}`,
      timestamp: record.actedAt,
    });
  }

  for (const r of getResolutionEntries()) {
    const parts = r.id.split('::');
    const instanceId = parts.length >= 2 ? parts[0] : 'unknown';
    const templateId = parts.length >= 2 ? parts.slice(1).join('::') : r.id;
    entries.push({
      id: `resolved::${r.id}`,
      type: 'contradiction_resolved',
      actor: 'demo-user',
      instanceId,
      detail: `Contradiction "${templateId}" marked resolved`,
      timestamp: r.resolvedAt,
    });
  }

  const feedbackEvents = getRecentSynthesisEvents(500).filter(
    (e) => e.feedback !== undefined,
  );
  for (const e of feedbackEvents) {
    entries.push({
      id: `feedback::${e.id}`,
      type: 'synthesis_feedback',
      actor: 'demo-user',
      instanceId: e.instanceId,
      detail: `Synthesis feedback: thumbs-${e.feedback} on synthesis event ${e.id}`,
      timestamp: e.feedbackTimestamp ?? e.timestamp,
    });
  }

  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

function AuditTrailSection() {
  const entries = buildLiveAuditEntries().slice(0, 10);

  return (
    <SectionCard title="Audit trail" count={entries.length}>
      {entries.length === 0 ? (
        <NoneActive />
      ) : (
        entries.map((e) => {
          const palette = AUDIT_TYPE_COLORS[e.type];
          const label = AUDIT_TYPE_LABELS[e.type];
          return (
            <div key={e.id} style={ENTRY_ROW}>
              <span
                style={{
                  background: palette.bg,
                  color: palette.ink,
                  borderRadius: RADIUS.pill,
                  padding: '1px 8px',
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  fontFamily: TYPOGRAPHY.sans,
                }}
              >
                {label}
              </span>
              <span style={{ color: `${COLORS.ink}88` }}>{e.instanceId}</span>
              <span style={{ color: `${COLORS.ink}55` }}>·</span>
              <span style={{ color: `${COLORS.ink}cc` }}>{truncate(e.detail)}</span>
              <span style={{ marginLeft: 'auto', color: `${COLORS.ink}55`, whiteSpace: 'nowrap' }}>
                {formatTimestamp(e.timestamp)}
              </span>
            </div>
          );
        })
      )}
    </SectionCard>
  );
}

// ─── Quick actions footer ─────────────────────────────────────────────────────

const QUICK_LINKS: Array<{ label: string; href: string }> = [
  { label: 'Demo panel', href: '/admin/reasoning/demo-panel' },
  { label: 'Bulk waiver', href: '/admin/reasoning/bulk-waiver' },
  { label: 'Evidence ingest', href: '/admin/reasoning/evidence-ingest' },
  { label: 'Resolution log', href: '/admin/reasoning/resolution-log' },
];

function QuickActions() {
  return (
    <div
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          fontWeight: 700,
          color: `${COLORS.ink}88`,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
        }}
      >
        Quick actions
      </span>
      {QUICK_LINKS.map((link) => (
        <a
          key={link.href}
          href={link.href}
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 13,
            fontWeight: 600,
            color: COLORS.navy,
            background: COLORS.skyPale,
            borderRadius: RADIUS.pill,
            padding: '4px 14px',
            textDecoration: 'none',
            letterSpacing: '0.01em',
          }}
        >
          {link.label}
        </a>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DemoStatePage() {
  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open demo panel"
          primaryActionHref="/admin/reasoning/demo-panel"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Demo state"
        subtitle="Current state of all in-memory stores — waivers, resolutions, evidence ingestions, stage overrides, and audit trail."
      >
        <AmberBanner />

        <GateWaiversSection />
        <ContradictionResolutionsSection />
        <EvidenceIngestionsSection />
        <StageOverridesSection />
        <AuditTrailSection />

        <QuickActions />
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
