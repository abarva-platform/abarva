import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { PaperContainer } from '@/components/public-site/PaperContainer';

export const metadata: Metadata = buildPageMetadata({
  title: 'System status',
  description:
    'Public AbarVa service-status foundation for customer pilots, release windows, and incident communications.',
  openGraph: { url: CANONICAL_URLS.status },
});

const COMPONENTS = [
  {
    name: 'Application control plane',
    scope: 'Authenticated workspace, admin surfaces, release routing',
    status: 'Operational',
  },
  {
    name: 'Client private data planes',
    scope: 'Client-scoped Azure storage, Postgres, search, queues',
    status: 'Pilot readiness',
  },
  {
    name: 'Identity and SSO',
    scope: 'Clerk session, enterprise SAML/OIDC, role mapping',
    status: 'Pilot readiness',
  },
  {
    name: 'Document ingestion',
    scope: 'Upload, quarantine, parsing, processing ledger',
    status: 'Pilot readiness',
  },
  {
    name: 'AI reasoning services',
    scope: 'Claude/OpenAI adapters, egress audit, prompt-cache controls',
    status: 'Operational',
  },
  {
    name: 'Notifications',
    scope: 'Email dispatch, operator alerts, incident communications',
    status: 'Pilot readiness',
  },
] as const;

const INCIDENT_CHANNELS = [
  ['Sev 1', 'Customer impact, data exposure suspicion, or production outage', 'Immediate customer notification through named pilot channel'],
  ['Sev 2', 'Material degradation or failed release rollback', 'Customer update after triage and every material change'],
  ['Sev 3', 'Limited feature degradation with workaround', 'Status-page update when externally visible'],
] as const;

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: '1px solid rgba(39, 120, 92, 0.28)',
        borderRadius: 999,
        background: 'rgba(39, 120, 92, 0.08)',
        color: '#1f6b52',
        fontSize: 12,
        fontWeight: 700,
        padding: '5px 10px',
        lineHeight: 1,
      }}
    >
      {children}
    </span>
  );
}

export default function StatusPage() {
  return (
    <div style={{ background: 'var(--pub-paper)', minHeight: '100vh', paddingTop: 80, paddingBottom: 80 }}>
      <PaperContainer>
        <header style={{ maxWidth: 760, marginBottom: 44 }}>
          <p
            style={{
              fontFamily: 'var(--pub-font-mono)',
              fontSize: 11,
              color: 'var(--pub-stone)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              marginBottom: 14,
            }}
          >
            Service Status
          </p>
          <h1
            style={{
              fontFamily: 'var(--pub-font-serif)',
              fontSize: 'clamp(32px, 5vw, 48px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--pub-ink)',
              marginBottom: 16,
            }}
          >
            AbarVa service status
          </h1>
          <p style={{ fontSize: 17, color: 'var(--pub-slate)', lineHeight: 1.65, maxWidth: 680 }}>
            Public status foundation for customer pilots and enterprise procurement review. Live
            monitor-backed uptime and incident history will be connected when the external status
            provider is activated for production pilots.
          </p>
        </header>

        <section
          aria-label="Current status summary"
          style={{
            border: '1px solid var(--pub-rule)',
            borderRadius: 8,
            background: '#fffdf8',
            padding: 24,
            marginBottom: 28,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div>
              <Badge>No active public incident</Badge>
              <h2 style={{ fontSize: 22, marginTop: 16, marginBottom: 8 }}>Status-page foundation is live</h2>
              <p style={{ color: 'var(--pub-slate)', lineHeight: 1.6, maxWidth: 720 }}>
                This page is reachable without application sign-in. It is ready to receive incident
                posts, release-window notes, and external monitor data once the production status
                provider is configured.
              </p>
            </div>
            <div style={{ minWidth: 180 }}>
              <p style={{ fontSize: 12, color: 'var(--pub-stone)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Update cadence
              </p>
              <p style={{ fontSize: 16, color: 'var(--pub-ink)', marginTop: 8 }}>Incident-driven</p>
            </div>
          </div>
        </section>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 44 }}>
          {COMPONENTS.map((component) => (
            <article
              key={component.name}
              style={{
                border: '1px solid var(--pub-rule)',
                borderRadius: 8,
                background: 'var(--pub-paper)',
                padding: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
                <h3 style={{ fontSize: 16, fontFamily: 'var(--pub-font-sans)', fontWeight: 700 }}>
                  {component.name}
                </h3>
                <span style={{ fontSize: 12, color: component.status === 'Operational' ? '#1f6b52' : 'var(--pub-stone)', whiteSpace: 'nowrap' }}>
                  {component.status}
                </span>
              </div>
              <p style={{ fontSize: 14, color: 'var(--pub-slate)', lineHeight: 1.55 }}>{component.scope}</p>
            </article>
          ))}
        </section>

        <section style={{ borderTop: '1px solid var(--pub-rule)', paddingTop: 32 }}>
          <h2 style={{ fontSize: 24, marginBottom: 14 }}>Incident communication model</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ color: 'var(--pub-stone)', textAlign: 'left' }}>
                  <th style={{ borderBottom: '1px solid var(--pub-rule)', padding: '10px 8px' }}>Severity</th>
                  <th style={{ borderBottom: '1px solid var(--pub-rule)', padding: '10px 8px' }}>Trigger</th>
                  <th style={{ borderBottom: '1px solid var(--pub-rule)', padding: '10px 8px' }}>Customer communication</th>
                </tr>
              </thead>
              <tbody>
                {INCIDENT_CHANNELS.map(([severity, trigger, communication]) => (
                  <tr key={severity}>
                    <td style={{ borderBottom: '1px solid var(--pub-rule)', padding: '12px 8px', fontWeight: 700 }}>
                      {severity}
                    </td>
                    <td style={{ borderBottom: '1px solid var(--pub-rule)', padding: '12px 8px', color: 'var(--pub-slate)' }}>
                      {trigger}
                    </td>
                    <td style={{ borderBottom: '1px solid var(--pub-rule)', padding: '12px 8px', color: 'var(--pub-slate)' }}>
                      {communication}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </PaperContainer>
    </div>
  );
}
