import type { PatternSeed } from './seed-types';

export const ARCHITECTURE_PATTERNS: PatternSeed[] = [
  {
    id: 'PAT-ARCH-001',
    slug: 'eleven-plane-platform-decomposition',
    title: 'Eleven-Plane Platform Decomposition',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'AbarVa stays understandable as it grows because the platform is decomposed into bounded planes with explicit jobs rather than blurred service clusters.',
    applicability:
      'Apply when the platform needs to explain where responsibility lives across runtime, knowledge, data, model, and governance concerns.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.87,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 11,
    sourceDocuments: [
      'docs/architecture/ABARVA_ARCHITECTURE_OVERVIEW.md',
      'docs/architecture/ABARVA_PLANES_ARCHITECTURE.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-002', 'PAT-ARCH-003', 'PAT-ARCH-009'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
AbarVa's top-level architecture is defined as eleven canonical planes: App, Agent, Context, Knowledge/Evidence, Data, Model Gateway, Tool, Governance/Audit, Deployment, SaaS Control Plane, and Private Data Plane. The decomposition is deliberate: each plane has one bounded job and named interfaces to adjacent planes.

## When to apply
Use this pattern when the platform needs an executive and implementation-level way to explain how work is partitioned without collapsing everything into one vague "backend."

## How it works
Name each plane, give it a primary job, and use the plane map as the architectural source of truth for ownership, dependency reasoning, and roadmap disclosure. This creates a durable vocabulary that later modules and slices can reuse without ambiguity.

## Variations
The exact implementation maturity of each plane can change by deployment tier or build phase, but the canonical plane map remains stable.

## Pitfalls
The pattern fails when new capabilities are added without a plane home, or when teams start using service names and slices interchangeably with architectural responsibilities.

## Instances
- Eleven canonical planes are enumerated in the architecture overview
- Each plane has a short name and primary job
- Private Data Plane is treated as an optional extension rather than a default runtime assumption`,
  },
  {
    id: 'PAT-ARCH-002',
    slug: 'directed-plane-dependency-graph',
    title: 'Directed Plane Dependency Graph',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Architectural clarity improves when inter-plane dependencies are constrained to a directed acyclic graph rather than a circular mesh.',
    applicability:
      'Apply when adding or reviewing platform capabilities that span multiple planes and risk hidden back-coupling.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/architecture/ABARVA_ARCHITECTURE_OVERVIEW.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-001', 'PAT-ARCH-006', 'PAT-ARCH-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The architecture overview states that no plane has a circular dependency. The dependency graph is a directed acyclic graph flowing from the SaaS Control Plane at the top to the Private Data Plane as an optional extension at the bottom.

## When to apply
Use this pattern when new features or slices begin to create ambiguous cross-calls between platform layers, especially across context, tool, and data responsibilities.

## How it works
Force every dependency to point one way, and treat circular plane coupling as an architecture violation. This makes it possible to reason about failure modes, substitution, and deployment boundaries without tracing loops through the system.

## Variations
Some planes may call many downstream services in parallel, but the graph still needs to remain acyclic at the plane level.

## Pitfalls
The pattern weakens when teams treat convenience cross-calls as harmless, or when runtime shortcuts are added that bypass the canonical dependency flow.

## Instances
- Architecture overview explicitly forbids circular plane dependencies
- Control-plane-to-data-plane flow is directional
- Private Data Plane is modelled as an extension, not a peer that reaches back arbitrarily`,
  },
  {
    id: 'PAT-ARCH-003',
    slug: 'context-bundle-determinism-guarantee',
    title: 'Context Bundle Determinism Guarantee',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Context assembly becomes governable when every model composition depends on one typed bundle whose output is deterministic for the same seeded inputs.',
    applicability:
      'Apply when agent and model behaviors need to be audited, replayed, or compared across environments.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.88,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/architecture/ABARVA_PLANES_ARCHITECTURE.md',
      'docs/architecture/ABARVA_ARCHITECTURE_OVERVIEW.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-004', 'PAT-ARCH-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Context Plane is defined as the determinism guarantee. Two calls with the same '(tenant, workObject, seedSnapshot)' are expected to produce byte-equal 'ContextBundle' output. That makes the context bundle the sole legitimate input to model composition.

## When to apply
Use this pattern when you need replayability, auditability, or stable evaluation of agent outputs against seeded or tenant-bound context.

## How it works
Assemble one typed context bundle from downstream planes and treat it as the canonical handoff into the Agent and Model Gateway planes. This removes ambiguity about what the model saw and makes later provenance and audit chains credible.

## Variations
Different work objects can yield different context sections, but the contract still demands typed structure and deterministic behavior for identical inputs.

## Pitfalls
The pattern fails when ad hoc data is injected outside the Context Plane, or when model composition depends on invisible runtime reads that cannot be reproduced.

## Instances
- Context Plane purpose is to assemble the typed ContextBundle
- Same tenant, work object, and seed snapshot must yield byte-equal output
- Agent Plane and Model Gateway are expected to consume this bundle as sole input`,
  },
  {
    id: 'PAT-ARCH-004',
    slug: 'evidence-ledger-retrieval-authority',
    title: 'Evidence Ledger Retrieval Authority',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Trust improves when every surfaced claim resolves through a single evidence-ledger authority instead of ad hoc document reads or free-form retrieval.',
    applicability:
      'Apply when designing how claims, citations, and supporting chunks are retrieved into context and rendered into user-facing surfaces.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.87,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md',
      'docs/architecture/ARCH2_NEXUS_END_TO_END_EXECUTION_FLOW.md',
      'docs/architecture/ABARVA_DATA_EVIDENCE_FLOW.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-003', 'PAT-ARCH-005', 'PAT-ARCH-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The architecture contracts repeatedly insist that cited 'E-###' evidence must resolve through the evidence ledger. The evidence ledger is not a decorative store. It is the retrieval authority that turns chunks, embeddings, graph edges, and claim support into something the Context Plane and surfaces can trust.

## When to apply
Use this pattern when deciding how citations, evidence chunks, and supporting claims should flow into agent outputs and downstream UI.

## How it works
Write usable chunks into the evidence ledger, resolve claims through that ledger, and block or downgrade outputs whose citations do not resolve. This keeps retrieval disciplined and makes provenance visible in one consistent pathway.

## Variations
The evidence ledger may sit in shared SaaS or a customer-owned data plane, but its authority role stays the same.

## Pitfalls
The pattern fails when teams let surfaces cite chunks that do not resolve through the ledger, or when retrieval shortcuts bypass evidence validation because the output "looks right."

## Instances
- ARCH2 treats unresolved 'E-###' citations as a violation
- Data/Evidence flow shows context injection coming from evidence-ledger outputs
- ARCH1 makes evidence-ledger resolution a requirement for surfaced claims`,
  },
  {
    id: 'PAT-ARCH-005',
    slug: 'universal-provenance-contract',
    title: 'Universal Provenance Contract',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Every consequential artifact should carry an explicit provenance marker so downstream systems and users can reason about what kind of truth they are seeing.',
    applicability:
      'Apply when defining artifact schemas, render pipelines, or auditing rules for platform outputs.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.87,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 5,
    sourceDocuments: [
      'docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md',
      'docs/architecture/ABARVA_REQUEST_TO_CONTEXT_FLOW.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-004', 'PAT-ARCH-008', 'PAT-ARCH-010'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
ARCH1 makes provenance contractual. Every emitted artifact must declare 'createdFrom', using canonical markers such as 'deterministic_seed', 'deterministic_read_model', 'gateway_compose', and 'human_authored'. A render pipeline that strips provenance is explicitly in violation.

## When to apply
Use this pattern whenever the system emits a deliverable, brief, pattern, verdict, pressure card, or any other output that might later be audited or questioned.

## How it works
Attach canonical provenance markers at creation time, preserve them through storage and rendering, and propagate them to surfaces and audit trails. This makes it possible to distinguish seeded output from composed output and human-authored content from deterministic read models.

## Variations
Different modules may display provenance differently, but they should not invent module-specific provenance semantics if canonical markers already exist.

## Pitfalls
The pattern fails when provenance exists in storage but is lost in render, or when modules invent vague labels that do not map to a consistent contract.

## Instances
- ARCH1 defines canonical 'createdFrom' markers
- Request-to-context flow states every output carries provenance
- Audit and trust behavior depends on provenance surviving render`,
  },
  {
    id: 'PAT-ARCH-006',
    slug: 'model-gateway-single-chokepoint',
    title: 'Model Gateway Single Chokepoint',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Model safety, auditability, and provider substitutability improve when all model calls pass through one gateway chokepoint.',
    applicability:
      'Apply when designing how agents or services call external or internal model providers.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.82,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md',
      'docs/architecture/ABARVA_MODEL_GATEWAY_AND_TOOL_PLANE.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-002', 'PAT-ARCH-003', 'PAT-ARCH-007'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The architecture contracts forbid direct provider SDK imports outside the gateway path because the Model Gateway is the single chokepoint for audit, cost tracking, fallback behavior, and tenant isolation. This is less about code style than about architectural enforceability.

## When to apply
Use this pattern when adding new model providers, agent capabilities, or generated-output features that could tempt teams to call a provider directly.

## How it works
Route every model call through the gateway, record audit metadata there, and let provider selection and fallback happen inside that boundary. This centralizes policy and avoids agent-specific provider coupling.

## Variations
The gateway may support multiple providers or customer-specific egress policies, but callers should still see one architectural chokepoint.

## Pitfalls
The pattern fails when teams add direct SDK imports for speed, bypassing audit and provider-governance guarantees, or when model composition logic leaks into page or agent code.

## Instances
- Direct provider SDK import outside the gateway is listed as a forbidden anti-pattern
- Gateway centralizes audit and provider swap behavior
- Tenant isolation is one of the reasons direct bypass is disallowed`,
  },
  {
    id: 'PAT-ARCH-007',
    slug: 'typed-tool-projection-boundary',
    title: 'Typed Tool Projection Boundary',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Agent tools should return typed read-model projections rather than raw database rows so surfaces stay auditable and evidence-compatible.',
    applicability:
      'Apply when defining tool outputs for agents, pages, or orchestration flows that need tenant-safe, user-facing data.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.8,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 3,
    sourceDocuments: [
      'docs/architecture/ABARVA_MODEL_GATEWAY_AND_TOOL_PLANE.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-004', 'PAT-ARCH-006'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The Tool Plane contract names a clear anti-pattern: a tool returning a raw DB row. Raw rows expose untyped data and break the evidence-ledger projection model. The required alternative is a typed read-model projection.

## When to apply
Use this pattern when defining the boundary between internal state and tool-consumable outputs for agents or UI surfaces.

## How it works
Shape tool returns into explicit, tenant-scoped projections that preserve meaning and error behavior. Typed projections make downstream provenance, refusal handling, and surface composition much safer than generic row dumps.

## Variations
The projection may be narrow or rich depending on the surface, but it should still be typed and purpose-built rather than a leaked storage schema.

## Pitfalls
The pattern fails when tools act as thin wrappers over database tables, or when error handling is swallowed instead of being returned as a typed refusal or missing-input state.

## Instances
- Tool-returning-raw-DB-row is called out as a forbidden anti-pattern
- Correct approach is a typed read-model projection
- Tool errors are expected to stay typed rather than disappear silently`,
  },
  {
    id: 'PAT-ARCH-008',
    slug: 'iceberg-principle-for-ui-ux',
    title: 'Iceberg Principle for UI/UX',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Working surfaces should expose answers and next-useful state while keeping machinery, provenance detail, and retrieval complexity mostly below the waterline.',
    applicability:
      'Apply to user-facing work surfaces where the platform must feel expert without forcing the user to navigate its internal evidence machinery.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.9,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/build/SOURCE_BUILD_SPEC.md',
      'docs/build/INTELLIGENCE_DESIGN_SPEC.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-005'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The iceberg principle is explicit in both Source and Intelligence specs. Working surfaces show the answer, not the machinery. Provenance exists, but on Source and other action surfaces it stays mostly invisible unless the user opens an evidence drawer or missing-input state. Intelligence deliberately inverts this because explanation is the work there.

## When to apply
Use this pattern when deciding how much of the system's internal machinery should be visible on a given page or module.

## How it works
Keep the operational surface focused on the answer, the blocker, or the next useful state. Preserve provenance and evidence lineage in the system, but reveal it only when defensibility requires it. This lets the user benefit from the knowledge fabric without being forced to manage it.

## Variations
Trust-building surfaces such as Intelligence may foreground provenance on purpose. Work surfaces such as Programs, Source, and Tower should generally keep it latent until asked for.

## Pitfalls
The pattern fails when working users are forced to consume architecture detail just to act, or when provenance is hidden so thoroughly that trust or audit becomes impossible.

## Instances
- Source spec says working surfaces show the answer, not the machinery
- Provenance on Source appears visibly only in Evidence Drawer or Missing-Input chip
- Intelligence spec says that module intentionally inverts the iceberg principle`,
  },
  {
    id: 'PAT-ARCH-009',
    slug: 'control-plane-private-data-plane-separation',
    title: 'Control Plane / Private Data Plane Separation',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Enterprise trust improves when control-plane services remain distinct from customer-owned data-plane services, with raw tenant content never leaving the customer environment in private mode.',
    applicability:
      'Apply when designing enterprise deployment topologies or deciding what must run centrally versus inside a customer-controlled trust boundary.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.84,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 2,
    sourceDocuments: [
      'docs/architecture/ABARVA_PRIVATE_DATA_PLANE_MODEL.md',
      'docs/architecture/ABARVA_ARCHITECTURE_OVERVIEW.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-001', 'PAT-ARCH-002'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The private-data-plane model defines a strict split. In shared SaaS, all planes run in AbarVa infrastructure. In private-data-plane mode, the SaaS Control Plane, App, Agent, Context, Model Gateway, Tool, and Governance planes stay with AbarVa, while the Data Plane and Knowledge/Evidence Plane move into customer infrastructure and never leave that environment.

## When to apply
Use this pattern when an enterprise customer requires strong data residency, customer-controlled storage, or a higher-trust deployment boundary than shared SaaS provides.

## How it works
Separate central orchestration and experience planes from the customer-owned content planes, then route cross-boundary behavior through explicit contracts. This preserves product control where needed while moving raw tenant data and evidence storage into the customer's environment.

## Variations
The exact tenancy tier or boundary adapter can change, but the separation principle remains: control-plane metadata and application behavior are distinct from customer content storage.

## Pitfalls
The pattern fails when control-plane concerns are allowed to see raw tenant content in private mode, or when private deployment is pitched without a clear statement of which planes actually relocate.

## Instances
- Shared SaaS keeps all planes in AbarVa infrastructure
- Private Data Plane moves Data and Knowledge/Evidence planes into customer infrastructure
- Dedicated-tenant agreement is the gate for enabling private-data-plane mode`,
  },
  {
    id: 'PAT-ARCH-010',
    slug: 'atomic-multi-store-evidence-persistence',
    title: 'Atomic Multi-Store Evidence Persistence',
    domain: 'architecture',
    tier: 'validated',
    vertical: 'cross-industry',
    thesis:
      'Knowledge-fabric trust depends on writing relational rows, embeddings, graph edges, and evidence-ledger projections atomically with provenance rather than as loosely synchronized side effects.',
    applicability:
      'Apply when ingest pipelines persist evidence-derived artifacts into multiple stores that must remain mutually trustworthy.',
    status: 'AUTHORED-DRAFT',
    version: '1.0',
    confidence: 0.85,
    createdFrom: 'human_authored',
    createdBy: 'codex',
    createdAt: '2026-04-28',
    instanceCount: 4,
    sourceDocuments: [
      'docs/architecture/ABARVA_DATA_EVIDENCE_FLOW.md',
      'docs/architecture/ARCH1_AGENTIC_PLATFORM_ARCHITECTURE_CONTRACT.md',
    ],
    regulatoryChips: [],
    relatedPatternIds: ['PAT-ARCH-004', 'PAT-ARCH-005'],
    derivedFromPatternIds: [],
    taggedContradictionIds: [],
    body: `## Summary
The data-evidence flow diagram makes atomic persistence an explicit stage. Evidence is written across relational rows, vector memory, graph edges, and the evidence-ledger projection, all with provenance. The production target repeats the same requirement: live atomic write across the four stores plus ledger.

## When to apply
Use this pattern when a single evidence-ingest action must project into multiple stores that later power search, graph traversal, claims support, and surface citations.

## How it works
Persist all downstream representations together and keep provenance attached to each representation. If validation fails, quarantine or block before ledger projection rather than allowing partially trusted evidence to surface.

## Variations
The storage adapters can evolve, but the contract should still preserve atomicity or an equivalent all-or-nothing guarantee at the projection boundary.

## Pitfalls
The pattern fails when one store updates ahead of the others, when provenance is attached only to one projection, or when failed validation still allows partial evidence to leak into usable context.

## Instances
- Stage 6 in data-evidence flow is an atomic multi-store write
- Production target names live atomic write as the persist requirement
- Validation sits between persistence and usable evidence-ledger projection`,
  },
];

export const ARCHITECTURE_PATTERN_COUNT = ARCHITECTURE_PATTERNS.length;
export const ARCHITECTURE_PATTERN_IDS = ARCHITECTURE_PATTERNS.map((pattern) => pattern.id);

export default ARCHITECTURE_PATTERNS;
