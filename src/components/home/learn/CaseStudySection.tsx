'use client';
/* eslint-disable react/no-unescaped-entities, @typescript-eslint/no-explicit-any */
/**
 * Case Study: Apex Retail — AI-Driven Demand Intelligence
 * Flagship training anchor for the Strategic Moves Learn section.
 *
 * A real-scale enterprise AI program ($35M net value, 3 years) walked through
 * all six phases with business context, Ava's contributions, and human decisions
 * at each gate. Designed so a CXO reading this immediately grasps:
 *  1. The scale of value a well-governed Move can generate
 *  2. What phases actually do — not abstractly, but in a real program
 *  3. What the AI agent does vs. what stays with the executive
 */
import { T, Eyebrow, SectionTitle, Lead, BodyP, SubHead, Callout } from './primitives';

// ─── Shared helpers ────────────────────────────────────────────────────────

function Band({ children, bg = T.navy }: { children: React.ReactNode; bg?: string }) {
  return (
    <div style={{ background: bg, padding: '56px clamp(32px, 4vw, 64px)', borderBottom: `1px solid ${T.borderLt}` }}>
      {children}
    </div>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <section style={{ padding: '48px clamp(32px, 4vw, 64px)', borderBottom: `1px solid ${T.borderLt}` }}>
      {children}
    </section>
  );
}

// ─── Stat tile ─────────────────────────────────────────────────────────────

function Stat({
  value,
  label,
  sub,
  light,
}: {
  value: string;
  label: string;
  sub?: string;
  light?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div
        style={{
          fontFamily: T.fDisp,
          fontSize: 'clamp(28px, 4vw, 44px)',
          fontWeight: 400,
          color: light ? '#fff' : T.ink,
          letterSpacing: '-0.03em',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: T.fMono,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: light ? 'rgba(255,255,255,0.7)' : T.faint,
        }}
      >
        {label}
      </div>
      {sub && (
        <div style={{ fontFamily: T.fBody, fontSize: 11, color: light ? 'rgba(255,255,255,0.55)' : T.faint, lineHeight: 1.4, marginTop: 2 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Phase journey tile ────────────────────────────────────────────────────

function JourneyTile({
  phase,
  name,
  status,
  weeks,
  color,
}: {
  phase: string;
  name: string;
  status: 'complete' | 'active' | 'pending';
  weeks: string;
  color: string;
}) {
  return (
    <div
      style={{
        flex: '1 1 120px',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${T.borderLt}`,
      }}
    >
      <div
        style={{
          background: status === 'complete' ? color : status === 'active' ? color : T.surface3,
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 11,
            fontWeight: 700,
            color: status !== 'pending' ? '#fff' : T.faint,
            letterSpacing: '-0.01em',
          }}
        >
          {phase}
        </span>
        {status === 'complete' && (
          <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>✓</span>
        )}
      </div>
      <div style={{ padding: '10px 14px', background: T.surface, flex: 1 }}>
        <div style={{ fontFamily: T.fBody, fontSize: 12, fontWeight: 600, color: T.ink, marginBottom: 4 }}>{name}</div>
        <div style={{ fontFamily: T.fMono, fontSize: 9, color: T.faint, letterSpacing: '0.06em' }}>{weeks}</div>
      </div>
    </div>
  );
}

// ─── Phase deep-dive card ─────────────────────────────────────────────────

function PhaseCard({
  phase,
  name,
  color,
  gate,
  situation,
  nexusDidItems,
  humanDecided,
  gateOutcome,
  gateCleared,
}: {
  phase: string;
  name: string;
  color: string;
  gate: string;
  situation: string;
  nexusDidItems: string[];
  humanDecided: string;
  gateOutcome: string;
  gateCleared: boolean;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 28,
      }}
    >
      {/* Header */}
      <div
        style={{
          background: color,
          padding: '14px 22px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontFamily: T.fMono, fontSize: 18, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
          {phase}
        </span>
        <span style={{ fontFamily: T.fDisp, fontSize: 18, fontWeight: 400, color: '#fff' }}>
          {name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.22)',
            borderRadius: 4,
            padding: '4px 10px',
          }}
        >
          Gate: {gate}
        </span>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 0,
        }}
      >
        {/* Left: situation + Ava */}
        <div
          style={{
            padding: '20px 22px',
            borderRight: `1px solid ${T.borderLt}`,
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.faint,
              marginBottom: 8,
            }}
          >
            The business situation
          </div>
          <p style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.65, margin: '0 0 18px' }}>
            {situation}
          </p>

          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.teal,
              marginBottom: 8,
            }}
          >
            What Ava contributed
          </div>
          <ul style={{ margin: 0, padding: '0 0 0 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
            {nexusDidItems.map((item) => (
              <li key={item} style={{ fontFamily: T.fBody, fontSize: 12, color: T.body, lineHeight: 1.55 }}>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: human decision + gate */}
        <div style={{ padding: '20px 22px' }}>
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.navy,
              marginBottom: 8,
            }}
          >
            The executive decision
          </div>
          <div
            style={{
              background: T.navySoft,
              border: `1px solid ${T.navyLine}`,
              borderRadius: 8,
              padding: '14px 16px',
              fontFamily: T.fBody,
              fontSize: 13,
              color: T.body,
              lineHeight: 1.65,
              marginBottom: 20,
              fontStyle: 'italic',
            }}
          >
            {humanDecided}
          </div>

          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: gateCleared ? T.teal : T.amber,
              marginBottom: 8,
            }}
          >
            Gate outcome
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              background: gateCleared ? T.tealSoft : T.amberSoft,
              border: `1px solid ${gateCleared ? T.tealLine : T.amberLine}`,
              borderRadius: 8,
              padding: '12px 14px',
            }}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{gateCleared ? '✅' : '⚠️'}</span>
            <span style={{ fontFamily: T.fBody, fontSize: 12, color: T.body, lineHeight: 1.6 }}>
              {gateOutcome}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Value bar ────────────────────────────────────────────────────────────

function ValueBar({
  label,
  value,
  pct,
  color,
}: {
  label: string;
  value: string;
  pct: number;
  color: string;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontFamily: T.fBody, fontSize: 13, color: T.body }}>{label}</span>
        <span style={{ fontFamily: T.fMono, fontSize: 12, fontWeight: 700, color: T.ink }}>{value}</span>
      </div>
      <div style={{ background: T.surface3, borderRadius: 4, height: 8, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: color,
            borderRadius: 4,
            transition: 'width 600ms ease',
          }}
        />
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────

export function CaseStudySection() {
  return (
    <>
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <Band bg="linear-gradient(135deg, #0A0C12 0%, #1B2B5C 100%)">
        <div
          style={{
            fontFamily: T.fMono,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
            marginBottom: 20,
          }}
        >
          Case Study · Strategic Moves
        </div>
        <h1
          style={{
            fontFamily: T.fDisp,
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 400,
            color: '#fff',
            letterSpacing: '-0.03em',
            lineHeight: 1.1,
            margin: '0 0 20px',
            maxWidth: 720,
          }}
        >
          How Apex Retail moved $35M in inventory economics — in 14 months.
        </h1>
        <p
          style={{
            fontFamily: T.fBody,
            fontSize: 16,
            color: 'rgba(255,255,255,0.75)',
            lineHeight: 1.7,
            maxWidth: 640,
            margin: '0 0 36px',
          }}
        >
          A CFO note about markdown rates turned into a fully governed AI program — run through six phase gates, supported by Ava at every step, and carried into Control Tower with a 13-month payback. This is the anatomy of a Strategic Move at real enterprise scale.
        </p>

        {/* Outcome stats */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 40,
            paddingTop: 32,
            borderTop: '1px solid rgba(255,255,255,0.12)',
          }}
        >
          <Stat value="$35.4M" label="Net 3-year value" sub="Gross $39.6M − $4.2M program cost" light />
          <Stat value="13 mo" label="Payback period" sub="From investment approval to break-even" light />
          <Stat value="8.9%" label="Markdown rate achieved" sub="Down from 14.2% — vs. 8.5% industry" light />
          <Stat value="6 gates" label="Phases cleared" sub="P0 originate → P5 Tower handoff" light />
        </div>
      </Band>

      {/* ── Context ────────────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>The situation before</Eyebrow>
        <SectionTitle>A $65M inventory problem hiding in plain sight</SectionTitle>
        <Lead>
          Apex Retail was running a 14.2% markdown rate on seasonal merchandise — 5.7 points above industry standard. On $250M in seasonal GMV, that gap was costing $14M annually in gross margin. Simultaneously, bestselling SKUs were stocking out 3–4 weeks before end of season, leaving an estimated $18M in sales on the table.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: 16,
            margin: '28px 0',
          }}
        >
          {[
            {
              icon: '📉',
              label: 'Markdown rate',
              value: '14.2%',
              sub: 'Industry: 8.5%',
              bad: true,
            },
            {
              icon: '📦',
              label: 'Slow-moving inventory',
              value: '$47M',
              sub: 'Tied up, deeply discounted to clear',
              bad: true,
            },
            {
              icon: '🚫',
              label: 'Annual stockout losses',
              value: '$18M',
              sub: 'Lost sales on bestsellers clearing early',
              bad: true,
            },
            {
              icon: '⏱️',
              label: 'Replenishment signal lag',
              value: '6 weeks',
              sub: 'Industry best: 10–14 days',
              bad: true,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                border: `1px solid ${card.bad ? 'rgba(220,38,38,0.2)' : T.border}`,
                background: card.bad ? 'rgba(220,38,38,0.04)' : T.surface,
                borderRadius: 10,
                padding: '18px 20px',
              }}
            >
              <span style={{ fontSize: 22 }}>{card.icon}</span>
              <div style={{ fontFamily: T.fDisp, fontSize: 24, fontWeight: 400, color: T.ink, margin: '8px 0 4px', letterSpacing: '-0.02em' }}>
                {card.value}
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, fontWeight: 700, color: T.ink, marginBottom: 4 }}>
                {card.label}
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.faint, lineHeight: 1.45 }}>
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        <BodyP>
          The root causes were buried across three systems — the ERP, the regional buying teams, and the store replenishment processes — none of which talked to each other in real time. Leadership knew there was a problem; they didn't know exactly where it lived or how to fix it structurally without disrupting the buying operation.
        </BodyP>

        <Callout kind="info" icon="💡" label="Why this needed a Strategic Move — not a project">
          The inventory problem had been attacked with point solutions twice before: a new planning tool in 2022 (failed adoption), an analytics dashboard in 2023 (used by two analysts, no exec visibility). Both failed because they started with the solution, not the problem. A Strategic Move starts with a hypothesis, validates it with evidence, and designs against root causes — not symptoms.
        </Callout>
      </Section>

      {/* ── The signal ─────────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>P0 Origin · The signal</Eyebrow>
        <SectionTitle>It started with a CFO note after a QBR</SectionTitle>
        <Lead>
          Q3 review. The CFO saw the markdown rate, saw the stockout data side-by-side for the first time, and connected the dots. One note changed the trajectory.
        </Lead>

        <div
          style={{
            border: `1px solid ${T.navyLine}`,
            background: T.navySoft,
            borderRadius: 12,
            padding: '24px 28px',
            margin: '24px 0',
            maxWidth: 740,
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: T.navy,
              marginBottom: 12,
            }}
          >
            Signal — CFO note to CMO, forwarded to Head of Digital Transformation
          </div>
          <p
            style={{
              fontFamily: T.fBody,
              fontSize: 14,
              color: T.ink,
              lineHeight: 1.8,
              margin: 0,
              fontStyle: 'italic',
            }}
          >
            "Looking at Q3 numbers — our markdown rate is 5.7 points above peers and our stockout rate on
            top-20 SKUs is 22%. We're leaving money on both ends of the inventory curve.
            I think there's an AI play here — better demand signals, smarter replenishment.
            Can someone own this properly and come back with a real business case?
            Not another dashboard. A plan."
          </p>
          <div style={{ marginTop: 14, fontFamily: T.fBody, fontSize: 11, color: T.faint }}>
            This note was pasted directly to Ava. P0 began.
          </div>
        </div>

        <BodyP>
          The Head of Digital Transformation opened the Moves workspace, pasted the CFO note to Ava, and typed: <em>"I want to originate a Move from this."</em> Ava extracted the hypothesis in 40 seconds. The Move was born.
        </BodyP>
      </Section>

      {/* ── Phase journey ──────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>The journey</Eyebrow>
        <SectionTitle>Six phases, 14 months to value</SectionTitle>
        <Lead>
          From a CFO note to a Tower-monitored program — every phase gate justified, every decision documented.
        </Lead>

        <div
          style={{
            display: 'flex',
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            margin: '24px 0',
          }}
        >
          <JourneyTile phase="P0" name="Originate" status="complete" weeks="Week 1" color={T.ink2} />
          <JourneyTile phase="P1" name="Charter" status="complete" weeks="Weeks 2–4" color={T.navy} />
          <JourneyTile phase="P2" name="Discover" status="complete" weeks="Weeks 5–10" color={T.navy} />
          <JourneyTile phase="P3" name="Design" status="complete" weeks="Weeks 11–16" color={T.navy} />
          <JourneyTile phase="P4" name="Roadmap" status="complete" weeks="Weeks 17–20" color={T.navy} />
          <JourneyTile phase="P5" name="Mobilize" status="complete" weeks="Weeks 21–22" color={T.teal} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, margin: '16px 0' }}>
          {[
            { label: 'Total program duration', value: '22 weeks originate → Tower' },
            { label: 'Implementation start', value: 'Week 23 (post P5 handoff)' },
            { label: 'First value realized', value: 'Week 36 (partial markdown season)' },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: T.surface2,
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                padding: '12px 16px',
              }}
            >
              <div style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.faint, marginBottom: 6 }}>
                {item.label}
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.ink, fontWeight: 500 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Phase deep-dives ───────────────────────────────────────────── */}
      <Section>
        <Eyebrow>Phase by phase</Eyebrow>
        <SectionTitle>What happened at every gate</SectionTitle>
        <Lead>
          Each phase produced concrete outputs. Each gate was a deliberate checkpoint — not a formality. Here's what was decided, and why it mattered.
        </Lead>

        <PhaseCard
          phase="P0"
          name="Originate"
          color={T.ink2}
          gate="Promotion to P1"
          situation="The CFO note was vague — 'an AI play on inventory.' Was this a demand forecasting problem? A replenishment problem? A buyer-behavior problem? The first job was to extract a testable hypothesis from the noise and identify who in the business should own it."
          nexusDidItems={[
            'Extracted hypothesis from the CFO note: "AI-powered demand signals could reduce markdown rate from 14.2% → ~9% and recover $8–18M in lost sales annually"',
            'Classified archetype: Cost Reduction + Revenue Growth (dual — confirmed by user)',
            'Checked ACL data — proposed Chief Merchandising Officer as sponsor candidate (owns the seasonal P&L)',
            'Scoped: seasonal merchandise categories (women\'s, outdoor, home goods — 60% of revenue). Excluded: everyday staples, online exclusives',
            'Seeded value hypothesis: $15–28M annually (UNVALIDATED HYPOTHESIS — 6-week lag vs. industry 14-day benchmark from PAT-IND-009)',
          ]}
          humanDecided='"The CMO is the right sponsor — this hits her P&L directly. Scope is seasonal only for now. We are not touching everyday replenishment in this Move." — Head of Digital Transformation, P0 session'
          gateOutcome="Gate cleared: hypothesis falsifiable, archetype classified, CMO named as sponsor candidate, scope bounded to seasonal categories, value hypothesis seeded. Promoted to P1."
          gateCleared
        />

        <PhaseCard
          phase="P1"
          name="Charter"
          color={T.navy}
          gate="Charter Sign-Off"
          situation="With the CMO engaged as named sponsor, the charter had to lock scope, governance, and a preliminary value range — before any data was collected. The key challenge: Finance needed to see a value range early enough to budget for P2 discovery work, but the numbers weren't validated yet."
          nexusDidItems={[
            'Drafted the 11-section Program Charter from P0 scaffold + P1 session inputs',
            'Built stakeholder map with decision rights: CMO (sponsor/final authority), SVP Planning (program lead), CTO (technical sign-off), CFO (business case review), Buying teams (consulted)',
            'Locked preliminary value range: $18–28M annually (PRELIMINARY ESTIMATE — based on markdown rate delta × seasonal GMV × automation rate assumption 70–85%)',
            'Defined primary success metric: markdown rate (target <9.5% Year 1, <8.8% steady-state)',
            'Flagged SAP dependency: ERP integration is a 90-day lead item — must be in the P5 execution timeline',
          ]}
          humanDecided='"The value range is right — CMO signed the charter. CFO is comfortable with $18–28M as a planning range for now. We need to validate it in P2." — confirmed charter sign-off Week 4'
          gateOutcome="Gate cleared: CMO engaged and charter signed, value range locked with stated assumptions, stakeholder map complete with decision rights, primary metric defined. Advanced to P2."
          gateCleared
        />

        <PhaseCard
          phase="P2"
          name="Discover & Diagnose"
          color={T.navy}
          gate="Diagnosis Sign-Off"
          situation="Six weeks of structured discovery. The team uploaded 18 months of POS data, regional buying plans, ERP replenishment logs, and buyer interview transcripts. Ava analyzed across all sources. Three root causes emerged — and the Continue/Discontinue decision had to be made with full information."
          nexusDidItems={[
            'Parsed 18-month POS dataset (4.2M rows) — identified 6-week average lag from sell-through signal to replenishment trigger (industry: 10–14 days)',
            'Analyzed regional buying plans — found 40% of overstock situations traceable to buyers\' ignoring AI recommendations from the legacy tool (adoption failure, not algorithm failure)',
            'Cross-tabulated stockout data — top 3 categories account for 81% of stockout revenue loss: women\'s apparel ($8.1M), outdoor ($4.6M), home goods ($3.3M)',
            'Drafted Current State Assessment, Root Cause Analysis, and Risk Register',
            'Surfaced Continue/Discontinue: Continue — root causes specific, data available, economics strong',
          ]}
          humanDecided='"We Continue. The root causes are clear and we can fix them with the right system. The adoption failure on the legacy tool was a change management problem, not a data problem — we need to design differently this time." — CMO, Week 10 gate review'
          gateOutcome="Gate cleared: three root causes validated with quantified data, current state documented, Continue decision recorded. Baseline established: 14.2% markdown rate, $47M slow-moving, 6-week lag. Advanced to P3."
          gateCleared
        />

        <PhaseCard
          phase="P3"
          name="Design Future State"
          color={T.navy}
          gate="Design Approval"
          situation="The hardest phase. Three root causes, three design decisions. And a build/buy/partner choice that would determine the P4 cost structure. The CMO and CTO needed to align on architecture before Finance could build the business case."
          nexusDidItems={[
            'Mapped each P2 root cause to a design element — no design decision without a root cause trace',
            'Built sourcing decision framework: internal ML capacity = 0, timeline to value target = 12 months → Buy recommendation with rationale',
            'Drafted Target State Architecture: ML demand signal layer (vendor) + SAP integration middleware (internal build) + unified planning dashboard (configure from vendor platform)',
            'Drafted Operating Model Design: buyers receive AI recommendations with confidence intervals; override logging required; CMO reviews weekly AI adoption metric',
            'Identified three vendor evaluation criteria: real-time POS integration capability, SAP connector pre-built, retail-specific demand model (not generic)',
          ]}
          humanDecided={`"Buy the demand platform — we can't build ML in this timeline and we shouldn't. The integration middleware we build ourselves. The dashboard we configure from the vendor. One budget line for the platform, one for internal engineering." — CTO and CMO joint decision, Week 15`}
          gateOutcome="Gate cleared: each root cause addressed in design, sourcing decision documented with rationale (Buy + internal middleware), architecture reviewed by CTO and CMO, operating model defined. Advanced to P4."
          gateCleared
        />

        <PhaseCard
          phase="P4"
          name="Roadmap & Business Case"
          color={T.navy}
          gate="Investment Approval"
          situation="The moment of truth — the formal financial commitment. The CFO and CMO needed to see the full business case, cost of the solution, implementation timeline, and 3-year value model before approving investment. One vendor quote came in $220K higher than modeled. The numbers still worked."
          nexusDidItems={[
            'Built 5-sheet Financial Model from P0 value hypothesis + P3 sourcing decisions + vendor quotes: Assumptions, 3-year P&L, NPV/IRR, Sensitivity, Payback curve',
            'Modeled three scenarios: conservative (65% automation adoption), base (80%), optimistic (90%)',
            'Updated model when vendor implementation quote came in at $1.92M vs. modeled $1.7M — recalculated payback from 12 to 13 months automatically, flagged change in executive summary',
            'Drafted 28-milestone execution roadmap with named workstream owners and Q1–Q4 phasing',
            'Built Tower Metrics Plan: 4 KPIs for Ava to track in Control Tower post-handoff (markdown rate, stockout rate, AI recommendation adoption rate, inventory turn velocity)',
          ]}
          humanDecided='"$4.2M all-in for $39.6M gross value over 3 years and 13-month payback. Approved. This is the business case we needed two years ago." — CFO and CMO co-signature, investment approval, Week 20'
          gateOutcome="Gate cleared: financial model with 3-year projection, 28-milestone roadmap, CFO + CMO co-signed business case, Tower metrics defined. $3.72M implementation approved. Advanced to P5."
          gateCleared
        />

        <PhaseCard
          phase="P5"
          name="Mobilize & Handoff"
          color={T.teal}
          gate="Tower Acceptance"
          situation="Two weeks to assemble the delivery team, resolve every open risk, compile the handoff package, and get Tower acceptance. Ava flagged three risks from the P2 register that still needed owners — one of which (change management for buyer adoption) was the exact failure mode that killed the 2022 initiative."
          nexusDidItems={[
            'Compiled full Handoff Package: Charter (P1), Current State Assessment (P2), Target State Architecture (P3), Business Case + Financial Model (P4), Roadmap, Risk Register',
            'Pre-filled RACI with delivery team: PM = Head of Digital Transformation, Tech Lead = Director of Platform Engineering, Vendor Lead = selected after RFP award',
            'Flagged 3 open risks needing owners before Tower acceptance: change management (buyer adoption), SAP integration timeline buffer, vendor selection delay risk',
            'Submitted for Tower acceptance — in Control Tower, Ava confirmed intake and added the Move to the portfolio heatmap',
          ]}
          humanDecided='"Change management risk owner: CMO personally. She owns the buyer adoption target — it goes into her OKRs. That is the lesson from 2022." — Head of Digital Transformation, P5 session, Week 22'
          gateOutcome="Gate cleared: delivery team assembled, all risks assigned owners, Handoff Package complete, Tower acceptance confirmed. Move closed. Ava monitoring live in Control Tower."
          gateCleared
        />
      </Section>

      {/* ── Value breakdown ─────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>The value case</Eyebrow>
        <SectionTitle>$39.6M gross value — how it was built</SectionTitle>
        <Lead>
          Three distinct value streams, two of them recoverable only because the root causes were properly diagnosed in P2. The Financial Model was built from the P0 hypothesis seed — every assumption traceable to a documented source.
        </Lead>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, margin: '28px 0' }}>
          {/* Left: value streams */}
          <div>
            <SubHead>Value by stream</SubHead>

            <ValueBar
              label="Markdown rate reduction — 14.2% → 8.9%"
              value="$14.2M / yr"
              pct={82}
              color={T.teal}
            />
            <ValueBar
              label="Stockout revenue recovery — top-3 categories"
              value="$9.1M / yr"
              pct={53}
              color={T.navy}
            />
            <ValueBar
              label="Inventory carrying cost reduction"
              value="$3.8M / yr"
              pct={22}
              color="#4B5563"
            />

            <div
              style={{
                borderTop: `2px solid ${T.border}`,
                paddingTop: 14,
                marginTop: 8,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  Total annual run-rate value
                </span>
                <span style={{ fontFamily: T.fDisp, fontSize: 22, fontWeight: 400, color: T.teal, letterSpacing: '-0.02em' }}>
                  $27.1M
                </span>
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.faint }}>
                At full automation (80% base case). Conservative: $18.4M/yr.
              </div>
            </div>
          </div>

          {/* Right: year-by-year */}
          <div>
            <SubHead>Year-by-year financial model</SubHead>

            <div
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {[
                { year: 'Program cost', y1: '−$3.72M', y2: '−$480K', y3: '−$480K', isHeader: false, isCost: true },
                { year: 'Value generated', y1: '$11.2M', y2: '$15.8M', y3: '$12.6M', isHeader: false, isCost: false },
                { year: 'Net value', y1: '$7.5M', y2: '$15.3M', y3: '$12.1M', isHeader: false, isCost: false, isBold: true },
              ].map((row, i) => (
                <div
                  key={row.year}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr 1fr',
                    borderBottom: i < 2 ? `1px solid ${T.borderLt}` : 'none',
                    background: i === 2 ? T.surface2 : i % 2 === 0 ? T.surface : T.surface,
                  }}
                >
                  {[
                    { label: row.year, bold: (row as any).isBold },
                    { label: row.y1, bold: (row as any).isBold },
                    { label: row.y2, bold: (row as any).isBold },
                    { label: row.y3, bold: (row as any).isBold },
                  ].map((cell, j) => (
                    <div
                      key={j}
                      style={{
                        padding: '11px 14px',
                        fontFamily: j === 0 ? T.fBody : T.fMono,
                        fontSize: j === 0 ? 12 : 12,
                        fontWeight: cell.bold ? 700 : j === 0 ? 500 : 400,
                        color: (row as any).isCost
                          ? '#991B1B'
                          : cell.bold
                          ? T.teal
                          : T.body,
                        borderRight: j < 3 ? `1px solid ${T.borderLt}` : 'none',
                      }}
                    >
                      {j === 0 && i === 0 ? (
                        cell.label
                      ) : j === 0 ? (
                        cell.label
                      ) : (
                        cell.label
                      )}
                    </div>
                  ))}
                </div>
              ))}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr 1fr',
                  background: T.navySoft,
                  borderTop: `2px solid ${T.navyLine}`,
                }}
              >
                {['3-year total', '', '', '$34.9M net'].map((cell, j) => (
                  <div
                    key={j}
                    style={{
                      padding: '11px 14px',
                      fontFamily: T.fMono,
                      fontSize: 11,
                      fontWeight: 700,
                      color: T.navy,
                      borderRight: j < 3 ? `1px solid ${T.navyLine}` : 'none',
                      letterSpacing: j === 3 ? '-0.01em' : '0',
                    }}
                  >
                    {cell}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 14, fontFamily: T.fBody, fontSize: 11, color: T.faint, lineHeight: 1.55 }}>
              Year 1 partial (8-month ramp). Year 2 first full year at base-case automation. Year 3 steady state. Annual platform license: $480K. NPV at 12% discount: $27.3M.
            </div>
          </div>
        </div>
      </Section>

      {/* ── After the Move ─────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>Post-handoff · Control Tower</Eyebrow>
        <SectionTitle>What Ava watches — today</SectionTitle>
        <Lead>
          The Move closed at P5. In Control Tower, Ava — the same assistant who ran the Move with you, now drawing on her portfolio-monitoring expertise — picked it up. The four KPIs defined in the P4 Tower Metrics Plan are live — updated weekly, visible in the portfolio heatmap.
        </Lead>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, margin: '24px 0' }}>
          {[
            {
              kpi: 'Markdown rate',
              current: '9.1%',
              target: '< 9.5%',
              status: 'green',
              trend: '↓ from 14.2% at start',
            },
            {
              kpi: 'Stockout rate (top-20 SKUs)',
              current: '8.4%',
              target: '< 12%',
              status: 'green',
              trend: '↓ from 22% at start',
            },
            {
              kpi: 'AI recommendation adoption',
              current: '71%',
              target: '> 75%',
              status: 'yellow',
              trend: 'CMO OKR — buyers still overriding',
            },
            {
              kpi: 'Inventory turn velocity',
              current: '4.2×',
              target: '> 4.0×',
              status: 'green',
              trend: '↑ from 3.1× at start',
            },
          ].map((kpi) => (
            <div
              key={kpi.kpi}
              style={{
                border: `1px solid ${kpi.status === 'green' ? T.tealLine : T.amberLine}`,
                background: kpi.status === 'green' ? T.tealSoft : T.amberSoft,
                borderRadius: 10,
                padding: '16px 18px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 10,
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: kpi.status === 'green' ? T.teal : '#F59E0B',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.faint }}>
                  {kpi.kpi}
                </span>
              </div>
              <div style={{ fontFamily: T.fDisp, fontSize: 26, fontWeight: 400, color: T.ink, letterSpacing: '-0.02em', marginBottom: 4 }}>
                {kpi.current}
              </div>
              <div style={{ fontFamily: T.fMono, fontSize: 9, color: T.faint, marginBottom: 6 }}>
                Target: {kpi.target}
              </div>
              <div style={{ fontFamily: T.fBody, fontSize: 11, color: T.muted, lineHeight: 1.45 }}>
                {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        <Callout kind="warn" icon="⚠️" label="The one KPI under target — and why it matters">
          AI recommendation adoption is at 71%, short of the 75% target. Ava flagged this at Week 8. The CMO owns this OKR — and that ownership was a deliberate P5 gate decision after the 2022 adoption failure. Without that decision, this signal would have no owner. With it, the CMO is already adjusting buyer coaching and override-review processes. The Tower signal is working.
        </Callout>
      </Section>

      {/* ── Why this worked ────────────────────────────────────────────── */}
      <Section>
        <Eyebrow>The lessons</Eyebrow>
        <SectionTitle>What made this Move succeed at scale</SectionTitle>
        <Lead>
          Most large-scale AI initiatives fail in the first 18 months. This one didn't. Three decisions made the difference.
        </Lead>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: '24px 0' }}>
          {[
            {
              num: '01',
              title: 'The hypothesis was falsifiable from day one',
              body: 'The P0 hypothesis wasn\'t "explore AI for inventory." It was: "A 6-week demand signal lag vs. 10–14 day industry is causing our markdown rate to run 5+ points above peers — and we can close that gap with an ML layer." That falsifiability meant P2 knew exactly what to measure, P3 knew exactly what to fix, and P4 could model the economics precisely. A vague hypothesis produces vague results.',
            },
            {
              num: '02',
              title: 'The sponsor owned the adoption risk personally',
              body: 'The 2022 initiative failed because buyers didn\'t adopt the recommendations — and no one owned that risk at the executive level. In P5, the CMO personally took ownership of the buyer adoption OKR. Not as a stakeholder. As the owner. When the Tower signal flagged underperformance at Week 8, she already had authority and accountability to act.',
            },
            {
              num: '03',
              title: 'P2 found root causes — not symptoms',
              body: 'The easy diagnosis was "our demand forecasting is bad." The real diagnosis was: (1) 6-week signal lag, (2) buyers ignoring AI recommendations due to trust gaps, and (3) no cross-category visibility. Designing against the symptoms would have produced another failed tool. Designing against the root causes produced a system that changed behavior.',
            },
          ].map((lesson) => (
            <div
              key={lesson.num}
              style={{
                display: 'flex',
                gap: 24,
                padding: '24px 0',
                borderBottom: `1px solid ${T.borderLt}`,
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 32,
                  fontWeight: 700,
                  color: T.borderLt,
                  letterSpacing: '-0.04em',
                  lineHeight: 1,
                  flexShrink: 0,
                  width: 56,
                }}
              >
                {lesson.num}
              </div>
              <div>
                <div style={{ fontFamily: T.fBody, fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 10, letterSpacing: '-0.01em' }}>
                  {lesson.title}
                </div>
                <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.7 }}>
                  {lesson.body}
                </div>
              </div>
            </div>
          ))}
        </div>

        <Callout kind="success" icon="→" label="Run your own Move">
          The Apex Retail case is the template. A signal from leadership, a structured hypothesis, six phases of disciplined work, and a business outcome visible in Tower. Your first Move starts the same way — with something your business already knows is a problem. Navigate to <span style={{ fontFamily: T.fMono, fontSize: 12 }}>/strategic-moves → + New Move</span> and paste whatever signal you have. Ava takes it from there.
        </Callout>
      </Section>
    </>
  );
}
