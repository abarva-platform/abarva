import type { DigestEntry } from '@/lib/public-site/digest-source';
import Link from 'next/link';

interface DigestEntryProps {
  entry: DigestEntry;
}

export function DigestEntryCard({ entry }: DigestEntryProps) {
  return (
    <article style={{
      border: '1px solid var(--pub-rule)',
      borderRadius: 12,
      padding: '32px 36px',
      background: 'var(--pub-paper)',
      marginBottom: 24,
    }}>
      <header style={{ marginBottom: 28 }}>
        <p style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-stone)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
          Corpus changelog
        </p>
        <h2 style={{ fontFamily: 'var(--pub-font-serif)', fontSize: 28, fontWeight: 500, color: 'var(--pub-ink)', marginBottom: 0 }}>
          {entry.weekLabel}
        </h2>
      </header>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--pub-stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          New patterns ({entry.newPatterns.length})
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.newPatterns.map(p => (
            <li key={p.id} style={{ fontSize: 14, color: 'var(--pub-slate)', display: 'flex', gap: 10, alignItems: 'baseline' }}>
              <span style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-signal)', minWidth: 96 }}>{p.id}</span>
              <span>{p.title}</span>
              <span style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, color: 'var(--pub-stone)', textTransform: 'uppercase' }}>{p.tier}</span>
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--pub-stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Contradictions updated ({entry.contradictionsUpdated.length})
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entry.contradictionsUpdated.map(c => (
            <li key={c.id} style={{ fontSize: 14, color: 'var(--pub-slate)' }}>
              <span style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-signal)', marginRight: 10 }}>{c.id}</span>
              <strong style={{ color: 'var(--pub-ink)' }}>{c.title}</strong>
              {' — '}{c.change}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginBottom: 24 }}>
        <h3 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--pub-stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          Signals ingested ({entry.signalsIngested.length})
        </h3>
        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {entry.signalsIngested.map(s => (
            <li key={s.id} style={{ fontSize: 14, color: 'var(--pub-slate)' }}>{s.summary}</li>
          ))}
        </ul>
      </section>

      {entry.patternRevisions.length > 0 && (
        <section>
          <h3 style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 10, fontWeight: 600, color: 'var(--pub-stone)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Pattern revisions ({entry.patternRevisions.length})
          </h3>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {entry.patternRevisions.map(r => (
              <li key={r.id} style={{ fontSize: 14, color: 'var(--pub-slate)' }}>
                <span style={{ fontFamily: 'var(--pub-font-mono)', fontSize: 11, color: 'var(--pub-signal)', marginRight: 10 }}>{r.id}</span>
                <strong style={{ color: 'var(--pub-ink)' }}>{r.title}</strong>
                {' — '}{r.change}
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
