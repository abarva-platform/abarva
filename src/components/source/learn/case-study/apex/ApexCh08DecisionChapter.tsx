'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap } from './_apex-shell';

export function ApexCh08DecisionChapter() {
  return (
    <ApexChapterShell slug="apex-decision">
      <HeroBand color="slate">
        <Eyebrow light>Apex Retail · Chapter 08 · Stage 08 Decision · Pending</Eyebrow>
        <SectionTitle light size="xl">May 30. The decision is constrained, not open.</SectionTitle>
        <Lead light>
          BAFO responses arrive May 15. The decision committee convenes May 28 with
          whatever resolved — and whatever did not. The preferred vendor must have closed
          both P0 contract risks, submitted an itemised SLA penalty schedule, and confirmed
          their transition methodology covers all three tower handover points. The decision
          criteria are not new: they are the cumulative output of everything built in
          Chapters 1 through 7.
        </Lead>
      </HeroBand>

      <StoryRecap>
        BAFO is in progress. Responses due May 15. Two mandatory items are outstanding
        per vendor — one P0 contract risk each, plus the shared SLA penalty schedule
        requirement. The decision pool on May 30 consists of vendors who have resolved
        all three mandatory items. A vendor who resolves two of three is not eligible.
      </StoryRecap>

      <Section>
        <Eyebrow>Decision criteria · the four tests</Eyebrow>
        <SectionTitle>What the preferred vendor must have done, not just scored</SectionTitle>
        <Lead>
          The May 30 decision committee has four tests for the preferred vendor. All
          four must pass. A vendor who scores 84/100 on the evaluation but carries an
          unresolved P0 does not pass Test 1. A vendor who resolves both P0 risks but
          submits a bundled SLA penalty schedule instead of an itemised one does not
          pass Test 3. The tests are not preferences — they are gates.
        </Lead>
        <BodyP>
          <strong>Test 1:</strong> Both P0 contract risks resolved — Northstar with a month-12
          exit provision, ArcVault with a 90-day auto-renewal notice window. Test 1 determines
          who is in the decision pool. Test 2: evaluation score advantage confirmed as
          genuine — the 6-point gap between Northstar (84) and ArcVault (78) must not have
          been narrowed by BAFO improvements to ArcVault&rsquo;s transition methodology.
          Test 3: itemised SLA penalty schedule submitted with dollar-denominated penalties
          per breach event. Test 4: transition methodology explicitly covers all three
          tower handover points as defined in d02.
        </BodyP>
        <Callout kind="info" icon="📋" label="Decision committee · composition">
          Chair: Rachel Ng · Sponsor: Dana Osei (CIO) · Finance: Priya Mehta (CFO) ·
          Technical: Chris Varela · Operations: Marcus Reid. Dana has sign-off authority
          on the award recommendation. Priya must confirm the 3-year TCO is within the
          approved sourcing budget before award.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Post-award sequence · three steps before transition</Eyebrow>
        <SectionTitle>Governance sign-off → contract execution → 90-day transition kickoff</SectionTitle>
        <BodyP>
          The award decision on May 30 is not the contract. It is a board-level
          recommendation that must clear Apex&rsquo;s IT governance committee before
          contract execution. Governance sign-off is targeted June 5. Contract execution
          is targeted June 15. The 90-day transition kickoff must start no later than
          July 1 to complete before the CDP Q3 migration window — the constraint that
          opened SRC-004 in Chapter 1.
        </BodyP>
        <BodyP>
          The transition programme for a three-tower absorption at this scale requires
          a dedicated workstream lead from both Apex and the winning vendor. Chris Varela
          will be the Apex transition programme lead. The vendor must name their counterpart
          in the BAFO response as a condition of Test 4. An unnamed transition lead at
          BAFO stage is a risk indicator — it suggests the vendor is pricing the win before
          committing the resource.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Hard constraint: transition must complete before CDP Q3 window">
          The CDP Implementation programme (APX-CDP-2026) has a data migration window
          that opens in Q3 2026. The new AMS vendor must have absorbed all three service
          towers and be in steady-state operations before that window opens. A delayed
          transition — whether from late contract execution, a disputed P0 resolution,
          or an underprepared transition plan — directly threatens the CDP programme
          timeline. This constraint was documented in d01 at Strategy. It closes the
          entire sourcing lifecycle.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 8</Eyebrow>
        <SectionTitle>The decision is the output of the process, not a separate judgment</SectionTitle>
        <BodyP>
          The decision committee on May 30 is not making a fresh choice. They are
          reading the output of eight stages of structured work: a strategy memo that
          named the CDP constraint, a scope document that defined tower boundaries,
          an RFP with a sealed evaluation rubric, four vendor responses with a pattern
          flag on one, a committee evaluation against locked criteria, a pricing
          normalisation that surfaced two P0 risks, and a BAFO round that either
          resolved those risks or did not.
        </BodyP>
        <BodyP>
          The decision is constrained by that record. The preferred vendor on May 30
          is the vendor who resolved their P0 risk, submitted the itemised SLA
          penalty schedule, and confirmed three-tower transition coverage — and who
          holds the higher evaluation score if more than one vendor clears all four
          tests. That sequence was visible from Strategy. The committee is not
          deliberating. They are ratifying.
        </BodyP>
      </Section>
    </ApexChapterShell>
  );
}
