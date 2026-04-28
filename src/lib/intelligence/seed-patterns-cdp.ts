import type { PatternSeed } from './seed-types';

export const CDP_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-CDP-001',
    slug: 'cdp-activation-readiness-model',
    title: 'CDP Activation Readiness Model',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'A CDP program is ready to advance only when delivery sequencing, commercial inputs, and evidence-backed gate conditions are all explicit rather than assumed.',
    applicability:
      'Apply when an enterprise has declared CDP activation as a strategic programme and needs a repeatable frame for knowing whether it is ready to move from synthesis into design.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.86,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md',
      'src/lib/programs/programs-detail-view.ts',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-CDP-004', 'PAT-CDP-005', 'PAT-CDP-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The APX-CDP-2026 storyline defines CDP readiness as a governed state, not a mood. The programme is materially underway, but the Design gate remains pending until three named conditions are resolved: workshop attendees confirmed, evidence trace attached to the value-hypothesis deliverable, and the executive sponsor BAFO position recorded.

## When to apply
Use this pattern when a CDP programme sits between strategy and build and the organization needs an honest answer to "are we actually ready to design this?" It is especially useful when the programme depends on a linked commercial event.

## How it works
Model readiness across phase progress, gate state, remaining evidence items, and linked-source dependencies. Keep the gate narrative visible so the programme can proceed with work that is genuinely ready while still refusing to mark Design as approved before the evidence exists.

## Variations
Some tenants will have purely internal readiness conditions. Others, like Apex Retail, require outside commercial evidence before the design commitment is defensible. The readiness model stays stable while the specific evidence items differ.

## Pitfalls
The pattern fails when teams treat active programme work as proof that the next gate is approved, or when commercial and evidence dependencies are known socially but not encoded in the programme state.

## Instances
- APX-CDP-2026 current phase: Synthesis
- Design gate pending with 3 remaining items
- Workshop 5 held on 2026-04-18 but did not clear readiness on its own
- AMS vendor BAFO remains a named commercial input to the gate`,
  },
  {
    id: 'PAT-CDP-002',
    slug: 'customer-data-fragmentation-trigger',
    title: 'Customer Data Fragmentation Trigger',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'A CDP becomes strategically justified when customer insight is trapped across multiple stores and the business can no longer support segmentation or personalization coherently across channels.',
    applicability:
      'Apply when an enterprise has multiple customer-data systems, inconsistent segment logic, and visible degradation in customer-experience decisions.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/source-material/tenant-overlays/apex-intelligence-layer-overlay.md',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: ['PII', 'state_privacy'],
    relatedPatternIds: ['PAT-CDP-003', 'PAT-CDP-007', 'PAT-CDP-008'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Apex's overlay describes the classic trigger condition for CDP activation: four customer-data stores, segmentation consistency below 60% across channels, limited personalization, and degraded customer 360 quality. That is not an incremental reporting gap. It is a structural fragmentation problem.

## When to apply
Use this pattern when CRM, loyalty, ecommerce, store, or marketing data all exist, but the business cannot act on them as one customer system. It is especially relevant in retail and loyalty-heavy environments.

## How it works
Identify the number of active customer-data stores, test whether segment logic is consistent across channels, and quantify where personalization or customer-experience decisions break down. When fragmentation passes that threshold, the programme should shift from local optimization to unified customer-data architecture.

## Variations
Some enterprises trigger on identity-resolution failures, others on personalization underperformance, marketing inefficiency, or duplicated customer records. The specific symptom changes; the unifying condition is fragmented customer truth.

## Pitfalls
The pattern is weakened when teams call every analytics inconvenience a CDP problem, or when they launch a CDP without demonstrating that fragmentation is the thing actually constraining growth and experience.

## Instances
- Apex evidence: 4 customer-data stores
- Segmentation consistency below 60% across channels
- Personalization capability limited by fragmentation
- Customer 360 quality degrades as stores diverge`,
  },
  {
    id: 'PAT-CDP-003',
    slug: 'cross-channel-segmentation-consistency-threshold',
    title: 'Cross-Channel Segmentation Consistency Threshold',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'Segmentation consistency can be used as a hard operating threshold for CDP urgency because once channel logic diverges too far, experience and analytics drift become unavoidable.',
    applicability:
      'Apply when channel teams use different customer segments or customer definitions and there is pressure to decide whether a CDP should become a priority program.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/source-material/tenant-overlays/apex-intelligence-layer-overlay.md',
    ],
    regulatoryChips: ['PII', 'state_privacy'],
    relatedPatternIds: ['PAT-CDP-002', 'PAT-CDP-008'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Apex overlay makes segmentation consistency measurable rather than rhetorical. A level below 60% across channels is treated as evidence that the customer model is no longer coherent enough for dependable cross-channel execution.

## When to apply
Use this pattern when channel leaders disagree on whether customer inconsistency is severe enough to justify a unification programme. It is a strong fit for loyalty, digital commerce, and omnichannel retail contexts.

## How it works
Measure how often customer segments, customer-state labels, or related activation logic match across the major commercial channels. When consistency falls below the accepted operating threshold, the enterprise has objective grounds to prioritize unification rather than isolated optimisation.

## Variations
The exact threshold may vary by business model. Some tenants may set different bars for campaign segmentation, service segmentation, or pricing personalization. The pattern still depends on declaring a threshold explicitly.

## Pitfalls
The pattern loses credibility if consistency is discussed but never measured, or if thresholds are adjusted after the fact to justify a programme that has already been politically decided.

## Instances
- Apex evidence cites segmentation consistency below 60%
- Channel inconsistency is linked to weak personalization capability
- The threshold converts a diffuse problem into a programme-worthy trigger`,
  },
  {
    id: 'PAT-CDP-004',
    slug: 'workshop-sequenced-gate-governance',
    title: 'Workshop-Sequenced Gate Governance',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'Mid-stream CDP programmes stay honest when workshop decisions are translated directly into named gate conditions instead of being treated as general alignment.'
      ,
    applicability:
      'Apply when a programme uses workshops to converge discovery and synthesis decisions and needs those decisions to affect gate state immediately.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-CDP-001', 'PAT-CDP-005', 'PAT-CDP-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
Workshop 5 for APX-CDP-2026 did not merely generate notes. It resolved a strategic tension and created explicit gate consequences: the team chose sequencing over urgency, required BAFO evidence before Design, and left the gate pending until the new evidence items were satisfied.

## When to apply
Use this pattern when workshops are the forum where programme logic is actually settled and you want the system to reflect those decisions immediately instead of waiting for a later governance recap.

## How it works
Capture the workshop date, the concrete decisions reached, any tension resolved, and the resulting gate implications. Update the programme state to match that decision record. In Apex, Workshop 5 on 2026-04-18 converted a debate about urgency into a formal gate hold.

## Variations
Some workshops clear gates; others add new evidence requirements. The pattern supports both. What matters is that the workshop output becomes operational state, not presentation rhetoric.

## Pitfalls
The pattern breaks when workshop outcomes are celebrated as alignment but never translated into blocking logic, or when teams later override the workshop decision without changing the evidence story.

## Instances
- Workshop 5 held on 2026-04-18
- Tension resolved: sequencing vs urgency
- Design gate remains pending because evidence conditions changed, not because the team forgot to update status`,
  },
  {
    id: 'PAT-CDP-005',
    slug: 'executive-sponsor-baseline-commitment',
    title: 'Executive Sponsor Baseline Commitment',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'The CDP investment case becomes governable only when an executive sponsor records the commercial baseline they are willing to underwrite, rather than leaving the value case implicit.',
    applicability:
      'Apply when a programme has a value hypothesis but the comparison point for that value is still politically or commercially unsettled.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.79,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-CDP-001', 'PAT-CDP-004', 'PAT-CDP-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
APX-CDP-2026 makes the executive sponsor BAFO position a formal gate item. That means the baseline against which CDP value will be judged is not left to downstream interpretation. It is recorded by the sponsor after the commercial evidence exists.

## When to apply
Use this pattern when the programme's value case depends on a sponsor-endorsed commercial baseline, especially if sourcing outcomes or operating-cost assumptions materially shape that baseline.

## How it works
Treat the sponsor's commercial position as a required artefact, not a conversational checkpoint. Wait until the vendor comparison is normalized enough to support the decision, then record the sponsor position and attach it to the gate evidence chain.

## Variations
The baseline may be a BAFO position, a cost-to-serve assumption, a revenue-uplift floor, or a spend-avoidance frame. The pattern is the same: the sponsor must explicitly own the commercial comparison point.

## Pitfalls
The pattern fails when the sponsor is asked to bless an implicit value model, when commercial evidence is incomplete, or when the recorded baseline cannot be traced later to the gate rationale.

## Instances
- Executive sponsor BAFO position is one of the three remaining Design-gate items
- Sponsor position cannot be recorded until the normalized vendor comparison exists
- Workshop 5 explicitly required value baseline evidence before Design advances`,
  },
  {
    id: 'PAT-CDP-006',
    slug: 'value-hypothesis-evidence-trace-chain',
    title: 'Value-Hypothesis Evidence Trace Chain',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'A CDP value hypothesis should remain incomplete until its upstream commercial and operational evidence is explicitly traced to the deliverable that claims value.',
    applicability:
      'Apply when a programme has named value-hypothesis documents or deliverables and needs an evidence rule that prevents optimistic gate advancement.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.87,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
      'docs/demo/DEMO10_ENTERPRISE_PILOT_DEEP_DIVE.md',
      'src/lib/source/cdp-source-reverse-link-view.ts',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-CDP-001', 'PAT-CDP-004', 'PAT-CDP-005'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The APX-CDP-2026 programme does not allow value to be asserted without lineage. The value-hypothesis deliverable is missing evidence trace, and the specific missing evidence is commercial: normalized BAFO output from the linked AMS sourcing event plus the sponsor's resulting baseline position.

## When to apply
Use this pattern when value claims depend on upstream sourcing, operating-cost, or market evidence that can be named and traced.

## How it works
Map the dependency chain from source event to commercial evidence to value-hypothesis deliverable to gate item. Keep the trace missing until the upstream proof exists. In Apex, that means the AMS BAFO outcome must land before the evidence trace can be considered complete.

## Variations
The upstream proof may come from sourcing events, internal pilots, benchmark packs, or value-actualization data. The pattern remains: the value document is not complete until the supporting evidence is attached.

## Pitfalls
The pattern fails when teams write the value hypothesis as narrative only, when the evidence chain is implied rather than linked, or when gates can pass on persuasive prose without source-level proof.

## Instances
- Gate item: evidence trace for value-hypothesis deliverable is still missing
- Cross-surface chain explicitly runs from AMS event to programme gate
- Reverse source link model states that the AMS selection outcome affects CDP resourcing and timeline`,
  },
  {
    id: 'PAT-CDP-007',
    slug: 'cdp-architecture-decision-template',
    title: 'CDP Architecture Decision Template',
    domain: 'cdp',
    tier: 'authoritative',
    vertical: 'cross-industry',
    thesis:
      'CDP programs become reusable and explainable when architecture choices are made through a structured decision template rather than ad hoc vendor or platform preference.',
    applicability:
      'Apply when a CDP programme is choosing its identity model, data-layer design, vendor integration contracts, or personalization architecture under commercial and delivery constraints.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.89,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 12,
    sourceDocuments: [
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
      'src/lib/programs/programs-detail-view.ts',
      'docs/demo/APEX_RETAIL_SOURCE_PROGRAM_30_MINUTE_DEMO.md',
    ],
    regulatoryChips: ['PII', 'state_privacy'],
    relatedPatternIds: ['PAT-CDP-002', 'PAT-CDP-008', 'PAT-CDP-009'],
    derivedFromPatternIds: ['PAT-CDP-002'],
    taggedContradictionIds: [],
    body: `## Summary
The intelligence design spec names PAT-CDP-007 directly: "CDP architecture decision template," authoritative, confidence 0.89, with 12 instances across four tenants. In the APX-CDP storyline, it sits on the highest-traffic path between the programme and the AMS commercial event, which means the architecture choice is both reusable and dependency-aware.

## When to apply
Use this pattern when the programme must turn fragmented customer-data symptoms and commercial constraints into a concrete architecture stance: identity graph, data-layer design, vendor boundary, and personalization backbone.

## How it works
Capture the candidate architecture decision, the upstream evidence, the linked source events, and the downstream programmes affected. Make lineage explicit so later contradictions or revisions can update the template instead of hiding in local notes.

## Variations
The template can bias toward composable stack assembly, vendor-led managed layers, or hybrid identity-graph models depending on tenant constraints. The reusable asset is the decision structure, not one vendor answer.

## Pitfalls
The pattern loses power when architecture choices are made as one-off solutioning sessions with no lineage, or when commercial constraints are applied after the architecture is already socially locked.

## Instances
- Intelligence spec cites PAT-CDP-007 as top CDP reuse pattern
- APX-CDP-2026 uses it as the nearest pattern in the graph
- Linked source events include AMS Vendor Consolidation 2026, CDP RFP 2025, and Marketing Cloud Renewal 2024
- Program workbench references identity-graph schema and vendor integration contracts as active design work`,
  },
  {
    id: 'PAT-CDP-008',
    slug: 'identity-graph-before-personalization',
    title: 'Identity Graph Before Personalization',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'Personalization patterns only become durable when identity resolution is treated as the load-bearing prerequisite rather than a later enhancement.',
    applicability:
      'Apply when a tenant wants to use loyalty or transactional data for real-time personalization and is debating whether identity resolution can be deferred.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.83,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'src/lib/intelligence/shell-pattern-detail-inreview-fixture.ts',
      'docs/source-material/tenant-overlays/apex-intelligence-layer-overlay.md',
    ],
    regulatoryChips: ['PII', 'state_privacy', 'loyalty_data'],
    relatedPatternIds: ['PAT-CDP-002', 'PAT-CDP-003', 'PAT-CDP-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The T3-H03 Unified Loyalty Intelligence fixture is clear that identity resolution is load-bearing. Loyalty data, redemptions, and tier state become valuable only when they are merged into the CDP identity graph strongly enough to support real-time decisions at checkout.

## When to apply
Use this pattern when the organization wants personalization outcomes from its CDP but has not yet established whether customer identity is stable enough across channels to support them.

## How it works
Treat identity graph construction as foundational design work, then layer loyalty and personalization behaviours on top. This keeps the programme from shipping attractive activation features on top of fragmented or anonymous customer truth.

## Variations
The downstream activation may be checkout personalization, loyalty offers, next-best-action modelling, or service experience routing. The architecture precondition remains the same.

## Pitfalls
The pattern breaks when teams attempt personalization on anonymous or batch-only customer states, or when they mistake data access for identity resolution.

## Instances
- T3-H03 explicitly requires a CDP or identity-resolution layer in scope
- The fixture warns not to apply the pattern to anonymous transactions
- Apex priorities include loyalty and personalization as linked outcomes`,
  },
  {
    id: 'PAT-CDP-009',
    slug: 'managed-cdp-vendor-integration-boundary',
    title: 'Managed CDP Vendor Integration Boundary',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'retail',
    thesis:
      'CDP design improves when the boundary between in-house architecture and managed vendor scope is decided explicitly and tied to current sourcing reality.',
    applicability:
      'Apply when a CDP programme is deciding how much of the operating layer, data layer, or integration responsibility will be vendor-managed versus internally owned.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.78,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'src/lib/programs/programs-detail-view.ts',
      'src/lib/source/cdp-source-reverse-link-view.ts',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: ['PII', 'state_privacy'],
    relatedPatternIds: ['PAT-CDP-006', 'PAT-CDP-007', 'PAT-CDP-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The APX-CDP design workbench states that the AMS vendor decision has locked the managed CDP layer and reduced in-house build scope. That is a pattern: architecture decisions are not complete until the vendor integration boundary is explicit.

## When to apply
Use this pattern when sourcing outcomes constrain who owns integrations, SLAs, managed services, or data-layer responsibilities in the CDP programme.

## How it works
Translate the linked sourcing outcome into a clear design boundary: which components stay internal, which integration contracts must be finalized with the selected vendor, and what capability trade-offs follow from that choice.

## Variations
Some tenants will keep the identity graph internal and outsource operational support. Others will accept a larger managed layer to accelerate delivery. The important thing is that the boundary is chosen deliberately and documented.

## Pitfalls
The pattern fails when design and sourcing proceed as if they were independent, or when the programme keeps a fictional architecture open after the vendor boundary has already been constrained commercially.

## Instances
- Program workbench says vendor integration contracts are active design work
- Managed CDP layer reduces in-house build scope after sourcing decision
- Reverse link view states vendor selection outcome affects CDP delivery resourcing`,
  },
  {
    id: 'PAT-CDP-010',
    slug: 'implementation-timeline-realism',
    title: 'Implementation Timeline Realism',
    domain: 'cdp',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Vendor-quoted CDP deployment timelines should be discounted against internal delivery evidence because optimistic implementation claims systematically understate real median planning duration.',
    applicability:
      'Apply when a vendor or commercial event claims rapid CDP deployment and that claim is materially influencing architecture, gate, or sponsorship decisions.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 12,
    sourceDocuments: [
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/source-material/build-specs/abarva-source-build-spec.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-CDP-001', 'PAT-CDP-007', 'PAT-SRC-010'],
    derivedFromPatternIds: ['PAT-CDP-001'],
    taggedContradictionIds: ['CON-001'],
    body: `## Summary
This pattern exists because the evidence and the claim do not match. The contradiction example in the intelligence design spec is explicit: a vendor BAFO submission claims 90-day implementation, while internal evidence from 12 prior implementations shows a median of 130 days for the same scope class and buyer profile. The point of the pattern is not that 90 days is impossible; it is that 90-day claims are overoptimistic by default until proven otherwise.

## When to apply
Use this pattern whenever implementation speed is part of a vendor pitch, a committee justification, or a programme timeline assumption. It matters most when a compressed delivery promise is being used to reduce perceived risk or accelerate gate decisions.

## How it works
Take the vendor's quoted timeline as an asserted fact, compare it against internal evidence or prior implementations, and plan to the evidence-backed median unless strong contrary proof exists. In the AbarVa storyline, this is the contradiction-resolved rule that turns a seductive 90-day promise into a 130-day planning assumption.

## Variations
The same realism test can be applied to onboarding, cutover, migration, and data-model completion timelines. The exact delta changes by scope class, but the evidence-first planning rule remains stable.

## Pitfalls
The pattern fails when leadership uses the shortest quoted timeline for sponsor comfort, when delivery teams hide historical evidence because it feels politically inconvenient, or when contradiction handling is omitted from the architecture and sourcing narrative.

## Instances
- Vendor claim: 90-day implementation
- Internal evidence: 12 prior implementations with 130-day median planning duration
- Intelligence spec records a 2026-02-14 resolution toward the internal evidence
- CON-001 is the contradiction reference carried into the Phase 1 seed set`,
  },
];

export const CDP_PATTERN_COUNT = CDP_PATTERNS.length;
export const CDP_PATTERN_IDS = CDP_PATTERNS.map((pattern) => pattern.id);

export default CDP_PATTERNS;
