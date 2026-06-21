'use client';
import {
  Section, HeroBand, Eyebrow, SectionTitle, Lead, BodyP, SubHead,
  Callout, StepList, Step, TermGrid, Term, IntelCard, PressureCardMock, T, InlineAbarvaLogo,
} from './primitives';

// ─────────────────────────────────────────────────────────────────────────────
// /home/learn/intelligence — single long-form page.
// Part 1: Art of the possible (conceptual)
// Part 2: Apex Retail case study (four chapters, no sub-routes)
// ─────────────────────────────────────────────────────────────────────────────

export function IntelligenceSection() {
  return (
    <>
      {/* ── PART 1 · Art of the possible ─────────────────────────────── */}

      <HeroBand color="purple">
        <Eyebrow light>Intelligence</Eyebrow>
        <SectionTitle light size="xl" level={1}>The art of the possible.</SectionTitle>
        <Lead light>
          Intelligence is the most powerful surface for strategic discovery. It continuously analyzes your connected data to surface patterns, risks, and opportunities — and turns them into Move hypotheses with one click. Below the conceptual primer is a full Apex Retail case study: six AI programs, four chapters, real numbers.
        </Lead>
      </HeroBand>

      {/* Signals */}
      <Section id="signals">
        <Eyebrow>Intelligence · Signals</Eyebrow>
        <SectionTitle>Reading signals & pressure cards</SectionTitle>
        <Lead>
          Signals are AI-detected patterns in your operational data. They appear as <strong>pressure cards</strong> — structured observations with severity, evidence, and a recommended action.
        </Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
          <IntelCard icon="📉" name="Cost pressure signal" desc="A sustained cost trend that deviates from plan — e.g. per-transaction costs rising 12% quarter-over-quarter with no corresponding revenue lift." />
          <IntelCard icon="⚠️" name="Risk concentration signal" desc="Over-reliance on a single vendor, technology, or process — e.g. 73% of a workflow depending on a contract ending in Q3." />
          <IntelCard icon="🚀" name="Opportunity signal" desc="A gap where AI capability could create significant value — e.g. a manual classification task consuming 2,400 hours/month that ML could automate at 96% accuracy." />
        </div>
        <BodyP>
          Each pressure card shows you: what the signal is, the data evidence behind it, which business unit it affects, the magnitude of impact, and a recommended action — usually &ldquo;Originate a Move.&rdquo;
        </BodyP>
        <PressureCardMock />
        <Callout kind="success" icon="✓" label="Pressure cards pre-fill Moves">
          When you click &ldquo;Originate a Move&rdquo; from a pressure card, Ava pre-populates the bet/outcome, value hypothesis, and evidence family fields from the card&rsquo;s data. You start P0 already 60% complete instead of from scratch.
        </Callout>
      </Section>

      {/* Pattern → Move */}
      <Section id="pattern-to-move">
        <Eyebrow>Intelligence · Pattern → Move</Eyebrow>
        <SectionTitle>From pattern to Move</SectionTitle>
        <Lead>
          The most powerful workflow in <InlineAbarvaLogo />. Intelligence detects a pattern → you validate it → one click sends it to Strategic Moves as a pre-loaded origination.
        </Lead>
        <StepList>
          <Step title="Browse Intelligence signals for your business units" path="/intelligence → Pressure Cards → filter by severity">
            Filter by business unit, archetype, or severity. High-severity patterns with strong evidence backing are the best candidates for immediate Moves.
          </Step>
          <Step title="Open a pressure card and read the evidence">
            Check the evidence sources. Are they recent? Is the data from connected systems you trust? The stronger the evidence, the more defensible the business case in P4 will be.
          </Step>
          <Step title="Ask Ava to go deeper">
            Use the chat to ask <strong>&ldquo;What&rsquo;s driving the 18% AHT increase?&rdquo;</strong> or <strong>&ldquo;Which teams are most affected?&rdquo;</strong> Ava can drill further into the substrate before you decide to act.
          </Step>
          <Step title='Click "→ Originate a Move" to promote the signal' path="Pressure card → Originate a Move → /strategic-moves/new">
            This opens the P0 origination screen with the pressure card data pre-loaded into the scaffold. You confirm the fields, name the Move, and promote it to P1.
          </Step>
        </StepList>
      </Section>

      {/* Key terms */}
      <Section id="key-terms">
        <Eyebrow>Intelligence · Key Terms</Eyebrow>
        <SectionTitle>Key terms</SectionTitle>
        <TermGrid>
          <Term name="Signal">An AI-detected pattern in operational or financial data. Signals are surfaced automatically from connected data sources. <em>You don&rsquo;t need to ask for them — they appear when the substrate finds something worth noting.</em></Term>
          <Term name="Pressure card">The structured presentation of a signal. Includes type, severity, evidence, impact estimate, and recommended action. <em>Think of it as an AI-authored executive brief on a specific problem.</em></Term>
          <Term name="Archetype">The category of a signal or Move — Cost Reduction, Revenue Growth, Risk Mitigation, or Operational Excellence. <em>Ava uses archetype to choose which deliverable templates and gate criteria to apply.</em></Term>
          <Term name="Ava">The single assistant you talk to across every surface — Home, Intelligence, Moves, Source, Tower, and Setup. On Intelligence she answers questions about signals, drills into evidence, and draws on named specialist capabilities for deep analysis. <em>You always talk to Ava — she orchestrates the faculty behind her, and you never get handed off to a different agent.</em></Term>
          <Term name="Provenance">The data lineage behind a signal — which connector, which dataset, which time period. <em>High-provenance signals have strong, recent, specific evidence. Low-provenance signals are more uncertain.</em></Term>
        </TermGrid>
      </Section>

      {/* ── PART 2 · Apex Retail Case Study ──────────────────────────────── */}

      {/* Case study divider band */}
      <div
        id="case-study"
        style={{
          background: 'linear-gradient(135deg,#3B0764 0%,#4C1D95 100%)',
          padding: '48px clamp(32px, 4vw, 64px)',
          borderBottom: `1px solid rgba(255,255,255,0.08)`,
        }}
      >
        <Eyebrow light>Intelligence · Case Study</Eyebrow>
        <SectionTitle light size="xl">Apex Retail · Six AI programs in motion.</SectionTitle>
        <Lead light>
          $18B revenue, 1,200 stores, 38% of GMV in private label. Six active AI programs from Phase&nbsp;1 to completed. Four chapters walk the Intelligence surface through a CXO&rsquo;s eyes — what the signals mean, how to read the patterns, and what to say when the board asks.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {['Industry: Specialty Retail', 'Revenue: $18B', 'Programs: 6 active', '4 chapters'].map((tag) => (
            <span key={tag} style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '5px 12px', borderRadius: 4, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.9)', border: '1px solid rgba(255,255,255,0.12)' }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* Company snapshot */}
      <Section id="company">
        <Eyebrow>The company</Eyebrow>
        <SectionTitle>Apex Retail at a glance</SectionTitle>
        <Lead>Private label is the margin engine — 38% of GMV and 44% of gross margin dollars. Everything below flows from that one fact.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, margin: '20px 0' }}>
          {[
            { label: 'Annual Revenue', value: '$18B' },
            { label: 'Store Count', value: '1,200' },
            { label: 'Private Label / GMV', value: '38%' },
            { label: 'Gross Margin (plan)', value: '36.6%' },
            { label: 'Gross Margin (actual)', value: '34.2%' },
            { label: 'Inventory DoH vs Peer', value: '47d vs 38d' },
          ].map(({ label, value }) => (
            <div key={label} style={{ border: `1px solid ${T.purpleLine}`, borderRadius: 8, padding: '16px 20px', background: T.purpleSoft }}>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.purple, marginBottom: 6 }}>{label}</div>
              <div style={{ fontFamily: T.fDisp, fontSize: 28, color: T.ink, letterSpacing: '-0.02em' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Programs table */}
        <SubHead>Six programs in flight</SubHead>
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fBody, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['ID', 'Program', 'Phase', 'Key Signal', 'Pattern'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'APX-01', name: 'Morrison Owned Brand Margin Recovery', phase: 'P4 · Validate', phaseColor: T.amber, signal: 'GM 34.2% vs 36.6% plan', pattern: 'F213' },
                { id: 'APX-02', name: 'Demand Forecasting Modernization',     phase: 'P3 · Design',   phaseColor: T.navy,  signal: '34% promo miss rate',       pattern: 'F215' },
                { id: 'APX-03', name: 'Store Labor Optimization',              phase: 'P5 · Complete', phaseColor: T.teal,  signal: '31% mgr override rate',     pattern: 'F230' },
                { id: 'APX-04', name: 'Digital Assortment Copilot',            phase: 'P2 · Diagnose', phaseColor: T.navy,  signal: '12% SKUs w/ zero velocity', pattern: 'F217' },
                { id: 'APX-05', name: 'Supply Chain Control Tower',            phase: 'P1 · Initiate', phaseColor: T.faint, signal: '±23d lead time variability', pattern: 'F221' },
                { id: 'APX-06', name: 'Returns Fraud Detection',               phase: 'P4 · Validate', phaseColor: T.amber, signal: '$180M returns, 74% precision', pattern: 'F232' },
              ].map((row) => (
                <tr key={row.id} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '10px 12px', fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: T.purple }}>{row.id}</td>
                  <td style={{ padding: '10px 12px', color: T.ink, fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: '10px 12px' }}>
                    <span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: row.phaseColor, background: row.phaseColor + '15', padding: '3px 8px', borderRadius: 4 }}>{row.phase}</span>
                  </td>
                  <td style={{ padding: '10px 12px', color: T.muted }}>{row.signal}</td>
                  <td style={{ padding: '10px 12px', fontFamily: T.fMono, fontSize: 11, color: T.faint }}>{row.pattern}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CXO cast */}
        <SubHead>The CXO team</SubHead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, margin: '12px 0' }}>
          {[
            { name: 'David Kim',    role: 'CEO · Portfolio sponsor',     bullet: 'Owns the AI investment narrative to the board. His question: "Are we getting $1 back for every $1 we put in?"' },
            { name: 'Rachel Torres', role: 'CFO · Investment concurrence', bullet: 'Signs off on program funding at P2→P3 gate. Her question: "What exactly is pulling down private label margin?"' },
            { name: 'Marcus Chen',  role: 'COO · Execution owner',       bullet: 'Owns store ops and supply chain. His question: "Which programs create real operating leverage by Q4?"' },
            { name: 'Lisa Park',    role: 'CMO · Demand signal owner',   bullet: 'Owns promotional strategy and assortment. Her question: "Why is our promo ROI deteriorating?"' },
            { name: 'James Wright', role: 'CPTO · Technical risk owner', bullet: 'Owns model quality and vendor risk. His question: "What happens if APX-02 forecasts are wrong at peak?"' },
          ].map(({ name, role, bullet }) => (
            <div key={name} style={{ border: `1px solid ${T.border}`, borderRadius: 10, padding: 18, background: T.surface }}>
              <div style={{ fontFamily: T.fDisp, fontSize: 18, color: T.ink, letterSpacing: '-0.01em', marginBottom: 4 }}>{name}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.purple, marginBottom: 10 }}>{role}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.55 }}>{bullet}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Ch.01 Owned Brand Margin ─────────────────────────────────────── */}

      <ChapterDivider num="01" title="Owned Brand Margin" id="ch01" />

      <Section>
        <Eyebrow>The signal</Eyebrow>
        <SectionTitle>Private label GM is 240bps below plan. Here&rsquo;s where it comes from.</SectionTitle>
        <Lead>
          Rachel Torres, CFO, asks at every quarterly review: &ldquo;What exactly is pulling down private label margin?&rdquo; The pressure card reads: <em>&ldquo;Private label gross margin 240bps below plan across 14 segments. Three contributing factors: promotional depth, markdown timing, assortment mix.&rdquo;</em>
        </Lead>
        <BodyP>
          The signal isn&rsquo;t novel — finance has been tracking the GM gap for two quarters. What&rsquo;s new is the decomposition. Before Intelligence, the gap was an aggregate number. Ava breaks it into three causal buckets and ties each to specific SKUs, categories, and weeks.
        </BodyP>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, margin: '20px 0' }}>
          {[
            { bps: '90bps', cause: 'Promotional Depth', detail: 'AI pricing model recommends a depth. Store team overrides to 15–25% deeper. Override rate is 47% — nearly half of all promo events. Each override averages 90bps of margin impact.', color: T.amber },
            { bps: '80bps', cause: 'Markdown Timing',   detail: 'Markdown decisions lag demand signal by an average of 11 days. Late markdowns require deeper cuts to clear inventory before seasonal transition. Especially acute in Morrison housewares and apparel.', color: T.amber },
            { bps: '70bps', cause: 'Assortment Mix Shift', detail: 'Three high-margin Morrison categories lost 4.2 points of category share to national brands over 6 months. Lower-margin national brands filling the void.', color: T.navy },
          ].map(({ bps, cause, detail, color }) => (
            <div key={cause} style={{ border: `1px solid ${color}44`, borderRadius: 10, padding: 20, background: color + '08' }}>
              <div style={{ fontFamily: T.fDisp, fontSize: 36, color, letterSpacing: '-0.02em', marginBottom: 4 }}>{bps}</div>
              <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color, marginBottom: 10 }}>{cause}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{detail}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>Pattern F213</Eyebrow>
        <SectionTitle>Promotional AI Guardrails — the pattern behind the gap</SectionTitle>
        <Lead>F213 describes the failure mode where AI pricing recommendations are systematically overridden by humans who &ldquo;know better,&rdquo; resulting in margin leakage that is invisible until the quarterly review.</Lead>
        <BodyP>The pattern has three sub-components at Apex:</BodyP>
        <ol style={{ fontFamily: T.fBody, fontSize: 14, color: T.body, lineHeight: 1.7, paddingLeft: 24, margin: '12px 0' }}>
          <li><strong>Model-human trust gap:</strong> Store planning team doesn&rsquo;t trust the depth recommendation because the model was trained on pre-COVID promotional data. The skepticism is rational — but the fix is retraining the model, not bypassing it.</li>
          <li style={{ marginTop: 8 }}><strong>Override audit trail is thin:</strong> When a planner overrides the model, the override isn&rsquo;t logged with a reason code. Three quarters of overrides have no documented rationale.</li>
          <li style={{ marginTop: 8 }}><strong>Feedback loop broken:</strong> When the override leads to a worse outcome, no signal goes back to the planner. The model gets better from the data, but the planner doesn&rsquo;t see the cost of their overrides.</li>
        </ol>
        <Callout kind="warn" icon="⚠️" label="What F213 doesn't mean">
          F213 is not about removing human judgment. The pattern fix is adding structure — logging overrides with reason codes, surfacing override-vs-outcome data monthly, and retraining the model on recent data. The planner still makes the call. The difference is the call is now accountable.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>How to answer Rachel&rsquo;s question</SectionTitle>
        <AnswerComparison
          bad="Private label margin is under pressure due to competitive dynamics and promotional intensity. We're working on improving our pricing algorithms and inventory management. The team is actively monitoring the situation."
          good="We have 240bps of private label GM gap. It breaks three ways: 90bps from promo overrides — planners are overriding AI recommendations to go 15–25% deeper on 47% of promo events, with no outcome tracking. APX-01 addresses this in Phase 4 now with guardrail logic. 80bps from markdown timing — we're 11 days late on average, which forces steeper clearance cuts. That fixes when APX-02 forecasting goes live in Q3. The remaining 70bps is category mix shift in Morrison — national brands are recapturing share in housewares. That's a 2026 assortment decision, not a Q2 recovery. So 170bps is recoverable this year; 70bps is a longer cycle."
        />
      </Section>

      {/* ── Ch.02 Demand Forecasting ─────────────────────────────────────── */}

      <ChapterDivider num="02" title="Demand Forecasting" id="ch02" />

      <Section>
        <Eyebrow>The signal</Eyebrow>
        <SectionTitle>40-day inventory. 34% promo miss rate. Every extra day costs $1.2M.</SectionTitle>
        <Lead>Marcus Chen, COO, measures operating leverage in inventory turns. Apex is carrying 40 days on hand vs 38-day peer median — about $2.4M in excess working capital. The promo miss rate is 34% vs 18% corpus median — nearly double.</Lead>
        <BodyP>
          Promo miss in either direction is expensive. Under-performance leaves margin on the table and creates clearance inventory. Over-performance means stockouts and lost revenue. At 34% miss rate on 280 events/year, roughly 95 events per year miss by a meaningful margin. The substrate breaks the miss rate by direction: 21 percentage points are under-performance (excess inventory), 13 percentage points are over-performance (stockouts).
        </BodyP>
      </Section>

      <Section>
        <Eyebrow>Pattern F215</Eyebrow>
        <SectionTitle>Demand Sensing Late Signal</SectionTitle>
        <Lead>F215 describes the failure mode where demand signals from stores, loyalty data, and POS reach the forecasting model too late to influence the promotional decision. The decision is already locked; the signal arrives after the fact.</Lead>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, margin: '20px 0' }}>
          {[
            { title: 'Current state', body: 'Signal latency: 6–8 days from store POS to forecasting model. Promo decisions lock 10 days out. Model has 2–4 days of real signal before lock.', icon: '⏱️' },
            { title: 'Target (APX-02)',  body: 'Signal latency reduced to 24 hours via CDC pipeline. Model retrain cycle weekly. Promo decisions have 9 days of real signal before lock.', icon: '🎯' },
            { title: 'Impact',          body: 'Difference between 2 days and 9 days of real signal: forecast accuracy from ~66% to ~84% at the event level. 18-point accuracy swing.', icon: '📈' },
          ].map(({ title, body, icon }) => (
            <div key={title} style={{ border: `1px solid ${T.navyLine}`, borderRadius: 10, padding: 18, background: T.navySoft }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>{icon}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{title}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{body}</div>
            </div>
          ))}
        </div>
        <Callout kind="success" icon="✓" label="APX-02 Q3 target">
          Design spec targets P3→P4 gate approval by end of Q2. CDC pipeline goes live Q3. The 34% promo miss rate should start declining in Q4 — from 34% toward the 25% range within two quarters of improved signal data. Inventory days metric will follow by one cycle, call it Q1 next year.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>What Marcus needs to hear</SectionTitle>
        <AnswerComparison
          bad="We have some excess inventory in a few categories. The team is working on improving forecast accuracy. We expect to see improvement once APX-02 is deployed."
          good="We're carrying 40 days on hand vs 38-day peer median — about $2.4M in excess working capital. Seasonal apparel is the biggest bucket at 0.8 days excess, followed by Morrison household at 0.7 days. The promo miss rate is 34% vs 18% corpus median — we're missing on 95 events a year, mostly on the under-side which creates clearance inventory. APX-02 is in Phase 3 design now, targeting a P3→P4 gate in Q2. If the gate passes, the CDC pipeline goes live Q3 and we should see the promo miss rate start coming down in Q4 — from 34% toward the 25% range. The inventory days metric will lag by one cycle, so call it Q1 next year before we see that move."
        />
      </Section>

      {/* ── Ch.03 Supply Chain Risk ──────────────────────────────────────── */}

      <ChapterDivider num="03" title="Supply Chain Risk" id="ch03" />

      <Section>
        <Eyebrow>The signal</Eyebrow>
        <SectionTitle>±23-day lead time variability. Peak season is 5 months out.</SectionTitle>
        <Lead>James Wright, CPTO, carries the technical risk on APX-05. Lead time variability of ±23 days means a vendor promising a 45-day lead time may actually deliver in 22 days or 68 days — too wide to buffer with rational safety stock.</Lead>
        <BodyP>
          For context: ±7 days is manageable. ±14 days requires safety stock at 1.5–2x standard levels. ±23 days means either holding 3x safety stock (expensive) or accepting stockout risk in roughly 1 in 5 peak-season replenishment cycles. The corpus median for $10–25B specialty retailers is ±9 days. Apex is running at 2.6x the peer median.
        </BodyP>
        <BodyP>
          The substrate traces the variance to three clusters: direct import from Southeast Asia (highest variance, ±31 days), domestic DC transfer (lowest, ±8 days), and regional vendor fulfillment (middle, ±19 days). Peak season exposure concentrates in direct import — the Morrison private label seasonal line is 62% direct import.
        </BodyP>
        <Callout kind="warn" icon="⚠️" label="Why peak season amplifies this">
          In peak season (Oct–Dec), early stockouts can&rsquo;t be recovered — the reorder lead time from Southeast Asia is 45 days minimum. A missed Morrison seasonal item in week 3 of November is a permanent lost sale.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>Pattern F221</Eyebrow>
        <SectionTitle>Shelfware Risk — why control towers fail</SectionTitle>
        <Lead>F221 isn&rsquo;t about supply chain directly — it&rsquo;s about AI implementations that get built and then not used. The pattern shows up most often in control tower programs because the implementation seems complete but actual behavior change doesn&rsquo;t follow.</Lead>
        <div style={{ background: T.amberSoft, border: `1px solid ${T.amberLine}`, borderRadius: 10, padding: 20, margin: '16px 0' }}>
          <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.amber, marginBottom: 10 }}>F221 · Three failure modes</div>
          {[
            { mode: 'Alert fatigue',       desc: 'Control towers generate too many alerts. Planners learn to ignore them. The alerts that matter are buried in noise. Override rate climbs above 60%.' },
            { mode: 'Ownership ambiguity', desc: 'The control tower shows a problem. But who acts on it — logistics, purchasing, the vendor? If the answer isn\'t unambiguous, the alert sits until someone escalates manually.' },
            { mode: 'SLA without teeth',   desc: 'Vendor SLAs exist on paper. The control tower flags violations. But the contract has no automatic remedy clause, so the violation becomes a meeting item, not a penalty trigger.' },
          ].map(({ mode, desc }) => (
            <div key={mode} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 700, color: T.amber, marginBottom: 4 }}>{mode}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
        <Callout kind="info" icon="🔍" label="The peak season constraint">
          For APX-05 to have any operational impact before peak season (Oct–Dec), the P1→P2 gate must pass by end of May. Phase 2 diagnosis (8–10 weeks) + Phase 3 design (8–10 weeks) puts live capability at September — barely in time. Any slip past the May gate means peak season 2026 is the earliest real deployment.
        </Callout>
      </Section>

      <Section>
        <Eyebrow>The CXO conversation</Eyebrow>
        <SectionTitle>Answering &ldquo;Are we prepared for peak season?&rdquo;</SectionTitle>
        <AnswerComparison
          bad="We have a supply chain control tower program underway and are working to improve our lead time visibility. The team is making progress and we expect to be in a better position heading into peak season."
          good="Honestly, we have a ±23-day lead time variance vs ±9-day peer median — the highest-risk exposure is the Morrison seasonal line, which is 62% direct import from Southeast Asia. APX-05 control tower is in Phase 1 right now. For it to be live before peak season, we need to pass the P1→P2 gate by end of May. If that happens, we're deploying in September — operational, but not battle-tested. My honest read: plan peak season 2026 with the assumption that the control tower is in monitoring mode, not remediation mode. I'd recommend the Morrison seasonal buy goes in by June 15 — earlier than usual — to create a buffer against the variance. That's the operational hedge. APX-05 is the long-term fix."
        />
      </Section>

      {/* ── Ch.04 What to Watch ─────────────────────────────────────────── */}

      <ChapterDivider num="04" title="What to Watch" id="ch04" />

      <Section>
        <Eyebrow>Portfolio status</Eyebrow>
        <SectionTitle>Six programs, one snapshot</SectionTitle>
        <div style={{ overflowX: 'auto', margin: '20px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: T.fBody, fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${T.border}` }}>
                {['Program', 'Phase', 'Status', 'Key Watch Item'].map((h) => (
                  <th key={h} style={{ textAlign: 'left', padding: '8px 12px', fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.muted }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { name: 'APX-01 · Owned Brand Margin', phase: 'P4 · Validate', status: '🟡 Watch',    statusColor: T.amber,   watch: '12-week pilot read due June. Override rate down to 31% (from 47%). Need 2 more weeks before P5 gate.' },
                { name: 'APX-02 · Demand Forecasting', phase: 'P3 · Design',   status: '🟢 On track', statusColor: T.teal,    watch: 'P3→P4 gate targeted end of Q2. CDC pipeline architecture decision pending this week.' },
                { name: 'APX-03 · Store Labor',        phase: 'P5 · Complete', status: '✅ Done',     statusColor: T.teal,    watch: 'Value realization tracking in Control Tower. Post-deployment override rate 19% vs 31% at program start.' },
                { name: 'APX-04 · Assortment Copilot', phase: 'P2 · Diagnose', status: '🟢 On track', statusColor: T.teal,    watch: '12% zero-velocity SKUs. Diagnosis phase identifying root causes. P2→P3 gate in 4 weeks.' },
                { name: 'APX-05 · Supply Chain Tower', phase: 'P1 · Initiate', status: '🔴 At risk',  statusColor: '#DC2626', watch: 'Must pass P1→P2 gate by end of May for peak season impact. Vendor coverage map + ownership matrix missing.' },
                { name: 'APX-06 · Returns Fraud',      phase: 'P4 · Validate', status: '🟡 Watch',    statusColor: T.amber,   watch: '74% precision vs 85% target. $180M returns — every 1% precision gain = ~$1.8M in fraud recovery.' },
              ].map((row) => (
                <tr key={row.name} style={{ borderBottom: `1px solid ${T.borderLt}` }}>
                  <td style={{ padding: '10px 12px', color: T.ink, fontWeight: 500 }}>{row.name}</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: T.muted }}>{row.phase}</span></td>
                  <td style={{ padding: '10px 12px', whiteSpace: 'nowrap', color: row.statusColor, fontWeight: 600 }}>{row.status}</td>
                  <td style={{ padding: '10px 12px', color: T.muted, lineHeight: 1.5 }}>{row.watch}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section>
        <Eyebrow>Caution flags</Eyebrow>
        <SectionTitle>Three decisions needed this week</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, margin: '16px 0' }}>
          {[
            { flag: '🔴 APX-05 phase gate at risk', detail: "The P1→P2 gate criteria require a vendor coverage map and an ownership matrix. Neither has been submitted. The gate is due end of May — 3 weeks from now. James Wright's team needs to commit to these artifacts this week or the peak season deployment window closes.", bg: '#FEF2F2', border: '#FCA5A5' },
            { flag: '🟡 APX-01 pilot read at decision point', detail: "The 12-week pilot ends in 2 weeks. If the override rate holds at ≤31% and promo margin shows 60–70bps improvement, the P4→P5 gate is straightforward. If the read is ambiguous, the team needs to decide: extend the pilot (costs Q3 recovery) or proceed to P5 with a softer evidence base.", bg: '#FFFBEB', border: '#FCD34D' },
            { flag: '🟡 APX-06 precision gap decision', detail: "At 74% precision vs 85% target, the fraud model is either deployed with a known gap (acceptable if net recovery beats the false-positive cost) or held for more training data. A 74% model catching $133M in fraud is still better than the baseline. The CFO needs to make this call explicitly — the program shouldn't make it implicitly by continuing to delay.", bg: '#FFFBEB', border: '#FCD34D' },
          ].map(({ flag, detail, bg, border }) => (
            <div key={flag} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 8, padding: '16px 20px' }}>
              <div style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>{flag}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.6 }}>{detail}</div>
            </div>
          ))}
        </div>
      </Section>

      <Section>
        <Eyebrow>The board narrative</Eyebrow>
        <SectionTitle>What David Kim says in May</SectionTitle>
        <div style={{ background: T.surface2, border: `1px solid ${T.border}`, borderRadius: 10, padding: '24px 28px', fontFamily: T.fBody, fontSize: 14, color: T.body, lineHeight: 1.75, margin: '16px 0' }}>
          <p style={{ margin: '0 0 14px' }}>&ldquo;We have six AI programs in flight. One complete — store labor optimization is live at 19% override rate vs 31% at program start. Two in Validate phase: owned brand margin and returns fraud detection.</p>
          <p style={{ margin: '0 0 14px' }}>On owned brand margin: we traced 240bps of GM gap to three causes. The 90bps promotional depth piece is in Phase 4 validation now — early reads are encouraging. If the 12-week pilot holds, we should see that 90bps start recovering in Q3. The 80bps markdown timing piece depends on APX-02 forecasting going live in Q3. The 70bps mix shift is a 2026 assortment reset, not a quick fix.</p>
          <p style={{ margin: '0 0 14px' }}>On supply chain: we have ±23-day lead time variance vs ±9-day peer median. The control tower program is initiated but at risk of missing peak season if we don&rsquo;t pass the Phase 1→2 gate by end of May. We&rsquo;re hedging operationally by pulling the Morrison seasonal buy forward to June 15.</p>
          <p style={{ margin: 0 }}>Bottom line: three programs on track, one completed, two requiring decisions in the next two weeks. The AI substrate is giving us better decomposition of our cost structure than we had 12 months ago.&rdquo;</p>
        </div>
        <Callout kind="success" icon="✓" label="What Intelligence makes possible">
          Every number in that narrative came from the Intelligence substrate. The 240bps decomposition alone — knowing it&rsquo;s 90+80+70, not just 240 — is what changes &ldquo;we&rsquo;re monitoring&rdquo; to &ldquo;here&rsquo;s what we&rsquo;re fixing and when.&rdquo;
        </Callout>
      </Section>
    </>
  );
}

// ─── Chapter divider band ─────────────────────────────────────────────────────
function ChapterDivider({ num, title, id }: { num: string; title: string; id: string }) {
  return (
    <div
      id={id}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '24px clamp(32px, 4vw, 64px)',
        background: T.purpleSoft,
        borderTop: `1px solid ${T.purpleLine}`,
        borderBottom: `1px solid ${T.purpleLine}`,
      }}
    >
      <span style={{ fontFamily: T.fMono, fontSize: 11, fontWeight: 700, color: '#fff', background: T.purple, borderRadius: 4, padding: '4px 10px', flexShrink: 0 }}>Ch.{num}</span>
      <span style={{ fontFamily: T.fDisp, fontSize: 20, color: T.ink, letterSpacing: '-0.01em' }}>{title}</span>
    </div>
  );
}

// ─── Bad-vs-good answer comparison ───────────────────────────────────────────
function AnswerComparison({ bad, good }: { bad: string; good: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, margin: '12px 0' }}>
      <div>
        <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#991B1B', marginBottom: 8 }}>Generic answer</div>
        <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 8, padding: '16px 20px', fontFamily: T.fBody, fontSize: 14, color: '#7F1D1D', lineHeight: 1.6 }}>&ldquo;{bad}&rdquo;</div>
      </div>
      <div>
        <div style={{ fontFamily: T.fMono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#14532D', marginBottom: 8 }}>Intelligence-backed answer</div>
        <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 8, padding: '16px 20px', fontFamily: T.fBody, fontSize: 14, color: '#14532D', lineHeight: 1.6 }}>&ldquo;{good}&rdquo;</div>
      </div>
    </div>
  );
}
