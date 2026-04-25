// DES2 · AgentBadge.
//
// Small mono-uppercase pill rendering "<agent> · <status>" with the
// canonical agent accent foreground color and a NAVY-tinted background
// (per canon: NAVY-tinted backgrounds are the calm default).
//
// Pure component. Reads only from abarva-theme tokens.

import {
  AGENT_ACCENT,
  COLORS,
  FONT,
  RADIUS,
  type AbarvaAgent,
  type AbarvaStatus,
} from '@/lib/design/abarva-theme';

interface AgentBadgeProps {
  agent: AbarvaAgent;
  status?: AbarvaStatus | string;
}

export function AgentBadge({ agent, status }: AgentBadgeProps) {
  const accent = AGENT_ACCENT[agent];
  return (
    <span
      data-agent={agent}
      data-status={status ?? ''}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: FONT.mono,
        fontSize: 10,
        fontWeight: 500,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        color: accent.fg,
        background: COLORS.navySoft,
        border: `1px solid ${COLORS.borderSoft}`,
        borderRadius: RADIUS.pill,
        padding: '3px 9px',
        lineHeight: 1.4,
        whiteSpace: 'nowrap',
      }}
    >
      <span>{agent}</span>
      {status ? (
        <>
          <span aria-hidden="true" style={{ opacity: 0.5 }}>·</span>
          <span>{status}</span>
        </>
      ) : null}
    </span>
  );
}
