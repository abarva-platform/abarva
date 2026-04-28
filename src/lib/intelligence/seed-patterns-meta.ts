import type { PatternSeed } from './seed-types';

const META_PATTERN_CREATED_AT = '2026-04-24';
const META_PATTERN_SOURCE_DOCUMENTS = [
  'docs/source-material/pattern-library-package/abarva-pattern-library-vision-catalog-template-m1.md',
  'docs/source-material/pattern-library-package/abarva-meta-patterns-m2-m6.md',
] as const;

const META_COMMON = {
  domain: 'meta',
  tier: 'M',
  vertical: 'cross-industry',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  confidence: 0.9,
  createdFrom: 'human_authored',
  createdBy: 'founder',
  createdAt: META_PATTERN_CREATED_AT,
  sourceDocuments: [...META_PATTERN_SOURCE_DOCUMENTS],
  regulatoryChips: [],
  taggedContradictionIds: [],
} satisfies Omit<
  PatternSeed,
  | 'id'
  | 'slug'
  | 'title'
  | 'thesis'
  | 'applicability'
  | 'instanceCount'
  | 'relatedPatternIds'
  | 'derivedFromPatternIds'
  | 'body'
>;

export const META_PATTERNS: PatternSeed[] = [
  {
    ...META_COMMON,
    id: 'PAT-META-M1',
    slug: 'six-phase-engagement-architecture',
    title: 'The Six-Phase Engagement Architecture',
    thesis:
      'Every enterprise AI program must run through six disciplined phases with four hard gates and two CXO touchpoints to produce decision-grade outcomes and measured realization.',
    applicability:
      'Applies to all enterprise AI transformation programs regardless of industry, archetype, or scale. Required operating framework for AbarVa engagements.',
    instanceCount: 6,
    relatedPatternIds: ['PAT-META-M2', 'PAT-META-M3', 'PAT-META-M5', 'PAT-META-M6'],
    derivedFromPatternIds: ['PAT-META-M2', 'PAT-META-M3', 'PAT-META-M5', 'PAT-META-M6'],
    body: `## Summary
Every AbarVa program runs through Origination, Charter, Diagnose, Design, Execute, and Verify. The source document fixes four hard gates between phases, requires exactly two CXO touchpoints, and positions Phase 6 reconciliation as the accountability mechanism that traditional consulting lacks.

## When to apply
Use this pattern for cross-functional enterprise AI transformation programs with executive sponsorship, meaningful budget, or explicit outcome commitments. Do not use it for ad-hoc advisory conversations, point-solution tool installs without transformation scope, or internal evaluations that never enter a program structure.

## How it works
Origination captures the problem and matches it to the library. Charter sets stakeholders, success criteria, and baseline data requests. Diagnose combines the diagnostic instrument, contradiction surfacing, and CXO interview before findings publish. Design maps findings to solution choices, vendor evaluation, tradeoff framing, and a projected-value business case. Execute tracks implementation and change management. Verify reconciles realized outcomes against the Phase 4 projection and feeds observations back into the library.

## Variations
The phase order is invariant, but module depth varies by archetype and scope. Charter and Verify transitions are soft gates with documented handoffs, while Charter sign-off, completed diagnosis interview, approved design, and verified outcome measurement are hard gates. Program durations vary from hours in Origination to quarters in Execute and Verify.

## Pitfalls
The source calls out four recurring failures: compressing Charter or Diagnose under timeline pressure, treating soft gates as optional, skipping the second CXO validation in Design, and reducing Verify to narrative self-report rather than a measured ledger.

## Instances
Concrete instances in the source are the six named phases themselves. The pattern is also described as the predecessor architecture for M2 module composition, M3 agent division, M5 deliverable tiering, and M6 outcome reconciliation.`,
  },
  {
    ...META_COMMON,
    id: 'PAT-META-M2',
    slug: 'seventeen-module-program-composition',
    title: 'The Seventeen-Module Program Composition',
    thesis:
      'Every AbarVa program composes from a canonical library of seventeen modules, selected by archetype, mapped to phases, so programs are structurally consistent yet shape-adaptive.',
    applicability:
      'Applies to every AbarVa engagement. The seventeen-module library is the compositional primitive from which all program shapes derive.',
    instanceCount: 17,
    relatedPatternIds: ['PAT-META-M1', 'PAT-META-M3', 'PAT-META-M5'],
    derivedFromPatternIds: ['PAT-META-M1', 'PAT-META-M3', 'PAT-META-M5'],
    body: `## Summary
This pattern standardizes program work into a canonical seventeen-module library spanning framing, diagnosis, design, execution, and benefits realization. The source defines three shape classes: Template programs activate all seventeen modules for novel problems, Pattern programs preload a matched subset from the library, and Custom programs blend canonical modules with specialized extensions.

## When to apply
Use this pattern for every AbarVa engagement that has entered the phase architecture. It is the default composition model whenever a client problem has to be converted into modules, deliverables, and phase work. It does not apply to lightweight advisory interactions that never become a program.

## How it works
Maestro Intake classifies the archetype, tests whether the problem matches an existing pattern, and selects a Template, Pattern, or Custom shape. The canonical modules then anchor problem framing, stakeholder mapping, success criteria, data requests, diagnostics, contradiction surfacing, CXO interview capture, solution matching, vendor evaluation, tradeoff framing, business case modeling, implementation planning, build tracking, change management, outcome measurement, and Genome feedback.

## Variations
The source gives a stable distribution: approximately 15 percent Template, 70 percent Pattern, and 15 percent Custom. Pattern shape programs preload roughly 50 to 70 percent of content from an existing match, while Custom shape programs retain canonical modules but add specialized work such as persona productivity models or custom value leakage analysis.

## Pitfalls
The authored failure modes are checklist-level modules, uncontrolled proliferation of specialized custom modules, contested boundaries between adjacent modules, and overreliance on preloaded content that causes deliverables to feel generic instead of client-specific.

## Instances
The concrete instances are the seventeen canonical modules named in the source, from Problem Framing through Benefits Realization plus Genome Feedback. The pattern is explicitly positioned between M1 phase sequencing, M3 agent labor division, and M5 deliverable expectations.`,
  },
  {
    ...META_COMMON,
    id: 'PAT-META-M3',
    slug: 'four-agent-division-of-labor',
    title: 'The Four-Agent Division of Labor',
    thesis:
      'AbarVa delivers intelligence through four named agents with distinct voices, zones, and retrieval scopes: Nexus runs programs, Sentinel holds the library, Atlas reads the portfolio, and Steward enforces integrity.',
    applicability:
      'Applies to every interaction with the AbarVa platform. Each agent is anchored to a specific product zone and speaks in a specific voice.',
    instanceCount: 4,
    relatedPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M4', 'PAT-META-M6'],
    derivedFromPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M4', 'PAT-META-M6'],
    body: `## Summary
The source formalizes a four-agent operating model that mirrors an elite consulting team: Nexus is the maestro-collegial program lead, Sentinel is the research-rigorous library holder, Atlas is the executive-concise portfolio editor, and Steward is the operationally terse integrity enforcer. Each agent owns a zone, a voice contract, and a retrieval scope.

## When to apply
Use this pattern whenever work is happening inside a product zone with an active agent surface. Programs anchor to Nexus, Intelligence to Sentinel, Tower to Atlas, and Admin to Steward. It does not apply to public marketing surfaces where no agent is active.

## How it works
Zone context determines the default agent. Program execution, chartering, and pressure-testing route through Nexus. Library walkthroughs and evidence depth route through Sentinel. Portfolio synthesis and pressure-card composition route through Atlas. Operational audits, compliance, and integrity checks route through Steward. Cross-zone work is handled by explicit handoff rather than a blended generic persona.

## Variations
The structure is fixed at four agents, but the same enterprise can encounter all four in one journey as it moves from a single program to portfolio oversight and then to admin governance. The user can trigger handoffs, but the source keeps the voice and scope boundaries stable.

## Pitfalls
The authored pattern warns against collapsing everything into a single agent, letting zones drift away from their anchored voice, or hiding handoffs so users cannot tell whether they are receiving program, library, portfolio, or operations intelligence.

## Instances
The concrete instances are the four named agents themselves. The source explicitly ties them to the four core product zones and describes the pattern as the staffing model that makes M4 Tower synthesis and M6 reconciliation credible.`,
  },
  {
    ...META_COMMON,
    id: 'PAT-META-M4',
    slug: 'five-dimension-control-tower',
    title: 'The Five-Dimension Control Tower',
    thesis:
      'Enterprise AI portfolios require a five-dimension executive view: Use Cases, Contradictions, Unowned Risks, Spend Trajectory, and Last-Turn-Ago, composed by Atlas into pressure analysis that a CIO can act on quickly.',
    applicability:
      'Applies to every tenant with two or more active AbarVa programs. Single-program tenants do not yet need Tower; aggregation begins at portfolio scale.',
    instanceCount: 5,
    relatedPatternIds: ['PAT-META-M1', 'PAT-META-M3', 'PAT-META-M6'],
    derivedFromPatternIds: ['PAT-META-M1', 'PAT-META-M3', 'PAT-META-M6'],
    body: `## Summary
The Tower pattern turns portfolio-level AI signals into an executive surface that Atlas can summarize in under thirty seconds. The five required dimensions are Use Cases, Contradictions, Unowned Risks, Spend Trajectory, and Last-Turn-Ago, each with a dedicated measurement lens and drill-in path.

## When to apply
Use this pattern once a tenant has multiple active AbarVa programs and a CIO, CAIO, CTO, or similar executive needs cross-program visibility. The source is explicit that Tower is not meaningful for single-program tenants or purely operator-level workflows.

## How it works
Use Cases track inventory, phase state, and value ranges. Contradictions surface cross-program truth gaps and their impact. Unowned Risks expose governance holes such as shadow AI or missing ownership. Spend Trajectory compares AI-related spend by program, vendor, and capability against budget. Last-Turn-Ago tracks engagement velocity and stalled programs. Atlas then composes a short editorial with specific pressure calls and decision prompts across the five.

## Variations
The five dimensions are fixed, but the source allows per-tenant emphasis changes based on executive priority. It also names sub-surfaces such as Vendor Portfolio, Shadow AI Detection, Regulatory Posture, AI Council, Model Inventory, and Use Case Portfolio as extensions beneath the same top-level frame.

## Pitfalls
The authored failure modes are Atlas drifting into passive status reporting, pressure cards drilling into empty targets, misaligned dimension emphasis versus CIO priorities, and sub-surfaces becoming more important than the editorial synthesis layer itself.

## Instances
The concrete instances are the five Tower dimensions named in the source. The pattern is described as the endpoint synthesis layer built on top of M1 program signals, M3 Atlas ownership, and M6 realized-outcome feedback.`,
  },
  {
    ...META_COMMON,
    id: 'PAT-META-M5',
    slug: 'three-tier-deliverable-system',
    title: 'The Three-Tier Deliverable System',
    thesis:
      'Every AbarVa deliverable is produced at one of three tiers: Rich for hero artifacts, Outline for substantive working deliverables, and Stub for dignified scheduled placeholders, with tier selection driven by stakes, phase, and audience.',
    applicability:
      'Applies to every deliverable produced by AbarVa programs. Tier is visible in the deliverable header and no deliverable sits outside the system.',
    instanceCount: 3,
    relatedPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M6'],
    derivedFromPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M6'],
    body: `## Summary
The deliverable system encodes three deterministic tiers: Rich for board-level or million-dollar decision artifacts, Outline for substantive program outputs that do not need full hero depth, and Stub for future-phase deliverables that must preserve structure without pretending to be complete. The source fixes component counts at 12, 8, and 6 respectively.

## When to apply
Use this pattern whenever a program deliverable is rendered, reviewed, or audited. It does not apply to ad-hoc agent chat responses or operational logs that are not formal client-facing deliverables.

## How it works
Audience, decision stakes, activation status, and evidence needs determine the tier. Rich deliverables carry a full KPI strip, recommendation body, evidence links, charts, and risk framing. Outline deliverables compress that into a leaner substantive package. Stub deliverables preserve navigation, activation conditions, prerequisite links, and a structure preview so the user can see what will appear later in the phase flow.

## Variations
Default tiering follows module type: business case, decision memo, and reconciliation artifacts skew Rich; findings and implementation planning skew Outline; future-phase placeholders stay Stub until their activation conditions are met. The source also allows explicit override with documented rationale, but preserves the three-tier taxonomy as canonical.

## Pitfalls
The authored failure modes are Rich deliverables drifting to Outline depth, Stub surfaces feeling like empty coming-soon cards, proliferation of unofficial extra tiers, and missing or inconsistent tier badges that erode trust in the system.

## Instances
The concrete instances are the three named tiers themselves. The source further grounds them with component counts of 12 for Rich, 8 for Outline, and 6 for Stub, and ties them back to the phase and module system defined in M1 and M2.`,
  },
  {
    ...META_COMMON,
    id: 'PAT-META-M6',
    slug: 'dual-ledger-outcome-reconciliation',
    title: 'The Dual-Ledger Outcome Reconciliation',
    thesis:
      'Every AbarVa program reconciles Phase 4 projected value against Phase 6 realized value in a dual ledger, attributes variance to causes, and uses that reconciliation as the accountability substrate for learning and outcome-based commercial terms.',
    applicability:
      'Applies to every program that reaches Phase 6 Verify. Programs that terminate early still produce a partial ledger with explicit termination-state commentary.',
    instanceCount: 2,
    relatedPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M5'],
    derivedFromPatternIds: ['PAT-META-M1', 'PAT-META-M2', 'PAT-META-M5'],
    body: `## Summary
This pattern creates a projected value ledger during Phase 4 and a realized value ledger during Phase 6, then reconciles the two side by side. The source frames the reconciliation as the core structural difference between AbarVa and consulting because it links projected outcomes, measured outcomes, variance attribution, and fee logic in one accountable loop.

## When to apply
Use this pattern for any program that has reached Verify and has measurable post-go-live data. It also applies in partial form to terminated programs where projected value exists but realized outcomes never fully materialized. It does not apply to programs still in phases one through five.

## How it works
Phase 4 captures projected value, mechanism, timeline, assumptions, measurement instruments, and ownership. After a six-to-twelve-month measurement window, Phase 6 captures realized value, mechanism validation, assumption status, timeline actuals, and measurement quality. Variance is then attributed across scope, execution, external, or measurement causes, and the result feeds both commercial reconciliation and pattern-library learning.

## Variations
Measurement windows vary by program type, with the source calling out six-month quick wins and twelve-month enterprise deployments. The same structure also supports fixed-fee programs, where reconciliation is used for learning rather than pricing, and outcome-based programs, where realized value directly affects fee logic.

## Pitfalls
The authored failure modes are vague Phase 4 projections that cannot be reconciled later, missing measurement instruments at design time, narrative-only Phase 6 storytelling without numeric accounting, and disputes over variance attribution when responsibility is unclear.

## Instances
The concrete instances are the two ledgers themselves: projected value in Phase 4 and realized value in Phase 6. The source also grounds the pattern with a named post-go-live measurement window and with the required link back to modules #12, #16, and #17.`,
  },
];

export const META_PATTERN_COUNT = META_PATTERNS.length;
export const META_PATTERN_IDS = META_PATTERNS.map((pattern) => pattern.id);

export default META_PATTERNS;
