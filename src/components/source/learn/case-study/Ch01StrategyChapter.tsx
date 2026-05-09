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

export function Ch01StrategyChapter() {
  return (
    <ChapterShell slug="strategy">
      <HeroBand color="navy">
        <Eyebrow light>Meridian Case Study · Chapter 01 · Stage 01 Strategy</Eyebrow>
        <SectionTitle light size="xl">Day 1. CTO names the trigger.</SectionTitle>
        <Lead light>
          Marcus Webb walks into Janet Fischer&rsquo;s office at 9:14 a.m. on a
          Tuesday with a printed lease renewal letter and a number circled in
          red — 18% YoY. By 4:30 p.m., d01 is drafted, the event is open in
          Source, and three gate criteria are visible. This chapter shows how
          a strategy memo gets from a meeting to an audit-ready artifact in
          one working day.
        </Lead>
      </HeroBand>

      <StoryRecap>
        We&rsquo;re at the very start. The event doesn&rsquo;t exist yet in
        Source. Marcus has decided cloud is the move; he hasn&rsquo;t yet
        committed scope, vendors, or budget. The job of this chapter is to
        get the &ldquo;why&rdquo; on paper precisely enough that the rest of
        the lifecycle can build on it.
      </StoryRecap>

      <Section>
        <Eyebrow>9:14 a.m. · The conversation</Eyebrow>
        <SectionTitle>What Marcus actually said</SectionTitle>
        <Lead>
          The trigger paragraph in d01 has to be specific enough that someone
          reading it cold in 18 months can recreate the decision context. So
          the source material matters.
        </Lead>
        <BodyP>
          Marcus&rsquo;s framing to Janet, paraphrased from her notes: the
          Newark colocation lease comes up Q3 2027. The renewal terms include
          an 18% YoY rate escalation clause that was negotiated in 2022 when
          rack space was tight; that clause survives any renewal. He has
          already taken &ldquo;rebuild bare-metal at a new colo&rdquo; off the
          table — talent costs, capex profile, and the strategic direction of
          Epic toward Hyperdrive on cloud all argue against it. So the move is
          cloud. The question is which cloud, on what terms, with what exit
          posture if it doesn&rsquo;t work.
        </BodyP>
        <BodyP>
          That last clause — <em>&ldquo;with what exit posture&rdquo;</em> —
          will show up four chapters from now as the reason Sentinel flags the
          Vendor A egress structure as P0. Strategy decisions echo through
          pricing.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>11:30 a.m. · Intake</Eyebrow>
        <SectionTitle>Janet opens Source and creates the event</SectionTitle>
        <Lead>
          The seven intake fields take Janet about 20 minutes to fill out. She
          uses Marcus&rsquo;s framing verbatim for the trigger paragraph —
          that text becomes the spine of d01.
        </Lead>
        <Callout
          kind="info"
          icon="📋"
          label="Meridian Health Cloud · MERI-MERIDIAN-HEALTH-CLOUD-2026"
        >
          <strong>Archetype:</strong> Cloud / Infrastructure ·{' '}
          <strong>Rigor:</strong> Standard ·{' '}
          <strong>Value band:</strong> $8M low / $12M high annual ·{' '}
          <strong>Sponsor:</strong> CTO Marcus Webb (decision sponsor) + CFO Sarah Kim ·{' '}
          <strong>Procurement:</strong> Janet Fischer, VP IT Ops ·{' '}
          <strong>Trigger:</strong> Newark colocation lease expires Q3 2027 with
          rate escalation locked at 18% YoY. Rebuilding the CIS stack on
          bare-metal at a new colocation facility is not under consideration.
        </Callout>
        <BodyP>
          On submit, the canvas opens at Stage 1 / Strategy. The 11-stage rail
          appears across the top with everything past Strategy greyed out.
          Sentinel scaffolds 33 artifact slots — d01 through d33 — and lands
          Janet on the d01 card with a &ldquo;Generate with Sentinel&rdquo;
          button.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>1:00 p.m. · d01 generation</Eyebrow>
        <SectionTitle>What Sentinel produced and what Janet edited</SectionTitle>
        <Lead>
          Janet clicks Generate. Sentinel pulls intake metadata, the tenant
          inventory (the colo lease record, the Epic version, headcount in
          Newark IT ops), and the canonical d01 prompt template. Forty
          seconds later there&rsquo;s a draft.
        </Lead>

        <ArtifactSpecimen
          code="d01"
          title="Strategy memo · Meridian Health Cloud (excerpt)"
        >
          <p>
            <strong>Strategic driver.</strong> The Newark colocation
            facility&rsquo;s primary lease expires Q3 2027. The renewal
            instrument carries a contractually locked 18% YoY rate escalation
            from the 2022 master agreement. Continuation in colo is therefore
            a known cost-escalation curve with a 5-year cumulative impact in
            excess of $14M against the current run-rate.
          </p>
          <p>
            <strong>Strategic posture.</strong> Move 280 production workloads
            to a managed cloud platform under a multi-year commitment. Defer
            decisions on Epic Clarity / Caboodle (separate program) and
            Tier-2 DR (follow-on event). Maintain optionality on workload
            placement (single-tenant vs multi-tenant tiers) and exit terms.
          </p>
          <p>
            <strong>Decision sponsors.</strong> CTO Marcus Webb (decision
            sponsor) + CFO Sarah Kim (concurrence). Day-to-day owner: CIO
            Karen Liu. Procurement lead: VP IT Ops Janet Fischer.
          </p>
          <p>
            <strong>Value at stake.</strong> $8M low / $12M high annual
            run-rate · 5-year horizon · standard rigor.
          </p>
        </ArtifactSpecimen>

        <BodyP>
          Janet makes two edits. First, she tightens the
          &ldquo;continuation in colo&rdquo; clause to mention specifically
          that the cumulative impact figure assumes flat workload growth — a
          panel-readable assumption. Second, she adds a sentence about
          &ldquo;exit posture&rdquo; — Marcus&rsquo;s word — under strategic
          posture. The provenance receipt shows the original Sentinel draft;
          her edits surface as &ldquo;edited since generation.&rdquo;
        </BodyP>

        <AgentSplitBox
          agent={{
            who: 'Sentinel',
            did: (
              <>
                Drafted the strategy memo from intake metadata + tenant
                inventory + the canonical d01 prompt template. Bound the
                trigger paragraph verbatim. Computed the &ldquo;5-year
                cumulative impact&rdquo; figure from the rate escalation +
                current colo run-rate stored in the inventory.
              </>
            ),
          }}
          human={{
            who: 'Janet',
            did: (
              <>
                Decided that &ldquo;flat workload growth&rdquo; was the
                assumption to surface explicitly (it&rsquo;ll be challenged
                by Sarah at d24 sign-off). Decided to elevate
                &ldquo;exit posture&rdquo; into the strategic-posture clause
                because Marcus said it twice in one paragraph.
              </>
            ),
          }}
        />
      </Section>

      <Section>
        <Eyebrow>4:30 p.m. · Promote to Stage 2</Eyebrow>
        <SectionTitle>Three gate criteria, all met by end of day</SectionTitle>
        <Lead>
          The Strategy gate is intentionally light — three criteria, all
          self-approvable in pilot mode. Marcus and Janet meet for 15 minutes
          at 4:00 p.m. to walk the criteria; by 4:30 the gate is closed and
          the rail advances to Stage 2 / Scope.
        </Lead>

        <GateStatusBox
          stage="Stage 1 · Strategy"
          rows={[
            {
              text: 'd01 strategy memo authored with named decision sponsor + concurrence + day-to-day owner',
              status: 'met',
            },
            {
              text: 'Trigger paragraph specific enough to identify rate, lease term, and explicit out-of-consideration alternative',
              status: 'met',
            },
            {
              text: 'Estimated value band ($8M low / $12M high annual) recorded in canvas + visible in canvas header',
              status: 'met',
            },
          ]}
        />

        <PitfallBox
          kind="avoided"
          title="Trigger paragraph is specific, not strategic"
        >
          The most common Stage 1 pitfall is a generic trigger paragraph —{' '}
          <em>&ldquo;cloud transformation initiative&rdquo;</em>,{' '}
          <em>&ldquo;modernize infrastructure.&rdquo;</em> Those phrases give
          Sentinel nothing to bind on in d05 and d09; they read as marketing
          copy in d24. Marcus&rsquo;s actual framing — named lease, named
          rate, explicit out-of-consideration — is what makes the rest of the
          event composable.
        </PitfallBox>
      </Section>

      <Section>
        <Eyebrow>What just happened</Eyebrow>
        <SectionTitle>Strategy in 7 hours</SectionTitle>
        <SubHead>The artifact</SubHead>
        <BodyP>
          One d01 strategy memo. ~280 words, two paragraphs of trigger + one
          of posture + one of value-at-stake. Provenance receipt names model{' '}
          <em>claude-sonnet-4-6</em>, prompt template <em>strategy-memo@v1.3</em>,
          upstream-bound codes <em>(none — d01 is the root artifact)</em>,
          tokens 1,142 in / 980 out, stop reason <em>end_turn</em>, generated by
          Janet at 13:04 EST.
        </BodyP>
        <SubHead>The decision</SubHead>
        <BodyP>
          Marcus is committed to cloud. The event is real. Janet has
          permission to issue an RFP — the next two stages (Scope, then RFP)
          are her runway. Sarah Kim has been looped via email but won&rsquo;t
          formally engage until d24.
        </BodyP>
        <SubHead>What we don&rsquo;t know yet</SubHead>
        <BodyP>
          The 280-workload count is Marcus&rsquo;s rough sense, not yet
          enumerated. The Cloverleaf middleware is in scope but
          its <em>integration count</em> isn&rsquo;t. That gap shows up in
          Chapter 2 — and again, painfully, in Chapter 10.
        </BodyP>
      </Section>
    </ChapterShell>
  );
}
