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
  flowNote: string;
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
    flowNote: 'Receives only promoted patterns after threshold, evidence review, and legal anonymization sign-off.',
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
    flowNote: 'Feeds anonymized, verified signals upward into Emergent once contribution rules and sensitivity checks pass.',
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
    flowNote: 'Promotes upward only when repeated observations clear threshold and the contribution package is audit-complete.',
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
    exit: 'Outcome verification complete · learning captured · Genome contribution submitted',
    cannotPass:
      'Outcome claims without attribution analysis. Verification packages where evidence chain-of-custody is incomplete. Programs that claim patterns "didn\'t apply" without Learning Memo accounting for Pattern Match Log entries.',
  },
];

type Agent = {
  name: string;
  role: string;
  capabilities: string[];
  refusals: string[];
  outputs: string[];
};

const AGENTS: Agent[] = [
  {
    name: 'Nexus',
    role: 'Runs programs · intake, diagnosis, design, execution turns.',
    capabilities: [
      'Orchestrates program state across all 5 phases',
      'Drafts Hypothesis Trees, Intervention Charters, and Business Cases',
      'Facilitates stakeholder turns and sponsor alignment',
    ],
    refusals: [
      'Refuses to generate intervention recommendations without an evidence basis traceable to the Evidence Ledger.',
      'Refuses to advance through a phase gate when entry criteria are unmet, regardless of stakeholder pressure.',
    ],
    outputs: ['Program Charter', 'Hypothesis Tree', 'Intervention Charter', 'Decision Brief', 'Timeline + Resource Estimate'],
  },
  {
    name: 'Sentinel',
    role: 'Curates patterns · cross-program intelligence, contradiction surfacing.',
    capabilities: [
      'Runs continuous pattern detection across the Genome library (currently 47 patterns)',
      'Surfaces contradictions between stated strategy and observed behavior',
      'Maintains Pattern Match Log and Contradiction Log per program',
    ],
    refusals: [
      'Refuses to mark a pattern resolved without confirmed outcome evidence and a sustained confidence drop below threshold.',
      'Refuses to recommend an intervention without n ≥ 5 prior Genome observations of the pattern.',
    ],
    outputs: ['Pattern Match Log', 'Contradiction Log', 'Genome Contribution Package'],
  },
  {
    name: 'Atlas',
    role: 'Holds the tower view · cross-program orchestration, leading indicators, executive surface.',
    capabilities: [
      'Operates Control Tower as the cross-portfolio cockpit',
      'Surfaces leading indicators and early warning signals',
      'Aggregates cross-program signals with anonymization preserved',
    ],
    refusals: [
      'Refuses to allow a program to drift past a hard gate without recorded gate-decision and dissent capture.',
      'Refuses to surface a leading indicator as "green" when underlying evidence is stale beyond freshness threshold.',
    ],
    outputs: ['Control Tower dashboard', 'Early Warning Dashboard', 'Cross-Program Signals'],
  },
  {
    name: 'Steward',
    role: 'Enforces platform discipline · evidence provenance, decision archive, access.',
    capabilities: [
      'Registers evidence with source + owner + chain-of-custody',
      'Maintains Decision Archive with dissent capture and evidence weighting',
      'Enforces access control and sensitivity-tier governance',
    ],
    refusals: [
      'Refuses to register evidence in the Evidence Ledger without source-of-record citation and chain-of-custody completeness.',
      'Refuses to promote a pattern from candidate to Genome without legal sign-off on anonymization.',
    ],
    outputs: ['Evidence Ledger', 'Decision Archive', 'Access Control audit trail'],
  },
];

type CompoundingAsset = {
  name: string;
  primary: string;
  secondary: string[];
  whyCompounds: string;
  ipCharacter: string;
};

const COMPOUNDING: CompoundingAsset[] = [
  {
    name: 'Transformation Genome',
    primary: '47 promoted patterns',
    secondary: ['1,247 anonymized observations', 'F018 most-cited (31 program contributions)', 'Growth rate ~3 patterns / quarter'],
    whyCompounds:
      'Every program adds to the corpus. Every pattern match strengthens or refines a Genome entry. Patterns at n ≥ 5 promote to recommend-intervention status. The library only gets sharper.',
    ipCharacter:
      'Not licensed from elsewhere. Built from observed transformation programs. AbarVa’s curation discipline is the moat.',
  },
  {
    name: 'Adaptive Strategy Intelligence',
    primary: '4 active programs',
    secondary: ['19 pattern matches today', '14 contradictions surfaced this week', '1 critical pattern at second-degree (F022 Co-Sponsor Pace Divergence)'],
    whyCompounds:
      'Cross-program signal density increases with program count. By program N, every new program inherits N-1 programs\' worth of pattern intelligence — including timing windows and intervention success rates that didn\'t exist at program 1.',
    ipCharacter:
      'Agent behavior, contradiction-detection logic, and pattern-matching prompts are proprietary. This cannot be recreated by swapping in a stronger base model.',
  },
  {
    name: 'Outcome Interpretability Layer',
    primary: '187 audit-grade evidence items',
    secondary: ['100% chain-of-custody completeness across active programs', '2 board-ready outcome reports', 'Avg 5.4 evidence artifacts per material decision'],
    whyCompounds:
      'Provenance discipline is the moat. As Evidence Ledger volume grows, so does the credibility of attribution claims. Audit-grade evidence chain is what makes program claims defensible to boards and auditors.',
    ipCharacter:
      'Evidence Ledger schema, chain-of-custody enforcement, and sensitivity tiering are AbarVa-built. There is no off-the-shelf equivalent.',
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
    ipCharacter:
      'Research is written against live program observations — something consulting firms and tool vendors structurally cannot produce.',
  },
];

const PLATFORM_PROVIDES = [
  'Program Operating System · 28 deliverables generated dynamically across 5 phases. Dynamic generation based on program context, not static templates.',
  'Cross-program intelligence · patterns, contradictions, and decisions observed across all programs feed back into each individual program’s guidance.',
  'Evidence discipline · every finding, every decision, every pattern match traceable to source-of-record through the Evidence Ledger.',
  'Agent orchestration · 4 named agents with defined refusal behaviors. Agents do not freelance; they operate within the governance spine.',
];

const PLATFORM_DOES_NOT = [
  'Not a data platform. We consume tenant data; we do not replace Snowflake, Databricks, or the modern data stack.',
  'Not an RPA platform. We orchestrate decisions and intelligence; task automation is not our surface.',
  'Not an LLM wrapper. Base models are infrastructure; the differentiated product is the agents, the Genome, the Evidence Ledger, and the governance discipline on top.',
  'Not a consulting replacement. We augment expertise with platform infrastructure; senior human judgment still anchors material decisions.',
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
    dimension: 'Operating core',
    consulting: 'Human project team + deck cadence',
    dataStack: 'Warehouse + compute + semantic layer',
    rpa: 'Bot fleet + process scripts',
    abarva: 'Agents + Genome + Evidence Ledger + governance spine',
  },
  {
    dimension: 'Time to first evidence',
    consulting: '6-12 weeks',
    dataStack: '2-4 weeks (data wired)',
    rpa: '4-8 weeks (process scoped)',
    abarva: '48 hours · structured intelligence surface',
  },
  {
    dimension: 'What compounds',
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
    dimension: 'Audit trail',
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
              AbarVa is a transformation-intelligence platform. Four specialist agents coordinate across
              three knowledge layers with a governance spine enforcing evidence discipline. Built for
              organizations that want architecture, IP, and operating substance instead of consulting theater.
            </p>
            <div style={{ marginTop: 28 }}>
              <SectionLinkTOC />
            </div>
          </header>

          <section id="knowledge-architecture" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Knowledge architecture · 3 layers</div>
            <h2 style={sectionTitle}>Knowledge that compounds across every program.</h2>
            <p style={sectionBody}>
              Three knowledge layers work in sequence. Tenant working memory contributes upward only after
              provenance, anonymization, and threshold checks. Decorative graphs do not earn trust; labeled
              layers with explicit promotion rules do.
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
                marginTop: 26,
              }}
            >
              {KNOWLEDGE_LAYERS.map((layer, index) => (
                <article
                  key={layer.name}
                  style={{
                    padding: 24,
                    background: index === 0 ? `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)` : PANEL_BG,
                    border: `1px solid ${index === 0 ? DARK_LINE : LINE}`,
                    borderRadius: 22,
                    display: 'grid',
                    gap: 18,
                    gridTemplateColumns: 'minmax(0, 1.15fr) minmax(260px, 0.85fr)',
                    alignItems: 'start',
                    boxShadow: index === 0 ? '0 20px 48px rgba(23,20,17,0.12)' : '0 12px 32px rgba(23,20,17,0.05)',
                  }}
                >
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 10, color: index === 0 ? 'rgba(247,242,234,0.62)' : INK_MUTED }}>{layer.scope}</div>
                    <div style={{ marginTop: 10, fontFamily: SERIF, fontSize: 36, lineHeight: 1.02, color: index === 0 ? CREAM : INK }}>
                      {layer.name}
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: 15, lineHeight: 1.65, color: index === 0 ? 'rgba(247,242,234,0.78)' : INK_SOFT }}>
                      Not — {layer.whatThisIsNot}
                    </p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
                      {layer.artifacts.map((a) => (
                        <span
                          key={a}
                          style={{
                            display: 'inline-block',
                            padding: '6px 10px',
                            background: index === 0 ? 'rgba(255,255,255,0.06)' : '#FFF8F0',
                            border: `1px solid ${index === 0 ? DARK_LINE : LINE}`,
                            borderRadius: 999,
                            fontFamily: MONO,
                            fontSize: 10,
                            color: index === 0 ? 'rgba(247,242,234,0.74)' : INK_MUTED,
                            letterSpacing: '0.04em',
                          }}
                        >
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: `1px solid ${index === 0 ? 'rgba(14,159,140,0.24)' : LINE}`,
                      background: index === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.7)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                    }}
                  >
                    <div style={{ ...sectionEyebrow, fontSize: 10, color: index === 0 ? TEAL : INK_MUTED }}>Current state</div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {layer.counters.map((c) => (
                        <li key={c} style={{ fontFamily: MONO, fontSize: 12, color: index === 0 ? CREAM : TEAL, letterSpacing: '0.02em', lineHeight: 1.55 }}>
                          · {c}
                        </li>
                      ))}
                    </ul>
                    <div
                      style={{
                        paddingTop: 12,
                        borderTop: `1px solid ${index === 0 ? DARK_LINE : LINE}`,
                        fontSize: 14,
                        lineHeight: 1.58,
                        color: index === 0 ? 'rgba(247,242,234,0.72)' : INK_SOFT,
                      }}
                    >
                      {layer.flowNote}
                    </div>
                  </div>
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
                    <div style={{ fontFamily: SERIF, fontSize: 34, lineHeight: 1.02, color: INK }}>{agent.name}</div>
                    <p style={{ margin: '10px 0 0', fontSize: 17, lineHeight: 1.6, color: INK_SOFT }}>{agent.role}</p>
                  </div>
                  <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
                    <div>
                      <div style={{ ...sectionEyebrow, fontSize: 10, color: INK_MUTED }}>Capabilities</div>
                      <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agent.capabilities.map((cap) => (
                          <li key={cap} style={{ fontSize: 15, lineHeight: 1.6, color: INK_SOFT }}>{cap}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div style={{ ...sectionEyebrow, fontSize: 10, color: WARM }}>Refuses</div>
                      <ul style={{ margin: '10px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {agent.refusals.map((refusal) => (
                          <li key={refusal} style={{ fontSize: 15, lineHeight: 1.6, color: INK }}>{refusal}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 10, color: INK_MUTED }}>Named outputs</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                      {agent.outputs.map((output) => (
                        <span
                          key={output}
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
                          {output}
                        </span>
                      ))}
                    </div>
                  </div>
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
                  <div
                    style={{
                      paddingTop: 12,
                      borderTop: `1px solid ${LINE}`,
                      fontSize: 14,
                      lineHeight: 1.58,
                      color: INK_MUTED,
                    }}
                  >
                    {asset.ipCharacter}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section
            id="architecture-ip"
            style={{
              scrollMarginTop: 40,
              borderRadius: 30,
              background: `linear-gradient(180deg, rgba(90,166,248,0.14), rgba(14,159,140,0.08))`,
              border: `1px solid ${LINE}`,
              padding: '34px 30px 30px',
            }}
          >
            <div style={sectionEyebrow}>Platform · architecture · IP</div>
            <h2 style={sectionTitle}>What AbarVa is made of.</h2>
            <p style={{ ...sectionBody, maxWidth: 760 }}>
              AbarVa is a transformation-intelligence platform. Four specialist agents coordinate across
              three knowledge layers with a governance spine enforcing evidence discipline. Below is the
              condensed answer to what the platform actually provides, and where its boundaries are explicit.
            </p>
            <div style={{ display: 'grid', gap: 18, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', marginTop: 28 }}>
              <div
                style={{
                  padding: 22,
                  background: PANEL_BG,
                  border: `1px solid ${LINE}`,
                  borderRadius: 20,
                  boxShadow: '0 12px 30px rgba(23,20,17,0.04)',
                }}
              >
                <div style={{ ...sectionEyebrow, fontSize: 10 }}>What AbarVa provides</div>
                <ul style={{ margin: '12px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PLATFORM_PROVIDES.map((item) => (
                    <li key={item} style={{ fontSize: 15, lineHeight: 1.65, color: INK_SOFT }}>{item}</li>
                  ))}
                </ul>
              </div>
              <div
                style={{
                  padding: 22,
                  background: `linear-gradient(180deg, ${DARK_PANEL} 0%, ${DARK} 100%)`,
                  border: `1px solid ${DARK_LINE}`,
                  borderRadius: 20,
                  boxShadow: '0 18px 42px rgba(23,20,17,0.12)',
                }}
              >
                <div style={{ ...sectionEyebrow, fontSize: 10, color: TEAL }}>What AbarVa does not do</div>
                <ul style={{ margin: '12px 0 0', paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {PLATFORM_DOES_NOT.map((item) => (
                    <li key={item} style={{ fontSize: 15, lineHeight: 1.65, color: 'rgba(247,242,234,0.82)' }}>{item}</li>
                  ))}
                </ul>
              </div>
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

function SectionLinkTOC() {
  const links = [
    { href: '#knowledge-architecture', label: 'Knowledge architecture' },
    { href: '#methodology', label: 'Methodology' },
    { href: '#agents', label: 'Agents' },
    { href: '#compounding-assets', label: 'Compounding assets' },
    { href: '#architecture-ip', label: 'Architecture + IP' },
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
