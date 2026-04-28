import type { PatternSeed } from './seed-types';

const AI_PROGRAM_SOURCE_DOCUMENTS = {
  aiLedPdlc: 'docs/source-material/intelligence-pack/02-ai-led-pdlc.md',
  governance: 'docs/source-material/intelligence-pack/03-ai-governance-operating-model.md',
  vendorSprawl: 'docs/source-material/intelligence-pack/04-vendor-sprawl-ai-tool-rationalization.md',
  portfolio: 'docs/source-material/intelligence-pack/05-ai-use-case-portfolio-management.md',
  shadowAi: 'docs/source-material/pattern-pack-01-shadow-ai-governance.md',
} as const;

const AI_PROGRAM_COMMON = {
  domain: 'ai_programs',
  vertical: 'cross-industry',
  status: 'AUTHORED-DRAFT',
  version: '1.0',
  createdFrom: 'human_authored',
  createdBy: 'founder',
  createdAt: '2026-04-24',
  regulatoryChips: [],
  taggedContradictionIds: [],
} satisfies Omit<
  PatternSeed,
  | 'id'
  | 'slug'
  | 'title'
  | 'tier'
  | 'thesis'
  | 'applicability'
  | 'confidence'
  | 'instanceCount'
  | 'sourceDocuments'
  | 'relatedPatternIds'
  | 'derivedFromPatternIds'
  | 'body'
>;

export const AI_PROGRAM_PATTERNS: PatternSeed[] = [
  {
    ...AI_PROGRAM_COMMON,
    id: 'PAT-AI-001',
    slug: 'ai-led-pdlc',
    title: 'AI-Led PDLC',
    tier: 'validated',
    thesis:
      'Software delivery compounds AI coding-agent gains only when the PDLC itself is redesigned around specification, validation, context codification, and apprenticeship redesign instead of bolting agents onto a legacy workflow.',
    applicability:
      'Applies to engineering organizations using AI coding agents across product delivery, especially where code-generation velocity is rising faster than review, validation, and product outcome velocity.',
    confidence: 0.82,
    instanceCount: 4,
    sourceDocuments: [AI_PROGRAM_SOURCE_DOCUMENTS.aiLedPdlc],
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-003', 'PAT-AI-004'],
    derivedFromPatternIds: ['PAT-AI-002', 'PAT-AI-003', 'PAT-AI-004'],
    body: `## Summary
AI coding agents create local velocity but do not automatically create product-level throughput. The source positions AI-Led PDLC as the operating-model inversion that preserves gains: specifications become first-class artifacts, validation shifts left, context becomes code, delegation follows explicit physics, and mid-level apprenticeship is redesigned rather than assumed.

## When to apply
Use this pattern when engineering leadership reports meaningful agent-attributed velocity gains but sees flat feature delivery, review bottlenecks, rising escaped defects, or growing dependence on senior engineers as reviewers. It is strongest in organizations already using Claude Code, Codex, Cursor, Windsurf, or comparable tools at scale.

## How it works
The source defines a recurring causal chain: agent deployment inside a human-centered PDLC increases generation capacity, but under-specified tasks, thin context artifacts, and unchanged review flows create rework, review saturation, and quality drift. The intervention stack is spec-first delegation, validation-first review infrastructure, context-as-code investment, explicit delegation boundaries, apprenticeship redesign, and outcome-tied measurement of agent productivity.

## Variations
The umbrella pattern carries four child variants called out directly in the source: specification debt multiplication, velocity without validation, context-as-code underinvestment, and senior bench decay. Regulated sectors inherit the same structure but carry higher validation overhead and stronger returns from spec discipline.

## Pitfalls
The source warns against treating agent speed as the same thing as product throughput, measuring code volume instead of feature outcomes, skipping context maintenance, and allowing agent-authored code to absorb the apprenticeship work that develops future senior engineers.

## Instances
Concrete instances in the source are the four named child patterns beneath the AI-Led PDLC umbrella. The pattern is also explicitly related to AI governance, vendor sprawl, and AI use-case portfolio management because coding-agent deployment changes spend, policy, and delivery economics simultaneously.`,
  },
  {
    ...AI_PROGRAM_COMMON,
    id: 'PAT-AI-002',
    slug: 'ai-governance-operating-model',
    title: 'AI Governance Operating Model',
    tier: 'validated',
    thesis:
      'AI governance only works when it is a risk-tiered operating model with named decision rights, explicit cadence, and integration into existing risk functions rather than a policy artifact or reactive committee theater.',
    applicability:
      'Applies to enterprises deploying AI across business functions, customer-facing channels, or regulated workflows where ownership, approval rights, incident handling, and risk-tiering must be explicit.',
    confidence: 0.81,
    instanceCount: 8,
    sourceDocuments: [AI_PROGRAM_SOURCE_DOCUMENTS.governance],
    relatedPatternIds: ['PAT-AI-001', 'PAT-AI-003', 'PAT-AI-004', 'PAT-AI-005'],
    derivedFromPatternIds: ['PAT-AI-001', 'PAT-AI-003', 'PAT-AI-004', 'PAT-AI-005'],
    body: `## Summary
This pattern defines governance as the mechanism that decides what AI gets built, who authorizes deployment, what controls apply, how incidents are handled, and how review cadence keeps up with capability velocity. The source frames the central tension as policy theater on one side and governance absence on the other.

## When to apply
Use this pattern when an enterprise has active AI deployments, shadow AI behavior, unclear executive accountability, or external exposure under frameworks such as NIST AI RMF, EU AI Act, SR 11-7, HIPAA, or ISO 42001. It is especially relevant when leadership cannot answer board-level AI questions quickly or consistently.

## How it works
The source starts with named accountability and decision rights, then moves into a risk-tiered approval workflow, a cross-functional AI Council cadence, model-card and use-case-card discipline, integration with existing risk functions, horizon scanning, incident response, and vendor AI governance. The pattern exists to match governance effort to risk instead of reviewing every use case identically.

## Variations
Sector application changes the baseline: financial services can extend model risk practices, healthcare adds patient-safety and PHI constraints, and EU-facing enterprises inherit explicit AI Act obligations. The core operating model remains cross-industry even as the control set deepens by sector.

## Pitfalls
The source highlights policy-without-practice gaps, distributed ownership with no single executive authority, committee sprawl, one-size-fits-all approvals, reactive-only governance, hidden AI inside SaaS tools, and cadence that moves slower than AI capability changes.

## Instances
Concrete instances in the source are the eight named interventions, from single-point executive accountability through AI-specific vendor governance. The pattern is also directly tied to shadow AI, use-case portfolio decisions, and AI-led delivery because governance has to reach all three.`,
  },
  {
    ...AI_PROGRAM_COMMON,
    id: 'PAT-AI-003',
    slug: 'vendor-sprawl-ai-tool-rationalization',
    title: 'Vendor Sprawl & AI Tool Rationalization',
    tier: 'validated',
    thesis:
      'AI tool estates become unmanageable when dedicated AI platforms, embedded SaaS AI, coding tools, domain products, and shadow subscriptions accumulate without a capability taxonomy, spend reconciliation, or rationalization discipline.',
    applicability:
      'Applies to enterprises with growing AI vendor counts, overlapping tools, hidden AI activation inside SaaS contracts, or AI spend that finance, procurement, and IT cannot reconcile cleanly.',
    confidence: 0.8,
    instanceCount: 8,
    sourceDocuments: [AI_PROGRAM_SOURCE_DOCUMENTS.vendorSprawl],
    relatedPatternIds: ['PAT-AI-001', 'PAT-AI-002', 'PAT-AI-004'],
    derivedFromPatternIds: ['PAT-AI-001', 'PAT-AI-002', 'PAT-AI-004'],
    body: `## Summary
The source treats AI sprawl as a distinct portfolio problem rather than a generic SaaS problem. Dedicated model vendors, agentic coding tools, embedded AI features, domain products, and shadow consumer subscriptions enter through different channels and create capability overlap, governance blind spots, and spend creep that cannot be managed by vendor-by-vendor comparison alone.

## When to apply
Use this pattern when the enterprise cannot produce a trustworthy inventory of AI-enabled tools, sees renewal surprises from AI feature activation, or discovers that multiple functions are paying for overlapping capabilities without a shared architecture view.

## How it works
The rationalization sequence begins with AI tool inventory discovery, then maps every tool into a capability taxonomy, applies a structured rationalization framework for overlapping categories, creates a sanctioned tool catalog, standardizes AI-specific contract clauses, controls hidden AI activation, concentrates spend, and reviews the estate on an ongoing governance cadence.

## Variations
The pattern spans foundation model APIs, engineering tools, embedded SaaS AI, and domain applications. Some diversity remains strategically valuable, especially at the model-provider layer, so the source distinguishes between useful multi-vendor resilience and undisciplined overlap.

## Pitfalls
Key anti-patterns in the source are one-time inventories that decay immediately, procurement-led consolidation without business migration, ignoring embedded AI, banning shadow tools without sanctioned alternatives, and contract-clause theater without audit or enforcement.

## Instances
Concrete instances in the source are the eight named interventions, from inventory discovery through governance cadence. The vendor landscape section also grounds the pattern in specific discovery and SaaS-management classes such as CASB, SaaS management, and LLM-specific DLP tooling.`,
  },
  {
    ...AI_PROGRAM_COMMON,
    id: 'PAT-AI-004',
    slug: 'ai-use-case-portfolio-management',
    title: 'AI Use Case Portfolio Management',
    tier: 'validated',
    thesis:
      'AI strategy becomes executable only when use cases are managed as a portfolio with explicit stages, value-at-risk, attribution methodology, kill decisions, and investment concentration instead of as scattered experiments.',
    applicability:
      'Applies to enterprises running multiple AI initiatives across functions where leadership needs a single view of stage, value, investment allocation, duplication risk, and graduation discipline.',
    confidence: 0.81,
    instanceCount: 8,
    sourceDocuments: [AI_PROGRAM_SOURCE_DOCUMENTS.portfolio],
    relatedPatternIds: ['PAT-AI-001', 'PAT-AI-002', 'PAT-AI-003'],
    derivedFromPatternIds: ['PAT-AI-001', 'PAT-AI-002', 'PAT-AI-003'],
    body: `## Summary
The portfolio pattern is the enterprise mechanism that turns AI ambition into deliberate investment choices. The source frames it as the upstream discipline that gives governance focus, modernization demand, and vendor selection purpose by forcing use cases through stage gates with named owners, value hypotheses, and explicit continue-or-kill decisions.

## When to apply
Use this pattern when executives cannot produce an authoritative use-case count, POCs rarely graduate, multiple teams pursue similar initiatives in parallel, or AI strategy is still described as themes rather than as an operating portfolio.

## How it works
The core interventions are a named portfolio owner, stage-gate discipline, an outcome-attribution spine, a recurring kill-decision cadence, investment concentration targets, direct linkage from portfolio demand into modernization work, discovery of shadow use cases, and a portfolio dashboard that makes additions, advancements, kills, and value-at-risk visible.

## Variations
The pattern is cross-industry, but the review cadence and attribution methods change by use-case type. Some organizations start with spreadsheets or workflow tools, while more mature estates add dedicated portfolio or governance tooling, but the underlying management pattern stays the same.

## Pitfalls
The source is explicit about common failures: keeping use cases in permanent innovation mode, faking attribution, avoiding kill decisions, letting dashboards become theater, overloading strategy themes without execution choices, and tolerating duplicate work across teams.

## Instances
Concrete instances in the source are the eight named interventions that take a portfolio from inventory void to managed investment discipline. The pattern is also directly upstream of governance, vendor rationalization, and data-modernization prioritization.`,
  },
  {
    ...AI_PROGRAM_COMMON,
    id: 'PAT-AI-005',
    slug: 'shadow-ai-governance',
    title: 'Shadow AI Governance',
    tier: 'authoritative',
    thesis:
      'Enterprise AI adoption outruns cataloging, policy enforcement, and sanctioned access, creating a persistent gap between stated AI governance and observed AI practice across procurement, data handling, compliance, and spend.',
    applicability:
      'Applies to enterprises with more than 500 employees or any environment where AI tools are entering through direct purchase, embedded vendor features, or personal-account use faster than governance can keep up.',
    confidence: 0.9,
    instanceCount: 6,
    sourceDocuments: [AI_PROGRAM_SOURCE_DOCUMENTS.shadowAi],
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-003'],
    derivedFromPatternIds: ['PAT-AI-002', 'PAT-AI-003'],
    body: `## Summary
This is the foundational reference implementation for cross-industry AI governance drift. The source defines Shadow AI Governance as the near-universal condition in which enterprise AI use grows faster than inventory, review, and control mechanisms, creating compliance risk, data-sharing exposure, hidden spend, and unanswered customer or regulator questions.

## When to apply
Use this pattern when AI procurement is fragmented, embedded vendor AI is activating without dedicated review, employees rely on personal accounts for work tasks, or the enterprise has policy language without an operational enforcement path.

## How it works
The source traces the problem through decentralized procurement, business-unit pressure to move faster than review, policy without enforcement, legacy approval processes that are too slow for AI velocity, embedded AI features inside approved products, and personal-account usage. The intervention menu then moves from sanctioned enterprise AI platforms and procurement-integrated governance to vendor consolidation, workforce training, and model-risk management for high-stakes use cases.

## Variations
The structural pattern is cross-industry, but sector expression changes. Financial services inherits model-risk-management obligations, healthcare adds PHI and patient-safety concerns, and all four composite AbarVa tenants are explicitly assessed at Stage 2 maturity in the source benchmark ladder.

## Pitfalls
The source warns against training without sanctioned alternatives, governance that scales only by dollar threshold, tool consolidation without capability migration, and public AI-first positioning that masks weak governance maturity underneath.

## Instances
Concrete instances in the source are the six named detection signals, the five maturity stages, and the five intervention paths. Because this pack is the authorial reference implementation for the foundational series, it carries higher confidence and authoritative tiering than the other Wave 2a patterns.`,
  },
  {
    id: 'PAT-AI-006',
    slug: 'coding-agent-rollout-pattern',
    title: 'Coding-Agent Rollout Pattern',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Coding-agent programs scale well when value is tied to engineering throughput and quality baselines rather than enthusiasm alone.',
    applicability:
      'Apply when engineering organizations are rolling out Claude Code, GitHub Copilot, Cursor, or similar coding agents and need a credible deployment-and-value frame.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.89,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-010', 'PAT-AI-014'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower spec treats coding-agent programs as measurable operating systems, not developer sentiment exercises. Its concrete Claude Code example for a 200-engineer organization starts from a 90-day pre-rollout baseline of 4.2 PRs per developer per month, rises to 5.8 post-rollout, adds 8% fewer revert PRs, and yields $3.83M in annual value against $400K cost.

## When to apply
Use this pattern when an engineering organization is moving beyond trial seats and needs a repeatable rollout model with adoption, throughput, and quality baselines.

## How it works
Set the baseline before rollout, measure post-rollout throughput and quality, attribute value using cohort or similarly credible evidence, then connect expansion decisions to sourcing and capacity constraints. In the Tower storyline, expansion above 280 seats triggers a new Source event because commercial capacity becomes the next bottleneck.

## Variations
The underlying coding agent may differ, but the rollout structure stays stable: seat scope, workflow integration, measured throughput lift, quality impact, then controlled expansion.

## Pitfalls
The pattern fails when teams scale seats without baseline data, confuse anecdotal love with portfolio value, or ignore vendor-capacity constraints after the first successful pilot.

## Instances
- Claude Code: 200 engineers, $400K annual cost
- Baseline: 4.2 PRs/dev/month over a 90-day pre-rollout cohort
- Post-rollout: 5.8 PRs/dev/month and 8% fewer revert PRs
- Expansion above 280 seats requires renegotiation through Source`,
  },
  {
    id: 'PAT-AI-007',
    slug: 'productivity-agent-adoption-curve',
    title: 'Productivity-Agent Adoption Curve',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Productivity-agent value is dominated by adoption quality and user mix, so seat counts should never be mistaken for realized program value.',
    applicability:
      'Apply when enterprises are deploying M365 Copilot, Google Duet, or similar white-collar productivity agents across large employee populations.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-009', 'PAT-AI-010', 'PAT-AI-014'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower's M365 Copilot walkthrough shows the adoption curve problem cleanly: 12,400 eligible users, but only 2,950 active, or 24% adoption. That leaves the program below the 60% threshold for ROI breakeven even before duplication pressures are considered.

## When to apply
Use this pattern when a productivity-agent program is licensed broadly and leadership assumes the headline seat count is a proxy for value.

## How it works
Track eligible users, active users, power-versus-occasional usage, and department-level distribution. Weight value by utilization rather than total seats. Then decide whether to drive targeted activation, reallocate seats, or narrow scope. The Tower example explicitly recommends a 90-day Finance acceleration sprint because that cohort is below the adoption level needed for value defensibility.

## Variations
Some programs improve through training and workflow change; others through seat redistribution or scope reduction. The curve is still the same: broad licensing does not matter until active, recurring usage is visible in the right populations.

## Pitfalls
The pattern fails when adoption is measured on license assignment, when occasional users are valued like power users, or when overlap with other tools is ignored.

## Instances
- M365 Copilot: 12,400 eligible users, 2,950 active
- 24% adoption is below the 60% breakeven threshold
- Finance and Legal are the weakest-adoption departments
- Tower models a 90-day Finance acceleration sprint as the recovery move`,
  },
  {
    id: 'PAT-AI-008',
    slug: 'ai-program-kill-criteria',
    title: 'AI Program Kill Criteria',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI portfolios stay healthy only when underperforming programs face explicit continue-versus-kill criteria instead of indefinite cultural grace periods.',
    applicability:
      'Apply when enterprises have multiple AI initiatives in flight and need a rule for stopping those that lack value, adoption, or attribution integrity.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/source-material/intelligence-pack/05-ai-use-case-portfolio-management.md',
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-004', 'PAT-AI-010', 'PAT-AI-014'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The portfolio-management pack states the core issue directly: AI use cases persist because kill decisions are politically hard. Sponsors rarely volunteer to close their own bets, so the system needs explicit criteria and a standing review cadence to decide whether an AI program should continue, receive further investment, or stop.

## When to apply
Use this pattern when an AI program shows weak adoption, unreliable attribution, stalled execution, or material underperformance against its promised outcome.

## How it works
Require every program to carry baseline, target, attribution method, and stage state. Review underperformers on a fixed cadence with kill explicitly on the agenda. If attribution is absent, adoption is structurally low, or value remains below the threshold needed to justify further spend, the default should move from passive continuation to an explicit decision.

## Variations
Some portfolios kill quickly after pilot underperformance; others use staged descope, renewal downgrades, or a final remediation sprint before termination. The pattern still requires that stopping be a governed option.

## Pitfalls
The pattern fails when kill is treated as cultural failure, when sponsors can indefinitely defer the decision, or when measurement ambiguity is used as an excuse to keep spending.

## Instances
- Portfolio-management pack recommends a quarterly kill-meeting cadence
- Kill decisions are explicitly owned by portfolio leadership plus sponsor governance
- Tower recommends descope at renewal when structural issues remain unresolved by Q3`,
  },
  {
    id: 'PAT-AI-009',
    slug: 'cross-vendor-inference-cost-normalization',
    title: 'Cross-Vendor Inference Cost Normalization',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprises need a normalized view of inference economics across vendors and programs because raw spend overrun alone does not distinguish volume growth from bad rate-card structure.',
    applicability:
      'Apply when AI portfolio cost pressure is rising across multiple tools or models and leadership needs to know whether the issue is usage, duplication, or vendor pricing structure.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-003', 'PAT-AI-007', 'PAT-AI-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower portfolio brief calls out LLM inference overrun of $2.4M and separates the causes: 73% is volume-driven, the remainder is rate-card mismatch. That is the normalization insight. You cannot act intelligently on AI cost pressure until usage growth and vendor economics are decomposed.

## When to apply
Use this pattern when AI model spend is exceeding plan, when multiple vendors serve overlapping use cases, or when rate-card differences distort apparently similar workloads.

## How it works
Normalize cost by program, vendor, and usage unit, then separate cost pressure into demand growth, overlap duplication, and pricing structure. Once normalized, leaders can choose between reducing usage, renegotiating rate cards, re-routing workloads, or consolidating overlapping tools.

## Variations
Some environments normalize at model-call level, others at program or department level. The pattern still requires comparable units and causal decomposition rather than a single overrun number.

## Pitfalls
The pattern fails when rate-card mismatch is hidden inside blended spend, when overlap with adjacent tools is ignored, or when leaders respond to overrun with blanket seat cuts instead of understanding the economics.

## Instances
- Portfolio brief: $2.4M inference overrun
- 73% of overrun is volume-driven; the balance is rate-card mismatch
- AI Cloud Spend pressure storyline explicitly depends on this normalization logic`,
  },
  {
    id: 'PAT-AI-010',
    slug: 'ai-program-roi-attribution-methodology',
    title: 'AI Program ROI Attribution Methodology',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI program ROI is only comparable across a portfolio when each value claim declares its attribution method and is haircut according to evidence quality.',
    applicability:
      'Apply to any AI program whose business case includes time savings, revenue lift, cost avoidance, or quality improvements that need to be compared across program types.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.88,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 5,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'docs/source-material/intelligence-pack/05-ai-use-case-portfolio-management.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-006', 'PAT-AI-007', 'PAT-AI-008', 'PAT-AI-009'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower's most important honesty rule is that every value number carries an attribution method. Self-reported savings get a 0.4 haircut, survey evidence gets 0.6, cohort-matched evidence gets 0.85, and experimental evidence stays at 1.0. That turns AI ROI into something auditable instead of sponsor theater.

## When to apply
Use this pattern whenever AI value claims are being compared across program types, sponsors, or vendors, especially if some evidence comes from telemetry and some from self-report.

## How it works
For each program, define baseline, target, measurement method, and attribution type before calling the value "real." Then apply the confidence haircut and express both raw ROI and risk-adjusted ROI. This is what lets M365 Copilot, Claude Code, and Now Assist live in one portfolio view without pretending their evidence quality is identical.

## Variations
The exact multipliers can be tuned, but the pattern requires a declared evidence ladder and portfolio-wide consistency. Some enterprises may add difference-in-differences or quasi-experimental tiers as they mature.

## Pitfalls
The pattern fails when claimed ROI is compared without declared methodology, when self-report is treated as objective value, or when finance sees only a single number with no lineage.

## Instances
- Tower defines risk-adjusted ROI as ROI multiplied by a confidence factor
- Self-report receives a 0.4 haircut; survey 0.6; cohort-match 0.85; experimental 1.0
- M365 Copilot attributed value is explicitly haircut before ROI is calculated`,
  },
  {
    id: 'PAT-AI-014',
    slug: 'ai-program-sponsor-activation',
    title: 'AI Program Sponsor Activation',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI programs move faster and fail more honestly when a named sponsor has explicit decision rights, a communication plan, and standing responsibility for stage advancement or kill decisions.',
    applicability:
      'Apply when an AI initiative is transitioning from exploratory interest into a governed program that needs real business sponsorship, not just technical ownership.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'docs/source-material/intelligence-pack/05-ai-use-case-portfolio-management.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-002', 'PAT-AI-008', 'PAT-AI-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Both the Tower onboarding flow and the portfolio-management pack make sponsor activation operational. The program intake model requires a business sponsor and technical owner, while the intervention model requires a named portfolio owner with decision rights plus a sponsor communication plan for advancement and kill decisions.

## When to apply
Use this pattern when an AI program has real cost, real change impact, or real governance consequences and can no longer survive as an innovation-sidecar with diffuse ownership.

## How it works
Name the sponsor, define what decisions they own, tie them into stage advancement and kill cadence, and make the communication path explicit before the program scales. This keeps technical teams from carrying political ownership by default and keeps sponsors from appearing only when there is a crisis.

## Variations
In some enterprises the sponsor is a single business executive; in others a portfolio owner and business sponsor share the role. The pattern still depends on documented rights and active participation.

## Pitfalls
The pattern fails when sponsorship is nominal, when a program launches without a decision owner, or when sponsor communication is improvised only after ROI or adoption trouble surfaces.

## Instances
- Tower onboarding requires business sponsor and technical owner at identification time
- Portfolio-management intervention calls for a named owner with approval and kill rights
- Kill-meeting cadence requires sponsor communication planning, not just portfolio analytics`,
  },
  {
    id: 'PAT-AI-011',
    slug: 'service-desk-ai-deflection-optimization',
    title: 'Service-Desk AI Deflection Optimization',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Service-desk AI programs only become commercially sound when knowledge-base completeness and scope discipline are treated as the main levers of deflection, not afterthoughts.',
    applicability:
      'Apply when ITSM or customer-service AI programs are underperforming against their promised deflection or cost-savings targets.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-007', 'PAT-AI-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower's Now Assist walkthrough shows why deflection programs underperform. A 50,000-employee deployment promised 40% ticket deflection and $1.5M annual savings, but landed at 28% deflection, $1.12M attributed value, and negative economics against $2.8M cost. The structural blockers were knowledge-base integration at only 60% completeness and 30% usage overlap with Copilot.

## When to apply
Use this pattern when a service-desk AI rollout is missing its deflection target, carrying duplicated scope, or showing weak economics despite broad deployment.

## How it works
Treat deflection as a systems problem: complete the knowledge base, narrow the agent to use cases where it is distinct, and model the deflection ceiling honestly before adding more spend. In the Tower example, the recommended move is a 90-day KB completion sprint plus scope narrowing to ITSM-specific use cases.

## Variations
Some programs need knowledge-base completion first; others need taxonomy cleanup, intent pruning, or duplication removal. The operating principle is the same: optimize the ceiling before pretending scale solves value.

## Pitfalls
The pattern fails when leaders blame adoption alone, ignore overlapping tools, or keep broadening scope while the foundational knowledge layer is incomplete.

## Instances
- Now Assist deflection at 28% versus 40% promised
- Knowledge-base integration only 60% complete
- 30% of current usage duplicates Copilot
- Tower recommends descope at next renewal if integration work does not move by Q3`,
  },
  {
    id: 'PAT-AI-012',
    slug: 'erp-agent-integration-depth-decision',
    title: 'ERP-Agent Integration Depth Decision',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'ERP-agent programs should be evaluated primarily on integration depth and lock-in consequences because superficial productivity wins can hide highly consequential architectural commitments.',
    applicability:
      'Apply when enterprises are assessing SAP Joule, Workday AI, Oracle AI Apps, or similar ERP-embedded agents tied to core systems of record.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.81,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-010', 'PAT-CDP-009'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower's ERP walkthrough frames the real question for SAP Joule and similar agents: not just whether automation value exists, but whether the depth of integration justifies the strategic lock-in. The example shows medium-confidence value, strong integration depth, and extreme switching cost because Joule is tied directly to SAP S/4HANA core.

## When to apply
Use this pattern when an ERP-embedded AI agent is being proposed as a strategic program and the organization needs to choose between shallow experimentation and deep platform commitment.

## How it works
Assess the program on routine-task automation, decision-support improvement, and close-cycle effects, but weight the decision through integration depth and switching cost. If the agent is lightly integrated, optionality remains high. If it is deeply coupled to the ERP core, the review cadence should become more strategic and less tactical.

## Variations
Some ERP-agent programs remain narrow assistants; others become operating-layer commitments bound to the system of record. The depth decision should be explicit before the program is scaled.

## Pitfalls
The pattern fails when leaders approve deep integration based on pilot enthusiasm alone, or when the organization underestimates how vendor-bound the workflow becomes after coupling to the core ERP.

## Instances
- SAP Joule program cost model includes license plus integration
- Confidence is medium because value depends on integration depth
- Vendor lock is explicit: tied to SAP S/4HANA core with extreme switching cost
- Tower treats it as a strategic review-cadence program, not a quick tactical optimization`,
  },
  {
    id: 'PAT-AI-013',
    slug: 'ai-talent-strategy-for-ai-mature-orgs',
    title: 'AI Talent Strategy for AI-Mature Orgs',
    domain: 'ai_programs',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AI-mature organizations need a talent strategy that treats AI fluency as a capability portfolio, measured through leading indicators and defended with epistemic humility rather than overstated ROI.',
    applicability:
      'Apply when an enterprise is investing in AI fluency, change management, and retention as part of a broader AI operating model rather than a single vendor rollout.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.74,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/source-material/build-specs/abarva-tower-design-spec.md',
      'docs/build/PATTERNS_AND_KNOWLEDGE_LAYER_BACKLOG.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-AI-014'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tower spec treats future-of-work programs as strategic bets with low-confidence value attribution. That is the right frame for AI talent strategy in mature organizations: skill coverage, retention, and time-to-productivity matter, but they cannot be scored with the same defensibility as coding-agent ROI. The spec also names the external pressure directly: AI-fluent candidates are joining only AI-mature shops.

## When to apply
Use this pattern when an organization is trying to build AI capability across the workforce and is tempted to evaluate the effort as if it were a short-cycle software ROI program.

## How it works
Track leading indicators such as AI-fluent skills coverage, time-to-productivity trend, and retention posture, then review the investment on a quarterly strategic cadence instead of demanding instant ROI proof. Keep the program visible, but mark its confidence honestly. In the Tower canon, this is why T-FOW uses dashed-bubble treatment and low-confidence language.

## Variations
Some organizations focus on broad workforce fluency, others on AI-heavy specialist tracks or retention of scarce technical talent. The pattern still depends on leading indicators and strategic rather than purely financial review.

## Pitfalls
The pattern fails when leaders overstate near-term value, or when they abandon the capability build because lagging indicators are not readable within the first two quarters.

## Instances
- T-FOW target: raise AI fluency to 60% of workforce
- Skills coverage at 38% is a leading indicator, not proof of ROI
- Tower recommends continued investment with quarterly review and epistemic humility`,
  },
];

export const AI_PROGRAM_PATTERN_COUNT = AI_PROGRAM_PATTERNS.length;
export const AI_PROGRAM_PATTERN_IDS = AI_PROGRAM_PATTERNS.map((pattern) => pattern.id);

export default AI_PROGRAM_PATTERNS;
