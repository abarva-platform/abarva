import type { ReactNode } from 'react';
import { COLORS, SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';

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
        background: SHELL.PAPER,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: SPACING.xl,
      }}
    >
      <header>
        <p
          style={{
            fontFamily: SHELL.SANS,
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
            fontFamily: SHELL.SERIF,
            fontSize: 56,
            fontWeight: 700,
            color: SHELL.INK,
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
              fontFamily: SHELL.SANS,
              fontSize: 15,
              color: SHELL.INK_SOFT,
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
