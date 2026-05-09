'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead,
  Callout, StepList, Step, TermGrid, Term, T,
} from './primitives';

export function SetupSection() {
  return (
    <>
      <HeroBand color="slate">
        <Eyebrow light>Setup · Apex Retail</Eyebrow>
        <SectionTitle light size="xl">Four connectors. Six weeks. Six pressure cards.</SectionTitle>
        <Lead light>
          When David Kim&rsquo;s team first logged into AbarVa, they had one question: &ldquo;Is our data good enough to get signal from?&rdquo; Six weeks later, Steward had a full substrate baseline and Intelligence had surfaced six pressure cards — including the 240bps Morrison margin gap that became APX-01. Here&rsquo;s how Setup created that.
        </Lead>
      </HeroBand>

      {/* Apex timeline */}
      <Section>
        <Eyebrow>Case study · Apex Retail</Eyebrow>
        <SectionTitle>Six weeks to substrate baseline</SectionTitle>
        <Lead>
          Apex Retail wired four connectors in sequence. Each one expanded the substrate and brought new signals into range. The order mattered — they started with transactional data (what actually happened) before adding operational context (why it happened).
        </Lead>

        <div style={{ margin: '24px 0' }}>
          {[
            {
              week: 'Week 1–2',
              system: 'Oracle Retail POS + Loyalty',
              icon: '🛒',
              what: 'Point-of-sale transactions, markdown events, loyalty redemption, SKU-level sell-through.',
              signal: 'Within 72 hours: promo miss rate signal appeared (34% vs 18% corpus median). Morrison private label SKUs flagged separately.',
              color: T.purpleLine,
              soft: T.purpleSoft,
            },
            {
              week: 'Week 2–3',
              system: 'Blue Yonder DC Operations',
              icon: '🏭',
              what: 'Distribution center inbound/outbound, ASN data, lead time actuals by vendor and lane.',
              signal: 'Supply chain variance pattern surfaced: ±23-day lead time variability vs ±9-day peer median. Morrison seasonal line flagged as highest-risk (62% direct import).',
              color: T.navyLine,
              soft: T.navySoft,
            },
            {
              week: 'Week 4',
              system: 'Workday Financial',
              icon: '💰',
              what: 'COGS by category, gross margin actuals, SG&A by business unit, capital allocation.',
              signal: 'GM gap decomposition became possible: 240bps gap across 14 owned brand segments confirmed with financial data. Category-level P&L visible for the first time in substrate.',
              color: T.tealLine,
              soft: T.tealSoft,
            },
            {
              week: 'Week 5',
              system: 'Kronos Store Ops + HR',
              icon: '🏪',
              what: 'Store labor hours, associate productivity metrics, scheduling data, turnover by store cohort.',
              signal: 'Labor productivity signal added context to store-level performance variance. Connected to store associate productivity program (APX-06, later originated).',
              color: '#D1FAE5',
              soft: '#ECFDF5',
            },
          ].map(({ week, system, icon, what, signal, color, soft }) => (
            <div
              key={week}
              style={{
                display: 'grid',
                gridTemplateColumns: '120px 1fr',
                gap: 0,
                marginBottom: 16,
                borderRadius: 10,
                overflow: 'hidden',
                border: `1px solid ${color}`,
              }}
            >
              <div
                style={{
                  background: soft,
                  padding: '16px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  borderRight: `1px solid ${color}`,
                }}
              >
                <span style={{ fontSize: 22 }}>{icon}</span>
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: T.muted,
                    textAlign: 'center',
                  }}
                >
                  {week}
                </span>
              </div>
              <div style={{ padding: '16px 20px', background: T.surface }}>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 13,
                    fontWeight: 700,
                    color: T.ink,
                    marginBottom: 4,
                  }}
                >
                  {system}
                </div>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 12,
                    color: T.muted,
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {what}
                </div>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 12,
                    color: T.body,
                    lineHeight: 1.5,
                    borderLeft: `2px solid ${color}`,
                    paddingLeft: 10,
                  }}
                >
                  <span
                    style={{
                      fontFamily: T.fMono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: T.faint,
                    }}
                  >
                    Signal unlocked ·{' '}
                  </span>
                  {signal}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Callout kind="success" icon="✓" label="Week 6: full substrate baseline">
          By the end of week six, Steward declared the substrate baseline complete. Intelligence surfaced six pressure cards simultaneously — the Morrison GM gap (240bps), demand forecast late signal (34% promo miss rate), supply chain variance (±23 days), contact center routing inefficiency, labor cost outlier (3 stores), and a loyalty data quality flag. Six signals in one session. David Kim&rsquo;s first question — &ldquo;Is our data good enough?&rdquo; — had an answer.
        </Callout>
      </Section>

      {/* Tenant profile */}
      <Section>
        <Eyebrow>Setup · Tenant Profile</Eyebrow>
        <SectionTitle>Apex Retail&rsquo;s tenant profile</SectionTitle>
        <Lead>
          The tenant profile is the context layer that makes signals specific to your company. Without it, Intelligence produces generic industry patterns — with it, Sentinel can say &ldquo;Marcus Chen, COO, owns the markdown calendar that&rsquo;s driving the promo miss rate.&rdquo;
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16,
            margin: '20px 0',
          }}
        >
          {/* CXO Cast */}
          <div
            style={{
              border: `1px solid ${T.border}`,
              borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                background: T.surface2,
                padding: '12px 16px',
                borderBottom: `1px solid ${T.borderLt}`,
                fontFamily: T.fMono,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: T.faint,
              }}
            >
              Executive team (5 named)
            </div>
            <div style={{ padding: '8px 0' }}>
              {[
                { name: 'David Kim', role: 'CEO', flag: 'Board sponsor · AI transformation' },
                { name: 'Marcus Chen', role: 'COO', flag: 'Owns markdown calendar · APX-01 consulted' },
                { name: 'Lisa Park', role: 'CFO', flag: 'APX-01 executive sponsor' },
                { name: 'Sarah Torres', role: 'CXO/CMO', flag: 'Loyalty + promo program owner' },
                { name: 'James Wright', role: 'CPTO', flag: 'APX-05 risk owner · infra decisions' },
              ].map(({ name, role, flag }) => (
                <div
                  key={name}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 16px',
                    borderBottom: `1px solid ${T.borderLt}`,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: T.purpleSoft,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: T.fBody,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.purple,
                      flexShrink: 0,
                    }}
                  >
                    {name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: T.fBody,
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.ink,
                      }}
                    >
                      {name} · <span style={{ color: T.muted, fontWeight: 400 }}>{role}</span>
                    </div>
                    <div
                      style={{
                        fontFamily: T.fBody,
                        fontSize: 11,
                        color: T.faint,
                        lineHeight: 1.4,
                      }}
                    >
                      {flag}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strategic priorities + BUs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: T.surface2,
                  padding: '12px 16px',
                  borderBottom: `1px solid ${T.borderLt}`,
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: T.faint,
                }}
              >
                Strategic priorities (3)
              </div>
              <div style={{ padding: '12px 16px' }}>
                {[
                  'Private label margin recovery — owned brands to 36%+ GM',
                  'Operating leverage — AI-assisted ops across stores + supply chain',
                  'Loyalty-led revenue — Morrison brand as 45% GMV target',
                ].map((p, i) => (
                  <div
                    key={i}
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 12,
                      color: T.body,
                      lineHeight: 1.5,
                      padding: '6px 0',
                      borderBottom: i < 2 ? `1px solid ${T.borderLt}` : undefined,
                    }}
                  >
                    {p}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  background: T.surface2,
                  padding: '12px 16px',
                  borderBottom: `1px solid ${T.borderLt}`,
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: T.faint,
                }}
              >
                Business units (6)
              </div>
              <div
                style={{
                  padding: '12px 16px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                {[
                  'Private Label / Owned Brands',
                  'Store Operations',
                  'E-commerce',
                  'Supply Chain',
                  'Finance',
                  'HR & Store Staffing',
                ].map((bu) => (
                  <span
                    key={bu}
                    style={{
                      fontFamily: T.fMono,
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: T.muted,
                      background: T.surface2,
                      border: `1px solid ${T.borderLt}`,
                      borderRadius: 4,
                      padding: '4px 10px',
                    }}
                  >
                    {bu}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* How to do your setup */}
      <Section>
        <Eyebrow>Your Setup</Eyebrow>
        <SectionTitle>What to do in your first setup session</SectionTitle>
        <Lead>
          You don&rsquo;t need all four connectors live before Intelligence produces signal. Apex Retail had signal within 72 hours of their first connector. Start narrow, go live, and let the substrate grow.
        </Lead>

        <StepList>
          <Step title="Wire your first data connector" path="/admin → Connectors">
            Start with transactional data — whatever system tracks what actually happened (POS, ERP, CRM). This is the evidence layer. Without it, all signals are generic industry benchmarks. With it, signals reference your actual numbers.
          </Step>
          <Step title="Add your executive team to the tenant profile" path="/admin → Tenant Profile → Executives">
            Name and title for every executive who will sponsor, own, or be consulted on Moves. Nexus looks these up when filling P0 sponsor fields and P1 charter stakeholder maps. Unnamed executives become bottlenecks — Nexus has to ask &ldquo;Who is the CFO?&rdquo; instead of already knowing.
          </Step>
          <Step title="Set 2–3 strategic priorities">
            One sentence each. These weight which Intelligence signals are most relevant to surface for your business. Apex Retail set &ldquo;Private label margin recovery&rdquo; as Priority 1 — that&rsquo;s partly why the Morrison GM gap card appeared at the top of their substrate, not buried in a list of 40 signals.
          </Step>
          <Step title="Check Intelligence — is signal appearing?" path="/intelligence → Pressure Cards">
            After your first connector is live, go to Intelligence. If the substrate has enough data, you should see pressure cards within 24–72 hours. If you see fewer than 3 cards, the connector data may be sparse or misconfigured — Steward will surface a data quality flag.
          </Step>
        </StepList>
      </Section>

      {/* Key terms */}
      <Section>
        <Eyebrow>Setup · Key Terms</Eyebrow>
        <SectionTitle>Key terms in Setup</SectionTitle>
        <TermGrid>
          <Term name="Connector">
            An integration between AbarVa and an external data system. Connectors pull data into the intelligence substrate. <em>Without connectors, Intelligence has no evidence and Moves produce generic content.</em>
          </Term>
          <Term name="Substrate">
            The combined data layer that all agents query. It includes connector data, document embeddings, and tenant context. <em>Think of it as the shared memory of the platform — everything Sentinel, Nexus, and Atlas know about your company lives here.</em>
          </Term>
          <Term name="Steward">
            The Setup agent. Guides connector configuration, runs data quality checks, and declares substrate readiness. <em>Steward is the only agent that can flag &ldquo;foundation not ready&rdquo; — a hard blocker on Move P3 sourcing quality.</em>
          </Term>
          <Term name="Tenant profile">
            Your organization&rsquo;s context layer: executive roster, strategic priorities, business units. <em>Low-effort, high-leverage — takes 30 minutes and makes every Nexus document more specific.</em>
          </Term>
          <Term name="Foundation readiness">
            An assessment of how complete and current your substrate is for a given initiative. <em>Low readiness = thin P3 design documents and weak P4 financial models. Steward surfaces readiness gaps at origination.</em>
          </Term>
          <Term name="Data quality flag">
            A Steward alert that a connector is returning sparse, stale, or malformed data. <em>Flags appear in Setup before they affect signal quality — better to catch here than in Intelligence.</em>
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
