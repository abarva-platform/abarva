/**
 * AgentReadinessStateHeader · Block 5.1 (Setup Redesign Package PR C).
 *
 * 4 agent cards (Nexus / Sentinel / Steward / Atlas) with current
 * capability level. Per `DATA_BINDING_CATALOG.md` §5.1.
 */

import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '@/lib/design/design-tokens';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { AgentStateMetric } from '@/lib/admin/agent-readiness-composer';

const LEVEL_COLOR: Record<AgentStateMetric['level'], { bg: string; ink: string; label: string }> = {
  'decision-grade': { bg: COLORS.mintSoft, ink: COLORS.mintInk, label: 'Decision-grade' },
  partial: { bg: COLORS.amberSoft, ink: COLORS.amberInk, label: 'Partial' },
  thin: { bg: COLORS.coralSoft, ink: COLORS.coralInk, label: 'Thin' },
  blank: { bg: SHELL.PAPER, ink: SHELL.INK_MUTED, label: 'Not active' },
};

export function AgentReadinessStateHeader({ agents }: { agents: AgentStateMetric[] }) {
  return (
    <section
      data-agent-readiness-block="state-header"
      data-testid="agent-readiness-state-header"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: SPACING.md,
      }}
    >
      {agents.map((a) => {
        const palette = LEVEL_COLOR[a.level];
        return (
          <div
            key={a.id}
            data-agent-id={a.id}
            data-agent-level={a.level}
            style={{
              background: SHELL.CARD_WHITE,
              border: `1px solid ${SHELL.CARD_LINE_SOFT}`,
              borderRadius: RADIUS.md,
              padding: SPACING.md,
              display: 'flex',
              flexDirection: 'column',
              gap: SPACING.xs,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: SPACING.xs, justifyContent: 'space-between' }}>
              <span
                style={{
                  fontFamily: TYPOGRAPHY.serif,
                  fontSize: 18,
                  color: SHELL.INK,
                  fontWeight: 700,
                }}
              >
                {a.label}
              </span>
              <span
                data-agent-level-pill={a.level}
                style={{
                  padding: '2px 8px',
                  borderRadius: RADIUS.pill,
                  background: palette.bg,
                  color: palette.ink,
                  fontFamily: TYPOGRAPHY.mono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {palette.label}
              </span>
            </div>
            <p style={{ margin: 0, fontFamily: TYPOGRAPHY.sans, fontSize: 12, color: SHELL.INK_SOFT, lineHeight: 1.4 }}>
              {a.summary}
            </p>
          </div>
        );
      })}
    </section>
  );
}
