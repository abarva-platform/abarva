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

export function Ch09SelectionChapter() {
  return (
    <ChapterShell slug="selection">
      <HeroBand color="teal">
        <Eyebrow light>Meridian Case Study · Chapter 09 · Stage 09 Selection</Eyebrow>
        <SectionTitle light size="xl">Day 95. One winner letter, two loser letters.</SectionTitle>
        <Lead light>
          Sentinel takes the lead-agent role back from Atlas to draft the
          three vendor letters. The shape of each is different: B gets a
          welcome with day-1 expectations; A gets a courteous close-out
          naming the exclusivity-clause concern; D gets a courteous
          close-out with the rubric breakdown showing exactly where they
          finished. The audit trail is whole.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Marcus and Sarah signed d24 on Day 90. The decision is final. The
        vendors are still in the dark — A and D haven&rsquo;t been told
        formally that they lost (A withdrew at BAFO; D&rsquo;s position
        was open until d24 closed). The job of this chapter is the
        professional courtesy of telling each vendor where they stand,
        with enough specifics that they can do better next time.
      </StoryRecap>

      <Section>
        <Eyebrow>The three letter shapes</Eyebrow>
        <SectionTitle>Why the loser letters are detailed, not vague</SectionTitle>
        <Lead>
          The temptation in loser letters is to be vague —{' '}
          <em>&ldquo;we have selected another partner.&rdquo;</em> That
          serves no one. The vendor doesn&rsquo;t know what to fix; the
          buyer&rsquo;s reputation in the market suffers; the audit trail
          looks evasive. A detailed loser letter — naming the rubric
          rank, the specific concern that closed them out, and the
          procedural fairness applied — is the professional standard.
        </Lead>
      </Section>

      <Section>
        <Eyebrow>Day 95 · Letter to Vendor B</Eyebrow>
        <SectionTitle>The winner letter (d27)</SectionTitle>
        <Lead>
          Sentinel composes d27 from d24 + the BAFO closure summary +
          the d09 cover note. Janet reviews and personalizes the
          opening; the rest is mechanical.
        </Lead>

        <ArtifactSpecimen
          code="d27"
          title="Winner letter · Vendor B (excerpt)"
        >
          <p style={{ marginBottom: 8 }}>
            Dear [B account team],
          </p>
          <p style={{ marginBottom: 8 }}>
            Following the conclusion of our Cloud &amp; Infrastructure
            sourcing event (event code MERI-MERIDIAN-HEALTH-CLOUD-2026),
            Meridian Health is pleased to award the engagement to
            [Vendor B]. The decision was approved on June 8 by CTO
            Marcus Webb (decision sponsor) and CFO Sarah Kim (concurrence).
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Award terms.</strong> $9.4M committed annual run-rate
            · 5-year initial term · 4% protected annual escalator · no
            automatic renewal · workload count 280 at the per-tier unit
            pricing in your BAFO submission · DR for the 47 named Tier-1
            systems with 4-hour RPO / 8-hour RTO.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Effective date.</strong> 2026-09-01. The transition
            window opens on the effective date with a 6-month cutover
            target (2027-03-01).
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Day-1 expectations.</strong> (1) Master Service
            Agreement and BAA / DPA executed by Day 100. (2) Migration
            kickoff with Karen Liu&rsquo;s team and a named technical
            account manager by Day 105. (3) First DR architecture review
            by Day 130. The full transition runbook (d28) will be co-
            authored over Days 100–115.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Procedural notes.</strong> The d24 decision brief is
            attached. Your BAFO closure on the workload count correction
            (203 → 280) is part of the contract. The d20 trap log notes
            that no P0 traps remained open on your submission at award.
          </p>
          <p style={{ marginBottom: 0 }}>
            Best regards,<br />Janet Fischer · VP IT Ops · Meridian Health
          </p>
        </ArtifactSpecimen>

        <BodyP>
          The day-1 expectations paragraph is the hinge. The
          procurement panel will read this letter and check at month 4
          whether each numbered expectation was met. (Expectation 3
          turns out to be the early signal that the cutover is slipping
          — see Chapter 10.)
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 95 · Letter to Vendor A</Eyebrow>
        <SectionTitle>The loser letter, exclusivity-clause version</SectionTitle>
        <Lead>
          A&rsquo;s letter has to acknowledge the BAFO withdrawal as the
          formal closure point and provide enough specificity that the
          vendor understands what closed them out. Sentinel uses the
          d22 pattern-2 closure template.
        </Lead>

        <ArtifactSpecimen
          code="d27"
          title="Loser letter · Vendor A (excerpt)"
        >
          <p style={{ marginBottom: 8 }}>
            Dear [A account team],
          </p>
          <p style={{ marginBottom: 8 }}>
            Following the conclusion of our Cloud &amp; Infrastructure
            sourcing event, Meridian Health has selected another partner
            for award. We appreciate the quality of your submission and
            the depth of your team&rsquo;s engagement throughout the
            process.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Rubric position.</strong> [A] finished second on the
            partial-rubric blind score (82 of 100) and third on the
            combined score with commercial commitment included (76 of
            100). [A]&rsquo;s strengths were healthcare capability (14 /
            15) and account governance (8 / 10).
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Closure point.</strong> [A] withdrew at BAFO on
            Day 62 after declining to remove or cap the §7.4
            multi-year exclusivity clause. Meridian&rsquo;s strategic
            posture (issued in d09 with the RFP package) explicitly
            preserves &ldquo;optionality on workload placement&rdquo;
            over the 5-year term, and a 7-year effective exclusivity is
            inconsistent with that posture. We acknowledge that this
            clause is a commercial-team standard for [A]; we want to
            be candid that it is the principal reason [A] did not
            receive the award.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Other observations.</strong> The d20 trap log
            identified an asymmetric-egress structure (Appendix C of
            your submission) modeled at $4.14M / 5-yr; your BAFO
            response moved this to a tiered structure but did not
            materially reduce the modeled exit fee. Future engagements
            with Meridian would benefit from a more transparent egress
            schedule.
          </p>
          <p style={{ marginBottom: 0 }}>
            Best regards,<br />Janet Fischer · VP IT Ops · Meridian Health
          </p>
        </ArtifactSpecimen>

        <Callout
          kind="info"
          icon="🤝"
          label="Naming the closure point is a courtesy, not an attack"
        >
          The line <em>&ldquo;the principal reason [A] did not receive
          the award&rdquo;</em> is direct on purpose. Vague closure
          letters get vendors stuck in account-team
          post-mortems that go nowhere. A specific closure point lets
          the vendor&rsquo;s commercial team make a real decision —
          either revisit the exclusivity clause as a market-wide
          standard, or accept that this category of opportunity will
          regularly close them out.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 95 · Letter to Vendor D</Eyebrow>
        <SectionTitle>The loser letter, escalator-residual version</SectionTitle>
        <Lead>
          D&rsquo;s letter is harder to write than A&rsquo;s. D didn&rsquo;t
          withdraw — they finished the BAFO with a partial close (5% cap,
          not 4%). They lost on price + clean trap closure, both of which
          have to be named.
        </Lead>

        <ArtifactSpecimen
          code="d27"
          title="Loser letter · Vendor D (excerpt)"
        >
          <p style={{ marginBottom: 8 }}>
            Dear [D account team],
          </p>
          <p style={{ marginBottom: 8 }}>
            Following the conclusion of our Cloud &amp; Infrastructure
            sourcing event, Meridian Health has selected another partner
            for award. [D] finished as the second-ranked vendor on the
            combined score and was a serious contender through BAFO.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Rubric position.</strong> [D] finished third on the
            partial-rubric blind score (78 of 100) and second on the
            combined score with commercial commitment included (75 of
            100). [D]&rsquo;s strengths were account governance (9 /
            10) and operational maturity (8 / 10). The principal
            differentiation against the awarded vendor was a $1.5M
            5-year TCO gap and an open P1 residual on the YoY
            escalator clause.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Closure point.</strong> The Meridian d21 assumption
            set (issued with d09) protected an annual escalator at 4%.
            [D]&rsquo;s initial submission priced an 8% YoY escalator;
            BAFO question D.1 asked [D] to either accept 4% or withdraw.
            [D]&rsquo;s BAFO response capped the escalator at 5%, which
            we logged as a P1 residual. The awarded vendor closed all
            P0 traps and accepted the 4% protected escalator;
            year-on-year, the 1% escalator gap compounds to $1.5M of
            5-year TCO differential.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Other observations.</strong> [D]&rsquo;s migration
            approach (criterion 4) scored 11 / 15 — slightly below the
            other two finalists. Future submissions would benefit from
            specific named-checkpoint commitments rather than the
            phased-migration framing in the current response.
          </p>
          <p style={{ marginBottom: 0 }}>
            Best regards,<br />Janet Fischer · VP IT Ops · Meridian Health
          </p>
        </ArtifactSpecimen>

        <BodyP>
          Two lines do important work here. <em>&ldquo;[D] was a serious
          contender through BAFO&rdquo;</em> — credit where it&rsquo;s
          due, since D actually moved on the escalator and didn&rsquo;t
          walk like A did. <em>&ldquo;the 1% escalator gap compounds to
          $1.5M&rdquo;</em> — the math is named, so D&rsquo;s commercial
          team can decide whether 4% is acceptable next time.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Provenance and approval</Eyebrow>
        <SectionTitle>Each letter carries a receipt</SectionTitle>
        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Composed all three letters from the canonical d27
                template. Bound to d24 (decision criterion + signature
                block), d20 (trap closures per vendor), d22 (BAFO
                closure summary), d16 (rubric position per vendor).
                Generated each letter in &lt; 60 seconds. Logged tokens
                + provenance per letter.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Personalized the salutation on each letter. Sent the B
                letter at 9:14 a.m. (Day 95), then waited 30 minutes
                before sending A and D. Reason: gives B&rsquo;s
                account team a chance to call her with day-1 questions
                before the others learn the outcome via market
                grapevine.
              </>
            ),
          }}
        />
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 9 closes; rail advances to Transition</SectionTitle>
        <GateStatusBox
          stage="Stage 9 · Selection"
          rows={[
            {
              text: 'd27 winner letter authored, signed, sent, receipt logged',
              status: 'met',
            },
            {
              text: 'd27 loser letters authored with rubric breakdown + closure point named per vendor',
              status: 'met',
            },
            {
              text: 'Day-1 expectations communicated to winning vendor',
              status: 'met',
            },
            {
              text: 'All vendor close-out records updated in canvas',
              status: 'met',
            },
          ]}
        />

        <PitfallBox
          kind="avoided"
          title="Loser letters are specific, not vague"
        >
          A and D&rsquo;s letters each name (a) their rubric rank, (b)
          their criterion-level strengths, (c) the specific clause or
          number that closed them out, and (d) one observation each
          about future submissions. This is the procurement-discipline
          version of professional courtesy. Vague letters protect
          nobody and damage the buyer&rsquo;s market reputation over
          time.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Selection in 5 days</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          Three d27 letters · one winner, two losers · each carrying
          rubric breakdown + closure point + future-submission
          observation. Three vendor close-out records updated in
          canvas. One day-1 expectations checklist live for B.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          The vendors know. Vendor B is on track for Day-100 contract
          signing. Vendors A and D are formally closed out with
          specifics. Janet will hear from one of them within 48 hours
          (D&rsquo;s account exec calls to thank her for the candor of
          the letter — that&rsquo;s the market-reputation dividend of
          specific loser letters).
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know how the contract negotiation will land —
          MSA + BAA + DPA take roughly 2 weeks. We don&rsquo;t know how
          well the Day-1 expectations will be met. And we don&rsquo;t
          know that Cloverleaf is about to derail the cutover. The next
          chapter takes us out of the sourcing canvas and into
          execution.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
