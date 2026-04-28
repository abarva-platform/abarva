import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { getPublicContradictionById, getStatusLabel, getStatusColor, getConfidenceDelta } from '@/lib/public-site/public-corpus';
import Link from 'next/link';

export function generateStaticParams() {
  return ['CON-001', 'CON-002', 'CON-004', 'CON-005', 'CON-008'].map(id => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const c = getPublicContradictionById(id);
  if (!c) return { title: 'Not found' };
  return buildPageMetadata({
    title: c.title,
    description: c.body,
    openGraph: { url: CANONICAL_URLS.contradiction(id) },
  });
}

export default async function ContradictionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const c = getPublicContradictionById(id);
  if (!c) notFound();

  const statusColor = getStatusColor(c.status);
  const delta = getConfidenceDelta(c.partyA.confidence, c.partyB.confidence);

  return (
    <article style={{ paddingTop: 80, background: 'var(--pub-paper)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ marginBottom: 12 }}>
          <Link href="/contradictions/" style={{ fontSize: 13, color: 'var(--pub-stone)', textDecoration: 'none', fontFamily: 'var(--pub-font-mono)' }}>
            ← Contradictions
          </Link>
        </div>
        <header style={{ marginBottom: 40 }}>
          <p style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-stone)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{c.id}</p>
          <h1 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 16, lineHeight: 1.2 }}>
            {c.title}
          </h1>
          <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 100, fontSize: 12, fontFamily: 'var(--pub-font-mono)', fontWeight: 600, background: `${statusColor}18`, color: statusColor, border: `1px solid ${statusColor}40` }}>
            {getStatusLabel(c.status)}
          </span>
        </header>

        {/* Party A */}
        <section style={{ marginBottom: 32, padding: '24px', background: '#f5f2ec', borderRadius: 12, border: '1px solid var(--pub-rule)' }}>
          <h2 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--pub-stone)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Party A — Confidence {Math.round(c.partyA.confidence * 100)}%</h2>
          <p style={{ fontSize: 16, color: 'var(--pub-ink)', fontWeight: 500, marginBottom: 10 }}>{c.partyA.claim}</p>
          <p style={{ fontSize: 14, color: 'var(--pub-slate)', marginBottom: 6 }}><strong>Source:</strong> {c.partyA.source}</p>
          <p style={{ fontSize: 14, color: 'var(--pub-slate)' }}><strong>Evidence:</strong> {c.partyA.evidence}</p>
        </section>

        {/* Party B */}
        <section style={{ marginBottom: 32, padding: '24px', background: '#f5f2ec', borderRadius: 12, border: '1px solid var(--pub-rule)' }}>
          <h2 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--pub-stone)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Party B — Confidence {Math.round(c.partyB.confidence * 100)}%</h2>
          <p style={{ fontSize: 16, color: 'var(--pub-ink)', fontWeight: 500, marginBottom: 10 }}>{c.partyB.claim}</p>
          <p style={{ fontSize: 14, color: 'var(--pub-slate)', marginBottom: 6 }}><strong>Source:</strong> {c.partyB.source}</p>
          <p style={{ fontSize: 14, color: 'var(--pub-slate)' }}><strong>Evidence:</strong> {c.partyB.evidence}</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 12 }}>Why both cannot be true</h2>
          <p style={{ fontSize: 15, color: 'var(--pub-slate)', lineHeight: 1.7 }}>{c.whyBothCannotBeTrue}</p>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 12 }}>Confidence delta</h2>
          <p style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 24, fontWeight: 600, color: delta.startsWith('+') ? '#1d7a4a' : '#ba7517' }}>{delta}</p>
          <p style={{ fontSize: 14, color: 'var(--pub-stone)', marginTop: 6 }}>Party B confidence minus Party A confidence</p>
        </section>

        {c.affectedPatternIds.length > 0 && (
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 12 }}>Affected patterns</h2>
            <ul style={{ listStyle: 'none', display: 'flex', flexWrap: 'wrap', gap: 8, padding: 0, margin: 0 }}>
              {c.affectedPatternIds.map(pid => (
                <li key={pid}>
                  <Link href={`/patterns/${pid.toLowerCase()}`} style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 12, color: 'var(--pub-signal)', padding: '4px 10px', border: '1px solid rgba(0,102,204,0.3)', borderRadius: 6, textDecoration: 'none' }}>
                    {pid}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 20, fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 12 }}>Resolution timeline</h2>
          <p style={{ fontSize: 15, color: 'var(--pub-slate)', lineHeight: 1.7 }}>{c.resolutionTimeline}</p>
        </section>

        <div style={{ paddingTop: 24, borderTop: '1px solid var(--pub-rule)', marginTop: 40 }}>
          <p style={{ fontSize: 14, color: 'var(--pub-stone)', marginBottom: 12 }}>This contradiction is one of 10 in the public corpus. The full AbarVa corpus tracks vendor claims across AI programs, sourcing events, and program outcomes.</p>
          <Link href={CANONICAL_URLS.contact} style={{ fontSize: 14, color: 'var(--pub-signal)', fontFamily: 'var(--pub-font-sans)', textDecoration: 'none' }}>
            Want your full corpus? Talk to us →
          </Link>
        </div>
      </div>
    </article>
  );
}
