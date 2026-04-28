import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { ElevenPlaneDiagram } from '@/components/public-site/ElevenPlaneDiagram';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'Architecture',
  description:
    'Eleven planes. Five stores. Four agents. JWT-bounded API surfaces. Documented trade-offs.',
  openGraph: { url: CANONICAL_URLS.architectureIndex },
});

const TEASER_CARDS = [
  {
    title: 'The 5-store knowledge fabric',
    href: '/architecture/knowledge-fabric/',
    description: 'Relational, vector, graph, object, and evidence stores operating as a unified corpus.',
  },
  {
    title: 'The four-agent voice model',
    href: '/architecture/agents/',
    description: 'Nexus, Sentinel, Atlas, and Steward — distinct roles, distinct models, distinct registers.',
  },
  {
    title: 'JWT-bounded data plane',
    href: '/architecture/data-plane/',
    description: '15-minute TTL tokens. Tenant-scoped access. No cross-tenant surface.',
  },
];

export default function ArchitecturePage() {
  return (
    <div style={{ background: 'var(--pub-paper, #faf7f1)', minHeight: '100vh' }}>
      {/* Header */}
      <section
        style={{
          borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '80px',
          paddingBottom: '64px',
        }}
      >
        <PaperContainer narrow>
          <p
            style={{
              fontFamily: 'var(--pub-font-mono, monospace)',
              fontSize: '11px',
              color: 'var(--pub-stone, #888780)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: '16px',
            }}
          >
            Architecture
          </p>
          <h1
            style={{
              fontFamily: 'var(--pub-font-serif, serif)',
              fontSize: 'clamp(36px, 6vw, 52px)',
              fontWeight: 500,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              color: 'var(--pub-ink, #000)',
              marginBottom: '20px',
            }}
          >
            Architecture, not magic
          </h1>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--pub-slate, #5F5E5A)',
              maxWidth: '640px',
            }}
          >
            Eleven planes. Five stores. Four agents. JWT-bounded API surfaces. Documented trade-offs.
          </p>
        </PaperContainer>
      </section>

      {/* Diagram */}
      <section style={{ paddingTop: '64px', paddingBottom: '48px' }}>
        <PaperContainer>
          <ElevenPlaneDiagram />
        </PaperContainer>
      </section>

      {/* Teaser cards */}
      <section style={{ paddingBottom: '64px' }}>
        <PaperContainer>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            {TEASER_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                style={{
                  display: 'block',
                  background: 'var(--pub-paper, #faf7f1)',
                  border: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
                  borderRadius: '8px',
                  padding: '24px',
                  textDecoration: 'none',
                  transition: 'border-color 0.15s',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--pub-font-serif, serif)',
                    fontSize: '16px',
                    fontWeight: 500,
                    color: 'var(--pub-signal, #0066CC)',
                    marginBottom: '8px',
                    lineHeight: 1.3,
                  }}
                >
                  {card.title} →
                </p>
                <p
                  style={{
                    fontFamily: 'var(--pub-font-sans, sans-serif)',
                    fontSize: '14px',
                    color: 'var(--pub-slate, #5F5E5A)',
                    lineHeight: 1.5,
                  }}
                >
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </PaperContainer>
      </section>

      {/* Technical body */}
      <section
        style={{
          borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '64px',
          paddingBottom: '80px',
        }}
      >
        <PaperContainer narrow>
          <div
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '16px',
              lineHeight: 1.75,
              color: 'var(--pub-slate, #5F5E5A)',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
              }}
            >
              The decomposition rationale
            </h2>
            <p style={{ marginBottom: '20px' }}>
              The 11-plane decomposition isolates identity resolution from tenant data — a deliberate
              choice that adds one network hop to every request in exchange for a clean audit
              boundary. Each plane has one clear responsibility and communicates with adjacent planes
              through defined interfaces. Violating a plane boundary requires an explicit design
              decision, not an accident.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Planes 1 and 2 (Identity and Tenant) exist separately because authentication and
              authorization are distinct operations with different failure modes. A misconfigured SSO
              provider should not give an attacker access to tenant data; the tenant boundary check
              runs independently even if identity resolution degrades. This is not belt-and-suspenders
              redundancy — it is defense in depth at the decomposition level.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Planes 3 and 4 (Control and Workflow) separate orchestration concerns from
              program-lifecycle concerns. The control plane schedules and routes; the workflow plane
              enforces the six-phase progression. Nexus operates across both: it schedules work
              through the control plane and tracks phase state through the workflow plane. Keeping
              them distinct means a scheduling bug cannot corrupt phase state, and a phase-transition
              rule change does not require touching the scheduler.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Planes 5–7 (Knowledge, Synthesis, Agent) represent the core intelligence stack.
              Knowledge stores raw and derived facts. Synthesis transforms facts into cited reasoning
              under a 150-word cap. The agent plane coordinates which agent handles which request.
              These three planes could be collapsed into a single &quot;AI layer&quot; — we kept them
              separate because they have different scaling profiles, different failure modes, and
              different compliance requirements.
            </p>
            <p style={{ marginBottom: '20px' }}>
              Plane 9 (Data) is physically separate from planes 1 and 2 even though it also enforces
              access control. The distinction is scope: identity and tenant planes control who can
              enter the system; the data plane controls what a valid, authenticated session can read
              and write. JWT tokens issued by the control plane carry tenant and role claims that the
              data plane validates without making a synchronous call back to the identity plane.
              This is the PAT-ARCH-008 Iceberg Principle applied at the access-control layer:{' '}
              <span style={{ color: 'var(--pub-stone, #888780)' }}>
                /patterns/iceberg-principle
              </span>{' '}
              — the data plane enforces only what it needs to enforce, and nothing more.
            </p>
            <p style={{ marginBottom: '40px' }}>
              Plane 11 (Audit) sits innermost in the diagram but first in the data flow: every
              operation that mutates state writes an immutable audit record before the response is
              returned. The audit plane is not a log shipped asynchronously to an SIEM. It is a
              synchronous write to an append-only ledger that is part of the same transaction as the
              mutation. If the audit write fails, the mutation fails.
            </p>

            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
              }}
            >
              Trade-offs we made
            </h2>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                1. Synchronous audit writes vs. throughput
              </h3>
              <p>
                Synchronous audit writes add latency to every mutating operation — typically 8–15ms
                at p95 on our primary region. Asynchronous writes would eliminate this cost but
                introduce a window where a mutation succeeds and its audit record does not exist.
                For an AI-program product where compliance audit trails are a core deliverable, we
                accept the latency cost.
              </p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                2. 11 planes vs. simpler flat architecture
              </h3>
              <p>
                Eleven planes add cognitive load for new contributors. A flat &quot;services&quot; architecture
                would be easier to onboard. We chose the plane model because it makes cross-cutting
                concerns (identity, audit, tenancy) explicit rather than implicit. Every engineer
                who touches the codebase knows exactly where tenant isolation is enforced: plane 2,
                nowhere else.
              </p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                  letterSpacing: '0.02em',
                }}
              >
                3. Per-agent model selection vs. single foundation model
              </h3>
              <p>
                Running Claude Opus for Nexus and Sentinel, and Claude Sonnet for Atlas and Steward,
                means four separate model invocations per complex request rather than one. The cost
                differential is real. We made this choice because Sentinel&apos;s validation logic
                requires the same capability ceiling as Nexus&apos;s orchestration, while Atlas&apos;s
                synthesis task — constrained to 150 words with citations — does not. Paying Opus
                rates for synthesis would be waste; using Sonnet for validation would be risk.
              </p>
            </div>

            <div
              style={{
                marginTop: '40px',
                paddingTop: '24px',
                borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
                display: 'flex',
                gap: '24px',
                flexWrap: 'wrap',
              }}
            >
              <Link
                href="/architecture/synthesis/"
                style={{ color: 'var(--pub-signal, #0066CC)', fontSize: '14px' }}
              >
                How Atlas synthesis works →
              </Link>
              <Link
                href="/architecture/governance/"
                style={{ color: 'var(--pub-signal, #0066CC)', fontSize: '14px' }}
              >
                Sentinel validation and Steward governance →
              </Link>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
