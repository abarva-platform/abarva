import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import type { AgentPostureRow } from '@/lib/admin/agent-readiness-page-view';
import type { AgentPosture } from '@/lib/admin/admin-shell-config';

export interface AgentPostureGridProps {
  agents: ReadonlyArray<AgentPostureRow>;
}

const POSTURE_STYLES: Record<AgentPosture, { bg: string; fg: string }> = {
  BLOCKED: { bg: COLORS.coralSoft, fg: COLORS.coralInk },
  PARTIAL: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  THIN: { bg: COLORS.amberSoft, fg: COLORS.amberInk },
  READY: { bg: COLORS.mintSoft, fg: COLORS.mintInk },
};

export function AgentPostureGrid({ agents }: AgentPostureGridProps) {
  return (
    <section
      style={{
        background: COLORS.white,
        borderRadius: RADIUS.lg,
        border: `1px solid ${COLORS.ink}10`,
        padding: SPACING.xl,
      }}
      data-agent-posture-grid="true"
    >
      <h2
        style={{
          fontFamily: TYPOGRAPHY.serif,
          fontSize: 22,
          fontWeight: 700,
          color: COLORS.ink,
          margin: 0,
          letterSpacing: '-0.01em',
          marginBottom: SPACING.lg,
        }}
      >
        Agent posture
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: SPACING.md,
        }}
      >
        {agents.map((agent) => {
          const style = POSTURE_STYLES[agent.posture];
          return (
            <article
              key={agent.id}
              style={{
                padding: SPACING.lg,
                borderRadius: RADIUS.md,
                border: `1px solid ${COLORS.ink}10`,
                background: COLORS.cream,
                fontFamily: TYPOGRAPHY.sans,
                display: 'flex',
                flexDirection: 'column',
                gap: SPACING.sm,
              }}
              data-agent-id={agent.id}
            >
              <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontFamily: TYPOGRAPHY.serif,
                    fontSize: 18,
                    fontWeight: 700,
                    color: COLORS.ink,
                  }}
                >
                  {agent.label}
                </span>
                <span
                  style={{
                    padding: '4px 12px',
                    borderRadius: RADIUS.pill,
                    background: style.bg,
                    color: style.fg,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.06em',
                  }}
                  data-posture={agent.posture}
                >
                  {agent.posture}
                </span>
              </header>
              <p
                style={{
                  fontSize: 12,
                  color: `${COLORS.ink}80`,
                  margin: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                }}
              >
                Governs · {agent.governs}
              </p>
              <p style={{ fontSize: 13, color: `${COLORS.ink}cc`, margin: 0, lineHeight: 1.5 }}>
                {agent.summary}
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: COLORS.coralInk,
                  margin: 0,
                  fontWeight: 600,
                }}
              >
                Top gap · {agent.topGap}
              </p>
            </article>
          );
        })}
      </div>
    </section>
  );
}
