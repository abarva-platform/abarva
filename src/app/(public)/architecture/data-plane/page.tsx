import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { JwtDataPlaneDiagram } from '@/components/public-site/JwtDataPlaneDiagram';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'JWT-bounded data plane',
  description:
    '15-minute JWT TTL. Tenant-isolated access. Private by design — how AbarVa keeps tenant data completely separated.',
  openGraph: { url: CANONICAL_URLS.architecture('data-plane') },
});

export default function DataPlanePage() {
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
            Architecture · Data plane
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
            Private by design.
          </h1>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '18px',
              lineHeight: 1.6,
              color: 'var(--pub-slate, #5F5E5A)',
              maxWidth: '600px',
            }}
          >
            AbarVa&apos;s data plane uses JWT tokens with a 15-minute TTL to enforce tenant isolation.
            No tenant&apos;s data is accessible without a valid, tenant-scoped token. Session hijacking
            is the primary threat model.
          </p>
        </PaperContainer>
      </section>

      {/* Diagram */}
      <section style={{ paddingTop: '64px', paddingBottom: '48px' }}>
        <PaperContainer>
          <JwtDataPlaneDiagram />
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
              Dual-scope access control
            </h2>
            <p style={{ marginBottom: '20px' }}>
              AbarVa enforces access control at two distinct planes. The identity plane (plane 1)
              handles authentication — verifying who the user is via Clerk and SSO. The data plane
              (plane 9) handles authorization — verifying what this authenticated user is permitted
              to read or write within their tenant. These are separate checks, not a single
              middleware.
            </p>
            <p style={{ marginBottom: '20px' }}>
              When a user authenticates, the control plane issues a JWT containing three claims:
              tenant ID, user role, and an expiry timestamp set to 15 minutes from issue time. Every
              data plane request validates this token without making a synchronous call back to the
              identity plane. If the token is expired, the request is rejected with a 401 and the
              client must re-authenticate. There is no token refresh mechanism — re-authentication
              is the designed path.
            </p>
            <p style={{ marginBottom: '20px' }}>
              The tenant ID claim is the primary isolation mechanism. Every database query in the
              data plane is automatically scoped to the tenant ID from the JWT. There is no path
              through the application that retrieves data across tenant boundaries — the scoping
              happens at the query layer, not the application layer, enforced by a Postgres
              row-level security policy keyed on tenant ID.
            </p>

            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
                marginTop: '40px',
              }}
            >
              The 15-minute TTL
            </h2>
            <p style={{ marginBottom: '20px' }}>
              The JWT TTL is 15 minutes. This is aggressive by enterprise software standards, where
              TTLs of 1 hour or 8 hours are common. We chose 15 minutes because the threat model
              prioritizes session hijacking over UX friction.
            </p>
            <p style={{ marginBottom: '20px' }}>
              AbarVa handles high-stakes program data: AI initiative decisions, stakeholder
              approvals, budget thresholds, competitive analysis. A hijacked session with a 1-hour
              TTL gives an attacker 55 minutes of undetected access after token theft. A hijacked
              session with a 15-minute TTL gives an attacker at most 14 minutes and 59 seconds —
              and that window shrinks to zero if the legitimate user&apos;s device detects the theft and
              triggers a revocation.
            </p>
            <p style={{ marginBottom: '20px' }}>
              The UX cost is real: users doing long-form synthesis reviews will occasionally hit a
              re-authentication prompt mid-session. We mitigate this by pre-fetching a fresh token
              when the client detects 12 minutes have elapsed, so the re-authentication happens in
              the background 3 minutes before expiry in most cases. Users who are idle for more than
              15 minutes authenticate again — that is the intended behavior.
            </p>

            <h2
              style={{
                fontFamily: 'var(--pub-font-serif, serif)',
                fontSize: '28px',
                fontWeight: 500,
                color: 'var(--pub-ink, #000)',
                marginBottom: '20px',
                letterSpacing: '-0.01em',
                marginTop: '40px',
              }}
            >
              Tenant isolation at the storage layer
            </h2>
            <p style={{ marginBottom: '20px' }}>
              Tenant isolation is not just enforced at the application layer. Every table that holds
              tenant data has a `tenant_id` column covered by a Postgres row-level security policy.
              Even if a bug in the application layer skipped the JWT scope check, the database would
              return an empty result set rather than cross-tenant data. The RLS policy is the last
              line of defense — defense in depth at the storage layer.
            </p>
            <p style={{ marginBottom: '40px' }}>
              Object store access (documents, artifacts, exports) follows the same pattern. Pre-signed
              URLs are generated with a tenant ID embedded in the path, and the storage layer validates
              that the requesting JWT&apos;s tenant ID matches the path before serving the object. A URL
              shared outside the system cannot be used to access tenant data without a valid, same-tenant JWT.
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
                }}
              >
                15-minute TTL vs. UX convenience
              </h3>
              <p>
                15-minute TTL is aggressive by enterprise standards; we chose it because the threat
                model prioritizes session hijacking over UX friction. The background pre-fetch at
                12 minutes mitigates most of the friction in active sessions. Users who expect
                8-hour sessions will notice the difference. We document this explicitly in
                onboarding rather than hiding it.
              </p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                No token refresh vs. standard refresh-token pattern
              </h3>
              <p>
                Standard OAuth2 systems use refresh tokens to extend sessions without full
                re-authentication. We chose not to implement refresh tokens because they introduce
                a secondary attack surface: a stolen refresh token can generate unlimited valid
                access tokens until it is revoked. Our threat model treats the refresh token
                attack surface as worse than the re-authentication friction. Customers with
                compliance requirements that mandate refresh tokens can use the Clerk session
                extension API, which is outside our JWT boundary.
              </p>
            </div>

            <div style={{ marginBottom: '28px' }}>
              <h3
                style={{
                  fontFamily: 'var(--pub-font-mono, monospace)',
                  fontSize: '13px',
                  color: 'var(--pub-ink, #000)',
                  marginBottom: '8px',
                }}
              >
                RLS at the database layer vs. application-only scoping
              </h3>
              <p>
                Row-level security adds overhead to every query — Postgres evaluates the RLS policy
                on every row access, not just at query planning time. The overhead is measurable:
                approximately 3–5% on analytical queries over large tables. We accept this cost
                because application-only scoping creates a single point of failure: a scoping bug
                in one API route exposes all tenant data. RLS means a scoping bug returns empty
                results, not a data breach.
              </p>
            </div>
          </div>
        </PaperContainer>
      </section>
    </div>
  );
}
