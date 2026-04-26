import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, FONTS, TEXT } from '@/lib/design-system';
import type { SourceAgentMissionReport } from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';
import { sourceCard, sourceInsetCard, sourceMuted, sourceSectionLabel } from './foundationStyles';

export function PersistentNexusPanel({
  event,
  missionReport,
}: {
  event: SourcingEventDetail;
  missionReport: SourceAgentMissionReport;
}) {
  const topMission = missionReport.topMissions[0];
  const handoff = missionReport.handoffs[0];

  return (
    <aside
      style={{
        ...sourceCard,
        position: 'sticky',
        top: 18,
        background: EXPERIENCE_COLORS.surface,
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
      }}
    >
      <div>
        <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Nexus guidance</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>
          Lead sourcing agent
        </div>
      </div>
      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
        {event.leadAgent} / {event.currentStageLabel} / no model calls
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>What matters now</div>
        <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary }}>
          {event.blocker ?? event.nextDecision}
        </div>
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>Recommended next action</div>
        <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary }}>
          {missionReport.recommendedNextAction}
        </div>
        {topMission ? (
          <div
            style={{
              border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
              borderRadius: 10,
              background: EXPERIENCE_COLORS.surface,
              padding: '9px 10px',
            }}
          >
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.accentTeal, fontWeight: 800 }}>
              Top mission / {topMission.priority}
            </div>
            <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 800 }}>{topMission.title}</div>
            <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
              Evidence: {topMission.evidenceStatus}
            </div>
          </div>
        ) : null}
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>Suggested actions</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {missionReport.suggestedActions.slice(0, 4).map((action) => (
            <div key={action.id} style={ACTION_ROW}>
              <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 800 }}>{action.label}</div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                {action.description}
              </div>
            </div>
          ))}
        </div>
        <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
          Visual guidance only. This shell does not create chat, freeform input, or workflow mutation.
        </div>
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: EXPERIENCE_COLORS.textPrimary }}>Quiet handoff</div>
        <div style={{ ...sourceMuted, color: EXPERIENCE_COLORS.textSecondary }}>
          {handoff ?? 'No deterministic handoff is required beyond the current mission queue.'}
        </div>
      </div>

      <div
        style={{
          ...sourceInsetCard,
          background: EXPERIENCE_COLORS.darkPanel,
          border: '1px solid rgba(255,255,255,0.10)',
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#5EEAD4',
          }}
        >
          Shell boundary
        </div>
        <div style={{ color: '#F8FAFC', fontWeight: 800 }}>Deterministic guidance only</div>
        <div style={{ ...sourceMuted, color: 'rgba(248,250,252,0.72)' }}>
          No model calls, chat UI, upload parsing, scorecard UI, approval engine, or artifact drawer behavior.
        </div>
      </div>
    </aside>
  );
}

const LIGHT_INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 13,
};

const ACTION_ROW: CSSProperties = {
  display: 'grid',
  gap: 3,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surface,
  padding: '9px 10px',
};
