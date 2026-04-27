import type { ReactNode } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface EditorialCanvasProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function EditorialCanvas({ eyebrow, title, subtitle, children }: EditorialCanvasProps) {
  return (
    <main
      style={{
        flex: 1,
        padding: `${SPACING.xl} ${SPACING.xxl}`,
        background: COLORS.cream,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xl,
      }}
    >
      <header>
        <p
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: COLORS.navy,
            margin: 0,
            fontWeight: 600,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            fontFamily: TYPOGRAPHY.serif,
            fontSize: 56,
            fontWeight: 700,
            color: COLORS.ink,
            margin: '8px 0 0',
            letterSpacing: '-0.02em',
            lineHeight: 1.05,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 15,
              color: `${COLORS.ink}aa`,
              marginTop: SPACING.md,
              lineHeight: 1.5,
              maxWidth: '720px',
            }}
          >
            {subtitle}
          </p>
        ) : null}
      </header>
      {children}
    </main>
  );
}
