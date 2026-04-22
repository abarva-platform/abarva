'use client';

import { useState, type CSSProperties } from 'react';
import { TRANSITIONS, FOCUS_RING, COLORS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';

export interface BreadthChip {
  key: string;
  label: string;
  // Numeric counts render as integers. Currency-scale numbers render with the
  // appropriate suffix (B for billions, M for millions).
  value: string | number;
  // Optional short context line under the value ("across 4 phases", etc.).
  sub?: string | null;
  href: string;
}

interface Props {
  chips: BreadthChip[];
  // Access governance indicator (§7 footer). When `null`, the footer line is
  // skipped · chip row still renders.
  accessGovernance?: {
    maestroCount: number;
    lastUpdated: Date | null;
    href: string;
  } | null;
}

function formatValue(v: string | number): string {
  if (typeof v === 'string') return v;
  if (!Number.isFinite(v)) return '—';
  if (v >= 1_000_000_000) return `$${(v / 1_000_000_000).toFixed(1)}B`;
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return v.toLocaleString();
  return String(v);
}

// Tenant data breadth row · Fix Spec v3 §7 · sits between the opening greeting
// and the briefing so the first impression signals "AbarVa has modeled your
// enterprise at breadth" without showing raw data. Each chip is a live link
// to the matching domain index.
export function TenantBreadthRow({ chips, accessGovernance }: Props) {
  return (
    <section
      aria-labelledby="tenant-breadth-heading"
      style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
    >
      <EyebrowLabel tone="teal" size="xs" id="tenant-breadth-heading">
        YOUR ENTERPRISE · AS MODELED
      </EyebrowLabel>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {chips.map((chip) => (
          <BreadthChipCard key={chip.key} chip={chip} />
        ))}
      </div>
      {accessGovernance ? (
        <AccessGovernanceLine {...accessGovernance} />
      ) : null}
    </section>
  );
}

function BreadthChipCard({ chip }: { chip: BreadthChip }) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const reducedMotion = useReducedMotion();

  const cardStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    padding: '14px 16px',
    borderRadius: 10,
    background: hovered ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
    border: `0.5px solid ${hovered ? 'rgba(45,212,200,0.25)' : 'rgba(255,255,255,0.08)'}`,
    color: 'inherit',
    textDecoration: 'none',
    outline: 'none',
    transition: reducedMotion
      ? undefined
      : `background-color ${TRANSITIONS.hover}, border-color ${TRANSITIONS.hover}, box-shadow ${TRANSITIONS.focus}`,
    boxShadow: focused ? FOCUS_RING.brand : 'none',
    minWidth: 0,
  };

  return (
    <a
      href={chip.href}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={cardStyle}
    >
      <EyebrowLabel tone="muted" size="xs">
        {chip.label}
      </EyebrowLabel>
      <div
        style={{
          fontFamily: 'Georgia, serif',
          fontSize: 22,
          fontWeight: 400,
          color: COLORS.textPrimary,
          lineHeight: 1.1,
          letterSpacing: '-0.005em',
        }}
      >
        {formatValue(chip.value)}
      </div>
      {chip.sub ? <MetaLabel>{chip.sub}</MetaLabel> : null}
    </a>
  );
}

function AccessGovernanceLine({
  maestroCount,
  lastUpdated,
  href,
}: NonNullable<Props['accessGovernance']>) {
  const rel = relativeFrom(lastUpdated);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingTop: 10,
        borderTop: '0.5px solid rgba(255,255,255,0.06)',
        flexWrap: 'wrap',
        gap: 8,
      }}
    >
      <MetaLabel>
        Intelligence layer accessible to {maestroCount} authorized Maestro{maestroCount === 1 ? '' : 's'}
        {rel ? ` · ${rel}` : ''}
      </MetaLabel>
      <a
        href={href}
        style={{
          fontFamily: 'DM Sans, sans-serif',
          fontSize: 12,
          color: COLORS.teal,
          textDecoration: 'underline',
          textUnderlineOffset: 3,
        }}
      >
        Access governance →
      </a>
    </div>
  );
}

function relativeFrom(when: Date | null): string | null {
  if (!when) return null;
  const diffMs = Date.now() - when.getTime();
  if (diffMs < 60_000) return 'just updated';
  const mins = Math.round(diffMs / 60_000);
  if (mins < 60) return `updated ${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `updated ${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `updated ${days} day${days === 1 ? '' : 's'} ago`;
}
