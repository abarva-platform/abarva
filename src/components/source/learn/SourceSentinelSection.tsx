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
} from '@/components/home/learn/primitives';

export function SourceSentinelSection() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>Source · Getting Started · 03</Eyebrow>
        <SectionTitle light size="xl">Working with Ava on a Source event.</SectionTitle>
        <Lead light>
          Ava is the single assistant you talk to across every AbarVa surface,
          and she runs a Source event end to end. Behind her sits a deep
          specialist catalog — RFP drafting, scoring rubric generation,
          pricing-trap detection, BAFO question authoring, contract redlining.
          You see one chat lane and one assistant; Ava draws on whichever
          sourcing expertise the stage demands. You never get handed off to a
          different bot.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>The two surfaces</Eyebrow>
        <SectionTitle>Chat lane vs canvas substrate</SectionTitle>
        <Lead>
          Source has two distinct surfaces working together. They look like one
          but they have very different roles.
        </Lead>
        <SubHead>The chat lane (left side)</SubHead>
        <BodyP>
          Where you talk to Ava. Free-form. Use it to ask about the current
          stage, request specialist work (&ldquo;draft d09 with my upstream
          artifacts bound&rdquo;), or query a specific artifact (&ldquo;why is
          this trap P0?&rdquo;). Ava responds inline.
        </BodyP>
        <SubHead>The canvas substrate (right side)</SubHead>
        <BodyP>
          The structured state of the event — what artifacts exist, what bodies
          are authored, what gate criteria are met, what evidence is pinned.
          Ava reads from it; Ava writes to it (with provenance
          receipts); the document tab renders it. The substrate is the source of
          truth — chat is the conversation; substrate is the record.
        </BodyP>
        <Callout kind="info" icon="🔗" label="They&rsquo;re tied together">
          Asking a chat-lane question that requires substrate state (&ldquo;summarize
          d05&rdquo;) means Ava reads the substrate live before answering. A
          chat answer that produces an artifact body is written into substrate
          before the chat shows the &ldquo;done&rdquo; line.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The generate flow</Eyebrow>
        <SectionTitle>What happens when you click &ldquo;Generate with Ava&rdquo;</SectionTitle>
        <Lead>
          Every artifact card has a &ldquo;Generate with Ava&rdquo; button.
          Clicking it triggers a five-step flow you can audit at every level.
        </Lead>
        <StepList>
          <Step title="Substrate read">
            The context binder (server-side) pulls the canonical artifact spec,
            the per-event artifact state (any prior body), upstream bodies the
            prompt template requires (e.g. d05 + d21 for d09), and tenant +
            event metadata. Everything is tenant-scoped via RLS; no cross-tenant
            bridge.
          </Step>
          <Step title="Prompt assembly">
            The prompt registry returns the per-artifact prompt template
            (versioned). The user-message builder fills the template with bound
            context. The Anthropic system prompt declares voice, format
            requirements, and required sections.
          </Step>
          <Step title="Claude call">
            <em>claude-sonnet-4-6</em> is invoked via streaming. The body comes
            back as markdown. We track token counts (in / out), stop reason, and
            elapsed time.
          </Step>
          <Step title="Substrate write">
            Two writes happen atomically: the body lands in{' '}
            <em>source_event_artifact_states.body</em>; a generation receipt
            lands in <em>body_generation_metadata</em>. The receipt names the
            model, prompt template id + version, upstream codes bound, generated-
            at timestamp, generated-by user id, tokens in/out, stop reason.
          </Step>
          <Step title="Canvas refresh">
            The canvas re-reads the artifact card. The body now renders as
            authored content (not the canonical scaffold). The provenance receipt
            is visible if you click the &ldquo;authored by Ava&rdquo; chip.
          </Step>
        </StepList>
        <Callout kind="warn" icon="⚠️" label="Generations can fail">
          Possible failure modes: missing upstream artifact (Ava returns 409
          with &ldquo;author X first&rdquo;), context window exceeded (very large
          upstream bodies), Anthropic rate limit. The chat lane shows the actual
          error; the canvas remains in its prior state.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Reading provenance</Eyebrow>
        <SectionTitle>How to audit an Ava-authored body</SectionTitle>
        <Lead>
          Every authored body carries a provenance receipt you can read. This is
          how you challenge what Ava produced and rebuild trust the way a
          procurement panel would expect.
        </Lead>
        <BodyP>
          Click the <strong>authored by Ava</strong> chip on any artifact
          card. The receipt shows:
        </BodyP>
        <ul style={{ marginLeft: 24, lineHeight: 1.8, fontSize: 14 }}>
          <li><strong>Model</strong> — e.g. <em>claude-sonnet-4-6</em>. Pin a model in your audit doc.</li>
          <li><strong>Prompt template id + version</strong> — same prompt today as last quarter? The version answers it.</li>
          <li><strong>Upstream bound codes</strong> — which artifacts Ava actually read. If d09 cites Karen Liu, but the receipt shows it bound only d01, you know the citation came from d01 — not from a hallucination.</li>
          <li><strong>Generated at</strong> — exact timestamp.</li>
          <li><strong>Generated by</strong> — Clerk user id of whoever clicked Generate.</li>
          <li><strong>Tokens in / out</strong> — best-effort from Anthropic usage. Useful for cost attribution.</li>
          <li><strong>Stop reason</strong> — <em>end_turn</em> means clean finish; <em>max_tokens</em> means truncated; <em>stop_sequence</em> means a guardrail fired.</li>
        </ul>
        <Callout kind="info" icon="🪪" label="The receipt survives edits">
          If you edit Ava&rsquo;s body inline, the receipt stays — describing
          the original generation. The canvas shows you a small &ldquo;edited
          since generation&rdquo; indicator so you know the current body is
          your hand-edit, not the original Ava output.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Specialist expertise</Eyebrow>
        <SectionTitle>Ava is one assistant; many specialists work behind her</SectionTitle>
        <Lead>
          Ava is the single assistant you talk to. The specialist catalog she
          draws on is published in{' '}
          <em>docs/architecture/specialist-catalog.md</em>; you don&rsquo;t address
          specialists directly — you always talk to Ava — but the receipt names
          which expertise ran.
        </Lead>
        <BodyP>
          Examples of the specialist expertise Ava draws on:
        </BodyP>
        <ul style={{ marginLeft: 24, lineHeight: 1.8, fontSize: 14 }}>
          <li><strong>Strategy memo author</strong> — drafts d01 from event intake + tenant inventory</li>
          <li><strong>Scope synthesizer</strong> — turns ticket history + app inventory into d05</li>
          <li><strong>RFP composer</strong> — drafts d09 from d01 + d05 (and Ava flags d21 / d19a as missing if those are not yet authored)</li>
          <li><strong>Pricing trap detector</strong> — scans vendor d19 submissions for assumption deviations + lock-in patterns; emits d20 trap log entries</li>
          <li><strong>BAFO question generator</strong> — converts open P0 / P1 traps in d20 into required d22 questions</li>
          <li><strong>Decision brief composer</strong> — assembles d24 from the cumulative event state</li>
          <li><strong>Selection memo writer</strong> — drafts d27 with cross-references to d24</li>
        </ul>
        <BodyP>
          You won&rsquo;t see most of these names in the chat lane. You&rsquo;ll
          see <strong>Ava</strong>. The specialists are the implementation;
          Ava is the contract — the one assistant you talk to.
        </BodyP>
      </Section>
    </>
  );
}
