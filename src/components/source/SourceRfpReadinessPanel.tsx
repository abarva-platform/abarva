import type { CSSProperties } from 'react';
import { SHELL } from '@/lib/shell/shell-tokens';
import type { SourceRfpReadiness, SourceRfpReadinessSectionReadiness } from '@/lib/source';

const sourceSectionLabel = {
  fontFamily: SHELL.MONO,
  fontSize: 9,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.14em',
  color: SHELL.INK_MUTED,
  marginBottom: 0,
};

export function SourceRfpReadinessPanel({ readiness }: { readiness: SourceRfpReadiness }) {
  return (
    <section style={PANEL} aria-label="RFP readiness panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'baseline' }}>
        <div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_SOFT }}>RFP readiness</div>
          <h4 style={{ margin: '4px 0 0', color: SHELL.INK }}>Event RFP readiness snapshot</h4>
          <p style={{ margin: '7px 0 0', ...sourceSectionLabel, color: SHELL.INK_MUTED, textTransform: 'none' }}>
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
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Overall tier
          </div>
          <div style={tierBadge(readiness.overallTier)}>{readiness.overallTier}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED }}>{readiness.readinessStatus}</div>
          <div style={{ fontFamily: SHELL.SANS, fontSize: 12, lineHeight: 1.4, color: SHELL.INK_MUTED, marginTop: 4 }}>
            Score {readiness.readinessScore}
          </div>
        </div>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Why this tier applies">
          <div style={{ color: SHELL.INK, fontWeight: 700 }}>{readiness.nexusGuidance}</div>
          <div style={sourceSectionLabel}>
            {readiness.nexusGuidance}
          </div>
        </InfoCard>

        <InfoCard title="Nexus recommendation">
          <div style={{ color: SHELL.INK, fontWeight: 700 }}>{readiness.recommendedNextAction}</div>
        </InfoCard>
      </div>

      <div style={GRID_TWO_COL}>
        <InfoCard title="Missing inputs" tone="amber">
          {readiness.missingInputs.length > 0 ? (
            <ul style={LIST}>
              {readiness.missingInputs.map((item) => (
                <li key={item.category} style={{ marginBottom: 8 }}>
                  <span style={{ fontWeight: 700, color: SHELL.INK }}>{item.category}</span>
                  {' · '}
                  <span style={{ color: SHELL.INK_MUTED }}>{item.impact}</span>
                  {' · '}
                  <span style={{ color: SHELL.RUST_TEXT }}>{item.severity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ fontFamily: SHELL.SANS, fontSize: 13, color: SHELL.INK_MUTED, lineHeight: 1.5 }}>No required missing input rows are present.</div>
          )}
        </InfoCard>

        <InfoCard title="Required artifacts" tone="blue">
          <div style={{ display: 'grid', gap: 8 }}>
            {readiness.requiredArtifacts.map((artifact) => (
              <div key={artifact.name} style={ARTIFACT_ROW}>
                <div style={{ fontWeight: 700, color: SHELL.INK }}>{artifact.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <div style={statusChip(artifact.readiness)}>{artifact.readiness}</div>
                  <div style={{ color: SHELL.INK_MUTED }}>
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
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED }}>
            {readiness.sentinelEvidenceNotes[0] ?? 'Sentinel evidence notes are not yet initialized.'}
          </div>
          <div style={{ ...sourceSectionLabel, color: SHELL.INK_MUTED, marginTop: 8 }}>
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
        <div style={{ fontWeight: 700, color: SHELL.INK }}>{section.title}</div>
      </td>
      <td style={TABLE_BODY_CELL}>
        <StatusChip status={section.status}>{section.status}</StatusChip>
      </td>
      <td style={TABLE_BODY_CELL}>
        {section.requiredInputsMissing.length > 0 ? (
          <div style={sourceSectionLabel}>{section.requiredInputsMissing.join('; ')}</div>
        ) : (
          <div style={{ color: SHELL.MINT_TEXT }}>No required input gaps</div>
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 12,
  background: SHELL.CARD_WHITE,
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
  border: '1px solid ' + SHELL.CARD_LINE,
  borderRadius: 8,
  background: SHELL.PAPER_SOFT,
  padding: '8px 10px',
};

const TABLE: CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  minWidth: 420,
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
};

const readyChip: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.MINT_TEXT,
  border: '1px solid ' + SHELL.MINT_TEXT,
  borderRadius: 999,
  padding: '2px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const partialChip: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.PEACH_TEXT,
  border: '1px solid ' + SHELL.PEACH_TEXT,
  borderRadius: 999,
  padding: '2px 8px',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
};

const missingChip: CSSProperties = {
  fontFamily: SHELL.SANS,
  fontSize: 12,
  lineHeight: 1.4,
  color: SHELL.RUST_TEXT,
  border: '1px solid ' + SHELL.RUST_TEXT,
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

function tierBadge(tier: SourceRfpReadiness['overallTier']) {
  const color =
    tier === 'Rich'
      ? SHELL.MINT_TEXT
      : tier === 'Outline'
        ? SHELL.INK_MID
        : tier === 'Stub'
          ? SHELL.PEACH_TEXT
          : tier === 'Waiver Required'
            ? SHELL.RUST_TEXT
            : SHELL.RUST_TEXT;

  return {
    fontFamily: SHELL.SANS,
    fontSize: 12,
    lineHeight: 1.4,
    color,
    border: '1px solid ' + color,
    borderRadius: 999,
    padding: '4px 10px',
    letterSpacing: '0.05em',
    fontWeight: 800,
    textTransform: 'uppercase',
  } as CSSProperties;
}
