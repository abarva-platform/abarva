// /admin/reasoning/vendor-responses — Vendor response viewer.
//
// Server component. Collects all VendorResponse records across
// SOURCE_EVENT_INSTANCES, groups them by source event instance, and renders
// a per-instance section with a completeness-colour-coded table.

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import type { VendorResponse } from '@/lib/source/source-event-instance';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Vendor responses · AbarVa Admin',
};

// ─── Data model ───────────────────────────────────────────────────────────────

interface EnrichedResponse {
  response: VendorResponse;
  vendorName: string;
  /** Synthetic completeness 0–100 derived from status + claims coverage */
  completeness: number;
}

interface InstanceGroup {
  instanceId: string;
  instanceName: string;
  responses: EnrichedResponse[];
  avgCompleteness: number;
}

interface PageData {
  groups: InstanceGroup[];
  totalResponses: number;
  globalAvgCompleteness: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Derive a synthetic completeness score (0–100) from the VendorResponse fields.
 * The VendorResponse type has no explicit numeric completeness field, so we
 * infer it from:
 *   - status: accepted→100, under-review→70, received→50, declined→20
 *   - claim count: each claim adds up to +10 pts (capped at +30)
 */
function deriveCompleteness(r: VendorResponse): number {
  const statusBase: Record<VendorResponse['status'], number> = {
    accepted: 70,
    'under-review': 50,
    received: 35,
    declined: 10,
  };
  const base = statusBase[r.status];
  const claimsBonus = Math.min(r.claims.length * 10, 30);
  return Math.min(base + claimsBonus, 100);
}

function computeData(): PageData {
  const groups: InstanceGroup[] = [];
  let totalResponses = 0;
  let totalCompleteness = 0;

  for (const inst of SOURCE_EVENT_INSTANCES) {
    if (inst.responses.length === 0) continue;

    // Build a vendorId → name lookup from instance.vendors
    const vendorMap = new Map<string, string>(
      inst.vendors.map((v) => [v.id, v.name]),
    );

    const enriched: EnrichedResponse[] = inst.responses
      .map((r) => ({
        response: r,
        vendorName: vendorMap.get(r.vendorId) ?? r.vendorId,
        completeness: deriveCompleteness(r),
      }))
      // Sort descending completeness
      .sort((a, b) => b.completeness - a.completeness);

    const avg =
      enriched.reduce((sum, e) => sum + e.completeness, 0) / enriched.length;

    groups.push({
      instanceId: inst.id,
      instanceName: inst.name,
      responses: enriched,
      avgCompleteness: Math.round(avg),
    });

    totalResponses += enriched.length;
    totalCompleteness += avg * enriched.length;
  }

  // Sort groups: most responses first
  groups.sort((a, b) => b.responses.length - a.responses.length);

  const globalAvg =
    totalResponses === 0
      ? 0
      : Math.round(totalCompleteness / totalResponses);

  return { groups, totalResponses, globalAvgCompleteness: globalAvg };
}

// ─── Table cell styles ────────────────────────────────────────────────────────

const HEADER_CELL: React.CSSProperties = {
  fontFamily: TYPOGRAPHY.serif,
  fontSize: 13,
  fontWeight: 700,
  color: COLORS.ink,
  textAlign: 'left',
  padding: `${SPACING.sm} ${SPACING.md}`,
  borderBottom: `1px solid ${COLORS.ink}22`,
  letterSpacing: '0.01em',
  background: COLORS.white,
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

function SummaryStrip({
  total,
  avgCompleteness,
}: {
  total: number;
  avgCompleteness: number;
}) {
  return (
    <div
      style={{
        background: SHELL.CARD_WHITE,
        border: `1px solid ${SHELL.CARD_LINE}`,
        borderRadius: RADIUS.lg,
        padding: `${SPACING.md} ${SPACING.lg}`,
        display: 'flex',
        alignItems: 'baseline',
        gap: SPACING.md,
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          fontWeight: 600,
          color: SHELL.INK,
        }}
      >
        {total} total response{total === 1 ? '' : 's'}
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 12,
          color: SHELL.INK_SOFT,
        }}
      >
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 13,
          color: completenessColor(avgCompleteness),
          fontWeight: 600,
        }}
      >
        avg {avgCompleteness}% completeness
      </span>
    </div>
  );
}

function completenessColor(pct: number): string {
  if (pct >= 80) return SHELL.MINT_TEXT;
  if (pct >= 50) return SHELL.PEACH_TEXT;
  return SHELL.RUST_TEXT;
}

function completenessBg(pct: number): string {
  if (pct >= 80) return SHELL.MINT_BG;
  if (pct >= 50) return SHELL.PEACH_BG;
  return SHELL.RUST_BG;
}

function StatusPill({ status }: { status: VendorResponse['status'] }) {
  const palette =
    status === 'accepted'
      ? { bg: SHELL.MINT_BG, fg: SHELL.MINT_TEXT }
      : status === 'under-review'
        ? { bg: SHELL.BLUE_BG, fg: SHELL.INK_MID }
        : status === 'received'
          ? { bg: SHELL.GRAY_BG, fg: SHELL.GRAY_TEXT }
          : { bg: SHELL.RUST_BG, fg: SHELL.RUST_TEXT };

  return (
    <span
      style={{
        display: 'inline-block',
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {status}
    </span>
  );
}

function StageChip({ stageId }: { stageId: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: SHELL.GRAY_BG,
        color: SHELL.INK_MID,
        borderRadius: RADIUS.sm,
        padding: '2px 8px',
        fontFamily: SHELL.MONO,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.04em',
        border: `1px solid ${SHELL.GRAY_LINE}`,
      }}
    >
      {stageId}
    </span>
  );
}

function CompletenessCell({ pct }: { pct: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
      <div
        style={{
          width: 64,
          height: 6,
          borderRadius: 3,
          background: SHELL.GRAY_BG,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: completenessBg(pct),
            borderRight: `2px solid ${completenessColor(pct)}`,
            transition: 'width 0.2s ease',
          }}
        />
      </div>
      <span
        style={{
          fontFamily: TYPOGRAPHY.mono,
          fontSize: 12,
          color: completenessColor(pct),
          fontWeight: 600,
        }}
      >
        {pct}%
      </span>
    </div>
  );
}

function InstanceSection({ group }: { group: InstanceGroup; key?: string | number }) {
  return (
    <section
      style={{
        background: COLORS.white,
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      {/* Section header */}
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${COLORS.ink}10`,
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: SPACING.md,
          background: SHELL.CARD_WHITE,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <h2
            style={{
              fontFamily: TYPOGRAPHY.serif,
              fontSize: 18,
              color: COLORS.ink,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            {group.instanceName}
          </h2>
          <span
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: SHELL.INK_SOFT,
            }}
          >
            {group.instanceId}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.sm }}>
          {/* Response count badge */}
          <span
            style={{
              background: SHELL.BLUE_BG,
              color: SHELL.INK_MID,
              borderRadius: RADIUS.pill,
              padding: '3px 12px',
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              fontWeight: 700,
              border: `1px solid ${SHELL.BLUE_LINE}`,
            }}
          >
            {group.responses.length} response{group.responses.length === 1 ? '' : 's'}
          </span>
          {/* Avg completeness */}
          <span
            style={{
              background: completenessBg(group.avgCompleteness),
              color: completenessColor(group.avgCompleteness),
              borderRadius: RADIUS.pill,
              padding: '3px 12px',
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            avg {group.avgCompleteness}%
          </span>
        </div>
      </header>

      {/* Response table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 640 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Vendor</th>
              <th style={HEADER_CELL}>Stage</th>
              <th style={HEADER_CELL}>Status</th>
              <th style={HEADER_CELL}>Submitted at</th>
              <th style={HEADER_CELL}>Completeness</th>
            </tr>
          </thead>
          <tbody>
            {group.responses.map(({ response, vendorName, completeness }) => (
              <tr key={response.id}>
                <td style={{ ...BODY_CELL, fontWeight: 600 }}>{vendorName}</td>
                <td style={BODY_CELL}>
                  <StageChip stageId={response.stageId} />
                </td>
                <td style={BODY_CELL}>
                  <StatusPill status={response.status} />
                </td>
                <td style={MONO_CELL}>
                  {response.receivedAt.slice(0, 10)}
                </td>
                <td style={BODY_CELL}>
                  <CompletenessCell pct={completeness} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
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
      No vendor responses found across source event instances.
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function VendorResponsesPage() {
  const { groups, totalResponses, globalAvgCompleteness } = computeData();

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
        title="Vendor responses"
        subtitle="All vendor response submissions across source events."
      >
        <SummaryStrip
          total={totalResponses}
          avgCompleteness={globalAvgCompleteness}
        />

        {groups.length === 0 ? (
          <EmptyState />
        ) : (
          groups.map((group) => (
            // eslint-disable-next-line react/jsx-key
            <InstanceSection group={group} key={group.instanceId} />
          ))
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
