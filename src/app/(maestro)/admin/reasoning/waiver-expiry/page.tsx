// /admin/reasoning/waiver-expiry — Gate waiver age tracking.
//
// Pure server component. Loads all active gate waivers, enriches each with an
// age (days since granted), categorises as fresh (<7 d), aging (7–30 d), or
// stale (>30 d), and surfaces a review card for anything past the 30-day mark.
//
// Today = 2026-04-29 (hardcoded for demo determinism).

import { AdminCanonShellV2 } from '@/components/admin/AdminCanonShellV2';
import { EditorialCanvas } from '@/components/admin/EditorialCanvas';
import { AgentRail } from '@/components/admin/AgentRail';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { getWaivers } from '@/app/api/reasoning/gate-waiver/route';
import { waiverAuditBuffer } from '@/app/api/reasoning/audit/route';
import { SOURCE_EVENT_INSTANCES } from '@/lib/source/source-event-instances';
import { APEX_RETAIL_PROGRAM_INSTANCES } from '@/lib/programs/program-instances';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Waiver expiry · AbarVa Admin',
};

// ─── Constants ────────────────────────────────────────────────────────────────

/** Demo anchor date. */
const TODAY = new Date('2026-04-29T00:00:00Z');

/** ms per day */
const MS_PER_DAY = 86_400_000;

type AgeCategory = 'fresh' | 'aging' | 'stale';

// Rust palette (inline — no canonical token exists yet)
const RUST_SOFT = '#FFF0E6';
const RUST_INK = '#8B3A0F';

// ─── Instance name lookup ─────────────────────────────────────────────────────

function buildInstanceNameIndex(): Map<string, string> {
  const index = new Map<string, string>();
  for (const inst of SOURCE_EVENT_INSTANCES) {
    index.set(inst.id, inst.name);
  }
  for (const inst of APEX_RETAIL_PROGRAM_INSTANCES) {
    index.set(inst.id, inst.name);
  }
  return index;
}

// ─── Age derivation ───────────────────────────────────────────────────────────

/**
 * Derive a fallback age in days from the instanceId and criterionId when no
 * real timestamp is available (demo purposes).
 */
function deriveFakeAgeDays(instanceId: string, criterionId: string): number {
  const seed = instanceId.charCodeAt(0) * 7 + criterionId.charCodeAt(0) * 3;
  return Math.abs(seed) % 60;
}

function ageCategoryFromDays(days: number): AgeCategory {
  if (days > 30) return 'stale';
  if (days >= 7) return 'aging';
  return 'fresh';
}

// ─── Enriched waiver type ─────────────────────────────────────────────────────

interface EnrichedWaiver {
  instanceId: string;
  instanceName: string;
  criterionId: string;
  reason: string;
  grantedBy: string;
  waivedAt: string;
  ageDays: number;
  category: AgeCategory;
  waiverKey: string;
}

// ─── Data assembly ────────────────────────────────────────────────────────────

function buildEnrichedWaivers(): EnrichedWaiver[] {
  const nameIndex = buildInstanceNameIndex();

  // Build a lookup from `${instanceId}::${criterionId}` → waivedAt timestamp
  // from the audit buffer (mirrors the gate-waiver module's own store key
  // convention so timestamps match).
  const auditTimestamps = new Map<string, string>();
  for (const record of waiverAuditBuffer) {
    auditTimestamps.set(`${record.instanceId}::${record.criterionId}`, record.waivedAt);
  }

  const raw = getWaivers();

  const enriched: EnrichedWaiver[] = raw.map((w) => {
    const key = `${w.instanceId}::${w.criterionId}`;

    // Prefer the real waivedAt on the waiver record, then audit buffer, then
    // derive a fake age.
    let ageDays: number;
    const ts = w.waivedAt || auditTimestamps.get(key);
    if (ts) {
      const grantedMs = new Date(ts).getTime();
      if (!Number.isNaN(grantedMs)) {
        ageDays = Math.round((TODAY.getTime() - grantedMs) / MS_PER_DAY);
      } else {
        ageDays = deriveFakeAgeDays(w.instanceId, w.criterionId);
      }
    } else {
      ageDays = deriveFakeAgeDays(w.instanceId, w.criterionId);
    }

    return {
      instanceId: w.instanceId,
      instanceName: nameIndex.get(w.instanceId) ?? w.instanceId,
      criterionId: w.criterionId,
      reason: w.reason,
      grantedBy: 'demo-user',
      waivedAt: w.waivedAt,
      ageDays,
      category: ageCategoryFromDays(ageDays),
      waiverKey: key,
    };
  });

  // Sort: stalest first (descending ageDays)
  enriched.sort((a, b) => b.ageDays - a.ageDays);

  return enriched;
}

// ─── Style helpers ────────────────────────────────────────────────────────────

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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ category, ageDays }: { category: AgeCategory; ageDays: number }) {
  const palette =
    category === 'stale'
      ? { bg: RUST_SOFT, fg: RUST_INK }
      : category === 'aging'
        ? { bg: COLORS.amberSoft, fg: COLORS.amberInk }
        : { bg: COLORS.mintSoft, fg: COLORS.mintInk };

  const label = category === 'stale' ? 'Stale' : category === 'aging' ? 'Aging' : 'Fresh';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: palette.bg,
        color: palette.fg,
        borderRadius: RADIUS.pill,
        padding: '2px 10px',
        fontFamily: TYPOGRAPHY.sans,
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
      }}
    >
      {label} · {ageDays}d
    </span>
  );
}

function SummaryStrip({
  total,
  fresh,
  aging,
  stale,
}: {
  total: number;
  fresh: number;
  aging: number;
  stale: number;
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
          fontSize: 14,
          fontWeight: 700,
          color: COLORS.ink,
        }}
      >
        {total} total waiver{total === 1 ? '' : 's'}
      </span>
      <span style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 11, color: `${COLORS.ink}44` }}>
        ·
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.mintInk,
          background: COLORS.mintSoft,
          borderRadius: RADIUS.pill,
          padding: '2px 12px',
        }}
      >
        {fresh} fresh
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: COLORS.amberInk,
          background: COLORS.amberSoft,
          borderRadius: RADIUS.pill,
          padding: '2px 12px',
        }}
      >
        {aging} aging
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: RUST_INK,
          background: RUST_SOFT,
          borderRadius: RADIUS.pill,
          padding: '2px 12px',
        }}
      >
        {stale} stale
      </span>
    </div>
  );
}

function StaleWaiversCard({ staleWaivers }: { staleWaivers: EnrichedWaiver[] }) {
  if (staleWaivers.length === 0) return null;

  return (
    <section
      style={{
        background: RUST_SOFT,
        border: `1px solid ${RUST_INK}33`,
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          padding: `${SPACING.md} ${SPACING.lg}`,
          borderBottom: `1px solid ${RUST_INK}22`,
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
              color: RUST_INK,
              margin: 0,
              letterSpacing: '-0.01em',
            }}
          >
            Stale waivers — needs review
          </h2>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 12,
              color: `${RUST_INK}bb`,
              marginTop: 2,
            }}
          >
            These waivers are &gt;30 days old and should be re-evaluated or formally renewed
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 12,
            color: RUST_INK,
            fontWeight: 600,
          }}
        >
          {staleWaivers.length} waiver{staleWaivers.length === 1 ? '' : 's'}
        </span>
      </header>
      <div style={{ padding: SPACING.md, display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {staleWaivers.map((w) => (
          <div
            key={w.waiverKey}
            style={{
              background: COLORS.white,
              border: `1px solid ${RUST_INK}22`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: SPACING.md,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLORS.ink,
                }}
              >
                {w.instanceName}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 11,
                  color: `${COLORS.ink}99`,
                }}
              >
                {w.criterionId}
              </span>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.sans,
                  fontSize: 12,
                  color: `${COLORS.ink}bb`,
                  lineHeight: 1.4,
                }}
              >
                {w.reason}
              </span>
            </div>
            <span
              style={{
                fontFamily: TYPOGRAPHY.mono,
                fontSize: 12,
                color: RUST_INK,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {w.ageDays} days old
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyStateBanner() {
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
        No active waivers.
      </span>
      <span
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: 13,
          color: `${COLORS.mintInk}aa`,
        }}
      >
        All gate criteria are currently satisfied or unapplied.
      </span>
    </div>
  );
}

function truncate(text: string, max = 60): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + '…';
}

function WaiverTable({ waivers }: { waivers: EnrichedWaiver[] }) {
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
          All waivers
        </h2>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 11,
            color: `${COLORS.ink}88`,
          }}
        >
          sorted by age, stalest first
        </span>
      </header>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
          <thead>
            <tr>
              <th style={HEADER_CELL}>Instance</th>
              <th style={HEADER_CELL}>Criterion</th>
              <th style={HEADER_CELL}>Justification</th>
              <th style={HEADER_CELL}>Granted by</th>
              <th style={{ ...HEADER_CELL, textAlign: 'right' }}>Age (days)</th>
              <th style={HEADER_CELL}>Status</th>
              <th style={HEADER_CELL}>Waiver ID</th>
            </tr>
          </thead>
          <tbody>
            {waivers.map((w) => (
              <tr key={w.waiverKey}>
                <td style={BODY_CELL}>{w.instanceName}</td>
                <td style={MONO_CELL}>{w.criterionId}</td>
                <td
                  style={{ ...BODY_CELL, maxWidth: 260, color: `${COLORS.ink}cc` }}
                  title={w.reason}
                >
                  {truncate(w.reason)}
                </td>
                <td style={MONO_CELL}>{w.grantedBy}</td>
                <td
                  style={{
                    ...MONO_CELL,
                    textAlign: 'right',
                    fontWeight: w.ageDays > 30 ? 700 : 400,
                    color: w.ageDays > 30 ? RUST_INK : `${COLORS.ink}cc`,
                  }}
                >
                  {w.ageDays}
                </td>
                <td style={BODY_CELL}>
                  <StatusPill category={w.category} ageDays={w.ageDays} />
                </td>
                <td style={MONO_CELL}>{w.waiverKey}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WaiverExpiryPage() {
  const waivers = buildEnrichedWaivers();

  const fresh = waivers.filter((w) => w.category === 'fresh').length;
  const aging = waivers.filter((w) => w.category === 'aging').length;
  const stale = waivers.filter((w) => w.category === 'stale');

  return (
    <AdminCanonShellV2
      agentRail={
        <AgentRail
          primaryAgentLabel="Steward"
          primaryActionLabel="Open waiver log"
          primaryActionHref="/admin/reasoning/waiver-log"
        />
      }
    >
      <EditorialCanvas
        eyebrow="Reasoning · Waivers"
        title="Waiver expiry"
        subtitle="Active gate waivers ranked by age. Fresh waivers (<7 days) are healthy; aging waivers (7–30 days) warrant monitoring; stale waivers (>30 days) need review or renewal."
      >
        <SummaryStrip
          total={waivers.length}
          fresh={fresh}
          aging={aging}
          stale={stale.length}
        />

        {waivers.length === 0 ? (
          <EmptyStateBanner />
        ) : (
          <>
            <StaleWaiversCard staleWaivers={stale} />
            <WaiverTable waivers={waivers} />
          </>
        )}
      </EditorialCanvas>
    </AdminCanonShellV2>
  );
}
