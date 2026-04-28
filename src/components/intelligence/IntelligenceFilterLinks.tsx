// I1 · INT-IDX-LIBRARY — Link-based filter pill strip for Intelligence index.
//
// Server component. Uses Next.js Link for URL-param-driven filtering.
// No onClick, no client state — filter is fully URL-driven.

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';

export interface FilterLinkPill {
  key: string;
  label: string;
  count?: number;
  active: boolean;
  href: string;
}

interface IntelligenceFilterLinksProps {
  pills: FilterLinkPill[];
}

export function IntelligenceFilterLinks({ pills }: IntelligenceFilterLinksProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {pills.map((pill) => (
        <Link
          key={pill.key}
          href={pill.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '5px 12px',
            fontFamily: SHELL.MONO,
            fontSize: 10,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            borderRadius: 14,
            border: `1px solid ${pill.active ? SHELL.INK : SHELL.CARD_LINE}`,
            background: pill.active ? SHELL.INK : 'transparent',
            color: pill.active ? SHELL.PAPER : SHELL.INK_SOFT,
            fontWeight: pill.active ? 600 : 400,
            textDecoration: 'none',
            lineHeight: 1,
          }}
        >
          {pill.label}
          {pill.count !== undefined && (
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {pill.count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
