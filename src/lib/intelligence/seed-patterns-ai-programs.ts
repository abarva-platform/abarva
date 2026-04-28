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
];

export const AI_PROGRAM_PATTERN_COUNT = AI_PROGRAM_PATTERNS.length;
export const AI_PROGRAM_PATTERN_IDS = AI_PROGRAM_PATTERNS.map((pattern) => pattern.id);

export default AI_PROGRAM_PATTERNS;
