import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// Connector health panel · Steward surface. Reads are composite: the six
// canonical integrations AbarVa ships on. Last-sync timestamps are
// computed relative to request time and labelled "composite · demo" so
// the DOM integrity linter + human reviewers see the provenance at a
// glance. Admin-only via Clerk publicMetadata.role.

interface ConnectorRow {
  name: string;
  vendor: string;
  minutesAgo: number;        // composite · demo value · displayed as relative time
  state: 'healthy' | 'stale' | 'error';
  errorDetail?: string;
  docsHref: string;
}

const CONNECTORS: ConnectorRow[] = [
  {
    name: 'Clerk',
    vendor: 'Identity + SSO',
    minutesAgo: 2,
    state: 'healthy',
    docsHref: 'https://clerk.com/docs',
  },
  {
    name: 'Supabase',
    vendor: 'Postgres + storage',
    minutesAgo: 4,
    state: 'healthy',
    docsHref: 'https://supabase.com/docs',
  },
  {
    name: 'Vercel',
    vendor: 'Build + edge',
    minutesAgo: 11,
    state: 'healthy',
    docsHref: 'https://vercel.com/docs',
  },
  {
    name: 'Pinecone',
    vendor: 'Vector index',
    minutesAgo: 38,
    state: 'healthy',
    docsHref: 'https://docs.pinecone.io/',
  },
  {
    name: 'Neo4j Aura',
    vendor: 'Pattern graph',
    minutesAgo: 4320,
    state: 'stale',
    errorDetail: 'Last sync 3 days ago · re-seed recommended',
    docsHref: 'https://neo4j.com/docs/aura/',
  },
  {
    name: 'OpenAI',
    vendor: 'Inference gateway',
    minutesAgo: 1,
    state: 'healthy',
    docsHref: 'https://status.openai.com/',
  },
];

function relativeTime(minutesAgo: number): string {
  if (minutesAgo < 1) return 'just now';
  if (minutesAgo < 60) return `${minutesAgo} min ago`;
  const hrs = Math.round(minutesAgo / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

function stateLabel(s: ConnectorRow['state']): string {
  switch (s) {
    case 'healthy': return 'Healthy';
    case 'stale':   return 'Stale';
    case 'error':   return 'Error';
  }
}

export default async function AdminConnectorsPage() {
  const session = await auth();
  if (!session.userId) redirect('/sign-in');

  const clerk = await clerkClient();
  const callingUser = await clerk.users.getUser(session.userId);
  const callingRole = (callingUser.publicMetadata?.role as string | undefined) ?? '';
  if (callingRole !== 'admin') {
    return (
      <main style={{ padding: 40, fontFamily: 'DM Sans, sans-serif' }}>
        <h1 style={{ fontFamily: 'Georgia, serif' }}>Admin access only</h1>
        <p>Connector health is restricted to admin-role users.</p>
      </main>
    );
  }

  const healthyCount = CONNECTORS.filter((c) => c.state === 'healthy').length;
  const staleCount = CONNECTORS.filter((c) => c.state === 'stale').length;
  const errorCount = CONNECTORS.filter((c) => c.state === 'error').length;

  return (
    <main style={{ minHeight: '100vh', background: '#F5F1EB', color: '#1a1612', fontFamily: "'DM Sans', -apple-system, sans-serif" }}>
      <style>{pageCss}</style>
      <div className="ac-shell">
        <header className="ac-header">
          <div className="ac-eyebrow">Admin · connectors</div>
          <h1 className="ac-title">Connector health</h1>
          <p className="ac-lede">
            Six canonical integrations power Nexus. Last-sync timestamps are composite demo
            values that illustrate the monitoring surface — wire these rows to live adapters
            when the integration health service ships.
          </p>
        </header>

        <section className="ac-panel">
          <div className="ac-section-head">
            <div className="ac-eyebrow">Roll-up</div>
            <span className="ac-count">{CONNECTORS.length} tracked</span>
          </div>
          <div className="ac-rollup">
            <div className="ac-rollup-cell ok">
              <div className="ac-rollup-value">{healthyCount}</div>
              <div className="ac-rollup-label">Healthy</div>
            </div>
            <div className="ac-rollup-cell warn">
              <div className="ac-rollup-value">{staleCount}</div>
              <div className="ac-rollup-label">Stale</div>
            </div>
            <div className="ac-rollup-cell err">
              <div className="ac-rollup-value">{errorCount}</div>
              <div className="ac-rollup-label">Error</div>
            </div>
          </div>
        </section>

        <section className="ac-panel">
          <div className="ac-section-head">
            <div className="ac-eyebrow">Integrations</div>
            <span className="ac-count">composite · demo</span>
          </div>
          <table className="ac-table">
            <thead>
              <tr>
                <th>Connector</th>
                <th>Surface</th>
                <th>Last sync</th>
                <th>State</th>
                <th>Docs</th>
              </tr>
            </thead>
            <tbody>
              {CONNECTORS.map((c) => (
                <tr key={c.name}>
                  <td className="ac-td-name">{c.name}</td>
                  <td className="ac-td-vendor">{c.vendor}</td>
                  <td className="ac-td-sync">
                    {relativeTime(c.minutesAgo)}
                    {c.errorDetail ? (
                      <div className="ac-td-detail">{c.errorDetail}</div>
                    ) : null}
                  </td>
                  <td>
                    <span className={`ac-pill ${c.state}`}>{stateLabel(c.state)}</span>
                  </td>
                  <td>
                    <a
                      className="ac-docs-link"
                      href={c.docsHref}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      Open docs
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <footer className="ac-footer">
          <p>Composite organization built from real-world data.</p>
          <p>Last-sync values are seed · demo. Replace with live adapter output when the health service is wired.</p>
        </footer>
      </div>
    </main>
  );
}

const pageCss = `
.ac-shell { max-width: 1100px; margin: 0 auto; padding: 40px 32px 80px; }
.ac-header { margin-bottom: 32px; padding-bottom: 24px; border-bottom: 1px solid rgba(26,22,18,0.10); }
.ac-eyebrow {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #3B82F6; font-weight: 700;
  margin-bottom: 8px;
}
.ac-title { font-family: Georgia, serif; font-size: 40px; letter-spacing: -0.025em; margin: 0 0 12px; font-weight: 700; line-height: 1.1; }
.ac-lede { font-size: 15px; line-height: 1.65; color: #3d342d; margin: 0; max-width: 680px; }
.ac-panel {
  background: #FFFFFF; border: 1px solid rgba(26,22,18,0.10);
  border-radius: 16px; padding: 24px; margin-bottom: 24px;
  box-shadow: 0 1px 2px rgba(26,22,18,0.04);
}
.ac-section-head { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 16px; }
.ac-count {
  font-family: 'JetBrains Mono', monospace; font-size: 12px;
  color: #6d625a; font-weight: 700;
}
.ac-rollup { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.ac-rollup-cell {
  border: 1px solid rgba(26,22,18,0.10); border-radius: 12px; padding: 16px 18px;
  background: #FAF7F1;
}
.ac-rollup-cell.ok   { border-color: rgba(22,101,52,0.25); background: rgba(220,252,231,0.5); }
.ac-rollup-cell.warn { border-color: rgba(180,83,9,0.25);  background: rgba(254,243,199,0.5); }
.ac-rollup-cell.err  { border-color: rgba(197,48,48,0.25); background: rgba(254,226,226,0.5); }
.ac-rollup-value {
  font-family: Georgia, serif; font-size: 32px; font-weight: 700; color: #1a1612;
  line-height: 1; margin-bottom: 6px;
}
.ac-rollup-label {
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.12em; text-transform: uppercase; color: #6d625a; font-weight: 700;
}
.ac-table { width: 100%; border-collapse: collapse; }
.ac-table th {
  font-family: 'JetBrains Mono', monospace; font-size: 9px;
  letter-spacing: 0.14em; text-transform: uppercase; color: #8a7e72; font-weight: 700;
  text-align: left; padding: 10px 12px; border-bottom: 1px solid rgba(26,22,18,0.1);
}
.ac-table td {
  padding: 12px; border-bottom: 1px solid rgba(26,22,18,0.06);
  font-size: 13.5px; color: #1a1612; vertical-align: top;
}
.ac-td-name { font-weight: 600; }
.ac-td-vendor { color: #6d625a; }
.ac-td-sync { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #3d342d; }
.ac-td-detail { margin-top: 4px; font-size: 11px; color: #B45309; font-family: 'DM Sans', sans-serif; }
.ac-pill {
  display: inline-block; padding: 3px 9px; border-radius: 999px;
  font-family: 'JetBrains Mono', monospace; font-size: 10px;
  letter-spacing: 0.1em; text-transform: uppercase; font-weight: 700;
}
.ac-pill.healthy { background: rgba(22,101,52,0.12); color: #166534; }
.ac-pill.stale   { background: rgba(180,83,9,0.12);  color: #B45309; }
.ac-pill.error   { background: rgba(197,48,48,0.12); color: #C53030; }
.ac-docs-link {
  font-family: 'JetBrains Mono', monospace; font-size: 11px;
  letter-spacing: 0.08em; text-transform: uppercase; color: #3B82F6;
  text-decoration: none; font-weight: 700;
}
.ac-docs-link:hover { text-decoration: underline; }
.ac-footer {
  margin-top: 40px; padding-top: 18px; border-top: 1px solid rgba(26,22,18,0.10);
  font-size: 12px; color: #8a7e72; line-height: 1.7;
}
.ac-footer p { margin: 0 0 3px; }
`;
