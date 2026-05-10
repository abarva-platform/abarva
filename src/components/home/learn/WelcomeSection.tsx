'use client';
import Link from 'next/link';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, SubHead,
  Callout, StepList, Step, T,
} from './primitives';

const cxOQuestions = [
  'Does the platform understand how enterprise product and technology actually run?',
  'Can it answer current-state questions before recommending a bet?',
  'Does it turn a signal into governed product change, not another AI pilot?',
  'Where are value, risk, decision rights, evidence, and accountability visible?',
];

const apexBaseline = [
  { label: 'Revenue', value: '$24.8B', detail: 'Large omnichannel retail scale' },
  { label: 'Footprint', value: '480 stores', detail: '12 DCs and fulfillment nodes' },
  { label: 'Mix', value: '26%', detail: 'Owned / private-label sales penetration' },
  { label: 'AI portfolio', value: '7 initiatives', detail: 'Contact center, CDP, forecasting, store, FinOps, SDLC, personalization' },
];

const reviewPath = [
  {
    title: 'Inspect the current state',
    body: 'Apex Retail starts with a preloaded enterprise substrate: revenue, footprint, systems, leaders, program state, vendor posture, financial baselines, KPIs, and evidence.',
    href: '/home/learn/setup',
    cta: 'Review substrate',
  },
  {
    title: 'Ask Intelligence what matters',
    body: 'Sentinel should help a product and technology executive separate signal from noise: what is true now, what changed, what is risky, and what deserves a Move.',
    href: '/home/learn/intelligence',
    cta: 'Open intelligence',
  },
  {
    title: 'Shape the Move',
    body: 'Nexus turns a signal into governed product change: named sponsor, decision rights, phase gates, deliverables, economics, and evidence needed before scale.',
    href: '/home/learn/first-move',
    cta: 'Walk the Move',
  },
  {
    title: 'Source or govern the portfolio',
    body: 'If the Move requires a vendor or platform decision, Source runs the sourcing event. Tower then keeps all AI initiatives visible by category, value, stage, and risk.',
    href: '/home/learn/tower',
    cta: 'Check Tower',
  },
];

const artifactRows = [
  ['CEO', 'Can I see the strategic bet and business outcome?', 'Move charter, value hypothesis, Tower outcome view'],
  ['CFO', 'Do the economics reconcile to finance language?', 'Baseline, business case, payback, KPI attestation'],
  ['CIPO', 'Can I trust the systems, data, product model, and delivery risk?', 'Current-state brief, evidence ledger, technology dependencies'],
  ['COO', 'Can this become operating change?', 'Workstreams, adoption signals, phase gates, execution alerts'],
];

export function WelcomeSection() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>AbarVa · Executive review</Eyebrow>
        <SectionTitle light size="xl">Review AbarVa like a product and technology executive.</SectionTitle>
        <Lead light>
          Start with Apex Retail, a $24.8B omnichannel retailer. The review path is built for a CIPO/EVP Product lens: prove the current state, challenge the signal, shape the Move, source only when needed, and govern the AI portfolio without letting weak bets slip through.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['15 min CXO path', 'Apex Retail primary demo', 'Source + Tower variants'].map((tag) => (
            <span key={tag} style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.14)' }}>{tag}</span>
          ))}
        </div>
      </HeroBand>

      <Section>
        <Eyebrow>CXO lens</Eyebrow>
        <SectionTitle>What a reviewer should decide in the first pass</SectionTitle>
        <Lead>
          The Learn page should not ask an executive to read the manual. It should let them pressure-test whether the platform understands product operating models, enterprise technology, data readiness, guest/team-member experience, and the governance needed to make AI useful at scale.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'stretch', margin: '24px 0' }}>
          <div style={{ border: `1px solid ${T.navyLine}`, background: T.navySoft, borderRadius: 8, padding: 22 }}>
            <SubHead>Use this page for four questions</SubHead>
            <ul style={{ margin: '12px 0 0', paddingLeft: 20, fontFamily: T.fBody, fontSize: 14, lineHeight: 1.75, color: T.body }}>
              {cxOQuestions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 22, background: T.surface }}>
            <SubHead>Apex Retail baseline</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 14 }}>
              {apexBaseline.map(({ label, value, detail }) => (
                <div key={label} style={{ borderTop: `3px solid ${T.purple}`, paddingTop: 10 }}>
                  <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.faint }}>{label}</div>
                  <div style={{ fontFamily: T.fDisp, fontSize: 24, color: T.ink, letterSpacing: '-0.01em', marginTop: 4 }}>{value}</div>
                  <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Callout kind="info" icon="✓" label="Composite, but benchmarked">
          These are seeded composite clients, not real customer disclosures. Apex is intentionally scaled like a large omnichannel retailer so a senior product and technology leader can challenge assumptions without needing setup work first.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Primary walkthrough</Eyebrow>
        <SectionTitle>The 15-minute Apex Retail review path</SectionTitle>
        <Lead>
          Follow one thread end to end before opening the reference pages. The goal is to see the operating system: current state, intelligence, governed Move, sourcing decision, and portfolio control.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', margin: '24px 0' }}>
          {reviewPath.map(({ title, body, href, cta }, index) => (
            <div key={title} style={{ padding: 22, borderRight: `1px solid ${T.borderLt}`, background: index === 0 ? T.purpleSoft : T.surface }}>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.purple, marginBottom: 10 }}>Step {index + 1}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{title}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.6, minHeight: 104 }}>{body}</div>
              <Link href={href} style={{ display: 'inline-flex', marginTop: 14, fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.purple, textDecoration: 'none' }}>
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Decision artifacts</Eyebrow>
        <SectionTitle>What each CXO should be able to inspect</SectionTitle>
        <Lead>
          The page should point reviewers to evidence, not explain every feature. For a product and technology executive, the proof is whether the system names owners, platforms, economics, dependencies, and gates before it recommends action.
        </Lead>
        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fBody, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Role', 'Review question', 'Proof to show'].map((head) => (
                  <th key={head} style={{ textAlign: 'left', padding: '10px 12px', fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artifactRows.map(([role, question, proof]) => (
                <tr key={role} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '12px', fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: T.purple }}>{role}</td>
                  <td style={{ padding: '12px', color: T.ink, fontWeight: 600 }}>{question}</td>
                  <td style={{ padding: '12px', color: T.muted }}>{proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Recommended route</Eyebrow>
        <SectionTitle>Read this as an executive review, then go deeper</SectionTitle>
        <StepList>
          <Step title="First 5 minutes: inspect the Apex facts">
            Confirm the retail baseline feels coherent: revenue, footprint, systems, named leaders, KPI gaps, vendor posture, and active AI initiatives.
          </Step>
          <Step title="Next 10 minutes: follow the signal to a Move">
            Open Intelligence, then the Contact Center AI Routing Move. The reviewer should see how a current-state signal becomes governed product and technology execution.
          </Step>
          <Step title="Final 10 minutes: test governance and monitoring">
            Open Tower, Gates &amp; evidence, and the Source deep dive only if the reviewer wants procurement or vendor-selection depth.
          </Step>
        </StepList>
        <Callout kind="success" icon="→" label="Best first click">
          Start with <Link href="/home/learn/first-move" style={{ color: T.teal, fontWeight: 600 }}>Contact Center AI Routing</Link>. It is the fastest way to understand how current-state intelligence becomes a governed Move.
        </Callout>
      </Section>
    </>
  );
}
