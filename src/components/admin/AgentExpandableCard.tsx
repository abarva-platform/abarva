import { useState, type ReactNode } from 'react';
import { COLORS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';

export interface AgentExpandableCardProps {
  agentName: string;
  agentRole: string;
  status: 'ready' | 'partial' | 'blocked';
  children?: ReactNode;
}

const STATUS_COLORS: Record<AgentExpandableCardProps['status'], { bg: string; text: string; label: string }> = {
  ready: { bg: COLORS.mintSoft, text: COLORS.mintInk, label: 'Ready' },
  partial: { bg: COLORS.amberSoft, text: COLORS.amberInk, label: 'Partial' },
  blocked: { bg: COLORS.coralSoft, text: COLORS.coralInk, label: 'Blocked' },
};

export function AgentExpandableCard({ agentName, agentRole, status, children }: AgentExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const colors = STATUS_COLORS[status];

  return (
    <div
      style={{
        border: `1px solid ${COLORS.ink}14`,
        borderRadius: 6,
        background: COLORS.white,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${SPACING.md} ${SPACING.lg}`,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
        aria-expanded={expanded}
      >
        <div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.ink,
            }}
          >
            {agentName}
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.mono,
              fontSize: 11,
              color: `${COLORS.ink}80`,
              marginTop: 2,
            }}
          >
            {agentRole}
          </div>
        </div>
        <span
          style={{
            fontFamily: TYPOGRAPHY.mono,
            fontSize: 10,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '3px 8px',
            borderRadius: 3,
            background: colors.bg,
            color: colors.text,
            fontWeight: 600,
          }}
        >
          {colors.label}
        </span>
      </button>
      {expanded && children ? (
        <div
          style={{
            padding: `0 ${SPACING.lg} ${SPACING.md}`,
            borderTop: `1px solid ${COLORS.ink}0d`,
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
