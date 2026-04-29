// /admin/reasoning/waiver-log — Active gate waiver log.
//
// Server component. Reads the in-memory waiver store directly (no HTTP round-
// trip needed), cross-references gate criteria from all lifecycle patterns to
// enrich each entry with description and gateType, then renders an operator
// table grouped by instance. Resets on server restart — purely ephemeral.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { getAllLifecyclePatterns } from '@/lib/reasoning/lifecycle-pattern-lookup';
import type { GateType } from '@/lib/intelligence/seed-types';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver log · AbarVa Admin',
};

// ─── Data helpers ─────────────────────────────────────────────────────────────

interface CriterionMeta {
  description: string;
  gateType: GateType;
}

/** Build a Map from criterionId → { description, gateType } across all patterns. */
function buildCriterionIndex(): Map<string, CriterionMeta> {
  const index = new Map<string, CriterionMeta>();
  for (const pattern of getAllLifecyclePatterns()) {
    for (const criterion of pattern.gateCriteria) {
      if (!index.has(criterion.id)) {
        index.set(criterion.id, {
          description: criterion.description,
          gateType: criterion.gateType,
        });
      }
    }
  }
  return index;
}

interface EnrichedWaiver {
  instanceId: string;
  criterionId: string;
  description: string;
  gateType: GateType | 'unknown';
  reason: string;
  waivedAt: string;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(11, 19) + 'Z';
}

function truncate(text: string, max = 80): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
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

function GateTypePill({ gateType }: { gateType: GateType | 'unknown' }) {
  if (gateType === 'hard') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.coralSoft,
          color: COLORS.coralInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        hard
      </span>
    );
  }
  if (gateType === 'soft') {
    return (
      <span
        style={{
          display: 'inline-block',
          background: COLORS.amberSoft,
          color: COLORS.amberInk,
          borderRadius: RADIUS.pill,
          padding: '2px 10px',
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 11,
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        soft
      </span>
    );
  }
  return (
    <span
      style={{
        fontFamily: TYPOGRAPHY.mono,
        fontSize: 11,
        color: `${COLORS.ink}66`,
      }}
    >
      —
    </span>
  );
}

function AllClearBanner() {
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
        No gate waivers are currently active.
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.mintInk}aa`,
        }}
      >
        The in-memory store is empty.
      </span>
    </div>
  );
}

function SummaryStrip({
  waiverCount,
  instanceCount,
}: {
  waiverCount: number;
  instanceCount: number;
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
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          fontWeight: 600,
          color: COLORS.ink,
        }}
      >
        {waiverCount} active waiver{waiverCount === 1 ? '' : 's'}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 11,
          color: `${COLORS.ink}66`,
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

function InstanceSection({
  instanceId,
  waivers,
}: {
  instanceId: string;
  waivers: EnrichedWaiver[];
}) {
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
            fontSize: 18,
            color: COLORS.ink,
            margin: 0,
            letterSpacing: '-0.01em',
          }}
        >
          {instanceId}
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          {waivers.length} waiver{waivers.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 780 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Criterion ID</th>
              <th style={HEADER_CELL}>Description</th>
              <th style={HEADER_CELL}>Type</th>
              <th style={HEADER_CELL}>Reason</th>
              <th style={HEADER_CELL}>Applied</th>
            </tr>
          </thead>
          <tbody>
            {waivers.map((w) => (
              <tr key={w.criterionId}>
                <td style={MONO_CELL}>{w.criterionId}</td>
                <td style={BODY_CELL}>
                  {w.description !== w.criterionId ? (
                    w.description
                  ) : (
                    <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}66` }}>
                      unknown criterion
                    </span>
                  )}
                </td>
                <td style={BODY_CELL}>
                  <GateTypePill gateType={w.gateType} />
                </td>
                <td
                  style={{
                    ...BODY_CELL,
                    maxWidth: 320,
                    color: `${COLORS.ink}cc`,
                  }}
                  title={w.reason}
                >
                  {truncate(w.reason)}
                </td>
                <td style={MONO_CELL}>{formatTime(w.waivedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiverLogPage() {
  const criterionIndex = buildCriterionIndex();

  const raw = getWaivers();

  // Enrich each waiver with criterion meta
  const enriched: EnrichedWaiver[] = raw.map((w) => {
    const meta = criterionIndex.get(w.criterionId);
    return {
      ...w,
      description: meta?.description ?? w.criterionId,
      gateType: meta?.gateType ?? 'unknown',
    };
  });

  // Sort by waivedAt desc within each instance
  enriched.sort((a, b) => b.waivedAt.localeCompare(a.waivedAt));

  // Group by instanceId preserving order of first appearance
  const instanceOrder: string[] = [];
  const byInstance = new Map<string, EnrichedWaiver[]>();
  for (const w of enriched) {
    if (!byInstance.has(w.instanceId)) {
      instanceOrder.push(w.instanceId);
      byInstance.set(w.instanceId, []);
    }
    byInstance.get(w.instanceId)!.push(w);
  }

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open bulk waiver"
          primaryActionHref="/admin/reasoning/bulk-waiver"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Admin"
        title="Waiver log"
        subtitle="All gate criterion waivers currently active in the in-memory store. Resets on server restart."
      >
        <SummaryStrip
          waiverCount={enriched.length}
          instanceCount={instanceOrder.length}
        />

        {enriched.length === 0 ? (
          <AllClearBanner />
        ) : (
          instanceOrder.map((instanceId) => (
            <InstanceSection
              key={instanceId}
              instanceId={instanceId}
              waivers={byInstance.get(instanceId)!}
            />
          ))
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
