// HOME1 · Agentic Executive Home Entry surface.
//
// Calm, single-fold executive landing that orients an arriving visitor
// toward the four canonical agent surfaces (Nexus / Atlas / Sentinel /
// Steward) and exposes a small, deterministic "what needs attention"
// strip. No live runtime, no model invocation, no telemetry — every
// number renders from a deterministic seed helper and is labelled as
// such via `data-deterministic="true"` markers and an honest-disclaimer
// footer.
//
// Visual canon:
//   - Light off-white surface (warm), NAVY accent only.
//   - DM Sans body, JetBrains Mono eyebrows.
//   - AbarVa wordmark per §B (no gap, "Va" navy + ~1.08× larger).
//   - Agent badges per §H (small mono pill, no avatars).
//
// Component is a server component. Props are optional and pure. The
// surface deliberately renders ≤ 1 page-fold of content — denser
// portfolio context lives below the fold (existing home page chrome).
//
// Module hygiene: no imports from forbidden runtimes (nexus, agent,
// source, auth, supabase), no time / random / network / model calls,
// no client-side state hooks. The hygiene contract is enforced by the
// HOME1 test suite via a source-file audit.

import Link from 'next/link';
import { AgentBadge } from '@/components/abarva/AgentBadge';
import { AbarvaWordmark } from '@/components/abarva/AbarVaTopNav';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';

// ---------------------------------------------------------------------
// PROPS
// ---------------------------------------------------------------------

export interface AgenticHomeEntryProps {
  /**
   * Tenant slug used to build agent-surface route hrefs. Optional —
   * defaults to the canonical placeholder `acme` so the surface renders
   * cleanly without ambient tenant context.
   */
  tenantSlug?: string;
}

// ---------------------------------------------------------------------
// AGENT SURFACE TILES
// ---------------------------------------------------------------------

interface AgentSurface {
  key: string;
  title: string;
  agent: AbarvaAgent;
  agentLabel: string;
  subline: string;
  hrefBuilder: (tenantSlug: string) => string;
}

const AGENT_SURFACES: readonly AgentSurface[] = [
  {
    key: 'programs',
    title: 'Programs',
    agent: 'nexus',
    agentLabel: 'Nexus',
    subline: 'Active programs, phase progress, gate readiness.',
    hrefBuilder: (slug) => `/tenant/${slug}/programs`,
  },
  {
    key: 'tower',
    title: 'Control Tower',
    agent: 'atlas',
    agentLabel: 'Atlas',
    subline: 'AI portfolio posture across seven dimensions.',
    hrefBuilder: (slug) => `/tenant/${slug}/tower`,
  },
  {
    key: 'intelligence',
    title: 'Intelligence',
    agent: 'sentinel',
    agentLabel: 'Sentinel',
    subline: 'Patterns, failure-mode signals, evidence lineage.',
    hrefBuilder: (slug) => `/tenant/${slug}/intelligence`,
  },
  {
    key: 'admin',
    title: 'Admin Setup',
    agent: 'steward',
    agentLabel: 'Steward',
    subline: 'Dataset domains, evidence loading, governance.',
    hrefBuilder: () => '/platform/admin',
  },
];

// ---------------------------------------------------------------------
// "WHAT NEEDS ATTENTION" — DETERMINISTIC SEED
// ---------------------------------------------------------------------
//
// Pure helper. Same call → identical output. Numbers are seeded
// constants chosen to read honestly for an early-tenant state. Live
// telemetry binding is deferred; the honest-disclaimer footer names
// this explicitly.

interface AttentionCard {
  id: string;
  eyebrow: string;
  body: string;
  agent: AbarvaAgent;
  agentLabel: string;
}

function buildAttentionCards(): readonly AttentionCard[] {
  // Three cards · canonical ordering: Programs → Steward → Sentinel.
  // Numbers are deterministic constants. DO NOT bind to live reads
  // here — that contract belongs to a future slice.
  const PROGRAMS_AT_G2 = 1;
  const DOMAINS_PARTIAL = 2;
  const ACTIVE_PATTERNS = 3;
  return [
    {
      id: 'home1-attn-programs-g2',
      eyebrow: 'Programs · gate readiness',
      body: `${PROGRAMS_AT_G2} program at Gate G2 — CXO interview pending.`,
      agent: 'nexus',
      agentLabel: 'Nexus',
    },
    {
      id: 'home1-attn-domains-partial',
      eyebrow: 'Setup · dataset domains',
      body: `${DOMAINS_PARTIAL} dataset domains partially loaded.`,
      agent: 'steward',
      agentLabel: 'Steward',
    },
    {
      id: 'home1-attn-patterns-active',
      eyebrow: 'Intelligence · active patterns',
      body: `${ACTIVE_PATTERNS} active patterns surfaced by Sentinel.`,
      agent: 'sentinel',
      agentLabel: 'Sentinel',
    },
  ];
}

// ---------------------------------------------------------------------
// SHARED STYLES (token-driven; no hard-coded colors)
// ---------------------------------------------------------------------

const EYEBROW_STYLE = {
  fontFamily: FONT.mono,
  fontSize: 10,
  fontWeight: 500,
  letterSpacing: '0.14em',
  textTransform: 'uppercase' as const,
  color: COLORS.muted,
};

// ---------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------

export function AgenticHomeEntry({
  tenantSlug = 'acme',
}: AgenticHomeEntryProps) {
  const surfaces = AGENT_SURFACES;
  const attentionCards = buildAttentionCards();

  return (
    <section
      data-agentic-home-entry="home1"
      style={{
        background: COLORS.surface,
        color: COLORS.ink,
        fontFamily: FONT.body,
        padding: `${SPACING.xxxl}px ${SPACING.xxl}px`,
        borderRadius: RADIUS.xl,
        border: BORDER.hairline,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header · wordmark + one-line orientation */}
        <header
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: SPACING.sm,
            marginBottom: SPACING.xxl,
          }}
        >
          <AbarvaWordmark size="md" />
          <p
            style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 400,
              lineHeight: 1.5,
              color: COLORS.body,
              maxWidth: 640,
            }}
          >
            Calm intelligence layer for AI program execution.
          </p>
        </header>

        {/* Four agent surface cards · 2×2 default, 4×1 on wide screens */}
        <div
          data-home1-agent-grid="true"
          className="home1-agent-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: SPACING.lg,
            marginBottom: SPACING.xxl,
          }}
        >
          {surfaces.map((surface) => {
            const href = surface.hrefBuilder(tenantSlug);
            return (
              <Link
                key={surface.key}
                href={href}
                data-home1-agent-card={surface.key}
                style={{
                  display: 'block',
                  textDecoration: 'none',
                  color: 'inherit',
                  background: COLORS.card,
                  border: BORDER.hairline,
                  borderTop: `3px solid ${COLORS.navy}`,
                  borderRadius: RADIUS.lg,
                  padding: `${SPACING.xl}px ${SPACING.xl}px`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACING.md,
                  }}
                >
                  <span
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      lineHeight: 1.25,
                      letterSpacing: '-0.005em',
                      color: COLORS.ink,
                    }}
                  >
                    {surface.title}
                  </span>
                  <AgentBadge agent={surface.agent} />
                </div>
                <p
                  style={{
                    margin: `${SPACING.sm}px 0 0`,
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: COLORS.body,
                  }}
                >
                  {surface.subline}
                </p>
                <div
                  aria-hidden="true"
                  style={{
                    marginTop: SPACING.md,
                    ...EYEBROW_STYLE,
                  }}
                >
                  {surface.agentLabel}
                </div>
              </Link>
            );
          })}
        </div>

        {/* What needs attention · ≤ 3 deterministic-seed cards */}
        <div
          data-home1-attention-strip="true"
          style={{
            background: COLORS.surface2,
            border: BORDER.hairlineSoft,
            borderRadius: RADIUS.lg,
            padding: `${SPACING.xl}px ${SPACING.xl}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: SPACING.md,
              gap: SPACING.md,
            }}
          >
            <span style={EYEBROW_STYLE}>What needs attention</span>
            <span
              style={{
                ...EYEBROW_STYLE,
                color: COLORS.mutedSoft,
              }}
            >
              {`${attentionCards.length} of 3 · deterministic seed`}
            </span>
          </div>

          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: SPACING.md,
            }}
            className="home1-attention-grid"
          >
            {attentionCards.map((card) => (
              <li
                key={card.id}
                data-deterministic="true"
                data-source="deterministic_seed"
                style={{
                  background: COLORS.card,
                  border: BORDER.hairlineSoft,
                  borderRadius: RADIUS.md,
                  padding: `${SPACING.md}px ${SPACING.lg}px`,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: SPACING.xs,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: SPACING.sm,
                  }}
                >
                  <span style={EYEBROW_STYLE}>{card.eyebrow}</span>
                  <AgentBadge agent={card.agent} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    fontWeight: 400,
                    lineHeight: 1.5,
                    color: COLORS.body,
                  }}
                >
                  {card.body}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Honest disclaimer footer */}
        <p
          data-honest-disclaimer="home1"
          style={{
            margin: `${SPACING.lg}px 0 0`,
            fontSize: 12,
            fontWeight: 400,
            lineHeight: 1.45,
            color: COLORS.muted,
          }}
        >
          Numbers shown above are deterministic seed values, not live
          runtime telemetry.
        </p>
      </div>

      <style>{`
        @media (min-width: 1100px) {
          .home1-agent-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
        }
        @media (max-width: 720px) {
          .home1-agent-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
          .home1-attention-grid {
            grid-template-columns: minmax(0, 1fr) !important;
          }
        }
      `}</style>
    </section>
  );
}
