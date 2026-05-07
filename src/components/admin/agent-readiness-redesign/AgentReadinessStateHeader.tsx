/**
 * AgentReadinessStateHeader · Block 5.1 (Setup Redesign Package PR C).
 *
 * 4 agent cards (Nexus / Sentinel / Steward / Atlas) with current
 * capability level. Per `DATA_BINDING_CATALOG.md` §5.1 + Setup
 * canon refit.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type { AgentStateMetric } from '@/lib/admin/agent-readiness-composer';

const LEVEL_COLOR: Record<AgentStateMetric['level'], { bg: string; ink: string; label: string }> = {
  'decision-grade': { bg: SETUP.mintSoft, ink: SETUP.mint, label: 'Decision-grade' },
  partial: { bg: SETUP.amberSoft, ink: SETUP.amber, label: 'Partial' },
  thin: { bg: SETUP.coralSoft, ink: SETUP.coral, label: 'Thin' },
  blank: { bg: SETUP.paperSoft, ink: SETUP.inkMuted, label: 'Not active' },
};

export function AgentReadinessStateHeader({ agents }: { agents: AgentStateMetric[] }) {
  return (
    <section
      data-agent-readiness-block="state-header"
      data-testid="agent-readiness-state-header"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 10,
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
              background: SETUP.cardWhite,
              border: `1px solid ${SETUP.cardLine}`,
              borderRadius: SETUP_RADIUS.md,
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'space-between',
              }}
            >
              <span style={SETUP_TYPE.cardH2}>{a.label}</span>
              <span
                data-agent-level-pill={a.level}
                style={{
                  padding: '2px 8px',
                  borderRadius: SETUP_RADIUS.pill,
                  background: palette.bg,
                  color: palette.ink,
                  fontFamily: SETUP.mono,
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                {palette.label}
              </span>
            </div>
            <p style={{ ...SETUP_TYPE.bodySans, margin: 0, color: SETUP.inkMuted, fontSize: 12 }}>
              {a.summary}
            </p>
          </div>
        );
      })}
    </section>
  );
}
