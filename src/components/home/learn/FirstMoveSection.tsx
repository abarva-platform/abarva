'use client';

import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  Callout,
  StepList,
  Step,
  TermGrid,
  Term,
} from './primitives';

export function FirstMoveSection() {
  return (
    <>
      <HeroBand color="teal">
        <Eyebrow light>Getting Started</Eyebrow>
        <SectionTitle light size="xl" level={1}>First Move walkthrough</SectionTitle>
        <Lead light>
          Use this path when you want to turn one credible signal into an in-flight Strategic Move without getting lost in every advanced surface.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>Walkthrough · 01</Eyebrow>
        <SectionTitle>From signal to P3 review</SectionTitle>
        <Lead>
          The live CXO demo flow starts with Apex data, confirms the routing opportunity, then opens the Move portfolio so Carlos can review the P3 design work already underway.
        </Lead>

        <StepList>
          <Step title="Open Home and confirm the tenant context" path="/home?client=apexretail">
            Look for Apex Retail Group and the current portfolio signals. This confirms you are reviewing the right tenant before touching Intelligence or Moves.
          </Step>
          <Step title="Scan Intelligence for the contact-center pattern" path="/intelligence">
            Read the pressure card evidence first: affected workflow, evidence sources, estimated value, and confidence. The Move should be grounded in this pattern, not a generic AI idea.
          </Step>
          <Step title="Open Strategic Moves and find Contact Center AI Routing" path="/strategic-moves">
            The demo Move is already in P3 Design. P0 through P2 should read as completed history, while P3 shows the active design gate and next decision.
          </Step>
          <Step title="Review the P3 artifacts with Nexus">
            Ask Nexus what still blocks the design gate, which assumptions are unresolved, and what Carlos should decide before P4 business-case work starts.
          </Step>
        </StepList>
      </Section>

      <Section>
        <Eyebrow>Walkthrough · 02</Eyebrow>
        <SectionTitle>What good looks like</SectionTitle>
        <BodyP>
          A good first Move has a named sponsor, a bounded operational scope, explicit evidence from Intelligence, a P2 Continue/Discontinue decision, and a P3 design question that a CXO can actually answer.
        </BodyP>
        <Callout kind="success" icon="✓" label="Demo-ready posture">
          The strongest walkthrough is not &ldquo;watch the AI create documents.&rdquo; It is &ldquo;review an executive decision already in motion, with evidence and gate discipline visible.&rdquo;
        </Callout>

        <TermGrid>
          <Term name="P3 Design">
            The current-state diagnosis is accepted and the team is shaping the target operating model, solution pattern, and implementation assumptions.
          </Term>
          <Term name="Open gate">
            The phase is active. Nexus can explain which artifacts are ready, which criteria are still blocking, and what decision is needed next.
          </Term>
          <Term name="Continue/Discontinue">
            The P2 verdict that says the opportunity is still worth pursuing before the team spends time on future-state design.
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
