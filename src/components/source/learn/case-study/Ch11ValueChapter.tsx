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
} from '@/components/home/learn/primitives';
import {
  ChapterShell,
  StoryRecap,
  GateStatusBox,
  PitfallBox,
  ArtifactSpecimen,
  AgentSplitBox,
} from './_shell';

export function Ch11ValueChapter() {
  return (
    <ChapterShell slug="value">
      <HeroBand color="teal">
        <Eyebrow light>Meridian Case Study · Chapter 11 · Stage 11 Value</Eyebrow>
        <SectionTitle light size="xl">Month 18. $11.2M of $14.4M.</SectionTitle>
        <Lead light>
          Eighteen months after Day 100. Twelve months after the value
          clock would have started under the d24-committed Month-7
          cutover, but only 9 months after the actual Month-9 cutover.
          Atlas&rsquo;s d32 ledger reads $11.2M realized against a
          straight-line projection of $14.4M. The $3.2M gap traces
          entirely to the 2-month slip. Variance owned, not hidden.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Cutover landed Month 9 (vs Month 7 committed). The Cloverleaf
        slip is documented in d29; Patricia&rsquo;s Month-12 learning
        review surfaced the &ldquo;enumerate integrations not
        systems&rdquo; lesson; Vendor B is operating cleanly on the
        post-cutover platform. Now we have to answer the Chapter 0
        question: did we realize the value the d24 brief committed?
        Yes — partially. The variance is real. The discipline is to
        name it precisely.
      </StoryRecap>

      <Section>
        <Eyebrow>The value model</Eyebrow>
        <SectionTitle>How d32 measures realized vs projected</SectionTitle>
        <Lead>
          Atlas&rsquo;s d32 value ledger compares realized run-rate
          savings against the d24 straight-line projection.
          Straight-line projection assumes value realization starts at
          the d24-committed cutover date (Month 7) and accumulates
          linearly over the 5-year term. Realized run-rate is measured
          against the colo baseline at each monthly checkpoint.
        </Lead>

        <BodyP>
          The annual value-band figure from d24 was $14M against the
          colo continuation baseline (the $54M cumulative cost
          differential from Sarah&rsquo;s Chapter 8 challenge minus
          the $4M transition cost minus year-on-year ramp). At
          Month 18, straight-line projection from Month 7 says we
          should be at 12 months × $1.2M / month = $14.4M cumulative
          realized.
        </BodyP>

        <Callout
          kind="info"
          icon="🪙"
          label="Straight-line is a fiction; named for clarity"
        >
          No real cost-savings curve is straight-line — there&rsquo;s
          ramp at the start, plateau in the middle, escalator pressure
          at the end. d32 uses straight-line as the projection benchmark
          because it&rsquo;s the simplest legible reference for a panel
          read. The ledger also carries a contoured projection that
          accounts for ramp; the variance against the contoured
          projection is smaller (~$2.6M vs $3.2M against straight-line)
          but tells the same story.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The variance math</Eyebrow>
        <SectionTitle>Why $11.2M, not $14.4M</SectionTitle>
        <Lead>
          The full variance attribution, surfaced by Atlas in the d32
          ledger, runs like this.
        </Lead>

        <ArtifactSpecimen
          code="d32"
          title="Value ledger · Month 18 · variance attribution"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Projected (straight-line from Month 7).</strong> 12
            months of realization × $1.2M / month = $14.4M cumulative.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Actual cutover (Month 9).</strong> Realization began
            Month 9, not Month 7. 10 months realized at $1.12M / month
            = $11.2M cumulative.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Variance vs projection: $3.2M behind.</strong>
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Variance attribution.</strong>
          </p>
          <ul style={{ marginLeft: 18, marginTop: 4, lineHeight: 1.6 }}>
            <li>
              <em>2-month delay in realization start:</em> 2 months ×
              $1.2M / month = $2.4M (75% of variance)
            </li>
            <li>
              <em>Lower per-month run-rate vs projection:</em> $0.08M /
              month × 10 months = $0.8M (25% of variance)
            </li>
          </ul>
          <p style={{ marginBottom: 8 }}>
            <strong>Per-month run-rate variance driver.</strong> Two of
            47 Cloverleaf integrations remain on workaround through
            Q4 2027; their operational cost is ~$80k / month higher
            than the straight-line model assumed. Resolves on
            scheduled Q4 2027 maintenance window.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Owner.</strong> Karen Liu (CIO). Measurement cadence:
            monthly. Next review: Month 21 (Q3 2027) post-Cloverleaf
            workaround resolution.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>5-year projection refresh.</strong> Original
            committed 5-year value: $70M cumulative against colo
            baseline. Refreshed projection at Month 18: $66.8M (–$3.2M
            from the slip) plus $0.4M recovery expected post-Q4 2027
            workaround resolution = <strong>$67.2M projected
            5-year</strong>, vs $70M committed. Variance −4.0%.
          </p>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>Surfacing, not hiding</Eyebrow>
        <SectionTitle>Why the variance is the case study&rsquo;s point</SectionTitle>
        <Lead>
          A different case study would end here with &ldquo;the program
          delivered $11.2M of expected value&rdquo; and quietly bury the
          gap. This one ends with the gap named, the cause named, the
          owner named, and the recovery date named. That&rsquo;s the
          discipline the d32 ledger is for.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Atlas',
            did: (
              <>
                Computed the variance attribution from d24
                (committed-value model) + d29 (milestone tracker, source
                of the slip) + monthly run-rate measurements (source of
                the per-month gap). Generated the variance breakdown
                automatically — 75% from the slip, 25% from the
                workaround. Named Karen as owner from d24&rsquo;s
                day-to-day-owner field. Set the next-review cadence at
                monthly with a major checkpoint at Month 21.
              </>
            ),
          }}
          human={{
            who: 'Marcus',
            did: (
              <>
                Read the variance honestly. Did not ask Karen for a
                magical recovery plan or argue the projection
                methodology. Acknowledged the variance to the audit
                committee at the Month-18 review. Authorized the
                Tier-2 DR follow-on event scope memo to enumerate
                middleware integrations explicitly — the structural
                fix carrying forward.
              </>
            ),
          }}
        />
      </Section>

      <Section>
        <Eyebrow>What worked</Eyebrow>
        <SectionTitle>Five things this event did right</SectionTitle>
        <Lead>
          End-of-event learning review. Patricia ran one at Month 12;
          Atlas re-runs it at Month 18 with the value-realization data
          included. Five things this event did right:
        </Lead>
        <SubHead>1 · Pricing-trap detection ran cell-by-cell, not summary-by-summary</SubHead>
        <BodyP>
          The Vendor A egress structure was buried in Appendix C. A
          summary-level read would have missed it. Sentinel&rsquo;s
          deterministic cell-level pass surfaced it and quantified the
          $4.14M / 5-year exposure with an exit fee at 2× run-rate.
          That single finding is worth more than the cost of the entire
          tooling layer.
        </BodyP>
        <SubHead>2 · BAFO question patterns were calibrated to vendor pattern</SubHead>
        <BodyP>
          Pattern-1 (assumption-correction) closes ~95% of the time.
          Pattern-2 (lock-in-removal) closes ~60% of the time. Knowing
          the pattern shape let Janet model BAFO outcomes — Vendor
          A&rsquo;s 3 P0s included a Pattern-2 with low closure
          probability, which is why their walk wasn&rsquo;t a surprise.
        </BodyP>
        <SubHead>3 · Loser letters were specific</SubHead>
        <BodyP>
          A and D each got rubric breakdown + named closure point +
          future-submission observation. D&rsquo;s account exec called
          to thank Janet for the candor. The market-reputation dividend
          of specific loser letters compounds over events.
        </BodyP>
        <SubHead>4 · CFO challenge session had its own time on the calendar</SubHead>
        <BodyP>
          Sarah&rsquo;s 90-minute review on Day 89 surfaced the
          transition-cost line that would otherwise have become an
          audit-committee surprise. The discipline of running the
          session deliberately (not as a rubber-stamp signature) is
          what prevented the surprise.
        </BodyP>
        <SubHead>5 · Variance was named, not hidden</SubHead>
        <BodyP>
          The Cloverleaf slip could have been buried under
          &ldquo;migration complexity&rdquo; in a status report. Atlas
          surfaced it explicitly, named Karen as owner, set the
          measurement cadence. Patricia accepted the variance instead
          of demanding magical recovery. The mature procurement signal.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>What we&rsquo;d do differently</Eyebrow>
        <SectionTitle>Two structural fixes for the next event</SectionTitle>
        <SubHead>1 · Enumerate middleware integrations in d05, not just systems</SubHead>
        <BodyP>
          The single highest-leverage process change. The Cloverleaf
          slip cost us 2 months and $3.2M of year-1 realized value.
          Enumerating 47 integrations in the scope memo would have cost
          Karen 2 hours and Janet 30 minutes; it would have surfaced
          the 11 incompatible integrations during d09 vendor responses.
          The Tier-2 DR follow-on event scope memo will be the first
          test of the new discipline.
        </BodyP>
        <SubHead>2 · BAFO question on integration discovery, even when scope is enumerated</SubHead>
        <BodyP>
          Belt and suspenders. Even when the scope memo enumerates the
          integration count, the BAFO question pack should include a
          named question on integration-discovery completeness:{' '}
          <em>&ldquo;Confirm your migration plan addresses each of the
          N enumerated integrations and identify any you cannot
          host.&rdquo;</em> Pattern-1 question, low friction, surfaces
          the same incompatibilities at BAFO instead of at Month 4 of
          execution.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 11 closes; event archives</SectionTitle>
        <GateStatusBox
          stage="Stage 11 · Value"
          rows={[
            {
              text: 'd32 value ledger composed at Month 18 with realized vs projected variance',
              status: 'met',
            },
            {
              text: 'Variance attribution computed and named (75% slip / 25% workaround)',
              status: 'met',
            },
            {
              text: 'Owner + measurement cadence + next-review date set',
              status: 'met',
            },
            {
              text: 'Learning review run with structural fixes carried forward to Tier-2 DR follow-on',
              status: 'met',
            },
            {
              text: '5-year value-realization projection refreshed and acknowledged',
              status: 'met',
            },
          ]}
        />

        <PitfallBox
          kind="avoided"
          title="Variance is named in the ledger, not buried in a status update"
        >
          The most common Stage 11 pitfall is a ledger that reports
          aggregate realized value without comparison against
          projection. d32&rsquo;s discipline is the variance
          attribution — projected $14.4M, realized $11.2M, gap $3.2M,
          attribution 75/25, owner Karen, next review Month 21. Anyone
          reading the ledger 3 years from now will see exactly where
          the gap came from and whether it closed.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Where the story ends</Eyebrow>
        <SectionTitle>The event is closed</SectionTitle>
        <Lead>
          MERI-MERIDIAN-HEALTH-CLOUD-2026 closes at Month 18 with the
          d32 ledger committed, the structural fixes carried forward,
          and the next event (Tier-2 DR, 2027) opening with the
          learning-review inputs from this one. Marcus signs the event
          archive on Month 18. Sarah co-signs. The canvas snapshots a
          final immutable record.
        </Lead>
        <BodyP>
          From Day 1 (Marcus walks into Janet&rsquo;s office with the
          lease letter) to Month 18 (Atlas&rsquo;s d32 ledger commits),
          we ran one $40M sourcing event end-to-end. We made one
          structural mistake (under-enumerated Cloverleaf
          integrations); we had one big win (caught Vendor A&rsquo;s
          egress trap pre-BAFO); we honored the procurement
          discipline at every gate. The cumulative realized value at
          Month 18 is $11.2M against a projection of $14.4M. The
          5-year refresh projects $67.2M against the original
          committed $70M. Variance −4%. Owner named. Recovery scheduled.
        </BodyP>
        <BodyP>
          That&rsquo;s the case study. Read it again, in order, the
          next time you open a real event in Source.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
