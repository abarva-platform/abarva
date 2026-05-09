'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow, VendorScoreRow } from './_apex-shell';

export function ApexCh05EvaluationChapter() {
  return (
    <ApexChapterShell slug="apex-evaluation">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 05 · Stage 05 Evaluation</Eyebrow>
        <SectionTitle light size="xl">Week 6. The committee scores. Two advance.</SectionTitle>
        <Lead light>
          The selection committee meets for two half-days to score all four vendors
          against the sealed evaluation rubric. Sentinel&rsquo;s PAT-AMS-VND-001 flag
          shapes the session before it starts: the SLA criterion is applied as written,
          not as BlueMaster presented it. Two vendors advance to BAFO. Two are eliminated
          with documented rationale.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Vendor responses are in. Pricing normalisation is complete (first pass). The
        evaluation rubric is sealed at five weighted dimensions. The selection committee
        convenes Monday morning with all four proposals, the Sentinel flag record, and
        the normalised pricing data. No new evaluation criteria may be added at this stage.
      </StoryRecap>

      <Section>
        <Eyebrow>The committee · composition and process</Eyebrow>
        <SectionTitle>Five voices, one rubric, no surprises</SectionTitle>
        <Lead>
          The selection committee has five members: Rachel Ng (chair), Chris Varela
          (technical lead), Marcus Reid (operations, Tower 1 owner), Sofia Park
          (data platform, Tower 3 owner), and James Oduya (finance, representing
          Priya Mehta). Each member scores independently before the committee session.
          Individual scores are submitted to Source before the meeting. Sentinel
          calculates weighted composite scores and displays individual dispersion —
          any dimension where the committee is more than 15 points apart gets a
          structured discussion before the composite is finalised.
        </Lead>
        <BodyP>
          One dimension triggers a dispersion discussion: the SLA criterion. Marcus
          has scored BlueMaster&rsquo;s SLA at 18/20 based on the 99.95% uptime
          commitment. Sofia and Rachel have scored it at 7/20 after reading the
          Sentinel flag. The dispersion is 11 points. Rachel reads the flag into the
          record. Marcus reconsiders. The final committee score for BlueMaster&rsquo;s
          SLA criterion lands at 8/20 — the penalty backstop is contractually empty,
          and the rubric requires both commitment <em>and</em> backstop.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Vendor scores · final composite</Eyebrow>
        <SectionTitle>All four vendors scored against the sealed rubric</SectionTitle>
        <SubHead>Evaluation results</SubHead>
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '24px 180px 80px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>#</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Vendor</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Score</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Committee note</span>
          </div>
          <VendorScoreRow
            vendor="Northstar Managed Services"
            score="84 / 100"
            rank={1}
            notes="Strong transition methodology; reference-check confirms 3 similar consolidations at comparable AMS scope"
          />
          <VendorScoreRow
            vendor="ArcVault Managed"
            score="78 / 100"
            rank={2}
            notes="Good pricing discipline; weaker transition track record — only 1 comparable consolidation in retail"
          />
          <VendorScoreRow
            vendor="BlueMaster IT"
            score="61 / 100"
            rank={3}
            notes="SLA overstatement flagged by Sentinel (PAT-AMS-VND-001); penalty backstop absent; excluded from BAFO"
          />
          <VendorScoreRow
            vendor="DataPeak Systems"
            score="54 / 100"
            rank={4}
            notes="Insufficient retail sector experience; scope gap on data platform tower — no Tower 3 delivery history"
          />
        </div>
        <BodyP>
          Northstar and ArcVault advance to BAFO. BlueMaster and DataPeak are
          eliminated. Both eliminations are documented with the rubric dimension
          scores and the committee chair sign-off. BlueMaster receives written
          notice that the primary elimination factor was the SLA criterion as applied
          under the sealed rubric — not a judgment on capability.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Dimension-by-dimension breakdown</Eyebrow>
        <SectionTitle>Where Northstar pulled away and where ArcVault was competitive</SectionTitle>
        <BodyP>
          The 6-point gap between Northstar (84) and ArcVault (78) is primarily driven
          by the transition methodology dimension (25% weight). Northstar submitted
          a detailed 90-day transition plan covering all three tower handover points
          with named workstream leads and explicit risk mitigations for each. ArcVault
          submitted a generic transition methodology with retail-sector case studies
          but no specific plan for the three-tower simultaneous absorption.
        </BodyP>
        <BodyP>
          On pricing discipline (20% weight), ArcVault was within 2 points of Northstar.
          On retail sector experience (20% weight), both scored comparably — both have
          multi-year retail AMS histories. Financial stability (15% weight): both are
          investment-grade rated. The decision to advance both to BAFO rather than
          declaring Northstar the preferred vendor immediately reflects the closeness
          of the scores on four of five dimensions. BAFO will determine whether
          Northstar&rsquo;s transition advantage holds under negotiation pressure.
        </BodyP>
        <Callout kind="info" icon="💡" label="Why ArcVault stays competitive despite the transition gap">
          ArcVault&rsquo;s weaker transition track record is a resolvable gap —
          they can strengthen their BAFO submission with a more detailed plan and
          additional reference commitments. BlueMaster&rsquo;s SLA gap is structural:
          a penalty backstop cannot be invented in BAFO. The evaluation correctly
          distinguishes between a gap that is recoverable and one that is not.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Evaluation gate · BAFO shortlist approved</Eyebrow>
        <SectionTitle>Stage 5 complete — advancing to BAFO</SectionTitle>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-EV01" label="All 4 vendors scored against sealed rubric — no post-response weight changes" status="met" evidence="Committee session record · 2026-03-10" />
          <GateStatusRow id="G-EV02" label="Score dispersion review completed — all dimensions above threshold resolved" status="met" evidence="SLA dispersion discussion documented in session record" />
          <GateStatusRow id="G-EV03" label="Elimination rationale documented for BlueMaster and DataPeak" status="met" evidence="d05 · elimination notices issued 2026-03-11" />
          <GateStatusRow id="G-EV04" label="BAFO shortlist (Northstar, ArcVault) approved by sponsor" status="met" evidence="Dana Osei sign-off · 2026-03-12" />
        </div>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 5</Eyebrow>
        <SectionTitle>Sentinel&rsquo;s SLA flag was the difference between a clean evaluation and a contested one</SectionTitle>
        <BodyP>
          If BlueMaster&rsquo;s 99.95% uptime commitment had been scored at face value —
          as Marcus initially did — it would have earned 18 or 19 out of 20 on the SLA
          dimension. That would have pushed BlueMaster&rsquo;s composite score above 74,
          potentially above ArcVault. The evaluation could have advanced a vendor whose
          primary differentiator was contractually unenforceable.
        </BodyP>
        <BodyP>
          The PAT-AMS-VND-001 flag did not make the decision for the committee. It gave
          Marcus the information he needed to apply the rubric correctly. The criterion
          specifies &ldquo;SLA commitment with penalty backstop&rdquo; — both halves.
          Without the flag, the second half would have gone unexamined. With it, the
          committee applied the full criterion and reached a defensible score.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Pattern forward: P0 contract risks now visible in pricing">
          The evaluation is complete and the shortlist is clean. But Sentinel has
          continued running analysis against the two finalist proposals. In Chapter 6
          (Pricing), two P0 contract risks surface — one in Northstar&rsquo;s proposal,
          one in ArcVault&rsquo;s. Both must be resolved in BAFO before either vendor
          can be awarded.
        </Callout>
      </Section>
    </ApexChapterShell>
  );
}
