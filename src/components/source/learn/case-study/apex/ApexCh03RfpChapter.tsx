'use client';

import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Callout,
} from '@/components/home/learn/primitives';
import { ApexChapterShell, StoryRecap, GateStatusRow } from './_apex-shell';

export function ApexCh03RfpChapter() {
  return (
    <ApexChapterShell slug="apex-rfp">
      <HeroBand color="navy">
        <Eyebrow light>Apex Retail · Chapter 03 · Stage 03 RFP</Eyebrow>
        <SectionTitle light size="xl">Week 3. The rules get written before the game starts.</SectionTitle>
        <Lead light>
          Rachel issues the RFP to four vendors with three instruments attached:
          a mandatory pricing template, an SLA framework, and a completed evaluation
          rubric. The rubric is sealed before any vendor response arrives. The sequence
          matters more than the content.
        </Lead>
      </HeroBand>

      <StoryRecap>
        Stage 2 is approved. Scope is locked at 40 apps across three towers with a
        $11.4M/yr run-spend baseline. The job of this chapter is to issue an RFP that
        gives Apex structural leverage — not just a document that invites proposals.
      </StoryRecap>

      <Section>
        <Eyebrow>The three instruments · before issue</Eyebrow>
        <SectionTitle>Pricing template, SLA framework, evaluation rubric — in that order</SectionTitle>
        <Lead>
          Rachel and Chris build three instruments before the RFP is sent. The pricing
          template forces vendors into a normalised fee structure: Year 1, Year 2, Year 3,
          broken out by tower. No bundled multi-year discounts. No &ldquo;transition
          investment&rdquo; credits that obscure the true Year 1 cost. The SLA framework
          defines 14 service levels across the three towers — each with a specific penalty
          schedule expressed in dollars, not percentages.
        </Lead>
        <BodyP>
          The evaluation rubric is the most important instrument to lock before issue.
          It has five weighted dimensions: transition methodology (25%), SLA commitment
          with penalty backstop (20%), retail sector experience (20%), pricing discipline
          (20%), and financial stability (15%). Weights are set, approved by Dana, and
          stored in Source before the RFP goes out.
        </BodyP>
        <Callout kind="info" icon="📋" label="RFP evaluation rubric · sealed before issue">
          <strong>Transition methodology:</strong> 25% ·{' '}
          <strong>SLA commitment + penalty backstop:</strong> 20% ·{' '}
          <strong>Retail sector experience:</strong> 20% ·{' '}
          <strong>Pricing discipline:</strong> 20% ·{' '}
          <strong>Financial stability:</strong> 15% · Total: 100 points.
          Rubric sealed 2026-02-14. No post-response weight changes permitted.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The four vendors · shortlist rationale</Eyebrow>
        <SectionTitle>Why these four and not three or six</SectionTitle>
        <BodyP>
          Rachel&rsquo;s longlist has nine vendors. She screens against three hard filters:
          minimum $30M AMS contract in the past 5 years, demonstrated retail sector
          delivery, and financial stability sufficient to absorb a 3-tower transition.
          Four vendors clear all three: Northstar Managed Services, ArcVault Managed,
          BlueMaster IT, and DataPeak Systems. The other five are eliminated at longlist
          stage with documented rationale, which is attached to d03.
        </BodyP>
        <BodyP>
          Four is the right number for this event. Fewer than four reduces competitive
          tension. More than four increases evaluation workload without proportionate
          benefit at the $35M value band. The shortlist rationale is in d03 and is
          not re-opened after RFP issue.
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>RFP gate · after issue</Eyebrow>
        <SectionTitle>What a clean RFP gate looks like</SectionTitle>
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 90px 1fr', gap: 12, padding: '8px 0', borderBottom: '2px solid #E5E7EB', marginBottom: 4 }}>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>ID</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Criterion</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Status</span>
            <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 10, fontWeight: 700, color: '#9CA3AF' }}>Evidence</span>
          </div>
          <GateStatusRow id="G-RF01" label="Evaluation rubric sealed before RFP issue — no post-response weight changes" status="met" evidence="Dana Osei sign-off · 2026-02-14" />
          <GateStatusRow id="G-RF02" label="Pricing template mandatory — no alternative formats accepted" status="met" evidence="RFP §6 · pricing template Annex B" />
          <GateStatusRow id="G-RF03" label="SLA penalty schedule expressed in dollars per tier — not percentages" status="met" evidence="RFP Annex C · SLA framework v1.0" />
          <GateStatusRow id="G-RF04" label="Shortlist rationale documented for all 9 longlist vendors" status="met" evidence="d03 · longlist screening record" />
        </div>
        <Callout kind="warn" icon="⚠️" label="Why post-hoc scoring is contested">
          In a prior Apex sourcing event (2023), evaluation weights were adjusted after
          two vendor responses arrived because one vendor&rsquo;s pricing was unexpectedly
          low. The adjusted weights made that vendor the frontrunner. The losing vendor
          filed a formal procurement challenge. The event was restarted from RFP stage.
          Rachel&rsquo;s discipline about sealing the rubric before issue is a direct
          response to that experience.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The lesson from Chapter 3</Eyebrow>
        <SectionTitle>Evaluation criteria locked before responses arrive — or the results are contestable</SectionTitle>
        <BodyP>
          The evaluation rubric is not a formality. It is a commitment device. Once
          weights are set and stored in Source, Rachel cannot adjust them without a
          formal change record that Dana must approve. That friction is intentional.
          Post-hoc weight adjustment to favour a preferred vendor is the most common
          form of procurement bias — it looks like judgment but functions as manipulation.
          Locking the rubric before issue eliminates that path entirely.
        </BodyP>
      </Section>
    </ApexChapterShell>
  );
}
