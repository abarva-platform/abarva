import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/public-site/seo-defaults';

export const metadata: Metadata = buildPageMetadata({
  title: 'AbarVa — Decision intelligence for enterprise AI',
  description:
    'AbarVa helps enterprise leaders choose, shape, source, and prove AI initiatives with evidence, governance, and private client context.',
});

const OUTCOMES = [
  {
    label: 'Choose',
    title: 'Pick the AI bets worth funding',
    body: 'Separate attractive ideas from initiatives that have the business ownership, data readiness, workflow fit, and value case to survive execution.',
  },
  {
    label: 'Shape',
    title: 'Turn ideas into execution-ready Moves',
    body: 'Create charters, value models, operating designs, risk registers, adoption plans, and approval gates with the right human judgment built in.',
  },
  {
    label: 'Source',
    title: 'Buy with leverage, not hope',
    body: 'Use context-aware sourcing support to frame RFPs, evaluate vendors, negotiate terms, and avoid weak commitments around value, security, adoption, and AI risk.',
  },
  {
    label: 'Prove',
    title: 'Track value after launch',
    body: 'Keep every AI initiative connected to outcomes, evidence, adoption, dependencies, vendor exposure, and board-ready status.',
  },
] as const;

const VALUE_SIGNALS = [
  { metric: '$ value', label: 'at stake across AI moves', detail: 'funding, savings, leakage, growth' },
  { metric: '90 days', label: 'to decision-grade proof', detail: 'context, move, source, tower' },
  { metric: '4 gates', label: 'before funding confidence', detail: 'evidence, value, risk, adoption' },
  { metric: '1 view', label: 'for executive pressure', detail: 'value, blockers, vendors, risk' },
] as const;

const VALUE_LADDER = [
  { stage: 'Context', caption: 'Client facts, systems, contracts, KPIs, risks' },
  { stage: 'Intelligence', caption: 'Evidence-backed answers and missing-input flags' },
  { stage: 'Moves', caption: 'Business case, workflow design, gates, adoption' },
  { stage: 'Source', caption: 'RFP, vendor leverage, terms, savings proof' },
  { stage: 'Tower', caption: 'Realized value, blocked decisions, pressure map' },
] as const;

const TRUST_POINTS = [
  'Private client context stays inside tenant-bound workspaces.',
  'Recommendations distinguish client facts, pattern-backed guidance, inference, and missing evidence.',
  'Agents guide the next artifact, approval gate, and decision instead of waiting for generic prompts.',
  'Leadership sees value readiness, risk pressure, and blocked decisions across the portfolio.',
] as const;

const MODULES = [
  {
    name: 'Intelligence',
    role: 'Understand the business problem, relevant context, evidence gaps, and industry patterns before advising.',
  },
  {
    name: 'Moves',
    role: 'Shape meaningful AI initiatives into funded, governed, adoption-ready programs of work.',
  },
  {
    name: 'Source',
    role: 'Support sourcing, contracting, negotiation, and vendor strategy from the same evidence base.',
  },
  {
    name: 'Tower',
    role: 'Show executives where value is materializing, where pressure is building, and what needs action.',
  },
] as const;

function SectionShell({
  eyebrow,
  title,
  children,
  tone = 'paper',
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  tone?: 'paper' | 'ink';
}) {
  const isInk = tone === 'ink';

  return (
    <section
      style={{
        background: isInk ? 'var(--pub-ink, #000)' : 'var(--pub-paper, #faf7f1)',
        borderTop: isInk ? '1px solid rgba(255,255,255,0.1)' : '1px solid var(--pub-rule)',
        padding: '82px 32px',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <p
          style={{
            fontFamily: 'var(--pub-font-mono)',
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: isInk ? 'rgba(255,255,255,0.58)' : 'var(--pub-stone)',
            marginBottom: 14,
          }}
        >
          {eyebrow}
        </p>
        <h2
          style={{
            fontFamily: 'var(--pub-font-serif)',
            fontSize: 'clamp(32px, 4vw, 52px)',
            lineHeight: 1.06,
            letterSpacing: '-0.01em',
            color: isInk ? '#fff' : 'var(--pub-ink)',
            maxWidth: 790,
            marginBottom: 34,
          }}
        >
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export default function HomePage() {
  return (
    <>
      <section
        style={{
          minHeight: '92vh',
          background:
            'linear-gradient(180deg, rgba(250,247,241,0.96) 0%, rgba(250,247,241,1) 58%, rgba(238,244,246,0.9) 100%)',
          padding: '144px 32px 70px',
          borderBottom: '1px solid var(--pub-rule)',
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(340px, 0.85fr)',
            gap: 64,
            alignItems: 'center',
          }}
        >
          <div>
            <p
              style={{
                fontFamily: 'var(--pub-font-mono)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--pub-signal)',
                marginBottom: 20,
              }}
            >
              Enterprise AI decision intelligence
            </p>
            <h1
              style={{
                fontFamily: 'var(--pub-font-serif)',
                fontSize: 'clamp(48px, 7vw, 92px)',
                lineHeight: 0.98,
                letterSpacing: '-0.015em',
                maxWidth: 870,
                marginBottom: 24,
              }}
            >
              Turn AI ambition into decisions that survive execution.
            </h1>
            <p
              style={{
                fontSize: 'clamp(18px, 2vw, 23px)',
                lineHeight: 1.55,
                color: 'var(--pub-slate)',
                maxWidth: 720,
                marginBottom: 34,
              }}
            >
              AbarVa helps CIO, CDAO, CTO, CFO, and operating leaders choose the right
              AI initiatives, shape them into evidence-backed Moves, source the right
              partners, and prove value after launch.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <Link
                href="/sign-in"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                  padding: '0 20px',
                  borderRadius: 6,
                  background: 'var(--pub-ink)',
                  color: '#fff',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Request access
              </Link>
              <Link
                href="/sign-in"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 44,
                  padding: '0 20px',
                  borderRadius: 6,
                  border: '1px solid var(--pub-rule)',
                  color: 'var(--pub-ink)',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                Sign in
              </Link>
            </div>
          </div>

          <div
            aria-label="AbarVa operating model preview"
            style={{
              position: 'relative',
              overflow: 'hidden',
              background: '#050505',
              color: '#fff',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.18)',
              boxShadow: '0 28px 70px rgba(12,26,58,0.18)',
              padding: 26,
            }}
          >
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(135deg, rgba(0,102,204,0.22), transparent 38%), repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 52px)',
                pointerEvents: 'none',
              }}
            />
            <div style={{ position: 'relative' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto 1fr',
                gap: 12,
                alignItems: 'center',
                marginBottom: 22,
              }}
            >
              <div style={{ height: 1, background: 'rgba(255,255,255,0.16)' }} />
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono)',
                  fontSize: 11,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.58)',
                }}
              >
                Private workspace
              </p>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.16)' }} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 18,
              }}
            >
              {VALUE_SIGNALS.map((signal, index) => (
                <div
                  key={signal.label}
                  style={{
                    minHeight: 116,
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.13)',
                    background:
                      index === 0
                        ? 'linear-gradient(180deg, rgba(0,102,204,0.32), rgba(255,255,255,0.06))'
                        : 'rgba(255,255,255,0.06)',
                    padding: 14,
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--pub-font-serif)',
                      fontSize: index === 0 ? 35 : 30,
                      lineHeight: 1,
                      color: '#fff',
                      marginBottom: 8,
                    }}
                  >
                    {signal.metric}
                  </p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.82)' }}>
                    {signal.label}
                  </p>
                  <p style={{ fontSize: 11, lineHeight: 1.4, color: 'rgba(255,255,255,0.48)' }}>
                    {signal.detail}
                  </p>
                </div>
              ))}
            </div>

            {['Client context', 'Pattern-grounded reasoning', 'Decision-ready artifacts'].map(
              (item, index) => (
                <div
                  key={item}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '38px minmax(0, 1fr)',
                    gap: 14,
                    alignItems: 'start',
                    padding: '18px 0',
                    borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.12)',
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: index === 1 ? 'rgba(0,102,204,0.25)' : 'rgba(255,255,255,0.08)',
                      color: index === 1 ? '#6fb6ff' : 'rgba(255,255,255,0.72)',
                      fontFamily: 'var(--pub-font-mono)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    0{index + 1}
                  </div>
                  <div>
                    <p style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{item}</p>
                    <p style={{ fontSize: 13, lineHeight: 1.55, color: 'rgba(255,255,255,0.58)' }}>
                      {index === 0 &&
                        'Systems, vendors, initiatives, KPIs, contracts, risks, and operating facts.'}
                      {index === 1 &&
                        'Relevant industry patterns and failure modes retrieved before synthesis.'}
                      {index === 2 &&
                        'Moves, sourcing packs, value models, gates, and executive-ready summaries.'}
                    </p>
                  </div>
                </div>
              )
            )}
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="AbarVa outcome journey"
        style={{
          background: '#f2eee5',
          borderTop: '1px solid var(--pub-rule)',
          borderBottom: '1px solid var(--pub-rule)',
          padding: '42px 32px',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, minmax(0, 1fr))',
              gap: 10,
            }}
          >
            {VALUE_LADDER.map((step, index) => (
              <div
                key={step.stage}
                style={{
                  position: 'relative',
                  minHeight: 148,
                  borderRadius: 10,
                  border: '1px solid rgba(0,0,0,0.12)',
                  background: index === 4 ? '#050505' : 'rgba(255,255,255,0.54)',
                  color: index === 4 ? '#fff' : 'var(--pub-ink)',
                  padding: 18,
                  overflow: 'hidden',
                }}
              >
                <p
                  style={{
                    fontFamily: 'var(--pub-font-mono)',
                    fontSize: 11,
                    fontWeight: 700,
                    color: index === 4 ? '#6fb6ff' : 'var(--pub-signal)',
                    marginBottom: 38,
                  }}
                >
                  0{index + 1}
                </p>
                <p style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>{step.stage}</p>
                <p
                  style={{
                    fontSize: 12,
                    lineHeight: 1.45,
                    color: index === 4 ? 'rgba(255,255,255,0.64)' : 'var(--pub-slate)',
                  }}
                >
                  {step.caption}
                </p>
                {index < VALUE_LADDER.length - 1 && (
                  <span
                    aria-hidden="true"
                    style={{
                      position: 'absolute',
                      right: 14,
                      top: 18,
                      color: index === 4 ? '#fff' : 'var(--pub-signal)',
                      fontSize: 18,
                      fontWeight: 900,
                    }}
                  >
                    →
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <SectionShell
        eyebrow="What leaders use it for"
        title="One operating system for deciding, designing, sourcing, and proving AI transformation."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(238px, 1fr))',
            gap: 16,
          }}
        >
          {OUTCOMES.map((outcome) => (
            <article
              key={outcome.title}
              style={{
                minHeight: 260,
                border: '1px solid var(--pub-rule)',
                borderRadius: 8,
                padding: 24,
                background: 'rgba(255,255,255,0.42)',
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--pub-font-mono)',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--pub-signal)',
                  marginBottom: 46,
                }}
              >
                {outcome.label}
              </p>
              <h3 style={{ fontSize: 25, lineHeight: 1.14, marginBottom: 12 }}>
                {outcome.title}
              </h3>
              <p style={{ fontSize: 15, lineHeight: 1.62, color: 'var(--pub-slate)' }}>
                {outcome.body}
              </p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Business impact"
        title="AbarVa makes every AI initiative answer the questions that decide whether value will materialize."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
            gap: 18,
          }}
        >
          {[
            ['Value model', 'What dollars, cycle time, leakage, risk, experience, or productivity metric changes if this works?'],
            ['Evidence threshold', 'What client facts, baselines, contracts, workflow inputs, and adoption signals are required before funding?'],
            ['Failure modes', 'Which known industry patterns make this move likely to stall, overrun, under-adopt, or miss ROI?'],
            ['Operating model', 'What does the human own, what does the agent draft, what can be automated, and where does approval remain mandatory?'],
          ].map(([title, body]) => (
            <article
              key={title}
              style={{
                border: '1px solid var(--pub-rule)',
                borderRadius: 8,
                padding: 24,
                background: 'rgba(255,255,255,0.46)',
              }}
            >
              <h3 style={{ fontSize: 26, marginBottom: 10 }}>{title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.66, color: 'var(--pub-slate)' }}>{body}</p>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell
        tone="ink"
        eyebrow="How the agents behave"
        title="Before AbarVa advises, it knows the client phase, the business problem, the evidence required, and the value model."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
            gap: 34,
            alignItems: 'start',
          }}
        >
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.72)',
              maxWidth: 520,
            }}
          >
            AbarVa is not a public chatbot. It is a private decision workspace where agents
            guide leaders through the work: clarifying the outcome, identifying the missing
            evidence, challenging weak assumptions, and generating the artifact needed for
            the next approval gate.
          </p>
          <div style={{ display: 'grid', gap: 12 }}>
            {MODULES.map((module) => (
              <div
                key={module.name}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '118px minmax(0, 1fr)',
                  gap: 18,
                  padding: 18,
                  border: '1px solid rgba(255,255,255,0.14)',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.045)',
                }}
              >
                <p style={{ color: '#fff', fontWeight: 800 }}>{module.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.66)', lineHeight: 1.58 }}>
                  {module.role}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      <SectionShell
        eyebrow="Trust posture"
        title="Publicly simple. Privately deep. Built so enterprise leaders can trust the recommendation."
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 0.95fr) minmax(0, 1.05fr)',
            gap: 42,
            alignItems: 'start',
          }}
        >
          <div
            style={{
              border: '1px solid var(--pub-rule)',
              borderRadius: 8,
              padding: 26,
              background: '#fffaf1',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--pub-font-mono)',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--pub-signal)',
                marginBottom: 18,
              }}
            >
              What remains behind sign-in
            </p>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'var(--pub-slate)' }}>
              Client primers, training guides, pattern coverage, datasets, detailed architecture,
              workflow doctrine, demo workspaces, and generated artifacts are available only in
              authenticated workspaces or controlled collateral.
            </p>
          </div>
          <ul style={{ listStyle: 'none', display: 'grid', gap: 13, padding: 0 }}>
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '18px minmax(0, 1fr)',
                  gap: 12,
                  alignItems: 'start',
                  color: 'var(--pub-slate)',
                  fontSize: 16,
                  lineHeight: 1.62,
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    marginTop: 10,
                    background: 'var(--pub-signal)',
                  }}
                />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </SectionShell>

      <section
        style={{
          background: 'var(--pub-paper)',
          borderTop: '1px solid var(--pub-rule)',
          padding: '78px 32px 96px',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: '0 auto',
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--pub-font-serif)',
              fontSize: 'clamp(34px, 5vw, 62px)',
              lineHeight: 1.04,
              marginBottom: 18,
            }}
          >
            Built for teams making consequential AI decisions.
          </h2>
          <p
            style={{
              color: 'var(--pub-slate)',
              fontSize: 18,
              lineHeight: 1.7,
              maxWidth: 690,
              margin: '0 auto 28px',
            }}
          >
            Request access for a guided walkthrough or sign in if your workspace is already
            provisioned.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 12 }}>
            <Link
              href="/sign-in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 6,
                background: 'var(--pub-signal)',
                color: '#fff',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Request access
            </Link>
            <Link
              href="/sign-in"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 44,
                padding: '0 20px',
                borderRadius: 6,
                color: 'var(--pub-ink)',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
