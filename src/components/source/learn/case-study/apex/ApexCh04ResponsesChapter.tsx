'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap } from './_apex-shell';

export function ApexCh04ResponsesChapter() {
  return (
    <ApexChapterShell slug="apex-responses">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 04 · Stage 04 Vendor Responses</Eyebrow>
        <SectionTitle light size="xl">Week 5. Four proposals. One flag.</SectionTitle>
        <Lead light>
          All four vendors respond on time with completed pricing templates. Within six
          hours of submission, Sentinel surfaces pattern PAT-AMS-VND-001 against
          BlueMaster&rsquo;s SLA commitment section. The flag is not a disqualification
          yet — it is a documented risk that the evaluation committee will have to
          account for. Pricing normalisation begins in parallel.
        </Lead>
      </HeroBand>

      <StoryRecap>
        The RFP closed at 5:00 p.m. on the response deadline. All four vendors submitted
        on time using the mandatory pricing template. Sentinel is running initial pattern
        analysis across all four proposal texts. Rachel is loading responses into the
        evaluation workbench.
      </StoryRecap>

      <Section>
        <Eyebrow>Sentinel pattern detection · within 6 hours of submission</Eyebrow>
        <SectionTitle>PAT-AMS-VND-001: SLA overstatement without penalty backstop</SectionTitle>
        <Lead>
          Sentinel surfaces one pattern flag across the four proposals. BlueMaster&rsquo;s
          SLA commitment section states 99.95% uptime for the infrastructure tower — the
          highest commitment in the field. But there is no corresponding penalty schedule
          attached. The SLA section references &ldquo;performance credits as mutually
          agreed&rdquo; in lieu of a defined penalty table.
        </Lead>
        <BodyP>
          Pattern PAT-AMS-VND-001 is Sentinel&rsquo;s classification for this structure:
          an SLA headline that exceeds peers, with penalty terms deferred to negotiation.
          It is a known AMS vendor tactic. The commitment gets the vendor scored highly on
          SLA in a naive evaluation, then the penalty backstop gets softened in contract
          negotiation when the buyer has already committed to the vendor. Sentinel flags
          it at response stage, not contract stage.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="PAT-AMS-VND-001 · BlueMaster IT · SLA overstatement">
          BlueMaster IT SLA section claims 99.95% infrastructure uptime — highest in
          field. Penalty schedule deferred to &ldquo;mutual agreement.&rdquo; No dollar
          value committed. This structure scores well on the SLA dimension if graded
          on commitment alone. The evaluation committee must apply the full SLA criterion
          (commitment <em>plus</em> penalty backstop) or the score will overstate
          BlueMaster&rsquo;s actual contractual risk position.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Pricing normalisation · first pass</Eyebrow>
        <SectionTitle>The $11.2M gap that the raw proposals do not show</SectionTitle>
        <BodyP>
          Chris runs the first-pass normalisation against the mandatory pricing template.
          The raw Year 1 numbers look competitive across all four vendors. The divergence
          opens up in Years 2 and 3, where DataPeak and BlueMaster both show material
          step-ups that their executive summaries describe as &ldquo;volume efficiency
          adjustments.&rdquo;
        </BodyP>
        <BodyP>
          The 3-year TCO normalisation reveals a $11.2M spread between the lowest-cost
          vendor (Northstar at $22.4M) and the highest (DataPeak at $33.6M). That spread
          is not visible in a Year 1 comparison. It only appears when all four proposals
          are run through the same pricing template and projected across the full contract
          term. Full analysis is in Chapter 6.
        </BodyP>
        <Callout kind="info" icon="📊" label="3-year TCO · first pass · top line">
          <strong>Northstar Managed Services:</strong> $22.4M ·{' '}
          <strong>ArcVault Managed:</strong> $24.3M ·{' '}
          <strong>BlueMaster IT:</strong> $31.2M ·{' '}
          <strong>DataPeak Systems:</strong> $33.6M ·{' '}
          Spread: $11.2M. Year 1 spread alone: $2.9M — less than 30% of the full
          3-year signal. Normalisation is not optional at this value band.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 4</Eyebrow>
        <SectionTitle>Patterns detected at response stage cost nothing to act on. At contract stage they cost everything.</SectionTitle>
        <BodyP>
          The PAT-AMS-VND-001 flag on BlueMaster is not a close call. A penalty schedule
          deferred to mutual agreement is contractually inert — it gives Apex no
          enforcement mechanism. The flag lands in the evaluation record, not in a
          side conversation. By the time the committee meets for formal scoring in
          Chapter 5, every member has read the flag. BlueMaster&rsquo;s SLA score
          reflects the actual contractual commitment, not the headline number.
        </BodyP>
        <BodyP>
          Without the flag, BlueMaster&rsquo;s 99.95% commitment would have been
          the highest-scoring SLA in the evaluation — potentially enough to offset
          the pricing premium and advance them to BAFO. The flag prevents that outcome
          without eliminating BlueMaster arbitrarily; it simply applies the rubric
          criterion correctly.
        </BodyP>
      </Section>
    </ApexChapterShell>
  );
}
