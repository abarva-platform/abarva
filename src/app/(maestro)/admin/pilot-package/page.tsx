import Link from 'next/link';
import type { CSSProperties } from 'react';

export const metadata = { title: 'Pilot Evidence Package · AbarVa' };
export const dynamic = 'force-dynamic';

const shell: CSSProperties = {
  minHeight: '100vh',
  background: '#F8F7F4',
  color: '#111827',
  padding: '32px 28px 54px',
};

export default function PilotEvidencePackagePage() {
  return (
    <main style={shell}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>
        <Link href="/admin" style={{ color: '#4b5563', fontSize: 13, fontWeight: 720, textDecoration: 'none' }}>
          Admin
        </Link>
        <h1 style={{ margin: '10px 0 8px', fontFamily: 'Georgia, serif', fontWeight: 400, fontSize: 40 }}>
          Pilot Evidence Package
        </h1>
        <p style={{ maxWidth: 720, lineHeight: 1.6, color: '#4b5563' }}>
          Build the CFO-ready pilot proof bundle from generated board packs, Evidence Ledger proof points,
          AI egress audit rows, and signed outcome evidence.
        </p>

        <section style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          {[
            ['1', 'Select date range and use cases'],
            ['2', 'Resolve required Evidence Ledger rows for every claim'],
            ['3', 'Render PDF, PPTX, and HTML bundle through the Packet 20 engine'],
            ['4', 'Run consistency guard before publishing'],
          ].map(([step, label]) => (
            <div key={step} style={{ border: '1px solid #d7d2c6', borderRadius: 8, padding: 16, background: '#fff' }}>
              <strong>{step}</strong>
              <span style={{ marginLeft: 10 }}>{label}</span>
            </div>
          ))}
        </section>

        <button
          type="button"
          disabled
          style={{
            marginTop: 24,
            border: '1px solid #111827',
            borderRadius: 8,
            background: '#111827',
            color: '#fff',
            padding: '12px 16px',
            fontWeight: 800,
            opacity: 0.55,
          }}
        >
          Build pilot evidence package
        </button>
        <p style={{ color: '#6b7280', fontSize: 13 }}>
          Generation API wiring lands after the first generated_artifacts migration is applied.
        </p>
      </div>
    </main>
  );
}
