import type { CSSProperties } from 'react';
import { EXPERIENCE_COLORS, TEXT } from '@/lib/design-system';
import type { SourceRfpReadiness, SourceRfpReadinessSectionReadiness } from '@/lib/source';
import { sourceSectionLabel } from './foundationStyles';

export function SourceRfpReadinessPanel({ readiness }: { readiness: SourceRfpReadiness }) {
  return (
    <section style={PANEL} aria-label="RFP readiness panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.accentTeal }}>RFP readiness</div>
          <h4 style={{ margin: '4px 0 0', color: EXPERIENCE_COLORS.textPrimary }}>Event RFP readiness snapshot</h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary, textTransform: 'none' }}>
            {readiness.overallTier === 'Rich'
              ? 'Release package readiness is strong enough for a draft-rich pathway.'
              : readiness.overallTier === 'Outline'
                ? 'Scope is close but still has caveats to carry forward into outline-tier drafting.'
                : readiness.overallTier === 'Stub'
                  ? 'Important inputs are still partial; do not treat this as release-ready packaging.'
                  : readiness.overallTier === 'Waiver Required'
                    ? 'Required blockers exist, and waiver path is now the planning baseline.'
                    : 'RFP readiness is blocked by required data and gate conditions.'}
          </p>
        </div>
        <div style={TIER_PANEL}>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Overall tier
          </div>
          <div style={tierBadge(readiness.overallTier)}>{readiness.overallTier}</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary }}>{readiness.readinessStatus}</div>
          <div style={{ ...TEXT.small, color: EXPERIENCE_COLORS.textSecondary, marginTop: 4 }}>
            Score {readiness.readinessScore}
          </div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Why this tier applies">
          <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>{readiness.nexusGuidance}</div>
          <div style={sourceSectionLabel}>
            {readiness.nexusGuidance}
          </div>
        </InfoCard>

        <InfoCard title="Nexus recommendation">
          <div style={{ color: EXPERIENCE_COLORS.textPrimary, fontWeight: 700 }}>{readiness.recommendedNextAction}</div>
        </InfoCard>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Missing inputs" tone="amber">
          {readiness.missingInputs.length > 0 ? (
            <ul style={LIST}>
              {readiness.missingInputs.map((item) => (
                <li key={item.category} style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>{item.category}</span>
                  {' · '}
                  <span style={{ color: EXPERIENCE_COLORS.textSecondary }}>{item.impact}</span>
                  {' · '}
                  <span style={{ color: EXPERIENCE_COLORS.riskRed }}>{item.severity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ ...TEXT.bodySecondary, color: EXPERIENCE_COLORS.textSecondary }}>No required missing input rows are present.</div>
          )}
        </InfoCard>

        <InfoCard title="Required artifacts" tone="blue">
          <div style={{ display: 'grid', gap: 8 }}>
            {readiness.requiredArtifacts.map((artifact) => (
              <div key={artifact.name} style={ARTIFACT_ROW}>
                <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>{artifact.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={statusChip(artifact.readiness)}>{artifact.readiness}</div>
                  <div style={{ color: EXPERIENCE_COLORS.textSecondary }}>
                    {artifact.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </InfoCard>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="RFP section readiness" tone="teal">
          <div style={{ maxWidth: '100%', overflowX: 'auto' }}>
            <table style={TABLE}>
              <thead>
                <tr style={{ textAlign: 'left' }}>
                  <th style={TABLE_CELL}>Section</th>
                  <th style={TABLE_CELL}>Status</th>
                  <th style={TABLE_CELL}>Missing</th>
                </tr>
              </thead>
              <tbody>
                {readiness.rfpSections.map((section) => (
                  <SectionRow key={section.id} section={section} />
                ))}
              </tbody>
            </table>
          </div>
        </InfoCard>

        <InfoCard title="Gate and stewardship notes" tone="neutral">
          <ul style={LIST}>
            {readiness.stewardGateNotes.map((note) => (
              <li key={note} style={{ marginBottom: 8 }}>{note}</li>
            ))}
          </ul>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary }}>
            {readiness.sentinelEvidenceNotes[0] ?? 'Sentinel evidence notes are not yet initialized.'}
          </div>
          <div style={{ ...sourceSectionLabel, color: EXPERIENCE_COLORS.textSecondary, marginTop: 8 }}>
            Atlas view: {readiness.atlasExecutiveImplication}
          </div>
        </InfoCard>
      </div>
    </section>
  );
}

function SectionRow({ section }: { section: SourceRfpReadinessSectionReadiness }) {
  return (
    <tr>
      <td style={TABLE_BODY_CELL}>
        <div style={{ fontWeight: 700, color: EXPERIENCE_COLORS.textPrimary }}>{section.title}</div>
      </td>
      <td style={TABLE_BODY_CELL}>
        <StatusChip status={section.status}>{section.status}</StatusChip>
      </td>
      <td style={TABLE_BODY_CELL}>
        {section.requiredInputsMissing.length > 0 ? (
          <div style={sourceSectionLabel}>{section.requiredInputsMissing.join('; ')}</div>
        ) : (
          <div style={{ color: EXPERIENCE_COLORS.journeyComplete }}>No required input gaps</div>
        )}
      </td>
    </tr>
  );
}

function StatusChip({ status, children }: { status: SourceRfpReadinessSectionReadiness['status']; children: string }) {
  const style = status === 'ready'
    ? readyChip
    : status === 'partial'
      ? partialChip
      : missingChip;

  return <span style={style}>{children}</span>;
}

function InfoCard({ title, children, tone = 'neutral' }: {
  title: string;
  children: React.ReactNode;
  tone?: 'neutral' | 'blue' | 'amber' | 'teal';
}) {
  return (
    <div style={card(tone)}>
      <div style={sourceSectionLabel}>
        {title}
      </div>
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
  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
  gap: 10,
  alignItems: 'start',
};

const TIER_PANEL: CSSProperties = {
  ...sourceSectionLabel,
  display: 'grid',
  justifyItems: 'end',
  gap: 6,
  minWidth: 170,
};

const LIST: CSSProperties = {
  margin: 0,
  paddingLeft: 18,
  display: 'grid',
  gap: 3,
};

const ARTIFACT_ROW: CSSProperties = {
  display: 'grid',
  gap: 4,
  border: `1px solid ${EXPERIENCE_COLORS.borderSoft}`,
  borderRadius: 8,
  background: EXPERIENCE_COLORS.surfaceWarm,
  padding: '8px 10px',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 420,
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
};

const readyChip: CSSProperties = {
  ...TEXT.small,
  color: EXPERIENCE_COLORS.journeyComplete,
  border: `1px solid ${EXPERIENCE_COLORS.journeyComplete}`,
  borderRadius: 999,
  padding: '2px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const partialChip: CSSProperties = {
  ...TEXT.small,
  color: EXPERIENCE_COLORS.riskAmber,
  border: `1px solid ${EXPERIENCE_COLORS.riskAmber}`,
  borderRadius: 999,
  padding: '2px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const missingChip: CSSProperties = {
  ...TEXT.small,
  color: EXPERIENCE_COLORS.riskRed,
  border: `1px solid ${EXPERIENCE_COLORS.riskRed}`,
  borderRadius: 999,
  padding: '2px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const statusChip = (status: SourceRfpReadinessSectionReadiness['status']) => {
  return status === 'ready' ? readyChip : status === 'partial' ? partialChip : missingChip;
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

function tierBadge(tier: SourceRfpReadiness['overallTier']) {
  const color =
    tier === 'Rich'
      ? EXPERIENCE_COLORS.journeyComplete
      : tier === 'Outline'
        ? EXPERIENCE_COLORS.accentBlue
        : tier === 'Stub'
          ? EXPERIENCE_COLORS.riskAmber
          : tier === 'Waiver Required'
            ? EXPERIENCE_COLORS.riskRed
            : EXPERIENCE_COLORS.riskRed;

  return {
    ...TEXT.small,
    color,
    border: `1px solid ${color}`,
    borderRadius: 999,
    padding: '4px 10px',
    letterSpacing: '0.05em',
    fontWeight: 800,
    textTransform: 'uppercase',
  } as CSSProperties;
}
