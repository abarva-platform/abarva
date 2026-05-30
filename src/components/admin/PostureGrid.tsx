/**
 * PostureGrid · Wave 2 PR-4 · Zone D of the Trust Plane.
 *
 * The 2×2 card grid that sits below the action queue on /admin per
 * `docs/build/SETUP_AUDIT_2026-05-30_VERDICT.md` §5.6 Zone D. Four
 * cards — Substrate readiness · Connector health · Auth & isolation
 * posture · Approvals & policy — each composed from `TrustSpine` and
 * each click jumps to its group's destination.
 *
 * Design contract per verdict §5.6:
 *
 *   - 2×2 equal-card grid on cream paper, locked palette.
 *   - Each card carries: noun (mono eyebrow), descriptive line
 *     (DM Sans 13px), a Georgia-serif big stat (24–30px), and a
 *     mono footer with the top concern in plain language.
 *   - Status border (1px LEFT edge):
 *       ready    → teal
 *       attention → amber
 *       breach    → red
 *       estimated → muted gray
 *   - Cards are anchor-wrapped so the entire card is clickable; click
 *     targets:
 *       Substrate    → /admin/data-trust
 *       Connector    → /admin/connectors
 *       Isolation    → /admin/audit?tab=isolation
 *       Approvals    → /admin/programs/approvals if openApprovals > 0
 *                      else /admin/users-access
 *   - Empty TrustSpine → all four cards render no-data state.
 *
 * Composed from `TrustSpine`; consumes the broker contract only — no
 * direct Supabase reads. Pure server-renderable.
 */

import type { TrustSpine } from '@/lib/admin/broker/trust-spine-broker';

// ── Palette (LOCKED — match HomeOverviewV2 / TrustStrip tokens) ─────

const C = {
  ink: '#0A0C12',
  body: '#1F2433',
  muted: '#3D4454',
  faint: '#6B7280',
  navy: '#1B2B5C',
  teal: '#0E8A65',
  tealSoft: 'rgba(14,138,101,0.09)',
  amber: '#92400E',
  amberSoft: 'rgba(146,64,14,0.08)',
  red: '#991B1B',
  redSoft: 'rgba(153,27,27,0.07)',
  borderLight: '#E5E7EB',
  surface: '#FFFFFF',
} as const;

const F_DISPLAY = 'var(--font-fraunces), Georgia, serif';
const F_BODY =
  'var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
const F_MONO =
  'var(--font-jetbrains-mono), ui-monospace, "SF Mono", Menlo, monospace';

// ── Contract ────────────────────────────────────────────────────────

export type PostureCardId =
  | 'substrate'
  | 'connector'
  | 'isolation'
  | 'approvals';

export type PostureCardStatus = 'ready' | 'attention' | 'breach' | 'estimated';

export interface PostureCard {
  id: PostureCardId;
  noun: string;
  descriptor: string;
  stat: string;
  footer: string;
  status: PostureCardStatus;
  href: string;
}

// ── Spine → cards composer ──────────────────────────────────────────

/**
 * Derive the four posture cards from a composed `TrustSpine`. Pure
 * function; no I/O. Ordering is fixed per verdict §5.6:
 *   1. Substrate, 2. Connector, 3. Isolation, 4. Approvals.
 */
export function spineToPostureCards(spine: TrustSpine): PostureCard[] {
  return [
    composeSubstrateCard(spine),
    composeConnectorCard(spine),
    composeIsolationCard(spine),
    composeApprovalsCard(spine),
  ];
}

function composeSubstrateCard(spine: TrustSpine): PostureCard {
  const s = spine.substrate;
  let status: PostureCardStatus;
  if (s.mature >= 5) status = 'ready';
  else if (s.mature >= 1) status = 'attention';
  else status = 'breach';
  const stat = `${s.mature} mature / ${s.sparse} sparse`;
  const footer = s.topSparseSegment
    ? s.topSparseSegment.unlocks
    : 'All segments grounded.';
  return {
    id: 'substrate',
    noun: 'Substrate readiness',
    descriptor: 'Segment coverage and depth of ingest.',
    stat,
    footer,
    status,
    href: '/admin/data-trust',
  };
}

function composeConnectorCard(spine: TrustSpine): PostureCard {
  const i = spine.integration;
  let status: PostureCardStatus;
  if (i.evidence === 'estimated') status = 'estimated';
  else if (i.connectorsDegraded > 2) status = 'breach';
  else if (i.connectorsDegraded > 0) status = 'attention';
  else status = 'ready';
  const stat = `${i.connectorsLive} live / ${i.connectorsDegraded} degraded`;
  const footer = i.topDegraded
    ? `${i.topDegraded.name} — ${i.topDegraded.reason}`
    : 'All connectors green.';
  return {
    id: 'connector',
    noun: 'Connector health',
    descriptor: 'Live integrations and last successful pull.',
    stat,
    footer,
    status,
    href: '/admin/connectors',
  };
}

function composeIsolationCard(spine: TrustSpine): PostureCard {
  const iso = spine.isolation;
  let status: PostureCardStatus;
  if (iso.evidence === 'estimated') status = 'estimated';
  else if (iso.anomaliesLast24h > 0) status = 'breach';
  else status = 'ready';
  const stat = `${iso.anomaliesLast24h} anomalies 24h · RLS ${iso.rlsCoveragePct}%`;
  const footer = iso.topAnomaly
    ? iso.topAnomaly.description
    : 'No anomalies in 24h.';
  return {
    id: 'isolation',
    noun: 'Auth & RLS posture',
    descriptor: 'Tenant isolation, RLS coverage, anomaly count.',
    stat,
    footer,
    status,
    href: '/admin/audit?tab=isolation',
  };
}

function composeApprovalsCard(spine: TrustSpine): PostureCard {
  const g = spine.governance;
  let status: PostureCardStatus;
  if (g.openApprovals > 0 || g.openInvites > 5) status = 'attention';
  else status = 'ready';
  const stat = `${g.openApprovals} pending · ${g.openInvites} invites`;
  const footer = `SSO ${g.ssoConfigured ? 'configured' : 'not configured'}.`;
  const href =
    g.openApprovals > 0
      ? '/admin/programs/approvals'
      : '/admin/users-access';
  return {
    id: 'approvals',
    noun: 'Approvals & policy',
    descriptor: 'Pending decisions, invites, and SSO posture.',
    stat,
    footer,
    status,
    href,
  };
}

// ── No-data state ───────────────────────────────────────────────────

/**
 * Render an empty-spine posture grid where every card is muted and
 * tells the operator the lane has no live data yet. Used when
 * `getTrustSpine` resolved null (broker failure or empty tenant).
 */
export function emptyPostureCards(): PostureCard[] {
  return [
    {
      id: 'substrate',
      noun: 'Substrate readiness',
      descriptor: 'Segment coverage and depth of ingest.',
      stat: 'no data yet',
      footer: 'Load your first dataset to begin grounding.',
      status: 'estimated',
      href: '/admin/data-trust',
    },
    {
      id: 'connector',
      noun: 'Connector health',
      descriptor: 'Live integrations and last successful pull.',
      stat: 'no data yet',
      footer: 'Connect a source to see connector health.',
      status: 'estimated',
      href: '/admin/connectors',
    },
    {
      id: 'isolation',
      noun: 'Auth & RLS posture',
      descriptor: 'Tenant isolation, RLS coverage, anomaly count.',
      stat: 'no data yet',
      footer: 'Isolation lane has no observations yet.',
      status: 'estimated',
      href: '/admin/audit?tab=isolation',
    },
    {
      id: 'approvals',
      noun: 'Approvals & policy',
      descriptor: 'Pending decisions, invites, and SSO posture.',
      stat: 'no data yet',
      footer: 'No governance signal in this tenant yet.',
      status: 'estimated',
      href: '/admin/users-access',
    },
  ];
}

// ── Component ───────────────────────────────────────────────────────

interface Props {
  cards: ReadonlyArray<PostureCard>;
}

export function PostureGrid({ cards }: Props) {
  return (
    <div
      data-testid="admin-posture-grid"
      role="list"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: 16,
        fontFamily: F_BODY,
        color: C.body,
      }}
    >
      {cards.map((card) => (
        <PostureGridCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function statusBorderColor(status: PostureCardStatus): string {
  switch (status) {
    case 'ready':
      return C.teal;
    case 'attention':
      return C.amber;
    case 'breach':
      return C.red;
    case 'estimated':
    default:
      return C.faint;
  }
}

function statusBackground(status: PostureCardStatus): string {
  switch (status) {
    case 'ready':
      return C.tealSoft;
    case 'attention':
      return C.amberSoft;
    case 'breach':
      return C.redSoft;
    case 'estimated':
    default:
      return 'transparent';
  }
}

function PostureGridCard({ card }: { card: PostureCard }) {
  const borderColor = statusBorderColor(card.status);
  const accent = statusBackground(card.status);
  const statRing = card.status === 'estimated' ? C.faint : C.ink;
  return (
    <a
      role="listitem"
      data-testid={`admin-posture-card-${card.id}`}
      data-status={card.status}
      href={card.href}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 140,
        padding: '14px 18px 16px',
        background: C.surface,
        border: `1px solid ${C.borderLight}`,
        borderLeft: `3px solid ${borderColor}`,
        borderRadius: 6,
        textDecoration: 'none',
        color: 'inherit',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {accent !== 'transparent' && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: accent,
            opacity: 0.45,
            pointerEvents: 'none',
          }}
        />
      )}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontFamily: F_MONO,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: card.status === 'estimated' ? C.faint : C.navy,
            marginBottom: 4,
          }}
        >
          {card.noun}
        </div>
        <div
          style={{
            fontSize: 13,
            color: C.muted,
            lineHeight: 1.4,
          }}
        >
          {card.descriptor}
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          fontFamily: F_DISPLAY,
          fontSize: 26,
          fontWeight: 400,
          color: statRing,
          letterSpacing: '-0.012em',
          lineHeight: 1.15,
          marginTop: 2,
        }}
      >
        {card.stat}
      </div>
      <div
        style={{
          position: 'relative',
          marginTop: 'auto',
          fontFamily: F_MONO,
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.04em',
          color: card.status === 'estimated' ? C.faint : C.body,
          lineHeight: 1.45,
        }}
      >
        {card.footer}
      </div>
    </a>
  );
}
