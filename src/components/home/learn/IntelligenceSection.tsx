'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP,
  Callout, StepList, Step, TermGrid, Term, IntelCard, PressureCardMock, T,
} from './primitives';

export function IntelligenceSection() {
  return (
    <>
      {/* Band */}
      <HeroBand color="purple">
        <Eyebrow light>Intelligence</Eyebrow>
        <SectionTitle light size="xl">The art of the possible.</SectionTitle>
        <Lead light>
          Intelligence is the most powerful surface for strategic discovery. It continuously analyzes your connected data to surface patterns, risks, and opportunities you might not have seen — and turns them into Move hypotheses with one click.
        </Lead>
      </HeroBand>

      {/* Signals */}
      <Section>
        <Eyebrow>Intelligence · Signals</Eyebrow>
        <SectionTitle>Reading signals & pressure cards</SectionTitle>
        <Lead>
          Signals are AI-detected patterns in your operational data. They appear as <strong>pressure cards</strong> — structured observations with severity, evidence, and a recommended action.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 28,
          }}
        >
          <IntelCard
            icon="📉"
            name="Cost pressure signal"
            desc="A sustained cost trend that deviates from plan — e.g. per-transaction costs rising 12% quarter-over-quarter with no corresponding revenue lift."
          />
          <IntelCard
            icon="⚠️"
            name="Risk concentration signal"
            desc="Over-reliance on a single vendor, technology, or process — e.g. 73% of a workflow depending on a contract ending in Q3."
          />
          <IntelCard
            icon="🚀"
            name="Opportunity signal"
            desc="A gap where AI capability could create significant value — e.g. a manual classification task consuming 2,400 hours/month that ML could automate at 96% accuracy."
          />
        </div>

        <BodyP>
          Each pressure card shows you: what the signal is, the data evidence behind it, which business unit it affects, the magnitude of impact, and a recommended action — usually "Originate a Move."
        </BodyP>

        {/* Live pressure card mockup */}
        <PressureCardMock />

        <Callout kind="success" icon="✓" label="Pressure cards pre-fill Moves">
          When you click "Originate a Move" from a pressure card, Nexus pre-populates the bet/outcome, value hypothesis, and evidence family fields from the card's data. You start P0 already 60% complete instead of from scratch.
        </Callout>
      </Section>

      {/* Pattern → Move */}
      <Section>
        <Eyebrow>Intelligence · Pattern → Move</Eyebrow>
        <SectionTitle>From pattern to Move</SectionTitle>
        <Lead>
          The most powerful workflow in AbarVa. Intelligence detects a pattern → you validate it → one click sends it to Strategic Moves as a pre-loaded origination.
        </Lead>

        <StepList>
          <Step title="Browse Intelligence signals for your business units" path="/intelligence → Pressure Cards → filter by severity">
            Filter by business unit, archetype, or severity. High-severity patterns with strong evidence backing are the best candidates for immediate Moves.
          </Step>
          <Step title="Open a pressure card and read the evidence">
            Check the evidence sources. Are they recent? Is the data from connected systems you trust? The stronger the evidence, the more defensible the business case in P4 will be.
          </Step>
          <Step title="Ask Sentinel to go deeper">
            Use the chat to ask <strong>"What's driving the 18% AHT increase?"</strong> or <strong>"Which teams are most affected?"</strong> Sentinel can drill further into the substrate before you decide to act.
          </Step>
          <Step title='Click "→ Originate a Move" to promote the signal' path="Pressure card → Originate a Move → /strategic-moves/new">
            This opens the P0 origination screen with the pressure card data pre-loaded into the scaffold. You confirm the fields, name the Move, and promote it to P1.
          </Step>
        </StepList>
      </Section>

      {/* Key terms */}
      <Section>
        <Eyebrow>Intelligence · Key Terms</Eyebrow>
        <SectionTitle>Key terms in Intelligence</SectionTitle>
        <TermGrid>
          <Term name="Signal">
            An AI-detected pattern in operational or financial data. Signals are surfaced automatically from connected data sources. <em>You don't need to ask for them — they appear when the substrate finds something worth noting.</em>
          </Term>
          <Term name="Pressure card">
            The structured presentation of a signal. Includes type, severity, evidence, impact estimate, and recommended action. <em>Think of it as an AI-authored executive brief on a specific problem.</em>
          </Term>
          <Term name="Archetype">
            The category of a signal or Move — Cost Reduction, Revenue Growth, Risk Mitigation, or Operational Excellence. <em>Nexus uses archetype to choose which deliverable templates and gate criteria to apply.</em>
          </Term>
          <Term name="Sentinel">
            The front agent for Intelligence and Source. Answers questions about signals, drills into evidence, and coordinates specialist functions for deep analysis. <em>You talk to Sentinel — it orchestrates everything behind the scenes.</em>
          </Term>
          <Term name="Provenance">
            The data lineage behind a signal — which connector, which dataset, which time period. <em>High-provenance signals have strong, recent, specific evidence. Low-provenance signals are more uncertain.</em>
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
