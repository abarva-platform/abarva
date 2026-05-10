'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, SubHead, InlineAbarvaLogo,
  Callout, StepList, Step, T,
} from './primitives';

type ReviewScenarioKey = 'apex' | 'meridian';

type ScenarioMetric = {
  label: string;
  value: string;
  detail: string;
};

type ScenarioStep = {
  title: string;
  body: string;
  href: string;
  cta: string;
};

type ScenarioConfig = {
  label: string;
  tabLabel: string;
  tabDetail: string;
  accent: string;
  accentSoft: string;
  heroLead: string;
  tags: string[];
  lensLead: string;
  questions: string[];
  baselineTitle: string;
  baseline: ScenarioMetric[];
  calloutLabel: string;
  callout: string;
  pathTitle: string;
  pathLead: string;
  path: ScenarioStep[];
  artifactLead: string;
  artifactRows: Array<[string, string, string]>;
  routeSteps: Array<{ title: string; body: string }>;
  firstClick: {
    label: string;
    href: string;
    text: string;
  };
};

const scenarios: Record<ReviewScenarioKey, ScenarioConfig> = {
  apex: {
    label: 'Apex Retail',
    tabLabel: 'Apex Retail',
    tabDetail: 'Retail product + technology',
    accent: T.purple,
    accentSoft: T.purpleSoft,
    heroLead:
      'Start with Apex Retail, a $24.8B omnichannel retailer. The review path is built for a CIPO/EVP Product lens: prove the current state, challenge the signal, shape the Move, source only when needed, and govern the AI portfolio without letting weak bets slip through.',
    tags: ['15 min CXO path', 'Apex Retail primary demo', 'Source + Tower variants'],
    lensLead:
      'The Learn page should not ask an executive to read the manual. It should let them pressure-test whether the platform understands product operating models, enterprise technology, data readiness, guest/team-member experience, and the governance needed to make AI useful at scale.',
    questions: [
      'Does the platform understand how enterprise product and technology actually run?',
      'Can it answer current-state questions before recommending a bet?',
      'Does it turn a signal into governed product change, not another AI pilot?',
      'Where are value, risk, decision rights, evidence, and accountability visible?',
    ],
    baselineTitle: 'Apex Retail baseline',
    baseline: [
      { label: 'Revenue', value: '$24.8B', detail: 'Large omnichannel retail scale' },
      { label: 'Footprint', value: '480 stores', detail: '12 DCs and fulfillment nodes' },
      { label: 'Mix', value: '26%', detail: 'Owned / private-label sales penetration' },
      { label: 'AI portfolio', value: '7 initiatives', detail: 'Contact center, CDP, forecasting, store, FinOps, SDLC, personalization' },
    ],
    calloutLabel: 'Composite, but benchmarked',
    callout:
      'These are seeded composite clients, not real customer disclosures. Apex is intentionally scaled like a large omnichannel retailer so a senior product and technology leader can challenge assumptions without needing setup work first.',
    pathTitle: 'The 15-minute Apex Retail review path',
    pathLead:
      'Follow one thread end to end before opening the reference pages. The goal is to see the operating system: current state, intelligence, governed Move, sourcing decision, and portfolio control.',
    path: [
      {
        title: 'Inspect the current state',
        body: 'Apex Retail starts with a preloaded enterprise substrate: revenue, footprint, systems, leaders, program state, vendor posture, financial baselines, KPIs, and evidence.',
        href: '/home/learn/setup?client=apexretail',
        cta: 'Review substrate',
      },
      {
        title: 'Ask Intelligence what matters',
        body: 'Sentinel should help a product and technology executive separate signal from noise: what is true now, what changed, what is risky, and what deserves a Move.',
        href: '/intelligence?client=apexretail',
        cta: 'Open intelligence',
      },
      {
        title: 'Shape the Move',
        body: 'Nexus turns a signal into governed product change: named sponsor, decision rights, phase gates, deliverables, economics, and evidence needed before scale.',
        href: '/home/learn/first-move?client=apexretail',
        cta: 'Walk the Move',
      },
      {
        title: 'Source or govern the portfolio',
        body: 'If the Move requires a vendor or platform decision, Source runs the sourcing event. Tower then keeps all AI initiatives visible by category, value, stage, and risk.',
        href: '/tower?client=apexretail',
        cta: 'Check Tower',
      },
    ],
    artifactLead:
      'The page should point reviewers to evidence, not explain every feature. For a product and technology executive, the proof is whether the system names owners, platforms, economics, dependencies, and gates before it recommends action.',
    artifactRows: [
      ['CEO', 'Can I see the strategic bet and business outcome?', 'Move charter, value hypothesis, Tower outcome view'],
      ['CFO', 'Do the economics reconcile to finance language?', 'Baseline, business case, payback, KPI attestation'],
      ['CIPO', 'Can I trust the systems, data, product model, and delivery risk?', 'Current-state brief, evidence ledger, technology dependencies'],
      ['COO', 'Can this become operating change?', 'Workstreams, adoption signals, phase gates, execution alerts'],
    ],
    routeSteps: [
      {
        title: 'First 5 minutes: inspect the Apex facts',
        body: 'Confirm the retail baseline feels coherent: revenue, footprint, systems, named leaders, KPI gaps, vendor posture, and active AI initiatives.',
      },
      {
        title: 'Next 10 minutes: follow the signal to a Move',
        body: 'Open Intelligence, then the Contact Center AI Routing Move. The reviewer should see how a current-state signal becomes governed product and technology execution.',
      },
      {
        title: 'Final 10 minutes: test governance and monitoring',
        body: 'Open Tower, Gates & evidence, and the Source deep dive only if the reviewer wants procurement or vendor-selection depth.',
      },
    ],
    firstClick: {
      label: 'Best first click',
      href: '/home/learn/first-move?client=apexretail',
      text: 'Contact Center AI Routing',
    },
  },
  meridian: {
    label: 'Meridian Health',
    tabLabel: 'Meridian Health',
    tabDetail: 'Healthcare CXO',
    accent: T.teal,
    accentSoft: T.tealSoft,
    heroLead:
      'Switch to Meridian Health for a healthcare CXO review. The path is built around a $14.2B integrated delivery network where clinical AI, Epic optimization, prior authorization, revenue cycle, payer operations, and governance all collide.',
    tags: ['Healthcare CXO path', 'Meridian Health System', 'AI governance + clinical ops'],
    lensLead:
      'A healthcare reviewer needs to know whether the platform can reason across clinical safety, payer economics, regulatory clocks, physician adoption, and technology debt without turning everything into generic AI enthusiasm.',
    questions: [
      'Can it separate mandatory compliance work from discretionary AI value?',
      'Can it connect Epic, ambient AI, prior auth, revenue cycle, and vendor risk?',
      'Does it surface governance gaps before clinical AI scales across regions?',
      'Can a CIO, CMIO, CFO, and compliance leader see their decision rights clearly?',
    ],
    baselineTitle: 'Meridian Health baseline',
    baseline: [
      { label: 'Revenue', value: '$14.2B', detail: 'Integrated delivery network' },
      { label: 'Footprint', value: '9 hospitals', detail: '142 clinics and 3 research centers' },
      { label: 'Core stack', value: 'Epic + Snowflake', detail: 'AWS-primary cloud and clinical data estate' },
      { label: 'AI portfolio', value: '15 initiatives', detail: 'Ambient documentation, prior auth, RCM, governance, patient access' },
    ],
    calloutLabel: 'Healthcare-ready review',
    callout:
      'Meridian is also a seeded composite tenant. It is designed to let a healthcare executive challenge clinical, operational, financial, regulatory, and platform assumptions without waiting for a new setup cycle.',
    pathTitle: 'The 15-minute Meridian Health review path',
    pathLead:
      'Use Meridian when the reviewer cares about healthcare AI governance, clinical workflow adoption, payer-provider economics, Epic dependencies, and vendor rationalization.',
    path: [
      {
        title: 'Inspect the healthcare substrate',
        body: 'Meridian starts with a loaded IDN baseline: hospitals, clinics, Epic landscape, AWS/Snowflake posture, IT financials, vendor contracts, KPI history, and active AI initiatives.',
        href: '/home/learn/setup?client=meridian',
        cta: 'Review substrate',
      },
      {
        title: 'Ask Intelligence what is risky',
        body: 'Sentinel should distinguish clinical AI promise from governance exposure: ambient documentation overlap, prior auth automation, revenue cycle leakage, and model accountability.',
        href: '/intelligence?client=meridian',
        cta: 'Open intelligence',
      },
      {
        title: 'Shape the governance Move',
        body: 'Nexus should turn AI sprawl into a governed transformation: sponsor, clinical sign-off, model inventory, bias monitoring, value attribution, and board-ready evidence.',
        href: '/strategic-moves?client=meridian',
        cta: 'Open Moves',
      },
      {
        title: 'Source or monitor the portfolio',
        body: 'If the decision requires vendor consolidation or sourcing, Source handles the event. Tower keeps clinical, revenue-cycle, platform, and governance initiatives visible.',
        href: '/tower?client=meridian',
        cta: 'Check Tower',
      },
    ],
    artifactLead:
      'For a healthcare CXO, the proof is whether the system shows clinical ownership, regulated data boundaries, platform dependencies, vendor posture, value attribution, and gates before approving scale.',
    artifactRows: [
      ['CEO', 'Can this portfolio improve access, quality, margin, and trust?', 'Executive brief, AI initiative registry, board-ready risk/value narrative'],
      ['CFO', 'Which savings are verified and which are regulatory obligations?', 'Baseline, value ledger, vendor spend, payback, fee-trigger evidence'],
      ['CIO/CDIO', 'Can the technology estate support this without new sprawl?', 'Epic/Snowflake/AWS dependency map, governance backlog, integration risks'],
      ['CMIO/CMO', 'Will clinical workflow and safety be protected?', 'Clinical sign-off gate, physician adoption evidence, model monitoring plan'],
      ['Compliance', 'Are PHI, bias, audit, and vendor controls explicit?', 'Risk register, BAA/vendor posture, model inventory, audit evidence'],
    ],
    routeSteps: [
      {
        title: 'First 5 minutes: inspect the Meridian facts',
        body: 'Confirm the IDN baseline feels credible: hospital footprint, Epic dependency, AI portfolio, vendor overlap, financial pressure, and regulatory exposure.',
      },
      {
        title: 'Next 10 minutes: challenge AI sprawl',
        body: 'Ask why ambient documentation, prior auth, revenue cycle, and analytics modernization should be sequenced together or split into separate Moves.',
      },
      {
        title: 'Final 10 minutes: test governance and sourcing',
        body: 'Open Moves for AI Governance + Analytics Modernization, then use Tower and Source if the reviewer wants portfolio control or vendor decision depth.',
      },
    ],
    firstClick: {
      label: 'Best first click',
      href: '/strategic-moves?client=meridian',
      text: 'AI Governance + Analytics Modernization',
    },
  },
};

const scenarioKeys: ReviewScenarioKey[] = ['apex', 'meridian'];

export function WelcomeSection() {
  const [activeScenarioKey, setActiveScenarioKey] = useState<ReviewScenarioKey>('apex');
  const active = scenarios[activeScenarioKey];

  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light><InlineAbarvaLogo light heightEm={1.35} /> · Executive review</Eyebrow>
        <SectionTitle light size="xl">
          Review <InlineAbarvaLogo light heightEm={0.82} /> like a product and technology executive.
        </SectionTitle>
        <Lead light>{active.heroLead}</Lead>
        <div
          role="tablist"
          aria-label="Choose CXO demo context"
          style={{
            display: 'inline-flex',
            flexWrap: 'wrap',
            gap: 4,
            margin: '4px 0 12px',
            padding: 4,
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.22)',
            background: 'rgba(255,255,255,0.10)',
          }}
        >
          {scenarioKeys.map((key) => {
            const scenario = scenarios[key];
            const selected = key === activeScenarioKey;
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveScenarioKey(key)}
                style={{
                  minWidth: 164,
                  border: 0,
                  borderRadius: 6,
                  cursor: 'pointer',
                  padding: '9px 12px',
                  textAlign: 'left',
                  background: selected ? '#fff' : 'transparent',
                  color: selected ? T.navy : 'rgba(255,255,255,0.78)',
                  boxShadow: selected ? '0 8px 20px rgba(0,0,0,0.18)' : 'none',
                }}
              >
                <span style={{ display: 'block', fontFamily: T.fBody, fontSize: 13, fontWeight: 800 }}>
                  {scenario.tabLabel}
                </span>
                <span style={{ display: 'block', fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 3 }}>
                  {scenario.tabDetail}
                </span>
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {active.tags.map((tag) => (
            <span key={tag} style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.14)' }}>{tag}</span>
          ))}
        </div>
      </HeroBand>

      <Section>
        <Eyebrow>CXO lens · {active.label}</Eyebrow>
        <SectionTitle>What a reviewer should decide in the first pass</SectionTitle>
        <Lead>{active.lensLead}</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24, alignItems: 'stretch', margin: '24px 0' }}>
          <div style={{ border: `1px solid ${T.navyLine}`, background: T.navySoft, borderRadius: 8, padding: 22 }}>
            <SubHead>Use this view for four questions</SubHead>
            <ul style={{ margin: '12px 0 0', paddingLeft: 20, fontFamily: T.fBody, fontSize: 14, lineHeight: 1.75, color: T.body }}>
              {active.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ul>
          </div>
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 8, padding: 22, background: T.surface }}>
            <SubHead>{active.baselineTitle}</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginTop: 14 }}>
              {active.baseline.map(({ label, value, detail }) => (
                <div key={label} style={{ borderTop: `3px solid ${active.accent}`, paddingTop: 10 }}>
                  <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.faint }}>{label}</div>
                  <div style={{ fontFamily: T.fDisp, fontSize: 24, color: T.ink, letterSpacing: '-0.01em', marginTop: 4 }}>{value}</div>
                  <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.45 }}>{detail}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Callout kind="info" icon="✓" label={active.calloutLabel}>
          {active.callout}
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Primary walkthrough · {active.label}</Eyebrow>
        <SectionTitle>{active.pathTitle}</SectionTitle>
        <Lead>{active.pathLead}</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0, border: `1px solid ${T.border}`, borderRadius: 8, overflow: 'hidden', margin: '24px 0' }}>
          {active.path.map(({ title, body, href, cta }, index) => (
            <div key={title} style={{ padding: 22, borderRight: `1px solid ${T.borderLt}`, background: index === 0 ? active.accentSoft : T.surface }}>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: active.accent, marginBottom: 10 }}>Step {index + 1}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{title}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.6, minHeight: 104 }}>{body}</div>
              <Link href={href} style={{ display: 'inline-flex', marginTop: 14, fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: active.accent, textDecoration: 'none' }}>
                {cta} →
              </Link>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Decision artifacts · {active.label}</Eyebrow>
        <SectionTitle>What each CXO should be able to inspect</SectionTitle>
        <Lead>{active.artifactLead}</Lead>
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
              {active.artifactRows.map(([role, question, proof]) => (
                <tr key={role} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '12px', fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: active.accent }}>{role}</td>
                  <td style={{ padding: '12px', color: T.ink, fontWeight: 600 }}>{question}</td>
                  <td style={{ padding: '12px', color: T.muted }}>{proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Recommended route · {active.label}</Eyebrow>
        <SectionTitle>Read this as an executive review, then go deeper</SectionTitle>
        <StepList>
          {active.routeSteps.map(({ title, body }) => (
            <Step key={title} title={title}>
              {body}
            </Step>
          ))}
        </StepList>
        <Callout kind="success" icon="→" label={active.firstClick.label}>
          Start with <Link href={active.firstClick.href} style={{ color: T.teal, fontWeight: 600 }}>{active.firstClick.text}</Link>. It is the fastest way to understand how current-state intelligence becomes a governed Move.
        </Callout>
      </Section>
    </>
  );
}
