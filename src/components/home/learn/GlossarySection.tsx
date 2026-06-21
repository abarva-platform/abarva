'use client';
import { Section, Eyebrow, SectionTitle, Lead, SubHead, TermGrid, Term, TipGrid, Tip, InlineAbarvaLogo } from './primitives';

export function GlossarySection() {
  return (
    <>
      {/* Tips */}
      <Section>
        <Eyebrow>Reference</Eyebrow>
        <SectionTitle level={1}>Tips & common mistakes</SectionTitle>
        <Lead>The most common mistakes new users make — and what to do instead.</Lead>

        <SubHead>Admin workspace</SubHead>
        <TipGrid>
          <Tip
            kind="do"
            text="Confirm at least one approved operational data source before exploring Intelligence."
            example="Without an approved Admin connector or verified document extract, Intelligence produces generic industry patterns, not signals specific to your operations."
          />
          <Tip
            kind="dont"
            text={"Skip the tenant profile because \"it's just metadata.\""}
            example="Named executives in the tenant profile flow directly into Move stakeholder maps and charter documents, so incomplete Admin context produces thin output."
          />
        </TipGrid>

        <SubHead>Intelligence</SubHead>
        <TipGrid>
          <Tip
            kind="do"
            text="Ask Ava to go deeper before originating a Move from a pressure card."
            example={"\"Ava, what's driving the 18% AHT increase?\" before clicking \"Originate\" gives you better scaffold content."}
          />
          <Tip
            kind="dont"
            text="Dismiss low-severity signals without reading them."
            example="Low-severity doesn't mean low-impact — it may just mean the evidence is early. Some of the highest-value Moves start as amber signals."
          />
        </TipGrid>

        <SubHead>Strategic Moves</SubHead>
        <TipGrid>
          <Tip
            kind="do"
            text="Talk to Ava like a colleague, not a form."
            example={"\"We're cutting AHT by 30%, COO sponsors it, scope is just the routing layer\" — fills three fields in one message."}
          />
          <Tip
            kind="dont"
            text="Leave a Move in P1 or P2 for 30+ days with no gate activity."
            example="Stale Moves surface in Control Tower as portfolio risk signals. Use the P2 Continue/Discontinue decision if the Move needs to be paused."
          />
          <Tip
            kind="do"
            text="Regenerate deliverables after significant chat updates."
            example="Document content is assembled at generation time. If you've had three sessions of work with Ava since last generating, regenerate before sharing."
          />
          <Tip
            kind="dont"
            text="Assume a vague scope is understood by everyone."
            example="Scope disputes are the #1 cause of program failure. Document it explicitly in field 4 during origination, even if it feels obvious."
          />
        </TipGrid>
      </Section>

      {/* Glossary */}
      <Section>
        <Eyebrow>Reference</Eyebrow>
        <SectionTitle>Glossary</SectionTitle>
        <Lead>Key terms used across <InlineAbarvaLogo />, in alphabetical order.</Lead>
        <TermGrid>
          <Term name="Archetype">The category of a Move: Cost Reduction, Revenue Growth, Risk Mitigation, or Operational Excellence. Drives template selection and gate criteria.</Term>
          <Term name="Ava">The single assistant you talk to across every <InlineAbarvaLogo /> surface — Home, Intelligence, Moves, Source, Tower, and Setup. You never switch agents; Ava stays with you and adapts to what you&rsquo;re doing, drawing on a faculty of named specialist capabilities behind the scenes. Earlier docs may name Sentinel, Nexus, Atlas, or Steward — those are now internal specialties Ava calls on, not separate agents you converse with.</Term>
          <Term name="Atlas (specialty)">The portfolio-monitoring specialty Ava draws on in Control Tower — watching portfolio health, execution KPIs, and surfacing execution-phase pressure cards. Not a separate agent; part of Ava.</Term>
          <Term name="Connector">An integration between <InlineAbarvaLogo /> and an external data system that populates the intelligence substrate.</Term>
          <Term name="Evidence Hub">The per-Move document store. Contains all generated deliverables, uploaded files, and version history organized by phase.</Term>
          <Term name="Foundation readiness">An assessment of how complete and current your substrate is for a given initiative. Low readiness → higher risk of thin documents.</Term>
          <Term name="Gate artifact">A deliverable required for a phase gate to clear. Blue left border in the Evidence Hub. Must be signed off.</Term>
          <Term name="Hard criterion">A blocking gate requirement. Gate stays locked until satisfied.</Term>
          <Term name="Nexus (specialty)">The Strategic Moves authoring specialty Ava draws on — guiding origination, populating scaffold fields, and assisting in each phase. Not a separate agent; when you work a Move, you&rsquo;re talking to Ava.</Term>
          <Term name="P0 / Originate">The pre-phase where a Move is created. Seven scaffold fields filled through chat with Ava.</Term>
          <Term name="Pressure card">The structured presentation of an Intelligence signal — type, severity, evidence, impact estimate, and recommended action.</Term>
          <Term name="Provenance">The data lineage behind a signal — which connector, dataset, and time period the evidence comes from.</Term>
          <Term name="Scaffold">The seven-field structure Ava fills during P0 origination. Seeds all downstream documents and gate criteria.</Term>
          <Term name="Sentinel (specialty)">The Intelligence and Source analysis specialty Ava draws on — analyzing patterns, drilling into evidence, and coordinating specialist analysis. Not a separate agent; on Intelligence and Source you&rsquo;re talking to Ava.</Term>
          <Term name="Signal">An AI-detected pattern in operational or financial data, surfaced automatically by the intelligence substrate.</Term>
          <Term name="Soft criterion">An advisory gate requirement. Gate can clear even if open, but shows as a warning in audit trail.</Term>
          <Term name="Substrate">The combined data layer Ava queries: connector data, document embeddings, and tenant context.</Term>
          <Term name="Tenant">Your organization&rsquo;s isolated <InlineAbarvaLogo /> instance. All data, Ava&rsquo;s context, and Moves are scoped to your tenant.</Term>
        </TermGrid>
      </Section>
    </>
  );
}
