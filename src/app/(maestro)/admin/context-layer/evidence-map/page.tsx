import { runNorthstarContextIngestion } from '@/lib/context-ingestion/sync-runner';

export const metadata = { title: 'Context Evidence Map | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContextEvidenceMapPage() {
  const result = runNorthstarContextIngestion({
    fileName: 'FY2025_Annual_Report.pdf',
    text: 'Northstar Clinical Technologies FY2025 revenue was $22.6B. Operating margin was 13.8%. TSA exit costs were $126M. The CFO margin plan targets $250M in run-rate savings.',
  });

  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 1040, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Evidence map</h1>
        <p style={{ fontFamily: 'DM Sans, sans-serif' }}>
          Claims below are generated from uploaded-source locators and are ready for evidence-chip rendering.
        </p>
        <div style={{ display: 'grid', gap: 10 }}>
          {result.committed.evidenceRows.slice(0, 16).map((row) => (
            <div key={row.evidenceId} style={{ background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 14, fontFamily: 'DM Sans, sans-serif' }}>
              <strong>{row.claim}</strong>
              <div>{row.sourceLocator.fileName} · page {row.sourceLocator.page ?? '-'} · confidence {row.confidence}</div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
