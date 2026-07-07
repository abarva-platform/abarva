'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead,
  Callout, StepList, Step, TermGrid, Term, T, InlineAbarvaLogo,
} from './primitives';

export function SetupSection() {
  return (
    <>
      <HeroBand color="slate">
        <Eyebrow light>Admin workspace · Apex Retail</Eyebrow>
        <SectionTitle light size="xl">Preloaded substrate. Current-state answers. No configuration theatre.</SectionTitle>
        <Lead light>
          For the CXO review, Apex Retail is already loaded. The point is not to watch connectors get configured; it is to prove <InlineAbarvaLogo light /> can reason from a believable enterprise baseline before it recommends an AI bet.
        </Lead>
      </HeroBand>

      {/* Apex timeline */}
      <Section>
        <Eyebrow>Case study · Apex Retail</Eyebrow>
        <SectionTitle>What the Apex substrate already knows</SectionTitle>
        <Lead>
          Treat Admin as the evidence room behind the demo. Apex has enterprise profile, org structure, IT landscape, IT financials, KPI history, vendor contracts, sourcing artifacts, decision traces, evidence, telemetry, graph relationships, and AI transformation records loaded before the reviewer arrives.
        </Lead>

        <div style={{ margin: '24px 0' }}>
          {[
            {
              week: 'Layer 1',
              system: 'Enterprise + org baseline',
              icon: '🛒',
              what: 'Enterprise profile, executive roster, decision rights, political map, strategic priorities, and program ownership.',
              signal: 'Ava can answer who owns the decision, who should approve, and which leadership gaps would block a Move from scaling.',
              color: T.purpleLine,
              soft: T.purpleSoft,
            },
            {
              week: 'Layer 2',
              system: 'Technology + data landscape',
              icon: '🏭',
              what: 'Systems inventory, integrations, ownership, infrastructure dependencies, data platforms, and known technology constraints.',
              signal: 'Ava can discuss whether a Move is a product/platform problem, a vendor decision, an integration risk, or an operating-model gap.',
              color: T.navyLine,
              soft: T.navySoft,
            },
            {
              week: 'Layer 3',
              system: 'Financials + value baseline',
              icon: '💰',
              what: 'IT spend, financial model, KPI history, renewal posture, program economics, and value-at-stake ranges.',
              signal: 'A CIPO or CFO can challenge whether the value case is real, which costs are in scope, and which metrics should gate approval.',
              color: T.tealLine,
              soft: T.tealSoft,
            },
            {
              week: 'Layer 4',
              system: 'Evidence + sourcing + portfolio signals',
              icon: '🏪',
              what: 'Sourcing artifacts, vendor contracts, evidence ledger, operating telemetry, decision traces, and cross-program signals.',
              signal: 'The app can decide whether the next step belongs in Intelligence, Moves, Source, or Tower instead of forcing every problem through one workflow.',
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

        <Callout kind="success" icon="✓" label="Demo-ready baseline">
          The CXO reviewer does not need to configure anything. Admin should communicate what is loaded, what is stubbed or pending, and why the current-state substrate is strong enough to support a real product-and-technology conversation.
        </Callout>
      </Section>

      {/* Tenant profile */}
      <Section>
        <Eyebrow>Admin workspace · Tenant Profile</Eyebrow>
        <SectionTitle>Apex Retail&rsquo;s tenant profile</SectionTitle>
        <Lead>
          The tenant profile is the context layer that makes signals specific to your company. Without it, Intelligence produces generic industry patterns — with it, Ava can say &ldquo;Marcus Chen, COO, owns the markdown calendar that&rsquo;s driving the promo miss rate.&rdquo;
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

      {/* How to prepare your admin workspace */}
      <Section>
        <Eyebrow>Your Admin Workspace</Eyebrow>
        <SectionTitle>How admin readiness should feel for a real customer</SectionTitle>
        <Lead>
          The demo starts from a loaded composite tenant. In a real implementation, Ava should be explicit about what is connected, what is document-loaded, what is inferred, and what is not ready yet. That honesty is part of the product.
        </Lead>

        <StepList>
          <Step title="Load the first decision substrate" path="/admin → Data">
            Start with the facts required for executive decisions: org structure, systems, vendor contracts, financial baselines, KPIs, active initiatives, and evidence documents. Live connectors are valuable, but documents and verified extracts can create useful signal first.
          </Step>
          <Step title="Add your executive team to the tenant profile" path="/admin → Tenant Profile → Executives">
            Name and title for every executive who will sponsor, own, or be consulted on Moves. Ava looks these up when filling P0 sponsor fields and P1 charter stakeholder maps. Unnamed executives become bottlenecks — Ava has to ask &ldquo;Who is the CFO?&rdquo; instead of already knowing.
          </Step>
          <Step title="Set 2–3 strategic priorities">
            One sentence each. These weight which Intelligence signals are most relevant to surface for your business. Apex Retail set &ldquo;Private label margin recovery&rdquo; as Priority 1 — that&rsquo;s partly why the Morrison GM gap card appeared at the top of their substrate, not buried in a list of 40 signals.
          </Step>
          <Step title="Check Intelligence — is the current state answerable?" path="/intelligence">
            Before creating a Move, ask current-state questions: who owns the platform, which systems are implicated, what costs are in scope, which evidence is strong, and what is missing. If those answers are thin, the substrate is not ready for high-stakes guidance.
          </Step>
        </StepList>
      </Section>

      {/* Key terms */}
      <Section>
        <Eyebrow>Admin workspace · Key Terms</Eyebrow>
        <SectionTitle>Key terms in Admin</SectionTitle>
        <TermGrid>
          <Term name="Connector">
            An integration between <InlineAbarvaLogo /> and an external data system. Connectors strengthen freshness, but they are not the only evidence path. <em>Verified documents, extracts, and persisted tenant records can also ground Intelligence and Moves.</em>
          </Term>
          <Term name="Substrate">
            The combined data layer Ava queries. It includes tenant records, documents, embeddings, graph relationships, program state, sourcing artifacts, and connector data where available. <em>Think of it as the shared evidence base, not a generic memory.</em>
          </Term>
          <Term name="Ava (in Admin)">
            The same assistant you talk to on every surface. In Admin she draws on her data-onboarding specialty to guide connector configuration, run data quality checks, and declare substrate readiness — there&rsquo;s no separate Admin bot and no handoff. <em>In this specialty she is the one who can flag &ldquo;foundation not ready&rdquo; — a hard blocker on Move P3 sourcing quality.</em>
          </Term>
          <Term name="Tenant profile">
            Your organization&rsquo;s context layer: executive roster, strategic priorities, business units. <em>Low-effort, high-leverage — takes 30 minutes and makes every document Ava drafts more specific.</em>
          </Term>
          <Term name="Foundation readiness">
            An assessment of how complete and current your substrate is for a given initiative. <em>Low readiness = thin P3 design documents and weak P4 financial models. Ava surfaces readiness gaps at origination.</em>
          </Term>
          <Term name="Data quality flag">
            An alert from Ava that a connector is returning sparse, stale, or malformed data. <em>Flags appear in Admin before they affect signal quality — better to catch here than in Intelligence.</em>
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
