import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceBafoNegotiationPlan } from '@/lib/source/bafo-negotiation-types';
import { sourceSectionLabel } from './foundationStyles';

export function SourceBafoNegotiationPanel({ plan }: { plan: SourceBafoNegotiationPlan }) {
  return (
    <section style={PANEL} aria-label="BAFO negotiation panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>BAFO negotiation</div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>Event negotiation readiness</h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary, textTransform: 'none' }}>
            Deterministic BAFO guidance anchored to vendor responses and seeded pricing inputs.
          </p>
        </div>
        <div style={TOP_RIBBON}>
          <div style={RIBBON_LABEL}>Overall negotiation readiness</div>
          <div style={{ ...TEXT.small, color: readinessColor(plan.overallNegotiationReadiness) }}>
            {plan.overallNegotiationReadiness}
          </div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{plan.nextAction}</div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Executive tradeoff">
          <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>
            {plan.executiveTradeoffSummary}
          </div>
          <div style={sourceSectionLabel}>Nexus recommendation</div>
          <div style={{ color: EXPERIENCE_COLORS.textSecondary }}>{plan.nexusGuidance}</div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary, marginTop: 8 }}>
            Atlas: {plan.atlasExecutiveImplication}
          </div>
        </InfoCard>

        <InfoCard title="Top BAFO priorities">
          <ul style={LIST}>
            {plan.recommendedBafoPriorities.map((priority) => (
              <li key={priority} style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>
                {priority}
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Assumption locks" tone="blue">
          {plan.assumptionLockList.length > 0 ? (
            <ul style={LIST}>
              {plan.assumptionLockList.map((assumption) => (
                <li key={assumption} style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>
                  {assumption}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: EXPERIENCE_COLORS.textSecondary }}>No assumption locks are currently captured.</div>
          )}
        </InfoCard>

        <InfoCard title="Excluded scope" tone="amber">
          <ul style={LIST}>
            {plan.excludedScopeList.slice(0, 10).map((scope) => (
              <li key={scope} style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>
                {scope}
              </li>
            ))}
          </ul>
        </InfoCard>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Commercial traps">
          <div style={{ overflowX: 'auto' }}>
            <table style={TABLE}>
              <thead>
                <tr>
                  <th style={TABLE_CELL}>Category</th>
                  <th style={TABLE_CELL}>Count</th>
                  <th style={TABLE_CELL}>Severity</th>
                  <th style={TABLE_CELL}>Examples</th>
                </tr>
              </thead>
              <tbody>
                {plan.commercialTrapSummary.map((trap) => (
                  <tr key={`${trap.category}-${trap.severity}`}>
                    <td style={TABLE_BODY_CELL}>{trap.category}</td>
                    <td style={TABLE_BODY_CELL}>{trap.count}</td>
                    <td style={TABLE_BODY_CELL}>{trap.severity}</td>
                    <td style={TABLE_BODY_CELL}>{trap.samples.join('; ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>

        <InfoCard title="Steward and Sentinel notes">
          <div style={sourceSectionLabel}>Steward gate notes</div>
          <ul style={LIST}>
            {plan.stewardGateNotes.map((note) => (
              <li key={note} style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>{note}</li>
            ))}
          </ul>
          <div style={sourceSectionLabel}>Sentinel caution</div>
          <ul style={LIST}>
            {plan.sentinelEvidenceNotes.length > 0 ? (
              plan.sentinelEvidenceNotes.map((note) => (
                <li key={note} style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>{note}</li>
              ))
            ) : (
              <li style={{ marginBottom: 7, color: EXPERIENCE_COLORS.textSecondary }}>No evidence cautions are currently flagged.</li>
            )}
          </ul>
        </InfoCard>
      </div>

      <div>
        <div style={sourceSectionLabel}>Vendor BAFO questions</div>
        <div style={GRID_FULL}>
          {plan.vendorNegotiationPlans.map((vendor) => (
            <div key={vendor.vendorId} style={VENDOR_SECTION}>
              <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textPrimary }}>
                {vendor.vendorName} · {vendor.readiness}
              </div>
              <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary }}>
                {vendor.expectedValueImpact}
              </div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Key issues: {vendor.keyIssues.join(', ')}
              </div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Required clarifications: {vendor.requiredClarifications.join('; ')}
              </div>
              <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>
                Recommended asks: {vendor.recommendedAsks.join('; ')}
              </div>
              <ul style={LIST}>
                {vendor.negotiationQuestions.slice(0, 4).map((question) => (
                  <li key={`${vendor.vendorId}-${question.question}`} style={{ marginBottom: 7 }}>
                    <span style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>
                      [{question.category} · {question.priority}]
                    </span>
                    {' '}
                    {question.question}
                    <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 4 }}>
                      {question.reason}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary }}>
        Top blockers: {plan.blockers.join(' | ')}
      </div>
    </section>
  );
}

function InfoCard({
  title,
  children,
  tone = 'neutral',
}: {
  title: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'amber' | 'teal';
}) {
  return (
    <div style={card(tone)}>
      <div style={sourceSectionLabel}>{title}</div>
      <div>{children}</div>
    </div>
  );
}

const PANEL: CSSProperties = {
  display: 'grid',
  gap: 12,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 12,
  background: EXPERIENCE_COLORS.surface,
  padding: 12,
};

const GRID_TWO_COL: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 270px), 1fr))',
  gap: 10,
  alignItems: 'start',
};

const GRID_FULL: CSSProperties = {
  display: 'grid',
  gap: 10,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 3,
  color: EXPERIENCE_COLORS.textSecondary,
};

const TOP_RIBBON: CSSProperties = {
  minWidth: 220,
  ...sourceSectionLabel,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 10,
  textAlign: 'right',
};

const RIBBON_LABEL: CSSProperties = {
  ...TEXT.small,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: EXPERIENCE_COLORS.textSecondary,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 540,
  color: EXPERIENCE_COLORS.textPrimary,
};

const TABLE_CELL: CSSProperties = {
  ...TEXT.small,
  textAlign: 'left',
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  color: EXPERIENCE_COLORS.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  padding: '8px 10px',
};

const TABLE_BODY_CELL: CSSProperties = {
  ...TEXT.small,
  borderBottom: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: EXPERIENCE_COLORS.textPrimary,
};

const VENDOR_SECTION: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 10,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: 12,
};

function card(tone: 'neutral' | 'blue' | 'amber' | 'teal') {
  const toneColor = tone === 'blue'
    ? EXPERIENCE_COLORS.accentBlue
    : tone === 'amber'
      ? EXPERIENCE_COLORS.riskAmber
      : tone === 'teal'
        ? EXPERIENCE_COLORS.accentTeal
        : EXPERIENCE_COLORS.textSecondary;

  return {
    display: 'grid',
    gap: 8,
    border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
    borderRadius: 10,
    background: EXPERIENCE_COLORS.surfaceWarm,
    padding: 12,
    minWidth: 0,
    color: toneColor,
  } as CSSProperties;
}

function readinessColor(status: SourceBafoNegotiationPlan['overallNegotiationReadiness']): string {
  if (status === 'ready') return EXPERIENCE_COLORS.journeyComplete;
  if (status === 'partially_ready') return EXPERIENCE_COLORS.accentBlue;
  if (status === 'not_ready') return EXPERIENCE_COLORS.riskAmber;
  return EXPERIENCE_COLORS.riskRed;
}
