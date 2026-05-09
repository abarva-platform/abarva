'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow } from './_apex-shell';
import { T } from '@/components/home/learn/primitives';

export function ApexCh07BafoChapter() {
  return (
    <ApexChapterShell slug="apex-bafo">
      <HeroBand color="slate">
        <Eyebrow light>Apex Retail · Chapter 07 · Stage 07 BAFO · ACTIVE</Eyebrow>
        <SectionTitle light size="xl">In progress. Responses due May 15.</SectionTitle>
        <Lead light>
          The BAFO letter was issued May 1 to Northstar and ArcVault. Three mandatory
          negotiation items are included — two from the P0 contract risks identified in
          Chapter 6, one new SLA transparency requirement that applies to both vendors.
          Both vendors have acknowledged receipt. Responses are due May 15. Decision
          is targeted May 30.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Evaluation is complete. Northstar leads at 84/100, ArcVault at 78/100. Two P0
        contract risks are documented: Northstar has no exit provision within 18 months;
        ArcVault&rsquo;s auto-renewal notice window is 60 days against a 90-day standard.
        The BAFO round exists specifically to resolve these risks — not to reopen the
        evaluation scores.
      </StoryRecap>

      <Section>
        <Eyebrow>BAFO letter · issued May 1</Eyebrow>
        <SectionTitle>Three mandatory items. No optional guidance.</SectionTitle>
        <Lead>
          Rachel issues the BAFO letter on May 1. The letter is direct: both vendors
          are informed that the event is at final stage, that pricing may be improved
          but is not the primary variable, and that there are three mandatory items
          that must be addressed in full for a BAFO response to be accepted as complete.
          An incomplete response on any mandatory item will be treated as a P0 contract
          risk that remains open — and will affect the award decision accordingly.
        </Lead>

        <SubHead>Mandatory negotiation items</SubHead>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '16px 0 24px' }}>
          <div style={{ border: `1px solid ${T.amberLine}`, background: T.amberSoft, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.amber, marginBottom: 8 }}>
              BAFO Item 1 · Northstar only · P0 · Exit provision
            </div>
            <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
              Northstar must provide a termination-for-convenience clause that activates no later
              than month 12 of the contract. The clause must specify a notice period of no more
              than 90 days and must not require payment of a termination penalty beyond documented
              transition costs. The original proposal&rsquo;s Section 12 is not acceptable. A
              revised Section 12 must be submitted with the BAFO response.
            </div>
          </div>
          <div style={{ border: `1px solid ${T.amberLine}`, background: T.amberSoft, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.amber, marginBottom: 8 }}>
              BAFO Item 2 · ArcVault only · P0 · Auto-renewal notice window
            </div>
            <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
              ArcVault must extend the auto-renewal notice window from 60 days to 90 days.
              The revised clause must match Apex&rsquo;s standard contract terms (Apex Standard
              Contract Terms v4.2, Section 9.3). The revised Section 14 must be submitted
              with the BAFO response. ArcVault is not permitted to substitute an alternative
              notice mechanism (e.g. email confirmation) in lieu of the clause revision.
            </div>
          </div>
          <div style={{ border: `1px solid ${T.navyLine}`, background: T.navySoft, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.navy, marginBottom: 8 }}>
              BAFO Item 3 · Both vendors · SLA penalty schedule — itemised, not bundled
            </div>
            <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>
              Both Northstar and ArcVault must provide an itemised SLA penalty schedule
              for each of the 14 service levels across the three towers. Penalties must be
              expressed as dollar amounts per breach event and per continuous-breach day, not
              as percentages of monthly fee. Bundled penalty credits (&ldquo;up to X% of
              monthly invoice&rdquo;) are not acceptable. This item applies regardless of
              whether the vendor&rsquo;s original proposal included a penalty schedule.
            </div>
          </div>
        </div>
      </Section>

      <Section>
        <Eyebrow>Current gate status · ACTIVE</Eyebrow>
        <SectionTitle>What is resolved and what is pending</SectionTitle>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-BF01" label="BAFO letter issued — 3 mandatory items documented and transmitted" status="met" evidence="Rachel Ng · BAFO letter issued 2026-05-01" />
          <GateStatusRow id="G-BF02" label="Both vendors acknowledged receipt of BAFO letter" status="met" evidence="Northstar ack 2026-05-02 · ArcVault ack 2026-05-02" />
          <GateStatusRow id="G-BF03" label="Northstar exit provision (Item 1) — revised Section 12 received" status="deferred" evidence="Response due 2026-05-15 · not yet received" />
          <GateStatusRow id="G-BF04" label="ArcVault auto-renewal notice (Item 2) — revised Section 14 received" status="deferred" evidence="Response due 2026-05-15 · not yet received" />
          <GateStatusRow id="G-BF05" label="Both vendors itemised SLA penalty schedules (Item 3) received" status="deferred" evidence="Response due 2026-05-15 · not yet received" />
        </div>

        <Callout kind="info" icon="⏱️" label="BAFO timeline · current status">
          BAFO letter issued: 2026-05-01 ·{' '}
          Vendor acknowledgements received: 2026-05-02 ·{' '}
          BAFO responses due: 2026-05-15 ·{' '}
          Decision targeted: 2026-05-30 ·{' '}
          Contract execution target: 2026-06-15 ·{' '}
          Transition kickoff (before CDP Q3 window): 2026-07-01
        </Callout>
      </Section>

      <Section>
        <Eyebrow>What happens if a vendor cannot resolve a mandatory item</Eyebrow>
        <SectionTitle>The P0 label has a consequence — it is not a preference</SectionTitle>
        <BodyP>
          Both P0 risks are structural contract terms, not pricing positions. A vendor
          who cannot provide a month-12 exit provision is telling Apex that they cannot
          absorb the transition risk that comes with an exit before month 19. That may
          reflect legitimate service delivery constraints — a three-tower absorption
          with an 18-month no-exit window is a standard ask in large AMS transitions.
          But Apex&rsquo;s documented constraint from Strategy (the Incumbent B April 2026
          auto-renewal) requires exit flexibility before that threshold.
        </BodyP>
        <BodyP>
          If Northstar cannot resolve Item 1, the BAFO round does not produce two
          qualified responses — it produces one. ArcVault becomes the sole
          qualified finalist. If ArcVault also has an unresolved P0, the event does
          not proceed to award. Rachel would open a Stage 7 extension or re-engage
          the longlist. That outcome is not projected — it is documented as the
          consequence of an unresolved P0 so that both vendors understand the stakes.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Outcome dependency: P0 resolution determines the decision pool">
          The award decision on May 30 is constrained, not open. The vendor pool
          eligible for award is determined by who resolves both mandatory items in
          full. A vendor who resolves Item 3 but not Item 1 or Item 2 is not
          eligible for award regardless of evaluation score. This is documented in
          the BAFO letter and is not negotiable.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 7</Eyebrow>
        <SectionTitle>BAFO is where the P0 risks identified in Chapter 6 get resolved — or become decision blockers</SectionTitle>
        <BodyP>
          The purpose of a BAFO round is not to get cheaper pricing. Pricing movement
          is welcome but it is not the primary variable at this stage. The primary
          variable is contract risk resolution. Both P0 risks were identified in
          Chapter 6 precisely so they could be included in the BAFO letter — not
          discovered at contract execution.
        </BodyP>
        <BodyP>
          A sourcing event that does not surface P0 risks until contract review has
          failed at pricing normalisation. The risk is not cheaper to resolve at
          contract stage — it is more expensive, because by then the buyer has
          signalled a preferred vendor and the vendor knows it. BAFO is the last
          point at which both vendors are genuinely competing, which is the last
          point at which contract risk terms can be negotiated without signalling
          commitment.
        </BodyP>
      </Section>
    </ApexChapterShell>
  );
}
