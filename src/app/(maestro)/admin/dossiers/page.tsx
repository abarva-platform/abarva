import { connection } from 'next/server';
import Link from 'next/link';
import { getActiveClientRow } from '@/lib/active-client';
import { canonicalClientDisplayName } from '@/lib/client-config';
import { listDecisionThreads, type DecisionThreadDossier } from '@/lib/decisions/auto-linker';

export const metadata = { title: 'Decision Dossiers · AbarVa' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminDossiersPage() {
  await connection();
  const activeClient = await getActiveClientRow().catch(() => null);
  const clientKey = activeClient?.key ?? undefined;
  const clientName =
    canonicalClientDisplayName({ key: activeClient?.key, name: activeClient?.name }) ??
    'AbarVa Client';
  const result: { dossiers: DecisionThreadDossier[]; error?: string } = await listDecisionThreads(clientKey).then(
    (dossiers) => ({ dossiers }),
    (error) => ({ error: error instanceof Error ? error.message : 'Unknown dossier list error', dossiers: [] }),
  );

  return (
    <main style={pageStyle}>
      <div style={shellStyle}>
        <header style={headerStyle}>
          <div>
            <Link href="/admin" style={backLinkStyle}>Admin</Link>
            <div style={eyebrowStyle}>{clientName}</div>
            <h1 style={titleStyle}>Decision Dossiers</h1>
            <p style={subtitleStyle}>
              Cross-surface decision threads sorted by last activity. A CIO can open one dossier and see
              Intelligence, Moves, Source, Tower, artifacts, and proof-point continuity without reconstructing the story.
            </p>
          </div>
          <div style={summaryStyle}>
            <Metric label="Threads" value={String(result.dossiers.length)} />
            <Metric label="Open / in flight" value={String(result.dossiers.filter((dossier) => dossier.thread.status === 'open' || dossier.thread.status === 'in_flight').length)} />
            <Metric label="Proof points" value={String(totalProofPoints(result.dossiers))} />
          </div>
        </header>

        {result.error && (
          <section style={errorStyle}>
            <strong>Dossier list unavailable:</strong> {result.error}
          </section>
        )}

        <section style={listStyle}>
          {result.dossiers.length === 0 ? (
            <div style={emptyStyle}>
              No decision threads exist for this tenant yet. Open a Move or Source event to auto-link a dossier.
            </div>
          ) : (
            result.dossiers.map((dossier) => (
              <Link key={dossier.thread.id} href={`/dossier/${dossier.thread.id}`} style={rowStyle}>
                <div>
                  <div style={rowTitleStyle}>{dossier.thread.title}</div>
                  <div style={metaStyle}>{dossier.thread.thread_slug}</div>
                </div>
                <div style={pillRowStyle}>
                  <Pill label="Intelligence" value={countSurface(dossier, 'intelligence')} />
                  <Pill label="Moves" value={countSurface(dossier, 'moves')} />
                  <Pill label="Source" value={countSurface(dossier, 'source')} />
                  <Pill label="Tower" value={countSurface(dossier, 'tower')} />
                  <Pill label="KDD options" value={dossier.options.length} />
                </div>
                <div style={rightStyle}>
                  <div style={statusStyle}>{dossier.thread.status.replace(/_/g, ' ')}</div>
                  <div style={metaStyle}>{new Date(dossier.thread.last_activity_at).toLocaleDateString()}</div>
                </div>
              </Link>
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function countSurface(dossier: DecisionThreadDossier, surface: string): number {
  return dossier.links.filter((link) => link.surface === surface).length;
}

function totalProofPoints(dossiers: DecisionThreadDossier[]): number {
  return dossiers.reduce(
    (sum, dossier) => sum + Object.values(dossier.proofPointCounts).reduce((inner, count) => inner + count, 0),
    0,
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricStyle}>
      <div style={metricValueStyle}>{value}</div>
      <div style={metaStyle}>{label}</div>
    </div>
  );
}

function Pill({ label, value }: { label: string; value: number }) {
  return (
    <span style={pillStyle}>{label}: {value}</span>
  );
}

const pageStyle = { minHeight: '100vh', background: '#F8F7F4', color: '#111827', padding: '32px 28px 56px' } as const;
const shellStyle = { maxWidth: 1120, margin: '0 auto' } as const;
const headerStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 300px', gap: 24, alignItems: 'start', marginBottom: 22 } as const;
const backLinkStyle = { color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' } as const;
const eyebrowStyle = { marginTop: 12, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 10, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#667085', fontWeight: 800 } as const;
const titleStyle = { margin: '8px 0 8px', fontFamily: 'Georgia, serif', fontSize: 44, lineHeight: 1.06, fontWeight: 400 } as const;
const subtitleStyle = { margin: 0, maxWidth: 720, fontSize: 15, lineHeight: 1.55, color: '#475467' } as const;
const summaryStyle = { display: 'grid', gap: 10, background: '#fff', border: '1px solid #d7d2c6', borderRadius: 8, padding: 16 } as const;
const metricStyle = { display: 'grid', gap: 4, borderBottom: '1px solid #ece7dd', paddingBottom: 9 } as const;
const metricValueStyle = { fontSize: 20, fontWeight: 900, textTransform: 'capitalize' } as const;
const metaStyle = { color: '#667085', fontSize: 12, lineHeight: 1.4 } as const;
const errorStyle = { border: '1px solid #fecdca', background: '#fef3f2', color: '#b42318', padding: 14, borderRadius: 6, marginBottom: 18 } as const;
const listStyle = { display: 'grid', gap: 10 } as const;
const emptyStyle = { border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 20, color: '#667085' } as const;
const rowStyle = { display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(320px, 0.9fr) 150px', gap: 16, alignItems: 'center', border: '1px solid #d7d2c6', borderRadius: 8, background: '#fff', padding: 16, color: '#111827', textDecoration: 'none' } as const;
const rowTitleStyle = { fontSize: 16, fontWeight: 850 } as const;
const pillRowStyle = { display: 'flex', flexWrap: 'wrap', gap: 7 } as const;
const pillStyle = { display: 'inline-flex', border: '1px solid #d0d5dd', borderRadius: 999, padding: '4px 8px', fontSize: 11, fontWeight: 800, color: '#344054', background: '#f9fafb' } as const;
const rightStyle = { textAlign: 'right' } as const;
const statusStyle = { fontSize: 13, fontWeight: 850, textTransform: 'capitalize' } as const;
