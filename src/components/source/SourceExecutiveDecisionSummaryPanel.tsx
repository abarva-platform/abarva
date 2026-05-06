import type { CSSProperties, ReactNode } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceExecutiveDecisionSummary } from '@/lib/source/executive-decision-types';
import { sourceSectionLabel } from './foundationStyles';

export function SourceExecutiveDecisionSummaryPanel({
  summary,
}: {
  summary: SourceExecutiveDecisionSummary;
}) {
  const posture = summary.decisionPosture ?? summary.recommendedDecisionPosture;

  return (
    <section style={PANEL} aria-label="Executive decision summary panel">
      <div style={HEADER}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>Executive decision summary</div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>Selection-readiness decision brief</h4>
          <p style={{ margin: '7px 0 0', ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Deterministic summary for steering review. This surface does not finalize vendor selection.
          </p>
        </div>
        <div style={POSTURE_BADGE}>
          <div style={sourceSectionLabel}>Decision posture</div>
          <div style={{ ...TEXT.small, color: postureColor(posture) }}>
            {posture}
          </div>
        </div>
      </div>

      <div style={GRID_TWO}>
        <Card title="Decision needed">
          <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>{summary.decisionNeeded}</div>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Sentinel recommended next action</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{summary.recommendedNextAction}</div>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Sentinel recommendation</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{summary.nexusRecommendation}</div>
        </Card>

        <Card title="Value and risk posture">
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Value at stake: {summary.valueAtStake.amountUsd.toLocaleString('en-US')} USD
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Commercial risk: {summary.commercialRisk}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Transition risk: {summary.transitionRisk}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
            Evidence confidence: {summary.evidenceConfidence}
          </div>
        </Card>
      </div>

      <Card title="Vendor tradeoffs">
        <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginBottom: 8 }}>
          {summary.vendorTradeoffs.length} vendors assessed · deterministic comparative view
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={TABLE}>
            <thead>
              <tr>
                <th style={TABLE_HEAD}>Vendor</th>
                <th style={TABLE_HEAD}>Viability</th>
                <th style={TABLE_HEAD}>Cost</th>
                <th style={TABLE_HEAD}>Value</th>
                <th style={TABLE_HEAD}>Commercial risk</th>
                <th style={TABLE_HEAD}>Transition risk</th>
                <th style={TABLE_HEAD}>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {summary.vendorTradeoffs.map((tradeoff) => (
                <tr key={tradeoff.vendorId}>
                  <td style={TABLE_CELL}>{tradeoff.vendorName}</td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.viability}</StatusPill>
                  </td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.costPosition}</StatusPill>
                  </td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.valuePotential}</StatusPill>
                  </td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.commercialRisk}</StatusPill>
                  </td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.transitionRisk}</StatusPill>
                  </td>
                  <td style={TABLE_CELL}>
                    <StatusPill>{tradeoff.evidenceConfidence}</StatusPill>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={GRID_TWO}>
        <Card title="Viable vendors">
          <ul style={LIST}>
            {summary.viableVendors.length > 0
              ? summary.viableVendors.map((vendor) => <li key={vendor}>{vendor}</li>)
              : <li>No vendors are currently selection-ready.</li>}
          </ul>
        </Card>

        <Card title="Unresolved assumptions">
          <ul style={LIST}>
            {summary.unresolvedAssumptions.length > 0
              ? summary.unresolvedAssumptions.map((assumption) => <li key={assumption}>{assumption}</li>)
              : <li>No unresolved assumptions are currently listed.</li>}
          </ul>
        </Card>
      </div>

      <div style={GRID_TWO}>
        <Card title="Blockers">
          <ul style={LIST}>
            {summary.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}
          </ul>
        </Card>

        <Card title="Decision options">
          <ul style={LIST}>
            {summary.decisionOptions.map((option) => <li key={option}>{option}</li>)}
          </ul>
        </Card>
      </div>

      <div style={GRID_TWO}>
        <Card title="Atlas executive brief">
          <div style={{ color: EXPERIENCE_COLORS.textPrimary }}>{summary.atlasExecutiveBrief}</div>
        </Card>

        <Card title="Sentinel and Steward notes">
          <div style={sourceSectionLabel}>Sentinel cautions</div>
          <ul style={LIST}>
            {summary.sentinelCautions.length > 0
              ? summary.sentinelCautions.map((caution) => <li key={caution}>{caution}</li>)
              : <li>No Sentinel cautions are currently flagged.</li>}
          </ul>
          <div style={{ ...sourceSectionLabel, marginTop: 8 }}>Steward gate notes</div>
          <ul style={LIST}>
            {summary.stewardGateNotes.map((note) => <li key={note}>{note}</li>)}
          </ul>
        </Card>
      </div>

      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
        Recommended next action: {summary.recommendedNextAction}
      </div>
      <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
        Source modules used: {summary.sourceModulesUsed.join(', ')}
      </div>
    </section>
  );
}

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div style={CARD}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

function StatusPill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
        borderRadius: 999,
        background: EXPERIENCE_COLORS.surfaceWarm,
        padding: '2px 8px',
        fontSize: 11,
        fontWeight: 600,
        color: EXPERIENCE_COLORS.textSecondary,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

function postureColor(posture: SourceExecutiveDecisionSummary['decisionPosture']): string {
  if (posture === 'ready_for_selection_review') return EXPERIENCE_COLORS.journeyComplete;
  if (posture === 'proceed_to_bafo') return EXPERIENCE_COLORS.accentBlue;
  if (posture === 'defer_pending_clarifications') return EXPERIENCE_COLORS.riskAmber;
  if (posture === 'waiver_required') return EXPERIENCE_COLORS.riskAmber;
  return EXPERIENCE_COLORS.riskRed;
}

const PANEL: CSSProperties = {
  display: 'grid',
  gap: 12,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surface,
  padding: 12,
};

const HEADER: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  gap: 12,
};

const POSTURE_BADGE: CSSProperties = {
  minWidth: 220,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 10,
  textAlign: 'right',
};

const GRID_TWO: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
  gap: 10,
};

const CARD: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 12,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  color: EXPERIENCE_COLORS.textSecondary,
  display: 'grid',
  gap: 4,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 860,
  color: EXPERIENCE_COLORS.textPrimary,
};

const TABLE_HEAD: CSSProperties = {
  ...TEXT.small,
  textAlign: 'left',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  color: EXPERIENCE_COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
  verticalAlign: 'top',
};

const TABLE_CELL: CSSProperties = {
  ...TEXT.small,
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: EXPERIENCE_COLORS.textPrimary,
};
