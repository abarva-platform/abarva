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

export function Ch08DecisionChapter() {
  return (
    <ChapterShell slug="decision">
      <HeroBand color="purple">
        <Eyebrow light>Meridian Case Study · Chapter 08 · Stage 08 Decision</Eyebrow>
        <SectionTitle light size="xl">Day 90. CTO + CFO sign d24.</SectionTitle>
        <Lead light>
          Atlas (not Sentinel) composes the decision brief. The lead-agent
          handoff is deliberate — d24 reads to the procurement panel
          differently than the working artifacts that preceded it. Marcus
          signs at 11:00 a.m.; Sarah signs at 4:30 p.m. after a 90-minute
          challenge session on the value-realization model. Vendor B is
          the choice.
        </Lead>
      </HeroBand>

      <StoryRecap>
        BAFO closed on Day 65 with A withdrawn, B clean at $9.4M, D
        residual. Janet has spent the 25 days since putting the
        cumulative event state into shape for d24 composition — d20 trap
        log finalized, d16 scoring locked, d19 normalized, d22 closure
        summary stamped. Today the decision sponsor and concurrence sign,
        and the vendor letters can go out tomorrow.
      </StoryRecap>

      <Section>
        <Eyebrow>The agent handoff</Eyebrow>
        <SectionTitle>Why Atlas, not Sentinel, composes d24</SectionTitle>
        <Lead>
          d01 through d22 are working artifacts — Sentinel&rsquo;s native
          surface. d24 is the executive decision brief. Atlas (the Tower
          and Decision agent) takes the handoff because the audience is
          not the working team but the procurement panel, the board
          (eventually), and the audit trail.
        </Lead>
        <BodyP>
          The shape of d24 is different. It opens with the
          recommendation, not the analysis. The decision criterion is
          named first; the supporting evidence follows. The trap
          closures appear as resolved items, not as live concerns. The
          dollar figures are committed numbers, not scenario bands. This
          is a contract, not a working memo.
        </BodyP>

        <Callout
          kind="info"
          icon="🤝"
          label="Two agents, one event"
        >
          Sentinel runs Stages 1–7 and Stage 9. Atlas runs Stage 8 and
          Stage 11. Stage 10 (Transition) is co-led — Atlas owns the
          milestones, Sentinel owns the operational checkpoints. The
          chat lane changes the lead-agent label when the rail advances
          to Stage 8. Receipts on d24 name Atlas, not Sentinel.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Day 88 · d24 generation</Eyebrow>
        <SectionTitle>What Atlas composed and what survived review</SectionTitle>
        <Lead>
          Janet clicks Generate on the d24 card. Atlas binds 8 upstream
          artifacts: d01 (strategic posture), d05 (scope), d16 (final
          scoring), d19 (normalized pricing), d20 (trap log), d22 (BAFO
          closure summary), d11 (response completeness), and the event
          metadata. Composition takes 4 minutes 30 seconds.
        </Lead>

        <ArtifactSpecimen
          code="d24"
          title="Decision brief · Meridian Health Cloud (excerpt)"
        >
          <p style={{ marginBottom: 10 }}>
            <strong>Recommendation.</strong> Award the Meridian Health
            Cloud &amp; Infrastructure event to <strong>Vendor B</strong>{' '}
            at $9.4M committed annual run-rate. Five-year TCO at the
            protected-4% escalator: $50.9M. Term: 5 years initial, no
            automatic renewal. Effective date: 2026-09-01 (Day 100).
            Cutover target: 2027-03-01 (Month 7).
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Decision criterion.</strong> Highest combined
            d16 score (87 of 100) with all P0 traps closed in BAFO and
            committed pricing inside the d01 value band ($8M–$12M
            annual). Pricing differential to second-place finisher
            (Vendor D, $52.4M 5-yr TCO): $1.5M over 5 years. Vendor D
            carries an open P1 residual on escalator (capped at 5% vs
            assumption-stated 4%) that Vendor B does not.
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Value at stake.</strong> $40M committed over 5
            years (vs alternative continuation in Newark colo at 18%
            YoY escalation, modeled at $54M cumulative).{' '}
            <strong>Net value differential vs status quo: $14M
            over 5 years.</strong>
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Risk profile.</strong> Migration complexity for
            Cloverleaf integration middleware is the principal risk;
            B&rsquo;s migration plan addresses it but discovery during
            transition may extend the cutover window. DR posture for
            47 Tier-1 systems clean; BAA + DPA accepted with standard
            redlines.
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>BAFO closures.</strong> 1 of 1 P0 trap closed on
            Vendor B (workload count corrected from 203 → 280 at
            committed unit pricing). Full d20 trap log attached as
            Appendix B.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Signatures required.</strong> CTO Marcus Webb
            (decision sponsor) · CFO Sarah Kim (concurrence). Karen
            Liu (CIO, day-to-day owner) acknowledges receipt of the
            transition obligations.
          </p>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>Day 89 · Sarah&rsquo;s challenge session</Eyebrow>
        <SectionTitle>The 90-minute review on value-realization assumptions</SectionTitle>
        <Lead>
          CFO Sarah Kim does not sign d24 on first read. She schedules a
          90-minute review with Janet, Karen, and an analyst from her
          team. Three challenges, all of which have been anticipated by
          Atlas in the brief, but Sarah wants to hear the answers from
          named humans before she co-signs.
        </Lead>

        <SubHead>Challenge 1 · Is &ldquo;workload growth flat&rdquo; realistic?</SubHead>
        <BodyP>
          Sarah&rsquo;s point: the d21 assumption set says workload growth
          is flat over 5 years; in reality Meridian opens 2 new clinics in
          2027 and 1 in 2029, each of which adds load. Karen&rsquo;s
          response: the new clinics&rsquo; workloads are inside the 280
          count (existing in-house apps just running on more endpoints);
          per-endpoint load growth is what would bend the assumption.
          Sentinel&rsquo;s archive of 6-year IT-load data shows
          per-endpoint compute flat to slightly declining. The assumption
          holds.
        </BodyP>

        <SubHead>Challenge 2 · Why $14M differential, not $20M?</SubHead>
        <BodyP>
          Sarah&rsquo;s point: the colo continuation alternative is
          modeled at $54M cumulative; the cloud alternative is $40M
          committed; cloud also has $4M of one-time transition cost
          (modeled in d23, not d19). So the real differential is closer
          to $10M, not $14M. Janet&rsquo;s response: agreed, the brief
          should call out the $4M transition cost line; the net is
          $10M, which is still material against the value band but
          isn&rsquo;t the headline figure d24 currently shows. They
          edit the brief to read &ldquo;$10M net of transition cost,
          $14M ignoring transition.&rdquo;
        </BodyP>

        <AgentSplitBox
          agent={{
            who: 'Atlas',
            did: (
              <>
                Re-read the d23 transition cost line item ($4.0M one-time
                across migration services + cutover ops + parallel-run
                period). Updated the d24 net-value-differential clause
                with both figures. Logged the edit on the brief
                provenance receipt as &ldquo;edited since
                generation.&rdquo;
              </>
            ),
          }}
          human={{
            who: 'Sarah',
            did: (
              <>
                Pushed Janet to make the transition cost explicit. Her
                concern: a $4M cost line buried in a different artifact
                will be challenged at the audit committee in 6 months.
                Better to surface it in the headline brief than discover
                it in the audit.
              </>
            ),
          }}
        />

        <SubHead>Challenge 3 · What if the cutover slips?</SubHead>
        <BodyP>
          Sarah&rsquo;s most prescient question. The d24 brief states a
          March 2027 cutover (Month 7). What happens to the value model
          if cutover slips to Month 8 or Month 9? Janet&rsquo;s response:
          every month of slip delays the start of value realization,
          pushing $1.7M of expected savings out by one month per month
          of slip. A 2-month slip would dent year-1 realized value by
          $3.4M without changing the 5-year total — but year-1 board
          reporting will look worse.
        </BodyP>
        <BodyP>
          This conversation foreshadows Chapter 11 exactly. The cutover
          will slip 2 months. The value model will dent by ~$3.2M in
          year 1 (close to Sarah&rsquo;s $3.4M number). And Atlas&rsquo;s
          d32 ledger will surface the variance with named owner — exactly
          the discipline Sarah is asking for here.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Day 90 · Signatures</Eyebrow>
        <SectionTitle>11:00 a.m. and 4:30 p.m.</SectionTitle>
        <Lead>
          Marcus signs d24 at 11:00 a.m. after a 20-minute walk-through
          with Janet. Sarah signs at 4:30 p.m. after the challenge
          session edits land. Karen acknowledges receipt of the
          transition obligations the same afternoon. The brief is
          locked.
        </Lead>

        <ArtifactSpecimen
          code="d24"
          title="Signature block · final"
        >
          <p style={{ marginBottom: 6 }}>
            <strong>CTO Marcus Webb</strong> · Decision sponsor · 2026-06-08 11:04 EST
          </p>
          <p style={{ marginBottom: 6 }}>
            <strong>CFO Sarah Kim</strong> · Concurrence · 2026-06-08 16:32 EST
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>CIO Karen Liu</strong> · Day-to-day owner · acknowledges transition obligations · 2026-06-08 17:11 EST
          </p>
        </ArtifactSpecimen>

        <PitfallBox
          kind="avoided"
          title="The CFO challenge session has its own time on the calendar"
        >
          The pitfall is treating CFO concurrence as a rubber stamp. Sarah&rsquo;s
          three challenges all surfaced real edits — the transition cost
          line in particular would&rsquo;ve become an audit-committee problem
          if it had stayed buried. Putting a 90-minute review on the
          calendar between draft and signature is not friction; it&rsquo;s the
          quality gate. Future events should default-schedule it.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Gate status</Eyebrow>
        <SectionTitle>Stage 8 closes; rail advances to Selection</SectionTitle>
        <GateStatusBox
          stage="Stage 8 · Decision"
          rows={[
            {
              text: 'd24 decision brief authored, locked, signed by named decision sponsor + concurrence',
              status: 'met',
            },
            {
              text: 'Day-to-day owner acknowledges transition obligations on the brief',
              status: 'met',
            },
            {
              text: 'Net value differential stated with and without transition cost (per Sarah&rsquo;s challenge)',
              status: 'met',
            },
            {
              text: 'All P0 traps documented as closed on the chosen vendor',
              status: 'met',
            },
          ]}
        />
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Decision in 25 days from BAFO close</SectionTitle>
        <SubHead>The artifact</SubHead>
        <BodyP>
          One d24 decision brief. ~1,800 words, 8 upstream artifacts
          bound, signed by 2 sponsors with a 3rd acknowledgment.
          Provenance receipt names model{' '}
          <em>claude-sonnet-4-6</em>, agent <em>Atlas</em>, prompt
          template <em>decision-brief@v2.1</em>, upstream codes d01 d05
          d11 d16 d19 d20 d22 + event metadata, tokens 18,400 in / 4,200
          out, stop reason <em>end_turn</em>, generated by Janet on
          Day 88, edits applied on Day 89.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Vendor B awarded at $9.4M committed annual / $50.9M 5-year
          TCO. Effective Day 100 (2026-09-01). Cutover target Month 7
          (2027-03-01). All P0 traps closed; one P1 residual on Vendor D
          documented but not material to the choice.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          Vendor B doesn&rsquo;t know they&rsquo;ve won yet — the
          letters go out tomorrow (Chapter 9). Vendors A and D
          don&rsquo;t know they&rsquo;ve lost. The 6-month cutover plan
          is committed but Cloverleaf is about to surprise everyone.
          The value-realization clock starts on Day 100; it doesn&rsquo;t
          start counting until the contract is signed.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
