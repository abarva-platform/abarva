'use client';
import Link from 'next/link';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead,
  Callout, StepList, Step, T,
} from './primitives';

export function WelcomeSection() {
  return (
    <>
      <HeroBand color="navy">
        <Eyebrow light>AbarVa · User Guide</Eyebrow>
        <SectionTitle light size="xl">Two companies. One complete platform story.</SectionTitle>
        <Lead light>
          This guide teaches AbarVa through two enterprise-scale composite clients running real programs. Apex Retail threads through Setup, Intelligence, Moves, and Tower. Heliara Health threads through Source. Follow their stories — the platform makes more sense with numbers behind it.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['4 modules · 2 case studies', 'Apex Retail + Heliara Health', '~2 hr full read'].map((tag) => (
            <span key={tag} style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, background: 'rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.14)' }}>{tag}</span>
          ))}
        </div>
      </HeroBand>

      {/* Two companies */}
      <Section>
        <Eyebrow>The case studies</Eyebrow>
        <SectionTitle>The two companies in this guide</SectionTitle>
        <Lead>
          Abstract walkthroughs teach the diagram. Case studies teach the job. Pick the company that matches your context — or read both.
        </Lead>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, margin: '24px 0' }}>
          {/* Apex Retail */}
          <div style={{ border: `2px solid ${T.purpleLine}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#4C1D95 0%,#5B21B6 100%)', padding: '20px 24px' }}>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Case study · Setup → Intelligence → Moves → Tower</div>
              <div style={{ fontFamily: T.fDisp, fontSize: 22, color: '#fff', letterSpacing: '-0.01em', marginBottom: 4 }}>Apex Retail</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>$24.8B omnichannel retailer · 480 stores · 12 DCs · 6 active AI programs</div>
            </div>
            <div style={{ padding: '20px 24px', background: T.surface }}>
              {[
                { icon: '⚙️', module: 'Setup', desc: 'Connected 4 data sources. Substrate baseline in 6 weeks.' },
                { icon: '🔭', module: 'Intelligence', desc: '240bps GM gap decomposed. Six pressure cards. Real patterns.' },
                { icon: '🎯', module: 'Moves', desc: 'APX-01 Owned Brand Margin: P0 to P5 handoff in 14 weeks.' },
                { icon: '📡', module: 'Tower', desc: '6 programs in Atlas. 1 complete. 2 in Validate. 1 at risk.' },
              ].map(({ icon, module, desc }) => (
                <div key={module} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.borderLt}` }}>
                  <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{icon}</span>
                  <div>
                    <span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.purple }}>{module} · </span>
                    <span style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Heliara Health */}
          <div style={{ border: `2px solid ${T.navyLine}`, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ background: 'linear-gradient(135deg,#1B2B5C 0%,#253872 100%)', padding: '20px 24px' }}>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', marginBottom: 6 }}>Case study · Source</div>
              <div style={{ fontFamily: T.fDisp, fontSize: 22, color: '#fff', letterSpacing: '-0.01em', marginBottom: 4 }}>Heliara Health</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>$18.6B provider-payer IDN · 23 hospitals · 142 clinics · $7.1B plan revenue · 11 Source chapters</div>
            </div>
            <div style={{ padding: '20px 24px', background: T.surface }}>
              {[
                { icon: '📋', module: 'Source', desc: 'One enterprise sourcing event: cloud, Epic, integration, and health-plan data posture.' },
                { icon: '⚖️', module: 'Ch.01–05', desc: 'Strategy → Scope → RFP → Responses → Evaluation.' },
                { icon: '💰', module: 'Ch.06–08', desc: 'Pricing traps → BAFO → Decision. Three P0 pricing issues caught.' },
                { icon: '🚀', module: 'Ch.09–11', desc: 'Selection → Transition slip → value-realization gap traced.' },
              ].map(({ icon, module, desc }) => (
                <div key={module} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: `1px solid ${T.borderLt}` }}>
                  <span style={{ fontSize: 16, flexShrink: 0, width: 20, textAlign: 'center' }}>{icon}</span>
                  <div>
                    <span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.navy }}>{module} · </span>
                    <span style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted }}>{desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* Platform map */}
      <Section>
        <Eyebrow>Platform overview</Eyebrow>
        <SectionTitle>Four surfaces. Four agents. One continuous thread.</SectionTitle>
        <Lead>
          Every module feeds the next. Setup builds the substrate. Intelligence reads it. Moves act on it. Tower monitors what Moves create. Skip any link in the chain and the downstream quality drops.
        </Lead>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 0, border: `1px solid ${T.border}`, borderRadius: 12, overflow: 'hidden', margin: '20px 0' }}>
          {[
            { badge: 'Setup', agent: 'Steward', color: '#374151', icon: '⚙️', title: 'Wire the substrate', body: 'Connect data, configure tenant profile, name executives. Steward guides the configuration. No setup → no substrate → generic Intelligence.' },
            { badge: 'Intelligence', agent: 'Sentinel', color: T.purple, icon: '🔭', title: 'Read the signals', body: 'AI-detected patterns surface as pressure cards. Sentinel answers questions, drills into evidence. Patterns become Move hypotheses with one click.' },
            { badge: 'Moves', agent: 'Nexus', color: T.navy, icon: '🎯', title: 'Run the program', body: 'Phase-gated transformation from hypothesis to handoff. Nexus fills documents, tracks gates, orchestrates specialists. P0 to P5.' },
            { badge: 'Tower', agent: 'Atlas', color: T.teal, icon: '📡', title: 'Monitor execution', body: 'Portfolio heatmap, KPI tracking, execution alerts. Atlas watches after P5 handoff. Execution signals feed back into Intelligence — the cycle closes.' },
          ].map(({ badge, agent, color, icon, title, body }) => (
            <div key={badge} style={{ padding: '24px 20px', borderRight: `1px solid ${T.borderLt}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', background: color, color: '#fff', borderRadius: 4, padding: '3px 8px' }}>{badge}</span>
                <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.faint }}>{agent}</span>
              </div>
              <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{title}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.muted, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>

        <Callout kind="info" icon="💬" label="One agent front-of-house per surface">
          Steward, Sentinel, Nexus, and Atlas are the voices you interact with. Behind each are specialist functions — evidence analysts, financial modelers, risk reviewers — that you never interact with directly. The agent orchestrates; you only see the result.
        </Callout>
      </Section>

      {/* Apex Retail first 30 minutes */}
      <Section>
        <Eyebrow>Getting started</Eyebrow>
        <SectionTitle>Apex Retail&rsquo;s first 30 minutes</SectionTitle>
        <Lead>
          The first time David Kim&rsquo;s team logged in, they had four connectors, five named executives, and no idea what signals were waiting. Here&rsquo;s what the first session looked like — and what to do in yours.
        </Lead>

        <StepList>
          <Step title="Go to Setup — check connectors and tenant profile" path="/admin → Connectors & Tenant Profile">
            Before anything else, see what data is connected and who the named executives are. Apex Retail wired POS data first. Three days later, the promo miss rate signal appeared. The substrate starts the moment a connector goes live.
          </Step>
          <Step title="Open Intelligence — read the pressure cards" path="/intelligence → Pressure Cards">
            Apex Retail&rsquo;s first session surfaced six pressure cards. The highest severity: 240bps private label GM gap across 14 segments. They didn&rsquo;t ask for it — the substrate put it in front of them. Browse your cards and read the evidence behind two or three.
          </Step>
          <Step title="Ask Sentinel something specific about a card">
            Don&rsquo;t just read the card. Ask: <strong>&ldquo;What&rsquo;s driving the margin gap?&rdquo;</strong> or <strong>&ldquo;Which categories are most affected?&rdquo;</strong> Sentinel drills into the substrate before you originate anything. The better the question, the stronger the Move scaffold.
          </Step>
          <Step title="Originate your first Move from a pressure card" path="Pressure card → Originate a Move → /strategic-moves">
            Click <strong>&ldquo;→ Originate a Move&rdquo;</strong> on any pressure card. Nexus pre-fills the scaffold from the card data. You confirm fields, name the Move, and promote to P1. Apex Retail originated APX-01 this way — from the GM pressure card to a named P0 scaffold in one session.
          </Step>
        </StepList>
      </Section>

      {/* How to use this guide */}
      <Section>
        <Eyebrow>How to use this guide</Eyebrow>
        <SectionTitle>Read it as one story or jump to what you need</SectionTitle>

        <SubHead>Follow Apex Retail for the platform modules</SubHead>
        <BodyP>
          Start at <Link href="/home/learn/setup" style={{ color: T.purple, fontWeight: 600 }}>Setup</Link> — see what they connected and why. Then <Link href="/home/learn/intelligence" style={{ color: T.purple, fontWeight: 600 }}>Intelligence</Link> — the signals their substrate surfaced. Then <Link href="/home/learn/moves-overview" style={{ color: T.purple, fontWeight: 600 }}>Strategic Moves</Link> — APX-01 walked P0 to P5. Then <Link href="/home/learn/tower" style={{ color: T.purple, fontWeight: 600 }}>Tower</Link> — Atlas watching the portfolio. About 90 minutes cover-to-cover.
        </BodyP>

        <SubHead>Follow Heliara for Source</SubHead>
        <BodyP>
          <Link href="/home/learn/source/welcome" style={{ color: T.navy, fontWeight: 600 }}>Source</Link> has its own case study — Heliara Health&rsquo;s enterprise cloud, Epic integration, and health-plan data sourcing event, eleven chapters from the day the CTO circled a lease number in red to the month-18 value realization audit. About 50 minutes cover-to-cover.
        </BodyP>

        <SubHead>Jump to where you are</SubHead>
        <BodyP>
          Already mid-program? Use the left nav. The phase sections (P0–P5) are standalone — each opens with the APX-01 story recap so you can orient without reading from the top. Gates &amp; evidence and Glossary are always at the bottom for reference.
        </BodyP>

        <Callout kind="success" icon="→" label="Start here if you have 5 minutes">
          Go to <Link href="/home/learn/intelligence" style={{ color: T.teal, fontWeight: 600 }}>Intelligence</Link> and read the Apex Retail company portrait and program table. That one page tells you everything about what the platform is doing for a real customer — and makes the rest of the guide make sense.
        </Callout>
      </Section>
    </>
  );
}
