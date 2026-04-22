'use client';

import { useState, type CSSProperties } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EyebrowLabel } from '../typography/EyebrowLabel';
import { Body } from '../typography/Body';
import { MetaLabel } from '../typography/MetaLabel';

interface Props {
  name: string;
  // "CIO", "VP Commercial Lending", etc.
  title: string | null;
  organization: string | null;
  // Optional preferred name · renders as small teal line below the name.
  preferredName?: string | null;
  // Optional primary_focus · one-liner below role.
  focus?: string | null;
  // Optional tenure like "SINCE FEB 2026".
  tenureLabel?: string | null;
  // Optional tone tag rendered as an eyebrow (e.g. "SPONSOR", "ATTESTOR").
  roleTag?: string | null;
  // Size variants · 'compact' for inline rosters; 'card' for stakeholder grid;
  // 'prominent' for hero position on profile pages.
  size?: 'compact' | 'card' | 'prominent';
  // Click-through to profile page.
  href?: string;
  style?: CSSProperties;
}

// Executive surface primitive · compose across stakeholder lenses, program
// team rosters, profile pages, sponsor-of references. Focus-ring + hover
// tint when href is present so the affordance is legible without being
// noisy. Never interactive without href — card renders static in that case.
export function ExecutiveCard({
  name, title, organization, preferredName, focus, tenureLabel, roleTag,
  size = 'card', href, style,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();

  const isCompact = size === 'compact';
  const isProminent = size === 'prominent';
  const avatarSize = isProminent ? 72 : isCompact ? 36 : 48;
  const nameSize = isProminent ? 24 : isCompact ? 14 : 18;

  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const Wrapper = href ? 'a' : 'div';

  return (
    <Wrapper
      href={href}
      onMouseEnter={href ? () => setHovered(true) : undefined}
      onMouseLeave={href ? () => setHovered(false) : undefined}
      onFocus={href ? () => setFocused(true) : undefined}
      onBlur={href ? () => setFocused(false) : undefined}
      style={{
        display: 'flex',
        alignItems: isCompact ? 'center' : 'flex-start',
        gap: isCompact ? 10 : 14,
        padding: isProminent ? 20 : isCompact ? 8 : 14,
        borderRadius: 10,
        background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${hovered ? 'rgba(45,212,200,0.25)' : 'rgba(255,255,255,0.08)'}`,
        textDecoration: 'none',
        color: 'inherit',
        outline: 'none',
        cursor: href ? 'pointer' : 'default',
        transition: reducedMotion
          ? undefined
          : `background-color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
        boxShadow: focused ? FOCUS_RING.brand : 'none',
        ...style,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: avatarSize,
          height: avatarSize,
          flexShrink: 0,
          borderRadius: '50%',
          background: 'rgba(45,212,200,0.14)',
          color: COLORS.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'Georgia, serif',
          fontSize: avatarSize * 0.36,
          fontWeight: 500,
          letterSpacing: '-0.01em',
        }}
      >
        {initials}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {roleTag ? (
          <EyebrowLabel tone="teal" size="xs" style={{ marginBottom: 4 }}>{roleTag}</EyebrowLabel>
        ) : null}
        <div
          style={{
            fontFamily: 'Georgia, serif',
            fontSize: nameSize,
            fontWeight: 400,
            color: COLORS.textPrimary,
            lineHeight: 1.25,
          }}
        >
          {name}
        </div>
        {preferredName ? (
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: COLORS.teal, marginTop: 2 }}>
            Goes by {preferredName}
          </div>
        ) : null}
        {(title || organization) && (
          <Body size="sm" tone="secondary" style={{ marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {title}
            {title && organization ? ' · ' : ''}
            {organization}
          </Body>
        )}
        {focus && !isCompact ? (
          <Body size="sm" tone="muted" style={{ marginTop: 6 }}>
            {focus}
          </Body>
        ) : null}
        {tenureLabel ? (
          <div style={{ marginTop: 6 }}>
            <MetaLabel style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.12em', textTransform: 'uppercase', color: COLORS.teal, opacity: 0.85 }}>
              {tenureLabel}
            </MetaLabel>
          </div>
        ) : null}
      </div>
    </Wrapper>
  );
}
