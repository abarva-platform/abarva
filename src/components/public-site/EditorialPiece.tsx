import React from 'react';
import Link from 'next/link';

export interface EditorialPieceData {
  slug: string;
  title: string;
  publishedAt: string;
  summary: string;
  readingTime: number;
  body: string;
}

interface EditorialPieceProps {
  piece: EditorialPieceData;
  otherPieces: Pick<EditorialPieceData, 'slug' | 'title'>[];
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

function renderBody(body: string): React.ReactNode[] {
  const paragraphs = body.split(/\n{2,}/);
  return paragraphs.map((para, i) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Blockquote (starts with >)
    if (trimmed.startsWith('> ') || trimmed.startsWith('>')) {
      const text = trimmed.replace(/^>\s*/, '');
      return (
        <blockquote
          key={i}
          style={{
            margin: '28px 0',
            paddingLeft: '20px',
            borderLeft: '3px solid var(--pub-navy, #0c1a3a)',
            fontFamily: 'var(--pub-font-serif, serif)',
            fontSize: '18px',
            fontStyle: 'italic',
            lineHeight: 1.65,
            color: 'var(--pub-ink, #000)',
          }}
        >
          {text}
        </blockquote>
      );
    }

    // Horizontal rule
    if (trimmed === '---') {
      return (
        <hr
          key={i}
          style={{
            border: 'none',
            borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
            margin: '36px 0',
          }}
        />
      );
    }

    // Bold heading (lines starting with **)
    if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length > 4) {
      const text = trimmed.slice(2, -2);
      return (
        <h3
          key={i}
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '16px',
            fontWeight: 700,
            color: 'var(--pub-ink, #000)',
            marginTop: '32px',
            marginBottom: '8px',
            lineHeight: 1.4,
          }}
        >
          {text}
        </h3>
      );
    }

    // Regular paragraph — inline bold handling
    const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, j) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={j}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });

    return (
      <p
        key={i}
        style={{
          fontFamily: 'var(--pub-font-sans, sans-serif)',
          fontSize: '17px',
          lineHeight: 1.75,
          color: 'var(--pub-ink, #000)',
          marginTop: '0',
          marginBottom: '20px',
        }}
      >
        {rendered}
      </p>
    );
  });
}

export function EditorialPiece({ piece, otherPieces }: EditorialPieceProps) {
  return (
    <article className="pub-editorial-piece">
      {/* Back link */}
      <nav style={{ marginBottom: '40px' }}>
        <Link
          href="/editorial/"
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '14px',
            color: 'var(--pub-signal, #0066CC)',
            textDecoration: 'none',
          }}
        >
          ← Editorial
        </Link>
      </nav>

      {/* Article header */}
      <header style={{ marginBottom: '40px' }}>
        <h1
          style={{
            fontFamily: 'var(--pub-font-serif, serif)',
            fontSize: 'clamp(28px, 4vw, 40px)',
            fontWeight: 500,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--pub-ink, #000)',
            marginBottom: '20px',
          }}
        >
          {piece.title}
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <span
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '14px',
              fontWeight: 600,
              color: 'var(--pub-ink, #000)',
            }}
          >
            AbarVa Research Team
          </span>
          <span style={{ color: 'var(--pub-stone, #888780)', fontSize: '12px' }}>·</span>
          <time
            dateTime={piece.publishedAt}
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '14px',
              color: 'var(--pub-stone, #888780)',
            }}
          >
            {formatDate(piece.publishedAt)}
          </time>
          <span style={{ color: 'var(--pub-stone, #888780)', fontSize: '12px' }}>·</span>
          <span
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '14px',
              color: 'var(--pub-stone, #888780)',
            }}
          >
            {piece.readingTime} min read
          </span>
        </div>

        {/* Summary */}
        <p
          style={{
            fontFamily: 'var(--pub-font-sans, sans-serif)',
            fontSize: '18px',
            lineHeight: 1.65,
            color: 'var(--pub-slate, #5F5E5A)',
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          }}
        >
          {piece.summary}
        </p>
      </header>

      {/* Article body */}
      <div className="pub-editorial-body" style={{ maxWidth: '680px' }}>
        {renderBody(piece.body)}
      </div>

      {/* Continue reading */}
      {otherPieces.length > 0 && (
        <aside
          style={{
            marginTop: '64px',
            paddingTop: '32px',
            borderTop: '1px solid var(--pub-rule, rgba(136,135,128,0.25))',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--pub-font-sans, sans-serif)',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--pub-stone, #888780)',
              marginBottom: '20px',
            }}
          >
            Continue reading
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {otherPieces.map((other) => (
              <Link
                key={other.slug}
                href={`/editorial/${other.slug}/`}
                style={{
                  fontFamily: 'var(--pub-font-sans, sans-serif)',
                  fontSize: '15px',
                  color: 'var(--pub-signal, #0066CC)',
                  textDecoration: 'none',
                }}
              >
                {other.title} →
              </Link>
            ))}
          </div>
        </aside>
      )}
    </article>
  );
}
