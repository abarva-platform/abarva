'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow } from './_apex-shell';

export function ApexCh02ScopeChapter() {
  return (
    <ApexChapterShell slug="apex-scope">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 02 · Stage 02 Scope</Eyebrow>
        <SectionTitle light size="xl">Week 2. Chris draws the map.</SectionTitle>
        <Lead light>
          Chris Varela spends a week producing the definitive inventory of
          everything Apex expects a new AMS partner to absorb: 40 applications,
          three service towers, and a run-spend baseline that becomes the
          pricing anchor for every vendor conversation that follows.
        </Lead>
      </HeroBand>

      <StoryRecap>
        SRC-004 is open at Stage 2. Strategy is approved. The &ldquo;why&rdquo; is
        documented. The job now is to define the &ldquo;what&rdquo; precisely enough
        that vendors can price against a common object — and that Apex cannot be
        upsold on scope it already owns.
      </StoryRecap>

      <Section>
        <Eyebrow>The 40-app inventory · Tuesday through Thursday</Eyebrow>
        <SectionTitle>Why application count is not the same as scope</SectionTitle>
        <Lead>
          Chris starts with the CMDB export. It shows 47 applications under the three
          incumbent contracts. Seven are decommissioned in everything but the billing
          record — still listed, no longer running. He removes them. The working inventory
          is 40 applications across three service towers: infrastructure (14 apps),
          applications (19 apps), and data platform (7 apps).
        </Lead>
        <BodyP>
          The tower boundary decision is the most consequential thing Chris does this
          week. He defines each tower by its operational handover point — where one
          vendor&rsquo;s incident response ends and another&rsquo;s begins. Without those
          boundaries drawn in the scope document, a vendor can price a subset of each tower
          and claim full coverage. The boundary definitions become Exhibit A in the RFP.
        </BodyP>
        <Callout kind="info" icon="🗂️" label="d02 · Scope document · tower structure">
          <strong>Tower 1 · Infrastructure (14 apps):</strong> network, compute, storage,
          OS patching, and DR run-books. Handover point: application process boundary. ·{' '}
          <strong>Tower 2 · Applications (19 apps):</strong> L2/L3 support, release management,
          incident triage, and SLA reporting. Handover point: database connection layer. ·{' '}
          <strong>Tower 3 · Data Platform (7 apps):</strong> pipeline operations, data quality
          monitoring, warehouse maintenance, and analytics environment. Handover point: API
          contract published by CDP programme.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Run-spend baseline · Thursday afternoon</Eyebrow>
        <SectionTitle>The number that anchors everything downstream</SectionTitle>
        <BodyP>
          Rachel pulls invoices from the three incumbents for the trailing 12 months.
          Chris normalises them against the 40-app inventory, stripping out one-time
          project charges and disputed credits. The baseline run-spend lands at
          <strong> $11.4M per year</strong> — $34.2M over the three-year contract
          window the sourcing event targets.
        </BodyP>
        <BodyP>
          This number does two things. First, it gives Rachel a denominator for vendor
          proposals — any bid above $34.2M for equivalent scope is a cost increase, not
          a cost saving, regardless of what the vendor&rsquo;s executive summary says.
          Second, it gives Priya Mehta in Finance a committed baseline to compare against
          realised savings at year-end. The baseline is signed by Dana and attached to d02.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Scope gate · hard criterion">
          The run-spend baseline must be vendor-agnostic: it cannot be derived from a
          single incumbent&rsquo;s invoice format. Incumbents consistently include project
          charges in the &ldquo;managed services&rdquo; line. Chris&rsquo;s normalisation
          step removed $1.8M in such charges before arriving at $11.4M. An unnormalised
          baseline would have set the wrong anchor and reduced pricing pressure in the RFP.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Scope gate · Friday</Eyebrow>
        <SectionTitle>Three hard criteria cleared in one review</SectionTitle>
        <BodyP>
          Dana and Rachel run the scope gate review on Friday afternoon. Three criteria.
          All three met. SRC-004 advances to Stage 3 — RFP.
        </BodyP>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-SC01" label="Application inventory complete — 40 apps confirmed, 7 decommissioned removed" status="met" evidence="d02 Annex A · Chris Varela sign-off" />
          <GateStatusRow id="G-SC02" label="Tower boundaries defined with explicit handover points" status="met" evidence="d02 Exhibit A · tower boundary definitions" />
          <GateStatusRow id="G-SC03" label="Run-spend baseline normalised and CFO-approved" status="met" evidence="Priya Mehta sign-off · $11.4M/yr baseline" />
        </div>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 2</Eyebrow>
        <SectionTitle>Tower boundaries prevent scope creep — but only if they are in the RFP</SectionTitle>
        <BodyP>
          The tower boundary definitions in d02 are not administrative tidiness. They
          are the mechanism that prevents a vendor from pricing Tower 1 and Tower 2 while
          treating Tower 3 as a &ldquo;separate engagement.&rdquo; Chris has seen that
          move in two prior consolidations. The boundary definitions are reproduced verbatim
          in Section 3 of the RFP, and every vendor is required to price against all three
          towers as a single scope object.
        </BodyP>
        <Callout kind="info" icon="💡" label="Key pattern: scope document as contract backstop">
          In Chapter 7 (BAFO), Northstar will be required to confirm their transition
          methodology covers all three tower handover points before the BAFO letter is
          accepted. The handover points they must address are the same ones Chris defined
          here in d02. A vague scope document would have left that confirmation
          unverifiable.
        </Callout>
      </Section>
    </ApexChapterShell>
  );
}
