'use client';
import { Section, Eyebrow, SectionTitle, Lead, Callout, TermGrid, Term } from './primitives';

export function TowerSection() {
  return (
    <>
      <Section>
        <Eyebrow>Control Tower</Eyebrow>
        <SectionTitle>After a Move completes</SectionTitle>
        <Lead>
          When a Move gates out of P5, it transitions automatically to Control Tower. Atlas — the Tower agent — takes over and starts tracking execution health using the metrics you defined in P4.
        </Lead>
        <Callout kind="success" icon="📡" label="What Tower does with your Move">
          Atlas reads the P4 Tower Metrics Plan and begins monitoring the KPIs you defined. If a metric starts deviating from the plan, it surfaces a new pressure card in Intelligence — the cycle closes. A successful Move generates execution evidence that feeds future Moves.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Control Tower</Eyebrow>
        <SectionTitle>Reading the portfolio</SectionTitle>
        <Lead>
          Control Tower shows all active Moves as a portfolio — phase health, gate status, signal pressure, and vendor/system dependencies in a single view.
        </Lead>
        <TermGrid>
          <Term name="Portfolio heatmap">
            A grid of all active Moves showing phase, gate status, and pressure level. <em>Red = blocked or high-pressure. Amber = advisory issues. Green = on track.</em>
          </Term>
          <Term name="Pressure card (Tower)">
            A signal generated during execution — e.g. a KPI that missed target, a vendor dependency flagged, or a timeline slip. <em>These are fed back into Intelligence and may spawn new Moves.</em>
          </Term>
          <Term name="Atlas">
            The Tower agent. Answers questions about portfolio status, execution risk, and signal health. <em>"Atlas, which Move is at highest risk of missing P4 this quarter?"</em>
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
