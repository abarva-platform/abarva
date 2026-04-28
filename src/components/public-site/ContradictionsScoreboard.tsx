import { getPublicContradictions } from '@/lib/public-site/public-corpus';
import { ContradictionRow } from './ContradictionRow';
import Link from 'next/link';

export function ContradictionsScoreboard() {
  const contradictions = getPublicContradictions();

  return (
    <section style={{ background: '#f5f2ec', padding: '80px 32px', borderTop: '1px solid var(--pub-rule)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <header style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 10 }}>
            Vendor claim vs. measured reality
          </h2>
          <p style={{ fontSize: 16, color: 'var(--pub-slate)', maxWidth: 640, lineHeight: 1.6, marginBottom: 0 }}>
            Five contradictions from the AbarVa corpus. Updated weekly. We publish ours; nobody else publishes theirs.
          </p>
        </header>

        <div style={{ border: '1px solid var(--pub-rule)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px', gap: 16, padding: '10px 20px', background: 'var(--pub-navy)' }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--pub-font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Contradiction</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--pub-font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Parties</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--pub-font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>Delta</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--pub-font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Status</span>
          </div>
          {contradictions.map((c, i) => (
            <ContradictionRow key={c.id} contradiction={c} index={i} />
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 15, color: 'var(--pub-slate)', lineHeight: 1.7, maxWidth: 720, fontStyle: 'italic' }}>
            Most analyst reports soften vendor claims with hedges. Most vendor case studies cherry-pick data. We publish the contradictions because hiding them would make the corpus less useful — and useful is what the customer is paying for.
          </p>
        </div>

        <Link href="/contradictions/" style={{ fontSize: 14, color: 'var(--pub-signal)', fontFamily: 'var(--pub-font-sans)', textDecoration: 'none' }}>
          Browse all 10 contradictions →
        </Link>
      </div>
    </section>
  );
}
