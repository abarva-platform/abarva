'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead,
  Callout, StepList, Step, Flow, FlowStep, T,
} from './primitives';

export function WelcomeSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>AbarVa · User Guide</Eyebrow>
        <SectionTitle light size="xl">Welcome to AbarVa.</SectionTitle>
        <Lead light>
          AbarVa is the operating system for enterprise AI programs — it helps strategy leads originate, validate, and govern AI initiatives with evidence grounded in your own data.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['Surface: All modules', 'Audience: New users', 'Time: ~45 min full read'].map((tag) => (
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

      {/* How it works */}
      <Section>
        <Eyebrow>Getting Started · 01</Eyebrow>
        <SectionTitle>How the platform works</SectionTitle>
        <Lead>
          AbarVa has four interconnected surfaces. Each has a primary AI agent. Start with Setup, explore Intelligence, then run Moves — they all feed each other.
        </Lead>

        <Flow>
          <FlowStep badge="Setup" badgeColor="slate" icon="⚙️" label="Configure" desc="Connect data, define your org context" />
          <FlowStep badge="Intel" badgeColor="purple" icon="🔭" label="Discover" desc="AI patterns, signals, pressure cards" />
          <FlowStep badge="Moves" badgeColor="navy" icon="🎯" label="Execute" desc="Phase-gated transformation programs" />
          <FlowStep badge="Tower" badgeColor="teal" icon="📡" label="Monitor" desc="Portfolio tracking, live signals" />
        </Flow>

        <Callout kind="info" icon="💬" label="One agent per surface">
          <strong>Steward</strong> runs Setup. <strong>Sentinel</strong> runs Intelligence & Source. <strong>Nexus</strong> runs Strategic Moves. <strong>Atlas</strong> runs Control Tower. Each agent has a front-of-house voice — behind each are specialist functions you never interact with directly.
        </Callout>
      </Section>

      {/* First 30 min */}
      <Section>
        <Eyebrow>Getting Started · 02</Eyebrow>
        <SectionTitle>Your first 30 minutes</SectionTitle>
        <Lead>
          The recommended path for any new user. Takes about 30 minutes. Sets you up to run your first Move with real data behind it.
        </Lead>

        <StepList>
          <Step title="Go to Setup — check connectors and tenant profile" path="/admin → Connectors & Tenant Profile">
            Before anything else, see what data is already connected and who the named executives are. This is the foundation everything else builds on.
          </Step>
          <Step title="Open Intelligence — read 3 pressure cards" path="/intelligence → Pressure Cards">
            Intelligence surfaces AI-detected patterns in your data. Reading pressure cards tells you what the system already knows about your operational state — before you've done any work.
          </Step>
          <Step title="Notice which patterns could become Moves">
            Look for the "→ Originate Move" prompt on any pressure card. This is the fastest path from signal to action — Intelligence shows you the problem, Moves is how you fix it.
          </Step>
          <Step title="Open Strategic Moves — try originating a new Move" path="/strategic-moves → + New Move">
            Click <strong>"New Move"</strong> and describe the initiative in chat. Nexus handles the rest. You don't need perfect information — a one-sentence hypothesis is enough to start.
          </Step>
        </StepList>

        <BodyP>
          The rest of this guide walks you through each surface in depth. Use the left nav to jump to any section — or read it end-to-end before your first session.
        </BodyP>
      </Section>
    </>
  );
}
