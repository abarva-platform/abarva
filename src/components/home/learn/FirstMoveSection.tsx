'use client';
import {
  Section,
  HeroBand,
  Eyebrow,
  SectionTitle,
  Lead,
  BodyP,
  SubHead,
  Callout,
  TermGrid,
  Term,
  T,
} from './primitives';

// ─── Chat message mock ────────────────────────────────────────────────────

function ChatMessage({
  role,
  children,
}: {
  role: 'user' | 'nexus';
  children: React.ReactNode;
}) {
  const isUser = role === 'user';
  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        flexDirection: isUser ? 'row-reverse' : 'row',
        marginBottom: 12,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: isUser ? T.navy : T.teal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: T.fMono,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: '#fff',
          flexShrink: 0,
        }}
      >
        {isUser ? 'YOU' : 'NX'}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: '78%',
          background: isUser ? T.navySoft : T.surface2,
          border: `1px solid ${isUser ? T.navyLine : T.border}`,
          borderRadius: isUser ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
          padding: '10px 14px',
          fontFamily: T.fBody,
          fontSize: 13,
          color: T.body,
          lineHeight: 1.65,
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ChatWindow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        margin: '20px 0',
      }}
    >
      {/* Titlebar */}
      <div
        style={{
          background: T.surface2,
          borderBottom: `1px solid ${T.border}`,
          padding: '10px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', gap: 5 }}>
          {['#EF4444', '#F59E0B', '#10B981'].map((c) => (
            <div key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c }} />
          ))}
        </div>
        <span style={{ fontFamily: T.fMono, fontSize: 10, color: T.faint, letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>

      {/* Messages */}
      <div style={{ padding: '16px 16px 8px', background: T.surface }}>
        {children}
      </div>
    </div>
  );
}

// ─── Phase step ───────────────────────────────────────────────────────────

function PhaseStep({
  phase,
  name,
  color,
  gate,
  children,
}: {
  phase: string;
  name: string;
  color: string;
  gate: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        overflow: 'hidden',
        margin: '28px 0',
      }}
    >
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
        <span
          style={{
            fontFamily: T.fMono,
            fontSize: 16,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.02em',
          }}
        >
          {phase}
        </span>
        <span
          style={{
            fontFamily: T.fDisp,
            fontSize: 18,
            fontWeight: 400,
            color: '#fff',
          }}
        >
          {name}
        </span>
        <span
          style={{
            marginLeft: 'auto',
            fontFamily: T.fMono,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 4,
            padding: '4px 10px',
          }}
        >
          Gate: {gate}
        </span>
      </div>
      <div style={{ padding: '22px 22px' }}>
        {children}
      </div>
    </div>
  );
}

// ─── Outcome chip row ─────────────────────────────────────────────────────

function OutcomeRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div style={{ margin: '16px 0' }}>
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
        {label}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {items.map((item) => (
          <span
            key={item}
            style={{
              fontFamily: T.fBody,
              fontSize: 12,
              color: T.body,
              background: T.surface2,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
              padding: '4px 10px',
            }}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────

export function FirstMoveSection() {
  return (
    <>
      <HeroBand color="slate">
        <Eyebrow light>First Move · Walkthrough</Eyebrow>
        <SectionTitle light size="xl">Your first Move, step by step</SectionTitle>
        <Lead light>
          A complete walkthrough of the P0 → P5 workflow using a realistic example: reducing contact center handle time with AI routing. You'll see exactly what Nexus does at each phase and what decisions stay with you.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['Surface: Strategic Moves', 'Audience: First-time users', 'Time: ~25 min'].map((tag) => (
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

      {/* Scenario setup */}
      <Section>
        <Eyebrow>The scenario</Eyebrow>
        <SectionTitle>The initiative we'll run</SectionTitle>
        <Lead>
          You're a CIO at a retail company. The CEO just sent a note: the contact center is running at 9 minutes average handle time, industry peers are at 5.5. There's a $4M gap. He wants someone to own it.
        </Lead>

        <div
          style={{
            border: `1px solid ${T.navyLine}`,
            background: T.navySoft,
            borderRadius: 10,
            padding: '20px 22px',
            margin: '20px 0',
          }}
        >
          <div
            style={{
              fontFamily: T.fMono,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: T.navy,
              marginBottom: 10,
            }}
          >
            Signal — CEO note
          </div>
          <p style={{ fontFamily: T.fBody, fontSize: 14, color: T.ink, lineHeight: 1.7, margin: 0, fontStyle: 'italic' }}>
            "Saw the QBR numbers — our contact center AHT is 9 min vs. industry 5.5. That's roughly $4M in excess cost annually.
            AI-assisted routing seems worth exploring. Need someone to own this properly and come back with a business case.
            Can you take point?"
          </p>
          <div
            style={{
              marginTop: 12,
              fontFamily: T.fBody,
              fontSize: 11,
              color: T.faint,
            }}
          >
            — CEO note, forwarded to you. You've been handed the initiative.
          </div>
        </div>

        <BodyP>
          This is a common origin for a Strategic Move: a signal from leadership, a rough number, and an ask to "own it." P0 is where you turn this into something structured. Let's walk through the full journey.
        </BodyP>
      </Section>

      {/* P0 */}
      <Section>
        <PhaseStep phase="P0" name="Originate" color={T.ink2} gate="Promotion to P1">
          <BodyP>
            <strong>What you do:</strong> Navigate to Strategic Moves → New Move. Paste the CEO note into the chat. Nexus immediately starts extracting structure.
          </BodyP>

          <ChatWindow title="Nexus · P0 Originate">
            <ChatMessage role="user">
              <em style={{ color: T.faint }}>[Pastes the CEO note]</em>
              <br />
              Here's the note I got. I want to originate a Move from this.
            </ChatMessage>
            <ChatMessage role="nexus">
              Got it. Based on this note I can extract a preliminary hypothesis:
              <br /><br />
              <strong>Bet/Outcome:</strong> Reduce contact center average handle time from 9 min to under 6.5 min using AI-assisted routing.<br />
              <strong>Archetype:</strong> Workflow Automation (confidence: high)<br />
              <strong>Trigger:</strong> CEO review of QBR data showing $4M AHT gap vs. industry<br />
              <br />
              A few things I still need: <strong>Sponsor candidate</strong> (who is owning this?), <strong>Scope</strong> (inbound only, or also outbound/email?), and the <strong>$4M figure</strong> — I'll record that as an unvalidated hypothesis until P2 baseline data confirms it. Does the hypothesis read right?
            </ChatMessage>
            <ChatMessage role="user">
              Yes that reads right. Sponsor will be the COO — she asked me to own the execution. Scope is inbound routing only, not outbound.
            </ChatMessage>
            <ChatMessage role="nexus">
              Noted. I've updated:<br />
              <strong>Sponsor candidate:</strong> COO (you named her directly — I'll confirm she's committed in P1 before we finalize the charter).<br />
              <strong>Scope in:</strong> Inbound contact center routing.<br />
              <strong>Scope out:</strong> Outbound, email, and back-office workflows.<br />
              <br />
              One more: what value levers are most likely here — cost reduction, cycle time, or both? And is there a rough order-of-magnitude the COO has in mind beyond the $4M?
            </ChatMessage>
            <ChatMessage role="user">
              Primarily cost reduction. The $4M is from the CEO note — I don't have more precision than that yet.
            </ChatMessage>
            <ChatMessage role="nexus">
              Recorded. Value hypothesis seeded: <em>Reduce excess AHT cost by $2–5M annually through ML-assisted routing (UNVALIDATED HYPOTHESIS — dependent on P2 baseline evidence).</em>
              <br /><br />
              All five hard gate criteria are now met. Ready to name and promote to P1 when you are.
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P0"
            items={[
              'Falsifiable hypothesis',
              'Archetype: Workflow Automation',
              'Sponsor candidate: COO',
              'Scope boundary (in/out)',
              'Value hypothesis (UNVALIDATED)',
              'Evidence families: call logs, routing data, ops benchmarks',
            ]}
          />

          <Callout kind="info" icon="💡" label="The UNVALIDATED HYPOTHESIS label">
            Notice that Nexus never confirms the $4M figure — it records it as an unvalidated hypothesis. This isn't a limitation; it's a discipline. You will validate (or revise) this against real baseline data in P2.
          </Callout>
        </PhaseStep>
      </Section>

      {/* P1 */}
      <Section>
        <PhaseStep phase="P1" name="Charter" color={T.navy} gate="Charter Approval">
          <BodyP>
            <strong>What you do:</strong> Brief the COO on the structured initiative and engage her as the named functional sponsor. Her sign-off at P1 means she's aligned on scope and governance — not yet approving cost or timeline. That comes at P4 after the business case is built.
          </BodyP>

          <ChatWindow title="Nexus · P1 Charter">
            <ChatMessage role="nexus">
              Welcome to P1. The P0 gate cleared — we have a hypothesis and a sponsor candidate: the COO. P1 goal: engage her on scope and governance, then produce a charter that reflects her input. Has she had a chance to review the initiative framing?
            </ChatMessage>
            <ChatMessage role="user">
              Yes — we had a 30-min call yesterday. She's aware and engaged. She wants to see a business case by Q3 — she said she'll make a final call on funding once we have cost and timeline.
            </ChatMessage>
            <ChatMessage role="nexus">
              Good. I'll record: COO as named sponsor, engaged and aligned, with a Q3 business case target. Her formal investment decision (approve cost + timeline) will happen at the P4 gate — that's by design. For P1, we need her sign-off on scope and the charter.
              <br /><br />
              Next: stakeholder map. Beyond the COO, who else must weigh in on scope, investment, or delivery direction?
            </ChatMessage>
            <ChatMessage role="user">
              VP of Customer Experience is the program lead. IT needs to sign off on routing system changes. Finance needs to approve the business case. Operations consulted but no veto.
            </ChatMessage>
            <ChatMessage role="nexus">
              Mapped. Decision rights draft:<br />
              • COO — Final investment authority (P4 gate)<br />
              • VP CX — Accountable / program lead<br />
              • IT — Consulted / routing sign-off<br />
              • Finance — Consulted / business case review<br />
              • Operations — Informed<br />
              <br />
              For the value range: the COO mentioned "somewhere between $2M and $5M." What assumption drives that range?
            </ChatMessage>
            <ChatMessage role="user">
              She's assuming 75–85% automation rate on the top 3 call categories.
            </ChatMessage>
            <ChatMessage role="nexus">
              Value range: <em>$2M–$5M annually (PRELIMINARY ESTIMATE — dependent on P2 baseline and automation rate assumption: 75–85% of top 3 call categories).</em>
              <br /><br />
              Ready to draft the charter for the COO to review and sign off. Should I proceed?
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P1"
            items={[
              'Program Charter (11 sections)',
              'Sponsor engagement documented (COO)',
              'Stakeholder map with decision rights',
              'Value range: $2M–$5M (PRELIMINARY ESTIMATE)',
              'Primary metric: AHT (baseline TBD in P2)',
              'Gate readiness summary',
            ]}
          />

          <Callout kind="info" icon="💡" label="Charter sign-off ≠ investment approval">
            The COO signed the charter — she's the named sponsor and is aligned on scope. She has NOT yet approved the investment. That happens at P4 when the business case is complete and the cost/timeline are known. This is the right sequence: engage first, commit investment after evidence.
          </Callout>
        </PhaseStep>
      </Section>

      {/* P2 */}
      <Section>
        <PhaseStep phase="P2" name="Discover & Diagnose" color={T.navy} gate="Diagnosis Sign-Off">
          <BodyP>
            <strong>What you do:</strong> Pull the last 6 months of call center data. Upload the IVR routing logs. Nexus analyzes what's driving high AHT and builds the root cause analysis.
          </BodyP>

          <ChatWindow title="Nexus · P2 Discover & Diagnose">
            <ChatMessage role="user">
              <em style={{ color: T.faint }}>[Uploads: call_center_ops_Q3Q4.xlsx, ivr_routing_logs_6mo.csv]</em>
              <br />
              Here's the data. Can you identify what's driving high AHT?
            </ChatMessage>
            <ChatMessage role="nexus">
              Analyzed. Three primary root causes account for 61% of excess handle time:
              <br /><br />
              1. <strong>Authentication failures</strong> (23% of excess): Callers failing IVR auth on first attempt → routed to live agent → re-auth in live call adds 2.8 min average.<br />
              2. <strong>Billing dispute mis-routing</strong> (22% of excess): Billing calls routed to general queue before reaching billing specialists → avg 1.6 additional transfers.<br />
              3. <strong>Routing timeouts</strong> (16% of excess): IVR timeout on complex calls defaults to longest-wait queue instead of intent-matched queue.<br />
              <br />
              Remaining 39% is distributed across smaller categories. The top 3 are addressable with ML routing. Shall I draft the Root Cause Analysis?
            </ChatMessage>
            <ChatMessage role="user">
              Yes — and what's the Continue/Discontinue verdict?
            </ChatMessage>
            <ChatMessage role="nexus">
              <strong>Continue.</strong> The three root causes are specific, addressable with ML routing, and account for a meaningful portion of excess cost. The data is sufficient to proceed to P3 design.
              <br /><br />
              One flag: the Foundation Readiness from P0 noted "no ML infrastructure in-house." The P3 sourcing decision will need to address this explicitly — this is likely a Buy scenario, not Build.
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P2"
            items={[
              'Current State Assessment',
              'Root Cause Analysis (3 root causes)',
              'Problem Statement',
              'Risk Register',
              'Continue/Discontinue: Continue',
            ]}
          />
        </PhaseStep>
      </Section>

      {/* P3 */}
      <Section>
        <PhaseStep phase="P3" name="Design Future State" color={T.navy} gate="Design Approval">
          <BodyP>
            <strong>What you do:</strong> Address each root cause with a design decision. Make the build/buy/partner call. Nexus drafts the architecture, but the sourcing decision is yours.
          </BodyP>

          <ChatWindow title="Nexus · P3 Design Future State">
            <ChatMessage role="user">
              Given the "no ML infra" flag from P0 — this needs to be a Buy. We'll evaluate an ML routing vendor.
              Rationale: time to value is critical for Q3, and we don't have 18 months to build internal ML.
            </ChatMessage>
            <ChatMessage role="nexus">
              Sourcing decision recorded: <strong>Buy</strong> — ML routing vendor. Rationale: Q3 deadline + no in-house ML infrastructure. This links directly to Foundation Readiness gap from P0.
              <br /><br />
              Design decisions for each root cause:
              <br />
              1. Auth failures → Intent-based pre-auth routing to reduce IVR auth drops<br />
              2. Billing mis-routing → Intent classification to route billing calls directly<br />
              3. Routing timeouts → ML-assisted fallback routing using intent score, not default queue<br />
              <br />
              Each design decision traces to a P2 root cause. Ready to draft Target State Architecture?
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P3"
            items={[
              'Target State Architecture',
              'Solution Design',
              'Sourcing Strategy: Buy (vendor ML routing)',
              'Operating Model Design',
              'Vendor evaluation criteria (for P4 RFP)',
            ]}
          />

          <Callout kind="info" icon="💡" label="Your decision at P3: build/buy/partner">
            Nexus flagged the infrastructure gap and presented the options — but you made the call. "Buy, because Q3 deadline and no in-house ML." That rationale is recorded and flows directly into the P4 financial model assumptions.
          </Callout>
        </PhaseStep>
      </Section>

      {/* P4 */}
      <Section>
        <PhaseStep phase="P4" name="Roadmap & Business Case" color={T.navy} gate="Investment Approval">
          <BodyP>
            <strong>What you do:</strong> Vendor quotes come in. Update the financial model. Get executive sign-off on the business case. This is the highest-stakes gate.
          </BodyP>

          <ChatWindow title="Nexus · P4 Roadmap & Business Case">
            <ChatMessage role="user">
              Vendor quotes came in. Implementation cost is $420K (higher than the $380K we assumed). Year 1 licensing is $180K annually.
            </ChatMessage>
            <ChatMessage role="nexus">
              Financial model updated. Revised numbers:
              <br /><br />
              • Total Year 1 investment: $600K ($420K impl + $180K license)<br />
              • Year 2–3 investment: $180K/yr (license only)<br />
              • Annual cost savings (at midpoint 80% automation): $3.1M<br />
              • Revised payback period: <strong>14 months</strong> (was 12 with lower cost assumption)<br />
              • 3-year NPV: $4.8M<br />
              <br />
              The Business Case is still strong. I've updated the executive summary to note the cost revision. The COO will see the revised payback period when she reviews.
            </ChatMessage>
            <ChatMessage role="user">
              Good. COO reviewed and signed off last Thursday.
            </ChatMessage>
            <ChatMessage role="nexus">
              Investment gate criteria met. P4 → P5 gate is clear. All hard criteria passed:
              <br />
              ✓ Financial model with 3-year projection<br />
              ✓ Roadmap with milestones and owners<br />
              ✓ Executive sponsor sign-off on business case<br />
              ✓ Tower metrics defined (AHT monthly, routing automation rate, cost per call)<br />
              <br />
              Ready to advance to P5 when you are.
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P4"
            items={[
              'Execution Roadmap (milestones + owners)',
              'Business Case (14mo payback, 3-yr NPV $4.8M)',
              'Financial Model (Excel, 5 sheets)',
              'Tower Metrics Plan',
              'Investment gate: cleared',
            ]}
          />
        </PhaseStep>
      </Section>

      {/* P5 */}
      <Section>
        <PhaseStep phase="P5" name="Mobilize & Handoff" color={T.teal} gate="Tower Acceptance">
          <BodyP>
            <strong>What you do:</strong> Name the delivery team. Generate the handoff package. Get Tower acceptance. The Move closes and transitions to Atlas in Control Tower.
          </BodyP>

          <ChatWindow title="Nexus · P5 Mobilize & Handoff">
            <ChatMessage role="user">
              Delivery team: PM is Priya Mehta, tech lead is Marcus Kim. Generate the handoff package.
            </ChatMessage>
            <ChatMessage role="nexus">
              Handoff package assembled. Includes: Charter (P1), Current State Assessment (P2), Target State Architecture (P3), Business Case + Financial Model (P4), Roadmap, Risk Register.
              <br /><br />
              RACI pre-filled: PM = Priya Mehta, Tech Lead = Marcus Kim, Sponsor = COO.
              <br /><br />
              One flag: two risks from the P2 Risk Register are still unowned — "IVR vendor integration delay" and "Data quality in routing logs." These need assigned owners before Tower acceptance can confirm.
            </ChatMessage>
            <ChatMessage role="user">
              IVR vendor risk owner: Marcus. Data quality risk owner: Priya.
            </ChatMessage>
            <ChatMessage role="nexus">
              All risks assigned. Readiness Assessment complete. Tower acceptance requested.
              <br /><br />
              ✓ Delivery team assembled (PM + tech lead named)<br />
              ✓ Handoff package complete<br />
              ✓ Tower acceptance: confirmed<br />
              ✓ All deliverables at Signed Off status<br />
              <br />
              <strong>Move closed.</strong> This Move has transitioned to Control Tower. Atlas has picked it up — it will appear in the portfolio heatmap within a few minutes.
            </ChatMessage>
          </ChatWindow>

          <OutcomeRow
            label="What Nexus produced at P5"
            items={[
              'Handoff Package (compiled, all phases)',
              'Delivery RACI (Priya / Marcus / COO)',
              'Readiness Assessment',
              'Tower acceptance: confirmed',
              'Move closed → Atlas monitoring',
            ]}
          />

          <Callout kind="success" icon="→" label="The Move has closed">
            From a one-line CEO note to a fully governed, investment-approved, Tower-accepted program — in 6 phases. Atlas now monitors execution progress, KPIs, and signals in Control Tower. You can track the program from the portfolio heatmap at <code style={{ fontFamily: T.fMono, fontSize: 12, background: T.surface3, padding: '2px 6px', borderRadius: 3 }}>/tower</code>.
          </Callout>
        </PhaseStep>
      </Section>

      {/* Summary */}
      <Section>
        <Eyebrow>Walkthrough recap</Eyebrow>
        <SectionTitle>What just happened</SectionTitle>
        <Lead>
          You ran a complete Strategic Move — from a CEO note to a Tower-accepted program — with Nexus handling the structure and you making the decisions that mattered.
        </Lead>

        <TermGrid>
          <Term name="P0 decision">
            You named the COO as sponsor candidate and bounded the scope to inbound routing. Nexus extracted the hypothesis and value seed — you confirmed.
          </Term>
          <Term name="P1 decision">
            You engaged the COO as named sponsor — she's aligned on scope and signed the charter. The value range ($2–$5M with stated assumptions) was deliberated together. Her formal investment approval comes at P4 after the business case.
          </Term>
          <Term name="P2 decision">
            You made the Continue/Discontinue call. (In this case: Continue.) Nexus surfaced the root causes — but the judgment to proceed was yours.
          </Term>
          <Term name="P3 decision">
            You chose Buy over Build, with an explicit rationale (Q3 deadline + no in-house ML). This single decision shaped the entire P4 financial model.
          </Term>
          <Term name="P4 decision">
            You confirmed executive sign-off on the business case with the revised payback period. You owned the stakeholder alignment.
          </Term>
          <Term name="P5 decision">
            You named the delivery team and resolved the open risks. Tower acceptance is a hard gate — you can't close a Move without it.
          </Term>
        </TermGrid>

        <SubHead>What Nexus contributed</SubHead>
        <BodyP>
          Extracted structure from an email, classified the archetype, drafted every document, built the financial model, tracked every gate criterion, flagged every anti-pattern, and compiled the handoff package. Every draft was reviewed and confirmed by you.
        </BodyP>

        <Callout kind="info" icon="🎯" label="Now run your own">
          Ready to originate your first real Move? Go to <code style={{ fontFamily: T.fMono, fontSize: 12, background: T.surface3, padding: '2px 6px', borderRadius: 3 }}>/strategic-moves → + New Move</code> and paste whatever signal you're working with — a note, an email, a problem description. Nexus will take it from there.
        </Callout>
      </Section>
    </>
  );
}
