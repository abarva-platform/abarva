import Link from 'next/link';
import { PaperContainer } from '@/components/public-site/PaperContainer';
import type { ReactNode } from 'react';

type TrustItem = {
  title: string;
  body: string;
};

type TrustPageProps = {
  eyebrow: string;
  title: string;
  intro: string;
  updated: string;
  children: ReactNode;
};

export function AiTrustPage({ eyebrow, title, intro, updated, children }: TrustPageProps) {
  return (
    <div style={{ background: 'var(--pub-paper, #faf7f1)', minHeight: '100vh' }}>
      <section
        style={{
          borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          paddingTop: '80px',
          paddingBottom: '56px',
        }}
      >
        <PaperContainer narrow>
          <p
            style={{
              fontFamily: 'var(--pub-font-mono, monospace)',
              fontSize: 11,
              color: 'var(--pub-stone, #888780)',
              textTransform: 'uppercase',
              letterSpacing: 0,
              marginBottom: 16,
            }}
          >
            {eyebrow}
          </p>
          <h1
            style={{
              fontFamily: 'var(--pub-font-serif, serif)',
              fontSize: 'clamp(34px, 6vw, 52px)',
              fontWeight: 500,
              lineHeight: 1.1,
              color: 'var(--pub-ink, #000)',
              marginBottom: 20,
            }}
          >
            {title}
          </h1>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: 18,
              lineHeight: 1.65,
              color: 'var(--pub-slate, #5F5E5A)',
              maxWidth: 720,
              marginBottom: 18,
            }}
          >
            {intro}
          </p>
          <p
            style={{
              fontFamily: 'var(--pub-font-mono, monospace)',
              fontSize: 12,
              color: 'var(--pub-stone, #888780)',
              textTransform: 'uppercase',
              letterSpacing: 0,
            }}
          >
            Last updated {updated}
          </p>
        </PaperContainer>
      </section>

      <section style={{ paddingTop: 56, paddingBottom: 72 }}>
        <PaperContainer narrow>{children}</PaperContainer>
      </section>
    </div>
  );
}

export function TrustCardGrid({ items }: { items: readonly TrustItem[] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
      }}
    >
      {items.map((item) => (
        <article
          key={item.title}
          style={{
            border: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
            borderRadius: 8,
            background: '#fff',
            padding: 22,
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--pub-font-serif, serif)',
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.25,
              color: 'var(--pub-ink, #000)',
              marginBottom: 10,
            }}
          >
            {item.title}
          </h2>
          <p
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: 15,
              lineHeight: 1.65,
              color: 'var(--pub-slate, #5F5E5A)',
            }}
          >
            {item.body}
          </p>
        </article>
      ))}
    </div>
  );
}

export function TrustLinkStrip() {
  return (
    <nav
      aria-label="AI trust documents"
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 12,
        marginTop: 32,
        paddingTop: 24,
        borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
      }}
    >
      {[
        ['Responsible AI', '/responsible-ai/'],
        ['Model card', '/model-card/'],
        ['Known limitations', '/known-limitations/'],
        ['Subprocessors', '/subprocessors/'],
      ].map(([label, href]) => (
        <Link
          key={href}
          href={href}
          style={{
            border: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
            borderRadius: 999,
            color: 'var(--pub-ink, #000)',
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: 14,
            fontWeight: 600,
            padding: '10px 14px',
            textDecoration: 'none',
          }}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}

export function TrustTable({ rows }: { rows: readonly (readonly [string, string])[] }) {
  return (
    <table
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: '#fff',
        border: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
      }}
    >
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label}>
            <th
              scope="row"
              style={{
                width: '32%',
                padding: '16px 18px',
                borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
                color: 'var(--pub-ink, #000)',
                fontFamily: 'var(--pub-font-mono, monospace)',
                fontSize: 12,
                letterSpacing: 0,
                textAlign: 'left',
                textTransform: 'uppercase',
                verticalAlign: 'top',
              }}
            >
              {label}
            </th>
            <td
              style={{
                padding: '16px 18px',
                borderBottom: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
                color: 'var(--pub-slate, #5F5E5A)',
                fontFamily: 'var(--pub-font-sans, sans-serif)',
                fontSize: 15,
                lineHeight: 1.65,
                verticalAlign: 'top',
              }}
            >
              {value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
