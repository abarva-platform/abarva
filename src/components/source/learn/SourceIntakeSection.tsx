'use client';

import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  SubHead,
  Callout,
  StepList,
  Step,
  T,
} from '@/components/home/learn/primitives';

export function SourceIntakeSection() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>Source · Getting Started · 02</Eyebrow>
        <SectionTitle light size="xl">Creating your first event.</SectionTitle>
        <Lead light>
          The intake card is the start of every Source event. Six to eight critical
          fields here drive the entire lifecycle — from which artifacts get
          scaffolded to how Sentinel weights its scoring rubric. Get the intake
          right and the rest of the event is shaping clay; get it wrong and you
          fight the canvas every step.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>Why intake matters</Eyebrow>
        <SectionTitle>The intake fields drive the whole event</SectionTitle>
        <Lead>
          Three fields above all the rest set the shape of the event:{' '}
          <strong>archetype</strong>, <strong>rigor</strong>, and{' '}
          <strong>estimated value band</strong>. Every default Sentinel produces
          downstream — line items in the d19 pricing template, criteria + weights
          in the d16 scorecard, mandatory items in the d11 response checklist —
          comes from these three fields.
        </Lead>
        <Callout kind="warn" icon="⚠️" label="Get these three right">
          If you change the archetype mid-event, every default already produced
          becomes stale. Re-deriving means re-authoring (or accepting the legacy
          defaults). It&rsquo;s easier to spend an extra five minutes at intake
          than to re-author at Stage 5.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Field-by-field</Eyebrow>
        <SectionTitle>The seven intake fields</SectionTitle>

        <SubHead>1 · Event name</SubHead>
        <BodyP>
          Plain-language name as it appears in every export header (e.g.{' '}
          <em>&ldquo;Meridian Health Cloud &amp; Infrastructure&rdquo;</em>). Keep
          it scannable. The event code is auto-generated from the tenant and a
          time stamp.
        </BodyP>

        <SubHead>2 · Archetype</SubHead>
        <BodyP>
          The kind of sourcing this is. Five canonical archetypes today:{' '}
          <em>cloud / infrastructure</em>, <em>AMS / managed services</em>,{' '}
          <em>data platform</em>, <em>enterprise software</em>,{' '}
          <em>custom build</em>. Sentinel uses the archetype to seed defaults
          across artifacts — Cloud archetype gets egress + lock-in P0 traps in d20;
          AMS gets shift-coverage P0; pricing weight in d16 sits at 25% for Cloud
          and 30% for AMS.
        </BodyP>

        <SubHead>3 · Rigor</SubHead>
        <BodyP>
          The level of formal discipline this event runs under. Three tiers:{' '}
          <em>standard</em> (most events), <em>elevated</em> (board-visible spend
          or regulated industries), <em>strict</em> (any Tier-1 system). Rigor
          drives which artifacts are required vs recommended at each gate, and
          how many evidence sources Sentinel demands before promoting.
        </BodyP>

        <SubHead>4 · Estimated value band</SubHead>
        <BodyP>
          Annual run-rate range (low / high) the buyer expects to commit. Used
          in the d19 pricing template as the indicative envelope, in the d24
          decision brief as the &ldquo;value at stake&rdquo; figure, and in
          Sentinel&rsquo;s scoring weights (higher value bands → tighter pricing
          weight in the scorecard).
        </BodyP>

        <SubHead>5 · Decision sponsors</SubHead>
        <BodyP>
          The named individuals who will sign at d24 (Decision Brief). Typically
          a CTO + CFO pair, sometimes a single C-level. Their names show up in
          the cover block of every export and in Sentinel&rsquo;s addressing
          (&ldquo;CTO Marcus Webb (decision sponsor) + CFO Sarah Kim&rdquo;).
        </BodyP>

        <SubHead>6 · Procurement lead</SubHead>
        <BodyP>
          The procurement-side owner who runs the day-to-day sourcing operation.
          Different from the sponsor — sponsor decides; procurement executes.
          Shows up as &ldquo;Issued by&rdquo; in every export.
        </BodyP>

        <SubHead>7 · Trigger / strategic driver</SubHead>
        <BodyP>
          One paragraph on why this event exists. Lease expiring? Vendor
          contract ending? New regulatory requirement? Sentinel uses this verbatim
          in the d01 strategy memo; the d09 RFP package opens with it as
          &ldquo;Strategic driver.&rdquo; Be specific — &ldquo;Newark colo lease
          expires Q3 2027 with 18% YoY rate escalation locked&rdquo; is much
          better than &ldquo;cloud transformation.&rdquo;
        </BodyP>

        <SubHead>8 · Scope description (optional but high-leverage)</SubHead>
        <BodyP>
          A few sentences listing in-scope systems / capabilities. Sentinel uses
          this to extract candidate line items in d19 (pricing template) and
          candidate apps in d04 (app inventory). Authoring this here saves you
          authoring it again in the d05 scope memo.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Worked example</Eyebrow>
        <SectionTitle>Filling out an $8M Cloud event</SectionTitle>
        <Lead>
          Here&rsquo;s the actual intake for the Meridian Health Cloud demo event
          you&rsquo;ll see when you open the canvas. Use it as a reference shape
          for your first real event.
        </Lead>
        <Callout kind="info" icon="📋" label="Meridian Health Cloud · MERI-MERIDIAN-HEALTH-CLOUD-2026">
          <strong>Archetype:</strong> Infrastructure (cloud-shaped) · <strong>Rigor:</strong> Standard ·{' '}
          <strong>Value band:</strong> $8M low / $12M high annual ·{' '}
          <strong>Sponsor:</strong> CTO Marcus Webb (decision sponsor) + CFO Sarah Kim ·{' '}
          <strong>Procurement:</strong> Janet Fischer, VP IT Ops ·{' '}
          <strong>Trigger:</strong> Newark colocation lease expires Q3 2027 with rate escalation locked at 18% YoY. Rebuilding the CIS stack on bare-metal at a new colocation facility is not under consideration.
        </Callout>
        <BodyP>
          Note how the trigger paragraph is specific (named lease, Q3 2027,
          18% rate, rebuild explicitly out of consideration). Sentinel can use
          that level of detail; &ldquo;cloud migration&rdquo; alone leaves it
          guessing.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Try it</Eyebrow>
        <SectionTitle>Open the intake card on a sandbox event</SectionTitle>
        <Lead>
          You can practice on a sandbox event — same intake card as a real one
          but no procurement consequences.
        </Lead>
        <StepList>
          <Step title="Open Source → events">
            Navigate to <strong>Source</strong> in the top nav, then{' '}
            <strong>events</strong>. You&rsquo;ll see the existing demo events.
          </Step>
          <Step title="Click + New event">
            The intake card opens. Fill in the seven fields — use a real-world
            sourcing situation you&rsquo;re thinking about, or copy the Meridian
            shape above.
          </Step>
          <Step title="Submit">
            On submit, Sentinel scaffolds 33 artifact slots across all 11 stages.
            The event lands you on Stage 1 / Strategy with d01 ready to author or
            generate.
          </Step>
          <Step title="Verify the defaults">
            Open Stage 6 / Pricing → d19 pricing template. The default line items
            should reflect your archetype. Open Stage 5 / Evaluation → d16
            scorecard. The default criteria + weights should reflect your value
            band + rigor.
          </Step>
        </StepList>
      </Section>
    </>
  );
}
