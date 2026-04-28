'use client';

import { SHELL } from '@/lib/shell/shell-tokens';

export interface PhaseStripSlot {
  id: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  label: string;
  state: 'done' | 'current' | 'pending' | 'locked';
}

interface PhaseStripProps {
  phases: PhaseStripSlot[];
  onPhaseSelect?: (id: PhaseStripSlot['id']) => void;
}

function getDotStyle(state: PhaseStripSlot['state']): React.CSSProperties {
  switch (state) {
    case 'done':
      return {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: SHELL.MINT_TEXT,
        flexShrink: 0,
      };
    case 'current':
      return {
        width: 9,
        height: 9,
        borderRadius: '50%',
        background: SHELL.INK,
        boxShadow: '0 0 0 3px rgba(12,26,58,0.12)',
        flexShrink: 0,
      };
    case 'pending':
      return {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: SHELL.PEACH_BG,
        border: `1px solid ${SHELL.PEACH_LINE}`,
        flexShrink: 0,
      };
    case 'locked':
      return {
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: SHELL.GRAY_BG,
        border: `1px solid ${SHELL.GRAY_LINE}`,
        flexShrink: 0,
      };
  }
}

function getLabelStyle(state: PhaseStripSlot['state']): React.CSSProperties {
  const base: React.CSSProperties = {
    fontFamily: SHELL.SANS,
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1,
  };
  switch (state) {
    case 'done':
      return { ...base, color: SHELL.MINT_TEXT };
    case 'current':
      return { ...base, color: SHELL.INK, fontWeight: 600 };
    case 'pending':
      return { ...base, color: SHELL.PEACH_TEXT };
    case 'locked':
      return { ...base, color: SHELL.INK_MUTED };
  }
}

export function PhaseStrip({ phases, onPhaseSelect }: PhaseStripProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', flex: 1 }}>
      {phases.map((phase, index) => (
        <div key={phase.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          {/* Pipe divider (not before first item) */}
          {index > 0 && (
            <div
              style={{
                borderLeft: `1px solid ${SHELL.CARD_LINE}`,
                height: 20,
                flexShrink: 0,
              }}
            />
          )}

          {/* Phase item */}
          <div
            role="button"
            tabIndex={phase.state === 'locked' ? -1 : 0}
            onClick={() => {
              if (phase.state !== 'locked') {
                onPhaseSelect?.(phase.id);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && phase.state !== 'locked') {
                onPhaseSelect?.(phase.id);
              }
            }}
            style={{
              display: 'flex',
              flexDirection: 'row',
              gap: 8,
              alignItems: 'center',
              padding: '0 14px',
              cursor: phase.state === 'locked' ? 'not-allowed' : 'pointer',
            }}
          >
            <div style={getDotStyle(phase.state)} />
            <span style={getLabelStyle(phase.state)}>{phase.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
