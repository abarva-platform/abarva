import type { ReactNode } from 'react';
import { SPACING } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import { ADMIN_PAGE_HEADER_STYLES } from './admin-page-header-styles';

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
            ...ADMIN_PAGE_HEADER_STYLES.eyebrow,
          }}
        >
          {eyebrow}
        </p>
        <h1
          style={{
            ...ADMIN_PAGE_HEADER_STYLES.title,
            color: SHELL.INK,
          }}
        >
          {title}
        </h1>
        {subtitle ? (
          <p
            style={{
              ...ADMIN_PAGE_HEADER_STYLES.subtitle,
              color: SHELL.INK_SOFT,
              maxWidth: 760,
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
