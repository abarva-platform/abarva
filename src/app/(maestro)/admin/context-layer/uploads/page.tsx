import Link from 'next/link';

import { CsvUploadConnector } from '@/components/admin/context-layer/CsvUploadConnector';
import { getActiveClientRow } from '@/lib/active-client';
import { getTenantSourceFiles } from '@/lib/context-ingestion/tenant-context-read-model';

export const metadata = { title: 'Context Uploads | AbarVa Admin' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function formatDate(value: string): string {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default async function ContextUploadsPage() {
  const activeClient = await getActiveClientRow(null);
  const sourceFiles = activeClient
    ? await getTenantSourceFiles(activeClient.id, { limit: 50 })
    : [];

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 0, textTransform: 'uppercase' }}>
            Admin · Context uploads
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42, margin: 0 }}>
            {activeClient ? `${activeClient.name} source files` : 'Context uploads'}
          </h1>
        </div>

        {!activeClient ? (
          <p style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
            No active client row is available for this session.
          </p>
        ) : (
          <>
            <CsvUploadConnector clientId={activeClient.id} tenantName={activeClient.name} />

            {sourceFiles.length === 0 ? (
              <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif' }}>
                No source files are loaded for this tenant yet.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fffdf8', fontFamily: 'DM Sans, sans-serif' }}>
                <thead>
                  <tr>
                    {['Source document', 'Chunks', 'First loaded', 'Sample chunk', 'Evidence'].map((head) => (
                      <th key={head} style={{ padding: 10, borderBottom: '1px solid #d8d2c4', textAlign: 'left' }}>{head}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sourceFiles.map((file) => (
                    <tr key={file.source_doc}>
                      <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{file.source_doc}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{file.chunk_count.toLocaleString()}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{formatDate(file.first_loaded_at)}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>{file.sample_chunk_id}</td>
                      <td style={{ padding: 10, borderBottom: '1px solid #eee7d8' }}>
                        <Link
                          href={`/admin/context-layer/evidence-map?source_doc=${encodeURIComponent(file.source_doc)}`}
                          style={{ color: '#171717' }}
                        >
                          View chunks
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>
    </main>
  );
}
