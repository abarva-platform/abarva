import Link from 'next/link';

import { getActiveClientRow } from '@/lib/active-client';
import { getTenantEmbeddingHistory } from '@/lib/context-ingestion/tenant-context-read-model';

export const metadata = { title: 'Context Syncs | AbarVa Admin' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(value: string): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function ContextSyncsPage() {
  const activeClient = await getActiveClientRow(null);
  const history = activeClient
    ? await getTenantEmbeddingHistory(activeClient.id, { limit: 100 })
    : [];

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100%', padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 0, textTransform: 'uppercase' }}>
            Admin · Embedding syncs
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42, margin: 0 }}>
            {activeClient ? `${activeClient.name} sync history` : 'Sync history'}
          </h1>
        </div>

        {!activeClient ? (
          <p style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
            No active client row is available for this session.
          </p>
        ) : history.length === 0 ? (
          <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif' }}>
            No embedding audit rows are recorded for this tenant yet.
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffdf8', fontFamily: 'DM Sans, sans-serif' }}>
            <thead>
              <tr>
                {['Created', 'Chunk', 'Provider', 'Model', 'Policy', 'Audit'].map((head) => (
                  <th key={head} style={{ padding: 10, borderBottom: '1px solid #d8d2c4', textAlign: 'left' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id}>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{formatDate(row.created_at)}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{row.chunk_id || 'Not recorded'}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{row.provider}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{row.model}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{row.policy_decision}</td>
                  <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>
                    <Link href={`/engineering/traces?traceId=${encodeURIComponent(row.id)}`} style={{ color: '#171717' }}>
                      View row
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}
