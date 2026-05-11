'use client';

import Link from 'next/link';
import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
  Callout,
  StepList,
  Step,
  T,
} from './primitives';

const cxoPaths = [
  {
    role: 'CIO / CDIO',
    question: 'Which AI bets deserve platform, data, and engineering capacity?',
    action: 'Start in Intelligence, then shape the highest-confidence bet as a Move.',
  },
  {
    role: 'CFO',
    question: 'Which AI investments have a defensible value case?',
    action: 'Inspect the Move business case, value assumptions, risk, and Tower outcomes.',
  },
  {
    role: 'COO / business president',
    question: 'Where will workflow, adoption, and operating ownership break?',
    action: 'Use Nexus to pressure-test sponsor structure, process change, and phase gates.',
  },
  {
    role: 'Procurement / technology sponsor',
    question: 'Which vendor or SI decision is justified by evidence?',
    action: 'Open Source and build a sourcing event from the Move context.',
  },
];

const reviewSteps = [
  {
    label: 'Ask Intelligence',
    href: '/intelligence',
    body: 'Ask Sentinel a real executive question about priorities, value, data readiness, ownership, risk, or vendor implications.',
  },
  {
    label: 'Pick one bet',
    href: '/home/learn/intelligence',
    body: 'Look for a specific bet that has value, urgency, evidence, and a clear blocker worth resolving.',
  },
  {
    label: 'Create a Move',
    href: '/strategic-moves/new',
    body: 'Let Nexus turn the rough idea into sponsor, scope, evidence, gate path, business case, and value logic.',
  },
  {
    label: 'Start Source if needed',
    href: '/source/new',
    body: 'If the Move needs a vendor or SI, use Source to structure intake, shortlist, RFP, proposal comparison, and decision record.',
  },
  {
    label: 'Check Tower',
    href: '/tower',
    body: 'Use Tower to see whether the portfolio has ownership, readiness, risk, and verified outcome discipline.',
  },
];

const askExamples = [
  'What AI bets should we decide this quarter, and why?',
  'What data or workflow gaps would block this from scaling?',
  'Who must sponsor this for the value to actually land?',
  'Which vendor/SI decision should wait until the Move is clearer?',
  'What would the CFO need to believe before funding this?',
  'Where are we likely overbuilding or under-designing?',
];

const artifacts = [
  ['Intelligence brief', 'What should we fund?', 'Ranked bets, evidence, confidence, blockers'],
  ['Move journey', 'How should we shape it?', 'Sponsor, scope, gates, architecture, value case'],
  ['Source event', 'Who should help deliver it?', 'Shortlist, RFP logic, proposal comparison, decision record'],
  ['Tower view', 'Is value real?', 'Ownership, readiness, risk, tracked and verified outcomes'],
];

export function WelcomeSection() {
  return (
    <>
      <section
        style={{
          padding: '56px clamp(28px, 5vw, 72px)',
          background: '#ffffff',
          borderBottom: `1px solid ${T.borderLt}`,
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: 36,
            alignItems: 'center',
          }}
        >
          <div>
            <Eyebrow>Learn AbarVa</Eyebrow>
            <h1
              style={{
                margin: '0 0 18px',
                maxWidth: 760,
                color: T.ink,
                fontFamily: T.fDisp,
                fontSize: 'clamp(42px, 6vw, 76px)',
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: 520,
              }}
            >
              Get value from the system in your first 15 minutes.
            </h1>
            <p style={{ maxWidth: 760, margin: '0 0 24px', color: T.body, fontFamily: T.fBody, fontSize: 19, lineHeight: 1.5 }}>
              This page is for any CXO using AbarVa. It is not a manual to read end to end. It is a guided path for asking better questions, shaping better AI initiatives, sourcing with evidence, and tracking outcomes.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              <CtaLink href="/intelligence">Ask Sentinel</CtaLink>
              <CtaLink href="/strategic-moves/new" secondary>Create a Move</CtaLink>
              <CtaLink href="/source/new" secondary>Start Source</CtaLink>
            </div>
          </div>
          <LearnHeroGraphic />
        </div>
      </section>

      <Section>
        <Eyebrow>Choose your lens</Eyebrow>
        <SectionTitle>Every CXO enters with a different question. The product should meet them there.</SectionTitle>
        <Lead>
          AbarVa is most useful when the user brings a real decision, not a curiosity prompt. Start with the role lens, then let the agents pull the work toward evidence, ownership, and action.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 24 }}>
          {cxoPaths.map((path) => (
            <article key={path.role} style={{ padding: 20, borderRadius: 16, background: T.surface, border: `1px solid ${T.border}`, minHeight: 220 }}>
              <div style={{ fontFamily: T.fMono, color: T.purple, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>{path.role}</div>
              <h3 style={{ margin: '12px 0 8px', color: T.ink, fontFamily: T.fBody, fontSize: 18, lineHeight: 1.2, letterSpacing: 0 }}>{path.question}</h3>
              <p style={{ margin: 0, color: T.muted, fontFamily: T.fBody, fontSize: 14, lineHeight: 1.58 }}>{path.action}</p>
            </article>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>The 15-minute path</Eyebrow>
        <SectionTitle>Follow one thread from question to governed action.</SectionTitle>
        <Lead>
          Do this once before browsing reference content. The goal is to feel the operating model: Intelligence finds the bet, Moves shapes it, Source supports partner decisions, and Tower keeps value visible.
        </Lead>
        <div style={{ marginTop: 26, padding: 18, borderRadius: 22, background: T.surface, border: `1px solid ${T.border}` }}>
          <JourneyGraphic />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10, marginTop: 18 }}>
            {reviewSteps.map((step, index) => (
              <Link
                key={step.label}
                href={step.href}
                style={{
                  display: 'block',
                  minHeight: 180,
                  padding: 16,
                  borderRadius: 14,
                  background: index === 0 ? T.purpleSoft : T.surface2,
                  border: `1px solid ${index === 0 ? T.purpleLine : T.borderLt}`,
                  color: T.ink,
                  textDecoration: 'none',
                }}
              >
                <div style={{ width: 30, height: 30, borderRadius: 999, display: 'grid', placeItems: 'center', background: index < 2 ? T.purple : T.teal, color: '#fff', fontFamily: T.fMono, fontSize: 11, fontWeight: 800 }}>
                  {index + 1}
                </div>
                <h3 style={{ margin: '12px 0 6px', color: T.ink, fontFamily: T.fBody, fontSize: 17, letterSpacing: 0 }}>{step.label}</h3>
                <p style={{ margin: 0, color: T.muted, fontFamily: T.fBody, fontSize: 13, lineHeight: 1.5 }}>{step.body}</p>
              </Link>
            ))}
          </div>
        </div>
      </Section>

      <Section>
        <Eyebrow>Good questions</Eyebrow>
        <SectionTitle>Ask like an executive, not like a search user.</SectionTitle>
        <Lead>
          The fastest way to understand the system is to ask questions that force a view: what to fund, what could fail, who must own it, and what evidence would change the answer.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, marginTop: 22 }}>
          {askExamples.map((question) => (
            <div key={question} style={{ padding: 16, borderRadius: 14, background: T.navySoft, border: `1px solid ${T.navyLine}`, color: T.body, fontFamily: T.fBody, fontSize: 15, lineHeight: 1.45 }}>
              &ldquo;{question}&rdquo;
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>What good looks like</Eyebrow>
        <SectionTitle>The system should produce decision artifacts, not just answers.</SectionTitle>
        <Lead>
          When AbarVa is working, a conversation turns into structured evidence: a brief, a Move, a sourcing packet, or a portfolio signal that a leader can act on.
        </Lead>
        <div style={{ overflowX: 'auto', marginTop: 20 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fBody, fontSize: 14, background: T.surface, border: `1px solid ${T.border}` }}>
            <thead>
              <tr style={{ background: T.surface2, borderBottom: `1px solid ${T.border}` }}>
                {['Artifact', 'Decision answered', 'What to inspect'].map((head) => (
                  <th key={head} style={{ padding: '13px 14px', textAlign: 'left', color: T.faint, fontFamily: T.fMono, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{head}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {artifacts.map(([artifact, decision, proof]) => (
                <tr key={artifact} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '14px', color: T.purple, fontWeight: 780 }}>{artifact}</td>
                  <td style={{ padding: '14px', color: T.ink, fontWeight: 680 }}>{decision}</td>
                  <td style={{ padding: '14px', color: T.muted }}>{proof}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Go deeper</Eyebrow>
        <SectionTitle>Use the reference sections after the first guided path.</SectionTitle>
        <StepList>
          <Step title="Learn the data substrate">
            Review setup and tenant knowledge only after you have asked Sentinel a real question. The data layer matters most when it changes an answer.
          </Step>
          <Step title="Learn the Move discipline">
            Use the phase guides when you are shaping a bet. P0 through P5 should feel like a useful operating rhythm, not compliance theater.
          </Step>
          <Step title="Learn Source when a partner decision appears">
            Do not start with vendor comparison. Start with the Move, then use Source when the delivery path requires a vendor, SI, or commercial decision.
          </Step>
        </StepList>
        <Callout kind="success" icon="→" label="Best first action">
          Open <Link href="/intelligence" style={{ color: T.teal, fontWeight: 700 }}>Intelligence</Link>, ask Sentinel what AI bet deserves a decision now, and shape the answer as a new Move.
        </Callout>
      </Section>
    </>
  );
}

function CtaLink({ href, children, secondary = false }: { href: string; children: React.ReactNode; secondary?: boolean }) {
  return (
    <Link
      href={href}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        minHeight: 44,
        padding: '11px 17px',
        borderRadius: 999,
        background: secondary ? '#fff' : T.ink,
        color: secondary ? T.ink : '#fff',
        border: `1px solid ${secondary ? T.border : T.ink}`,
        fontFamily: T.fBody,
        fontSize: 14,
        fontWeight: 760,
        textDecoration: 'none',
      }}
    >
      {children}
    </Link>
  );
}

function LearnHeroGraphic() {
  return (
    <svg viewBox="0 0 620 420" width="100%" role="img" aria-label="CXO path through AbarVa from question to value">
      <rect x="12" y="12" width="596" height="396" rx="30" fill="#fff" stroke={T.border} />
      <path d="M78 292 C160 106 460 106 542 292" fill="none" stroke={T.borderLt} strokeWidth="22" strokeLinecap="round" />
      <path d="M78 292 C160 106 460 106 542 292" fill="none" stroke={T.purple} strokeWidth="4" strokeLinecap="round" />
      {[
        [78, 292, 'Ask'],
        [190, 150, 'Decide'],
        [310, 104, 'Shape'],
        [430, 150, 'Source'],
        [542, 292, 'Track'],
      ].map(([x, y, label], index) => (
        <g key={label as string}>
          <circle cx={x as number} cy={y as number} r="24" fill={index < 2 ? T.purple : T.teal} />
          <text x={x as number} y={(y as number) + 5} textAnchor="middle" fill="#fff" fontFamily={T.fMono} fontSize="11" fontWeight="800">{index + 1}</text>
          <text x={x as number} y={(y as number) + 46} textAnchor="middle" fill={T.ink} fontFamily={T.fBody} fontSize="14" fontWeight="760">{label as string}</text>
        </g>
      ))}
      <circle cx="310" cy="202" r="38" fill={T.ink} />
      <circle cx="310" cy="186" r="10" fill="#fff" />
      <path d="M284 224 C294 206 326 206 336 224" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
      <text x="310" y="270" textAnchor="middle" fill={T.ink} fontFamily={T.fBody} fontSize="18" fontWeight="800">Human Maestro</text>
      <text x="310" y="294" textAnchor="middle" fill={T.faint} fontFamily={T.fBody} fontSize="13">agents assemble context and produce artifacts</text>
    </svg>
  );
}

function JourneyGraphic() {
  return (
    <svg viewBox="0 0 940 230" width="100%" role="img" aria-label="AbarVa 15 minute path">
      <defs>
        <linearGradient id="learnPath" x1="0%" x2="100%" y1="0%" y2="0%">
          <stop offset="0%" stopColor={T.purple} />
          <stop offset="100%" stopColor={T.teal} />
        </linearGradient>
      </defs>
      <path d="M70 116 H870" stroke="url(#learnPath)" strokeWidth="4" strokeLinecap="round" />
      {['Question', 'Brief', 'Move', 'Source', 'Tower'].map((label, index) => {
        const x = 70 + index * 200;
        return (
          <g key={label}>
            <circle cx={x} cy="116" r="28" fill={index < 2 ? T.purple : T.teal} />
            <text x={x} y="122" textAnchor="middle" fill="#fff" fontFamily={T.fMono} fontSize="12" fontWeight="800">{index + 1}</text>
            <text x={x} y="166" textAnchor="middle" fill={T.ink} fontFamily={T.fBody} fontSize="15" fontWeight="760">{label}</text>
          </g>
        );
      })}
    </svg>
  );
}
