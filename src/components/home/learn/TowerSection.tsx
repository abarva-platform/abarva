'use client';
import { Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, Callout, TermGrid, Term, T } from './primitives';

export function TowerSection() {
  return (
    <>
      <HeroBand color="teal">
        <Eyebrow light>Control Tower · Apex Retail</Eyebrow>
        <SectionTitle light size="xl">Six programs. One heatmap. Ava watches what Moves create.</SectionTitle>
        <Lead light>
          Apex Retail has six AI programs running simultaneously. APX-01 is in execution. APX-02 is mid-design. APX-03 is complete and generating validation data. APX-04 is flagged amber. APX-05 has a gate-miss alert. APX-06 is just originating. In Control Tower, Ava draws on her portfolio-monitoring expertise to watch all of it — and surfaces the signal that matters before the quarterly review asks for it. Same assistant you talk to everywhere else, no handoff to a different agent.
        </Lead>
      </HeroBand>

      {/* Portfolio heatmap */}
      <Section>
        <Eyebrow>Apex Retail portfolio</Eyebrow>
        <SectionTitle>Six programs in Control Tower</SectionTitle>
        <Lead>
          The portfolio heatmap shows every active Move with phase, gate status, and health signal. Green is on track. Amber is advisory. Red is blocked. Ava shows you where to look — you decide what to do.
        </Lead>

        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 12,
            overflow: 'hidden',
            margin: '20px 0',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 80px 80px 160px',
              gap: 0,
              background: T.surface2,
              borderBottom: `1px solid ${T.border}`,
              padding: '10px 20px',
            }}
          >
            {['Program', 'Phase', 'Status', 'Ava signal'].map((h) => (
              <div
                key={h}
                style={{
                  fontFamily: T.fMono,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: T.faint,
                }}
              >
                {h}
              </div>
            ))}
          </div>

          {[
            {
              id: 'APX-01',
              name: 'Morrison Owned Brand Margin Recovery',
              phase: 'P5',
              phaseLabel: 'Execution',
              status: 'green',
              statusLabel: 'On track',
              signal: 'Override rate: 47% → 38% (↓ 9pts). GM rate: 34.2% → 34.8% (↑ 60bps). Home GM still flagged.',
              detail: 'Karina Shah PM · Dev Patel tech lead · Week 8 of execution',
            },
            {
              id: 'APX-02',
              name: 'Demand Forecasting Modernization',
              phase: 'P3',
              phaseLabel: 'Design',
              status: 'green',
              statusLabel: 'On track',
              signal: 'P3→P4 gate target: end of Q2. CDC pipeline decision pending sign-off from James Wright.',
              detail: 'Rachel Torres PM · Q2 gate target',
            },
            {
              id: 'APX-03',
              name: 'Contact Center AI Routing',
              phase: '✓',
              phaseLabel: 'Complete',
              status: 'teal',
              statusLabel: 'Validating',
              signal: 'AHT: 8.2min → 6.1min (↓ 26%). Override rate: 31% → 19% (↓ 12pts). P4 value case tracking ahead of plan.',
              detail: 'Completed Q4 · Ava monitoring KPIs · Value validation in progress',
            },
            {
              id: 'APX-04',
              name: 'Customer Data Platform + Loyalty',
              phase: 'P4',
              phaseLabel: 'Biz Case',
              status: 'amber',
              statusLabel: 'At risk',
              signal: 'Sponsor change: Sarah Torres on leave; Ops Council has not assigned an interim owner. Investment approval gate stalled at week 3.',
              detail: 'Gate blocked · Sponsor gap flagged · Ava escalation sent',
            },
            {
              id: 'APX-05',
              name: 'Supply Chain Control Tower',
              phase: 'P1',
              phaseLabel: 'Charter',
              status: 'amber',
              statusLabel: 'Alert',
              signal: 'Gate-miss alert: P1→P2 must pass by end of May for peak-season deployment. 3 weeks remaining.',
              detail: 'James Wright owner · May gate deadline · Morrison seasonal risk in scope',
            },
            {
              id: 'APX-06',
              name: 'Store Associate Productivity',
              phase: 'P0',
              phaseLabel: 'Originating',
              status: 'grey',
              statusLabel: 'New',
              signal: 'Scaffold in progress. Kronos connector data seeding origination. Sponsor not yet named.',
              detail: 'P0 in progress · Ava flagged foundation readiness as partial',
            },
          ].map(({ id, name, phase, phaseLabel, status, statusLabel, signal, detail }) => {
            const statusColors: Record<string, { bg: string; text: string; border: string }> = {
              green: { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
              amber: { bg: '#FFFBEB', text: '#92400E', border: '#FCD34D' },
              red: { bg: '#FEF2F2', text: '#991B1B', border: '#FCA5A5' },
              teal: { bg: T.tealSoft, text: '#0F766E', border: T.tealLine },
              grey: { bg: T.surface2, text: T.muted, border: T.borderLt },
            };
            const sc = statusColors[status] ?? statusColors.grey;

            return (
              <div
                key={id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 80px 80px 160px',
                  gap: 0,
                  padding: '14px 20px',
                  borderBottom: `1px solid ${T.borderLt}`,
                  alignItems: 'start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                    <span
                      style={{
                        fontFamily: T.fMono,
                        fontSize: 10,
                        fontWeight: 700,
                        color: T.faint,
                      }}
                    >
                      {id}
                    </span>
                    <span
                      style={{
                        fontFamily: T.fBody,
                        fontSize: 13,
                        fontWeight: 600,
                        color: T.ink,
                      }}
                    >
                      {name}
                    </span>
                  </div>
                  <div
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 11,
                      color: T.faint,
                    }}
                  >
                    {detail}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: T.fMono,
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: '0.05em',
                      color: '#fff',
                      background: phase === '✓' ? '#0F766E' : T.navy,
                      borderRadius: 4,
                      padding: '2px 7px',
                    }}
                  >
                    {phase}
                  </span>
                  <div
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 10,
                      color: T.faint,
                      marginTop: 3,
                    }}
                  >
                    {phaseLabel}
                  </div>
                </div>
                <div>
                  <span
                    style={{
                      fontFamily: T.fMono,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      color: sc.text,
                      background: sc.bg,
                      border: `1px solid ${sc.border}`,
                      borderRadius: 4,
                      padding: '2px 7px',
                    }}
                  >
                    {statusLabel}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 11,
                    color: T.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {signal}
                </div>
              </div>
            );
          })}
        </div>

        <Callout kind="warn" icon="⚠️" label="APX-04 and APX-05: what Ava does when programs slip">
          APX-04&rsquo;s sponsor gap and APX-05&rsquo;s gate deadline are both amber, not red. Ava escalates when a program is at risk, not just when it&rsquo;s failed. The APX-05 alert went to James Wright three weeks before the May gate — giving enough time to act. That&rsquo;s the difference between monitoring and watching something fail.
        </Callout>
      </Section>

      {/* APX-03: completed program validation */}
      <Section>
        <Eyebrow>APX-03 · Completed program</Eyebrow>
        <SectionTitle>What Tower does after a Move completes</SectionTitle>
        <Lead>
          APX-03 Contact Center AI Routing completed last quarter. The program is closed — but Ava is still watching. The P4 business case projected 28% AHT reduction. Actual performance is 26%. The value validation gap feeds back into Intelligence.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            margin: '16px 0',
          }}
        >
          {[
            { metric: 'AHT (avg handle time)', before: '8.2 min', after: '6.1 min', change: '↓ 26%', plan: '28%', status: 'amber' },
            { metric: 'Override rate', before: '31%', after: '19%', change: '↓ 12pts', plan: '12pts', status: 'green' },
            { metric: 'CSAT (post-routing)', before: '3.8/5', after: '4.2/5', change: '↑ 0.4pts', plan: '0.3pts', status: 'green' },
            { metric: 'P4 value case', before: '$6.4M/yr', after: '$5.9M/yr', change: '↓ 8%', plan: 'On plan', status: 'amber' },
          ].map(({ metric, before, after, change, plan, status }) => (
            <div
              key={metric}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '14px 16px',
                background: T.surface,
              }}
            >
              <div
                style={{
                  fontFamily: T.fBody,
                  fontSize: 11,
                  fontWeight: 600,
                  color: T.muted,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {metric}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                <span style={{ fontFamily: T.fBody, fontSize: 11, color: T.faint }}>Before</span>
                <span style={{ fontFamily: T.fMono, fontSize: 12, color: T.muted }}>{before}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
                <span style={{ fontFamily: T.fBody, fontSize: 11, color: T.faint }}>Now</span>
                <span style={{ fontFamily: T.fMono, fontSize: 13, fontWeight: 700, color: T.ink }}>{after}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderRadius: 4,
                  background: status === 'green' ? '#F0FDF4' : '#FFFBEB',
                  border: `1px solid ${status === 'green' ? '#86EFAC' : '#FCD34D'}`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 10,
                    fontWeight: 700,
                    color: status === 'green' ? '#15803D' : '#92400E',
                  }}
                >
                  {change}
                </span>
                <span style={{ fontFamily: T.fBody, fontSize: 10, color: T.faint }}>plan: {plan}</span>
              </div>
            </div>
          ))}
        </div>

        <BodyP>
          The 26% AHT reduction vs 28% plan looks like a miss — but the CSAT improvement exceeded plan (+0.4 vs +0.3 target). Ava surfaced both. The value model captured AHT and override rate, not CSAT. The actual CSAT gain is new evidence the Intelligence substrate now carries — the next customer experience program (if originated) will start with that benchmark.
        </BodyP>
      </Section>

      {/* APX-01 Tower: early execution */}
      <Section>
        <Eyebrow>APX-01 · Execution monitoring</Eyebrow>
        <SectionTitle>Ava watching APX-01 in real time</SectionTitle>
        <Lead>
          APX-01 has been in execution for 8 weeks. Ava is tracking three KPIs from the P4 Tower Metrics Plan. Two are improving. One — the Home category override rate — is not.
        </Lead>

        <div
          style={{
            background: '#FFFBEB',
            border: '1px solid #FCD34D',
            borderRadius: 10,
            padding: '16px 20px',
            margin: '16px 0',
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: '#92400E',
              marginBottom: 10,
            }}
          >
            Ava alert · APX-01 · Home category override rate
          </div>
          <div
            style={{
              fontFamily: T.fBody,
              fontSize: 13,
              color: '#78350F',
              lineHeight: 1.6,
            }}
          >
            Home category GM override rate: 68% (week 8 of execution) vs 47% program baseline. Portfolio average has declined to 38% — Home is diverging further. P2 risk &ldquo;GM change management for reason code adoption&rdquo; (owner: Karina Shah) appears to be materializing in this category specifically. Recommend: direct conversation with Home GM; consider category-level guardrail adjustment. Ava has flagged this to Karina Shah&rsquo;s weekly summary.
          </div>
        </div>

        <BodyP>
          This is what Tower monitoring is for. The P2 risk register flagged Home as a behavioral outlier at diagnosis. P5 assigned Karina Shah as risk owner. Ava surfaced the alert in week 8 — before it showed up in quarterly GM data. Karina can act now, not after the quarter closes.
        </BodyP>
      </Section>

      {/* Key terms */}
      <Section>
        <Eyebrow>Control Tower · Key Terms</Eyebrow>
        <SectionTitle>Key terms in Control Tower</SectionTitle>
        <TermGrid>
          <Term name="Portfolio heatmap">
            A grid of all active Moves showing phase, gate status, and health signal. <em>Green = on track. Amber = advisory. Red = blocked. Ava updates it in real time from program signals and KPI data.</em>
          </Term>
          <Term name="Execution pressure card">
            A signal generated during execution — a KPI missing target, a vendor dependency flagged, or a timeline slip. <em>These feed back into Intelligence and may spawn new Moves. APX-03&rsquo;s CSAT improvement created a new substrate benchmark this way.</em>
          </Term>
          <Term name="Ava (in Control Tower)">
            The same assistant you talk to on every surface. In Control Tower she draws on her portfolio-monitoring specialty to answer questions about portfolio status, execution risk, and signal health — there&rsquo;s no separate Tower bot and no handoff. <em>&ldquo;Ava, which Move is at highest risk of missing its P4 gate this quarter?&rdquo; Ava: &ldquo;APX-04 — sponsor gap, week 3 stalled, escalation sent.&rdquo;</em>
          </Term>
          <Term name="Gate-miss alert">
            An alert from Ava that a program is approaching a gate deadline without the required gate criteria met. <em>APX-05 received a gate-miss alert three weeks before the May P1→P2 deadline — enough time to act.</em>
          </Term>
          <Term name="Value validation">
            The post-completion comparison between the P4 business case projections and actual execution results. <em>APX-03 is in value validation now. Ava tracks the gap and feeds findings back to Intelligence.</em>
          </Term>
          <Term name="Tower acceptance">
            Ava&rsquo;s confirmation that a P5 handoff package is complete and the program is ready to transition to execution monitoring. <em>A hard gate criterion — no Move can close P5 without it.</em>
          </Term>
        </TermGrid>
      </Section>
    </>
  );
}
