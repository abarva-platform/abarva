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
  Flow,
  FlowStep,
  T,
} from '@/components/home/learn/primitives';

export function SourceWelcomeSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>Source · Buyer&rsquo;s Primer</Eyebrow>
        <SectionTitle light size="xl">
          Run a sourcing event with Sentinel.
        </SectionTitle>
        <Lead light>
          Source is the AbarVa surface for running a real sourcing event end-to-end —
          strategy memo through value realization. Sentinel drafts, evaluates, and
          flags gaps; you decide. This primer walks you through the lifecycle so a
          first-time user can ship a defensible event.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['Surface: Source', 'Audience: First-time procurement leads', 'Time: ~30 min'].map(
            (tag) => (
              <span
                key={tag}
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  padding: '5px 12px',
                  borderRadius: 4,
                  background: 'rgba(255,255,255,0.14)',
                  color: 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(255,255,255,0.14)',
                }}
              >
                {tag}
              </span>
            ),
          )}
        </div>
      </HeroBand>

      {/* The 11 stages */}
      <Section>
        <Eyebrow>Lifecycle · 01</Eyebrow>
        <SectionTitle>Eleven stages, one Source event</SectionTitle>
        <Lead>
          A Source event is a single sourcing decision that walks through eleven
          canonical stages. Each stage produces specific artifacts and earns its
          way to the next via gate criteria. You don&rsquo;t skip stages — but
          most stages take days, not weeks, with Sentinel doing the drafting.
        </Lead>
        <Flow>
          <FlowStep badge="01" badgeColor="slate" icon="🎯" label="Strategy" desc="Why are we doing this?" />
          <FlowStep badge="02" badgeColor="slate" icon="🗺️" label="Scope" desc="What is in / out" />
          <FlowStep badge="03" badgeColor="navy" icon="📩" label="RFP" desc="Ask vendors what we need" />
          <FlowStep badge="04" badgeColor="navy" icon="📥" label="Responses" desc="Receive + complete-check" />
          <FlowStep badge="05" badgeColor="navy" icon="⚖️" label="Evaluation" desc="Score finalists" />
          <FlowStep badge="06" badgeColor="navy" icon="💵" label="Pricing" desc="Normalize TCO" />
          <FlowStep badge="07" badgeColor="navy" icon="🤝" label="BAFO" desc="Final + best offer" />
          <FlowStep badge="08" badgeColor="purple" icon="✍️" label="Decision" desc="Sponsor signs" />
          <FlowStep badge="09" badgeColor="teal" icon="📜" label="Selection" desc="Tell winner + losers" />
          <FlowStep badge="10" badgeColor="teal" icon="🏗️" label="Transition" desc="Stand up the contract" />
          <FlowStep badge="11" badgeColor="teal" icon="📈" label="Value" desc="Did we realize it?" />
        </Flow>
        <Callout kind="info" icon="🧭" label="Stages are gates, not phases">
          Each stage has a small set of <strong>gate criteria</strong>. Until those are met
          you cannot promote the event forward. The criteria are the discipline; the
          artifacts are the evidence. Sentinel surfaces the gaps; you make the call.
        </Callout>
      </Section>

      {/* Sentinel */}
      <Section>
        <Eyebrow>Lifecycle · 02</Eyebrow>
        <SectionTitle>Sentinel is your sourcing copilot</SectionTitle>
        <Lead>
          Every Source event is co-led by Sentinel. Sentinel is one named agent
          sitting in front of a deep specialist catalog (RFP drafting, scoring,
          pricing-trap detection, BAFO question generation, contract redlines).
          You see one chat lane; Sentinel routes specialist work behind it.
        </Lead>
        <BodyP>
          Behind <strong>Sentinel</strong> sit specialist functions you never address
          directly — they read the substrate (event metadata, authored artifacts,
          gate states, evidence) and produce drafts, summaries, scoring, redlines,
          and trap flags. The result: you ask Sentinel a question; it consults the
          specialists; it answers in the canvas with provenance receipts you can
          audit.
        </BodyP>
        <Callout kind="info" icon="🪪" label="Provenance receipts">
          Every Sentinel-generated artifact carries a receipt: which model, which
          upstream artifacts it bound (e.g. d05 scope memo + d21 assumption set →
          d09 RFP package), how many tokens, what stop reason. You can challenge
          the output by reading the receipt; nothing is opaque.
        </Callout>
      </Section>

      {/* What you do, what Sentinel does */}
      <Section>
        <Eyebrow>Lifecycle · 03</Eyebrow>
        <SectionTitle>Your first 30 minutes on Source</SectionTitle>
        <Lead>
          The fastest way to internalize Source is to walk through one event. Use a
          sandbox demo event (Meridian Health Cloud) — no real procurement
          consequences — and follow these steps.
        </Lead>
        <StepList>
          <Step title="Open the demo event">
            Navigate to <strong>Source → events</strong> and pick <em>Meridian Health
            Cloud &amp; Infrastructure</em>. The canvas opens with the 11-stage rail
            on top, the chat lane on the left, and the document workspace on the
            right.
          </Step>
          <Step title="Read the stage frame">
            The chat lane shows you the current stage&rsquo;s lead agent
            (<em>Sentinel for Strategy through Selection</em>; <em>Atlas for
            Decision and Value</em>) and the readiness count (e.g. &ldquo;Artifacts
            2 / 5 · Evidence 1 source&rdquo;). The right side shows artifact slots —
            click any to see the canonical template plus the per-event authored
            body.
          </Step>
          <Step title="Generate the d01 strategy memo">
            On Stage 1 / Strategy, click into <strong>d01 Strategy Memo</strong>.
            Hit <strong>Generate with Sentinel</strong>. Sentinel pulls the event
            intake metadata, drafts a strategy memo, persists it to the substrate,
            and stamps a provenance receipt. Review the body, edit if needed.
          </Step>
          <Step title="Promote the stage">
            Once the gate criteria are met (3 / 3 in the case of Strategy), click
            <strong>Mark met criteria</strong> on each, then <strong>Promote
            stage</strong>. The rail advances to Stage 2 / Scope.
          </Step>
          <Step title="Download an export">
            Click into any artifact card and try the format anchors —
            <em> Download xlsx · Download docx · View HTML · Download PDF</em>. Each
            uses your authored content if present, the canonical scaffold otherwise.
            All four formats are AbarVa-branded and audit-stamped.
          </Step>
        </StepList>
      </Section>

      {/* Where to next */}
      <Section>
        <Eyebrow>Next</Eyebrow>
        <SectionTitle>Where to go next</SectionTitle>
        <Lead>
          Three paths from here, depending on what you need.
        </Lead>
        <SubHead>Just want to ship an event?</SubHead>
        <BodyP>
          Read <strong>Creating your first event</strong> next — it walks the
          intake card field by field so your first real event sets up the right
          archetype + rigor + value band. After that, jump straight to the lifecycle
          stage you&rsquo;re on.
        </BodyP>
        <SubHead>Want to understand Sentinel deeply?</SubHead>
        <BodyP>
          Read <strong>Working with Sentinel</strong> — covers the chat lane vs the
          canvas substrate, the &ldquo;Generate with Sentinel&rdquo; flow,
          provenance receipts, and how to read what specialists Sentinel routed to.
        </BodyP>
        <SubHead>Need a term?</SubHead>
        <BodyP>
          The <strong>Glossary</strong> page has alphabetical definitions for every
          term Sentinel and the canvas use — archetype, rigor, gate, artifact, tier,
          scaffold, body, generate, evidence, plus procurement acronyms (TCO, BAFO,
          RFI, RFP, MSA, DPA, SOW).
        </BodyP>
      </Section>
    </>
  );
}
