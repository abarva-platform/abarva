'use client';
import { Section, Eyebrow, SectionTitle, Lead, SubHead, TermGrid, Term, TipGrid, Tip } from './primitives';

export function GlossarySection() {
  return (
    <>
      {/* Tips */}
      <Section>
        <Eyebrow>Reference</Eyebrow>
        <SectionTitle>Tips & common mistakes</SectionTitle>
        <Lead>The most common mistakes new users make — and what to do instead.</Lead>

        <SubHead>Setup</SubHead>
        <TipGrid>
          <Tip
            kind="do"
            text="Connect at least one operational data source before exploring Intelligence."
            example="Without a connector, Intelligence produces generic industry patterns, not signals specific to your operations."
          />
          <Tip
            kind="dont"
            text={"Skip the tenant profile because \"it's just metadata.\""}
            example="Named executives in the tenant profile flow directly into Move stakeholder maps and charter documents — skipping it produces thin output."
          />
        </TipGrid>

        <SubHead>Intelligence</SubHead>
        <TipGrid>
          <Tip
            kind="do"
            text="Ask Sentinel to go deeper before originating a Move from a pressure card."
            example={"\"Sentinel, what's driving the 18% AHT increase?\" before clicking \"Originate\" gives you better scaffold content."}
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
            text="Talk to Nexus like a colleague, not a form."
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
            example="Document content is assembled at generation time. If you've had three sessions of Nexus inputs since last generating, regenerate before sharing."
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
        <Lead>Key terms used across AbarVa, in alphabetical order.</Lead>
        <TermGrid>
          <Term name="Archetype">The category of a Move: Cost Reduction, Revenue Growth, Risk Mitigation, or Operational Excellence. Drives template selection and gate criteria.</Term>
          <Term name="Atlas">The Control Tower agent. Monitors portfolio health, execution KPIs, and surfaces execution-phase pressure cards.</Term>
          <Term name="Connector">An integration between AbarVa and an external data system that populates the intelligence substrate.</Term>
          <Term name="Evidence Hub">The per-Move document store. Contains all generated deliverables, uploaded files, and version history organized by phase.</Term>
          <Term name="Foundation readiness">An assessment of how complete and current your substrate is for a given initiative. Low readiness → higher risk of thin documents.</Term>
          <Term name="Gate artifact">A deliverable required for a phase gate to clear. Blue left border in the Evidence Hub. Must be signed off.</Term>
          <Term name="Hard criterion">A blocking gate requirement. Gate stays locked until satisfied.</Term>
          <Term name="Nexus">The Strategic Moves front agent. Guides origination, populates scaffold fields, assists in each phase, and orchestrates specialist agents invisibly.</Term>
          <Term name="P0 / Originate">The pre-phase where a Move is created. Seven scaffold fields filled through Nexus chat.</Term>
          <Term name="Pressure card">The structured presentation of an Intelligence signal — type, severity, evidence, impact estimate, and recommended action.</Term>
          <Term name="Provenance">The data lineage behind a signal — which connector, dataset, and time period the evidence comes from.</Term>
          <Term name="Scaffold">The seven-field structure Nexus fills during P0 origination. Seeds all downstream documents and gate criteria.</Term>
          <Term name="Sentinel">The Intelligence and Source front agent. Analyzes patterns, drills into evidence, and coordinates specialist analysis.</Term>
          <Term name="Signal">An AI-detected pattern in operational or financial data, surfaced automatically by the intelligence substrate.</Term>
          <Term name="Soft criterion">An advisory gate requirement. Gate can clear even if open, but shows as a warning in audit trail.</Term>
          <Term name="Substrate">The combined data layer all agents query: connector data, document embeddings, and tenant context.</Term>
          <Term name="Tenant">Your organization&rsquo;s isolated AbarVa instance. All data, agents, and Moves are scoped to your tenant.</Term>
        </TermGrid>
      </Section>
    </>
  );
}
