import type { Metadata } from 'next';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';
import { CANONICAL_URLS } from '@/lib/public-site/canonical-urls';
import { getDigestEntries } from '@/lib/public-site/digest-source';
import { DigestEntryCard } from '@/components/public-site/DigestEntry';
import Link from 'next/link';

export const metadata: Metadata = buildPageMetadata({
  title: 'Corpus digest',
  description: 'Weekly changelog of new patterns, updated contradictions, and ingested signals from the AbarVa corpus.',
  openGraph: { url: CANONICAL_URLS.digest },
});

export default function DigestPage() {
  const entries = getDigestEntries();
  return (
    <div style={{ paddingTop: 80, background: 'var(--pub-paper)', minHeight: '100vh', paddingBottom: 80 }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 32px' }}>
        <header style={{ marginBottom: 48 }}>
          <p style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Corpus changelog
          </p>
          <h1 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 16 }}>
            Digest
          </h1>
          <p style={{ fontSize: 18, color: 'var(--pub-slate)', marginBottom: 24, maxWidth: 580 }}>
            Every week the corpus changes. New patterns added, contradictions updated, signals ingested. This is the record.
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <a href={CANONICAL_URLS.rssFeed} style={{ fontSize: 13, color: 'var(--pub-signal)', fontFamily: 'var(--pub-font-mono)', textDecoration: 'none' }}>
              RSS →
            </a>
            <a href={CANONICAL_URLS.atomFeed} style={{ fontSize: 13, color: 'var(--pub-signal)', fontFamily: 'var(--pub-font-mono)', textDecoration: 'none' }}>
              Atom →
            </a>
            <a href={CANONICAL_URLS.jsonFeed} style={{ fontSize: 13, color: 'var(--pub-signal)', fontFamily: 'var(--pub-font-mono)', textDecoration: 'none' }}>
              JSON Feed →
            </a>
          </div>
        </header>
        {entries.map(entry => (
          <DigestEntryCard key={entry.weekOf} entry={entry} />
        ))}
      </div>
    </div>
  );
}
