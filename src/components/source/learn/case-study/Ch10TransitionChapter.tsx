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

export function Ch10TransitionChapter() {
  return (
    <ChapterShell slug="transition">
      <HeroBand color="teal">
        <Eyebrow light>Meridian Case Study · Chapter 10 · Stage 10 Transition</Eyebrow>
        <SectionTitle light size="xl">Day 100 → Month 9. The 2-month slip.</SectionTitle>
        <Lead light>
          Contract executed Day 100. Migration kickoff Day 105. By Month
          3 the cutover plan is in good shape. By Month 5 Cloverleaf has
          revealed it has 47 custom integrations the scope memo
          didn&rsquo;t enumerate. Day-1 checkpoint moves from Month 7 to
          Month 9. Patricia Singh (COO) gets her first inbound on this
          program in 14 weeks.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Vendor B knows they&rsquo;ve won. The MSA + BAA + DPA take 2
        weeks; contract is fully executed on Day 100. Janet hands the
        day-to-day relationship over to Karen Liu and her migration
        program team. We&rsquo;re now out of the Source canvas as the
        primary surface — Tower (Atlas&rsquo;s home) takes over for
        execution tracking. The job of this chapter is the discipline of
        watching a real cutover unfold and surfacing variance honestly.
      </StoryRecap>

      <Section>
        <Eyebrow>Day 100–105 · Contract + kickoff</Eyebrow>
        <SectionTitle>What clean execution looks like</SectionTitle>
        <Lead>
          The first 5 days post-Selection are clean. MSA + BAA + DPA
          execute on Day 100 (one delay: Vendor B redlines a single DPA
          clause around sub-processor notification, which Karen accepts).
          Migration kickoff on Day 105 with Karen, the Vendor B technical
          account manager, two of Karen&rsquo;s principal architects, and
          a Cloverleaf integration lead.
        </Lead>
        <BodyP>
          Karen authors d28 (the transition runbook) over Days 100–115.
          Sentinel binds d28 to d24 (committed terms), d05 (in-scope
          systems), and the BAFO migration approach. The 6-month cutover
          plan from Vendor B&rsquo;s response becomes Section 4 of d28
          with named checkpoints: Month 1 (architecture lock), Month 2
          (Tier-3 lift-and-shift), Month 4 (Tier-1 first wave), Month 6
          (cutover + DR validation + go-live).
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Months 1–3 · Architecture lock</Eyebrow>
        <SectionTitle>The plan looks fine</SectionTitle>
        <Lead>
          Through the first three months the program is on track.
          Architecture lock completes Month 1; the 47 DR-IN systems are
          replicated to Vendor B&rsquo;s DR region by Month 2; the 180
          Tier-2/3 in-house apps complete migration in Month 3. Karen&rsquo;s
          weekly status to Marcus reads green-green-green. Atlas&rsquo;s
          Tower view shows the same.
        </Lead>
        <Callout
          kind="info"
          icon="🪪"
          label="Atlas tracks against d24, not against the runbook"
        >
          The Tower view in Atlas tracks against the d24-committed
          milestones (cutover Month 7, DR validation by cutover, value
          realization start at cutover). The d28 runbook checkpoints are
          internal to Karen&rsquo;s program. This is deliberate — d24 is
          the contract; d28 is the work. Variance against d24 is what
          flags executive attention.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Month 4 · The Cloverleaf surprise</Eyebrow>
        <SectionTitle>Forty-seven integrations, not one system</SectionTitle>
        <Lead>
          Tier-1 first-wave migration begins Month 4. Epic and MyChart
          are tractable; their migration patterns are documented and
          vendor B has migrated three Epic customers before this one.
          Cloverleaf is where things break.
        </Lead>
        <BodyP>
          Karen&rsquo;s integration lead spends Week 16 doing real
          discovery on the Cloverleaf instance. The number we already
          knew (47 integrations) is confirmed. What we didn&rsquo;t know:
          11 of those integrations rely on a specific 2019-era version
          of a Cloverleaf transformation engine that vendor B&rsquo;s
          target platform doesn&rsquo;t support. Each one needs to be
          rewritten to a modern API surface — work neither party scoped
          for.
        </BodyP>
        <BodyP>
          Karen escalates to Janet. Janet looks back at d05 (the scope
          memo) — Cloverleaf is listed as one in-scope system. The 47
          integrations were never enumerated. The d20 trap log
          didn&rsquo;t catch this because it&rsquo;s a discovery-phase
          finding, not a pricing trap. We&rsquo;re paying for the
          decision Janet and Karen made on Day 4 to defer integration
          enumeration to the vendor (see Chapter 2).
        </BodyP>

        <PitfallBox
          kind="missed"
          title="Scope memo enumerated systems, not integrations"
        >
          The Chapter 2 PitfallBox foreshadowed exactly this. The
          mitigation would&rsquo;ve been to either (a) enumerate the 47
          integrations directly in d05, which would have surfaced the
          11 incompatible ones during d09 / Stage 4 vendor responses,
          or (b) write a BAFO question explicitly on integration
          discovery (&ldquo;confirm migration plan addresses the 47
          Cloverleaf integrations enumerated in Appendix C&rdquo;).
          We did neither. The Chapter 11 variance is the cost.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>Month 5 · The slip is named</Eyebrow>
        <SectionTitle>Atlas surfaces the variance</SectionTitle>
        <Lead>
          Atlas&rsquo;s d29 milestone tracker registers Month 4 as
          orange (Tier-1 first wave delayed). By Month 5 it goes red.
          Atlas surfaces the variance with the named owner (Karen),
          measurement cadence (weekly), and impact on d24 commitments
          (cutover slip from Month 7 to Month 8 confirmed; Month 9
          worst-case under review).
        </Lead>

        <ArtifactSpecimen
          code="d29"
          title="Milestone tracker · Month 5 · variance entry"
        >
          <p style={{ marginBottom: 8 }}>
            <strong>Variance.</strong> Tier-1 first wave at 38% complete
            vs Month 4 plan of 65%. Driver: 11 of 47 Cloverleaf
            integrations require rewrite to modern API surface.
            Estimated rewrite effort: 6 weeks at 2 FTE (joint Vendor B +
            Meridian).
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Owner.</strong> Karen Liu (CIO). Joint accountability
            with Vendor B&rsquo;s technical account manager. Weekly
            status to Marcus and Janet. Patricia Singh (COO) added to
            the distribution starting Month 5.
          </p>
          <p style={{ marginBottom: 8 }}>
            <strong>Impact on d24.</strong> Cutover target slips from
            Month 7 (2027-03-01) to Month 9 (2027-05-01). Day-1 value
            realization starts 2 months later than committed. Five-year
            TCO unchanged; year-1 realized value reduces by ~$3.4M
            against straight-line projection.
          </p>
          <p style={{ marginBottom: 0 }}>
            <strong>Mitigation.</strong> Joint rewrite team stood up
            Month 5 Week 1. No additional commercial cost from Vendor
            B (rewrite scoped under their migration services line).
            Cloverleaf vendor brought in for transformation-engine
            consultation.
          </p>
        </ArtifactSpecimen>
      </Section>

      <Section>
        <Eyebrow>Month 5 · The escalation</Eyebrow>
        <SectionTitle>Patricia Singh enters the story</SectionTitle>
        <Lead>
          Patricia (COO) gets her first formal contact on this program
          14 weeks after Day 100. Karen&rsquo;s Month 5 status report
          gets routed to her by Marcus, who wants COO awareness on a
          program now carrying a 2-month slip. Patricia&rsquo;s response
          is short and procurement-discipline-shaped: <em>&ldquo;Thanks
          for surfacing this honestly. Let&rsquo;s name the variance,
          name the owner, and not pretend Month 7 is still the
          target.&rdquo;</em>
        </Lead>

        <AgentSplitBox
          agent={{
            who: 'Atlas',
            did: (
              <>
                Updated d29 with the new cutover target (Month 9 best
                estimate). Updated d24&rsquo;s linked
                value-realization model to start 2 months later than
                committed. Composed the Month-5 status memo for the
                Patricia / Marcus / Sarah distribution. Logged
                Patricia&rsquo;s acknowledgment as the program-level
                variance acceptance.
              </>
            ),
          }}
          human={{
            who: 'Patricia',
            did: (
              <>
                Acknowledged the variance instead of asking for a
                magical recovery plan. Decided not to escalate to the
                board; the variance is meaningful but inside the
                contractual boundaries (no penalty triggers). Asked
                Karen to lead a 1-hour learning review at Month 12 to
                feed forward into the Tier-2 DR follow-on event.
              </>
            ),
          }}
        />

        <BodyP>
          Patricia&rsquo;s response is what mature procurement looks
          like under bad news. The temptation is to mash on Karen for a
          recovery plan that gets us back to Month 7. The honest answer
          is the cutover plan was 2 months optimistic from the start
          because of a scope-memo gap, and pretending otherwise burns
          credibility. The 1-hour learning review at Month 12 is the
          structural fix.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Months 6–9 · Recovery + cutover</Eyebrow>
        <SectionTitle>The work happens; the rewrites land</SectionTitle>
        <Lead>
          The next four months are operational, not narrative-rich.
          Eleven Cloverleaf integrations rewrite cleanly across the
          joint team (Vendor B + Meridian + Cloverleaf vendor); two
          require a workaround that defers final fix to a Q4 2027
          maintenance window. Tier-1 first wave closes Month 6 (4
          weeks late). Tier-1 second wave closes Month 7 (2 weeks
          late). DR validation against the 47 systems closes Month 8
          (1 week late). Cutover lands Month 9 (Day 1 of cutover is
          2027-05-01, vs the d24-committed 2027-03-01).
        </Lead>
      </Section>

      <Section>
        <Eyebrow>Day 1 · Month 9</Eyebrow>
        <SectionTitle>The day-1 checkpoint</SectionTitle>
        <Lead>
          Atlas&rsquo;s d30 day-1 checkpoint runs at Month 9 (vs the
          d24-committed Month 7). The checkpoint is binary: have we
          successfully cut over, are the 47 DR-IN systems active in DR,
          and is value realization (cost reduction relative to colo
          baseline) measurable?
        </Lead>

        <GateStatusBox
          stage="Stage 10 · Transition · Day-1 checkpoint at Month 9"
          rows={[
            {
              text: 'All 280 in-scope workloads operating on Vendor B platform',
              status: 'met',
            },
            {
              text: '47 DR-IN systems validated in DR with RPO ≤ 4hr / RTO ≤ 8hr',
              status: 'met',
            },
            {
              text: 'Cloverleaf integrations operational (45 of 47 live; 2 on workaround pending Q4 2027)',
              status: 'overridden',
            },
            {
              text: 'Cutover at d24-committed Month 7',
              status: 'overridden',
            },
            {
              text: 'Run-rate cost reduction measurable against colo baseline',
              status: 'met',
            },
          ]}
        />

        <BodyP>
          Two criteria override: cutover landed at Month 9 not Month 7
          (variance acknowledged by Patricia); 2 of 47 Cloverleaf
          integrations on workaround. Both overrides are documented
          with rationale + remediation owner + remediation date. The
          d29 milestone tracker is now stable; ownership transfers to
          Atlas&rsquo;s d32 value ledger for Chapter 11.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Transition in 9 months (vs 7 committed)</SectionTitle>
        <SubHead>The artifacts</SubHead>
        <BodyP>
          d28 transition runbook · 6-month cutover plan, executed in 9.
          d29 milestone tracker · 22 milestones, 4 with variance
          entries, 1 red (the cutover) acknowledged at Month 5. d30
          day-1 checkpoint · 5 criteria, 3 met, 2 overridden with
          documented rationale.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          The cutover happened. The slip is owned and named. The d24
          commitments stand contractually but the realized timeline
          shifted 2 months. The Tier-2 DR follow-on event in 2027 will
          carry a learning-review input that says <em>&ldquo;enumerate
          middleware integrations in scope, not just systems.&rdquo;</em>
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          We don&rsquo;t know yet how the realized value compares to
          the projected value over a long-enough window for the
          variance to settle. Year-1 will look bad; Year-2 should
          recover. That&rsquo;s the Chapter 11 question — and the
          answer turns out to be specific.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
