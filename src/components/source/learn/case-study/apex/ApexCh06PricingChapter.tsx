'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow, PricingRow } from './_apex-shell';
import { T } from '@/components/home/learn/primitives';

export function ApexCh06PricingChapter() {
  return (
    <ApexChapterShell slug="apex-pricing">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 06 · Stage 06 Pricing</Eyebrow>
        <SectionTitle light size="xl">Week 7. The $11.2M gap — and two risks the proposals buried.</SectionTitle>
        <Lead light>
          Three-year TCO normalisation across all four vendors reveals a spread that
          no Year 1 comparison would have shown. Two P0 contract risks surface in the
          finalist proposals: an exit provision gap in Northstar&rsquo;s original
          submission, and a non-standard auto-renewal window in ArcVault&rsquo;s.
          Both must be resolved in BAFO.
        </Lead>
      </HeroBand>

      <StoryRecap>
        The BAFO shortlist is approved: Northstar and ArcVault advance. BlueMaster and
        DataPeak are eliminated. Sentinel has continued contract-clause analysis against
        the two finalist proposals while the evaluation gate was being closed. Two
        flags are now in the pricing analysis record.
      </StoryRecap>

      <Section>
        <Eyebrow>3-year TCO normalisation · all four vendors</Eyebrow>
        <SectionTitle>What the pricing template reveals when you read Years 2 and 3</SectionTitle>
        <Lead>
          The mandatory pricing template forces every vendor to commit to Year 1, Year 2,
          and Year 3 fees separately. The year-over-year step-up is where the real
          pricing discipline — or lack of it — shows. BlueMaster and DataPeak both
          show double-digit step-ups in Years 2–3 that are not visible in a Year 1
          comparison. Northstar holds under 5% year-over-year growth across all three towers.
        </Lead>

        <SubHead>3-year TCO comparison · all vendors</SubHead>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr 1fr 120px 90px', gap: 10, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Vendor</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>Year 1</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>Year 2</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>Year 3</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>3yr TCO</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF', textAlign: 'right' }}>vs Northstar</span>
          </div>
          <PricingRow
            vendor="Northstar Managed Services"
            year1="$7.2M"
            year2="$7.4M"
            year3="$7.8M"
            tco3yr="$22.4M"
          />
          <PricingRow
            vendor="ArcVault Managed"
            year1="$7.8M"
            year2="$8.1M"
            year3="$8.4M"
            tco3yr="$24.3M"
            delta="+$1.9M"
          />
          <PricingRow
            vendor="BlueMaster IT"
            year1="$9.8M"
            year2="$10.6M"
            year3="$10.8M"
            tco3yr="$31.2M"
            delta="+$8.8M"
          />
          <PricingRow
            vendor="DataPeak Systems"
            year1="$10.1M"
            year2="$11.0M"
            year3="$12.5M"
            tco3yr="$33.6M"
            delta="+$11.2M"
          />
        </div>
        <BodyP>
          DataPeak&rsquo;s Year 3 fee is $12.5M — 24% above their Year 1 figure. That
          step-up is described in their proposal as &ldquo;a contractual adjustment for
          inflationary and service maturity factors.&rdquo; In practice it means Apex
          would be paying $12.5M in Year 3 for a service that Northstar prices at $7.8M
          for equivalent scope. The normalisation makes that comparison visible on a
          single row. The executive summary comparison would not have shown it.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>P0 contract risks · Sentinel flags · both finalists</Eyebrow>
        <SectionTitle>Two risks the proposals buried in fee schedule appendices</SectionTitle>
        <BodyP>
          Sentinel runs contract-clause analysis against the finalist proposals after
          the evaluation gate closes. Two P0 risks surface — one in each finalist.
          Both are in appendix-level language, not in the main proposal body.
        </BodyP>

        <Callout kind="warn" icon="⚠️" label="P0 risk · Northstar · no exit provision within 18 months">
          Northstar&rsquo;s original proposal — Section 12, Termination provisions — contains
          no exit clause for the first 18 months of the contract. The termination section
          grants Apex the right to terminate for cause at any time, but the termination-for-convenience
          provision does not activate until month 19. Given the April 2026 exit constraint
          documented at Strategy (the Incumbent B auto-renewal), Apex needs a clean exit
          provision that activates no later than month 12. This is a BAFO mandatory item.
        </Callout>

        <Callout kind="warn" icon="⚠️" label="P0 risk · ArcVault · auto-renewal notice window is 60 days (standard is 90)">
          ArcVault&rsquo;s original proposal — Section 14, Contract renewal — specifies
          a 60-day notice window for Apex to decline auto-renewal. Apex&rsquo;s standard
          contract terms require a 90-day notice window. The 30-day shortfall means that
          if the governance team is slow to initiate renewal review, Apex could inadvertently
          trigger auto-renewal with less time to respond than their standard process requires.
          This is a BAFO mandatory item.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Pricing gate · assessment</Eyebrow>
        <SectionTitle>Pricing normalisation complete — BAFO items documented</SectionTitle>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-PR01" label="3-year TCO normalised for all 4 vendors using mandatory pricing template" status="met" evidence="d06 · pricing normalisation table · Chris Varela" />
          <GateStatusRow id="G-PR02" label="Year-over-year step-up analysis documented — no hidden inflation accepted" status="met" evidence="d06 Annex D · YoY step-up summary" />
          <GateStatusRow id="G-PR03" label="P0 risk · Northstar exit provision gap — BAFO mandatory item raised" status="met" evidence="Sentinel contract-clause flag · BAFO letter item 1" />
          <GateStatusRow id="G-PR04" label="P0 risk · ArcVault auto-renewal window (60 days vs 90) — BAFO mandatory item raised" status="met" evidence="Sentinel contract-clause flag · BAFO letter item 2" />
        </div>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 6</Eyebrow>
        <SectionTitle>Pricing normalisation exposes risks that vendor proposals bury in fee schedules</SectionTitle>
        <BodyP>
          Neither P0 risk was in the headline sections of the finalist proposals.
          Northstar&rsquo;s exit provision gap was in Section 12 — the termination
          appendix. ArcVault&rsquo;s auto-renewal shortfall was in Section 14 — the
          contract renewal appendix. Both sections are standard boilerplate that a
          rushed evaluation would have skimmed. Sentinel reads them as structured data,
          not prose, and flags deviations from Apex&rsquo;s documented contract standards.
        </BodyP>
        <BodyP>
          The $11.2M spread is the headline finding. But the P0 risks are the more
          consequential output. A vendor who wins on pricing but carries an unresolved
          exit provision gap is not actually the lowest-risk choice — they are the
          highest-risk choice dressed up in the lowest number. Both risks go into the
          BAFO letter as mandatory resolution items, not as preferences.
        </BodyP>
        <Callout kind="info" icon="💡" label="Key pattern: pricing normalisation as contract risk surface">
          In Chapter 7 (BAFO), both P0 risks will be tested against the vendors&rsquo;
          ability to resolve them. If either vendor cannot or will not provide the
          required clause, that refusal becomes the decision variable — not the score,
          not the TCO, not the transition methodology. The P0 label means exactly that:
          a risk that overrides the evaluation result if unresolved.
        </Callout>
      </Section>
    </ApexChapterShell>
  );
}
