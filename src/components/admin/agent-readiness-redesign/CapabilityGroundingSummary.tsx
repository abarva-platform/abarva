/**
 * CapabilityGroundingSummary · Wave 3 PR-1.
 *
 * Compact strip rendered on `/admin/agent-readiness` between the
 * state-header cards and the Capability Constellation matrix.  Shows
 * per-agent L0–L3 grounding levels derived from the
 * `capability-grounding-broker` — the same source the Section 05
 * landing-panel foot uses.
 *
 * The visual layout of the matrix stays identical (verdict §7
 * constraint).  This strip is an honest header above the matrix that
 * tells admins, in one row per agent, what level the broker thinks
 * the agent is at across each of its primary capability families.
 *
 * Honesty marker: when the rollup is `evidence: 'estimated'` (today
 * always, until evaluator scores land), we surface that explicitly
 * in the strip footer.  L3 derived from substrate alone is shown,
 * but it is shown as `L3·est` so the surface never silently claims
 * board-ready capability.
 */

import { SETUP, SETUP_RADIUS, SETUP_TYPE } from '@/lib/admin/setup-tokens';
import type {
  CapabilityAgentGrounding,
  CapabilityGrounding,
  CapabilityGroundingLevel,
} from '@/lib/admin/broker/capability-grounding-broker';

const LEVEL_PALETTE: Record<
  CapabilityGroundingLevel,
  { bg: string; ink: string }
> = {
  L3: { bg: SETUP.mintSoft, ink: SETUP.mint },
  L2: { bg: SETUP.amberSoft, ink: SETUP.amber },
  L1: { bg: SETUP.coralSoft, ink: SETUP.coral },
  L0: { bg: SETUP.paperSoft, ink: SETUP.inkFaint },
};

const AGENT_LABEL: Record<CapabilityAgentGrounding['agent'], string> = {
  nexus: 'Nexus',
  sentinel: 'Sentinel',
  steward: 'Steward',
  atlas: 'Atlas',
};

export function CapabilityGroundingSummary({
  grounding,
}: {
  grounding: CapabilityGrounding;
}) {
  const isEstimated = grounding.evidence === 'estimated';
  return (
    <section
      data-agent-readiness-block="grounding-summary"
      data-testid="capability-grounding-summary"
      data-evidence={grounding.evidence}
      style={{
        background: SETUP.cardWhite,
        border: `1px solid ${SETUP.cardLine}`,
        borderRadius: SETUP_RADIUS.lg,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <header
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <span
          style={{
            fontFamily: SETUP.mono,
            fontSize: 10,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: SETUP.inkMuted,
            fontWeight: 700,
          }}
        >
          Capability grounding · per-agent · per-family
        </span>
        <span
          data-grounding-evidence
          style={{
            fontFamily: SETUP.mono,
            fontSize: 10,
            color: isEstimated ? SETUP.amber : SETUP.mint,
            fontWeight: 700,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {isEstimated
            ? 'estimated · substrate-only until evaluator lands'
            : 'live · substrate + evaluator'}
        </span>
      </header>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 10,
        }}
      >
        {grounding.perAgent.map((agentRollup) => (
          <div
            key={agentRollup.agent}
            data-agent-id={agentRollup.agent}
            data-agent-highest={agentRollup.highestLevel}
            data-agent-avg={agentRollup.averageLevel}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              padding: '10px 12px',
              borderRadius: SETUP_RADIUS.md,
              background: SETUP.paperSoft,
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
              <span style={{ ...SETUP_TYPE.cardH2, fontSize: 14 }}>
                {AGENT_LABEL[agentRollup.agent]}
              </span>
              <span
                style={{
                  fontFamily: SETUP.mono,
                  fontSize: 10,
                  color: SETUP.inkMuted,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                top {agentRollup.highestLevel}
                {isEstimated ? '·est' : ''} · avg {agentRollup.averageLevel}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 6,
                flexWrap: 'wrap',
              }}
            >
              {agentRollup.families.map((family) => {
                const palette = LEVEL_PALETTE[family.level];
                return (
                  <span
                    key={family.familyId}
                    data-family-id={family.familyId}
                    data-family-level={family.level}
                    title={`${family.familyLabel} · ${family.level}${
                      isEstimated ? ' · estimated' : ''
                    }`}
                    style={{
                      padding: '2px 8px',
                      borderRadius: SETUP_RADIUS.pill,
                      background: palette.bg,
                      color: palette.ink,
                      fontFamily: SETUP.mono,
                      fontSize: 9.5,
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                    }}
                  >
                    {family.familyLabel.split(' ')[0]} · {family.level}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
