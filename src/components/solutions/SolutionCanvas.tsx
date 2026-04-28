// SOL11 · Solution Canvas UI (Server Component).
//
// Renders a deterministic Solution Canvas view-model in the calm AbarVa
// canon. Server-only file — no client directive, no React hooks, no
// local hex literals, no font literals — every visual token resolves
// through @/lib/design/abarva-theme. Future actions (Edit, Regenerate,
// Approve) are surfaced as visibly disabled affordances so the surface
// reads as proposed only, not applied.

import type { CSSProperties } from 'react';
import {
  BORDER,
  COLORS,
  FONT,
  RADIUS,
  SPACING,
  TYPE,
} from '@/lib/design/abarva-theme';
import type {
  SolutionCanvasView,
  SolutionCanvasRisk,
} from '@/lib/solutions/solution-canvas-view';

interface SolutionCanvasProps {
  readonly view: SolutionCanvasView;
}

const RISK_LABEL: Record<SolutionCanvasRisk['level'], string> = {
  low: 'low',
  medium: 'medium',
  high: 'high',
};

const containerStyle: CSSProperties = {
  background: COLORS.card,
  border: BORDER.hairline,
  borderRadius: RADIUS.md,
  padding: SPACING.xxl,
  display: 'grid',
  gap: SPACING.lg,
  fontFamily: FONT.body,
  color: COLORS.ink,
};

const eyebrowStyle: CSSProperties = {
  ...TYPE.eyebrow,
  color: COLORS.navy,
};

const titleStyle: CSSProperties = {
  ...TYPE.h2,
  margin: 0,
};

const sectionTitleStyle: CSSProperties = {
  ...TYPE.h3,
  margin: 0,
  marginBottom: SPACING.xs,
};

const paragraphStyle: CSSProperties = {
  ...TYPE.body,
  margin: 0,
};

const captionStyle: CSSProperties = {
  ...TYPE.caption,
  margin: 0,
};

const listStyle: CSSProperties = {
  margin: 0,
  paddingLeft: SPACING.lg,
  display: 'grid',
  gap: SPACING.xs,
  ...TYPE.body,
};

const gridStyle: CSSProperties = {
  display: 'grid',
  gap: SPACING.xl,
};

const archetypeChipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: `${SPACING.xs}px ${SPACING.md}px`,
  borderRadius: RADIUS.pill,
  background: COLORS.navySoft,
  color: COLORS.navy,
  fontFamily: FONT.mono,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
};

const componentRowStyle: CSSProperties = {
  display: 'grid',
  gap: SPACING.xs,
  padding: `${SPACING.sm}px 0`,
  borderTop: BORDER.hairlineSoft,
};

const riskRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: SPACING.md,
  padding: `${SPACING.sm}px 0`,
  borderTop: BORDER.hairlineSoft,
};

const riskLevelStyle: CSSProperties = {
  fontFamily: FONT.mono,
  fontSize: 11,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: COLORS.muted,
};

const missingDividerStyle: CSSProperties = {
  borderTop: BORDER.hairline,
  margin: 0,
  marginTop: SPACING.sm,
  marginBottom: SPACING.sm,
};

const footerStyle: CSSProperties = {
  ...TYPE.caption,
  margin: 0,
  paddingTop: SPACING.md,
  borderTop: BORDER.hairlineSoft,
};

const actionsRowStyle: CSSProperties = {
  display: 'flex',
  gap: SPACING.sm,
  flexWrap: 'wrap',
};

const disabledActionStyle: CSSProperties = {
  fontFamily: FONT.body,
  fontSize: 12,
  padding: `${SPACING.xs}px ${SPACING.md}px`,
  borderRadius: RADIUS.sm,
  border: BORDER.hairline,
  background: COLORS.surface2,
  color: COLORS.mutedSoft,
  letterSpacing: '0.02em',
};

export default function SolutionCanvas({ view }: SolutionCanvasProps) {
  return (
    <article style={containerStyle}>
      <header style={{ display: 'grid', gap: SPACING.xs }}>
        <span style={eyebrowStyle}>SOLUTION CANVAS · SOL11</span>
        <h2 style={titleStyle}>{view.title}</h2>
      </header>

      <div style={gridStyle}>
        <section>
          <h3 style={sectionTitleStyle}>Brief</h3>
          <p style={paragraphStyle}>{view.brief}</p>
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Current Inputs</h3>
          {view.currentInputs.length > 0 ? (
            <ul style={listStyle}>
              {view.currentInputs.map((input, idx) => (
                <li key={`input-${idx}`}>{input}</li>
              ))}
            </ul>
          ) : (
            <p style={captionStyle}>No current inputs captured yet.</p>
          )}
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Archetype</h3>
          {view.archetype ? (
            <span style={archetypeChipStyle}>{view.archetype}</span>
          ) : (
            <p style={captionStyle}>Archetype not yet assigned.</p>
          )}
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Components</h3>
          {view.components.length > 0 ? (
            <div>
              {view.components.map((component) => (
                <div key={component.key} style={componentRowStyle}>
                  <strong style={TYPE.body}>{component.name}</strong>
                  <span style={captionStyle}>{component.role}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={captionStyle}>No components proposed yet.</p>
          )}
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Build / Buy Guidance</h3>
          <p style={paragraphStyle}>{view.buildBuyGuidance}</p>
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Risks</h3>
          {view.risks.length > 0 ? (
            <div>
              {view.risks.map((risk) => (
                <div key={risk.key} style={riskRowStyle}>
                  <span style={TYPE.body}>{risk.label}</span>
                  <span style={riskLevelStyle}>{RISK_LABEL[risk.level]}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={captionStyle}>No risks identified yet.</p>
          )}
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Recommended Workshops</h3>
          {view.recommendedWorkshops.length > 0 ? (
            <ul style={listStyle}>
              {view.recommendedWorkshops.map((workshop) => (
                <li key={workshop.key}>
                  <strong>{workshop.name}</strong>
                  <span style={captionStyle}> — {workshop.why}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p style={captionStyle}>No workshops recommended yet.</p>
          )}
        </section>

        <section>
          <h3 style={sectionTitleStyle}>Recommended Deliverables</h3>
          {view.recommendedDeliverables.length > 0 ? (
            <ul style={listStyle}>
              {view.recommendedDeliverables.map((deliverable) => (
                <li key={deliverable.key}>{deliverable.name}</li>
              ))}
            </ul>
          ) : (
            <p style={captionStyle}>No deliverables recommended yet.</p>
          )}
        </section>

        <section>
          <hr style={missingDividerStyle} />
          <h3 style={sectionTitleStyle}>Missing Inputs</h3>
          {view.missingInputs.length > 0 ? (
            <ul style={listStyle}>
              {view.missingInputs.map((missing) => (
                <li key={missing.key}>{missing.label}</li>
              ))}
            </ul>
          ) : (
            <p style={captionStyle}>All inputs captured.</p>
          )}
        </section>
      </div>

      <div style={actionsRowStyle}>
        <span style={disabledActionStyle}>Edit · future · not yet wired</span>
        <span style={disabledActionStyle}>
          Regenerate · future · not yet wired
        </span>
        <span style={disabledActionStyle}>
          Approve · future · not yet wired
        </span>
      </div>

      <p style={footerStyle}>
        Source · deterministic solution canvas seed · proposed only, not
        applied
      </p>
    </article>
  );
}
