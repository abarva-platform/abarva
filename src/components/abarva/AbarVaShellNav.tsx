'use client';

// DES7 · AbarVaShellNav · canon shell navigation primitive.
//
// A second-generation shell nav that renders the AbarVa wordmark on a
// warm off-white surface with NAVY-on-active text underline. Pure
// presentational — no router writes, no auth, no client switcher. Each
// surface entry may carry a `workflowQuestion` that callers can surface
// elsewhere (page header, tooltip, drawer) to orient the user.
//
// Canon (per docs/design/ABARVA_VISUAL_CANON.md §G):
//   • Surface  #FBFAF7  (warm off-white) — NEVER the rejected v1 black.
//   • Border   #E8E6E1  (hairline).
//   • Accent   #1B2B5C  (navy) — NEVER the rejected v1 teal accent.
//   • Height   56px (within the 52–56px canon band).
//   • Wordmark left, surface links centered-left, optional rightSlot.
//   • Active link: NAVY text + 1.5px NAVY underline.
//
// Backward compatibility note: legacy chrome (`src/components/chrome/
// TopBar.tsx`, `src/components/chrome/PrimaryNav.tsx`) is intentionally
// untouched — other consumers may still depend on its API surface. New
// routes opt into AbarVaShellNav explicitly.

import Link from 'next/link';
import type * as React from 'react';
import { AbarvaWordmark } from './AbarVaWordmark';

// ---------------------------------------------------------------------
// SURFACE LIST  (canonical order with workflow questions)
// ---------------------------------------------------------------------

export interface AbarVaShellNavSurface {
  key: string;
  label: string;
  href: string;
  /**
   * Optional one-sentence orientation prompt that names the workflow
   * question this surface answers (e.g. "What programs need my
   * attention?"). Not rendered inside the nav itself — callers can
   * surface it in page headers, drawers, or tooltips.
   */
  workflowQuestion?: string;
}

export const ABARVA_SHELL_SURFACES: ReadonlyArray<AbarVaShellNavSurface> = [
  {
    key: 'home',
    label: 'Home',
    href: '/home',
    workflowQuestion: 'Where am I in the program?',
  },
  {
    key: 'programs',
    label: 'Programs',
    href: '/engagements',
    workflowQuestion: 'What programs need my attention?',
  },
  {
    key: 'source',
    label: 'Source',
    href: '/source',
    workflowQuestion: 'What sourcing events are open?',
  },
  {
    key: 'intelligence',
    label: 'Intelligence',
    href: '/intelligence',
    workflowQuestion: 'What patterns matter now?',
  },
  {
    key: 'tower',
    label: 'Control Tower',
    href: '/tower',
    workflowQuestion: 'Where is risk concentrated?',
  },
  {
    key: 'admin',
    label: 'Admin',
    href: '/admin',
    workflowQuestion: 'Is the platform ready?',
  },
];

// ---------------------------------------------------------------------
// COMPONENT
// ---------------------------------------------------------------------

export interface AbarVaShellNavProps {
  /**
   * Surface entries to render. Defaults to the canonical
   * `ABARVA_SHELL_SURFACES`.
   */
  surfaces?: ReadonlyArray<AbarVaShellNavSurface>;
  /**
   * Key of the active surface. When omitted no surface is marked
   * active.
   */
  activeKey?: string;
  /**
   * Optional right-aligned slot for user/notification widgets. The
   * primitive itself does not render any user identity affordance.
   */
  rightSlot?: React.ReactNode;
}

// Canon hex values are inlined here so this primitive remains readable
// in isolation. They mirror the tokens in
// `src/lib/design/abarva-theme.ts` (COLORS.surface / border / muted /
// ink / body / navy).
const SURFACE_BG = '#FBFAF7';
const BORDER_COLOR = '#E8E6E1';
const TEXT_INK = '#0A0C12';
const TEXT_BODY = '#1F2433';
const TEXT_MUTED = '#525866';
const NAVY = '#1B2B5C';
const FONT_BODY =
  "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";

export function AbarVaShellNav({
  surfaces = ABARVA_SHELL_SURFACES,
  activeKey,
  rightSlot,
}: AbarVaShellNavProps) {
  return (
    <nav
      aria-label="AbarVa shell navigation"
      style={{
        height: 56,
        background: SURFACE_BG,
        borderBottom: `1px solid ${BORDER_COLOR}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        boxSizing: 'border-box',
        fontFamily: FONT_BODY,
        gap: 24,
      }}
    >
      <Link
        href="/home"
        aria-label="AbarVa home"
        style={{
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
        }}
      >
        <AbarvaWordmark size="sm" />
      </Link>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flex: 1,
        }}
      >
        {surfaces.map((s) => {
          const isActive = activeKey === s.key;
          return (
            <Link
              key={s.key}
              href={s.href}
              data-active={isActive ? 'true' : 'false'}
              data-shell-nav-key={s.key}
              title={s.workflowQuestion}
              style={{
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: isActive ? 600 : 500,
                color: isActive ? NAVY : TEXT_MUTED,
                padding: '8px 14px',
                marginBottom: -1,
                borderBottom: isActive
                  ? `1.5px solid ${NAVY}`
                  : '1.5px solid transparent',
                letterSpacing: '-0.005em',
                lineHeight: 1,
                display: 'inline-flex',
                alignItems: 'center',
                // Hover behaviour is intentionally subtle. We rely on
                // the inline default; route detail pages may override
                // via a dedicated stylesheet without breaking canon.
                ['--abarva-shell-hover-color' as string]: TEXT_INK,
                ['--abarva-shell-default-body' as string]: TEXT_BODY,
              }}
            >
              {s.label}
            </Link>
          );
        })}
      </div>

      {rightSlot ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          {rightSlot}
        </div>
      ) : null}
    </nav>
  );
}
