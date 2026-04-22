'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface Props {
  href: string;
  children: ReactNode;
  // 'inline' for in-prose references (subtle underline); 'nav' for list items
  // that should pop more; 'ghost' for card-level links that shouldn't compete
  // with the card's own clickable surface.
  variant?: 'inline' | 'nav' | 'ghost';
  // Open externally. Adds the visual marker only when target === '_blank'.
  target?: '_self' | '_blank';
  title?: string;
  onClick?: () => void;
}

// Subtle teal-underline hyperlink for navigable entity references in prose
// and cards. Hover brightens the teal; focus gets a teal ring. Use this for
// every "see details" / "this KPI / this person / this program" inline link
// so the interaction vocabulary stays consistent.
export function EntityLink({ href, children, variant = 'inline', target = '_self', title, onClick }: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();

  const isInline = variant === 'inline';
  const isGhost = variant === 'ghost';
  const baseColor = isGhost ? COLORS.textSecondary : COLORS.teal;
  const hoverColor = isGhost ? COLORS.textPrimary : '#5EEBE0';

  return (
    <a
      href={href}
      target={target}
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      style={{
        color: hovered ? hoverColor : baseColor,
        textDecoration: isInline ? 'underline' : 'none',
        textDecorationColor: isInline ? (hovered ? hoverColor : 'rgba(20,184,166,0.45)') : 'transparent',
        textUnderlineOffset: isInline ? '3px' : undefined,
        textDecorationThickness: isInline ? '0.5px' : undefined,
        fontWeight: variant === 'nav' ? 500 : 'inherit',
        borderRadius: 4,
        padding: isInline ? 0 : '2px 4px',
        margin: isInline ? 0 : '-2px -4px',
        outline: 'none',
        transition: reducedMotion
          ? undefined
          : `color ${TRANSITIONS.hover}, text-decoration-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
        boxShadow: focused ? FOCUS_RING.brand : 'none',
      }}
    >
      {children}
      {target === '_blank' && (
        <span aria-hidden="true" style={{ marginLeft: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: 9, opacity: 0.7 }}>↗</span>
      )}
    </a>
  );
}
