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
  T,
} from '@/components/home/learn/primitives';
import {
  ChapterShell,
  StoryRecap,
  GateStatusBox,
  PitfallBox,
  ArtifactSpecimen,
  AgentSplitBox,
} from './_shell';

export function Ch07BafoChapter() {
  return (
    <ChapterShell slug="bafo">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 07 · Stage 07 BAFO</Eyebrow>
        <SectionTitle light size="xl">Day 65. Vendor A drops; B wins.</SectionTitle>
        <Lead light>
          Twelve BAFO questions across three vendors. Vendor A refuses to
          remove the 7-year exclusivity clause and walks. Vendor D caps the
          escalator at 5% but won&rsquo;t go to 4%. Vendor B accepts the
          scope correction, comes back at $9.4M committed, and wins on
          price + clean trap closure. The shape of the deal locks here.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Pricing closed with B at 87, A at 76 (2 P0s open), D at 75 (1 P0
        open). Janet has spent the last 5 days authoring d22 — the BAFO
        question pack — with Sentinel binding to d20 and the d09
        commitment language. Today she sends 12 questions to two finalists.
        (Vendor A&rsquo;s pack arrived first; their initial decline drives
        the rest of the chapter.) The job here is to either close the open
        P0s or close the vendor.
      </StoryRecap>

      <Section>
        <Eyebrow>The d22 pack structure</Eyebrow>
        <SectionTitle>Two question patterns, used differently</SectionTitle>
        <Lead>
          Sentinel&rsquo;s BAFO question generator emits questions in two
          canonical shapes. Knowing the shapes helps the reader see why
          some vendors close cleanly and others walk.
        </Lead>

        <SubHead>Pattern 1 · Assumption-correction</SubHead>
        <BodyP>
          Used when a vendor has priced or committed against an
          assumption that diverges from d05/d21. The question states the
          authority assumption explicitly, asks the vendor to confirm the
          corrected commitment, and offers a single response slot. Low
          friction for the vendor; mechanically closeable.
        </BodyP>

        <SubHead>Pattern 2 · Lock-in-removal</SubHead>
        <BodyP>
          Used when a vendor has included a structural commitment
          (multi-year exclusivity, asymmetric egress, super-priority
          renewal) inconsistent with the d01 strategic posture. The
          question states the strategic posture, names the offending
          clause, and asks the vendor to remove or cap it to a stated
          maximum. Higher friction; the vendor has to give up something
          that cost their commercial team negotiating capital.
        </BodyP>

        <Callout
          kind="info"
          icon="🪙"
          label="Pattern shape signals difficulty"
        >
          Pattern-1 questions close ~95% of the time. Pattern-2 questions
          close ~60% of the time and are the ones that close vendors
          out. Knowing the pattern lets Janet model BAFO outcomes — if
          the open P0s on a vendor are mostly Pattern 1, expect closure;
          if they&rsquo;re mostly Pattern 2, expect resistance or
          withdrawal.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 60 · The pack issued</Eyebrow>
        <SectionTitle>Twelve questions, three vendors</SectionTitle>
        <Lead>
          Janet&rsquo;s d22 pack distribution: A gets 7 questions (3 P0s
          + 1 P1 + 3 follow-ons), B gets 5 (1 P1 + 4 follow-ons), D gets
          7 (1 P0 + 6 follow-ons). The follow-on questions are technical
          clarifications — DR architecture, transition checkpoints, BAA
          redline acceptance.
        </Lead>

        <SubHead>Specimen Pattern-2 question · sent to Vendor A</SubHead>
        <ArtifactSpecimen
          code="d22"
          title="Question A.3 · §7.4 exclusivity clause removal"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Authority.</strong> The Meridian d01 strategic
            posture (issued with d09) explicitly maintains
            &ldquo;optionality on workload placement&rdquo; over the
            5-year term. The d09 question 5 (Egress + Exit) requires
            commercial mechanics for end-of-term exit.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Observation.</strong> Vendor A&rsquo;s commercial
            section §7.4 (&ldquo;During the initial term and any
            renewal, Buyer shall not procure equivalent infrastructure
            services from any third party&rdquo;) creates a 7-year
            effective exclusivity inconsistent with the strategic
            posture and denies the d09 q5 exit mechanic.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Required response.</strong> Either (a) remove §7.4
            entirely, or (b) cap the exclusivity to 12 months from
            contract effective date with no automatic renewal.
            Alternative proposals will not be accepted.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Response slot.</strong> One required field —{' '}
            <em>&ldquo;Removed&rdquo;</em>,{' '}
            <em>&ldquo;Capped to 12 months&rdquo;</em>, or{' '}
            <em>&ldquo;Decline&rdquo;</em>. Free-text rationale optional.
          </p>
        </ArtifactSpecimen>

        <SubHead>Specimen Pattern-1 question · sent to Vendor B</SubHead>
        <ArtifactSpecimen
          code="d22"
          title="Question B.1 · workload count correction"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Authority.</strong> The Meridian d05 scope memo
            (issued with d09 as Appendix B) names 280 in-scope production
            workloads, with the per-tier breakdown in d04 (Appendix C).
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Observation.</strong> Vendor B&rsquo;s d19a
            workload-by-tier rollup sums to 203, which is 77 short of the
            280 in-scope count. The deviation is consistent with a
            scope-read at the application layer that did not include
            in-house apps marked Tier-3 in d04.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Required response.</strong> Confirm pricing for the
            full 280 workloads at the unit pricing already submitted.
            Provide an updated d19a rollup that sums to 280. Indicate
            whether the additional 77 workloads will be priced at the
            stated Tier-3 unit cost or at a different schedule.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Response slot.</strong> Updated d19a workbook +
            confirmation that committed price scales with workload count.
          </p>
        </ArtifactSpecimen>

        <BodyP>
          Note the difference. Pattern-2 (A.3) is binary — remove, cap,
          or decline. There&rsquo;s no negotiating room on the question
          itself; the vendor either accepts the strategic posture or they
          don&rsquo;t. Pattern-1 (B.1) is mechanical — confirm the
          corrected total at the unit pricing already submitted. There&rsquo;s
          almost no way for B to refuse this and look reasonable.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 62 · Vendor A&rsquo;s decline</Eyebrow>
        <SectionTitle>The exclusivity clause is non-negotiable</SectionTitle>
        <Lead>
          Vendor A&rsquo;s response arrives 48 hours after issuance —
          unusually fast, which is itself a signal. They accept removing
          the BAA encryption-at-rest line (P1, easy). They propose
          adjusting the egress schedule to a tiered structure that{' '}
          <em>looks</em> better but still computes to ~$3.6M / 5-year on
          Sentinel&rsquo;s remodel (vs A&rsquo;s original $4.14M). On
          §7.4 exclusivity: <em>decline</em>.
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Re-ran trap-egress-asymmetric@v1.4 against A&rsquo;s
                revised egress schedule. Updated TCO impact from +24% to
                +21% — still P0. Logged the §7.4 decline and recomputed
                the lock-in profile: A is still proposing a 7-year
                effective exclusivity with a $14M-class exit fee. d20
                entry updated.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Took the §7.4 decline to Marcus. Marcus&rsquo;s read:
                exclusivity clauses of this length on infrastructure
                contracts are unsigned in the modern market, and
                accepting one when the strategy explicitly preserves
                optionality would be self-defeating. He authorizes
                Janet to close A out.
              </>
            ),
          }}
        />

        <BodyP>
          Janet asks Sentinel to draft the day-62 vendor letter to A.
          Sentinel produces a clean, factual paragraph: the BAFO
          response retained §7.4 unchanged; this clause is inconsistent
          with Meridian&rsquo;s strategic posture; Vendor A is therefore
          withdrawn from further consideration; a formal close-out letter
          will follow in Stage 9. Janet sends. Vendor A&rsquo;s status
          flips to <em>withdrawn at BAFO</em>. The pool is now two.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 63–64 · D and B respond</Eyebrow>
        <SectionTitle>D caps at 5%; B comes back clean</SectionTitle>

        <SubHead>Vendor D · 5% cap, not 4%</SubHead>
        <BodyP>
          D&rsquo;s response on the escalator: they will cap at 5% YoY
          for the 5-year term, not 4%. The 4% in the d21 assumption set
          was the protected-stated escalator; vendors were not bound to
          accept it but the d22 question explicitly framed it as the
          required response. D&rsquo;s offer is a partial close — better
          than 8%, worse than the assumption.
        </BodyP>
        <BodyP>
          Sentinel re-runs the TCO model with D&rsquo;s 5% cap: 5-year
          TCO drops from $54.2M (8%) to $52.4M (5%) vs the protected-4%
          model at $51.0M. Gap to assumption: $1.4M over 5 years.
          Sentinel flags this as a P1 residual — not deal-shaping, but
          not a clean close either.
        </BodyP>

        <SubHead>Vendor B · scope correction + shaped pricing</SubHead>
        <BodyP>
          B&rsquo;s response on the workload count: confirmed pricing for
          the full 280 workloads at the unit pricing already submitted.
          They also volunteer a 4% blended discount on Tier-2 unit pricing
          conditional on a 5-year initial term commitment (no renewal
          lock-in). The discount is a sales move; Sentinel logs it but
          doesn&rsquo;t change the d20 status — it&rsquo;s additive, not a
          trap.
        </BodyP>
        <BodyP>
          B&rsquo;s revised year-1 commitment lands at <strong>$9.4M
          annual</strong>, down from their initial $11.0M. Five-year TCO
          at the protected-4% escalator: <strong>$50.9M</strong>.
        </BodyP>

        <ArtifactSpecimen
          code="d22"
          title="BAFO closure summary · Day 65"
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid #D1D5DB' }}>
                <th style={{ padding: '6px 8px' }}>Vendor</th>
                <th style={{ padding: '6px 8px' }}>P0 closures</th>
                <th style={{ padding: '6px 8px' }}>Year-1 committed</th>
                <th style={{ padding: '6px 8px' }}>5-yr TCO</th>
                <th style={{ padding: '6px 8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>A</td>
                <td style={{ padding: '6px 8px' }}>0 of 2 (declined §7.4)</td>
                <td style={{ padding: '6px 8px' }}>—</td>
                <td style={{ padding: '6px 8px' }}>—</td>
                <td style={{ padding: '6px 8px', color: T.amber, fontWeight: 700 }}>Withdrawn</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                <td style={{ padding: '6px 8px' }}>B</td>
                <td style={{ padding: '6px 8px' }}>1 of 1 (P1 closed)</td>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>$9.4M</td>
                <td style={{ padding: '6px 8px', fontWeight: 700 }}>$50.9M</td>
                <td style={{ padding: '6px 8px', color: T.teal, fontWeight: 700 }}>Close</td>
              </tr>
              <tr>
                <td style={{ padding: '6px 8px' }}>D</td>
                <td style={{ padding: '6px 8px' }}>0.5 of 1 (5% cap, not 4%)</td>
                <td style={{ padding: '6px 8px' }}>$10.8M</td>
                <td style={{ padding: '6px 8px' }}>$52.4M</td>
                <td style={{ padding: '6px 8px' }}>Open · P1 residual</td>
              </tr>
            </tbody>
          </table>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>The decision is now obvious</Eyebrow>
        <SectionTitle>B wins on price, scope correction, and trap closure</SectionTitle>
        <Lead>
          With A withdrawn and D at $52.4M with a residual escalator
          deviation, Vendor B at $50.9M with all traps closed is the
          clear choice. The combined d16 score updates to B 87, D 75.
          Pricing differential is $1.5M over 5 years. Janet authors the
          recommendation memo for d24.
        </Lead>

        <PitfallBox
          kind="avoided"
          title="Don&rsquo;t accept partial closure on a P0"
        >
          The temptation with D&rsquo;s 5% cap is to call it a win — they
          moved! 5% is better than 8%! But the d21 assumption was 4%, and
          accepting 5% means the rest of the BAFO closures at other
          vendors got measured against a different bar. Janet&rsquo;s
          right call: D&rsquo;s response is a P1 residual, not a P0
          closure, and B&rsquo;s clean closure is what wins. If
          B&rsquo;s pricing had been worse, D&rsquo;s 5% cap would still
          have been an open question — not a tie-breaker.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 7 closes; rail advances to Decision</SectionTitle>
        <GateStatusBox
          stage="Stage 7 · BAFO"
          rows={[
            {
              text: 'd22 question pack issued to all surviving vendors',
              status: 'met',
            },
            {
              text: 'All P0 traps either closed or vendor withdrawn',
              status: 'met',
            },
            {
              text: 'Updated d19 + d16 reflect BAFO closures',
              status: 'met',
            },
            {
              text: 'Recommendation framed for d24 (Vendor B at $9.4M / yr committed)',
              status: 'met',
            },
          ]}
        />
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>BAFO in 5 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          d22 BAFO question pack · 12 questions across 3 vendors. Three
          BAFO response packets (A&rsquo;s decline, D&rsquo;s 5% cap,
          B&rsquo;s clean close). Updated d20 (egress remodel for A&rsquo;s
          revised schedule). Updated d19 + d16 reflecting BAFO closures.
          One day-62 close-out note to Vendor A.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Vendor A withdrawn. Vendor B selected at $9.4M annual committed
          / $50.9M 5-year TCO. Vendor D second with a P1 residual on the
          escalator. Pricing differential between B and D is $1.5M over
          5 years; trap closure differential is binary (B clean, D not).
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          Marcus + Sarah haven&rsquo;t signed yet. The d24 brief is
          drafted but unsigned. The vendor letters haven&rsquo;t gone
          out. And the 6-month cutover plan B proposed will turn out to
          be 2 months optimistic — but that&rsquo;s 33 days from now.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
