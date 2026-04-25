// DES2 · AgentBadge.
//
// Inline marker that names which agent is speaking.
// Imports restricted to the AbarVa theme module.

import {
  AGENT_ACCENT,
  FONT,
  type AbarvaAgent,
} from '@/lib/design/abarva-theme';

export type AgentBadgeStatus = 'ready' | 'partial' | 'blocked';
export type AgentBadgeSize = 'xs' | 'sm';

export interface AgentBadgeProps {
  agent: AbarvaAgent;
  status?: AgentBadgeStatus;
  size?: AgentBadgeSize;
}

const SIZE_TOKENS: Record<
  AgentBadgeSize,
  { fontSize: number; padX: number; padY: number }
> = {
  xs: { fontSize: 9, padX: 6, padY: 1 },
  sm: { fontSize: 10, padX: 8, padY: 2 },
};

export function AgentBadge({ agent, status, size = 'sm' }: AgentBadgeProps) {
  const accent = AGENT_ACCENT[agent];
  const sz = SIZE_TOKENS[size];
  const label = status ? `${agent} · ${status}` : agent;
  return (
    <span
      data-abarva-agent={agent}
      data-abarva-agent-status={status ?? ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontFamily: FONT.mono,
        fontSize: sz.fontSize,
        fontWeight: 700,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        background: accent.bg,
        color: accent.fg,
        padding: `${sz.padY}px ${sz.padX}px`,
        borderRadius: 999,
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </span>
  );
}
