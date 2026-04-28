'use client';

import Link from 'next/link';
import { SHELL } from '@/lib/shell/shell-tokens';

interface SubNavItem {
  key: string;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
  href?: string;
}

interface SubNavStripProps {
  items: SubNavItem[];
}

function ItemInner({ item }: { item: SubNavItem }) {
  return (
    <>
      <span>{item.label}</span>
      {item.count !== undefined && (
        <span
          style={{
            fontFamily: SHELL.MONO,
            fontSize: 10,
            opacity: 0.7,
            marginLeft: 6,
          }}
        >
          {item.count}
        </span>
      )}
    </>
  );
}

export function SubNavStrip({ items }: SubNavStripProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      {items.map((item) => {
        const baseStyle: React.CSSProperties = {
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          padding: '6px 14px',
          fontFamily: SHELL.SANS,
          fontSize: 12.5,
          fontWeight: item.active ? 600 : 500,
          color: item.active ? SHELL.PAPER : SHELL.INK_SOFT,
          background: item.active ? SHELL.INK : 'transparent',
          borderRadius: 6,
          cursor: 'pointer',
          textDecoration: 'none',
          lineHeight: 1,
          transition: 'background 0.15s, color 0.15s',
        };

        if (item.href) {
          return (
            <Link
              key={item.key}
              href={item.href}
              style={baseStyle}
              onMouseEnter={(e) => {
                if (!item.active) {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = SHELL.PAPER_DEEP;
                  el.style.color = SHELL.INK;
                }
              }}
              onMouseLeave={(e) => {
                if (!item.active) {
                  const el = e.currentTarget as HTMLAnchorElement;
                  el.style.background = 'transparent';
                  el.style.color = SHELL.INK_SOFT;
                }
              }}
            >
              <ItemInner item={item} />
            </Link>
          );
        }

        return (
          <div
            key={item.key}
            role="button"
            tabIndex={0}
            onClick={item.onClick}
            onKeyDown={(e) => { if (e.key === 'Enter') item.onClick?.(); }}
            style={baseStyle}
            onMouseEnter={(e) => {
              if (!item.active) {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = SHELL.PAPER_DEEP;
                el.style.color = SHELL.INK;
              }
            }}
            onMouseLeave={(e) => {
              if (!item.active) {
                const el = e.currentTarget as HTMLDivElement;
                el.style.background = 'transparent';
                el.style.color = SHELL.INK_SOFT;
              }
            }}
          >
            <ItemInner item={item} />
          </div>
        );
      })}
    </div>
  );
}
