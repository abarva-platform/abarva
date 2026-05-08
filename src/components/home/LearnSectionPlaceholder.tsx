// Per-section placeholder for /home/learn/<section>.
// Same layout for /home/learn/<section>/<slug> sub-pages.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import type { LearnSection } from '@/lib/home/learn-sections';

interface Props {
  section: LearnSection;
  /** Sub-page slug if rendering a sub-page placeholder. */
  subPage?: { slug: string; label: string } | null;
}

export function LearnSectionPlaceholder({ section, subPage = null }: Props) {
  const isSubPage = subPage !== null;
  return (
    <div
      data-testid={`learn-section-${section.id}${isSubPage ? `-${subPage!.slug}` : ''}`}
      style={{
        padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        maxWidth: 920,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <nav
        aria-label="Breadcrumb"
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.lg,
        }}
      >
        <Link href="/home/learn" style={{ color: COLORS.muted, textDecoration: 'none' }}>
          ← Learn
        </Link>
        {isSubPage && (
          <>
            <span style={{ margin: `0 ${SPACING.xs}px`, opacity: 0.5 }}>/</span>
            <Link
              href={`/home/learn/${section.routeSegment}`}
              style={{ color: COLORS.muted, textDecoration: 'none' }}
            >
              {section.label}
            </Link>
          </>
        )}
        <span style={{ margin: `0 ${SPACING.xs}px`, opacity: 0.5 }}>/</span>
        <span style={{ color: COLORS.body }}>{isSubPage ? subPage!.label : section.label}</span>
      </nav>

      <header style={{ marginBottom: SPACING.xl }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: COLORS.muted,
            marginBottom: SPACING.xs,
          }}
        >
          Learn · {section.label}
        </div>
        <h1
          style={{
            fontFamily: FONT.body,
            fontSize: 28,
            fontWeight: 700,
            color: COLORS.ink,
            letterSpacing: '-0.01em',
            margin: 0,
            marginBottom: SPACING.xs,
          }}
        >
          {isSubPage ? subPage!.label : section.label}
        </h1>
        <p style={{ fontFamily: FONT.body, fontSize: 14, color: COLORS.muted, margin: 0 }}>
          {section.oneLineHook}
        </p>
      </header>

      <article
        style={{
          border: BORDER.hairline,
          background: COLORS.card,
          borderRadius: RADIUS.md,
          padding: SPACING.xxl,
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.amber,
            fontWeight: 700,
            marginBottom: SPACING.sm,
          }}
        >
          Coming soon
        </div>
        <p
          style={{
            fontFamily: FONT.body,
            fontSize: 14,
            color: COLORS.body,
            margin: 0,
            marginBottom: SPACING.md,
            lineHeight: 1.55,
          }}
        >
          {section.shellPlaceholder}
        </p>
        <div
          style={{
            paddingTop: SPACING.md,
            borderTop: `1px dotted ${COLORS.border}`,
            fontFamily: FONT.body,
            fontSize: 13,
            color: COLORS.muted,
            lineHeight: 1.55,
          }}
        >
          <strong style={{ color: COLORS.body }}>Future content:</strong>{' '}
          {section.futureContentSummary}
        </div>
      </article>

      {section.sampleSubPages && section.sampleSubPages.length > 0 && !isSubPage && (
        <div style={{ marginTop: SPACING.xl }}>
          <div
            style={{
              fontFamily: FONT.mono,
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: COLORS.muted,
              marginBottom: SPACING.sm,
            }}
          >
            Sample entries
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: SPACING.xs }}>
            {section.sampleSubPages.map((p) => (
              <Link
                key={p.slug}
                href={`/home/learn/${section.routeSegment}/${p.slug}`}
                style={{
                  fontFamily: FONT.body,
                  fontSize: 12,
                  fontWeight: 500,
                  color: COLORS.body,
                  background: COLORS.surface,
                  border: BORDER.hairline,
                  padding: '6px 12px',
                  borderRadius: RADIUS.pill,
                  textDecoration: 'none',
                }}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
