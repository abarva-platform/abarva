'use client';
import { Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Flow, FlowStep } from './primitives';

export function MovesOverviewSection() {
  return (
    <>
      <HeroBand color="teal">
        <Eyebrow light>Strategic Moves</Eyebrow>
        <SectionTitle light size="xl">What is a Strategic Move?</SectionTitle>
        <Lead light>
          A Strategic Move is a phase-gated transformation program — a structured, evidence-backed way to take any AI or operational initiative from a one-line hypothesis to a handed-off delivery with full documentation and governance.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>Overview</Eyebrow>
        <SectionTitle>Six phases, one continuous thread</SectionTitle>
        <Lead>
          Every Move travels the same path — P0 to P5. Each phase ends with a gate. Gates ensure genuine outputs before committing more investment.
        </Lead>

        <Flow>
          <FlowStep badge="P0" badgeColor="slate" icon="✏️" label="Originate" desc="7-field scaffold via Nexus chat" />
          <FlowStep badge="P1" badgeColor="navy" icon="📋" label="Charter" desc="Scope, governance, stakeholders" />
          <FlowStep badge="P2" badgeColor="navy" icon="🔍" label="Discover" desc="As-is, root cause, diagnosis" />
          <FlowStep badge="P3" badgeColor="navy" icon="🎯" label="Design" desc="Target state + solution" />
          <FlowStep badge="P4" badgeColor="navy" icon="📊" label="Roadmap" desc="Execution plan + biz case" />
          <FlowStep badge="P5" badgeColor="teal" icon="🚀" label="Mobilize" desc="Handoff → Tower" />
        </Flow>

        <BodyP>
          Use the left nav to navigate to each phase. Each section covers the phase goal, a Nexus chat example, deliverables, and gate criteria. Start at P0 — Originate — if this is your first Move.
        </BodyP>
      </Section>
    </>
  );
}
