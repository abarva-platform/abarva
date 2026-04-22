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
import { PageShell } from '@/components/shared/layout/PageShell';
import { PageTitle } from '@/components/shared/typography/PageTitle';
import { SectionHeading } from '@/components/shared/typography/SectionHeading';
import { EyebrowLabel } from '@/components/shared/typography/EyebrowLabel';
import { Body } from '@/components/shared/typography/Body';
import { MetaLabel } from '@/components/shared/typography/MetaLabel';
import { EntityLink } from '@/components/shared/entities/EntityLink';
import { COLORS } from '@/lib/design-system';

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

// ─── Page ─────────────────────────────────────────────────────────────

export default function PlatformPage() {
  return (
    <PageShell width="wide" padding="spacious">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 48 }}>
        {/* Header */}
        <header style={{ maxWidth: 900 }}>
          <EyebrowLabel tone="teal" size="sm">PLATFORM</EyebrowLabel>
          <PageTitle size="display" style={{ marginTop: 8 }}>
            Transformation infrastructure with refusals.
          </PageTitle>
          <Body size="lg" tone="secondary" style={{ marginTop: 14, maxWidth: 780 }}>
            Seven architectural layers · four agents with defined refusals · outcome economics that make attribution auditable.
            Built for organizations that treat transformation as accountable work, not consulting theater.
          </Body>
          <div style={{ marginTop: 18 }}>
            <SectionLinkTOC />
          </div>
        </header>

        {/* Section 1 · Knowledge architecture */}
        <section id="knowledge-architecture" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">KNOWLEDGE ARCHITECTURE · 3 LAYERS</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 24 }}>
            Knowledge that compounds across every program.
          </SectionHeading>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {KNOWLEDGE_LAYERS.map((layer) => (
              <article
                key={layer.name}
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(45,212,200,0.18)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div>
                  <EyebrowLabel tone="muted" size="xs">{layer.scope}</EyebrowLabel>
                  <div style={{ marginTop: 8, fontFamily: 'Georgia, serif', fontSize: 22, color: COLORS.textPrimary, letterSpacing: '-0.005em' }}>
                    {layer.name}
                  </div>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {layer.counters.map((c) => (
                    <li key={c} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: COLORS.teal, letterSpacing: '0.04em' }}>
                      · {c}
                    </li>
                  ))}
                </ul>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {layer.artifacts.map((a) => (
                    <span
                      key={a}
                      style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '0.5px solid rgba(255,255,255,0.1)',
                        borderRadius: 6,
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10,
                        color: 'rgba(245,245,240,0.75)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
                <Body size="sm" tone="muted" style={{ fontStyle: 'italic', lineHeight: 1.55 }}>
                  Not — {layer.whatThisIsNot}
                </Body>
              </article>
            ))}
          </div>
        </section>

        {/* Section 2 · Methodology */}
        <section id="methodology" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">METHODOLOGY · 5 PHASES · HARD GATES</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 24 }}>
            Transformation has a shape. We enforce it.
          </SectionHeading>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {PHASES.map((phase) => (
              <article
                key={phase.phase}
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderLeft: `3px solid ${COLORS.teal}`,
                  borderRadius: 10,
                  display: 'grid',
                  gap: 14,
                  gridTemplateColumns: '180px 1fr',
                }}
              >
                <div>
                  <EyebrowLabel tone="teal" size="xs">PHASE</EyebrowLabel>
                  <div style={{ marginTop: 4, fontFamily: 'Georgia, serif', fontSize: 22, color: COLORS.textPrimary, letterSpacing: '-0.005em' }}>
                    {phase.phase}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <KeyValue k="Entry" v={phase.entry} />
                  <KeyValue k="Deliverables" v={phase.deliverables.join(' · ')} />
                  <KeyValue k="Exit gate" v={phase.exit} bold />
                  <div
                    style={{
                      marginTop: 4,
                      padding: '10px 12px',
                      background: 'rgba(245,158,11,0.06)',
                      borderLeft: `2px solid ${COLORS.amber}`,
                      borderRadius: 4,
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 11.5,
                      color: 'rgba(245,245,240,0.85)',
                      letterSpacing: '0.02em',
                      lineHeight: 1.55,
                      fontStyle: 'italic',
                    }}
                  >
                    <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.14em', color: COLORS.amber, fontSize: 9, marginBottom: 4, fontStyle: 'normal' }}>
                      What cannot pass
                    </span>
                    {phase.cannotPass}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Section 3 · Agents with refusals */}
        <section id="agents" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">AGENTS · 4 SPECIALISTS · DEFINED REFUSALS</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 24 }}>
            What our agents won&apos;t do is what makes them useful.
          </SectionHeading>
          <div style={{ display: 'grid', gap: 14, gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))' }}>
            {AGENTS.map((agent) => (
              <article
                key={agent.name}
                style={{
                  padding: 20,
                  background: 'rgba(255,255,255,0.02)',
                  border: '0.5px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <div>
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: COLORS.teal, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                    {agent.name}
                  </div>
                  <Body size="md" tone="primary" style={{ marginTop: 4 }}>
                    {agent.role}
                  </Body>
                </div>
                <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {agent.refusals.map((r, i) => (
                    <li
                      key={i}
                      style={{
                        fontFamily: 'DM Sans, sans-serif',
                        fontSize: 13.5,
                        color: COLORS.textPrimary,
                        lineHeight: 1.55,
                        paddingLeft: 28,
                        position: 'relative',
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          position: 'absolute',
                          left: 0,
                          top: 3,
                          width: 20,
                          fontFamily: 'JetBrains Mono, monospace',
                          fontSize: 11,
                          color: COLORS.teal,
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

        {/* Section 4 · Compounding assets */}
        <section id="compounding-assets" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">COMPOUNDING ASSETS · LIVE</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 24 }}>
            Four assets that get more valuable with every program.
          </SectionHeading>
          <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            {COMPOUNDING.map((asset) => (
              <article
                key={asset.name}
                style={{
                  padding: 22,
                  background: 'rgba(45,212,200,0.04)',
                  border: '0.5px solid rgba(45,212,200,0.2)',
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                <EyebrowLabel tone="teal" size="xs">{asset.name.toUpperCase()}</EyebrowLabel>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: COLORS.teal, letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                  {asset.primary}
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {asset.secondary.map((s) => (
                    <li key={s} style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.75)', letterSpacing: '0.02em' }}>
                      · {s}
                    </li>
                  ))}
                </ul>
                <Body size="sm" tone="secondary" style={{ fontStyle: 'italic', lineHeight: 1.55 }}>
                  {asset.whyCompounds}
                </Body>
              </article>
            ))}
          </div>
        </section>

        {/* Section 5 · Outcome economics worked example */}
        <section id="outcome-economics" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">PRICING · OUTCOME ECONOMICS · 30%</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 14 }}>
            We&apos;re paid only after measured outcomes.
          </SectionHeading>
          <Body size="sm" tone="muted" style={{ marginBottom: 24, maxWidth: 760 }}>
            Worked example · Morrison Owned Brand Margin Recovery (composite organization built from real-world data).
          </Body>
          <div style={{ display: 'grid', gap: 12, maxWidth: 860 }}>
            <FinancialRow label="Investment · AbarVa platform cost (Y1)" amount="$5.2M" note="Paid by client · regardless of outcome. Covers tenant provisioning, agent operations, cross-program intelligence access, evidence infrastructure." />
            <FinancialRow label="Modeled return" amount="$99M central · $73M-$128M range" note="Basis · Diagnostic Findings v4 + Business Case v3 · Genome analogous program library (n=14) supports range." />
            <FinancialRow label="Realized outcome at Phase 4" amount="$87M (annualized)" note="Measurement basis · Outcome Measurement Report (D19) with attribution analysis · auditor sign-off obtained." />
            <FinancialRow label="AbarVa settlement · 30% of attributable measured lift" amount="$26.1M" note="Settlement basis · Outcome Baseline (locked Phase 2) · Outcome Measurement · Attribution Analysis · settled 90 days post-Phase 4." bold />
          </div>

          <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 820 }}>
            <EyebrowLabel tone="muted" size="xs" style={{ letterSpacing: '0.14em' }}>WHAT THIS MEANS</EyebrowLabel>
            <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
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

        {/* Section 6 · Composability */}
        <section id="composability" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">ARCHITECTURE · GENERATIVE</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 14 }}>
            17 modules × 5 archetypes × 4 tenants × 9 solutions = 30,600 unique program shapes.
          </SectionHeading>
          <Body size="md" tone="secondary" style={{ maxWidth: 820, lineHeight: 1.6 }}>
            Programs are not products. The platform is generative, not a fixed product surface. Each program composes the modules, archetypes, and solutions it needs and rejects what it doesn&apos;t.
            With Maestro custom-path generation, the space is effectively unbounded.
          </Body>

          <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 12, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1100 }}>
            <EyebrowLabel tone="muted" size="xs">WORKED COMPOSITION · MORRISON OWNED BRAND MARGIN RECOVERY</EyebrowLabel>
            <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
              <KeyValue k="Archetype" v="Operational Optimization" />
              <KeyValue k="Solution match" v="Retail × Middle Office × Optimize" />
              <KeyValue k="Modules active" v="Hypothesis Tree · Workstream Charter (×3) · Evidence Ledger · Pattern Match (Sentinel) · Decision Brief · Intervention Charter (×2) · Business Case · Operating Review Rhythm · Early Warning Dashboard · Outcome Baseline · Outcome Measurement · Genome Contribution" />
              <KeyValue k="Customization" v="Q3 2026 contracting cycle window forced custom Phase 3 timeline · F022 active pattern triggered joint sponsor turn protocol." />
            </div>
          </div>
        </section>

        {/* Section 7 · Comparison table */}
        <section id="comparison" style={{ scrollMarginTop: 40 }}>
          <EyebrowLabel tone="teal" size="sm">COMPARISON · CATEGORY POSITIONING</EyebrowLabel>
          <SectionHeading size="lg" style={{ marginTop: 10, marginBottom: 24 }}>
            Where we win. Where we don&apos;t compete.
          </SectionHeading>
          <div style={{ overflowX: 'auto', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10, background: 'rgba(255,255,255,0.02)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
              <thead>
                <tr>
                  <th style={headStyle}>Dimension</th>
                  <th style={headStyle}>Top-3 consulting firm engagement model</th>
                  <th style={headStyle}>Modern data stack tool</th>
                  <th style={headStyle}>RPA platform</th>
                  <th style={{ ...headStyle, color: COLORS.teal }}>AbarVa</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={row.dimension}>
                    <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dimension}</td>
                    <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.consulting}</td>
                    <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.dataStack}</td>
                    <td style={{ ...cellStyle, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.rpa}</td>
                    <td style={{ ...cellStyle, color: COLORS.teal, fontWeight: 500, ...(i === COMPARISON.length - 1 ? rowAccent : {}) }}>{row.abarva}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MetaLabel style={{ marginTop: 14, display: 'block' }}>
            Structural-class column labels · we don&apos;t name specific competitor firms or tools. The &quot;where AbarVa explicitly does NOT compete&quot; row is the trust move · it tells you where to go for those needs.
          </MetaLabel>
        </section>

        {/* Closing · operator admin link */}
        <footer style={{ marginTop: 20, paddingTop: 24, borderTop: '0.5px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <MetaLabel>
            Platform operators · the admin hub lives at <EntityLink href="/platform/admin" variant="inline">/platform/admin</EntityLink>.
          </MetaLabel>
          <MetaLabel>
            Composite organizations (Apex Retail, Meridian Health, First Capital, Keystone Energy, Morrison) are built from real-world data.
          </MetaLabel>
        </footer>
      </div>
    </PageShell>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────

function KeyValue({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div>
      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: 'rgba(45,212,200,0.85)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>
        {k}
      </span>
      <Body size="md" tone="primary" weight={bold ? 500 : 400} style={{ marginTop: 4 }}>
        {v}
      </Body>
    </div>
  );
}

function FinancialRow({ label, amount, note, bold }: { label: string; amount: string; note: string; bold?: boolean }) {
  return (
    <div
      style={{
        padding: bold ? 20 : 16,
        background: bold ? 'rgba(45,212,200,0.08)' : 'rgba(255,255,255,0.02)',
        border: `0.5px solid ${bold ? COLORS.teal : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 10,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 20,
        alignItems: 'baseline',
      }}
    >
      <div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: 'rgba(245,245,240,0.85)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          {label}
        </div>
        <Body size="sm" tone="secondary" style={{ marginTop: 6, lineHeight: 1.55, maxWidth: 640 }}>
          {note}
        </Body>
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: bold ? 32 : 24, color: bold ? COLORS.teal : COLORS.textPrimary, letterSpacing: '-0.005em', whiteSpace: 'nowrap' }}>
        {amount}
      </div>
    </div>
  );
}

function WhyColumn({ title, body }: { title: string; body: string }) {
  return (
    <div style={{ padding: 16, background: 'rgba(255,255,255,0.02)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 10 }}>
      <EyebrowLabel tone="teal" size="xs">{title.toUpperCase()}</EyebrowLabel>
      <Body size="sm" tone="secondary" style={{ marginTop: 8, lineHeight: 1.55 }}>{body}</Body>
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
            padding: '6px 12px',
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(45,212,200,0.2)',
            borderRadius: 999,
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 10,
            color: 'rgba(245,245,240,0.75)',
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
  background: 'rgba(10,10,10,0.5)',
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 10,
  color: 'rgba(245,245,240,0.75)',
  letterSpacing: '0.14em',
  textTransform: 'uppercase',
  borderBottom: '0.5px solid rgba(45,212,200,0.25)',
  whiteSpace: 'nowrap',
};

const cellStyle: CSSProperties = {
  padding: '14px 14px',
  fontFamily: 'DM Sans, sans-serif',
  fontSize: 13,
  color: 'rgba(245,245,240,0.85)',
  lineHeight: 1.55,
  borderBottom: '0.5px solid rgba(255,255,255,0.05)',
  verticalAlign: 'top',
};

const rowAccent: CSSProperties = {
  background: 'rgba(245,158,11,0.04)',
  fontStyle: 'italic',
};

const mean: CSSProperties = {
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.02)',
  border: '0.5px solid rgba(45,212,200,0.12)',
  borderRadius: 6,
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 12,
  color: 'rgba(245,245,240,0.9)',
  letterSpacing: '0.02em',
};
