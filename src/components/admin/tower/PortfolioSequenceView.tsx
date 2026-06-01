import type { PortfolioSequenceViewModel } from '@/lib/tower/portfolio-sequence-view';
import type * as React from 'react';

const COLORS = {
  ink: '#111827',
  muted: '#5f6673',
  line: '#ded8ca',
  panel: '#fffdf8',
  cream: '#f8f7f4',
  green: '#13795b',
  amber: '#a15c08',
  red: '#9f1d1d',
  blue: '#1b2b5c',
} as const;

export function PortfolioSequenceView({ model }: { model: PortfolioSequenceViewModel }) {
  if (model.dataBasis === 'empty' || model.quarters.length === 0) {
    return (
      <section data-testid="portfolio-sequence-view" aria-label="Portfolio sequencing" style={panelStyle}>
        <div style={eyebrowStyle}>Portfolio sequencing</div>
        <h2 style={titleStyle}>No sequence is available for {model.clientName} yet.</h2>
        <p style={bodyStyle}>{model.disclosure}</p>
      </section>
    );
  }

  return (
    <section data-testid="portfolio-sequence-view" aria-label="Portfolio sequencing" style={panelStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'start', flexWrap: 'wrap' }}>
        <div>
          <div style={eyebrowStyle}>Portfolio sequencing · {model.clientName}</div>
          <h2 style={titleStyle}>What to run next, and what not to run together.</h2>
          <p style={bodyStyle}>{model.disclosure}</p>
        </div>
        <div style={basisStyle}>{model.dataBasis === 'program-instance-substrate' ? 'Program substrate' : 'Planning fixture'}</div>
      </div>

      <div style={summaryGridStyle}>
        <SummaryTile label="scheduled moves" value={String(model.scheduledMoves)} />
        <SummaryTile label="blocked moves" value={String(model.blockedMoves)} tone={model.blockedMoves > 0 ? 'watch' : 'ok'} />
        <SummaryTile label="overlap findings" value={String(model.overlapFindings)} tone={model.overlapFindings > 0 ? 'tight' : 'ok'} />
        <SummaryTile label="sequence value" value={model.sequenceValueLabel} />
      </div>

      <div style={quartersGridStyle}>
        {model.quarters.map((quarter) => (
          <article key={quarter.quarterId} style={quarterStyle} data-testid={`portfolio-sequence-quarter-${quarter.quarterId}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline' }}>
              <h3 style={quarterTitleStyle}>{quarter.quarterId}</h3>
              <span style={quarterValueStyle}>{quarter.totalValueLabel}</span>
            </div>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {quarter.moves.length > 0 ? quarter.moves.map((move) => (
                <div key={move.id} style={moveCardStyle}>
                  <div style={moveNameStyle}>{move.name}</div>
                  <div style={moveMetaStyle}>{move.phase}</div>
                  <p style={moveReasonStyle}>{move.reasoning}</p>
                </div>
              )) : (
                <div style={emptyQuarterStyle}>Hold capacity for dependency cleanup.</div>
              )}
            </div>
            {quarter.resourceUtilization.length > 0 ? (
              <div style={{ display: 'grid', gap: 7, marginTop: 14 }}>
                {quarter.resourceUtilization.map((resource) => (
                  <ResourceBar key={resource.id} label={resource.label} percent={resource.percent} tone={resource.tone} />
                ))}
              </div>
            ) : null}
            {quarter.blockedMoves.length > 0 ? (
              <div style={blockedBoxStyle}>
                {quarter.blockedMoves.slice(0, 2).map((blocked) => (
                  <div key={blocked.id} style={{ marginTop: 8 }}>
                    <div style={blockedNameStyle}>{blocked.name}</div>
                    <div style={blockedTextStyle}>
                      Blocked by {blocked.blockedBy.join(', ')}. {blocked.recommendedAction}
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </article>
        ))}
      </div>

      <div style={lowerGridStyle}>
        <div>
          <div style={sectionLabelStyle}>Value overlaps to clean up</div>
          {model.overlaps.length > 0 ? (
            <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
              {model.overlaps.slice(0, 3).map((overlap) => (
                <div key={overlap.id} style={overlapStyle}>
                  <div style={overlapTitleStyle}>{overlap.moveA} + {overlap.moveB}</div>
                  <div style={overlapMetaStyle}>
                    {overlap.overlapKpi} · {overlap.overlapMagnitudeLabel} · {overlap.recommendation}
                  </div>
                  <p style={overlapBodyStyle}>{overlap.rationale}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={bodyStyle}>No value-overlap finding is strong enough to require a sequence change.</p>
          )}
        </div>
        <div>
          <div style={sectionLabelStyle}>Alternative executive plays</div>
          <div style={{ display: 'grid', gap: 9, marginTop: 10 }}>
            {model.alternatives.map((alternative) => (
              <div key={alternative.scenario} style={alternativeStyle}>
                <div style={alternativeTitleStyle}>{alternative.scenario}</div>
                <div style={alternativeBodyStyle}>{alternative.tradeoff}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SummaryTile({ label, value, tone = 'ok' }: { label: string; value: string; tone?: 'ok' | 'watch' | 'tight' }) {
  const color = tone === 'tight' ? COLORS.red : tone === 'watch' ? COLORS.amber : COLORS.ink;
  return (
    <div style={summaryTileStyle}>
      <div style={summaryLabelStyle}>{label}</div>
      <div style={{ ...summaryValueStyle, color }}>{value}</div>
    </div>
  );
}

function ResourceBar({ label, percent, tone }: { label: string; percent: number; tone: 'ok' | 'watch' | 'tight' }) {
  const color = tone === 'tight' ? COLORS.red : tone === 'watch' ? COLORS.amber : COLORS.green;
  return (
    <div>
      <div style={resourceLineStyle}>
        <span>{label}</span>
        <span>{percent}%</span>
      </div>
      <div style={resourceTrackStyle}>
        <div style={{ height: '100%', width: `${Math.max(4, Math.min(100, percent))}%`, background: color, borderRadius: 999 }} />
      </div>
    </div>
  );
}

const panelStyle = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: 10,
  background: COLORS.panel,
  padding: '18px 20px',
  margin: '18px 32px 22px',
  boxShadow: '0 14px 34px rgba(15, 23, 42, 0.06)',
} satisfies React.CSSProperties;

const eyebrowStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: COLORS.blue,
  fontWeight: 800,
} satisfies React.CSSProperties;

const titleStyle = {
  margin: '7px 0 0',
  fontFamily: 'var(--font-fraunces), Georgia, serif',
  fontSize: 26,
  lineHeight: 1.08,
  color: COLORS.ink,
} satisfies React.CSSProperties;

const bodyStyle = {
  margin: '8px 0 0',
  color: COLORS.muted,
  fontSize: 13,
  lineHeight: 1.45,
  maxWidth: 820,
} satisfies React.CSSProperties;

const basisStyle = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: 6,
  padding: '8px 10px',
  background: '#ffffff',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: COLORS.muted,
  fontWeight: 800,
} satisfies React.CSSProperties;

const summaryGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 9,
  marginTop: 15,
} satisfies React.CSSProperties;

const summaryTileStyle = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: 8,
  background: '#ffffff',
  padding: '10px 11px',
} satisfies React.CSSProperties;

const summaryLabelStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 9,
  letterSpacing: '0.12em',
  textTransform: 'uppercase',
  color: COLORS.muted,
  fontWeight: 700,
} satisfies React.CSSProperties;

const summaryValueStyle = {
  marginTop: 4,
  fontSize: 20,
  fontWeight: 820,
} satisfies React.CSSProperties;

const quartersGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
  gap: 10,
  marginTop: 14,
} satisfies React.CSSProperties;

const quarterStyle = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: 8,
  background: COLORS.cream,
  padding: 12,
  minWidth: 0,
} satisfies React.CSSProperties;

const quarterTitleStyle = {
  margin: 0,
  fontSize: 16,
  color: COLORS.ink,
} satisfies React.CSSProperties;

const quarterValueStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 11,
  color: COLORS.green,
  fontWeight: 800,
} satisfies React.CSSProperties;

const moveCardStyle = {
  border: '1px solid rgba(17,24,39,0.10)',
  borderRadius: 7,
  background: '#ffffff',
  padding: '9px 10px',
} satisfies React.CSSProperties;

const moveNameStyle = {
  fontSize: 13,
  color: COLORS.ink,
  fontWeight: 800,
  lineHeight: 1.25,
} satisfies React.CSSProperties;

const moveMetaStyle = {
  marginTop: 3,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 9,
  letterSpacing: '0.10em',
  textTransform: 'uppercase',
  color: COLORS.muted,
} satisfies React.CSSProperties;

const moveReasonStyle = {
  margin: '6px 0 0',
  color: COLORS.muted,
  fontSize: 11.5,
  lineHeight: 1.38,
} satisfies React.CSSProperties;

const emptyQuarterStyle = {
  border: '1px dashed rgba(17,24,39,0.18)',
  borderRadius: 7,
  padding: '12px 10px',
  color: COLORS.muted,
  fontSize: 12,
  lineHeight: 1.4,
} satisfies React.CSSProperties;

const resourceLineStyle = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 8,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 9,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: COLORS.muted,
  fontWeight: 700,
} satisfies React.CSSProperties;

const resourceTrackStyle = {
  height: 7,
  borderRadius: 999,
  background: 'rgba(17,24,39,0.09)',
  overflow: 'hidden',
  marginTop: 4,
} satisfies React.CSSProperties;

const blockedBoxStyle = {
  border: '1px solid rgba(161,92,8,0.26)',
  borderRadius: 7,
  background: '#fff7e8',
  padding: '2px 10px 10px',
  marginTop: 12,
} satisfies React.CSSProperties;

const blockedNameStyle = {
  fontSize: 12,
  fontWeight: 800,
  color: COLORS.amber,
} satisfies React.CSSProperties;

const blockedTextStyle = {
  marginTop: 3,
  fontSize: 11,
  color: '#6f4a1d',
  lineHeight: 1.35,
} satisfies React.CSSProperties;

const lowerGridStyle = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1.1fr) minmax(280px, 0.9fr)',
  gap: 14,
  marginTop: 14,
} satisfies React.CSSProperties;

const sectionLabelStyle = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 10,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  color: COLORS.blue,
  fontWeight: 800,
} satisfies React.CSSProperties;

const overlapStyle = {
  border: '1px solid rgba(159,29,29,0.20)',
  borderRadius: 8,
  background: '#fffafa',
  padding: '10px 11px',
} satisfies React.CSSProperties;

const overlapTitleStyle = {
  fontSize: 13,
  fontWeight: 820,
  color: COLORS.ink,
  lineHeight: 1.25,
} satisfies React.CSSProperties;

const overlapMetaStyle = {
  marginTop: 4,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: 9.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: COLORS.red,
  fontWeight: 800,
} satisfies React.CSSProperties;

const overlapBodyStyle = {
  margin: '6px 0 0',
  color: COLORS.muted,
  fontSize: 12,
  lineHeight: 1.38,
} satisfies React.CSSProperties;

const alternativeStyle = {
  border: `1px solid ${COLORS.line}`,
  borderRadius: 8,
  background: '#ffffff',
  padding: '10px 11px',
} satisfies React.CSSProperties;

const alternativeTitleStyle = {
  fontSize: 13,
  fontWeight: 820,
  color: COLORS.ink,
} satisfies React.CSSProperties;

const alternativeBodyStyle = {
  marginTop: 4,
  color: COLORS.muted,
  fontSize: 12,
  lineHeight: 1.38,
} satisfies React.CSSProperties;
