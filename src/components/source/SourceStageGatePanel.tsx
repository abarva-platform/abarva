import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceStageGateReadiness } from '@/lib/source/source-stage-gate-types';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

export function SourceStageGatePanel({ readiness }: { readiness: SourceStageGateReadiness }) {
  const currentGate = readiness.gates.find((gate) => gate.fromStageKey === readiness.currentStageKey) ?? readiness.gates[0];

  return (
    <section style={SECTION} aria-label="Source stage gate readiness panel">
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>Stage gate readiness</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>Current gate signal</h4>
          <p style={{ margin: '7px 0 0', fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Deterministic stage-gate view for progression clarity. No approval engine is executing actions.
          </p>
        </div>
        <div style={STATUS_CARD}>
          <div style={{ ...sourceSectionLabel }}>Overall state</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: stateColor(readiness.overallState), fontWeight: 800 }}>
            {readiness.overallState}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{readiness.recommendedNextAction}</div>
        </div>
      </div>

      <div style={GRID_TWO}>
        <Card title="Current gate">
          <div style={{ color: SHELL.INK, fontWeight: 800 }}>{currentGate.transitionLabel}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: stateColor(currentGate.state), fontWeight: 800, textTransform: 'uppercase' }}>
            {currentGate.state}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Blocker: {currentGate.blocker ?? 'none'}
          </div>
        </Card>
        <Card title="Sentinel / Steward guidance">
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Sentinel next action: {readiness.recommendedNextAction}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
            Steward gate posture: {readiness.blockers.length > 0 ? 'Resolve blockers before progression.' : 'No blocker escalation required.'}
          </div>
        </Card>
      </div>

      <Card title="Gate transition table">
        <div style={{ overflowX: 'auto' }}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={TABLE_HEAD}>Transition</th>
                <th style={TABLE_HEAD}>State</th>
                <th style={TABLE_HEAD}>Blocker</th>
                <th style={TABLE_HEAD}>Required artifacts</th>
                <th style={TABLE_HEAD}>Required approvals</th>
                <th style={TABLE_HEAD}>Evidence gap</th>
              </tr>
            </thead>
            <tbody>
              {readiness.gates.map((gate) => (
                <tr key={gate.transitionId}>
                  <td style={TABLE_CELL}>{gate.transitionLabel}</td>
                  <td style={TABLE_CELL}>
                    <span style={{ ...pill, color: stateColor(gate.state), borderColor: stateColor(gate.state) }}>
                      {gate.state}
                    </span>
                  </td>
                  <td style={TABLE_CELL}>{gate.blocker ?? 'none'}</td>
                  <td style={TABLE_CELL}>{gate.requiredArtifacts.join(', ')}</td>
                  <td style={TABLE_CELL}>{gate.requiredApprovals.join(', ')}</td>
                  <td style={TABLE_CELL}>{gate.evidenceGap ?? 'none'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={CARD}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function stateColor(state: SourceStageGateReadiness['overallState']): string {
  if (state === 'ready') return SHELL.MINT_TEXT;
  if (state === 'blocked') return SHELL.RUST_TEXT;
  if (state === 'waiting') return SHELL.PEACH_TEXT;
  if (state === 'needs_approval') return SHELL.INK_MID;
  if (state === 'waiver_required') return SHELL.PEACH_TEXT;
  return SHELL.INK_MUTED;
}

const SECTION: CSSProperties = {
  display: 'grid',
  gap: 10,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
  padding: 12,
};

const HEADER: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 10,
  flexWrap: 'wrap',
  alignItems: 'baseline',
};

const GRID_TWO: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 10,
};

const STATUS_CARD: CSSProperties = {
  minWidth: 240,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 10,
  textAlign: 'right',
};

const CARD: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 12,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 1000,
};

const TABLE_HEAD: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textAlign: 'left',
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  color: SHELL.INK_MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
};

const TABLE_CELL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: SHELL.INK,
};

const pill: CSSProperties = {
  border: '1px solid',
  borderRadius: 999,
  padding: '2px 8px',
  fontSize: '11px',
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
};
