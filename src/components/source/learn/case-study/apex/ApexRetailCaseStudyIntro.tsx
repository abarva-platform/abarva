'use client';

import Link from 'next/link';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout, T,
} from '@/components/home/learn/primitives';
import { APEX_CHAPTER_SLUGS } from './_apex-shell';

const CHAPTERS = [
  { slug: 'apex-strategy',   num: '01', label: 'Strategy',          status: 'complete', summary: 'CIO office sponsors AMS consolidation. Three-incumbent problem named.' },
  { slug: 'apex-scope',      num: '02', label: 'Scope',             status: 'complete', summary: '40+ application estate scoped across infrastructure, applications, and data platform.' },
  { slug: 'apex-rfp',        num: '03', label: 'RFP',               status: 'complete', summary: 'Full RFP issued to 4 vendors with pricing template and SLA framework.' },
  { slug: 'apex-responses',  num: '04', label: 'Vendor Responses',  status: 'complete', summary: 'All 4 responses received. Pricing normalized. Sentinel pattern signals detected.' },
  { slug: 'apex-evaluation', num: '05', label: 'Evaluation',        status: 'complete', summary: 'Northstar and ArcVault advanced to BAFO. BlueMaster and DataPeak excluded.' },
  { slug: 'apex-pricing',    num: '06', label: 'Pricing',           status: 'complete', summary: '3-year TCO normalized. $11.2M gap between highest and lowest bidder uncovered.' },
  { slug: 'apex-bafo',       num: '07', label: 'BAFO',              status: 'active',   summary: 'BAFO responses due May 15. Two vendors invited. Decision window: May 30.' },
  { slug: 'apex-decision',   num: '08', label: 'Decision',          status: 'pending',  summary: 'Preferred partner selection, governance sign-off, and contract execution.' },
];

const statusColors: Record<string, { bg: string; text: string }> = {
  complete: { bg: '#DCFCE7', text: '#166534' },
  active:   { bg: '#DBEAFE', text: '#1E40AF' },
  pending:  { bg: '#F3F4F6', text: '#6B7280' },
};

export function ApexRetailCaseStudyIntro() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>Source · Apex Retail Case Study</Eyebrow>
        <SectionTitle light size="xl">
          Apex Retail · $35M AMS Consolidation.
        </SectionTitle>
        <Lead light>
          Three incumbent managed-service providers. Forty-plus applications. A CDP
          implementation on the clock. One sourcing event to consolidate them before
          the Q3 2026 data migration window. Eight chapters — from the day the CIO
          Office names the problem to the BAFO round in progress today.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {[
            'Archetype: Managed Services / Outsourcing',
            'Value: $35M projected · 3-year',
            'Rigor: Strategic',
            'Tenant: Apex Retail (live demo)',
            'Time: ~45 min · 8 chapters',
          ].map((tag) => (
            <span key={tag} style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.14)' }}>
              {tag}
            </span>
          ))}
        </div>
      </HeroBand>

      {/* Why this case study */}
      <Section>
        <Eyebrow>Why a retail AMS story</Eyebrow>
        <SectionTitle>The problem every CIO recognises: inherited fragmentation</SectionTitle>
        <Lead>
          Apex Retail didn&rsquo;t choose to have three AMS providers. It accumulated them — one
          from a 2019 infrastructure lift, one from a 2021 acquisition, one from a 2023
          digital-commerce build. Each was the right decision at the time. By 2026, the
          combination is a delivery risk for everything downstream, including the CDP
          programme the board approved in Q4 2025.
        </Lead>
        <BodyP>
          This case study tracks how a $35M AMS consolidation sourcing event gets run
          end-to-end: how the scope is drawn, how four vendors are evaluated against a
          locked scorecard, how pricing is normalised to a 3-year TCO that exposes an
          $11.2M gap between the highest and lowest bidder, and how Sentinel flags two
          P0 contract risks in the BAFO round that the shortlisted vendors&rsquo; original
          proposals quietly buried.
        </BodyP>
        <Callout kind="info" icon="🏬" label="SRC-004 · Live in your tenant">
          This case study is grounded in SRC-004, the <strong>AMS Outsourcing 2026</strong> event
          that is active in the Apex Retail tenant right now. The people, vendors, and
          numbers are the demo storyline — but the artifact structure, gate criteria,
          and Sentinel signals are the same ones you would see in a real event.
          When you read &ldquo;Northstar Managed Services,&rdquo; you are reading the
          same vendor record that appears in the Source canvas.
        </Callout>
      </Section>

      {/* The people */}
      <Section>
        <Eyebrow>The cast</Eyebrow>
        <SectionTitle>Four people run this event</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 8 }}>
          {[
            { role: 'CIO', name: 'Dana Osei', line: 'Decision sponsor. Named the consolidation objective and set the May 30 deadline.' },
            { role: 'Procurement Lead', name: 'Rachel Ng', line: 'Event owner. Runs the sourcing event in Source day-to-day.' },
            { role: 'IT Ops Director', name: 'Chris Varela', line: 'Scope owner. Produced the 40-app estate inventory and service tower definitions.' },
            { role: 'CFO Office', name: 'Priya Mehta', line: 'Value sign-off. Approved the projected value ledger at $35M over three years.' },
          ].map((p) => (
            <div key={p.role} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', background: T.surface }}>
              <div style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.navy, marginBottom: 4 }}>{p.role}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{p.name}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint, lineHeight: 1.55 }}>{p.line}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* The three-incumbent problem */}
      <Section>
        <Eyebrow>The trigger</Eyebrow>
        <SectionTitle>Three incumbents, one delivery risk</SectionTitle>
        <Lead>
          The CDP Implementation programme (APX-CDP-2026) has a data migration window
          in Q3 2026. That window requires a single AMS partner with a clean handover
          of the applications estate. With three incumbents in seat, the handover is
          a three-way coordination problem.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
          {[
            { vendor: 'Incumbent A', scope: 'Infrastructure & hosting', since: 'Since 2019', risk: 'Overlapping scope with Incumbent B on data platform services' },
            { vendor: 'Incumbent B', scope: 'Application support & data platform', since: 'Since 2021 acquisition', risk: 'Contract renewal clause creates a 9-month lock-in if not exited by Apr 2026' },
            { vendor: 'Incumbent C', scope: 'Digital commerce & front-end ops', since: 'Since 2023', risk: 'Scope creep into application ownership creates contested RACI in AMS transition' },
          ].map((v) => (
            <div key={v.vendor} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', background: '#FFFBEB' }}>
              <div style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#92400E', marginBottom: 4 }}>{v.vendor}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{v.scope}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 10, color: T.faint, marginBottom: 8 }}>{v.since}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: '#92400E', lineHeight: 1.5, background: '#FEF3C7', padding: '8px 10px', borderRadius: 4 }}>⚠ {v.risk}</div>
            </div>
          ))}
        </div>
        <BodyP>
          Dana Osei&rsquo;s decision: consolidate all three into a preferred-supplier
          structure before the CDP migration window opens. SRC-004 is the event that
          runs that selection.
        </BodyP>
      </Section>

      {/* Value */}
      <Section>
        <Eyebrow>The value case</Eyebrow>
        <SectionTitle>$35M projected over three years — four sources</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginTop: 8 }}>
          {[
            { label: 'Run-rate savings', amount: '$12.5M', note: 'Elimination of dual-billing and scope overlap between incumbents A & B' },
            { label: 'Transition efficiency', amount: '$8.2M', note: 'Single-vendor handover avoids multi-party coordination cost in CDP Q3 window' },
            { label: 'Contract consolidation', amount: '$9.1M', note: 'Volume discount on consolidated AMS scope vs. three separate renewal baselines' },
            { label: 'Penalty avoidance', amount: '$5.2M', note: 'Exit of Incumbent B before auto-renewal clause locks a 9-month window' },
          ].map((v) => (
            <div key={v.label} style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 18px', background: T.surface }}>
              <div style={{ fontFamily: T.fMono, fontSize: 18, fontWeight: 700, color: T.navy, marginBottom: 4 }}>{v.amount}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.ink, marginBottom: 6 }}>{v.label}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint, lineHeight: 1.5 }}>{v.note}</div>
            </div>
          ))}
        </div>
        <Callout kind="warn" icon="📊" label="Label: projected">
          The $35M figure is projected — it is grounded in the contracted run-rate
          baseline of the three incumbents plus Sentinel-flagged avoidance opportunities.
          It becomes &ldquo;realized&rdquo; only after 12 months of the consolidated
          AMS contract are invoiced and measured against the baseline. Atlas will not
          label it realized until that evidence exists.
        </Callout>
      </Section>

      {/* Chapter index */}
      <Section>
        <Eyebrow>Eight chapters</Eyebrow>
        <SectionTitle>Read it as one story</SectionTitle>
        <Lead>
          Start at Chapter 1 and follow the nav links at the bottom of each page.
          Chapters 1–7 are complete (the event is live at BAFO). Chapter 8 covers the
          pending decision and what happens after award.
        </Lead>
        <div style={{ marginTop: 16 }}>
          {CHAPTERS.map((ch) => {
            const c = statusColors[ch.status];
            return (
              <Link
                key={ch.slug}
                href={`/home/learn/source/${ch.slug}`}
                style={{ display: 'grid', gridTemplateColumns: '36px 90px 1fr 70px', gap: 14, alignItems: 'center', padding: '14px 0', borderBottom: `1px solid ${T.borderLt}`, textDecoration: 'none' }}
              >
                <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: T.faint }}>{ch.num}</span>
                <span style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.navy }}>{ch.label}</span>
                <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint }}>{ch.summary}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, padding: '3px 8px', borderRadius: 4, background: c.bg, color: c.text, textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>{ch.status}</span>
              </Link>
            );
          })}
        </div>
        <div style={{ marginTop: 28 }}>
          <Link
            href={`/home/learn/source/${APEX_CHAPTER_SLUGS[0]}`}
            style={{ display: 'inline-block', padding: '12px 28px', background: T.navy, color: '#fff', fontFamily: T.fBody, fontSize: 14, fontWeight: 600, borderRadius: 6, textDecoration: 'none' }}
          >
            Start reading → Chapter 1: Strategy
          </Link>
        </div>
      </Section>
    </>
  );
}
