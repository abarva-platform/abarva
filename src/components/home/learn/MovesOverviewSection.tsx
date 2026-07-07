'use client';
import { Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout, Flow, FlowStep, T } from './primitives';

export function MovesOverviewSection() {
  return (
    <>
      <HeroBand color="teal">
        <Eyebrow light>Strategic Moves · Apex Retail</Eyebrow>
        <SectionTitle light size="xl">APX-01: From a pressure card to a $8.1M handoff in 14 weeks.</SectionTitle>
        <Lead light>
          APX-01 &ldquo;Morrison Owned Brand Margin Recovery&rdquo; started as a single number on an Intelligence pressure card: 240bps private label GM gap across 14 segments. Fourteen weeks later it was a handed-off program with a signed business case, a named delivery team, and Ava monitoring execution in Control Tower. Here&rsquo;s the path a Strategic Move takes.
        </Lead>
      </HeroBand>

      <Section>
        <Eyebrow>Overview</Eyebrow>
        <SectionTitle>Six phases. One continuous thread.</SectionTitle>
        <Lead>
          Every Move travels the same path — P0 to P5. Each phase ends with a gate. Gates ensure genuine outputs before committing more investment. APX-01 is the clearest example of what the path looks like in practice.
        </Lead>

        <Flow>
          <FlowStep badge="P0" badgeColor="slate" icon="✏️" label="Originate" desc="7-field scaffold via Ava chat" />
          <FlowStep badge="P1" badgeColor="navy" icon="📋" label="Charter" desc="Scope, governance, stakeholders" />
          <FlowStep badge="P2" badgeColor="navy" icon="🔍" label="Discover" desc="As-is, root cause, diagnosis" />
          <FlowStep badge="P3" badgeColor="navy" icon="🎯" label="Design" desc="Target state + solution" />
          <FlowStep badge="P4" badgeColor="navy" icon="📊" label="Roadmap" desc="Execution plan + biz case" />
          <FlowStep badge="P5" badgeColor="teal" icon="🚀" label="Mobilize" desc="Handoff → Tower" />
        </Flow>
      </Section>

      {/* APX-01 milestone rail */}
      <Section>
        <Eyebrow>APX-01 · Timeline</Eyebrow>
        <SectionTitle>Fourteen weeks, phase by phase</SectionTitle>
        <Lead>
          APX-01 ran at a pace that&rsquo;s achievable when the substrate is rich and the sponsor is aligned. The phases aren&rsquo;t arbitrary checkpoints — each one unlocked the next.
        </Lead>

        <div style={{ margin: '20px 0' }}>
          {[
            {
              phase: 'P0',
              color: '#6B7280',
              soft: '#F9FAFB',
              line: '#E5E7EB',
              week: 'Week 1',
              title: 'Originated from pressure card',
              story: 'David Kim\'s team saw the Morrison GM gap card in Intelligence. One click: "→ Originate a Move." Ava pre-filled five of seven scaffold fields from the pressure card evidence. In 20 minutes: bet/outcome confirmed ("Recover Morrison private label GM from 34.2% to 36.0% across 14 underperforming segments"), archetype set (Revenue Growth), sponsor nominated (Lisa Park, CFO). APX-01 promoted to P1 before end of session.',
            },
            {
              phase: 'P1',
              color: T.navy,
              soft: T.navySoft,
              line: T.navyLine,
              week: 'Weeks 2–3',
              title: 'Charter: scope, governance, team',
              story: 'Rachel Torres (VP Owned Brands) named program lead. Lisa Park CFO confirmed as executive sponsor. Marcus Chen COO added as Consulted — he owns the markdown calendar, and any pricing changes need his sign-off before implementation. That decision-rights gap was explicit in the P1 charter. Scope: Morrison private label only, 14 flagged segments. P1→P2 gate cleared end of week 3.',
            },
            {
              phase: 'P2',
              color: T.navy,
              soft: T.navySoft,
              line: T.navyLine,
              week: 'Weeks 4–7',
              title: 'Discovery: three root causes, one critical finding',
              story: 'Rachel\'s team uploaded the Morrison pricing override log: 47% of AI-suggested prices overridden by GMs last quarter — the highest override rate in the substrate. Ava decomposed it into three root causes: (1) GMs overriding seasonal SKUs even when the model was correct, (2) no reason codes so good and bad overrides were indistinguishable, (3) Home category GM had 71% override rate — structurally different behavior. Diagnosis: the problem wasn\'t model accuracy — it was trust and transparency. Continue decision confirmed.',
            },
            {
              phase: 'P3',
              color: T.navy,
              soft: T.navySoft,
              line: T.navyLine,
              week: 'Weeks 8–10',
              title: 'Design: guardrails, reason codes, retrain cadence',
              story: 'Three design decisions, all addressing P2 root causes: (1) guardrail logic — model can only suggest within an approved price range per category, (2) mandatory reason codes — GMs must select a reason before any override, making override data useful, (3) weekly model retrain from actual sell-through instead of monthly. Sourcing decision: Build not Buy — the Oracle POS + Workday connector data is already in the substrate, James Wright\'s team can build without external vendor. P3→P4 gate cleared end of week 10.',
            },
            {
              phase: 'P4',
              color: T.navy,
              soft: T.navySoft,
              line: T.navyLine,
              week: 'Weeks 11–13',
              title: 'Business case: $1.8M in, $8.1M annual out',
              story: 'Financial model built on three value levers: markdown reduction ($4.2M/yr), mix improvement from better promo sizing ($2.6M/yr), and inventory efficiency from tighter SKU rationalization ($1.3M/yr). Total: $8.1M annual. Investment: $1.8M (6-week build, $120K UX design added late — reason code UI complexity). Payback: 2.7 months. IRR: 312%. Lisa Park signed off Thursday, week 13. The business case went to the board Friday.',
            },
            {
              phase: 'P5',
              color: T.teal,
              soft: T.tealSoft,
              line: T.tealLine,
              week: 'Week 14',
              title: 'Handoff: team assembled, Tower live',
              story: 'Karina Shah (PM) and Dev Patel (tech lead) assigned. Handoff package generated: charter, roadmap, business case, risk register. Two open risks required owner assignment before Tower acceptance: Legacy Oracle POS integration complexity (Dev Patel), and GM change management for reason code adoption (Karina Shah). Both assigned. Tower acceptance confirmed end of week 14. Ava kept watching APX-01 in Control Tower — drawing on her portfolio-monitoring expertise — and began tracking: Morrison GM rate, override rate, and SKU rationalization progress.',
            },
          ].map(({ phase, color, soft, line, week, title, story }) => (
            <div
              key={phase}
              style={{
                display: 'grid',
                gridTemplateColumns: '72px 1fr',
                gap: 0,
                marginBottom: 12,
                borderRadius: 10,
                overflow: 'hidden',
                border: `1px solid ${line}`,
              }}
            >
              <div
                style={{
                  background: soft,
                  padding: '16px 8px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingTop: 18,
                  gap: 6,
                  borderRight: `1px solid ${line}`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    color: '#fff',
                    background: color,
                    borderRadius: 4,
                    padding: '3px 8px',
                  }}
                >
                  {phase}
                </span>
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 9,
                    fontWeight: 600,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: T.faint,
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
                    marginBottom: 8,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 13,
                    color: T.muted,
                    lineHeight: 1.6,
                  }}
                >
                  {story}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Callout kind="success" icon="→" label="Use the left nav for each phase">
          The phase pages (P0–P5 in the left nav) go deep on each step — what Ava does, what gate criteria look like, what the deliverables contain. APX-01 threads through each one. Use the overview above to orient, then click into the phase you&rsquo;re working on.
        </Callout>
      </Section>

      {/* Why phase gates */}
      <Section>
        <Eyebrow>Gate logic</Eyebrow>
        <SectionTitle>Why phase gates exist</SectionTitle>
        <BodyP>
          Phase gates are not bureaucratic checkpoints. They&rsquo;re commitment contracts. Each gate asks: &ldquo;Given what we now know, is this Move still worth the next phase&rsquo;s investment?&rdquo; APX-01 passed every gate — but not every Move does. APX-04 (CDP/Loyalty) was flagged amber at P4 after a sponsor change. The gate held.
        </BodyP>
        <BodyP>
          The most important gate is P2 → Continue/Discontinue. It&rsquo;s the last low-cost exit. If P2 diagnosis reveals a fundamental blocker — wrong scope, no sponsor alignment, non-viable economics — recording a Discontinue decision is the correct call. A formally discontinued Move is recoverable. A stalled Move wastes months.
        </BodyP>

        <SubHead>Hard gate criteria vs. advisory criteria</SubHead>
        <BodyP>
          Each phase has hard criteria (gate-blocking — you cannot advance without them) and advisory criteria (surface quality — they improve downstream document quality but don&rsquo;t block). In APX-01, the only advisory criterion that slipped was the Tower Metrics Plan — it was defined late in P4, not in P3 as recommended. Ava still picked it up in Tower, but the first week of monitoring required an extra configuration session.
        </BodyP>
      </Section>
    </>
  );
}
