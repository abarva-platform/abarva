'use client';
/**
 * Moves Quick Reference Card
 * Printable single-page summary of P0–P5 phases, gate criteria, and key terms.
 * Accessible at /home/learn/moves-reference
 */
import {
  Section,
  Eyebrow,
  SectionTitle,
  Lead,
  Callout,
  TermGrid,
  Term,
  T,
} from './primitives';

// ─── Phase data ───────────────────────────────────────────────────────────

const PHASE_ROWS = [
  {
    id: 'P0',
    name: 'Originate',
    goal: 'Turn a signal into a structured hypothesis with sponsor candidate',
    gateArtifact: 'Origination Scaffold',
    hardCriteria: [
      'Falsifiable hypothesis',
      'Archetype classified',
      'Sponsor candidate (human-confirmed)',
      'Value hypothesis (UNVALIDATED)',
      'Scope boundary (human deliberated)',
    ],
    deliverables: ['Origination Scaffold', 'Move Record'],
    color: '#374151',
  },
  {
    id: 'P1',
    name: 'Charter',
    goal: 'Sponsor committed, charter signed, value range locked',
    gateArtifact: 'Program Charter',
    hardCriteria: [
      'Sponsor committed (document or confirmed)',
      'Primary success metric defined',
      'Value range (low–high with assumptions, PRELIMINARY)',
      'Scope boundary confirmed',
      'Stakeholder map with decision rights',
    ],
    deliverables: ['Program Charter', 'Stakeholder Map', 'Baseline Timeline', 'RACI Matrix'],
    color: T.navy,
  },
  {
    id: 'P2',
    name: 'Discover & Diagnose',
    goal: 'Root causes validated, Continue/Discontinue decision recorded',
    gateArtifact: 'Current State Assessment',
    hardCriteria: [
      'As-is process documented with data evidence',
      'Root causes validated (not symptoms)',
      'Continue/Discontinue decision recorded',
      'Risk register populated',
    ],
    deliverables: ['Current State Assessment', 'Root Cause Analysis', 'Problem Statement', 'Risk Register'],
    color: T.navy,
  },
  {
    id: 'P3',
    name: 'Design Future State',
    goal: 'Each root cause addressed; sourcing decision documented',
    gateArtifact: 'Target State Architecture',
    hardCriteria: [
      'Each P2 root cause addressed in design',
      'Sourcing decision (build/buy/partner) with rationale',
      'Architecture reviewed with technical stakeholders',
      'Operating model changes identified',
    ],
    deliverables: ['Target State Architecture', 'Solution Design', 'Operating Model Design', 'Sourcing Strategy'],
    color: T.navy,
  },
  {
    id: 'P4',
    name: 'Roadmap & Business Case',
    goal: 'Investment-approved: signed business case, milestoned roadmap',
    gateArtifact: 'Business Case + Roadmap',
    hardCriteria: [
      'Financial model with 3-year projection',
      'Roadmap with milestones and owners',
      'Executive sponsor sign-off on business case',
      'Tower metrics defined and agreed',
    ],
    deliverables: ['Execution Roadmap', 'Business Case', 'Financial Model (Excel)', 'Tower Metrics Plan'],
    color: T.navy,
  },
  {
    id: 'P5',
    name: 'Mobilize & Handoff',
    goal: 'Delivery team assembled, handoff package complete, Tower accepted',
    gateArtifact: 'Handoff Package',
    hardCriteria: [
      'Delivery team assembled with named PM',
      'Handoff package generated and complete',
      'Tower acceptance confirmed',
      'All deliverables reviewed by sponsor',
    ],
    deliverables: ['Handoff Package', 'Readiness Assessment'],
    color: T.teal,
  },
];

// ─── Component ────────────────────────────────────────────────────────────

export function MovesReferenceCard() {
  return (
    <>
      {/* Header */}
      <Section>
        <Eyebrow>Quick Reference</Eyebrow>
        <SectionTitle>Strategic Moves reference card</SectionTitle>
        <Lead>
          Everything you need in a single view — all six phases, their gate criteria, and key deliverables. Use this as a checklist when running a Move.
        </Lead>
      </Section>

      {/* Phase table */}
      <Section>
        <Eyebrow>Six phases</Eyebrow>
        <SectionTitle>P0 → P5 at a glance</SectionTitle>
        <Lead>
          Every Move follows the same path. Hard criteria must be met before advancing. Soft criteria appear as advisory warnings.
        </Lead>

        <div style={{ overflowX: 'auto', margin: '24px 0' }}>
          {/* Compact phase cards */}
          {PHASE_ROWS.map((phase) => (
            <div
              key={phase.id}
              style={{
                border: `1px solid ${T.border}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 12,
              }}
            >
              {/* Phase header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 18px',
                  background: phase.color,
                  flexWrap: 'wrap',
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#fff',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {phase.id}
                </span>
                <span
                  style={{
                    fontFamily: T.fDisp,
                    fontSize: 16,
                    fontWeight: 400,
                    color: '#fff',
                  }}
                >
                  {phase.name}
                </span>
                <span
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.8)',
                    marginLeft: 4,
                  }}
                >
                  — {phase.goal}
                </span>
                <span
                  style={{
                    marginLeft: 'auto',
                    fontFamily: T.fMono,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: 4,
                    padding: '3px 8px',
                    flexShrink: 0,
                  }}
                >
                  Gate: {phase.gateArtifact}
                </span>
              </div>

              {/* Phase body */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  borderTop: 'none',
                }}
              >
                {/* Hard criteria */}
                <div
                  style={{
                    padding: '14px 18px',
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
                    Gate criteria (Hard)
                  </div>
                  <ul style={{ margin: 0, padding: '0 0 0 14px' }}>
                    {phase.hardCriteria.map((c) => (
                      <li
                        key={c}
                        style={{
                          fontFamily: T.fBody,
                          fontSize: 12,
                          color: T.body,
                          lineHeight: 1.55,
                          marginBottom: 4,
                        }}
                      >
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Deliverables */}
                <div style={{ padding: '14px 18px' }}>
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
                    Deliverables generated
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {phase.deliverables.map((d, i) => (
                      <span
                        key={d}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          fontFamily: T.fBody,
                          fontSize: 12,
                          color: T.body,
                        }}
                      >
                        {/* Gate marker on first item */}
                        {i === 0 && (
                          <span
                            style={{
                              fontFamily: T.fMono,
                              fontSize: 8,
                              fontWeight: 700,
                              letterSpacing: '0.06em',
                              color: '#fff',
                              background: T.teal,
                              borderRadius: 3,
                              padding: '2px 5px',
                            }}
                          >
                            GATE
                          </span>
                        )}
                        {d}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Value label progression */}
      <Section>
        <Eyebrow>Value tracking</Eyebrow>
        <SectionTitle>How value labels evolve</SectionTitle>
        <Lead>
          The value figure you start with in P0 is labeled UNVALIDATED. It upgrades as evidence comes in. The label tells you how much to trust the number.
        </Lead>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0,
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            margin: '20px 0',
          }}
        >
          {[
            { phase: 'P0', label: 'UNVALIDATED HYPOTHESIS', bg: '#4B5563', desc: 'From initial signal. No baseline data. Order-of-magnitude only.' },
            { phase: 'P1', label: 'PRELIMINARY ESTIMATE', bg: T.navy, desc: 'Range with stated assumptions. Sponsor has reviewed.' },
            { phase: 'P2', label: 'EVIDENCE-GROUNDED ESTIMATE', bg: T.navy, desc: 'Validated against baseline data. Root causes quantified.' },
            { phase: 'P3–4', label: 'INVESTMENT CASE', bg: T.navy, desc: 'Full financial model. Sponsor-signed. Investment decision quality.' },
            { phase: 'P5+', label: 'COMMITTED PLAN', bg: T.teal, desc: 'Delivery team named. Tower tracking live actuals vs. projection.' },
          ].map((step, i) => (
            <div
              key={step.phase}
              style={{
                flex: '1 1 180px',
                borderRight: i < 4 ? `1px solid ${T.borderLt}` : 'none',
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
              }}
            >
              <div
                style={{
                  background: step.bg,
                  padding: '10px 14px',
                  fontFamily: T.fMono,
                  fontSize: 8,
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: '#fff',
                }}
              >
                {step.phase}
              </div>
              <div
                style={{
                  padding: '12px 14px',
                  background: T.surface,
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  borderBottom: `1px solid ${T.borderLt}`,
                }}
              >
                <span
                  style={{
                    fontFamily: T.fMono,
                    fontSize: 8,
                    fontWeight: 700,
                    letterSpacing: '0.07em',
                    color: step.bg,
                    lineHeight: 1.4,
                  }}
                >
                  {step.label}
                </span>
                <span
                  style={{
                    fontFamily: T.fBody,
                    fontSize: 11,
                    color: T.muted,
                    lineHeight: 1.5,
                  }}
                >
                  {step.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Key terms quick reference */}
      <Section>
        <Eyebrow>Key terms</Eyebrow>
        <SectionTitle>Terms to know</SectionTitle>

        <TermGrid>
          <Term name="Strategic Move">
            A phase-gated transformation program on the AbarVa platform. Moves run P0 → P5 and hand off to Control Tower at P5.
          </Term>
          <Term name="Archetype">
            The category of the Move: <em>Cost Reduction, Revenue Growth, Risk Mitigation,</em> or <em>Operational Excellence.</em> Classified in P0, confirmed by the user.
          </Term>
          <Term name="Scaffold">
            The 7-field structure Nexus fills during P0. Fields 1–4 are required (gate-blocking). Feeds every downstream document.
          </Term>
          <Term name="Hard criterion">
            A blocking gate requirement. The Advance button stays locked until satisfied. Examples: named sponsor, signed charter, scope boundary.
          </Term>
          <Term name="Soft criterion">
            Advisory gate requirement. Gate can clear even if open — appears as a warning in the gate view and audit trail.
          </Term>
          <Term name="Gate artifact">
            The document that must reach "Signed Off" status before a gate can clear. One per phase. Blue border in the Evidence Hub.
          </Term>
          <Term name="Continue / Discontinue">
            The formal binary decision at P2. Discontinue = formally close the Move with documented rationale. Not a failure — a discipline.
          </Term>
          <Term name="Sourcing decision">
            Build / Buy / Partner. Made in P3 with explicit rationale against Foundation Readiness from P0. Drives P4 financial model.
          </Term>
          <Term name="Tower acceptance">
            The P5 gate confirmation that Control Tower has received the handoff. A hard gate — cannot be waived. Atlas picks up the Move after acceptance.
          </Term>
          <Term name="Evidence Hub">
            The document store for a Move: generated deliverables, uploads, and status history. Access at <code style={{ fontFamily: T.fMono, fontSize: 11, color: T.navy }}>/strategic-moves/{'{id}'}/evidence</code>
          </Term>
        </TermGrid>
      </Section>

      {/* Navigation map */}
      <Section>
        <Eyebrow>Navigation</Eyebrow>
        <SectionTitle>Where to find things</SectionTitle>

        <div
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 10,
            overflow: 'hidden',
            margin: '20px 0',
          }}
        >
          {[
            { label: 'All Strategic Moves', path: '/strategic-moves' },
            { label: 'Start a new Move', path: '/strategic-moves/new' },
            { label: 'Phase workspace', path: '/strategic-moves/{id}/phase/{0–5}' },
            { label: 'Evidence Hub', path: '/strategic-moves/{id}/evidence' },
            { label: 'Generate deliverables', path: '/strategic-moves/{id}/phase/{n} → Generate tab' },
            { label: 'Portfolio overview', path: '/tower' },
            { label: 'Intelligence signals', path: '/intelligence' },
          ].map((item, i) => (
            <div
              key={item.path}
              style={{
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                borderBottom: i < 6 ? `1px solid ${T.borderLt}` : 'none',
                padding: '10px 16px',
                background: i % 2 === 0 ? T.surface : T.surface2,
                alignItems: 'center',
              }}
            >
              <div style={{ fontFamily: T.fBody, fontSize: 13, color: T.body, fontWeight: 500 }}>
                {item.label}
              </div>
              <code
                style={{
                  fontFamily: T.fMono,
                  fontSize: 12,
                  color: T.navy,
                  background: T.navySoft,
                  border: `1px solid ${T.navyLine}`,
                  borderRadius: 4,
                  padding: '3px 8px',
                  display: 'inline-block',
                }}
              >
                {item.path}
              </code>
            </div>
          ))}
        </div>

        <Callout kind="info" icon="📚" label="Full training guide">
          This is the quick reference card. For the full training guide — including a step-by-step walkthrough of your first Move and the complete phase sections — use the left navigation in this guide.
        </Callout>
      </Section>
    </>
  );
}
