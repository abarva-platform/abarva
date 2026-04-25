// DES2 · DetailDrawerShell.
//
// Right-side overlay shell for per-object detail. Pure server-renderable
// shell — interactive close behavior is the consumer's responsibility
// (this slice does not include client-side state).
//
// Imports restricted to the AbarVa theme module.

import {
  COLORS,
  FONT,
  RADIUS,
  TYPE,
} from '@/lib/design/abarva-theme';

export interface DetailDrawerShellProps {
  /** When false, the shell renders a no-op marker so callers can
   *  conditionally mount it without unmount jank. Default true. */
  open?: boolean;
  eyebrow: string;
  title: string;
  /** Plain-text close affordance — caller wires the click handler. */
  closeHref?: string;
  /** Optional source-of-truth caption for the footer. */
  sourceLabel?: string;
  children?: React.ReactNode;
}

export function DetailDrawerShell({
  open = true,
  eyebrow,
  title,
  closeHref,
  sourceLabel,
  children,
}: DetailDrawerShellProps) {
  if (!open) return null;
  return (
    <aside
      role="complementary"
      aria-label={title}
      data-abarva-drawer-open={open ? 'true' : 'false'}
      style={{
        position: 'relative',
        background: COLORS.card,
        borderLeft: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.drawer,
        padding: '20px 22px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        fontFamily: FONT.body,
        minWidth: 320,
        maxWidth: 480,
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 12,
        }}
      >
        <div>
          <div style={{ ...TYPE.eyebrow, marginBottom: 4 }}>{eyebrow}</div>
          <h3 style={{ ...TYPE.h3, margin: 0 }}>{title}</h3>
        </div>
        {closeHref ? (
          <a
            href={closeHref}
            data-abarva-drawer-close
            style={{
              fontSize: 12,
              fontFamily: FONT.mono,
              color: COLORS.muted,
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Close ✕
          </a>
        ) : null}
      </header>
      {children ? <div>{children}</div> : null}
      {sourceLabel ? (
        <footer
          style={{
            ...TYPE.caption,
            paddingTop: 8,
            borderTop: `1px dashed ${COLORS.border}`,
          }}
        >
          Source · {sourceLabel.replace(/_/g, ' ')}.
        </footer>
      ) : null}
    </aside>
  );
}
