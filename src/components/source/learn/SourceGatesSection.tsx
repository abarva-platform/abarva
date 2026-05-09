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

export function SourceGatesSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>Source · Reference</Eyebrow>
        <SectionTitle light size="xl">
          Understanding gates and evidence.
        </SectionTitle>
        <Lead light>
          You don&rsquo;t skip stages. Gates are the discipline that makes a
          sourcing event defensible. Each of the 11 stages has a set of gate
          criteria — all must be met before you can promote to the next stage.
          This page explains how criteria work, what counts as evidence, and
          how to use the gap audit before you promote.
        </Lead>
      </HeroBand>

      {/* What a gate is */}
      <Section>
        <Eyebrow>Gates · 01</Eyebrow>
        <SectionTitle>What a gate is</SectionTitle>
        <Lead>
          Each of the 11 stages has between 3 and 5 gate criteria. A criterion
          has three properties: a label (a short name), a requirement (what
          must be true — e.g. &ldquo;d01 strategy memo authored&rdquo;), and a
          met / unmet state. All criteria for a stage must be in the met state
          before the <strong>Promote stage</strong> button becomes active.
        </Lead>
        <BodyP>
          Gate criteria come in two kinds. <strong>Artifact criteria</strong>{' '}
          require that a specific artifact slot (identified by its d-code) has
          an authored body — either hand-written or Sentinel-generated.{' '}
          <strong>Evidence criteria</strong> require that at least one piece of
          evidence has been tagged to that criterion in the event&rsquo;s
          evidence ledger.
        </BodyP>
        <BodyP>
          The criteria for each stage are canonical — they are the same across
          all events of a given archetype. You cannot remove a criterion, but
          you can add supplemental evidence to any criterion beyond the minimum.
        </BodyP>
        <SubHead>Example: Stage 1 / Strategy gate criteria</SubHead>
        <BodyP>
          Stage 1 (Strategy) has three criteria: (1){' '}
          <strong>d01 strategy memo authored</strong> — the artifact body must
          be non-empty; (2) <strong>business case framing captured</strong> —
          at least one evidence item tagged to &ldquo;business case&rdquo;;
          (3) <strong>decision sponsor named</strong> — the intake card&rsquo;s
          sponsor field must be populated. All three must show &ldquo;met&rdquo;
          before you can promote to Stage 2 / Scope.
        </BodyP>
      </Section>

      {/* The readiness count */}
      <Section>
        <Eyebrow>Gates · 02</Eyebrow>
        <SectionTitle>The readiness count</SectionTitle>
        <Lead>
          The chat lane shows a compact readiness count at the top of the
          current stage — for example: <strong>Artifacts 2 / 5 · Evidence 1
          source</strong>. Here is what each part means.
        </Lead>
        <SubHead>Artifacts 2 / 5</SubHead>
        <BodyP>
          The first number is how many artifact slots in the current stage have
          a body with real content (more than the canonical scaffold placeholder
          text). The second number is the total artifact slots for this stage.
          &ldquo;2 / 5&rdquo; means two artifacts have been authored; three
          remain at scaffold-only.
        </BodyP>
        <SubHead>Evidence 1 source</SubHead>
        <BodyP>
          This is the count of distinct evidence items pinned to the
          event&rsquo;s evidence ledger for the current stage. &ldquo;1
          source&rdquo; means one document, URL, or Sentinel artifact has been
          tagged as evidence for at least one gate criterion. The count goes up
          each time you upload a document, pin a URL via the Sentinel chat, or
          tag a Sentinel-generated artifact as a provenance receipt.
        </BodyP>
        <BodyP>
          The readiness count is a quick orientation signal, not a gate check.
          Meeting all gate criteria is the bar for promotion — the readiness
          count tells you roughly how far along you are.
        </BodyP>
      </Section>

      {/* What counts as evidence */}
      <Section>
        <Eyebrow>Gates · 03</Eyebrow>
        <SectionTitle>What counts as evidence</SectionTitle>
        <Lead>
          Three evidence types are accepted. Each must be tagged to at least
          one gate criterion to count toward readiness.
        </Lead>
        <SubHead>Uploaded document (PDF, DOCX)</SubHead>
        <BodyP>
          Upload a file directly to the evidence ledger via the upload button
          in the artifact panel. Accepted formats: PDF and DOCX. The file is
          stored in the event&rsquo;s evidence ledger, tied to your Clerk user
          id, and tagged to the criterion you select on upload. Maximum file
          size: 20 MB.
        </BodyP>
        <SubHead>URL pinned via Sentinel chat</SubHead>
        <BodyP>
          In the Sentinel chat lane, paste a URL and ask Sentinel to
          &ldquo;pin this as evidence for [criterion name].&rdquo; Sentinel
          stores the URL in the evidence ledger and creates a ledger entry with
          the criterion tag and the timestamp. URL evidence is not downloaded
          or scraped — only the URL and your annotation are stored.
        </BodyP>
        <SubHead>Sentinel-generated artifact with a valid provenance receipt</SubHead>
        <BodyP>
          Any artifact generated by Sentinel carries a provenance receipt. You
          can tag that receipt as evidence for a criterion directly from the
          artifact card — click <strong>Tag as evidence</strong> and select the
          criterion. This is the most common evidence path: Sentinel generates
          the artifact and the receipt simultaneously serves as the evidence
          record.
        </BodyP>
        <Callout kind="info" icon="🔖" label="Evidence must be tagged">
          An uploaded document or pinned URL that is not tagged to a criterion
          appears in the ledger but does not count toward gate readiness.
          Always tag evidence to a specific criterion on the way in — you can
          add more tags later from the ledger view.
        </Callout>
      </Section>

      {/* Promoting a stage */}
      <Section>
        <Eyebrow>Gates · 04</Eyebrow>
        <SectionTitle>Promoting a stage</SectionTitle>
        <Lead>
          Promotion advances the event from the current stage to the next.
          It is irreversible — there is no going back once a stage is promoted.
          Sentinel surfaces a confirmation dialog listing any unmet criteria
          so you cannot accidentally promote with gaps.
        </Lead>
        <StepList>
          <Step title="Mark met criteria one by one">
            For each criterion in the current stage, click{' '}
            <strong>Mark met criteria</strong>. The button is on the criterion
            row in the gate panel. You can only click it once the criterion
            requirement is satisfied (artifact body present, or evidence tagged,
            depending on the criterion type).
          </Step>
          <Step title="Review the gate panel">
            Once you&rsquo;ve marked criteria, check the gate panel summary. It
            shows met criteria in green and any remaining unmet criteria in
            amber. If amber rows remain, do not promote — address the gaps
            first.
          </Step>
          <Step title="Click Promote stage">
            When all criteria are green, the <strong>Promote stage</strong>{' '}
            button activates. Click it. Sentinel shows a confirmation dialog
            listing the criteria that will be locked.
          </Step>
          <Step title="Confirm in the dialog">
            The dialog names each criterion and its met state. If any criterion
            is shown as unmet in the dialog, cancel and address it. Click{' '}
            <strong>Confirm promotion</strong> only when all criteria are met.
          </Step>
          <Step title="The stage locks">
            The current stage&rsquo;s artifacts and gate state are frozen. The
            event advances to the next stage. The gate history records the
            promotion timestamp and the Clerk user id of whoever confirmed.
          </Step>
        </StepList>
        <Callout kind="warn" icon="⚠️" label="Promotion is irreversible">
          Once a stage is promoted, its artifacts are the official record for
          that stage. You can still view them, export them, and reference them
          in later stages, but you cannot edit the promoted body. Any
          post-promotion changes to an artifact are labeled &ldquo;post-gate
          edit&rdquo; in the provenance receipt.
        </Callout>
      </Section>

      {/* The gap audit */}
      <Section>
        <Eyebrow>Gates · 05</Eyebrow>
        <SectionTitle>The gap audit</SectionTitle>
        <Lead>
          Before you promote, run &ldquo;Audit gate gaps&rdquo; in the Sentinel
          chat lane. Sentinel reads the substrate and returns a structured gap
          report — which criteria are unmet, which artifacts are missing a body,
          and which evidence links are thin. Fix those before promoting.
        </Lead>
        <BodyP>
          To trigger the audit, type <strong>Audit gate gaps</strong> (or a
          natural-language equivalent — &ldquo;what&rsquo;s blocking
          promotion?&rdquo;) in the Sentinel chat lane. Sentinel runs the
          following checks against the substrate:
        </BodyP>
        <ul style={{ marginLeft: 24, lineHeight: 1.8, fontSize: 14 }}>
          <li>
            <strong>Unmet criteria</strong> — criteria whose requirement is not
            satisfied. Sentinel lists each by label and explains the gap (e.g.
            &ldquo;d01 body is empty — generate or author it first&rdquo;).
          </li>
          <li>
            <strong>Missing artifacts</strong> — artifact slots that have no
            body at all. If the slot is required by a gate criterion, it
            appears in the unmet list above; if it is optional for this stage
            but expected by a downstream stage, Sentinel flags it as a
            &ldquo;forward dependency warning.&rdquo;
          </li>
          <li>
            <strong>Thin evidence links</strong> — criteria whose evidence
            requirement is technically met (one item tagged) but where Sentinel
            judges the evidence weak (e.g. a URL with no annotation, or a
            very short Sentinel receipt). Sentinel flags these as warnings, not
            blockers, but recommends strengthening them before promotion.
          </li>
        </ul>
        <BodyP>
          The gap audit response is structured as a checklist in the chat lane.
          You can act on each item directly: click an artifact link to open the
          card, or ask Sentinel to generate the missing artifact in the same
          chat turn.
        </BodyP>
      </Section>

      {/* The audit trail callout */}
      <Section>
        <Callout kind="info" icon="📋" label="Gates are irreversible for a reason">
          Gates are the audit trail. The event&rsquo;s gate history shows
          exactly when each stage was promoted and by whom. This is what a
          procurement panel looks at. An event where every stage was promoted
          with all criteria met — with evidence tagged and provenance receipts
          intact — is a defensible sourcing record. An event where stages were
          skipped or promoted with thin evidence is a liability. The gate
          discipline is not overhead; it is the product.
        </Callout>
      </Section>
    </>
  );
}
