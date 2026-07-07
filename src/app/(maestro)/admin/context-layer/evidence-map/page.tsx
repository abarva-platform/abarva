import Link from 'next/link';

import { getActiveClientRow } from '@/lib/active-client';
import {
  getTenantEvidenceMapForFile,
  getTenantSourceFiles,
} from '@/lib/context-ingestion/tenant-context-read-model';

export const metadata = { title: 'Context Evidence Map | AbarVa Admin' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

type ContextEvidenceMapPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function excerpt(value: string): string {
  if (value.length <= 280) return value;
  return `${value.slice(0, 277)}...`;
}

export default async function ContextEvidenceMapPage({
  searchParams,
}: ContextEvidenceMapPageProps) {
  const activeClient = await getActiveClientRow(null);
  const params = searchParams ? await searchParams : {};
  const requestedSourceDoc = one(params.source_doc);
  const sourceFiles = activeClient
    ? await getTenantSourceFiles(activeClient.id, { limit: 50 })
    : [];
  const selectedSourceDoc = requestedSourceDoc ?? sourceFiles[0]?.source_doc ?? null;
  const rows = activeClient && selectedSourceDoc
    ? await getTenantEvidenceMapForFile(activeClient.id, selectedSourceDoc)
    : [];

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100%', padding: 32 }}>
      <section style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gap: 18 }}>
        <div>
          <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, letterSpacing: 0, textTransform: 'uppercase' }}>
            Admin · Evidence map
          </p>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42, margin: 0 }}>
            {activeClient ? `${activeClient.name} evidence map` : 'Evidence map'}
          </h1>
          {selectedSourceDoc ? (
            <p style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
              Showing chunks from <strong>{selectedSourceDoc}</strong>.
            </p>
          ) : null}
        </div>

        {sourceFiles.length > 0 ? (
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {sourceFiles.slice(0, 12).map((file) => (
              <Link
                key={file.source_doc}
                href={`/admin/context-layer/evidence-map?source_doc=${encodeURIComponent(file.source_doc)}`}
                style={{
                  border: selectedSourceDoc === file.source_doc ? '2px solid #171717' : '1px solid #d8d2c4',
                  borderRadius: 6,
                  color: '#171717',
                  fontFamily: 'DM Sans, sans-serif',
                  padding: '8px 10px',
                  textDecoration: 'none',
                }}
              >
                {file.source_doc}
              </Link>
            ))}
          </nav>
        ) : null}

        {!activeClient ? (
          <p style={{ fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
            No active client row is available for this session.
          </p>
        ) : !selectedSourceDoc ? (
          <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif' }}>
            No source files are loaded for this tenant yet.
          </div>
        ) : rows.length === 0 ? (
          <div style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 18, fontFamily: 'DM Sans, sans-serif' }}>
            No evidence chunks were found for this source document.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 10 }}>
            {rows.map((row) => (
              <article key={row.chunk_id} style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 14, fontFamily: 'DM Sans, sans-serif' }}>
                <strong>{row.chunk_id}</strong>
                <div style={{ color: '#514c43', marginTop: 4 }}>
                  Chunk {row.chunk_index} · {row.embedding_status} · {row.embedded_at ?? 'not embedded'}
                </div>
                <p style={{ lineHeight: 1.55, marginBottom: 0 }}>{excerpt(row.chunk_text)}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
