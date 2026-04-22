// Fix Spec v4 §1 · Platform page rebuild.
//
// Seven opinionated sections · Vendor Knowledge Layer design DNA
// applied to platform architecture instead of pattern content. Replaces
// the prior admin-metrics dashboard · those metrics move to
// /platform/admin (already the operator hub).
//
// Audience: investors + prospects · "structurally different from
// consulting and SaaS" is the rhetorical move. Each section must carry
// current 2026 knowledge + architectural opinion + specificity.

import Link from 'next/link';
import type { CSSProperties } from 'react';

export const dynamic = 'force-dynamic';

// ─── Section-level content · author-editable ──────────────────────────

type KnowledgeLayer = {
  name: string;
  scope: string;
  counters: string[];
  artifacts: string[];
  whatThisIsNot: string;
};

const KNOWLEDGE_LAYERS: KnowledgeLayer[] = [
  {
    name: 'Out-of-box Genome',
    scope: 'Cross-tenant · anonymized · AbarVa-curated',
    counters: [
      '47 promoted patterns',
      '1,247 anonymized observations',
      'F018 most-cited · 31 program contributions',
      'Growth · ~3 patterns / quarter',
    ],
    artifacts: ['Pattern library (F001-F047)', 'Intervention library (n=124 · success-rated)', 'Comparator class library · industry × function × scale'],
    whatThisIsNot:
      '"Best practices PDFs," "consulting playbooks," or "AI knowledge graph" (whatever that means). This is observed-and-validated patterns with n-counts and success rates per intervention.',
  },
  {
    name: 'Client-contributed',
    scope: 'Per-tenant · scoped · client-controlled',
    counters: [
      'Tenant uploaded data · schema-aware, source-of-record-tagged',
      'Stakeholder corpus · interviews, communications, decision artifacts',
      'Evidence Ledger · chain-of-custody enforced, sensitivity-marked',
    ],
    artifacts: ['Tenant Evidence Ledger', 'Tenant Decision Archive', 'Tenant Stakeholder Map'],
    whatThisIsNot:
      'Document repository, knowledge base, or "AI-searchable corpus." This is structured working memory that earns audit-grade trust through provenance discipline.',
  },
  {
    name: 'Emergent',
    scope: 'Cross-tenant pattern discovery · anonymized · opt-in contribution',
    counters: [
      'Pattern candidates under observation · 8',
      'Promoted to Genome this quarter · 3',
      'Anonymization-status verified items · 61',
    ],
    artifacts: ['Pattern Match Log · per-program cross-references', 'Genome Contribution Package · per-program output', 'Cross-Program Pattern Signals dashboard'],
    whatThisIsNot:
      '"Network effects" hand-waving. This is observed pattern emergence from program contribution with explicit promotion thresholds and legal sign-off on anonymization.',
  },
];

type PhaseBlock = {
  phase: string;
  entry: string;
  deliverables: string[];
  exit: string;
  cannotPass: string;
};

const PHASES: PhaseBlock[] = [
  {
    phase: '0 · Start',
    entry: 'Sponsor identified · scope hypothesis · executive briefing complete',
    deliverables: ['Program Charter', 'Stakeholder Map', 'Risk Register (Initial)'],
    exit: 'Sponsor sign-off on charter + named co-sponsor (if applicable) + Risk Register reviewed',
    cannotPass:
      'Programs without named decision-rights authority. Programs with stakeholder map gaps in critical-path roles. Programs where sponsor cannot articulate success criteria.',
  },
  {
    phase: '1 · Diagnose',
    entry: 'Charter approved · workstream charters · data request log seeded',
    deliverables: ['Hypothesis Tree', 'Workstream Charters', 'Data Request Log', 'Stakeholder Interview Log', 'Diagnostic Findings Document'],
    exit: 'Findings v4 adoption + Hypothesis Tree resolved + Evidence Ledger audit-grade for all material findings',
    cannotPass:
      'Findings with thin evidence basis. Hypotheses unresolved without explicit "deferred to Phase 5 candidate" classification. Findings that contradict Evidence Ledger.',
  },
  {
    phase: '2 · Design',
    entry: 'Findings adopted · option-set criteria defined',
    deliverables: ['Option Set with Tradeoffs', 'Decision Brief', 'Intervention Charter (per intervention)', 'Business Case'],
    exit: 'Sponsor decision on option · charters approved · Business Case board-committed · Outcome Baseline locked',
    cannotPass:
      'Decisions without dissent capture. Intervention charters without pilot decision gates. Business Cases without sensitivity analysis. Outcome Baselines that haven\'t passed auditor review.',
  },
  {
    phase: '3 · Execute',
    entry: 'Phase 2 gates cleared · Program Plan adopted · Operating Review Rhythm established',
    deliverables: ['Program Plan', 'Commitment Tracker', 'Operating Review Rhythm', 'Early Warning Dashboard', 'Intervention Status Reports'],
    exit: 'Pilot decision gate cleared on data (not politically pre-committed) · scale criteria met',
    cannotPass:
      'Scale decisions made without pilot evidence clearing pre-defined gate criteria. Programs where Sentinel pattern matches show second-degree+ severity unaddressed. Programs where Operating Review cadence has lapsed >2 cycles.',
  },
  {
    phase: '4 · Verify',
    entry: 'Outcome measurement window opened · attribution analysis prepped',
    deliverables: ['Outcome Baseline Report (locked)', 'Outcome Measurement Report', 'Learning Memo', 'Genome Contribution Package'],
    exit: 'Outcome economics settlement · learning captured · Genome contribution submitted',
    cannotPass:
      'Outcome claims without attribution analysis. Settlements where evidence chain-of-custody is incomplete. Programs that claim patterns "didn\'t apply" without Learning Memo accounting for Pattern Match Log entries.',
  },
];

type Agent = {
  name: string;
  role: string;
  refusals: string[];
};

const AGENTS: Agent[] = [
  {
    name: 'Nexus',
    role: 'Runs programs · drives intake, diagnosis, design, execution turns.',
    refusals: [
      'Refuses to generate intervention recommendations without an evidence basis traceable to the Evidence Ledger.',
      'Refuses to mark a workstream complete without Outcome Baseline lock and acceptance signature.',
      'Refuses to advance through a phase gate when entry criteria are unmet, regardless of stakeholder pressure.',
    ],
  },
  {
    name: 'Sentinel',
    role: 'Curates patterns · cross-program intelligence, contradiction surfacing, pattern matching.',
    refusals: [
      'Refuses to mark a pattern resolved without confirmed outcome evidence and a sustained confidence drop below threshold.',
      'Refuses to recommend an intervention without n ≥ 5 prior Genome observations of the pattern.',
      'Refuses to suppress a Contradiction Log entry on stakeholder request without an explicit accept-as-constraint or escalate-to-resolve path.',
    ],
  },
  {
    name: 'Atlas',
    role: 'Holds the tower view · cross-program orchestration, leading indicators, executive surface.',
    refusals: [
      'Refuses to allow a program to drift past a hard gate without recorded gate-decision and dissent capture.',
      'Refuses to surface a leading indicator as "green" when underlying evidence is stale beyond freshness threshold.',
      'Refuses to consolidate cross-program signals without anonymization-status verification.',
    ],
  },
  {
    name: 'Steward',
    role: 'Enforces platform discipline · evidence provenance, decision archive, access governance.',
    refusals: [
      'Refuses to register evidence in the Evidence Ledger without source-of-record citation and chain-of-custody completeness.',
      'Refuses to allow a Decision Archive entry without dissent capture and evidence-basis weighting.',
      'Refuses to promote a pattern from candidate to Genome without legal sign-off on anonymization.',
    ],
  },
];

type CompoundingAsset = {
  name: string;
  primary: string;
  secondary: string[];
  whyCompounds: string;
};

const COMPOUNDING: CompoundingAsset[] = [
  {
    name: 'Transformation Genome',
    primary: '47 promoted patterns',
    secondary: ['1,247 anonymized observations', 'F018 most-cited (31 program contributions)', 'Growth rate ~3 patterns / quarter'],
    whyCompounds:
      'Every program adds to the corpus. Every pattern match strengthens or refines a Genome entry. Patterns at n ≥ 5 promote to recommend-intervention status. The library only gets sharper.',
  },
  {
    name: 'Adaptive Strategy Intelligence',
    primary: '4 active programs',
    secondary: ['19 pattern matches today', '14 contradictions surfaced this week', '1 critical pattern at second-degree (F022 Co-Sponsor Pace Divergence)'],
    whyCompounds:
      'Cross-program signal density increases with program count. By program N, every new program inherits N-1 programs\' worth of pattern intelligence — including timing windows and intervention success rates that didn\'t exist at program 1.',
  },
  {
    name: 'Outcome Interpretability Layer',
    primary: '187 audit-grade evidence items',
    secondary: ['100% chain-of-custody completeness across active programs', '2 settlement-ready outcome reports', 'Avg 5.4 evidence artifacts per material decision'],
    whyCompounds:
      'Provenance discipline is the moat. As Evidence Ledger volume grows, so does the credibility of attribution claims at outcome settlement. This is what makes outcome-as-a-service pricing structurally defensible.',
  },
  {
    name: 'Research Publication Program',
    primary: 'Q3 2026 launch',
    secondary: [
      'First: Owned Brand Margin Recovery in Mass-Market Grocery Retail',
      'Customer co-author program seeded with 3 design partners',
      'Forthcoming: Shadow AI Surfacing Patterns in Fortune-100 Enterprise IT',
    ],
    whyCompounds:
      'Published research becomes inbound. Inbound from senior decision-makers who already trust the methodology before first contact. Customer co-authorship makes the research authoritative and the customer relationship durable.',
  },
];

type ComparisonRow = {
  dimension: string;
  consulting: string;
  dataStack: string;
  rpa: string;
  abarva: string;
};

const COMPARISON: ComparisonRow[] = [
  {
    dimension: 'Engagement model',
    consulting: 'T&M · retainer · fixed-fee',
    dataStack: 'SaaS subscription',
    rpa: 'Per-bot license',
    abarva: 'Outcome economics · 30% of measured savings',
  },
  {
    dimension: 'Time to first evidence',
    consulting: '6-12 weeks',
    dataStack: '2-4 weeks (data wired)',
    rpa: '4-8 weeks (process scoped)',
    abarva: '48 hours · intelligence before invoice',
  },
  {
    dimension: 'Scales with',
    consulting: 'Bodies on the engagement',
    dataStack: 'Data volume + queries',
    rpa: 'Bot count',
    abarva: 'Pattern library + cross-program emergence',
  },
  {
    dimension: 'Knowledge persists as',
    consulting: 'Engagement memory + slide deck',
    dataStack: 'Customer\'s BI surface',
    rpa: 'Bot logs',
    abarva: 'Genome (cross-tenant, anonymized) + Tenant Evidence Ledger',
  },
  {
    dimension: 'Audit trail at outcome',
    consulting: 'Engagement deliverables (slides)',
    dataStack: 'Dashboard snapshots',
    rpa: 'Bot execution logs',
    abarva: 'Outcome Baseline (locked) + Outcome Measurement + Attribution Analysis (audit-grade)',
  },
  {
    dimension: 'Where they win',
    consulting: 'Stakeholder access · political navigation · optionality framing',
    dataStack: 'Data engineering depth · query performance',
    rpa: 'Repetitive task automation at scale',
    abarva: 'Decision-grade transformation programs with audit trail',
  },
  {
    dimension: 'Where AbarVa explicitly does NOT compete',
    consulting: 'Pure strategy advisory · M&A diligence · board representation',
    dataStack: 'Data warehouse · ETL · BI tooling',
    rpa: 'Bot-level task automation · screen scraping',
    abarva: 'We don\'t compete on these dimensions; we integrate with them.',
  },
];

const PAGE_BG = '#F6F1E8';
const PANEL_BG = '#FFFDFC';
const PANEL_ALT = '#F1E7DA';
const INK = '#171411';
const INK_SOFT = '#3A312A';
const INK_MUTED = '#5B4D43';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#0E9F8C';
const SKY = '#5AA6F8';
const WARM = '#D59B6A';
const DARK = '#111315';
const DARK_PANEL = '#171A1D';
const DARK_LINE = 'rgba(255,255,255,0.1)';
const CREAM = '#F7F2EA';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';

const sectionEyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: '0.16em',
  textTransform: 'uppercase',
  color: TEAL,
};

const sectionTitle: CSSProperties = {
  margin: '10px 0 0',
  fontFamily: SERIF,
  fontSize: 'clamp(28px, 2.2vw + 16px, 46px)',
  lineHeight: 1.06,
  letterSpacing: '-0.03em',
  color: INK,
};

const sectionBody: CSSProperties = {
  margin: '14px 0 0',
  maxWidth: 820,
  fontFamily: SANS,
  fontSize: 'clamp(16px, 1vw + 12px, 19px)',
  lineHeight: 1.65,
  color: INK_SOFT,
};

// ─── Page ─────────────────────────────────────────────────────────────

export default function PlatformPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
      }}
    >
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '28px 28px 96px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          <header
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 30,
              border: `1px solid ${LINE}`,
              background:
                `radial-gradient(circle at top left, rgba(90,166,248,0.22), transparent 34%),
                 radial-gradient(circle at top right, rgba(14,159,140,0.16), transparent 28%),
                 linear-gradient(180deg, ${PANEL_BG} 0%, ${PAGE_BG} 100%)`,
              padding: '56px 56px 48px',
              boxShadow: '0 24px 80px rgba(23,20,17,0.07)',
            }}
          >
            <div style={sectionEyebrow}>Platform</div>
            <h1
              style={{
                margin: '10px 0 0',
                fontFamily: SERIF,
                fontSize: 'clamp(50px, 6vw, 96px)',
                lineHeight: 0.93,
                letterSpacing: '-0.05em',
                maxWidth: 920,
                color: INK,
              }}
            >
              Transformation infrastructure with refusals.
            </h1>
            <p
              style={{
                margin: '22px 0 0',
                maxWidth: 860,
                fontSize: 'clamp(20px, 1.8vw, 30px)',
                lineHeight: 1.38,
                color: INK_SOFT,
              }}
            >
              Seven architectural layers. Four agents with defined refusals. Outcome economics that make
              attribution auditable. Built for organizations that treat transformation as accountable work,
              not consulting theater.
            </p>
            <div style={{ marginTop: 28 }}>
              <SectionLinkTOC />
            </div>
          </header>

          <section id="knowledge-architecture" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Knowledge architecture · 3 layers</div>
            <h2 style={sectionTitle}>Knowledge that compounds across every program.</h2>
            <p style={sectionBody}>
              The knowledge model remains the moat. What changes here is the reading experience: lighter
              canvas, darker ink, and more confidence that dense enterprise material can still feel composed.
            </p>
            <div
              style={{
                display: 'grid',
                gap: 18,
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                marginTop: 26,
              }}
            >
              {KNOWLEDGE_LAYERS.map((layer) => (
                <article
                  key={layer.name}
                  style={{
                    padding: 24,
                    background: PANEL_BG,
                    border: `1px solid ${LINE}`,
                    borderRadius: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                    boxShadow: '0 12px 32px rgba(23,20,17,0.05)',
                  }}
                >
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 10, color: INK_MUTED }}>{layer.scope}</div>
                    <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 34, lineHeight: 1.02, color: INK }}>
                      {layer.name}
                    </div>
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    {layer.counters.map((c) => (
                      <li key={c} style={{ fontFamily: MONO, fontSize: 12, color: TEAL, letterSpacing: '0.02em' }}>
                        · {c}
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {layer.artifacts.map((a) => (
                      <span
                        key={a}
                        style={{
                          display: 'inline-block',
                          padding: '6px 10px',
                          background: '#FFF8F0',
                          border: `1px solid ${LINE}`,
                          borderRadius: 999,
                          fontFamily: MONO,
                          fontSize: 10,
                          color: INK_MUTED,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.62, color: INK_SOFT, fontStyle: 'italic' }}>
                    Not — {layer.whatThisIsNot}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="methodology"
            style={{
              scrollMarginTop: 40,
              borderRadius: 30,
              background: `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)`,
              color: CREAM,
              padding: '34px 30px 30px',
              boxShadow: '0 28px 80px rgba(23,20,17,0.16)',
            }}
          >
            <div style={{ ...sectionEyebrow, color: TEAL }}>Methodology · 5 phases · hard gates</div>
            <h2
              style={{
                margin: '10px 0 0',
                fontFamily: SERIF,
                fontSize: 'clamp(30px, 3vw, 50px)',
                lineHeight: 1.02,
                letterSpacing: '-0.03em',
                color: CREAM,
              }}
            >
              Transformation has a shape. We enforce it.
            </h2>
            <p style={{ ...sectionBody, color: 'rgba(247,242,234,0.78)', maxWidth: 900 }}>
              This is one of the sections that benefits from going darker. It feels more like an operating
              surface, and the gate logic reads with more gravity than it did on an all-dark page.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 26 }}>
              {PHASES.map((phase) => (
                <article
                  key={phase.phase}
                  style={{
                    padding: 22,
                    background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${DARK_LINE}`,
                    borderRadius: 18,
                    display: 'grid',
                    gap: 16,
                    gridTemplateColumns: '190px 1fr',
                  }}
                >
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 10 }}>Phase</div>
                    <div style={{ marginTop: 6, fontFamily: SERIF, fontSize: 30, lineHeight: 1.04, color: CREAM }}>
                      {phase.phase}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <KeyValue k="Entry" v={phase.entry} dark />
                    <KeyValue k="Deliverables" v={phase.deliverables.join(' · ')} dark />
                    <KeyValue k="Exit gate" v={phase.exit} bold dark />
                    <div
                      style={{
                        marginTop: 4,
                        padding: '14px 16px',
                        background: 'rgba(14,159,140,0.08)',
                        border: `1px solid rgba(14,159,140,0.24)`,
                        borderRadius: 14,
                        fontFamily: SANS,
                        fontSize: 15,
                        color: 'rgba(247,242,234,0.9)',
                        lineHeight: 1.65,
                      }}
                    >
                      <span
                        style={{
                          display: 'block',
                          fontFamily: MONO,
                          textTransform: 'uppercase',
                          letterSpacing: '0.14em',
                          color: TEAL,
                          fontSize: 11,
                          marginBottom: 8,
                          fontWeight: 700,
                        }}
                      >
                        What cannot pass
                      </span>
                      {phase.cannotPass}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="agents" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Agents · 4 specialists · defined refusals</div>
            <h2 style={sectionTitle}>What our agents won&apos;t do is what makes them useful.</h2>
            <div
              style={{
                display: 'grid',
                gap: 16,
                gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
                marginTop: 24,
              }}
            >
              {AGENTS.map((agent) => (
                <article
                  key={agent.name}
                  style={{
                    padding: 24,
                    background: PANEL_BG,
                    border: `1px solid ${LINE}`,
                    borderRadius: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 16,
                    boxShadow: '0 12px 32px rgba(23,20,17,0.04)',
                  }}
                >
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 11 }}>{agent.name}</div>
                    <p style={{ margin: '8px 0 0', fontSize: 18, lineHeight: 1.55, color: INK_SOFT }}>{agent.role}</p>
                  </div>
                  <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {agent.refusals.map((r, i) => (
                      <li
                        key={i}
                        style={{
                          fontFamily: SANS,
                          fontSize: 15,
                          color: INK,
                          lineHeight: 1.62,
                          paddingLeft: 32,
                          position: 'relative',
                        }}
                      >
                        <span
                          aria-hidden
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: 2,
                            width: 22,
                            fontFamily: MONO,
                            fontSize: 11,
                            color: TEAL,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {r}
                      </li>
                    ))}
                  </ol>
                </article>
              ))}
            </div>
          </section>

          <section id="compounding-assets" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Compounding assets · live</div>
            <h2 style={sectionTitle}>Four assets that get more valuable with every program.</h2>
            <div
              style={{
                display: 'grid',
                gap: 18,
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                marginTop: 24,
              }}
            >
              {COMPOUNDING.map((asset) => (
                <article
                  key={asset.name}
                  style={{
                    padding: 24,
                    background: asset.name === 'Transformation Genome' ? PANEL_ALT : PANEL_BG,
                    border: `1px solid ${asset.name === 'Transformation Genome' ? 'rgba(14,159,140,0.24)' : LINE}`,
                    borderRadius: 22,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 14,
                  }}
                >
                  <div style={{ ...sectionEyebrow, fontSize: 10 }}>{asset.name.toUpperCase()}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 42, color: asset.name === 'Transformation Genome' ? TEAL : INK, letterSpacing: '-0.03em', lineHeight: 1.02 }}>
                    {asset.primary}
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {asset.secondary.map((s) => (
                      <li key={s} style={{ fontFamily: MONO, fontSize: 11, color: INK_MUTED, letterSpacing: '0.02em' }}>
                        · {s}
                      </li>
                    ))}
                  </ul>
                  <p style={{ margin: 0, fontSize: 15, lineHeight: 1.62, color: INK_SOFT, fontStyle: 'italic' }}>
                    {asset.whyCompounds}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="outcome-economics"
            style={{
              scrollMarginTop: 40,
              borderRadius: 30,
              background: `linear-gradient(180deg, rgba(90,166,248,0.14), rgba(14,159,140,0.08))`,
              border: `1px solid ${LINE}`,
              padding: '34px 30px 30px',
            }}
          >
            <div style={sectionEyebrow}>Pricing · outcome economics · 30%</div>
            <h2 style={sectionTitle}>We&apos;re paid only after measured outcomes.</h2>
            <p style={{ ...sectionBody, maxWidth: 760 }}>
              Worked example · Morrison Owned Brand Margin Recovery (composite organization built from real-world data).
            </p>
            <div style={{ display: 'grid', gap: 14, maxWidth: 920, marginTop: 24 }}>
              <FinancialRow label="Investment · AbarVa platform cost (Y1)" amount="$5.2M" note="Paid by client · regardless of outcome. Covers tenant provisioning, agent operations, cross-program intelligence access, evidence infrastructure." />
              <FinancialRow label="Modeled return" amount="$99M central · $73M-$128M range" note="Basis · Diagnostic Findings v4 + Business Case v3 · Genome analogous program library (n=14) supports range." />
              <FinancialRow label="Realized outcome at Phase 4" amount="$87M (annualized)" note="Measurement basis · Outcome Measurement Report (D19) with attribution analysis · auditor sign-off obtained." />
              <FinancialRow label="AbarVa settlement · 30% of attributable measured lift" amount="$26.1M" note="Settlement basis · Outcome Baseline (locked Phase 2) · Outcome Measurement · Attribution Analysis · settled 90 days post-Phase 4." bold />
            </div>
            <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 820 }}>
              <div style={{ ...sectionEyebrow, fontSize: 10, color: INK_MUTED }}>What this means</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <li style={mean}>We are paid only after outcome is measured.</li>
                <li style={mean}>We are paid only on attributable lift · not aspirational claims.</li>
                <li style={mean}>We are paid only with audit-grade evidence chain.</li>
                <li style={mean}>If pilot fails the gate, we don&apos;t scale and we don&apos;t get paid the scale economics.</li>
              </ul>
            </div>
            <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, maxWidth: 1100 }}>
              <WhyColumn title="For client" body="Alignment of incentive · AbarVa wins only when client wins." />
              <WhyColumn title="For AbarVa" body="Revenue multiples 4-6x typical SaaS based on outcome capture · defensible vs. consulting because attribution is proven." />
              <WhyColumn title="For investors" body="Evidence-of-value delivery becomes contractually load-bearing · impossible to fake." />
            </div>
          </section>

          <section id="composability" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Architecture · generative</div>
            <h2 style={sectionTitle}>17 modules × 5 archetypes × 4 tenants × 9 solutions = 30,600 unique program shapes.</h2>
            <p style={sectionBody}>
              Programs are not products. The platform is generative, not a fixed product surface. Each program
              composes the modules, archetypes, and solutions it needs and rejects what it doesn&apos;t. With Maestro
              custom-path generation, the space is effectively unbounded.
            </p>
            <div
              style={{
                marginTop: 22,
                padding: 24,
                background: PANEL_BG,
                border: `1px solid ${LINE}`,
                borderRadius: 22,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                maxWidth: 1180,
              }}
            >
              <div style={{ ...sectionEyebrow, fontSize: 10, color: INK_MUTED }}>Worked composition · Morrison Owned Brand Margin Recovery</div>
              <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
                <KeyValue k="Archetype" v="Operational Optimization" />
                <KeyValue k="Solution match" v="Retail × Middle Office × Optimize" />
                <KeyValue k="Modules active" v="Hypothesis Tree · Workstream Charter (×3) · Evidence Ledger · Pattern Match (Sentinel) · Decision Brief · Intervention Charter (×2) · Business Case · Operating Review Rhythm · Early Warning Dashboard · Outcome Baseline · Outcome Measurement · Genome Contribution" />
                <KeyValue k="Customization" v="Q3 2026 contracting cycle window forced custom Phase 3 timeline · F022 active pattern triggered joint sponsor turn protocol." />
              </div>
            </div>
          </section>

          <section id="comparison" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Comparison · category positioning</div>
            <h2 style={sectionTitle}>Where we win. Where we don&apos;t compete.</h2>
            <div
              style={{
                overflowX: 'auto',
                border: `1px solid ${LINE}`,
                borderRadius: 22,
                background: PANEL_BG,
                boxShadow: '0 12px 32px rgba(23,20,17,0.05)',
                marginTop: 24,
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                <thead>
                  <tr>
                    <th style={headStyle}>Dimension</th>
                    <th style={headStyle}>Top-3 consulting firm engagement model</th>
                    <th style={headStyle}>Modern data stack tool</th>
                    <th style={headStyle}>RPA platform</th>
                    <th style={{ ...headStyle, color: TEAL }}>AbarVa</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPARISON.map((row, i) => (
                    <tr key={row.dimension}>
                      <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dimension}</td>
                      <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.consulting}</td>
                      <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dataStack}</td>
                      <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.rpa}</td>
                      <td style={{ ...cellStyle, color: TEAL, fontWeight: 600, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.abarva}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, display: 'block', fontSize: 14, lineHeight: 1.55, color: INK_MUTED }}>
              Structural-class column labels · we don&apos;t name specific competitor firms or tools. The
              &quot;where AbarVa explicitly does NOT compete&quot; row is the trust move · it tells you where to
              go for those needs.
            </div>
          </section>

          <footer
            style={{
              marginTop: 12,
              paddingTop: 24,
              borderTop: `1px solid ${LINE}`,
              display: 'flex',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              fontSize: 14,
              lineHeight: 1.55,
              color: INK_MUTED,
            }}
          >
            <span>
              Platform operators · the admin hub lives at{' '}
              <Link href="/platform/admin" style={{ color: INK, fontWeight: 600, textDecoration: 'underline' }}>
                /platform/admin
              </Link>
              .
            </span>
            <span>
              Composite organizations (Apex Retail, Meridian Health, First Capital, Keystone Energy, Morrison) are built
              from real-world data.
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────

function KeyValue({ k, v, bold, dark }: { k: string; v: string; bold?: boolean; dark?: boolean }) {
  return (
    <div>
      <span style={{ fontFamily: MONO, fontSize: 10, color: TEAL, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {k}
      </span>
      <div
        style={{
          marginTop: 6,
          fontFamily: SANS,
          fontSize: 'clamp(15px, 1vw + 11px, 17px)',
          fontWeight: bold ? 600 : 400,
          color: dark ? CREAM : INK,
          lineHeight: 1.58,
        }}
      >
        {v}
      </div>
    </div>
  );
}

function FinancialRow({ label, amount, note, bold }: { label: string; amount: string; note: string; bold?: boolean }) {
  return (
    <div
      style={{
        padding: bold ? 20 : 16,
        background: bold ? 'rgba(14,159,140,0.08)' : 'rgba(255,253,252,0.82)',
        border: `1px solid ${bold ? 'rgba(14,159,140,0.28)' : LINE}`,
        borderRadius: 18,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 20,
        alignItems: 'baseline',
      }}
    >
      <div>
        <div style={{ fontFamily: MONO, fontSize: 11, color: INK_MUTED, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <div style={{ marginTop: 8, maxWidth: 640, fontSize: 15, lineHeight: 1.58, color: INK_SOFT }}>
          {note}
        </div>
      </div>
      <div style={{ fontFamily: SERIF, fontSize: bold ? 36 : 28, color: bold ? TEAL : INK, letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        {amount}
      </div>
    </div>
  );
}

function WhyColumn({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: 18, background: PANEL_BG, border: `1px solid ${LINE}`, borderRadius: 18 }}>
      <div style={{ ...sectionEyebrow, fontSize: 10 }}>{title.toUpperCase()}</div>
      <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.58, color: INK_SOFT }}>{body}</div>
    </div>
  );
}

function SectionLinkTOC() {
  const links = [
    { href: '#knowledge-architecture', label: 'Knowledge architecture' },
    { href: '#methodology', label: 'Methodology' },
    { href: '#agents', label: 'Agents' },
    { href: '#compounding-assets', label: 'Compounding assets' },
    { href: '#outcome-economics', label: 'Outcome economics' },
    { href: '#composability', label: 'Composability' },
    { href: '#comparison', label: 'Comparison' },
  ];
  return (
    <nav aria-label="Platform sections" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
      {links.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          style={{
            display: 'inline-block',
            padding: '9px 14px',
            background: 'rgba(255,255,255,0.72)',
            border: `1px solid ${LINE}`,
            borderRadius: 999,
            fontFamily: MONO,
            fontSize: 10,
            color: INK_SOFT,
            letterSpacing: '0.08em',
            textDecoration: 'none',
          }}
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

const headStyle: CSSProperties = {
  textAlign: 'left',
  padding: '14px 14px',
  background: '#FFF8F0',
  fontFamily: MONO,
  fontSize: 10,
  color: INK_MUTED,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${LINE}`,
  whiteSpace: 'nowrap',
};

const cellStyle: CSSProperties = {
  padding: '14px 14px',
  fontFamily: SANS,
  fontSize: 14,
  color: INK,
  lineHeight: 1.55,
  borderBottom: `1px solid ${LINE}`,
  verticalAlign: 'top',
};

const rowAccent: CSSProperties = {
  background: 'rgba(213,155,106,0.08)',
  fontStyle: 'italic',
};

const mean: CSSProperties = {
  padding: '12px 14px',
  background: 'rgba(255,255,255,0.78)',
  border: `1px solid ${LINE}`,
  borderRadius: 12,
  fontFamily: MONO,
  fontSize: 12,
  color: INK_SOFT,
  letterSpacing: '0.02em',
};
