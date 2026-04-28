import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { getPublicContradictions } from '@/lib/public-site/public-corpus';
import { ContradictionRow } from '@/components/public-site/ContradictionRow';

export const metadata: Metadata = buildPageMetadata({
  title: 'Contradictions',
  description: 'Five contradictions from the AbarVa corpus — vendor claims measured against internal evidence. Updated weekly.',
  openGraph: { url: CANONICAL_URLS.contradictions },
});

export default function ContradictionsPage() {
  const contradictions = getPublicContradictions();
  return (
    <div style={{ paddingTop: 80, background: 'var(--pub-paper)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>
        <header style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 16 }}>
            Contradictions we publish
          </h1>
          <p style={{ fontSize: 18, color: 'var(--pub-slate)', maxWidth: 720, lineHeight: 1.65 }}>
            Most knowledge bases hide their tensions. Vendor claims that don&apos;t match internal data are &ldquo;softened.&rdquo; Analyst reports that disagree are &ldquo;synthesized.&rdquo; Customer experiences that contradict marketing are &ldquo;outliers.&rdquo;
          </p>
          <p style={{ fontSize: 18, color: 'var(--pub-slate)', maxWidth: 720, lineHeight: 1.65, marginTop: 16 }}>
            We publish the contradictions because hiding them would make the corpus less useful. The customer is paying for honest reasoning, not a marketing department.
          </p>
        </header>
        <div style={{ border: '1px solid var(--pub-rule)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 110px', gap: 16, padding: '10px 20px', background: 'var(--pub-navy)' }}>
            {['Contradiction', 'Parties', 'Delta', 'Status'].map(h => (
              <span key={h} style={{ fontSize: 10, fontFamily: 'var(--pub-font-mono)', color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{h}</span>
            ))}
          </div>
          {contradictions.map((c, i) => <ContradictionRow key={c.id} contradiction={c} index={i} />)}
        </div>
      </div>
    </div>
  );
}
