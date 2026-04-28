import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceBafoNegotiationPlan } from '@/lib/source/bafo-negotiation-types';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

export function SourceBafoNegotiationPanel({ plan }: { plan: SourceBafoNegotiationPlan }) {
  return (
    <section style={PANEL} aria-label="BAFO negotiation panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>BAFO negotiation</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>Event negotiation readiness</h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: SHELL.INK_MUTED, textTransform: 'none' }}>
            Deterministic BAFO guidance anchored to vendor responses and seeded pricing inputs.
          </p>
        </div>
        <div style={TOP_RIBBON}>
          <div style={RIBBON_LABEL}>Overall negotiation readiness</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: readinessColor(plan.overallNegotiationReadiness) }}>
            {plan.overallNegotiationReadiness}
          </div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{plan.nextAction}</div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Executive tradeoff">
          <div style={{ color: SHELL.INK, fontWeight: 700 }}>
            {plan.executiveTradeoffSummary}
          </div>
          <div style={sourceSectionLabel}>Nexus recommendation</div>
          <div style={{ color: SHELL.INK_MUTED }}>{plan.nexusGuidance}</div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED, marginTop: 8 }}>
            Atlas: {plan.atlasExecutiveImplication}
          </div>
        </InfoCard>

        <InfoCard title="Top BAFO priorities">
          <ul style={LIST}>
            {plan.recommendedBafoPriorities.map((priority) => (
              <li key={priority} style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>
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
                <li key={assumption} style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>
                  {assumption}
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ color: SHELL.INK_MUTED }}>No assumption locks are currently captured.</div>
          )}
        </InfoCard>

        <InfoCard title="Excluded scope" tone="amber">
          <ul style={LIST}>
            {plan.excludedScopeList.slice(0, 10).map((scope) => (
              <li key={scope} style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>
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
              <li key={note} style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>{note}</li>
            ))}
          </ul>
          <div style={sourceSectionLabel}>Sentinel caution</div>
          <ul style={LIST}>
            {plan.sentinelEvidenceNotes.length > 0 ? (
              plan.sentinelEvidenceNotes.map((note) => (
                <li key={note} style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>{note}</li>
              ))
            ) : (
              <li style={{ marginBottom: 7, color: SHELL.INK_MUTED }}>No evidence cautions are currently flagged.</li>
            )}
          </ul>
        </InfoCard>
      </div>

      <div>
        <div style={sourceSectionLabel}>Vendor BAFO questions</div>
        <div style={GRID_FULL}>
          {plan.vendorNegotiationPlans.map((vendor) => (
            <div key={vendor.vendorId} style={VENDOR_SECTION}>
              <div style={{ ...sourceSectionLabel, color: SHELL.INK }}>
                {vendor.vendorName} · {vendor.readiness}
              </div>
              <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED }}>
                {vendor.expectedValueImpact}
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                Key issues: {vendor.keyIssues.join(', ')}
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                Required clarifications: {vendor.requiredClarifications.join('; ')}
              </div>
              <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>
                Recommended asks: {vendor.recommendedAsks.join('; ')}
              </div>
              <ul style={LIST}>
                {vendor.negotiationQuestions.slice(0, 4).map((question) => (
                  <li key={`${vendor.vendorId}-${question.question}`} style={{ marginBottom: 7 }}>
                    <span style={{ color: SHELL.INK, fontWeight: 700 }}>
                      [{question.category} · {question.priority}]
                    </span>
                    {' '}
                    {question.question}
                    <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED, marginTop: 4 }}>
                      {question.reason}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED }}>
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
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
  color: SHELL.INK_MUTED,
};

const TOP_RIBBON: CSSProperties = {
  minWidth: 220,
  ...sourceSectionLabel,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 10,
  textAlign: 'right',
};

const RIBBON_LABEL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  textTransform: 'uppercase',
  letterSpacing: '0.07em',
  color: SHELL.INK_MUTED,
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 540,
  color: SHELL.INK,
};

const TABLE_CELL: CSSProperties = {
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

const TABLE_BODY_CELL: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  borderBottom: '1px solid ' + SHELL.CARD_LINE,
  padding: '8px 10px',
  verticalAlign: 'top',
  color: SHELL.INK,
};

const VENDOR_SECTION: CSSProperties = {
  display: 'grid',
  gap: 8,
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 10,
  background: SHELL.PAPER_SOFT,
  padding: 12,
};

function card(tone: 'neutral' | 'blue' | 'amber' | 'teal') {
  const toneColor = tone === 'blue'
    ? SHELL.INK_MID
    : tone === 'amber'
      ? SHELL.PEACH_TEXT
      : tone === 'teal'
        ? SHELL.INK_SOFT
        : SHELL.INK_MUTED;

  return {
    display: 'grid',
    gap: 8,
    border: '1px solid ' + SHELL.CARD_LINE,
    borderRadius: 10,
    background: SHELL.PAPER_SOFT,
    padding: 12,
    minWidth: 0,
    color: toneColor,
  } as CSSProperties;
}

function readinessColor(status: SourceBafoNegotiationPlan['overallNegotiationReadiness']): string {
  if (status === 'ready') return SHELL.MINT_TEXT;
  if (status === 'partially_ready') return SHELL.INK_MID;
  if (status === 'not_ready') return SHELL.PEACH_TEXT;
  return SHELL.RUST_TEXT;
}
