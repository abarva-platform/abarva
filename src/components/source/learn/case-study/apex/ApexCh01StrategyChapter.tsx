'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow } from './_apex-shell';

export function ApexCh01StrategyChapter() {
  return (
    <ApexChapterShell slug="apex-strategy">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 01 · Stage 01 Strategy</Eyebrow>
        <SectionTitle light size="xl">Week 1. Dana names the problem.</SectionTitle>
        <Lead light>
          Dana Osei walks into a Q1 portfolio review with a slide that has three
          vendor logos and a red arrow pointing at the CDP programme timeline.
          By Friday, SRC-004 is open in Source, the three-incumbent problem is
          documented in d01, and Rachel Ng has her sourcing brief. This chapter
          shows how a strategic framing gets from a portfolio review to an
          audit-ready artifact in five working days.
        </Lead>
      </HeroBand>

      <StoryRecap>
        The event does not exist yet. Dana has decided to consolidate; she has not yet
        committed scope, vendors, or a selection model. The job of this chapter is to get
        the &ldquo;why&rdquo; precise enough that the rest of the lifecycle can build on it
        — and to surface the first P0 risk before a single RFP is drafted.
      </StoryRecap>

      <Section>
        <Eyebrow>The portfolio review · Monday 9:00 a.m.</Eyebrow>
        <SectionTitle>The slide that started it</SectionTitle>
        <Lead>
          Dana&rsquo;s Q1 portfolio slide has one problem statement: the CDP
          Implementation programme (APX-CDP-2026) has a data migration window in Q3 2026.
          That window requires a clean handover of the full applications estate. With three
          AMS providers in seat, that handover is a coordination problem with no named owner.
        </Lead>
        <BodyP>
          Chris Varela&rsquo;s note in the margin of the printed slide, which Rachel later
          photographs and attaches to d01: &ldquo;Incumbent B renewal clause expires April
          2026. If we don&rsquo;t exit by then, 9-month auto-renewal. That&rsquo;s two
          months into the CDP window.&rdquo; That single note becomes the P0 risk that
          shapes the entire sourcing timeline.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="P0 risk · identified at strategy">
          The Incumbent B auto-renewal clause expires April 2026. A failure to exit before
          that date triggers a 9-month lock-in that runs directly into the CDP Q3 migration
          window. This risk is identified at Strategy — not at contract review — because
          Chris&rsquo;s note is in the artifact record. If it had been discovered at Stage 8,
          the CDP programme would have had to absorb the delay.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Tuesday · Rachel opens Source</Eyebrow>
        <SectionTitle>What the intake form captures and why it matters</SectionTitle>
        <Lead>
          Rachel fills in the seven intake fields in about 25 minutes. The trigger
          paragraph is the most important — it is the spine of d01, and it is the text
          that Sentinel will cite when it validates that a decision later in the lifecycle
          is consistent with the original strategic objective.
        </Lead>
        <Callout kind="info" icon="📋" label="SRC-004 · AMS Outsourcing 2026 · Intake record">
          <strong>Archetype:</strong> Managed Services / Outsourcing ·{' '}
          <strong>Rigor:</strong> Strategic ·{' '}
          <strong>Value band:</strong> $30M–$40M projected (3-year) ·{' '}
          <strong>Sponsor:</strong> CIO Dana Osei ·{' '}
          <strong>Event owner:</strong> Rachel Ng, Procurement Lead ·{' '}
          <strong>Trigger:</strong> Three incumbent AMS providers create a delivery
          coordination risk for the Q3 2026 CDP migration window. Incumbent B
          auto-renewal clause at April 2026 creates a hard exit deadline.
          Consolidation to a preferred-supplier structure is required before the
          migration window.
        </Callout>
        <BodyP>
          On submit, Source opens SRC-004 at Stage 1 / Strategy. The 8-stage rail appears.
          Sentinel scaffolds the artifact registry — d01 through the award-readiness
          artifacts — and lands Rachel on the d01 card. She clicks &ldquo;Generate with
          Sentinel.&rdquo;
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>d01 · Strategy memo</Eyebrow>
        <SectionTitle>What Sentinel produced and what Rachel kept</SectionTitle>
        <Lead>
          Sentinel drafts d01 in 45 seconds. The draft is 80% usable — Rachel edits the
          value band (Sentinel&rsquo;s first estimate was $28M; Chris&rsquo;s run-rate
          analysis puts the floor at $30M) and adds the Incumbent B clause date explicitly.
          Everything else she keeps verbatim.
        </Lead>
        <div style={{ background: '#F8F7F4', border: '1px solid #E5E7EB', borderRadius: 8, padding: '20px 24px', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.7, color: '#374151' }}>
          <div style={{ fontFamily: 'var(--font-sans, sans-serif)', fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#6B7280', marginBottom: 12 }}>d01 · STRATEGY MEMO · EXCERPT</div>
          <p><strong>Strategic driver.</strong> Apex Retail currently operates three incumbent
          AMS providers with overlapping scope across infrastructure, application support,
          and digital commerce operations. This fragmented structure creates a delivery
          coordination risk for the CDP Implementation programme (APX-CDP-2026), which
          requires a single-vendor handover of the full applications estate in the Q3 2026
          migration window.</p>
          <p><strong>Consolidation objective.</strong> Select a single preferred AMS partner
          capable of absorbing all three service towers. The selection must be completed
          and the contract executed before the Incumbent B auto-renewal clause at April 2026.
          </p>
          <p><strong>Value hypothesis.</strong> Consolidation to a single preferred supplier
          is projected to generate $30M–$40M in cost avoidance and efficiency gain over
          three years, primarily through elimination of scope overlap billing ($12.5M),
          single-vendor transition efficiency ($8.2M), contract volume discount ($9.1M),
          and Incumbent B penalty avoidance ($5.2M).</p>
          <p><strong>Make-vs-buy decision.</strong> Internal AMS capacity was evaluated and
          rejected. Headcount and tooling cost to build equivalent managed-service depth
          in-house exceeds the consolidated-vendor spend projection by 2.4× over three
          years. External sourcing is the correct lever.</p>
        </div>
      </Section>

      <Section>
        <Eyebrow>Strategy gate · Thursday</Eyebrow>
        <SectionTitle>Three criteria, one hour</SectionTitle>
        <BodyP>
          The Strategy gate has three hard criteria. All three are met by Thursday afternoon.
          Dana signs off at 4:45 p.m. SRC-004 advances to Stage 2.
        </BodyP>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-S01" label="Make-vs-buy decision documented with rationale" status="met" evidence="d01 §4 · internal capacity analysis" />
          <GateStatusRow id="G-S02" label="Scope anchor and consolidation objective approved" status="met" evidence="Dana Osei sign-off · CIO Office 2026-01-15" />
          <GateStatusRow id="G-S03" label="Value hypothesis in projected ledger (not realized)" status="met" evidence="Priya Mehta CFO Office approval · $30M–$40M range" />
        </div>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 1</Eyebrow>
        <SectionTitle>Strategy is where P0 risks get named — or get buried</SectionTitle>
        <BodyP>
          Chris&rsquo;s note about the Incumbent B clause was a margin annotation on a
          printed slide. If it stays there, it surfaces at contract review — too late.
          Because Rachel attached the photograph to d01 and Sentinel indexed it into the
          artifact registry, the April 2026 exit deadline is visible from Strategy forward.
          Every downstream stage — scope, RFP, vendor selection — is shaped by that constraint.
        </BodyP>
        <Callout kind="info" icon="💡" label="Key pattern: strategy decisions echo through pricing">
          In Chapter 6 (Pricing), Sentinel will flag that Northstar&rsquo;s original proposal
          has no exit provision within 18 months. That flag lands in the pricing normalisation
          table as a contract risk line item, not as a contract-review surprise. It is traceable
          directly back to the April 2026 exit constraint that was documented here, in d01.
        </Callout>
      </Section>
    </ApexChapterShell>
  );
}
