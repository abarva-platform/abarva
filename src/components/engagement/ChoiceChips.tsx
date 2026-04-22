'use client';

import { TRANSITIONS } from '@/lib/design-system';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface Choice {
  label: string;
  value: string;
  freeType?: boolean;
}

interface Props {
  choices: Choice[];
  onPick: (value: string) => void;
  onFreeType: (placeholder: string) => void;
  disabled?: boolean;
}

export function ChoiceChips({ choices, onPick, onFreeType, disabled }: Props) {
  const reducedMotion = useReducedMotion();

  if (choices.length === 0) return null;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10, marginLeft: 4 }}>
      {choices.map((c, i) => {
        const border = c.freeType ? 'rgba(139,134,128,0.4)' : 'rgba(20,184,166,0.5)';
        const color = c.freeType ? 'rgba(245,245,240,0.72)' : '#F5F5F0';
        const hoverBg = c.freeType ? 'rgba(139,134,128,0.1)' : 'rgba(20,184,166,0.08)';
        return (
          <button
            key={`${c.label}-${i}`}
            type="button"
            disabled={disabled}
            onClick={() => (c.freeType ? onFreeType(c.label) : onPick(c.value))}
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color,
              border: `0.5px solid ${border}`,
              borderRadius: 999,
              fontSize: 12,
              cursor: disabled ? 'default' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              fontFamily: 'inherit',
              transition: reducedMotion ? undefined : `background-color ${TRANSITIONS.hover}`,
            }}
            onMouseEnter={(e) => {
              if (disabled) return;
              (e.currentTarget as HTMLButtonElement).style.background = hoverBg;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            }}
          >
            {c.label}
          </button>
        );
      })}
    </div>
  );
}
