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
  TipGrid,
  Tip,
  T,
} from './primitives';

// ─── What Nexus owns vs. what requires you ─────────────────────────────────

const OWNERSHIP_ROWS: Array<{ task: string; nexus: 'auto' | 'draft' | 'no'; you: 'confirm' | 'direct' | 'both' }> = [
  { task: 'Extract a hypothesis from your description', nexus: 'auto', you: 'confirm' },
  { task: 'Classify the Move archetype', nexus: 'auto', you: 'confirm' },
  { task: 'Propose a sponsor candidate', nexus: 'draft', you: 'confirm' },
  { task: 'Define the scope boundary', nexus: 'no', you: 'direct' },
  { task: 'Seed the value hypothesis', nexus: 'draft', you: 'confirm' },
  { task: 'Draft the charter', nexus: 'auto', you: 'confirm' },
  { task: 'Engage sponsor on scope and charter (P1)', nexus: 'draft', you: 'confirm' },
  { task: 'Formal investment sign-off — cost, solution, timeline (P4)', nexus: 'no', you: 'direct' },
  { task: 'Lock the value range', nexus: 'no', you: 'direct' },
  { task: 'Assign stakeholder decision rights', nexus: 'draft', you: 'confirm' },
  { task: 'Conduct interviews / collect data', nexus: 'no', you: 'direct' },
  { task: 'Document the current-state assessment', nexus: 'auto', you: 'confirm' },
  { task: 'Validate root causes', nexus: 'draft', you: 'confirm' },
  { task: 'Make build/buy/partner decision', nexus: 'no', you: 'direct' },
  { task: 'Draft the target-state architecture', nexus: 'draft', you: 'confirm' },
  { task: 'Build the financial model', nexus: 'auto', you: 'confirm' },
  { task: 'Get executive sign-off', nexus: 'no', you: 'direct' },
  { task: 'Approve any gate', nexus: 'no', you: 'direct' },
  { task: 'Compile the handoff package', nexus: 'auto', you: 'confirm' },
];

const NEXUS_LABEL: Record<'auto' | 'draft' | 'no', { text: string; bg: string; color: string }> = {
  auto:  { text: 'Nexus auto-drafts', bg: T.tealSoft,   color: T.teal },
  draft: { text: 'Nexus proposes',    bg: T.navySoft,   color: T.navy },
  no:    { text: '—',                 bg: 'transparent', color: T.faint },
};
const YOU_LABEL: Record<'confirm' | 'direct' | 'both', { text: string }> = {
  confirm: { text: 'Review & confirm' },
  direct:  { text: 'You drive' },
  both:    { text: 'Both' },
};

// ─── Prompt patterns ──────────────────────────────────────────────────────

const GOOD_PROMPTS = [
  {
    text: 'Give Nexus outcomes, not solutions',
    example: '"We want to cut contact center handle time by 30%" — not "We need a call routing AI."',
  },
  {
    text: 'Say what triggered the initiative',
    example: '"After the CEO saw the AHT benchmark last quarter" gives Nexus context for urgency and framing.',
  },
  {
    text: 'Name the sponsor explicitly',
    example: '"The COO asked us to own this" — Nexus records who committed before it can advance.',
  },
  {
    text: 'State scope explicitly — in and out',
    example: '"In scope: inbound routing only. Out of scope: outbound and email" — Nexus cannot infer scope.',
  },
  {
    text: 'Correct Nexus when it\'s wrong',
    example: '"That archetype is wrong — this is revenue growth, not cost reduction" — Nexus accepts overrides immediately.',
  },
  {
    text: 'Push back on vague outputs',
    example: '"The value hypothesis is too vague. Give me a low and high end with the assumptions behind them."',
  },
];

const BAD_PROMPTS = [
  {
    text: 'Start with vendor names',
    example: '"We want to deploy Salesforce Einstein for the contact center" — name the problem first; vendor comes in P3.',
  },
  {
    text: 'Give Nexus a list of problems',
    example: '"We have issues with AHT, routing, billing, and staffing" — Nexus will ask you to pick one primary outcome first.',
  },
  {
    text: 'Skip the sponsor',
    example: '"We\'ll figure out the sponsor later" — Nexus will block gate advancement until a candidate is named.',
  },
  {
    text: 'State value as a point estimate',
    example: '"This is a $4M opportunity" — Nexus will record it but will ask for low/high/assumptions.',
  },
  {
    text: 'Ask Nexus to approve a gate',
    example: '"Go ahead and approve the gate" — Nexus cannot approve gates. All gate approvals are human actions.',
  },
  {
    text: 'Expect Nexus to know your org chart',
    example: '"Who should sponsor this?" — Nexus can suggest based on role/function patterns; you confirm the actual name.',
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function NexusGuideSection() {
  return (
    <>
      {/* Hero */}
      <HeroBand color="navy">
        <Eyebrow light>Nexus · Agent Guide</Eyebrow>
        <SectionTitle light size="xl">Working with Nexus</SectionTitle>
        <Lead light>
          Nexus is the AI agent behind Strategic Moves. It helps you structure programs, draft documents, and navigate phase gates — but it doesn't replace your judgment on the decisions that count.
        </Lead>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          {['Surface: Strategic Moves', 'Audience: All users', 'Time: ~15 min'].map((tag) => (
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

      {/* What Nexus is */}
      <Section>
        <Eyebrow>Nexus · 01</Eyebrow>
        <SectionTitle>What Nexus is — and isn't</SectionTitle>
        <Lead>
          Nexus is a structured conversation partner, document drafter, and gate evaluator. It's not a search engine, a decision-maker, or an approval mechanism.
        </Lead>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 16,
            margin: '24px 0',
          }}
        >
          {[
            { icon: '✓', title: 'What Nexus does', color: T.teal, bg: T.tealSoft, line: T.tealLine, items: [
              'Extracts structured fields from natural language',
              'Classifies Move archetype from your description',
              'Drafts program documents (charter, CSA, architecture)',
              'Tracks gate criteria and flags what is blocking',
              'Generates deliverables (Word, Excel)',
              'Surfaces relevant patterns from your tenant data',
              'Warns you when a claim looks unvalidated',
            ]},
            { icon: '✗', title: 'What Nexus doesn\'t do', color: T.amber, bg: T.amberSoft, line: T.amberLine, items: [
              'Approve gates (all gate approvals are human actions)',
              'Commit a sponsor on your behalf',
              'State value figures as validated projections',
              'Define scope without human deliberation',
              'Conduct interviews or collect primary data',
              'Make build/buy/partner decisions',
              'Access information outside your tenant\'s data room',
            ]},
          ].map((col) => (
            <div
              key={col.title}
              style={{
                border: `1px solid ${col.line}`,
                background: col.bg,
                borderRadius: 10,
                padding: '20px 20px 20px',
              }}
            >
              <div
                style={{
                  fontFamily: T.fMono,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: col.color,
                  marginBottom: 14,
                }}
              >
                {col.icon} {col.title}
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                {col.items.map((item) => (
                  <li
                    key={item}
                    style={{
                      fontFamily: T.fBody,
                      fontSize: 13,
                      color: T.body,
                      lineHeight: 1.6,
                      marginBottom: 6,
                    }}
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Callout kind="info" icon="💬" label="The human-in-the-loop principle">
          Nexus drafts, proposes, and flags — but decisions with real business consequences (sponsor commitment, scope, value range, gate approval) always require a human to explicitly confirm. If Nexus ever seems to be making a decision it shouldn't, correct it directly.
        </Callout>
      </Section>

      {/* Ownership table */}
      <Section>
        <Eyebrow>Nexus · 02</Eyebrow>
        <SectionTitle>Who owns what</SectionTitle>
        <Lead>
          A practical breakdown of every major task in a Move — whether Nexus handles it automatically, proposes a draft for you to confirm, or whether it's purely your call.
        </Lead>

        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            margin: '24px 0',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 180px 180px',
              background: T.surface2,
              borderBottom: `1px solid ${T.border}`,
              padding: '10px 16px',
            }}
          >
            {['Task', 'Nexus', 'You'].map((h) => (
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
          {OWNERSHIP_ROWS.map((row, i) => {
            const n = NEXUS_LABEL[row.nexus];
            const y = YOU_LABEL[row.you];
            return (
              <div
                key={row.task}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 180px 180px',
                  borderBottom: i < OWNERSHIP_ROWS.length - 1 ? `1px solid ${T.borderLt}` : 'none',
                  padding: '10px 16px',
                  background: i % 2 === 0 ? T.surface : T.surface2,
                }}
              >
                <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.5 }}>
                  {row.task}
                </div>
                <div>
                  {row.nexus !== 'no' && (
                    <span
                      style={{
                        display: 'inline-block',
                        fontFamily: T.fMono,
                        fontSize: 9,
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: n.color,
                        background: n.bg,
                        border: `1px solid ${row.nexus === 'auto' ? T.tealLine : T.navyLine}`,
                        borderRadius: 4,
                        padding: '3px 8px',
                      }}
                    >
                      {n.text}
                    </span>
                  )}
                  {row.nexus === 'no' && (
                    <span style={{ fontFamily: T.fMono, fontSize: 11, color: T.faint }}>—</span>
                  )}
                </div>
                <div style={{ fontFamily: T.fBody, fontSize: 12, color: row.you === 'direct' ? T.navy : T.muted, fontWeight: row.you === 'direct' ? 600 : 400 }}>
                  {y.text}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* How to talk to Nexus */}
      <Section>
        <Eyebrow>Nexus · 03</Eyebrow>
        <SectionTitle>How to get the best out of Nexus</SectionTitle>
        <Lead>
          Nexus responds to what you give it. Precise inputs produce precise outputs. Vague inputs produce draft outputs that need more revision.
        </Lead>

        <TipGrid>
          {GOOD_PROMPTS.map((p) => (
            <Tip key={p.text} kind="do" text={p.text} example={p.example} />
          ))}
        </TipGrid>

        <SubHead>What to avoid</SubHead>
        <TipGrid>
          {BAD_PROMPTS.map((p) => (
            <Tip key={p.text} kind="dont" text={p.text} example={p.example} />
          ))}
        </TipGrid>
      </Section>

      {/* Nexus posture per phase */}
      <Section>
        <Eyebrow>Nexus · 04</Eyebrow>
        <SectionTitle>How Nexus behaves in each phase</SectionTitle>
        <Lead>
          Nexus shifts posture as the Move advances. Early phases are exploratory and extractive. Later phases are more exacting — Nexus will push back on incomplete inputs.
        </Lead>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, margin: '24px 0' }}>
          {[
            {
              phase: 'P0',
              name: 'Originate',
              color: '#4B5563',
              posture: 'Receptive & extractive',
              behavior: 'Meets you where you are. Accepts rough input — a CEO note, an email thread, a typed description. Its job is to extract structure from ambiguity. It will not block on imperfect input; it will ask clarifying questions and draft fields as you talk.',
            },
            {
              phase: 'P1',
              name: 'Charter',
              color: T.navy,
              posture: 'Engagement-focused',
              behavior: 'P1 is about engaging the named sponsor — not extracting a financial commitment. Nexus will ask whether the sponsor has been briefed and is aligned, draft the charter from your inputs, and flag scope or governance gaps. It will not ask whether they have approved cost or timeline — that is P4. The P1 gate clears when the sponsor has engaged on scope and the charter is signed off.',
            },
            {
              phase: 'P2',
              name: 'Discover & Diagnose',
              color: T.navy,
              posture: 'Rigorous & evidence-grounded',
              behavior: 'P2 is where the quality of your data determines the quality of the diagnosis. Upload what you have — call logs, operational data, org charts. Nexus will flag thin data coverage explicitly. It will not soften a Continue/Discontinue decision if the evidence points one way.',
            },
            {
              phase: 'P3',
              name: 'Design Future State',
              color: T.navy,
              posture: 'Structured & trace-focused',
              behavior: 'Every design decision must trace back to a P2 root cause. Nexus will flag a design element that lacks this trace. It will not auto-select build/buy/partner — that decision requires your rationale and the Foundation Readiness assessment from P0.',
            },
            {
              phase: 'P4',
              name: 'Roadmap & Business Case',
              color: T.navy,
              posture: 'Financial precision',
              behavior: 'Nexus builds the financial model from your P0 value hypothesis seed and P3 sourcing costs. Every cell that flows from an assumption is labeled. When you update an input, it recalculates automatically and flags which gate criteria are now met or at risk.',
            },
            {
              phase: 'P5',
              name: 'Mobilize & Handoff',
              color: T.teal,
              posture: 'Completion-focused',
              behavior: 'Nexus compiles the handoff package from every prior phase. It flags open risks that still need an owner. Tower acceptance is a hard gate — it cannot be waived. Once confirmed, the Move closes and Atlas picks it up in Control Tower.',
            },
          ].map((item) => (
            <div
              key={item.phase}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  background: T.surface2,
                  borderBottom: `1px solid ${T.border}`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.08em',
                    color: '#fff',
                    background: item.color,
                    borderRadius: 4,
                    padding: '3px 8px',
                  }}
                >
                  {item.phase}
                </span>
                <span style={{ fontFamily: T.fBody, fontSize: 14, fontWeight: 700, color: T.ink }}>
                  {item.name}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: T.fMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: T.faint,
                  }}
                >
                  {item.posture}
                </span>
              </div>
              <div style={{ padding: '14px 18px', fontFamily: T.fBody, fontSize: 13, color: T.body, lineHeight: 1.65 }}>
                {item.behavior}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Key limits */}
      <Section>
        <Eyebrow>Nexus · 05</Eyebrow>
        <SectionTitle>Key limits to know</SectionTitle>
        <Lead>
          Nexus is designed with explicit limits — not because of technical constraints, but because these are the decisions that should always be human-made.
        </Lead>

        <TermGrid>
          <Term name="Sponsor naming vs. investment approval">
            There are two distinct sponsor milestones. <strong>P0–P1:</strong> Name the sponsor candidate and engage them on scope and charter — no financial commitment yet. <strong>P4:</strong> Formal investment approval — the sponsor (and/or board) approves the business case, cost, solution, and timeline. This is the real commitment gate. Nexus will not conflate these two steps.
          </Term>
          <Term name="Gate approval">
            No gate can be approved by Nexus. Gate approvals are always human actions. This is by design: gate approval signals program-level accountability, not just document completeness.
          </Term>
          <Term name="Value figures">
            All value figures at P0–P1 are labeled <strong>UNVALIDATED HYPOTHESIS</strong> or <strong>PRELIMINARY ESTIMATE</strong>. Nexus will not state a value as validated until P2 baseline evidence supports it.
          </Term>
          <Term name="Scope definition">
            Nexus can propose scope based on your description, but the scope boundary — what is in and out — must be deliberately stated by you. Nexus cannot finalize scope from inference alone.
          </Term>
          <Term name="People data">
            Nexus only references names from your tenant's connected people data (ACL). It will not generate or infer names from general knowledge. If no people data is connected, Nexus will ask you to name stakeholders directly.
          </Term>
          <Term name="Continue/Discontinue">
            In P2, Nexus will surface the Continue/Discontinue decision explicitly. It will present the evidence — but the decision is yours to record. Nexus cannot make this call.
          </Term>
        </TermGrid>

        <Callout kind="warn" icon="⚠️" label="If Nexus gets something wrong">
          Correct it directly in chat: "That sponsor is wrong — the correct sponsor is [Name]." Nexus updates immediately. All corrections are tracked in the audit trail, which is visible in the Evidence Hub.
        </Callout>
      </Section>

      {/* Nexus output quality */}
      <Section>
        <Eyebrow>Nexus · 06</Eyebrow>
        <SectionTitle>Document quality — what to expect</SectionTitle>
        <Lead>
          Nexus-generated documents are consulting-grade starting points. The richer your inputs, the less editing the outputs need.
        </Lead>

        <BodyP>
          Documents generated in later phases (P3 Architecture, P4 Business Case, P5 Handoff Package) benefit significantly from thorough upstream work. A charter with all 11 sections complete and a fully documented stakeholder map produces a much better P2 current-state assessment than a thin charter with a placeholder scope.
        </BodyP>

        <BodyP>
          The best-quality documents come from sessions where you've had a real conversation with Nexus across multiple messages — not a single prompt asking it to generate everything at once. Think of it as working with a junior consultant: the more context you give during the session, the better the artifact.
        </BodyP>

        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            margin: '20px 0',
          }}
        >
          <div style={{ background: T.surface2, padding: '10px 16px', borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontFamily: T.fMono, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.faint }}>
              Document quality inputs
            </span>
          </div>
          {[
            ['Charter quality', 'Rich P0 scaffold + sponsor commitment evidence + detailed stakeholder map'],
            ['CSA quality', 'Uploaded data files + specific root-cause descriptions + named interview sources'],
            ['Architecture quality', 'Explicit build/buy/partner rationale + Foundation Readiness assessment from P0 + each root cause addressed'],
            ['Financial Model quality', 'P0 value hypothesis with lever identification + P3 sourcing costs + specific assumptions per cost line'],
            ['Handoff Package quality', 'All P1–P4 deliverables at "Signed Off" status + named PM and tech lead + all P2 risks assigned owners'],
          ].map(([doc, inputs], i) => (
            <div
              key={doc}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                borderBottom: i < 4 ? `1px solid ${T.borderLt}` : 'none',
                padding: '10px 16px',
                background: i % 2 === 0 ? T.surface : T.surface2,
              }}
            >
              <div style={{ fontFamily: T.fBody, fontSize: 13, fontWeight: 600, color: T.ink }}>{doc}</div>
              <div style={{ fontFamily: T.fBody, fontSize: 12, color: T.body, lineHeight: 1.5 }}>{inputs}</div>
            </div>
          ))}
        </div>

        <Callout kind="success" icon="💡" label="Regenerate freely">
          Documents can be regenerated any time. After adding new information in chat — new data, a corrected sponsor, a refined scope — regenerate the affected documents. Nexus will incorporate all updates from the session. There is no cost to regenerating a document.
        </Callout>
      </Section>
    </>
  );
}
