'use client';

import { SHELL } from '@/lib/shell/shell-tokens';

interface FilterPill {
  key: string;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}

interface FilterPillStripProps {
  pills: FilterPill[];
}

export function FilterPillStrip({ pills }: FilterPillStripProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {pills.map((pill) => (
        <div
          key={pill.key}
          role="button"
          tabIndex={0}
          onClick={pill.onClick}
          onKeyDown={(e) => { if (e.key === 'Enter') pill.onClick?.(); }}
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
            cursor: 'pointer',
            lineHeight: 1,
            transition: 'border-color 0.15s, color 0.15s, background 0.15s',
          }}
          onMouseEnter={(e) => {
            if (!pill.active) {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = SHELL.INK_SOFT;
              el.style.color = SHELL.INK;
            }
          }}
          onMouseLeave={(e) => {
            if (!pill.active) {
              const el = e.currentTarget as HTMLDivElement;
              el.style.borderColor = SHELL.CARD_LINE;
              el.style.color = SHELL.INK_SOFT;
            }
          }}
        >
          {pill.label}
          {pill.count !== undefined && (
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {pill.count}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
