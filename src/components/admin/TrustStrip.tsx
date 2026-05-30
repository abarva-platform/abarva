/**
 * TrustStrip · Wave 1 PR-5 · the Trust Plane centerpiece.
 *
 * Four-chip horizontal strip placed below the masthead and above the
 * action queue on the /admin landing. Conveys the four trust
 * dimensions — Substrate, Isolation, Integrations, Governance — at
 * a glance. A CIO should be able to read the entire posture from
 * this strip alone.
 *
 * See `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 (Zone B —
 * Trust strip 56px tall) for the layout spec and §7 Wave 1 PR-5 for
 * the delivery slicing.
 *
 * Contract:
 *   - Input chips are derived from `TrustSpine` via `spineToChips` so
 *     the page composer stays declarative.
 *   - Each chip is a server-renderable anchor — no client state, no
 *     onclick handlers, just an href.
 *   - Estimated chips render with a hollow dot and a muted label
 *     suffix `(estimated)`. Honesty > demo polish.
 *
 * Visual register: mono eyebrow for the noun, sans for the metric.
 * Georgia display is NOT used here — the strip is the instrument
 * panel, the masthead is the editorial header.
 */

import type { TrustSpine } from '@/lib/admin/broker/trust-spine-broker';

// ── Palette (LOCKED — match HomeOverviewV2 tokens) ──────────────────
//
// Subset of the HomeOverviewV2 palette, repeated here so the strip
// can be lifted out and reused on /admin/data-trust without coupling
// to the landing-page component file.

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  red: '#991B1B',
  redSoft: 'rgba(153,27,27,0.07)',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
} as const;

const F_BODY =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

// ── Contract ────────────────────────────────────────────────────────

export type TrustStripChipId =
  | 'substrate'
  | 'isolation'
  | 'integrations'
  | 'governance';

export type TrustStripStatus = 'ready' | 'attention' | 'breach';
export type TrustStripEvidence = 'live' | 'estimated';

export interface TrustStripChip {
  id: TrustStripChipId;
  noun: string;
  metric: { value: string; label: string };
  status: TrustStripStatus;
  evidence: TrustStripEvidence;
  href: string;
}

// ── Spine → chips composer ──────────────────────────────────────────

/**
 * Derive the four landing-page chips from a composed `TrustSpine`.
 * Pure function; no I/O. Ordering is fixed: substrate, isolation,
 * integrations, governance — per the verdict §5.6 spec.
 *
 * Empty state (no substrate yet) returns four `no data yet` chips
 * marked estimated so the strip stays honest on a brand-new tenant.
 */
export function spineToChips(spine: TrustSpine): TrustStripChip[] {
  if (spine.substrate.segmentsTotal === 0) {
    return EMPTY_CHIPS;
  }

  // Substrate — mature / sparse from live broker.
  const substrate: TrustStripChip = {
    id: 'substrate',
    noun: 'Substrate',
    metric: {
      value: String(spine.substrate.mature),
      label: `mature / ${spine.substrate.sparse} sparse`,
    },
    status:
      spine.substrate.missing > 0
        ? 'attention'
        : spine.substrate.sparse > 0
          ? 'attention'
          : 'ready',
    evidence: spine.substrate.evidence,
    href: '/admin/data-trust',
  };

  // Isolation — anomalies in last 24h. Wave 2 PR-2 routes the chip
  // to the new Isolation lane on /admin/audit so an incident-response
  // admin can answer STRESS-P0-006-class questions ("did anything
  // cross tenants?") without leaving Setup.
  const isolation: TrustStripChip = {
    id: 'isolation',
    noun: 'Isolation',
    metric: {
      value: String(spine.isolation.anomaliesLast24h),
      label: 'anomalies 24h',
    },
    status:
      spine.isolation.anomaliesLast24h === 0
        ? 'ready'
        : spine.isolation.topAnomaly?.severity === 'high'
          ? 'breach'
          : 'attention',
    evidence: spine.isolation.evidence,
    href: '/admin/audit?tab=isolation',
  };

  // Integrations — degraded connector count.
  const integrationStatus: TrustStripStatus =
    spine.integration.connectorsDegraded === 0
      ? 'ready'
      : spine.integration.connectorsDegraded > 1
        ? 'breach'
        : 'attention';
  const integrationMetric: { value: string; label: string } =
    spine.integration.connectorsTotal === 0
      ? { value: '0', label: 'connectors' }
      : spine.integration.connectorsDegraded > 0
        ? {
            value: String(spine.integration.connectorsDegraded),
            label: 'degraded',
          }
        : {
            value: String(spine.integration.connectorsLive),
            label: 'live',
          };
  const integrations: TrustStripChip = {
    id: 'integrations',
    noun: 'Integrations',
    metric: integrationMetric,
    status: integrationStatus,
    evidence: spine.integration.evidence,
    href: '/admin/connectors',
  };

  // Governance — approvals pending; routes to approvals queue when open.
  const governance: TrustStripChip = {
    id: 'governance',
    noun: 'Governance',
    metric: {
      value: String(spine.governance.openApprovals),
      label:
        spine.governance.openApprovals === 1
          ? 'approval pending'
          : 'approvals pending',
    },
    status:
      spine.governance.openApprovals === 0
        ? 'ready'
        : spine.governance.openApprovals > 2
          ? 'breach'
          : 'attention',
    evidence: spine.governance.evidence,
    href:
      spine.governance.openApprovals > 0
        ? '/home/queue'
        : '/admin/users-access',
  };

  return [substrate, isolation, integrations, governance];
}

const EMPTY_CHIPS: TrustStripChip[] = [
  {
    id: 'substrate',
    noun: 'Substrate',
    metric: { value: '0', label: 'no data yet' },
    status: 'attention',
    evidence: 'estimated',
    href: '/admin/data-trust',
  },
  {
    id: 'isolation',
    noun: 'Isolation',
    metric: { value: '0', label: 'no data yet' },
    status: 'attention',
    evidence: 'estimated',
    href: '/admin/audit?tab=isolation',
  },
  {
    id: 'integrations',
    noun: 'Integrations',
    metric: { value: '0', label: 'no data yet' },
    status: 'attention',
    evidence: 'estimated',
    href: '/admin/connectors',
  },
  {
    id: 'governance',
    noun: 'Governance',
    metric: { value: '0', label: 'no data yet' },
    status: 'attention',
    evidence: 'estimated',
    href: '/admin/users-access',
  },
];

// ── Render ──────────────────────────────────────────────────────────

interface ChipStyle {
  dotColor: string;
  dotFill: string;
  labelColor: string;
  metricColor: string;
  background: string;
}

function styleForChip(chip: TrustStripChip): ChipStyle {
  // Estimated chips always read muted, with a hollow dot, regardless
  // of underlying status. Honesty trumps color signalling.
  if (chip.evidence === 'estimated') {
    return {
      dotColor: C.faint,
      dotFill: 'transparent',
      labelColor: C.faint,
      metricColor: C.muted,
      background: C.surface,
    };
  }
  switch (chip.status) {
    case 'breach':
      return {
        dotColor: C.red,
        dotFill: C.red,
        labelColor: C.red,
        metricColor: C.ink,
        background: C.redSoft,
      };
    case 'attention':
      return {
        dotColor: C.amber,
        dotFill: C.amber,
        labelColor: C.amber,
        metricColor: C.ink,
        background: C.amberSoft,
      };
    case 'ready':
    default:
      return {
        dotColor: C.teal,
        dotFill: C.teal,
        labelColor: C.body,
        metricColor: C.ink,
        background: C.surface,
      };
  }
}

interface Props {
  chips: ReadonlyArray<TrustStripChip>;
}

export function TrustStrip({ chips }: Props) {
  return (
    <nav
      aria-label="Trust posture"
      data-testid="admin-trust-strip"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${chips.length}, minmax(0, 1fr))`,
        gap: 1,
        background: C.borderLight,
        border: `1px solid ${C.borderLight}`,
        borderRadius: 6,
        overflow: 'hidden',
        minHeight: 56,
      }}
    >
      {chips.map((chip) => (
        <TrustChip key={chip.id} chip={chip} />
      ))}
    </nav>
  );
}

function TrustChip({ chip }: { chip: TrustStripChip }) {
  const s = styleForChip(chip);
  const isEstimated = chip.evidence === 'estimated';
  return (
    <a
      href={chip.href}
      data-chip-id={chip.id}
      data-chip-status={chip.status}
      data-chip-evidence={chip.evidence}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: s.background,
        textDecoration: 'none',
        color: 'inherit',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flexShrink: 0,
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: s.dotFill,
          border: `1.5px solid ${s.dotColor}`,
        }}
      />
      <span
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          minWidth: 0,
        }}
      >
        <span
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: s.labelColor,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {chip.noun}
          {isEstimated && (
            <span
              style={{
                marginLeft: 6,
                fontWeight: 500,
                letterSpacing: '0.10em',
                color: C.faint,
              }}
            >
              (estimated)
            </span>
          )}
        </span>
        <span
          style={{
            fontFamily: F_BODY,
            fontSize: 13.5,
            color: s.metricColor,
            lineHeight: 1.25,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <strong
            style={{
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {chip.metric.value}
          </strong>
          <span
            style={{
              color: C.muted,
              marginLeft: 6,
            }}
          >
            {chip.metric.label}
          </span>
        </span>
      </span>
    </a>
  );
}
