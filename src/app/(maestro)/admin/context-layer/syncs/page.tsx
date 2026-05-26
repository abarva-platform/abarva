import { NORTHSTAR_INGESTION_STAGES } from '@/lib/context-ingestion/northstar-read-model';

export const metadata = { title: 'Context Syncs | AbarVa Setup' };
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ContextSyncsPage() {
  return (
    <main style={{ background: '#F8F7F4', minHeight: '100vh', padding: 32 }}>
      <section style={{ maxWidth: 980, margin: '0 auto' }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 42 }}>Sync history</h1>
        <div style={{ display: 'grid', gap: 10 }}>
          {NORTHSTAR_INGESTION_STAGES.map((stage, index) => (
            <div key={stage.stage} style={{ display: 'grid', gridTemplateColumns: '40px 1fr 180px', gap: 12, alignItems: 'center', background: '#fffdf8', border: '1px solid #d8d2c4', borderRadius: 8, padding: 14, fontFamily: 'DM Sans, sans-serif' }}>
              <strong>{index + 1}</strong>
              <span>{stage.stage}</span>
              <span>{stage.facts.toLocaleString()} facts</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
