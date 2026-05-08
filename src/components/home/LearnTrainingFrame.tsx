'use client';

// LearnTrainingFrame — renders a training HTML guide inside the app shell
// via a full-height iframe.  The source file lives in /public/training/ and
// is served as a static asset by Next.js at /training/<file>.

import Link from 'next/link';
import { COLORS, FONT, BORDER, SPACING } from '@/lib/design/abarva-theme';

interface Props {
  /** Path relative to /public, e.g. "/training/how-to-create-a-move.html" */
  src: string;
  title: string;
  sectionLabel: string;
  subPageLabel: string;
  sectionRoute: string;
}

export function LearnTrainingFrame({
  src,
  title,
  sectionLabel,
  subPageLabel,
  sectionRoute,
}: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 'calc(100vh - 110px)',
      }}
    >
      {/* Breadcrumb bar */}
      <div
        style={{
          padding: `${SPACING.sm}px clamp(${SPACING.lg}px, 4vw, ${SPACING.xxxl}px)`,
          borderBottom: BORDER.hairline,
          display: 'flex',
          alignItems: 'center',
          gap: SPACING.xs,
          fontFamily: FONT.mono,
          fontSize: 11,
          letterSpacing: '0.08em',
          textTransform: 'uppercase' as const,
          color: COLORS.muted,
          flexShrink: 0,
        }}
      >
        <Link href="/home/learn" style={{ color: COLORS.muted, textDecoration: 'none' }}>
          ← Learn
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <Link
          href={`/home/learn/${sectionRoute}`}
          style={{ color: COLORS.muted, textDecoration: 'none' }}
        >
          {sectionLabel}
        </Link>
        <span style={{ opacity: 0.4 }}>/</span>
        <span style={{ color: COLORS.body }}>{subPageLabel}</span>

        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto',
            fontFamily: FONT.mono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            color: COLORS.navy,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 4,
            padding: '4px 10px',
            textDecoration: 'none',
            background: COLORS.surface,
          }}
        >
          Open in new tab ↗
        </a>
      </div>

      {/* Full-height iframe */}
      <iframe
        src={src}
        title={title}
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
          minHeight: 'calc(100vh - 160px)',
        }}
      />
    </div>
  );
}
