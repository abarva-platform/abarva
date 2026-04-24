'use client';

// NotFoundSurface · File 10 §10.3 P0
//
// Reusable 404 surface for pages that resolve server-side but determine
// their target is missing (e.g. a program slug that doesn't resolve). Use
// via `notFound()` where possible — that routes through not-found.tsx.
// Use this component where notFound() isn't appropriate (partial page
// load where some content renders and a subsection is missing).
//
// Parity with the canonical not-found.tsx page but composable inline
// and honest about the specific resource that couldn't be found.

import Link from 'next/link';

interface NotFoundSurfaceProps {
  /** What was being sought, e.g. "program", "pattern", "evidence record". */
  resource: string;
  /** The id or slug the caller tried. */
  attemptedId?: string;
  /** Primary nav back — defaults to /home. */
  homeHref?: string;
  /** Optional suggestions the consumer surface can provide. */
  suggestions?: Array<{ label: string; href: string }>;
}

export function NotFoundSurface({
  resource,
  attemptedId,
  homeHref = '/home',
  suggestions = [],
}: NotFoundSurfaceProps) {
  return (
    <section
      className="not-found-surface"
      role="alert"
      style={{
        padding: '32px 28px',
        borderRadius: 16,
        background: '#FFFDF8',
        border: '1px solid rgba(26,22,18,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: 'DM Sans, -apple-system, sans-serif',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#8a7e72',
          fontWeight: 700,
        }}
      >
        Not found
      </div>

      <h2
        style={{
          margin: 0,
          fontFamily: 'Georgia, "Times New Roman", serif',
          fontSize: 28,
          lineHeight: 1.25,
          color: '#1a1612',
          fontWeight: 700,
          letterSpacing: '-0.015em',
        }}
      >
        No {resource} matches that link.
      </h2>

      <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: '#544b42' }}>
        {attemptedId ? (
          <>
            We looked for <strong style={{ color: '#1a1612' }}>{attemptedId}</strong> and came up empty. It may have been renamed,
            moved, or never existed on this tenant.
          </>
        ) : (
          <>We couldn&rsquo;t resolve the resource you asked for. It may have been renamed, moved, or never existed on this tenant.</>
        )}
      </p>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        <Link
          href={homeHref}
          style={{
            padding: '10px 18px',
            borderRadius: 999,
            border: '1px solid #0E9F8C',
            color: '#0E9F8C',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            textDecoration: 'none',
          }}
        >
          ← Back to home
        </Link>
        {suggestions.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            style={{
              padding: '10px 18px',
              borderRadius: 999,
              border: '1px solid rgba(26,22,18,0.16)',
              color: '#1a1612',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              textDecoration: 'none',
            }}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
