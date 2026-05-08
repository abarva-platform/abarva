// Learn panel · index page (shell).
//
// Per docs/build/home-refinement-package/LEARN_PANEL_SHELL.md.
// Six sections, search field present (disabled), footer with
// feedback affordance. All content is placeholder; sub-routes
// resolve to real placeholder pages.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING, RADIUS } from '@/lib/design/abarva-theme';
import { LEARN_SECTIONS, type LearnSection } from '@/lib/home/learn-sections';

export function LearnIndexPage() {
  return (
    <div
      data-testid="learn-index-page"
      style={{
        padding: `${SPACING.xl}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
        maxWidth: 1280,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      <Header />
      <SearchField />
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACING.sm }}>
        {LEARN_SECTIONS.map((s) => (
          <SectionCard key={s.id} section={s} />
        ))}
      </div>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header style={{ marginBottom: SPACING.xl }}>
      <nav
        aria-label="Breadcrumb"
        style={{
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: COLORS.muted,
          marginBottom: SPACING.sm,
        }}
      >
        <Link href="/home" style={{ color: COLORS.muted, textDecoration: 'none' }}>
          ← Home
        </Link>
        <span style={{ margin: `0 ${SPACING.xs}px`, opacity: 0.5 }}>/</span>
        <span style={{ color: COLORS.body }}>Learn</span>
      </nav>
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
        Learn
      </h1>
      <p style={{ fontFamily: FONT.body, fontSize: 14, color: COLORS.muted, margin: 0 }}>
        Product info · training · doctrine reference · glossary
      </p>
    </header>
  );
}

function SearchField() {
  return (
    <div
      role="search"
      style={{
        border: BORDER.hairline,
        background: COLORS.surface2,
        borderRadius: RADIUS.md,
        padding: `${SPACING.sm}px ${SPACING.md}px`,
        marginBottom: SPACING.lg,
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
      }}
    >
      <span aria-hidden="true" style={{ fontFamily: FONT.mono, color: COLORS.muted, fontSize: 14 }}>
        🔍
      </span>
      <input
        type="search"
        disabled
        placeholder="Search learn content (coming with Learn Content Package)…"
        aria-label="Search learn content"
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.muted,
          outline: 'none',
          cursor: 'not-allowed',
        }}
      />
    </div>
  );
}

function SectionCard({ section }: { section: LearnSection }) {
  return (
    <article
      style={{
        border: BORDER.hairline,
        background: COLORS.card,
        borderRadius: RADIUS.md,
        padding: SPACING.lg,
      }}
    >
      <header style={{ marginBottom: SPACING.sm }}>
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 9,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.muted,
          }}
        >
          {section.index}. {section.label}
        </div>
        <h2
          style={{
            fontFamily: FONT.body,
            fontSize: 16,
            fontWeight: 600,
            color: COLORS.ink,
            margin: 0,
            marginTop: 2,
          }}
        >
          {section.oneLineHook}
        </h2>
      </header>

      <p
        style={{
          fontFamily: FONT.body,
          fontSize: 13,
          color: COLORS.body,
          margin: 0,
          marginBottom: SPACING.sm,
          lineHeight: 1.55,
        }}
      >
        {section.shellPlaceholder}
      </p>

      {section.sampleSubPages && section.sampleSubPages.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: SPACING.xs,
            paddingTop: SPACING.sm,
            borderTop: `1px dotted ${COLORS.border}`,
            marginBottom: SPACING.sm,
          }}
        >
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
                padding: '4px 10px',
                borderRadius: RADIUS.pill,
                textDecoration: 'none',
              }}
            >
              {p.label}
            </Link>
          ))}
        </div>
      )}

      <Link
        href={`/home/learn/${section.routeSegment}`}
        style={{
          fontFamily: FONT.body,
          fontSize: 12,
          fontWeight: 600,
          color: COLORS.navy,
          textDecoration: 'none',
        }}
      >
        Open {section.label} →
      </Link>
    </article>
  );
}

function Footer() {
  return (
    <footer
      style={{
        marginTop: SPACING.xxl,
        paddingTop: SPACING.lg,
        borderTop: BORDER.hairline,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        flexWrap: 'wrap',
        gap: SPACING.md,
      }}
    >
      <div style={{ fontFamily: FONT.mono, fontSize: 10, color: COLORS.muted, letterSpacing: '0.06em' }}>
        Last updated · 2026-05-07
      </div>
      <div style={{ display: 'flex', gap: SPACING.md, fontFamily: FONT.body, fontSize: 12 }}>
        <a
          href="mailto:product@abarva.ai?subject=Learn%20feedback"
          style={{ color: COLORS.body, textDecoration: 'none' }}
        >
          Send feedback
        </a>
        <a
          href="mailto:product@abarva.ai?subject=Learn%20missing%20topic"
          style={{ color: COLORS.body, textDecoration: 'none' }}
        >
          Report something missing
        </a>
      </div>
    </footer>
  );
}
