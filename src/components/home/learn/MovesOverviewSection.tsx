'use client';
/* eslint-disable react/no-unescaped-entities */
import Link from 'next/link';
import { Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Flow, FlowStep, Callout, SubHead } from './primitives';
import { T } from './primitives';

/* ── Outcome stat chip ─────────────────────────────────────────────── */
function StatChip({ value, label }: { value: string; label: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 4, minWidth: 120,
    }}>
      <span style={{ fontFamily: T.fDisp, fontSize: 28, fontWeight: 700, color: T.teal, lineHeight: 1 }}>
        {value}
      </span>
      <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.faint, textAlign: 'center', maxWidth: 110 }}>
        {label}
      </span>
    </div>
  );
}

/* ── Teaser card for the case study ────────────────────────────────── */
function CaseStudyTeaser() {
  return (
    <Link
      href="/home/learn/case-study"
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div style={{
        border: `2px solid ${T.teal}`,
        borderRadius: 12,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s ease',
      }}>
        {/* Header bar */}
        <div style={{
          background: `linear-gradient(135deg, ${T.navy} 0%, #2a3f7a 100%)`,
          padding: '20px 28px 16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span style={{
              fontFamily: T.fBody, fontSize: 11, fontWeight: 600,
              color: T.teal, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>
              Case Study · Apex Retail
            </span>
            <span style={{
              background: T.teal, color: '#fff', fontFamily: T.fBody,
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              Featured
            </span>
          </div>
          <h3 style={{
            fontFamily: T.fDisp, fontSize: 22, fontWeight: 700, color: '#fff',
            margin: 0, lineHeight: 1.25,
          }}>
            AI-Driven Demand Intelligence
          </h3>
          <p style={{ fontFamily: T.fBody, fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '6px 0 0' }}>
            From CFO note to $35.4M net value · P0→P5 in 32 weeks
          </p>
        </div>

        {/* Outcome stats */}
        <div style={{
          background: '#fff',
          borderTop: `1px solid ${T.borderLt}`,
          padding: '20px 28px',
          display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
            <StatChip value="$35.4M" label="Net 3-year value" />
            <StatChip value="13 mo" label="Payback period" />
            <StatChip value="8.9%" label="Markdown rate achieved" />
            <StatChip value="P0→P5" label="All 6 gates cleared" />
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.teal,
          }}>
            Read full case study
            <span style={{ fontSize: 16 }}>→</span>
          </div>
        </div>

        {/* Quote strip */}
        <div style={{
          background: T.surface2, borderTop: `1px solid ${T.borderLt}`,
          padding: '14px 28px', display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{ fontSize: 20, color: T.teal, lineHeight: 1, marginTop: 2 }}>"</span>
          <p style={{
            fontFamily: T.fBody, fontSize: 13, fontStyle: 'italic',
            color: T.ink, margin: 0, lineHeight: 1.5,
          }}>
            We were sitting on $47M of slow-moving inventory with a 6-week lag on replenishment signals.
            Nexus gave us the P0 scaffold in 20 minutes and the business case in 8 weeks.
          </p>
          <span style={{ fontSize: 20, color: T.teal, lineHeight: 1, marginTop: 'auto' }}>"</span>
        </div>
      </div>
    </Link>
  );
}

/* ── Main component ─────────────────────────────────────────────────── */
export function MovesOverviewSection() {
  return (
    <>
      <HeroBand color="teal">
        <Eyebrow light>Strategic Moves</Eyebrow>
        <SectionTitle light size="xl" level={1}>What is a Strategic Move?</SectionTitle>
        <Lead light>
          A Strategic Move is a phase-gated transformation program — a structured, evidence-backed way to
          take any AI or operational initiative from a one-line hypothesis to a handed-off delivery with
          full documentation, governance, and a signed business case.
        </Lead>
      </HeroBand>

      {/* ── Case study anchor ─────────────────────────────────────────── */}
      <Section>
        <Eyebrow>See it in action first</Eyebrow>
        <SectionTitle>A real Move — $35M in 32 weeks</SectionTitle>
        <Lead>
          Before diving into phase details, read how Apex Retail used Strategic Moves to turn a CFO
          frustration note into a signed $35.4M business case. Every concept on this page is grounded
          in that example.
        </Lead>

        <CaseStudyTeaser />
      </Section>

      {/* ── Six-phase overview ───────────────────────────────────────── */}
      <Section>
        <Eyebrow>The six-phase structure</Eyebrow>
        <SectionTitle>One continuous thread — P0 to P5</SectionTitle>
        <Lead>
          Every Move travels the same path. Each phase ends with a gate. Gates ensure genuine outputs
          before committing more investment. The Apex Retail case study shows all six in action.
        </Lead>

        <Flow>
          <FlowStep badge="P0" badgeColor="slate" icon="✏️" label="Originate" desc="7-field scaffold via Nexus chat" />
          <FlowStep badge="P1" badgeColor="navy" icon="📋" label="Charter" desc="Engage sponsor, scope & governance" />
          <FlowStep badge="P2" badgeColor="navy" icon="🔍" label="Discover" desc="As-is, root causes, diagnosis" />
          <FlowStep badge="P3" badgeColor="navy" icon="🎯" label="Design" desc="Target state + sourcing strategy" />
          <FlowStep badge="P4" badgeColor="navy" icon="📊" label="Roadmap" desc="Business case + investment approval" />
          <FlowStep badge="P5" badgeColor="teal" icon="🚀" label="Mobilize" desc="Handoff → Control Tower" />
        </Flow>
      </Section>

      {/* ── What makes a Move different ─────────────────────────────── */}
      <Section>
        <Eyebrow>Why use Strategic Moves</Eyebrow>
        <SectionTitle>Structure that eliminates the #1 failure mode</SectionTitle>
        <Lead>
          Most transformation initiatives fail not because the idea was wrong — but because scope drifted,
          the sponsor wasn't formally engaged, or the business case was never actually built. Moves fix all three.
        </Lead>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {[
            {
              icon: '🎯',
              title: 'Forced scope boundary',
              body: 'P0 requires in/out scope before you can advance. The Apex team locked "Demand replenishment only — not promotions or pricing" before any work started.',
            },
            {
              icon: '👤',
              title: 'Named sponsor from day one',
              body: 'A Move can\'t promote past P0 without a named sponsor candidate. At P1, that sponsor engages on scope. Formal budget approval comes at P4 — after the business case.',
            },
            {
              icon: '📋',
              title: 'Evidence gates, not check-boxes',
              body: 'Each gate has hard criteria with evidence requirements. At P2, Apex uploaded AHT data — Nexus surfaced that 61% of excess cost traced to three root causes.',
            },
            {
              icon: '📊',
              title: 'Business case is built in, not bolted on',
              body: 'The P4 Financial Model is a 5-sheet Excel workbook seeded from your P0 value hypothesis. Apex\'s $420K vendor quote updated payback from 12 to 13 months automatically.',
            },
            {
              icon: '→',
              title: 'Handoff, not hand-wave',
              body: 'P5 produces a compiled Handoff Package with every deliverable from P1–P4. Control Tower\'s Atlas agent picks it up on day one of execution.',
            },
            {
              icon: '⏹️',
              title: 'Formal discontinue path',
              body: 'P2 is the last low-cost exit. If discovery reveals the economics don\'t work, you record a Discontinue decision with rationale. Disciplined stops > stalled programs.',
            },
          ].map((card) => (
            <div
              key={card.title}
              style={{
                background: '#fff', border: `1px solid ${T.borderLt}`,
                borderRadius: 10, padding: '20px 20px 16px',
              }}
            >
              <div style={{ fontSize: 24, marginBottom: 8 }}>{card.icon}</div>
              <SubHead>{card.title}</SubHead>
              <BodyP>{card.body}</BodyP>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Sponsor model callout ─────────────────────────────────────── */}
      <Section>
        <Callout kind="info" icon="💡" label="The two-step sponsorship model">
          {`P0 names the sponsor candidate — who should own this functionally. P1 engages them: they review the charter and sign off on scope and governance. Full financial commitment — approving cost, solution, and timeline — happens at the P4 Investment Approval gate after the business case is built. Do not ask for budget sign-off at P1.`}
        </Callout>
      </Section>

      {/* ── Where to go next ─────────────────────────────────────────── */}
      <Section>
        <Eyebrow>Where to go next</Eyebrow>
        <SectionTitle>Your learning path</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            {
              href: '/home/learn/case-study',
              badge: '★',
              badgeColor: T.teal,
              title: 'Case study: Apex Retail $35M Move',
              desc: 'Read the full P0→P5 journey with business context, Nexus contributions, and gate outcomes at every step.',
            },
            {
              href: '/home/learn/first-move',
              badge: '→',
              badgeColor: T.navy,
              title: 'Your first Move walkthrough',
              desc: 'Interactive walkthrough of a contact center AI Move — from CFO note to P5 handoff with actual Nexus chat examples.',
            },
            {
              href: '/home/learn/nexus-guide',
              badge: '🤖',
              badgeColor: T.navy,
              title: 'Working with Nexus',
              desc: 'Ownership table, prompt patterns, per-phase posture, and key limits. Essential reading before your first conversation.',
            },
            {
              href: '/home/learn/p0',
              badge: 'P0',
              badgeColor: '#6B7280',
              title: 'Start at P0 — Originate',
              desc: 'The seven scaffold fields, gate criteria, and how Nexus extracts structure from natural language chat.',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{ textDecoration: 'none', display: 'block' }}
            >
              <div style={{
                background: '#fff', border: `1px solid ${T.borderLt}`,
                borderRadius: 10, padding: '16px 20px',
                display: 'flex', alignItems: 'flex-start', gap: 16,
                transition: 'border-color 0.12s',
              }}>
                <span style={{
                  flexShrink: 0, width: 36, height: 36,
                  background: item.badgeColor, color: '#fff',
                  borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: T.fBody, fontSize: 13, fontWeight: 700,
                }}>
                  {item.badge}
                </span>
                <div>
                  <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 600, color: T.ink }}>
                    {item.title}
                  </div>
                  <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.faint, marginTop: 3, lineHeight: 1.5 }}>
                    {item.desc}
                  </div>
                </div>
                <span style={{ marginLeft: 'auto', color: T.faint, fontSize: 18, alignSelf: 'center' }}>→</span>
              </div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
