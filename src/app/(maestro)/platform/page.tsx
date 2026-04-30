import Link from 'next/link';
import type { CSSProperties } from 'react';
import { getPatternManifestEntries } from '@/lib/intelligence/pattern-manifest';

export const dynamic = 'force-dynamic';

type KnowledgeLayer = {
  name: string;
  scope: string;
  counters: string[];
  artifacts: string[];
  whatThisIsNot: string;
  flowNote: string;
  metric: string;
};

type PhaseBlock = {
  phase: string;
  entry: string;
  deliverables: string[];
  exit: string;
  cannotPass: string;
};

type Agent = {
  name: string;
  role: string;
  tagline: string;
  accent: string;
  capabilities: string[];
  refusals: string[];
  outputs: string[];
};

type CompoundingAsset = {
  name: string;
  primary: string;
  secondary: string[];
  whyCompounds: string;
  ipCharacter: string;
  visual: 'sparkline' | 'radar' | 'chain' | 'publication';
};

type ComparisonRow = {
  dimension: string;
  consulting: string;
  dataStack: string;
  rpa: string;
  abarva: string;
};

function knowledgeLayers(patternCount: number): KnowledgeLayer[] {
  return [
  {
    name: 'Out-of-box Genome',
    scope: 'Cross-tenant · anonymized · AbarVa-curated',
    counters: [
      `${patternCount} authored patterns`,
      '1,247 anonymized observations',
      'F018 most-cited · 31 program contributions',
      'Growth · ~3 patterns / quarter',
    ],
    artifacts: ['Pattern library (authored corpus)', 'Intervention library (n=124 · success-rated)', 'Comparator class library · industry × function × scale'],
    whatThisIsNot:
      '"Best practices PDFs," "consulting playbooks," or "AI knowledge graph." This is observed-and-validated pattern capital with n-counts and intervention success rates.',
    flowNote: 'Receives only promoted patterns after threshold, evidence review, and legal anonymization sign-off.',
    metric: `${patternCount} authored patterns`,
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
    metric: 'Audit-grade memory',
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
    metric: '3 promotions this quarter',
  },
  ];
}

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
    exit: 'Findings adopted + Hypothesis Tree resolved + Evidence Ledger audit-grade for all material findings',
    cannotPass:
      'Findings with thin evidence basis. Hypotheses unresolved without explicit "deferred to Phase 5 candidate" classification. Findings that contradict the Evidence Ledger.',
  },
  {
    phase: '2 · Design',
    entry: 'Findings adopted · option-set criteria defined',
    deliverables: ['Option Set with Tradeoffs', 'Decision Brief', 'Intervention Charter (per intervention)', 'Business Case'],
    exit: 'Sponsor decision on option · charters approved · Business Case board-committed · Outcome Baseline locked',
    cannotPass:
      'Decisions without dissent capture. Intervention charters without pilot decision gates. Business cases without sensitivity analysis. Outcome baselines that have not passed reviewer scrutiny.',
  },
  {
    phase: '3 · Execute',
    entry: 'Phase 2 gates cleared · Program Plan adopted · Operating Review Rhythm established',
    deliverables: ['Program Plan', 'Commitment Tracker', 'Operating Review Rhythm', 'Early Warning Dashboard', 'Intervention Status Reports'],
    exit: 'Pilot decision gate cleared on data · scale criteria met',
    cannotPass:
      'Scale decisions made without pilot evidence clearing pre-defined gate criteria. Programs where Sentinel pattern matches show second-degree+ severity unaddressed. Programs where operating review cadence has lapsed more than two cycles.',
  },
  {
    phase: '4 · Verify',
    entry: 'Outcome measurement window opened · attribution analysis prepped',
    deliverables: ['Outcome Baseline Report (locked)', 'Outcome Measurement Report', 'Learning Memo', 'Genome Contribution Package'],
    exit: 'Outcome verification complete · learning captured · Genome contribution submitted',
    cannotPass:
      'Outcome claims without attribution analysis. Verification packages where evidence chain-of-custody is incomplete. Programs that claim patterns "did not apply" without a Learning Memo accounting for Pattern Match Log entries.',
  },
];

const AGENTS: Agent[] = [
  {
    name: 'Nexus',
    role: 'Runs programs · intake, diagnosis, design, execution turns.',
    tagline: 'The program operating core.',
    accent: '#14B8A6',
    capabilities: [
      'Orchestrates program state across all 5 phases',
      'Drafts Hypothesis Trees, Intervention Charters, and Business Cases',
      'Facilitates sponsor alignment and stakeholder turns',
    ],
    refusals: [
      'Refuses to generate intervention recommendations without an evidence basis traceable to the Evidence Ledger.',
      'Refuses to advance through a phase gate when entry criteria are unmet, regardless of stakeholder pressure.',
    ],
    outputs: ['Program Charter', 'Hypothesis Tree', 'Intervention Charter', 'Decision Brief', 'Timeline + Resource Estimate'],
  },
  {
    name: 'Sentinel',
    role: 'Curates patterns · contradiction surfacing · cross-program intelligence.',
    tagline: 'The pattern memory with teeth.',
    accent: '#55A7FF',
    capabilities: [
      'Runs continuous pattern detection across the Genome library',
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
    role: 'Holds the tower view · leading indicators · executive surface.',
    tagline: 'The cross-program control room.',
    accent: '#D59B6A',
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
    role: 'Enforces platform discipline · evidence provenance · archive governance.',
    tagline: 'The discipline that makes the rest believable.',
    accent: '#F2B75E',
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

function compoundingAssets(patternCount: number): CompoundingAsset[] {
  return [
  {
    name: 'Transformation Genome',
    primary: `${patternCount} authored patterns`,
    secondary: ['1,247 anonymized observations', 'F018 most-cited (31 program contributions)', 'Growth rate ~3 patterns / quarter'],
    whyCompounds:
      'Every program adds to the corpus. Every pattern match strengthens or refines a Genome entry. Patterns at n ≥ 5 promote to recommend-intervention status. The library only gets sharper.',
    ipCharacter:
      'Not licensed from elsewhere. Built from observed transformation programs. AbarVa’s curation discipline is the moat.',
    visual: 'sparkline',
  },
  {
    name: 'Adaptive Strategy Intelligence',
    primary: '4 active programs',
    secondary: ['19 pattern matches today', '14 contradictions surfaced this week', '1 critical pattern at second-degree'],
    whyCompounds:
      'Cross-program signal density increases with program count. By program N, every new program inherits N-1 programs worth of timing windows, warning signatures, and intervention success rates.',
    ipCharacter:
      'Agent behavior, contradiction-detection logic, and pattern-matching prompts are proprietary. This cannot be recreated by swapping in a stronger base model.',
    visual: 'radar',
  },
  {
    name: 'Outcome Interpretability Layer',
    primary: '187 audit-grade evidence items',
    secondary: ['100% chain-of-custody completeness across active programs', '2 board-ready outcome reports', 'Avg 5.4 evidence artifacts per material decision'],
    whyCompounds:
      'Provenance discipline is the moat. As Evidence Ledger volume grows, so does the credibility of attribution claims. Audit-grade evidence chain is what makes program claims defensible to boards and auditors.',
    ipCharacter:
      'Evidence Ledger schema, chain-of-custody enforcement, and sensitivity tiering are AbarVa-built. There is no off-the-shelf equivalent.',
    visual: 'chain',
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
      'Published research becomes inbound from decision-makers who already trust the methodology before first contact. Customer co-authorship makes the research authoritative and the relationship durable.',
    ipCharacter:
      'Research is written against live program observations, something consulting firms and tool vendors structurally cannot produce.',
    visual: 'publication',
  },
  ];
}

const PLATFORM_PROVIDES = [
  'Program Operating System · 28 deliverables generated dynamically across 5 phases, based on program context rather than static templates.',
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
    dataStack: 'Customer BI surface',
    rpa: 'Bot logs',
    abarva: 'Genome + Tenant Evidence Ledger',
  },
  {
    dimension: 'Audit trail',
    consulting: 'Engagement deliverables',
    dataStack: 'Dashboard snapshots',
    rpa: 'Bot execution logs',
    abarva: 'Outcome Baseline + Measurement + Attribution analysis',
  },
  {
    dimension: 'Where AbarVa explicitly does NOT compete',
    consulting: 'Pure strategy advisory · M&A diligence',
    dataStack: 'Data warehouse · ETL · BI tooling',
    rpa: 'Task automation · screen scraping',
    abarva: 'We do not compete on these dimensions; we integrate with them.',
  },
];

const PAGE_BG = '#F6F0E6';
const PANEL_BG = '#FFFDFC';
const PANEL_SOFT = '#F3E8DA';
const INK = '#171411';
const INK_SOFT = '#382F29';
const INK_MUTED = '#5C4E45';
const LINE = 'rgba(23,20,17,0.12)';
const TEAL = '#14B8A6';
const SKY = '#5AA6F8';
const AMBER = '#D59B6A';
const DARK = '#101214';
const DARK_PANEL = '#171A1D';
const DARK_LINE = 'rgba(255,255,255,0.12)';
const CREAM = '#F7F2EA';
const SANS = '"DM Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
const SERIF = '"Fraunces", Georgia, serif';
const MONO = '"JetBrains Mono", "Fira Code", monospace';

const sectionEyebrow: CSSProperties = {
  fontFamily: MONO,
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.18em',
  textTransform: 'uppercase',
  color: TEAL,
};

const sectionTitle: CSSProperties = {
  margin: '12px 0 0',
  fontFamily: SERIF,
  fontSize: 'clamp(34px, 2.5vw + 16px, 62px)',
  lineHeight: 0.98,
  letterSpacing: '-0.04em',
  color: INK,
};

const sectionBody: CSSProperties = {
  margin: '16px 0 0',
  maxWidth: 840,
  fontFamily: SANS,
  fontSize: 'clamp(17px, 1vw + 12px, 21px)',
  lineHeight: 1.65,
  color: INK_SOFT,
};

export default function PlatformPage() {
  const patternCount = getPatternManifestEntries().length;
  const knowledgeLayerCards = knowledgeLayers(patternCount);
  const compoundingAssetsList = compoundingAssets(patternCount);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: PAGE_BG,
        color: INK,
        fontFamily: SANS,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <style>{platformCss}</style>
      <div className="platform-grid" />
      <div className="platform-orb platform-orb-a" />
      <div className="platform-orb platform-orb-b" />

      <main style={{ maxWidth: 1520, margin: '0 auto', padding: '28px 24px 112px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 42 }}>
          <header className="platform-hero">
            <div className="platform-hero-copy">
              <div style={sectionEyebrow}>Platform</div>
              <h1
                style={{
                  margin: '14px 0 0',
                  fontFamily: SERIF,
                  // Another 20% cut · "Transformation" has to fit on one
                  // line inside the hero column which is constrained by
                  // the right-side schematic. Max = 52px.
                  fontSize: 'clamp(32px, 3.4vw, 52px)',
                  lineHeight: 1.02,
                  letterSpacing: '-0.025em',
                  maxWidth: 620,
                  color: INK,
                  textWrap: 'balance' as const,
                }}
              >
                Transformation architecture with visible discipline.
              </h1>
              <p
                style={{
                  margin: '28px 0 0',
                  maxWidth: 820,
                  fontSize: 'clamp(20px, 1.5vw + 12px, 30px)',
                  lineHeight: 1.4,
                  color: INK_SOFT,
                }}
              >
                Four agents. Three knowledge layers. A governance spine that refuses hand-waving.
                This page is intentionally editorial up front and operational once you scroll: warm
                canvas for legibility, darker bands for the dense surfaces that should feel more
                like instruments than brochures.
              </p>
              <div style={{ marginTop: 26 }}>
                <SectionLinkTOC />
              </div>
              <div className="hero-stat-strip">
                <MetricChip label="Agents" value="4 named" />
                <MetricChip label="Knowledge layers" value="3-tier" />
                <MetricChip label="Pattern capital" value={`${patternCount} authored`} />
                <MetricChip label="Proof discipline" value="Audit-grade" />
              </div>
            </div>

            <div className="platform-hero-visual" aria-hidden="true">
              <ArchitectureConstellation patternCount={patternCount} />
            </div>
          </header>

          <section id="knowledge-architecture" className="dark-stage" style={{ scrollMarginTop: 40 }}>
            <div style={{ ...sectionEyebrow, color: TEAL }}>Knowledge architecture · 3 layers</div>
            <h2 style={{ ...sectionTitle, color: CREAM }}>Knowledge that compounds upward, not sideways.</h2>
            <p style={{ ...sectionBody, color: 'rgba(247,242,234,0.78)', maxWidth: 920 }}>
              The visual move here is deliberate: not floating cards, but stacked bands with a visible
              flow rail. Client memory feeds emergent signals. Emergent signals promote into the Genome.
              The system looks like a machine because it behaves like one.
            </p>

            <div className="layer-stack">
              <div className="layer-flow-rail">
                <span />
                <span />
                <span />
              </div>
              {knowledgeLayerCards.map((layer, index) => (
                <article key={layer.name} className="layer-band">
                  <div>
                    <div style={{ ...sectionEyebrow, fontSize: 10, color: 'rgba(247,242,234,0.55)' }}>{layer.scope}</div>
                    <div className="layer-band-title">{layer.name}</div>
                    <p className="layer-band-copy">{layer.whatThisIsNot}</p>
                    <div className="token-row">
                      {layer.artifacts.map((artifact) => (
                        <span key={artifact} className="dark-token">
                          {artifact}
                        </span>
                      ))}
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

                  <div className="layer-band-panel">
                    <div className="layer-band-metric">{layer.metric}</div>
                    <div className="layer-band-rule">{layer.flowNote}</div>
                    <ul className="counter-list">
                      {layer.counters.map((counter) => (
                        <li key={counter}>{counter}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="methodology" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Methodology · 5 phases · hard gates</div>
            <h2 style={sectionTitle}>Transformation has a shape. We enforce it.</h2>
            <p style={sectionBody}>
              The page stays bright here because this is reading-heavy material, but the cards remain
              crisp and high-contrast. Every phase shows entry, output, exit, and the exact kind of
              slippage the system refuses to bless.
            </p>

            <div className="phase-grid">
              {PHASES.map((phase) => (
                <article key={phase.phase} className="phase-card">
                  <div className="phase-label">{phase.phase}</div>
                  <div className="phase-block">
                    <RuleItem label="Entry" value={phase.entry} />
                    <RuleItem label="Deliverables" value={phase.deliverables.join(' · ')} />
                    <RuleItem label="Exit gate" value={phase.exit} emphasis />
                  </div>
                  <div className="phase-warning">
                    <span>Cannot pass</span>
                    {phase.cannotPass}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="agents" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Agents · 4 specialists · defined refusals</div>
            <h2 style={sectionTitle}>Useful because they refuse the wrong work.</h2>
            <p style={sectionBody}>
              Each card is split like an operating panel: identity on the left, behavior and boundaries
              on the right. The amber refusal panel is not decorative. It is the trust mechanic.
            </p>

            <div className="agent-grid">
              {AGENTS.map((agent) => (
                <article key={agent.name} className="agent-card" style={{ ['--agent-accent' as string]: agent.accent }}>
                  <div className="agent-card-bg" />
                  <div className="agent-card-main">
                    <div className="agent-id">
                      <div className="agent-eyebrow">{agent.tagline}</div>
                      <div className="agent-name">{agent.name}</div>
                      <p className="agent-role">{agent.role}</p>
                      <div className="token-row">
                        {agent.outputs.map((output) => (
                          <span key={output} className="dark-token dark-token-quiet">
                            {output}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="agent-behavior">
                      <div className="agent-panel">
                        <div className="agent-panel-label">Capabilities</div>
                        <ul className="agent-list">
                          {agent.capabilities.map((capability) => (
                            <li key={capability}>{capability}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="agent-panel agent-panel-refusal">
                        <div className="agent-panel-label agent-panel-label-amber">Refuses</div>
                        <ul className="agent-list">
                          {agent.refusals.map((refusal) => (
                            <li key={refusal}>{refusal}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section id="compounding-assets" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Compounding assets · live</div>
            <h2 style={sectionTitle}>Assets that become more defensible as the corpus grows.</h2>
            <p style={sectionBody}>
              These are not generic benefit cards. Each block carries its own visual logic so the page
              feels designed, not templated: sparkline for the Genome, pulse radar for strategy, linked
              chain for interpretability, publication cover for research.
            </p>

            <div className="asset-grid">
              {compoundingAssetsList.map((asset) => (
                <article key={asset.name} className="asset-card">
                  <div className="asset-card-top">
                    <div>
                      <div style={{ ...sectionEyebrow, fontSize: 10 }}>{asset.name}</div>
                      <div className="asset-primary">{asset.primary}</div>
                    </div>
                    <AssetVisual visual={asset.visual} />
                  </div>
                  <ul className="asset-secondary">
                    {asset.secondary.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <p className="asset-body">{asset.whyCompounds}</p>
                  <div className="asset-footer">{asset.ipCharacter}</div>
                </article>
              ))}
            </div>
          </section>

          <section id="architecture-ip" className="dark-stage" style={{ scrollMarginTop: 40 }}>
            <div style={{ ...sectionEyebrow, color: TEAL }}>Architecture · product boundaries</div>
            <h2 style={{ ...sectionTitle, color: CREAM }}>What AbarVa provides. What it explicitly does not.</h2>
            <p style={{ ...sectionBody, color: 'rgba(247,242,234,0.78)' }}>
              This section should feel dense and declarative. The warm-canvas hero earns attention; the
              dark boundary section earns trust by being specific about where the platform stops.
            </p>

            <div className="boundary-stack">
              <div className="boundary-column">
                <div className="boundary-column-title">What AbarVa provides</div>
                {PLATFORM_PROVIDES.map((item) => (
                  <div key={item} className="boundary-row">
                    <span className="boundary-tag">Provides</span>
                    <div>{item}</div>
                  </div>
                ))}
              </div>

              <div className="boundary-column">
                <div className="boundary-column-title">What AbarVa does not do</div>
                {PLATFORM_DOES_NOT.map((item) => (
                  <div key={item} className="boundary-row boundary-row-not">
                    <span className="boundary-tag boundary-tag-not">Not a</span>
                    <div>{item}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="composability" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Architecture · generative</div>
            <h2 style={sectionTitle}>17 modules × 5 archetypes × 4 tenants × 9 solutions.</h2>
            <p style={sectionBody}>
              Programs are not fixed products. The platform is generative. Each program composes the
              modules, archetypes, and solutions it needs and rejects what it does not. This section uses
              more width because composition diagrams want lateral room.
            </p>

            <div className="composition-shell">
              <div className="composition-grid">
                <CompositionTile title="Archetype" value="Operational Optimization" />
                <CompositionTile title="Solution match" value="Retail × Middle Office × Optimize" />
                <CompositionTile
                  title="Modules active"
                  value="Hypothesis Tree · Workstream Charter (×3) · Evidence Ledger · Pattern Match · Decision Brief · Intervention Charter (×2) · Business Case · Operating Review Rhythm · Outcome Baseline"
                />
                <CompositionTile
                  title="Customization"
                  value="Q3 contracting cycle forced a custom Phase 3 timeline · F022 triggered a joint sponsor turn protocol."
                />
              </div>
            </div>
          </section>

          <section id="comparison" className="comparison-stage" style={{ scrollMarginTop: 40 }}>
            <div style={sectionEyebrow}>Comparison · category positioning</div>
            <h2 style={sectionTitle}>Where we win. Where we do not compete.</h2>
            <div className="comparison-shell">
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 980 }}>
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
                  {COMPARISON.map((row, index) => (
                    <tr key={row.dimension}>
                      <td style={{ ...cellStyle, ...(index === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dimension}</td>
                      <td style={{ ...cellStyle, ...(index === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.consulting}</td>
                      <td style={{ ...cellStyle, ...(index === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dataStack}</td>
                      <td style={{ ...cellStyle, ...(index === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.rpa}</td>
                      <td style={{ ...cellStyle, color: TEAL, fontWeight: 700, ...(index === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.abarva}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 14, fontSize: 14, lineHeight: 1.58, color: INK_MUTED }}>
              Structural-class labels only. The point is clarity, not chest-thumping.
            </div>
          </section>

          <footer
            style={{
              marginTop: 6,
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
              <Link href="/platform/admin" style={{ color: INK, fontWeight: 700, textDecoration: 'underline' }}>
                /platform/admin
              </Link>
              .
            </span>
            <span>
              Composite organizations (Apex Retail and Meridian Health) are built from real-world data.
            </span>
          </footer>
        </div>
      </main>
    </div>
  );
}

function ArchitectureConstellation({ patternCount }: { patternCount: number }) {
  // Live operational schematic. Four zones wired to the same spine · agents
  // at the top tap into the phase pipeline; phase gates write into the
  // Evidence Ledger; the ledger feeds knowledge upward (Client → Emergent →
  // Genome); outcome proof exits on the right. Animated with CSS pulses that
  // respect prefers-reduced-motion.
  // AI agents · canonical names from the rest of the platform page.
  // Each agent sits directly above its "home" phase gate (5-column grid).
  //   Nexus     · Program Operating Core    → Start (col 1)
  //   Sentinel  · Pattern Memory With Teeth → Diagnose (col 2)
  //   Steward   · Discipline + Evidence     → Execute (col 4)
  //   Atlas     · Cross-Program Control Room → Verify (col 5)
  // Design (col 3) is shared orchestration — Nexus drafts, Sentinel
  // contradicts, Steward registers · no single home agent.
  const AGENTS: Array<{ id: string; name: string; role: string; col: number }> = [
    { id: 'nexus', name: 'Nexus', role: 'program operating core', col: 1 },
    { id: 'sentinel', name: 'Sentinel', role: 'pattern memory · contradictions', col: 2 },
    { id: 'steward', name: 'Steward', role: 'evidence · chain-of-custody', col: 4 },
    { id: 'atlas', name: 'Atlas', role: 'cross-program control room', col: 5 },
  ];
  // Canonical 5-phase model · Start · Diagnose · Design · Execute · Verify.
  const PHASES: Array<{ id: string; num: string; title: string; refuse: string }> = [
    { id: 'p0', num: '0', title: 'Start', refuse: 'no sponsor · no go' },
    { id: 'p1', num: '1', title: 'Diagnose', refuse: 'thin evidence · refuse' },
    { id: 'p2', num: '2', title: 'Design', refuse: 'no diagnostic link · refuse' },
    { id: 'p3', num: '3', title: 'Execute', refuse: 'scope drift · refuse' },
    { id: 'p4', num: '4', title: 'Verify', refuse: 'baseline missing · refuse' },
  ];

  return (
    <div className="schematic-shell">
      {/* Top header · architecture label on left, governance on right */}
      <div className="schematic-header schematic-header-top">
        <span>
          <strong>Architecture</strong>
          <em>· Maestro-driven · 4 AI agents</em>
        </span>
        <span>Live governance spine</span>
      </div>

      {/* ─── MAESTRO TRAVELLER · human operator moving phase 0 → 4 ───── */}
      <div className="schematic-section schematic-section-maestro" aria-label="Maestro human operator">
        <div className="schematic-row-label">
          <span>Maestro · human operator</span>
          <span>drives program phase 0 → 4</span>
        </div>
        <div className="schematic-maestro-track">
          <div className="schematic-maestro-rail" aria-hidden="true" />
          <div className="schematic-maestro-avatar" aria-hidden="true">
            <svg viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="9" r="4.2" fill="rgba(245,158,11,0.95)" />
              <path d="M4 26 C 4 18 8 15 14 15 C 20 15 24 18 24 26 Z" fill="rgba(245,158,11,0.88)" />
            </svg>
          </div>
        </div>
      </div>

      {/* ─── AI AGENTS · 5-col grid aligned with phase gates ────────── */}
      <div className="schematic-section schematic-section-agents" aria-label="Specialist AI agents">
        <div className="schematic-row-label">
          <span>AI agents · 4</span>
          <span>aligned with home phase</span>
        </div>
        <div className="schematic-agent-row">
          {AGENTS.map((agent) => (
            <div key={agent.id} className="schematic-agent-chip" style={{ gridColumn: agent.col }}>
              <span className="schematic-agent-dot" aria-hidden="true" />
              <div className="schematic-agent-copy">
                <strong>{agent.name}</strong>
                <small>{agent.role}</small>
              </div>
            </div>
          ))}
          {/* Col 3 · Design is shared orchestration, no single home agent */}
          <div className="schematic-agent-slot-empty" style={{ gridColumn: 3 }} aria-hidden="true">
            <span>shared orchestration</span>
          </div>
        </div>
      </div>

      {/* ─── PHASE PIPELINE ──────────────────────────────────────────── */}
      <div className="schematic-section" aria-label="Phase pipeline">
        <div className="schematic-row-label">
          <span>Phases · 5</span>
          <span>hard gates · refusal logic</span>
        </div>
        <div className="schematic-phase-rail">
          <div className="schematic-phase-track" aria-hidden="true" />
          <div className="schematic-phase-flow" aria-hidden="true" />
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="schematic-phase-node" style={{ ['--delay' as string]: `${idx * 0.35}s` }}>
              <div className="schematic-phase-circle">
                <strong>{phase.num}</strong>
              </div>
              <div className="schematic-phase-label">{phase.title}</div>
              <div className="schematic-phase-refuse" title={phase.refuse}>
                <span aria-hidden="true">✕</span>
                <small>{phase.refuse}</small>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── EVIDENCE LEDGER SPINE ───────────────────────────────────── */}
      <div className="schematic-section schematic-section-spine" aria-label="Evidence Ledger spine">
        <div className="schematic-spine">
          <div className="schematic-spine-meta">
            <span>Evidence Ledger</span>
            <small>append-only · chain of custody · sensitivity-marked</small>
          </div>
          <div className="schematic-spine-bar" aria-hidden="true">
            {Array.from({ length: 12 }).map((_, i) => (
              <span key={i} style={{ ['--tick' as string]: `${i}` }} />
            ))}
          </div>
        </div>
      </div>

      {/* ─── KNOWLEDGE LAYERS · PROMOTION FLOW ───────────────────────── */}
      <div className="schematic-section" aria-label="Knowledge layers">
        <div className="schematic-row-label">
          <span>Knowledge · 3 layers</span>
          <span>compounds upward</span>
        </div>
        <div className="schematic-knowledge-stack">
          <div className="schematic-knowledge-band schematic-knowledge-genome">
            <div className="schematic-knowledge-name">Genome</div>
            <div className="schematic-knowledge-count">{patternCount} authored patterns</div>
          </div>
          <div className="schematic-knowledge-arrow" aria-hidden="true" />
          <div className="schematic-knowledge-band schematic-knowledge-emergent">
            <div className="schematic-knowledge-name">Emergent</div>
            <div className="schematic-knowledge-count">12 signals · awaiting promotion</div>
          </div>
          <div className="schematic-knowledge-arrow" aria-hidden="true" />
          <div className="schematic-knowledge-band schematic-knowledge-client">
            <div className="schematic-knowledge-name">Client-contributed</div>
            <div className="schematic-knowledge-count">tenant memory · per-engagement</div>
          </div>
        </div>
      </div>

      {/* ─── OUTCOME PORT ────────────────────────────────────────────── */}
      <div className="schematic-outcome" aria-label="Outcome proof output">
        <div className="schematic-outcome-line" aria-hidden="true" />
        <div className="schematic-outcome-port">
          <strong>Outcome proof</strong>
          <small>Audit-ready attribution · board-defensible</small>
        </div>
      </div>

      <div className="schematic-footer">
        <span>Client-contributed</span>
        <span>Emergent</span>
        <span>Genome</span>
      </div>
    </div>
  );
}

function RuleItem({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <div style={{ ...sectionEyebrow, fontSize: 10, color: emphasis ? TEAL : INK_MUTED }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.62, color: emphasis ? INK : INK_SOFT, fontWeight: emphasis ? 700 : 500 }}>{value}</div>
    </div>
  );
}

function CompositionTile({ title, value }: { title: string; value: string }) {
  return (
    <article className="composition-tile">
      <div className="composition-tile-label">{title}</div>
      <div className="composition-tile-value">{value}</div>
    </article>
  );
}

function MetricChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AssetVisual({ visual }: { visual: CompoundingAsset['visual'] }) {
  if (visual === 'sparkline') {
    return (
      <div className="asset-visual sparkline" aria-hidden="true">
        <div className="sparkline-bars">
          {[26, 38, 34, 52, 48, 66, 72, 68, 84].map((height, index) => (
            <span key={index} style={{ height }} />
          ))}
        </div>
      </div>
    );
  }

  if (visual === 'radar') {
    return (
      <div className="asset-visual radar" aria-hidden="true">
        <div className="radar-ring radar-ring-1" />
        <div className="radar-ring radar-ring-2" />
        <div className="radar-pulse" />
      </div>
    );
  }

  if (visual === 'chain') {
    return (
      <div className="asset-visual chain" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>
    );
  }

  return (
    <div className="asset-visual publication" aria-hidden="true">
      <div className="publication-cover">
        <div className="publication-line publication-line-short" />
        <div className="publication-line" />
        <div className="publication-line" />
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
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="toc-link">
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

const headStyle: CSSProperties = {
  textAlign: 'left',
  padding: '16px 16px',
  background: '#F2E7D9',
  fontFamily: MONO,
  fontSize: 10,
  color: INK_MUTED,
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: `1px solid ${LINE}`,
  whiteSpace: 'nowrap',
};

const cellStyle: CSSProperties = {
  padding: '16px 16px',
  fontFamily: SANS,
  fontSize: 14,
  color: INK,
  lineHeight: 1.6,
  borderBottom: `1px solid ${LINE}`,
  verticalAlign: 'top',
};

const rowAccent: CSSProperties = {
  background: 'rgba(213,155,106,0.1)',
  fontStyle: 'italic',
};

const platformCss = `
  .platform-grid {
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(23,20,17,0.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(23,20,17,0.035) 1px, transparent 1px);
    background-size: 28px 28px;
    mask-image: linear-gradient(180deg, rgba(0,0,0,0.32), transparent 18%);
    pointer-events: none;
  }

  .platform-orb {
    position: absolute;
    border-radius: 999px;
    filter: blur(80px);
    opacity: 0.26;
    pointer-events: none;
    animation: drift 18s ease-in-out infinite;
  }

  .platform-orb-a {
    width: 34rem;
    height: 34rem;
    top: -10rem;
    right: -8rem;
    background: radial-gradient(circle, rgba(20,184,166,0.38), rgba(20,184,166,0));
  }

  .platform-orb-b {
    width: 28rem;
    height: 28rem;
    top: 24rem;
    left: -10rem;
    background: radial-gradient(circle, rgba(90,166,248,0.18), rgba(90,166,248,0));
    animation-duration: 24s;
  }

  .platform-hero {
    position: relative;
    overflow: hidden;
    display: grid;
    gap: 28px;
    grid-template-columns: minmax(0, 1.15fr) minmax(360px, 0.85fr);
    padding: 64px 56px 56px;
    border: 1px solid rgba(23,20,17,0.12);
    border-radius: 34px;
    background:
      linear-gradient(180deg, rgba(255,253,252,0.94), rgba(246,240,230,0.88)),
      radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 34%),
      radial-gradient(circle at bottom left, rgba(90,166,248,0.14), transparent 30%);
    box-shadow: 0 30px 100px rgba(23,20,17,0.08);
  }

  .platform-hero-copy {
    position: relative;
    z-index: 1;
  }

  .platform-hero-visual {
    display: flex;
    align-items: stretch;
  }

  .hero-stat-strip {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 28px;
  }

  .metric-chip {
    display: inline-flex;
    flex-direction: column;
    gap: 4px;
    min-width: 132px;
    padding: 14px 16px;
    border: 1px solid rgba(23,20,17,0.12);
    border-radius: 18px;
    background: rgba(255,255,255,0.72);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.7);
  }

  .metric-chip span {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: ${INK_MUTED};
  }

  .metric-chip strong {
    font-size: 16px;
    line-height: 1.2;
    color: ${INK};
  }

  .toc-link {
    display: inline-block;
    padding: 10px 14px;
    border: 1px solid rgba(23,20,17,0.12);
    border-radius: 999px;
    background: rgba(255,255,255,0.68);
    color: ${INK_SOFT};
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.08em;
    text-decoration: none;
    transition: transform 180ms ease, border-color 180ms ease, color 180ms ease;
  }

  .toc-link:hover {
    transform: translateY(-1px);
    border-color: rgba(20,184,166,0.35);
    color: ${INK};
  }

  .constellation-shell {
    position: relative;
    width: 100%;
    min-height: 520px;
    padding: 24px;
    border-radius: 28px;
    border: 1px solid rgba(23,20,17,0.12);
    background:
      linear-gradient(180deg, rgba(16,18,20,0.96), rgba(20,24,29,0.94)),
      radial-gradient(circle at top right, rgba(20,184,166,0.18), transparent 28%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 28px 60px rgba(23,20,17,0.16);
    overflow: hidden;
  }

  .constellation-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.45;
    pointer-events: none;
  }

  .constellation-header,
  .constellation-footer {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.58);
  }

  .constellation-grid {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 16px;
    grid-template-columns: 1fr 1.2fr 1fr;
    align-items: center;
    min-height: 420px;
  }

  .constellation-column {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .constellation-card {
    padding: 18px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.04);
    color: ${CREAM};
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .constellation-card strong {
    font-family: ${SERIF};
    font-size: 28px;
    line-height: 1;
    letter-spacing: -0.04em;
  }

  .constellation-card span {
    color: rgba(247,242,234,0.7);
    font-size: 14px;
    line-height: 1.5;
  }

  .constellation-card-teal {
    box-shadow: inset 0 0 0 1px rgba(20,184,166,0.18), 0 0 32px rgba(20,184,166,0.12);
  }

  .constellation-card-amber {
    box-shadow: inset 0 0 0 1px rgba(213,155,106,0.18), 0 0 32px rgba(213,155,106,0.12);
  }

  .constellation-center {
    position: relative;
    min-height: 280px;
    display: grid;
    place-items: center;
  }

  .constellation-core {
    position: relative;
    z-index: 2;
    padding: 24px 28px;
    border-radius: 22px;
    border: 1px solid rgba(20,184,166,0.28);
    background: rgba(255,255,255,0.06);
    color: ${CREAM};
    font-family: ${SERIF};
    font-size: 34px;
    line-height: 1;
    letter-spacing: -0.04em;
    box-shadow: 0 0 34px rgba(20,184,166,0.18);
  }

  .constellation-ring {
    position: absolute;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.1);
  }

  .constellation-ring-a {
    width: 260px;
    height: 260px;
    animation: pulse 8s ease-in-out infinite;
  }

  .constellation-ring-b {
    width: 360px;
    height: 360px;
    border-color: rgba(20,184,166,0.15);
    animation: pulse 10s ease-in-out infinite reverse;
  }

  .constellation-node {
    position: absolute;
    width: 14px;
    height: 14px;
    border-radius: 999px;
    background: ${TEAL};
    box-shadow: 0 0 18px rgba(20,184,166,0.42);
    animation: traverse 7s ease-in-out infinite;
  }

  .constellation-node-a {
    top: 12%;
    left: 48%;
  }

  .constellation-node-b {
    right: 20%;
    bottom: 24%;
    background: ${SKY};
    box-shadow: 0 0 18px rgba(90,166,248,0.4);
    animation-delay: 1.2s;
  }

  .constellation-node-c {
    left: 18%;
    bottom: 22%;
    background: ${AMBER};
    box-shadow: 0 0 18px rgba(213,155,106,0.4);
    animation-delay: 2.2s;
  }

  /* ── Live architecture schematic (hero visual rewrite) ──────────── */
  .schematic-shell {
    position: relative;
    width: 100%;
    min-height: 620px;
    padding: 22px 22px 24px;
    border-radius: 28px;
    border: 1px solid rgba(23,20,17,0.12);
    background:
      linear-gradient(180deg, rgba(16,18,20,0.98), rgba(18,22,26,0.96)),
      radial-gradient(circle at 15% 20%, rgba(20,184,166,0.18), transparent 35%),
      radial-gradient(circle at 90% 80%, rgba(90,166,248,0.12), transparent 40%);
    box-shadow: inset 0 1px 0 rgba(255,255,255,0.04), 0 28px 60px rgba(23,20,17,0.18);
    overflow: hidden;
    color: ${CREAM};
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .schematic-shell::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px);
    background-size: 28px 28px;
    opacity: 0.4;
    pointer-events: none;
  }

  .schematic-header,
  .schematic-footer {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: space-between;
    gap: 12px;
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.58);
  }

  .schematic-header-top span:first-child {
    display: inline-flex;
    gap: 8px;
    align-items: baseline;
  }
  .schematic-header-top strong {
    font-weight: 600;
    letter-spacing: 0.16em;
    color: rgba(20,184,166,0.95);
  }
  .schematic-header-top em {
    font-style: normal;
    color: rgba(247,242,234,0.48);
  }

  .schematic-footer {
    margin-top: auto;
    padding-top: 6px;
    border-top: 1px dashed rgba(247,242,234,0.1);
  }

  .schematic-section {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .schematic-row-label {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    font-family: ${MONO};
    font-size: 9px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.48);
  }

  .schematic-row-label span:first-child {
    color: rgba(20,184,166,0.85);
  }

  /* MAESTRO TRAVELLER · human figure traversing phase 0 → 4 */
  .schematic-section-maestro {
    padding-bottom: 2px;
  }

  .schematic-maestro-track {
    position: relative;
    height: 36px;
    padding: 0;
  }

  .schematic-maestro-rail {
    position: absolute;
    left: 4%;
    right: 4%;
    top: 50%;
    height: 1px;
    background: linear-gradient(90deg,
      rgba(245,158,11,0) 0%,
      rgba(245,158,11,0.32) 8%,
      rgba(245,158,11,0.32) 92%,
      rgba(245,158,11,0) 100%);
    transform: translateY(-50%);
  }

  .schematic-maestro-avatar {
    position: absolute;
    top: 50%;
    left: 0;
    width: 28px;
    height: 28px;
    transform: translate(-50%, -50%);
    animation: maestro-travel 16s ease-in-out infinite;
    filter: drop-shadow(0 0 8px rgba(245,158,11,0.4));
  }

  .schematic-maestro-avatar svg {
    width: 100%;
    height: 100%;
    display: block;
  }

  /* Stop at each of the 5 phase columns (10%, 30%, 50%, 70%, 90%),
     dwell briefly, then continue. 16s loop · ~3.2s per phase. */
  @keyframes maestro-travel {
    0%   { left: 10%; }
    15%  { left: 10%; }
    20%  { left: 30%; }
    35%  { left: 30%; }
    40%  { left: 50%; }
    55%  { left: 50%; }
    60%  { left: 70%; }
    75%  { left: 70%; }
    80%  { left: 90%; }
    95%  { left: 90%; }
    100% { left: 10%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .schematic-maestro-avatar {
      animation: none !important;
      left: 10% !important;
    }
  }

  /* AGENTS · 5-column grid matching the phases row exactly so each
     chip sits directly above its home gate. */
  .schematic-agent-row {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    padding: 0 4px;
  }

  .schematic-agent-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 8px;
    border: 1px solid rgba(20,184,166,0.25);
    border-radius: 10px;
    background: linear-gradient(180deg, rgba(20,184,166,0.12), rgba(20,184,166,0.03));
    min-height: 44px;
    min-width: 0;
  }

  .schematic-agent-copy {
    min-width: 0;
    flex: 1;
  }

  .schematic-agent-chip strong {
    display: block;
    font-family: ${MONO};
    font-size: 11px;
    line-height: 1.1;
    color: ${CREAM};
    letter-spacing: 0.02em;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .schematic-agent-chip small {
    display: block;
    margin-top: 2px;
    font-family: ${MONO};
    font-size: 8px;
    letter-spacing: 0.04em;
    color: rgba(247,242,234,0.58);
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .schematic-agent-slot-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 4px;
    border: 1px dashed rgba(247,242,234,0.12);
    border-radius: 10px;
    background: transparent;
    min-height: 44px;
  }

  .schematic-agent-slot-empty span {
    font-family: ${MONO};
    font-size: 8px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.32);
    text-align: center;
    line-height: 1.2;
  }

  .schematic-agent-dot {
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${TEAL};
    box-shadow: 0 0 10px rgba(20,184,166,0.7);
    animation: schematic-agent-pulse 2.6s ease-in-out infinite;
    flex-shrink: 0;
  }

  .schematic-agent-chip:nth-child(2) .schematic-agent-dot { animation-delay: 0.65s; }
  .schematic-agent-chip:nth-child(3) .schematic-agent-dot { animation-delay: 1.3s; }
  .schematic-agent-chip:nth-child(4) .schematic-agent-dot { animation-delay: 1.95s; }

  /* PHASES · horizontal rail with 5 gates */
  .schematic-phase-rail {
    position: relative;
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 4px;
    padding: 18px 4px 8px;
  }

  .schematic-phase-track {
    position: absolute;
    left: 8%;
    right: 8%;
    top: 36px;
    height: 2px;
    background: linear-gradient(90deg,
      rgba(20,184,166,0.15) 0%,
      rgba(20,184,166,0.35) 20%,
      rgba(20,184,166,0.35) 80%,
      rgba(20,184,166,0.15) 100%);
    border-radius: 999px;
  }

  .schematic-phase-flow {
    position: absolute;
    top: 33px;
    left: 6%;
    width: 8px;
    height: 8px;
    border-radius: 999px;
    background: ${TEAL};
    box-shadow: 0 0 12px rgba(20,184,166,0.8);
    animation: schematic-phase-flow 7s linear infinite;
  }

  .schematic-phase-node {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    z-index: 1;
  }

  .schematic-phase-circle {
    width: 44px;
    height: 44px;
    border-radius: 999px;
    border: 1.5px solid rgba(20,184,166,0.42);
    background: rgba(16,18,20,0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 0 0 4px rgba(20,184,166,0.05), inset 0 0 12px rgba(20,184,166,0.1);
    animation: schematic-gate-pulse 3.2s ease-in-out infinite;
    animation-delay: var(--delay, 0s);
  }

  .schematic-phase-circle strong {
    font-family: ${SERIF};
    font-size: 16px;
    color: ${CREAM};
    letter-spacing: -0.02em;
  }

  .schematic-phase-label {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.06em;
    color: rgba(247,242,234,0.82);
    text-transform: uppercase;
  }

  .schematic-phase-refuse {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 2px 6px;
    border-radius: 999px;
    background: rgba(213,155,106,0.1);
    border: 1px solid rgba(213,155,106,0.25);
    font-family: ${MONO};
    font-size: 8px;
    letter-spacing: 0.05em;
    color: rgba(213,155,106,0.95);
    max-width: 100%;
  }

  .schematic-phase-refuse span {
    font-size: 7px;
    line-height: 1;
  }

  .schematic-phase-refuse small {
    font-size: 8px;
    letter-spacing: 0.05em;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: 90px;
  }

  /* EVIDENCE LEDGER · horizontal spine */
  .schematic-section-spine {
    padding: 8px 0 6px;
  }

  .schematic-spine {
    position: relative;
    padding: 14px 18px;
    border-radius: 14px;
    border: 1px solid rgba(20,184,166,0.28);
    background: linear-gradient(90deg,
      rgba(20,184,166,0.14) 0%,
      rgba(20,184,166,0.2) 50%,
      rgba(20,184,166,0.14) 100%);
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.05),
      0 0 28px rgba(20,184,166,0.16);
  }

  .schematic-spine-meta {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 10px;
  }

  .schematic-spine-meta span {
    font-family: ${SERIF};
    font-size: 16px;
    color: ${CREAM};
    letter-spacing: -0.01em;
  }

  .schematic-spine-meta small {
    font-family: ${MONO};
    font-size: 9px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.62);
    align-self: center;
  }

  .schematic-spine-bar {
    position: relative;
    display: grid;
    grid-template-columns: repeat(12, minmax(0, 1fr));
    height: 14px;
    border-radius: 999px;
    background: rgba(0,0,0,0.25);
    overflow: hidden;
  }

  .schematic-spine-bar span {
    background: rgba(20,184,166,0.8);
    height: 100%;
    margin: 0 1px;
    border-radius: 2px;
    opacity: 0.3;
    animation: schematic-tick 2.8s ease-in-out infinite;
    animation-delay: calc(var(--tick) * 0.12s);
  }

  /* KNOWLEDGE · three stacked bands with upward arrows */
  .schematic-knowledge-stack {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .schematic-knowledge-band {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.03);
  }

  .schematic-knowledge-genome {
    border-color: rgba(20,184,166,0.32);
    background: linear-gradient(90deg, rgba(20,184,166,0.12), rgba(20,184,166,0.03));
  }

  .schematic-knowledge-emergent {
    border-color: rgba(213,155,106,0.28);
    background: linear-gradient(90deg, rgba(213,155,106,0.08), rgba(213,155,106,0.02));
  }

  .schematic-knowledge-client {
    border-color: rgba(247,242,234,0.14);
    background: rgba(247,242,234,0.04);
  }

  .schematic-knowledge-name {
    font-family: ${SERIF};
    font-size: 14px;
    letter-spacing: -0.01em;
    color: ${CREAM};
  }

  .schematic-knowledge-count {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.06em;
    color: rgba(247,242,234,0.7);
  }

  .schematic-knowledge-arrow {
    position: relative;
    height: 12px;
    margin: 0 auto;
    width: 12px;
  }

  .schematic-knowledge-arrow::before {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    bottom: 0;
    width: 1.5px;
    transform: translateX(-50%);
    background: linear-gradient(180deg, rgba(20,184,166,0.9), rgba(20,184,166,0.2));
  }

  .schematic-knowledge-arrow::after {
    content: '';
    position: absolute;
    left: 50%;
    top: 0;
    transform: translateX(-50%);
    width: 0;
    height: 0;
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 5px solid rgba(20,184,166,0.9);
    animation: schematic-promote 2.4s ease-in-out infinite;
  }

  /* OUTCOME PROOF · right-flowing port */
  .schematic-outcome {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 12px;
    padding: 10px 0 4px;
  }

  .schematic-outcome-line {
    flex: 1;
    height: 1.5px;
    background: linear-gradient(90deg, rgba(20,184,166,0.2), rgba(20,184,166,0.75));
    border-radius: 999px;
    position: relative;
    overflow: hidden;
  }

  .schematic-outcome-line::after {
    content: '';
    position: absolute;
    top: 50%;
    left: -20px;
    width: 20px;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(247,242,234,0.95), transparent);
    transform: translateY(-50%);
    animation: schematic-outcome-flow 3.2s linear infinite;
  }

  .schematic-outcome-port {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 8px 14px;
    border-radius: 10px;
    border: 1px solid rgba(20,184,166,0.35);
    background: linear-gradient(180deg, rgba(20,184,166,0.15), rgba(20,184,166,0.04));
    position: relative;
  }

  .schematic-outcome-port::before {
    content: '▸';
    position: absolute;
    left: -10px;
    top: 50%;
    transform: translateY(-50%);
    color: rgba(20,184,166,0.95);
    font-size: 12px;
  }

  .schematic-outcome-port strong {
    font-family: ${SERIF};
    font-size: 15px;
    letter-spacing: -0.01em;
    color: ${CREAM};
  }

  .schematic-outcome-port small {
    margin-top: 2px;
    font-family: ${MONO};
    font-size: 9px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.68);
  }

  @keyframes schematic-agent-pulse {
    0%, 100% { opacity: 0.7; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.15); }
  }

  @keyframes schematic-gate-pulse {
    0%, 100% { box-shadow: 0 0 0 4px rgba(20,184,166,0.05), inset 0 0 12px rgba(20,184,166,0.1); }
    50% { box-shadow: 0 0 0 6px rgba(20,184,166,0.14), inset 0 0 16px rgba(20,184,166,0.2); }
  }

  @keyframes schematic-phase-flow {
    0% { left: 6%; opacity: 0; }
    5% { opacity: 1; }
    95% { opacity: 1; }
    100% { left: 94%; opacity: 0; }
  }

  @keyframes schematic-tick {
    0%, 100% { opacity: 0.3; }
    50% { opacity: 0.95; }
  }

  @keyframes schematic-promote {
    0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.7; }
    50% { transform: translateX(-50%) translateY(-2px); opacity: 1; }
  }

  @keyframes schematic-outcome-flow {
    0% { left: -20px; }
    100% { left: 100%; }
  }

  @media (prefers-reduced-motion: reduce) {
    .schematic-agent-dot,
    .schematic-phase-flow,
    .schematic-phase-circle,
    .schematic-spine-bar span,
    .schematic-knowledge-arrow::after,
    .schematic-outcome-line::after {
      animation: none !important;
    }
    .schematic-spine-bar span { opacity: 0.6; }
  }

  .dark-stage {
    padding: 36px 30px 32px;
    border-radius: 32px;
    background: linear-gradient(180deg, ${DARK_PANEL}, ${DARK});
    box-shadow: 0 30px 90px rgba(23,20,17,0.16);
    color: ${CREAM};
  }

  .layer-stack {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 16px;
    margin-top: 28px;
    padding-left: 34px;
  }

  .layer-flow-rail {
    position: absolute;
    left: 8px;
    top: 18px;
    bottom: 18px;
    width: 2px;
    background: linear-gradient(180deg, rgba(20,184,166,0.22), rgba(90,166,248,0.18));
  }

  .layer-flow-rail span {
    position: absolute;
    left: -5px;
    width: 12px;
    height: 12px;
    border-radius: 999px;
    background: ${TEAL};
    box-shadow: 0 0 18px rgba(20,184,166,0.4);
    animation: flow 7.2s linear infinite;
  }

  .layer-flow-rail span:nth-child(1) { top: 4%; }
  .layer-flow-rail span:nth-child(2) { top: 36%; animation-delay: 1.6s; }
  .layer-flow-rail span:nth-child(3) { top: 70%; animation-delay: 3.2s; }

  .layer-band {
    display: grid;
    gap: 18px;
    grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
    padding: 24px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    background:
      radial-gradient(circle at right top, rgba(20,184,166,0.12), transparent 24%),
      rgba(255,255,255,0.035);
    backdrop-filter: blur(10px);
  }

  .layer-band-title {
    margin-top: 8px;
    font-family: ${SERIF};
    font-size: clamp(34px, 3vw, 54px);
    line-height: 0.96;
    letter-spacing: -0.04em;
    color: ${CREAM};
  }

  .layer-band-copy {
    margin: 12px 0 0;
    max-width: 680px;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(247,242,234,0.74);
  }

  .layer-band-panel {
    padding: 18px;
    border-radius: 20px;
    border: 1px solid rgba(20,184,166,0.18);
    background: rgba(255,255,255,0.04);
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .layer-band-metric {
    font-family: ${SERIF};
    font-size: 38px;
    line-height: 0.96;
    letter-spacing: -0.04em;
    color: ${CREAM};
  }

  .layer-band-rule {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    font-size: 14px;
    line-height: 1.6;
    color: rgba(247,242,234,0.72);
  }

  .counter-list {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-family: ${MONO};
    font-size: 11px;
    letter-spacing: 0.04em;
    color: ${TEAL};
  }

  .token-row {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 16px;
  }

  .dark-token {
    display: inline-block;
    padding: 6px 10px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.05);
    color: rgba(247,242,234,0.76);
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.04em;
  }

  .dark-token-quiet {
    background: rgba(255,255,255,0.03);
    color: rgba(247,242,234,0.62);
  }

  .phase-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    margin-top: 28px;
  }

  .phase-card {
    padding: 22px;
    border: 1px solid ${LINE};
    border-radius: 22px;
    background: linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,253,252,0.98));
    box-shadow: 0 18px 40px rgba(23,20,17,0.05);
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .phase-label {
    font-family: ${SERIF};
    font-size: 34px;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: ${INK};
  }

  .phase-block {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .phase-warning {
    margin-top: auto;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid rgba(213,155,106,0.28);
    background: rgba(213,155,106,0.08);
    color: ${INK_SOFT};
    font-size: 14px;
    line-height: 1.65;
  }

  .phase-warning span {
    display: block;
    margin-bottom: 8px;
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${AMBER};
    font-weight: 700;
  }

  .agent-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
    margin-top: 28px;
  }

  .agent-card {
    position: relative;
    overflow: hidden;
    border-radius: 24px;
    border: 1px solid rgba(255,255,255,0.06);
    background: linear-gradient(180deg, ${DARK_PANEL}, ${DARK});
    box-shadow: 0 24px 70px rgba(23,20,17,0.14);
    color: ${CREAM};
  }

  .agent-card-bg {
    position: absolute;
    inset: 0;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--agent-accent) 30%, transparent), transparent 28%),
      linear-gradient(135deg, rgba(255,255,255,0.04), transparent 46%);
    opacity: 0.9;
    animation: glow 10s ease-in-out infinite;
  }

  .agent-card-main {
    position: relative;
    z-index: 1;
    display: grid;
    gap: 16px;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    padding: 24px;
  }

  .agent-id {
    display: flex;
    flex-direction: column;
  }

  .agent-eyebrow {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--agent-accent);
  }

  .agent-name {
    margin-top: 10px;
    font-family: ${SERIF};
    font-size: 48px;
    line-height: 0.92;
    letter-spacing: -0.05em;
  }

  .agent-role {
    margin: 14px 0 0;
    font-size: 16px;
    line-height: 1.65;
    color: rgba(247,242,234,0.78);
  }

  .agent-behavior {
    display: grid;
    gap: 14px;
  }

  .agent-panel {
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
  }

  .agent-panel-refusal {
    border-color: rgba(213,155,106,0.24);
    background: rgba(213,155,106,0.08);
  }

  .agent-panel-label {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: rgba(247,242,234,0.62);
    font-weight: 700;
  }

  .agent-panel-label-amber {
    color: ${AMBER};
  }

  .agent-list {
    margin: 12px 0 0;
    padding-left: 18px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    font-size: 14px;
    line-height: 1.62;
    color: rgba(247,242,234,0.84);
  }

  .asset-grid {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    margin-top: 28px;
  }

  .asset-card {
    padding: 22px;
    border-radius: 24px;
    border: 1px solid ${LINE};
    background: linear-gradient(180deg, ${PANEL_BG}, rgba(255,252,248,0.94));
    box-shadow: 0 18px 42px rgba(23,20,17,0.05);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .asset-card-top {
    display: grid;
    gap: 16px;
    grid-template-columns: minmax(0, 1fr) 128px;
    align-items: start;
  }

  .asset-primary {
    margin-top: 8px;
    font-family: ${SERIF};
    font-size: 44px;
    line-height: 0.94;
    letter-spacing: -0.045em;
    color: ${INK};
  }

  .asset-secondary {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 7px;
    font-family: ${MONO};
    font-size: 11px;
    color: ${INK_MUTED};
    letter-spacing: 0.03em;
  }

  .asset-body {
    margin: 0;
    font-size: 15px;
    line-height: 1.65;
    color: ${INK_SOFT};
  }

  .asset-footer {
    margin-top: auto;
    padding-top: 12px;
    border-top: 1px solid ${LINE};
    font-size: 14px;
    line-height: 1.6;
    color: ${INK_MUTED};
  }

  .asset-visual {
    position: relative;
    width: 128px;
    height: 128px;
    border-radius: 24px;
    border: 1px solid rgba(23,20,17,0.1);
    background:
      radial-gradient(circle at top right, rgba(20,184,166,0.2), transparent 30%),
      linear-gradient(180deg, rgba(23,20,17,0.04), rgba(23,20,17,0.01));
    overflow: hidden;
  }

  .sparkline-bars {
    position: absolute;
    inset: 18px;
    display: flex;
    align-items: end;
    gap: 6px;
  }

  .sparkline-bars span {
    flex: 1;
    border-radius: 999px 999px 8px 8px;
    background: linear-gradient(180deg, rgba(90,166,248,0.8), rgba(20,184,166,0.86));
    animation: rise 6s ease-in-out infinite;
  }

  .sparkline-bars span:nth-child(2n) { animation-delay: 0.6s; }
  .sparkline-bars span:nth-child(3n) { animation-delay: 1.2s; }

  .radar-ring {
    position: absolute;
    inset: 50%;
    border-radius: 999px;
    border: 1px solid rgba(20,184,166,0.22);
    transform: translate(-50%, -50%);
  }

  .radar-ring-1 { width: 54px; height: 54px; }
  .radar-ring-2 { width: 92px; height: 92px; }

  .radar-pulse {
    position: absolute;
    top: 24px;
    right: 28px;
    width: 16px;
    height: 16px;
    border-radius: 999px;
    background: ${TEAL};
    box-shadow: 0 0 0 0 rgba(20,184,166,0.35);
    animation: radar 2.8s ease-out infinite;
  }

  .chain {
    display: grid;
    place-items: center;
  }

  .chain span {
    position: absolute;
    top: 50%;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    border: 2px solid ${TEAL};
    transform: translateY(-50%);
  }

  .chain span::after {
    content: '';
    position: absolute;
    top: 50%;
    left: calc(100% + 2px);
    width: 18px;
    height: 2px;
    background: rgba(20,184,166,0.42);
    transform: translateY(-50%);
  }

  .chain span:nth-child(1) { left: 18px; }
  .chain span:nth-child(2) { left: 44px; }
  .chain span:nth-child(3) { left: 70px; }
  .chain span:nth-child(4) { left: 96px; }
  .chain span:nth-child(4)::after { display: none; }

  .publication {
    display: grid;
    place-items: center;
  }

  .publication-cover {
    width: 76px;
    height: 96px;
    border-radius: 12px;
    background: linear-gradient(180deg, rgba(20,184,166,0.2), rgba(90,166,248,0.16));
    border: 1px solid rgba(23,20,17,0.08);
    box-shadow: 0 18px 30px rgba(23,20,17,0.12);
    padding: 14px 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .publication-line {
    height: 6px;
    border-radius: 999px;
    background: rgba(23,20,17,0.18);
  }

  .publication-line-short {
    width: 58%;
  }

  .boundary-stack {
    display: grid;
    gap: 18px;
    grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
    margin-top: 28px;
  }

  .boundary-column {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .boundary-column-title {
    font-family: ${SERIF};
    font-size: 36px;
    line-height: 0.98;
    letter-spacing: -0.04em;
    color: ${CREAM};
  }

  .boundary-row {
    display: grid;
    gap: 14px;
    grid-template-columns: 84px 1fr;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: rgba(247,242,234,0.84);
    font-size: 15px;
    line-height: 1.62;
  }

  .boundary-row-not {
    border-color: rgba(213,155,106,0.22);
    background: rgba(213,155,106,0.08);
  }

  .boundary-tag {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${TEAL};
    font-weight: 700;
  }

  .boundary-tag-not {
    color: ${AMBER};
  }

  .composition-shell {
    margin-top: 26px;
    padding: 24px;
    border-radius: 26px;
    border: 1px solid ${LINE};
    background:
      linear-gradient(180deg, rgba(255,255,255,0.84), rgba(255,253,252,0.98)),
      radial-gradient(circle at top right, rgba(20,184,166,0.12), transparent 26%);
    box-shadow: 0 18px 48px rgba(23,20,17,0.06);
  }

  .composition-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  }

  .composition-tile {
    padding: 18px;
    border-radius: 18px;
    border: 1px solid ${LINE};
    background: rgba(255,255,255,0.76);
  }

  .composition-tile-label {
    font-family: ${MONO};
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${INK_MUTED};
  }

  .composition-tile-value { 
    margin-top: 10px;
    font-size: 15px;
    line-height: 1.65;
    color: ${INK_SOFT};
  }

  .comparison-stage {
    padding: 6px 0 0;
  }

  .comparison-shell {
    overflow-x: auto;
    margin-top: 26px;
    border-radius: 24px;
    border: 1px solid ${LINE};
    background: ${PANEL_BG};
    box-shadow: 0 18px 44px rgba(23,20,17,0.05);
  }

  @keyframes drift {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(18px, -14px, 0); }
  }

  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 0.9; }
    50% { transform: scale(1.04); opacity: 0.55; }
  }

  @keyframes traverse {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(4px, -6px, 0); }
  }

  @keyframes flow {
    0% { transform: translateY(0); opacity: 0.4; }
    50% { opacity: 1; }
    100% { transform: translateY(12px); opacity: 0.4; }
  }

  @keyframes glow {
    0%, 100% { transform: scale(1); opacity: 0.88; }
    50% { transform: scale(1.03); opacity: 1; }
  }

  @keyframes rise {
    0%, 100% { transform: scaleY(0.94); opacity: 0.8; }
    50% { transform: scaleY(1.08); opacity: 1; }
  }

  @keyframes radar {
    0% { box-shadow: 0 0 0 0 rgba(20,184,166,0.34); }
    100% { box-shadow: 0 0 0 22px rgba(20,184,166,0); }
  }

  @media (max-width: 1180px) {
    .platform-hero {
      grid-template-columns: 1fr;
      padding: 48px 30px 36px;
    }

    .platform-hero-visual {
      min-height: 460px;
    }

    .layer-band,
    .agent-card-main {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 820px) {
    .phase-grid,
    .asset-grid,
    .agent-grid,
    .boundary-stack {
      grid-template-columns: 1fr;
    }

    .asset-card-top {
      grid-template-columns: 1fr;
    }

    .boundary-row {
      grid-template-columns: 1fr;
    }

    .constellation-grid {
      grid-template-columns: 1fr;
      min-height: unset;
    }

    .constellation-center {
      min-height: 220px;
    }

    .dark-stage,
    .comparison-stage {
      padding-left: 0;
      padding-right: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .platform-orb,
    .constellation-ring,
    .constellation-node,
    .layer-flow-rail span,
    .agent-card-bg,
    .sparkline-bars span,
    .radar-pulse {
      animation: none !important;
    }

    .toc-link {
      transition: none;
    }
  }
`;
