'use client';
import { Section, Eyebrow, SectionTitle, Lead, PhaseCard, Callout, TermGrid, Term, T } from './primitives';

interface PhaseDef {
  num: string;
  name: string;
  gate: string;
  eyebrow: string;
  intro: string;
  goal: string;
  chatExample: string;
  deliverables: Array<{ label: string; isGate?: boolean; tag?: string }>;
  criteria: Array<{ text: string; hard: boolean }>;
  callout: { kind: 'info' | 'warn' | 'success'; icon: string; label: string; body: string };
  terms: Array<{ name: string; def: string }>;
  color?: 'navy' | 'teal';
}

const PHASES: Record<string, PhaseDef> = {
  p0: {
    num: 'P0',
    name: 'Originate',
    gate: 'Promotion to P1',
    eyebrow: 'Strategic Moves · P0',
    intro: 'Where a Move is born. You describe the initiative in natural language chat with Ava. She extracts seven structured fields into a scaffold panel on the right. Once four required fields are filled, you name and promote the Move to P1.',
    goal: 'Describe the initiative conversationally — Ava extracts the seven scaffold fields from your chat. Once the four required fields are filled and you name the Move, you can promote to P1.',
    chatExample: '"We have a 240bps private label GM gap vs our peer benchmark. The CFO wants to understand why the Morrison brand specifically is underperforming — markdown timing looks off." → Ava: "I can see the Morrison pressure card in your substrate — 34.2% current vs 36.0% target. Filling your bet as: \'Recover Morrison private label GM from 34.2% to 36.0% across 14 underperforming segments.\' Archetype: Revenue Growth. CFO as sponsor — is that Lisa Park? And what\'s in scope — Morrison only, or all private label?" → Three fields filled in 90 seconds.',
    deliverables: [
      { label: '📋 Origination Scaffold', isGate: true },
      { label: '🎯 Move Record' },
    ],
    criteria: [
      { text: 'Bet / outcome field filled (outcome-level, directional)', hard: true },
      { text: 'Archetype confirmed', hard: true },
      { text: 'Executive sponsor named', hard: true },
      { text: 'Scope boundary explicit (in / out)', hard: true },
      { text: 'Value hypothesis entered (order-of-magnitude ok)', hard: false },
      { text: 'Foundation readiness assessed', hard: false },
    ],
    callout: {
      kind: 'info',
      icon: '💡',
      label: 'APX-01: Ava pre-filled 5 of 7 fields',
      body: 'When David Kim\'s team clicked "→ Originate a Move" on the Morrison pressure card, Ava already had the substrate evidence. She pre-filled: bet/outcome, archetype, scope boundary, value hypothesis, and foundation readiness. They confirmed the sponsor (Lisa Park, CFO) and the initiative name. Total origination time: 20 minutes. That\'s what a substrate-backed origination looks like vs. starting from a blank form.',
    },
    terms: [
      { name: 'Scaffold', def: 'The seven-field structure Ava fills during P0. It seeds all downstream documents and gate criteria. A well-filled scaffold = much better phase documents.' },
      { name: 'Bet / outcome', def: 'Field 1: the result you\'re targeting — one sentence, outcome-level, with direction and magnitude. Not a project name. "Recover Morrison private label GM from 34.2% to 36.0%" not "Morrison Pricing Project."' },
      { name: 'Archetype', def: 'Field 2: Cost Reduction, Revenue Growth, Risk Mitigation, or Operational Excellence. Ava suggests based on your description — confirm or correct.' },
      { name: 'Foundation readiness', def: 'Field 7: honest assessment of current-state data/infra. For APX-01: "Oracle POS + Workday connected. Pricing override data available. No in-house ML — substrate-native modeling only." Used in P3 Build vs Buy decision.' },
    ],
  },
  p1: {
    num: 'P1',
    name: 'Charter',
    gate: 'Charter Approval',
    eyebrow: 'Strategic Moves · P1',
    intro: 'Formalize the program scope, objectives, and governance. Define who owns what and establish the baseline timeline.',
    goal: 'Formalize the program scope, objectives, and governance. Define who owns what and establish the baseline timeline. The Charter Gate requires a named sponsor, a defined scope, and a signed-off charter document before you can advance to discovery.',
    chatExample: '"Ava, Lisa Park is the executive sponsor, Rachel Torres from Owned Brands is program lead. Marcus Chen COO needs to be consulted on the pricing changes — he controls the markdown calendar." → Ava: "Got it. I\'m adding Marcus Chen as Consulted with a note: \'Markdown calendar changes require COO sign-off before implementation.\' That\'s a decision-rights gap — any pricing change Rachel\'s team designs in P3 will need Marcus\'s approval before it goes live. I\'m flagging it as a charter risk so it doesn\'t block the P3 gate later. Should I add a named review checkpoint in the baseline timeline?"',
    deliverables: [
      { label: '📄 Program Charter', isGate: true },
      { label: '👥 Stakeholder Map' },
      { label: '📅 Baseline Timeline' },
      { label: '🗂️ RACI Matrix' },
    ],
    criteria: [
      { text: 'Named executive sponsor confirmed', hard: true },
      { text: 'Scope boundary documented & approved', hard: true },
      { text: 'Charter document generated & signed off', hard: true },
      { text: 'Stakeholder RACI reviewed by sponsor', hard: false },
    ],
    callout: {
      kind: 'info',
      icon: '💡',
      label: 'The decision-rights gap Ava caught in APX-01',
      body: 'Marcus Chen (COO) owned the markdown calendar — but he wasn\'t in the APX-01 P0 scaffold. When Rachel Torres mentioned him in the P1 stakeholder chat, Ava immediately flagged the decision-rights gap: any pricing guardrail Rachel\'s team designed in P3 required Marcus\'s sign-off or it would be blocked at implementation. Making that explicit in the P1 charter meant P3 design was never blocked. This is exactly what the Charter phase is for.',
    },
    terms: [
      { name: 'Program Charter', def: 'The gate artifact for P1. Locks scope, sponsor, and decision rights. Generated by Ava from your P0 scaffold + P1 chat inputs.' },
      { name: 'RACI Matrix', def: 'Responsible / Accountable / Consulted / Informed for each workstream. Ava generates a draft from your stakeholder list — edit before sign-off.' },
      { name: 'Scope boundary', def: 'The explicit in-scope and out-of-scope for the Move. Written during P0 but formalized in the P1 Charter. APX-01 scope: Morrison private label only, 14 flagged segments. All-private-label expansion explicitly out-of-scope.' },
    ],
  },
  p2: {
    num: 'P2',
    name: 'Discover & Diagnose',
    gate: 'Diagnosis Sign-Off',
    eyebrow: 'Strategic Moves · P2',
    intro: 'Map the current state, identify root causes, and build a structured problem statement.',
    goal: 'Map the current state, identify root causes, and build a structured problem statement. This phase includes a critical Continue / Discontinue decision — if diagnosis reveals a fundamental blocker (wrong scope, wrong sponsor, non-viable economics), you record it here and can formally discontinue the Move rather than letting it stall.',
    chatExample: '"Ava, I\'m uploading the Morrison pricing override log. 47% of AI-suggested prices were overridden by GMs last quarter." → Ava: "That\'s the highest override rate in the substrate — third quartile for this peer cohort. I see three clusters: GMs overriding seasonal SKUs even when the model predicted correctly (trust failure), no reason codes so we can\'t distinguish good overrides from noise (transparency failure), and the Home category GM had a 71% override rate — structurally different from other GMs (behavior outlier). The root cause isn\'t model accuracy — it\'s trust and transparency. Building that into the design recommendation."',
    deliverables: [
      { label: '📊 Current State Assessment', isGate: true },
      { label: '🔍 Root Cause Analysis' },
      { label: '📌 Problem Statement' },
      { label: '⚠️ Risk Register' },
    ],
    criteria: [
      { text: 'As-is process documented with data evidence', hard: true },
      { text: 'Root causes validated, not just symptoms', hard: true },
      { text: 'Continue/Discontinue decision recorded', hard: false },
      { text: 'Risk register populated', hard: false },
    ],
    callout: {
      kind: 'warn',
      icon: '⚠️',
      label: 'The Continue/Discontinue decision',
      body: 'P2 is the last low-cost exit point. If discovery reveals the economics don\'t work, the scope was wrong, or there\'s no sponsor alignment — record a Discontinue decision with rationale. A formally discontinued Move is better than a stalled one. APX-01 confirmed Continue — but APX-04 (CDP/Loyalty) recorded a Partial Continue with a scope reduction after P2 revealed the data integration complexity was 3x the original estimate.',
    },
    terms: [
      { name: 'Current State Assessment', def: 'The P2 gate artifact. Documents the as-is process with data evidence. Must be signed off before advancing.' },
      { name: 'Root cause', def: 'The underlying driver of a problem — not the symptom. "47% override rate" is a symptom. "No reason codes, so planners can\'t distinguish good overrides from noise" is a root cause. Ava will push back if you only document symptoms.' },
      { name: 'Continue / Discontinue', def: 'The formal binary decision at P2. Continue = commit to P3. Discontinue = formally close the Move with documented rationale. Discontinue is not failure — it\'s discipline.' },
    ],
  },
  p3: {
    num: 'P3',
    name: 'Design Future State',
    gate: 'Design Approval',
    eyebrow: 'Strategic Moves · P3',
    intro: 'Define the target state architecture and operating model. Address each root cause from P2 with a specific design decision.',
    goal: 'Define the target state architecture and operating model. Address each root cause from P2 with a specific design decision. Define the sourcing strategy — build, buy, or partner — and complete solution design for all in-scope components. Every design decision should trace back to a P2 root cause.',
    chatExample: '"The solution needs guardrail logic so the model can only suggest within an approved price range, mandatory reason codes so GMs must explain overrides, and a weekly model retrain from actual sell-through. Ava, add the retrain cadence to the architecture." → Ava: "Added. On sourcing: your substrate already has the Oracle POS + Workday data pipeline. This is Build not Buy — your data science team can implement with the existing connector outputs. Estimated build effort: 6–8 weeks. Want me to add that to the Sourcing Strategy with the Foundation Readiness note from origination — the \'no in-house ML\' flag in P0 no longer applies given the substrate pipeline?"',
    deliverables: [
      { label: '🏗️ Target State Architecture', isGate: true },
      { label: '🎨 Solution Design' },
      { label: '⚙️ Operating Model Design' },
      { label: '🤝 Sourcing Strategy' },
    ],
    criteria: [
      { text: 'Each P2 root cause addressed in design', hard: true },
      { text: 'Sourcing decision documented with rationale', hard: true },
      { text: 'Architecture reviewed with technical stakeholders', hard: false },
      { text: 'Operating model changes identified', hard: false },
    ],
    callout: {
      kind: 'info',
      icon: '💡',
      label: 'APX-01: Build not Buy — and why it mattered',
      body: 'The P0 Foundation Readiness for APX-01 flagged "no in-house ML" as a concern. By P3, the assessment had changed: four connectors in the substrate meant James Wright\'s data science team had everything they needed without an external vendor. The Sourcing Strategy documented the revision with rationale. That single Build decision saved $680K vs. the nearest vendor quote — and it only became obvious after the substrate was fully wired.',
    },
    terms: [
      { name: 'Target State Architecture', def: 'The P3 gate artifact. Describes the to-be technical and operational state. Must address each P2 root cause explicitly. For APX-01: guardrail engine, reason code schema, weekly retrain pipeline.' },
      { name: 'Sourcing Strategy', def: 'Build / Buy / Partner decision for each major component, with rationale. Feeds directly into P4 Financial Model cost assumptions.' },
      { name: 'Operating Model', def: 'How the organization works differently after the Move. For APX-01: GMs now select reason codes on every override. The reason code data feeds the weekly retrain. That\'s a process change, not just a technical one.' },
    ],
  },
  p4: {
    num: 'P4',
    name: 'Roadmap & Business Case',
    gate: 'Investment Approval',
    eyebrow: 'Strategic Moves · P4',
    intro: 'Translate the P3 design into an execution roadmap and build the business case economics.',
    goal: 'Translate the P3 design into an execution roadmap and build the business case economics. The P4 gate is the investment approval gate — the highest-stakes gate. It requires a sponsor-signed business case, a milestoned roadmap with named owners, and a financial model before any implementation begins.',
    chatExample: '"Ava, update the financial model — the reason code UX design adds $120K to the estimate. Lisa Park needs the business case by Thursday." → Ava: "Updated. New investment total: $1.8M ($120K over original estimate). Annual value: $8.1M — unchanged. Payback: 2.7 months (was 2.4). IRR: 312%. The $120K doesn\'t change the investment decision materially — payback is still under a quarter. I\'m adding an executive summary note explaining the revision. The board presentation uses the new number. Want me to flag the change in Lisa\'s sponsor briefing so she\'s not surprised?"',
    deliverables: [
      { label: '🗺️ Execution Roadmap', isGate: true },
      { label: '💼 Business Case', isGate: true },
      { label: '📈 Financial Model', tag: 'EXCEL' },
      { label: '📡 Tower Metrics Plan' },
    ],
    criteria: [
      { text: 'Financial model with 3-year projection', hard: true },
      { text: 'Roadmap with milestones & owners', hard: true },
      { text: 'Executive sponsor sign-off on business case', hard: true },
      { text: 'Tower metrics defined & agreed', hard: false },
    ],
    callout: {
      kind: 'info',
      icon: '💡',
      label: 'APX-01 value model: three levers, $8.1M',
      body: 'The APX-01 Financial Model built value on three independent levers: markdown reduction ($4.2M/yr from better GM rate), mix improvement from tighter promo sizing ($2.6M/yr), and inventory efficiency from SKU rationalization ($1.3M/yr). Total: $8.1M annual. Investment: $1.8M. Payback: 2.7 months. Lisa Park signed off Thursday, week 13. The three-lever structure meant the business case survived scrutiny — each lever was independently traceable to P2 root causes and P3 design decisions.',
    },
    terms: [
      { name: 'Business Case', def: 'The P4 gate artifact. Summarizes investment rationale, expected returns, risks, and the Financial Model. Must be signed off by the executive sponsor.' },
      { name: 'Financial Model', def: 'A 5-sheet Excel workbook: Assumptions / 3-year P&L / NPV+IRR / Sensitivity / Payback. Generated by Ava from your P0 value hypothesis and P3 sourcing costs — updated with actuals before gating out.' },
      { name: 'Tower Metrics Plan', def: 'The KPIs and measurement approach Ava will track in Control Tower after P5 handoff, drawing on her portfolio-monitoring expertise. For APX-01: Morrison GM rate, pricing override rate, and SKU count. Defined in P4 so Tower is ready from day one.' },
    ],
  },
  p5: {
    num: 'P5',
    name: 'Mobilize & Handoff',
    gate: 'Tower Acceptance',
    eyebrow: 'Strategic Moves · P5',
    intro: 'Assemble the delivery team and RACI. Build the handoff package. Verify execution readiness. Secure Tower acceptance.',
    goal: 'Assemble the delivery team and RACI. Build the handoff package. Verify execution readiness. Secure Tower acceptance. Gating out of P5 closes the Move and transitions it to Control Tower — where Ava keeps watching, drawing on her portfolio-monitoring expertise to track execution progress, KPIs, and ongoing signal health.',
    chatExample: '"Ava, generate the handoff package. Karina Shah is PM, Dev Patel is tech lead. Include the charter, roadmap, business case, and the risk register from P2." → Ava: "Package assembled. Two items need owner assignment before Tower acceptance: Risk 1 — Legacy Oracle POS integration complexity (flagged in P2, still open). Risk 2 — GM change management for reason code adoption (new risk, higher than original estimate). I\'d recommend Dev Patel owns Risk 1, Karina Shah owns Risk 2. Should I pre-fill the risk owners and generate the updated risk register for the handoff?"',
    deliverables: [
      { label: '🚀 Handoff Package', isGate: true },
      { label: '✅ Readiness Assessment' },
    ],
    criteria: [
      { text: 'Delivery team assembled with named PM', hard: true },
      { text: 'Handoff package generated & complete', hard: true },
      { text: 'Tower acceptance confirmed', hard: true },
      { text: 'All open risks have named owners', hard: true },
    ],
    callout: {
      kind: 'success',
      icon: '→',
      label: 'After P5: Ava keeps watching APX-01 in Tower',
      body: 'The Move transitioned to Tower end of week 14. Ava — drawing on her portfolio-monitoring expertise — began tracking: Morrison GM rate (target 36.0%, current 34.2%), override rate (target <25%, current 47%), and SKU count rationalization. The first Tower pressure card appeared 3 weeks after P5 close: Home category override rate still 71% — Karina Shah\'s change management risk was materializing. Ava surfaced it. The program team acted before the board asked.',
    },
    terms: [
      { name: 'Handoff Package', def: 'The P5 gate artifact. A compiled bundle of all key deliverables from P1–P4 plus the delivery team RACI, risk register, and readiness assessment. Ava uses this as the Tower intake record.' },
      { name: 'Readiness Assessment', def: 'A pre-launch checklist: team assembled, risks owned, metrics defined, exec briefed. Generated by Ava — review and sign off before submitting for Tower acceptance.' },
      { name: 'Tower acceptance', def: 'The confirmation from the Control Tower view that the handoff is received and the Move is ready to transition into monitoring. A hard gate criterion — the program can\'t close without it.' },
    ],
    color: 'teal' as const,
  },
};

export function PhaseSection({ phase }: { phase: string }) {
  const def = PHASES[phase];
  if (!def) return null;

  return (
    <>
      <Section>
        <Eyebrow>{def.eyebrow}</Eyebrow>
        <SectionTitle>{def.num} — {def.name}</SectionTitle>
        <Lead>{def.intro}</Lead>

        <PhaseCard
          num={def.num}
          name={def.name}
          gate={def.gate}
          goal={def.goal}
          chatExample={def.chatExample}
          deliverables={def.deliverables}
          criteria={def.criteria}
          color={def.color ?? 'navy'}
        />

        <Callout kind={def.callout.kind} icon={def.callout.icon} label={def.callout.label}>
          {def.callout.body}
        </Callout>
      </Section>

      {def.terms.length > 0 && (
        <Section>
          <Eyebrow>{def.eyebrow} · Key Terms</Eyebrow>
          <SectionTitle>Key terms — {def.name}</SectionTitle>
          <TermGrid>
            {def.terms.map((t) => (
              <Term key={t.name} name={t.name}>
                {t.def}
              </Term>
            ))}
          </TermGrid>
        </Section>
      )}
    </>
  );
}
