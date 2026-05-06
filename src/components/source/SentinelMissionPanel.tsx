import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceAgentMissionReport } from '@/lib/source';
import type { SourcingEventDetail } from '@/lib/source/types';

const sourceCard = {
  background: SHELL.CARD_WHITE,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  padding: '16px 18px',
  display: 'flex',
  flexDirection: 'column' as const,
  gap: 12,
};

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

const sourceMuted = {
  fontFamily: SHELL.SANS,
  fontSize: 13,
  color: SHELL.INK_MUTED,
  lineHeight: 1.5,
};

export function SentinelMissionPanel({
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
        background: SHELL.CARD_WHITE,
        border: '1px solid ' + SHELL.CARD_LINE,
      }}
    >
      <div>
        <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Sentinel guidance</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: SHELL.INK }}>
          Lead sourcing agent
        </div>
      </div>
      <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
        {event.leadAgent} / {event.currentStageLabel} / current context
      </div>

      <div style={LIGHT_INSET} data-boundary="Deterministic guidance only">
        <div style={{ fontWeight: 800, color: SHELL.INK }}>What matters now</div>
        <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
          {event.blocker ?? event.nextDecision}
        </div>
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: SHELL.INK }}>Recommended next action</div>
        <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
          {missionReport.recommendedNextAction}
        </div>
        {topMission ? (
          <div
            style={{
              border: '1px solid ' + SHELL.CARD_LINE,
              borderRadius: 10,
              background: SHELL.CARD_WHITE,
              padding: '9px 10px',
            }}
          >
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_SOFT, fontWeight: 800 }}>
              Top mission / {topMission.priority}
            </div>
            <div style={{ color: SHELL.INK, fontWeight: 800 }}>{topMission.title}</div>
            <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
              Evidence: {topMission.evidenceStatus}
            </div>
          </div>
        ) : null}
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: SHELL.INK }}>Suggested actions</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {missionReport.suggestedActions.slice(0, 4).map((action) => (
            <div key={action.id} style={ACTION_ROW}>
              <div style={{ color: SHELL.INK, fontWeight: 800 }}>{action.label}</div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                {action.description}
              </div>
            </div>
          ))}
        </div>
        <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
          Actions stay grounded in the current stage context.
        </div>
      </div>

      <div style={LIGHT_INSET}>
        <div style={{ fontWeight: 800, color: SHELL.INK }}>Quiet handoff</div>
        <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
          {handoff ?? 'No deterministic handoff is required beyond the current mission queue.'}
        </div>
      </div>

      <div style={LIGHT_INSET}>
        <div
          style={{
            fontFamily: SHELL.MONO,
            fontSize: '10px',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: SHELL.INK_SOFT,
          }}
        >
          Context used
        </div>
        <div style={{ color: SHELL.INK, fontWeight: 800 }}>Event, stage, gate, and mission state</div>
        <div style={{ ...sourceMuted, color: SHELL.INK_MUTED }}>
          Sentinel guidance is limited to the current event context and readiness signals.
        </div>
      </div>
    </aside>
  );
}

const LIGHT_INSET: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.PAPER_SOFT,
  padding: 13,
};

const ACTION_ROW: CSSProperties = {
  display: 'grid',
  gap: 3,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.CARD_WHITE,
  padding: '9px 10px',
};
