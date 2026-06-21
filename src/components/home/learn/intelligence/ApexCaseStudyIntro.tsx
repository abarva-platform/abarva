'use client';

import Link from 'next/link';
import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  SubHead,
  Callout,
  T,
} from '@/components/home/learn/primitives';

const CHAPTERS = [
  {
    slug: 'owned-brand',
    num: '01',
    title: 'Owned Brand Margin',
    summary:
      'Private label GM is 34.2% vs 36.6% plan — 240bps below target. Promo depth, markdown timing, and mix each own a share. F213 pattern and APX-01 program.',
  },
  {
    slug: 'demand-forecast',
    num: '02',
    title: 'Demand Forecasting',
    summary:
      '40-day excess inventory vs 38-day peer median. 34% promo miss rate vs 18% corpus median. Every extra inventory day is ~$1.2M carrying cost. F215 + APX-02.',
  },
  {
    slug: 'supply-chain',
    num: '03',
    title: 'Supply Chain Risk',
    summary:
      '±23-day lead time variability. Peak season 5 months out. F221 shelfware risk pattern active. APX-05 just kicked off Phase 1.',
  },
  {
    slug: 'what-to-watch',
    num: '04',
    title: 'What to Watch',
    summary:
      'Six programs, three caution flags, one portfolio view. The board-level narrative — what to say, what to own, what to escalate.',
  },
];

export function ApexCaseStudyIntro() {
  return (
    <>
      <HeroBand color="purple">
        <Eyebrow light>Intelligence · Apex Retail Case Study</Eyebrow>
        <SectionTitle light size="xl">
          Apex Retail · Six AI programs in motion.
        </SectionTitle>
        <Lead light>
          $18B revenue, 1,200 stores, 38% of GMV in private label. Six active AI programs
          from Phase 1 to completed. This case study walks the Intelligence surface through
          a CXO&rsquo;s eyes — what the signals mean, how to read the patterns, and what
          to say when the board asks. Specifics over abstractions.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {[
            'Industry: Specialty Retail',
            'Revenue: $18B',
            'Stores: 1,200',
            'Programs: 6 active',
            'Time: ~40 min · 4 chapters',
          ].map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: T.fMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '5px 12px',
                borderRadius: 4,
                background: 'rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.9)',
                border: '1px solid rgba(255,255,255,0.14)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </HeroBand>

      <Section>
        <Eyebrow>Why a case study</Eyebrow>
        <SectionTitle>Intelligence isn&rsquo;t a dashboard. It&rsquo;s a conversation.</SectionTitle>
        <Lead>
          Most platform primers explain features: &ldquo;Intelligence shows signals and patterns.&rdquo;
          That teaches the interface, not the job. This case study shows how a real CXO team at a
          real-sized retailer should use Intelligence — which questions to ask, how to read a pressure
          card, when a pattern points to a program, and when to push back on what Ava surfaces.
        </Lead>
        <Callout kind="info" icon="📖" label="How to read this">
          Read the four chapters in order for the full picture. Each chapter ends with a{' '}
          <em>Next chapter →</em> link. If you&rsquo;re jumping to a specific topic, the chapter
          summaries below tell you exactly what each one covers.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The company</Eyebrow>
        <SectionTitle>Apex Retail at a glance</SectionTitle>
        <Lead>
          A $18B US specialty and value retailer. Private label is the margin engine — 38% of GMV
          and 44% of gross margin dollars. Everything below flows from that one fact.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            margin: '20px 0',
          }}
        >
          {[
            { label: 'Annual Revenue', value: '$18B' },
            { label: 'Store Count', value: '1,200' },
            { label: 'Private Label / GMV', value: '38%' },
            { label: 'Gross Margin (plan)', value: '36.6%' },
            { label: 'Gross Margin (actual)', value: '34.2%' },
            { label: 'Inventory DoH vs Peer', value: '47d vs 38d' },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                border: `1px solid ${T.purpleLine}`,
                borderRadius: 8,
                padding: '16px 20px',
                background: T.purpleSoft,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: T.purple,
                  marginBottom: 6,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: T.fDisp,
                  fontSize: 28,
                  color: T.ink,
                  letterSpacing: '-0.02em',
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Six programs</Eyebrow>
        <SectionTitle>What&rsquo;s in flight</SectionTitle>
        <Lead>
          Six AI programs at various stages. Two in the Validate phase (Phase 4), one
          complete. The portfolio is unevenly weighted toward execution risk — three programs
          depend on the same demand-signal infrastructure.
        </Lead>

        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontFamily: T.fBody,
              fontSize: 13,
            }}
          >
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['ID', 'Program', 'Phase', 'Key Signal', 'Pattern'].map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
                      fontFamily: T.fMono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: T.muted,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                {
                  id: 'APX-01',
                  name: 'Morrison Owned Brand Margin Recovery',
                  phase: 'P4 · Validate',
                  phaseColor: T.amber,
                  signal: 'GM 34.2% vs 36.6% plan',
                  pattern: 'F213',
                },
                {
                  id: 'APX-02',
                  name: 'Demand Forecasting Modernization',
                  phase: 'P3 · Design',
                  phaseColor: T.navy,
                  signal: '34% promo miss rate',
                  pattern: 'F215',
                },
                {
                  id: 'APX-03',
                  name: 'Store Labor Optimization',
                  phase: 'P5 · Complete',
                  phaseColor: T.teal,
                  signal: '31% mgr override rate',
                  pattern: 'F230',
                },
                {
                  id: 'APX-04',
                  name: 'Digital Assortment Copilot',
                  phase: 'P2 · Diagnose',
                  phaseColor: T.navy,
                  signal: '12% SKUs w/ zero velocity',
                  pattern: 'F217',
                },
                {
                  id: 'APX-05',
                  name: 'Supply Chain Control Tower',
                  phase: 'P1 · Initiate',
                  phaseColor: T.faint,
                  signal: '±23d lead time variability',
                  pattern: 'F221',
                },
                {
                  id: 'APX-06',
                  name: 'Returns Fraud Detection',
                  phase: 'P4 · Validate',
                  phaseColor: T.amber,
                  signal: '$180M returns cost, 74% precision',
                  pattern: 'F232',
                },
              ].map((row) => (
                <tr
                  key={row.id}
                  style={{ borderBottom: `1px solid ${T.borderLt}` }}
                >
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: T.fMono,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.purple,
                    }}
                  >
                    {row.id}
                  </td>
                  <td style={{ padding: '10px 12px', color: T.ink, fontWeight: 500 }}>
                    {row.name}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 10,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        color: row.phaseColor,
                        background: row.phaseColor + '15',
                        padding: '3px 8px',
                        borderRadius: 4,
                      }}
                    >
                      {row.phase}
                    </span>
                  </td>
                  <td style={{ padding: '10px 12px', color: T.muted }}>{row.signal}</td>
                  <td
                    style={{
                      padding: '10px 12px',
                      fontFamily: T.fMono,
                      fontSize: 11,
                      color: T.faint,
                    }}
                  >
                    {row.pattern}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Cast of characters</Eyebrow>
        <SectionTitle>The CXO team that makes these calls</SectionTitle>
        <Lead>
          Five people own the AI portfolio. Each has a different lens on the same signals.
          Knowing whose question is whose tells you how to answer it.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 14,
            margin: '20px 0',
          }}
        >
          {[
            {
              name: 'David Kim',
              role: 'CEO · Portfolio sponsor',
              bullet:
                'Owns the AI investment narrative to the board. Wants the ROI story, not the model story. His question: "Are we getting $1 back for every $1 we put in?"',
            },
            {
              name: 'Rachel Torres',
              role: 'CFO · Investment concurrence',
              bullet:
                'Signs off on program funding at P2→P3 gate. Watches gross margin and working capital closely. Her question: "What exactly is pulling down private label margin?"',
            },
            {
              name: 'Marcus Chen',
              role: 'COO · Execution owner',
              bullet:
                'Owns store ops and supply chain. Measures in NPS, labor hours, inventory turns. His question: "Which of these programs creates real operating leverage by Q4?"',
            },
            {
              name: 'Lisa Park',
              role: 'CMO · Demand signal owner',
              bullet:
                'Owns promotional strategy and assortment decisions. Most exposed to APX-01 and APX-02 patterns. Her question: "Why is our promo ROI deteriorating?"',
            },
            {
              name: 'James Wright',
              role: 'CPTO · Technical risk owner',
              bullet:
                'Owns model quality, integration contracts, and vendor risk. Sees F221 and F230 differently than the ops team. His question: "What happens if APX-02 forecasts are wrong at peak?"',
            },
          ].map(({ name, role, bullet }) => (
            <div
              key={name}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                padding: 18,
                background: T.surface,
              }}
            >
              <div
                style={{
                  fontFamily: T.fDisp,
                  fontSize: 18,
                  color: T.ink,
                  letterSpacing: '-0.01em',
                  marginBottom: 4,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.purple,
                  marginBottom: 10,
                }}
              >
                {role}
              </div>
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 13,
                  color: T.muted,
                  lineHeight: 1.55,
                }}
              >
                {bullet}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>The chapters</Eyebrow>
        <SectionTitle>Four chapters, one portfolio</SectionTitle>
        <Lead>
          Each chapter follows one CXO question from signal to answer. Read in order to understand
          how the programs interlock. Or jump directly to the chapter that matches your question right now.
        </Lead>

        <ol
          style={{
            listStyle: 'none',
            padding: 0,
            margin: '24px 0 0',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {CHAPTERS.map(({ slug, num, title, summary }) => (
            <li key={slug}>
              <Link
                href={`/home/learn/intelligence/${slug}`}
                style={{
                  display: 'flex',
                  gap: 16,
                  alignItems: 'flex-start',
                  padding: '12px 16px',
                  border: `1px solid ${T.borderLt}`,
                  borderRadius: 8,
                  background: T.surface,
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#fff',
                    background: T.purple,
                    borderRadius: 4,
                    padding: '4px 8px',
                    flexShrink: 0,
                    width: 32,
                    textAlign: 'center',
                  }}
                >
                  {num}
                </span>
                <div>
                  <div
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 14,
                      fontWeight: 700,
                      color: T.ink,
                      marginBottom: 4,
                    }}
                  >
                    {title}
                  </div>
                  <div
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 13,
                      color: T.muted,
                      lineHeight: 1.5,
                    }}
                  >
                    {summary}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
