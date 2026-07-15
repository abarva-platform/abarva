# Meridian HTML Quality and Accuracy Audit

Codename: MERIDIAN-DATA-LAYER-HTML-QUALITY-ACCURACY-PR3

Status: fixed

Scope: content, diagram, story, and architecture-accuracy hardening for the Meridian data layer HTML guide. This audit did not rebuild data, change row counts, change runtime behavior, deploy, promote candidate data, or add unsupported product claims.

## Core Correction

A use case does not create evidence. A use case defines the context required to make a decision. Client evidence comes from documents, interviews, source-system exports, contracts, reports, architecture diagrams, and operational data. Nexus maps that evidence into templates/adapters, validates it, reconciles it into governed data layers, and assembles module-specific context packs.

## Section Findings

### 1. Executive Summary

- Severity: medium
- Issue found: The summary could imply a linear client-input-to-module path.
- Old wording or diagram: Client inputs -> Context Packs -> Nexus Modules
- Corrected wording or diagram: Business use case defines context requirements; evidence fills them; modules consume governed context packs.
- Rationale: Avoids suggesting raw inputs are directly module-consumable.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 2. Meridian Health Context and Strategic Priorities

- Severity: low
- Issue found: Strategic context needed stronger current-vs-target architecture boundary.
- Old wording or diagram: AWS/Databricks modernization agenda
- Corrected wording or diagram: Legacy/on-prem-heavy current state; AWS + Databricks are target foundation/readiness path, not certified production.
- Rationale: Prevents overclaiming production readiness.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 3. Agent Assist Golden Thread

- Severity: medium
- Issue found: Golden thread needed explicit context requirement framing.
- Old wording or diagram: Problem -> Context -> Gaps -> Moves Plan
- Corrected wording or diagram: Agent Assist use case defines required business, system, data, control, metric, org, and foundation context.
- Rationale: Keeps the story decision-led and evidence-gated.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 4. CDAO Meeting Talk Track

- Severity: low
- Issue found: Talk track needed stronger no-overclaim guardrail.
- Old wording or diagram: Evidence-gated AI
- Corrected wording or diagram: CDAO story now emphasizes governed context, caveats, and no realized value claim.
- Rationale: Keeps executive demo credible.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 5. Client Onboarding Model

- Severity: medium
- Issue found: Could imply onboarding creates active truth automatically.
- Old wording or diagram: Template/interview/Copilot/hybrid intake
- Corrected wording or diagram: Intake creates candidate context until SME validation approves active status.
- Rationale: Protects active/candidate boundary.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 6. How Clients Use the Templates

- Severity: high
- Issue found: Lifecycle started with select use case but did not say a use case defines requirements rather than evidence.
- Old wording or diagram: Select use case -> fill templates
- Corrected wording or diagram: Use case -> required context dimensions -> evidence collection -> templates/adapters -> validation -> active context or gap.
- Rationale: Fixes the primary semantic risk.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 7. Workshop and Interview Playbook

- Severity: low
- Issue found: Workshop outputs needed to be described as evidence inputs, not approved facts.
- Old wording or diagram: Outputs: process evidence, roles, metrics
- Corrected wording or diagram: Workshop answers become evidence candidates with confidence and validation status.
- Rationale: Prevents interview notes from becoming truth without review.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 8. Agent Assist Context Requirements

- Severity: low
- Issue found: Needed explicit before-finalizing-discovery guidance.
- Old wording or diagram: Context requirements list
- Corrected wording or diagram: Business, technology, data, controls, org/change, metrics, and foundation readiness are required to finalize discovery artifacts.
- Rationale: Clarifies why tech stack and org context matter.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 9. Copilot-Assisted Source Parsing

- Severity: high
- Issue found: Copilot extraction could be misread as approval.
- Old wording or diagram: Copilot drafts candidate rows
- Corrected wording or diagram: Copilot output remains candidate-only until SME/source validation.
- Rationale: Prevents generated extraction from becoming approved truth.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 10. Hybrid Validation and Promotion

- Severity: low
- Issue found: Correct but needed stronger outcomes.
- Old wording or diagram: Candidate -> active
- Corrected wording or diagram: Review can produce candidate context, rejected evidence, active context, or known unresolved gap.
- Rationale: Makes gap handling explicit.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 11. Source Template Standard

- Severity: medium
- Issue found: Could imply templates directly feed modules.
- Old wording or diagram: Feeds evidence, facts, profiles, gaps, and module context
- Corrected wording or diagram: Templates/adapters feed governed layers; Context Pack Assembler feeds modules.
- Rationale: Protects module-consumption architecture.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 12. Template Examples with Meridian Rows

- Severity: low
- Issue found: Examples needed stronger synthetic/candidate caveat.
- Old wording or diagram: Meridian row examples
- Corrected wording or diagram: Rows are demo-safe synthetic examples with evidence/confidence/gap caveats.
- Rationale: Prevents client-data overclaim.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 13. Visual Data Layer Cake

- Severity: low
- Issue found: Needed explicit module-ready context boundary.
- Old wording or diagram: Raw client material is not what modules consume
- Corrected wording or diagram: Every layer adds source, confidence, gap, and active/candidate status before modules can rely on it.
- Rationale: Keeps diagram accurate.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 14. Moves Over Data Layer

- Severity: high
- Issue found: Required diagram was missing.
- Old wording or diagram: No equivalent previous page
- Corrected wording or diagram: Moves phases request phase-specific MovesContextPacks from the Nexus data layer; gaps flow back to client evidence intake.
- Rationale: Fixes the main architecture story.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 15. Gap to Evidence Feedback Loop

- Severity: high
- Issue found: Gap handling was present but not visualized as a controlled loop.
- Old wording or diagram: Gaps listed as caveats
- Corrected wording or diagram: Gap -> evidence request -> client response -> candidate update -> SME validation -> active/rejected/unresolved outcome.
- Rationale: Prevents gaps from being treated as failures or facts.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 16. Context Pack Assembly

- Severity: high
- Issue found: Modules could be interpreted as reading raw templates.
- Old wording or diagram: Modules receive active context packs
- Corrected wording or diagram: KnowledgeContextPack, MovesContextPack, IntelligenceContextPack, SourceContextPack, and TowerContextPack are assembled from governed layers.
- Rationale: Corrects module wiring.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 17. One-Step Data Flow Walkthrough

- Severity: high
- Issue found: Original flow implied use case directly creates client evidence.
- Old wording or diagram: Use case -> Client evidence
- Corrected wording or diagram: Use case defines context requirements; client evidence fills them; validation governs active use.
- Rationale: Fixes the flagged semantic bug.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 18. ERD / Graph View

- Severity: medium
- Issue found: ERD needed to distinguish governed model from graph explanation.
- Old wording or diagram: ERD + graph view
- Corrected wording or diagram: ERD defines governed contract; graph connects systems, functions, data, risks, metrics, vendors, and programs.
- Rationale: Improves architecture accuracy.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 19. End-to-End Data Flow

- Severity: medium
- Issue found: Needed to use corrected pipeline semantics.
- Old wording or diagram: Client Inputs -> Template Rows -> Modules
- Corrected wording or diagram: Evidence is captured through templates/adapters, reconciled into governed layers, and assembled into context packs.
- Rationale: Avoids direct raw-source-to-module implication.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 20. Layer-by-Layer Volumetric

- Severity: low
- Issue found: Counts could be mistaken for production truth.
- Old wording or diagram: Accepted/candidate/active row counts
- Corrected wording or diagram: Counts remain proof/report data with active/candidate caveats and no production-write claim.
- Rationale: Protects demo safety.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 21. Logical Data Model / ERD

- Severity: medium
- Issue found: Needed stronger context-pack assembler role.
- Old wording or diagram: Edges and gaps feed context packs
- Corrected wording or diagram: Governed entities and relationships feed policy-filtered context packs, not raw module prompts.
- Rationale: Aligns data model with runtime contract.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 22. Evidence Registry

- Severity: low
- Issue found: Registry needed explicit source-proof wording.
- Old wording or diagram: Evidence Registry tracks source-backed proof
- Corrected wording or diagram: Evidence carries source type, owner, as-of date, sensitivity, confidence, active/candidate status, linked facts, and dimensions.
- Rationale: Keeps proof basis visible.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 23. Canonical Facts

- Severity: medium
- Issue found: Could imply source statements become facts automatically.
- Old wording or diagram: Source statement -> Normalized fact
- Corrected wording or diagram: Source statements are normalized only with evidence, confidence, and validation status.
- Rationale: Prevents automatic fact promotion.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 24. Entity Profiles

- Severity: low
- Issue found: Table-only section needed usage clarification.
- Old wording or diagram: Profile coverage table
- Corrected wording or diagram: Profiles organize reusable enterprise context after evidence-backed facts are available.
- Rationale: Improves executive readability.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 25. Relationship Graph

- Severity: medium
- Issue found: Graph needed explicit non-calculation boundary.
- Old wording or diagram: Graph traversal identifies dependencies
- Corrected wording or diagram: Graph explains dependency context and gaps; it does not calculate Tower value or certify readiness.
- Rationale: Prevents metric/value overclaim.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 26. Context Gaps and Confidence

- Severity: low
- Issue found: Gap handling needed positive framing.
- Old wording or diagram: Context is not just facts
- Corrected wording or diagram: A gap is a controlled evidence request with owner, severity, and possible validation outcomes.
- Rationale: Makes uncertainty actionable.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 27. Azure Technical Architecture

- Severity: medium
- Issue found: Tech overlay needed context-pack boundary.
- Old wording or diagram: Where client evidence becomes safe module context
- Corrected wording or diagram: ACA/Blob/validation/data artifacts assemble governed context packs; no runtime behavior changed in this PR.
- Rationale: Prevents runtime/deploy overclaim.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 28. Moves Workflow P0-P5

- Severity: medium
- Issue found: Moves needed phase-specific context pack language.
- Old wording or diagram: Each phase asks minimum context
- Corrected wording or diagram: Each phase requests a phase-specific MovesContextPack and returns gaps as evidence requests.
- Rationale: Aligns Moves with data layer.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 29. Phase-by-Phase Evidence Guide

- Severity: low
- Issue found: Phase guide needed evidence lifecycle caveat.
- Old wording or diagram: What to upload/answer/produce
- Corrected wording or diagram: Uploaded/answered items become candidate evidence until validated for phase use.
- Rationale: Prevents self-attestation overclaim.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 30. Module Wiring

- Severity: high
- Issue found: Module cards could imply modules read broad context directly.
- Old wording or diagram: Uses context, vendors, metrics
- Corrected wording or diagram: Modules consume context packs: Knowledge, Moves, Intelligence, Source, Tower, each with scope-specific payloads.
- Rationale: Corrects module architecture.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 31. Module Handoff Map

- Severity: medium
- Issue found: Map showed handoff without enough context-pack semantics.
- Old wording or diagram: The same context spine starts in Knowledge...
- Corrected wording or diagram: The same context spine is assembled into module-specific context packs; modules add decision surfaces, not raw truth.
- Rationale: Makes platform story accurate.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 32. Source-to-Layer Reconciliation

- Severity: medium
- Issue found: Trace cards needed to clarify validation path.
- Old wording or diagram: Source -> Fact -> Edge -> Modules
- Corrected wording or diagram: Trace flows source row -> evidence -> fact/profile/edge/gap -> context pack; modules consume the pack.
- Rationale: Avoids direct source-to-module shortcut.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 33. AWS / Databricks Semantic Proof

- Severity: high
- Issue found: Must preserve current vs target state boundary.
- Old wording or diagram: AWS + Databricks is the target foundation
- Corrected wording or diagram: Current state is fragmented/legacy; AWS + Databricks lakehouse, medallion, Unity Catalog, data products, PHI/HITL/audit controls are target/readiness path.
- Rationale: Prevents certified-production claim.
- Demo risk: Could mislead executives about architecture, evidence readiness, or product behavior.
- Fixed status: fixed

### 34. Legacy Leakage Proof

- Severity: low
- Issue found: Correct but should stay caveated as historical/report-only.
- Old wording or diagram: Legacy leakage table
- Corrected wording or diagram: Old V-named references are kept out of active demo language and loader-visible paths.
- Rationale: Prevents naming confusion.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 35. Demo Readiness

- Severity: medium
- Issue found: Needed to separate safe claims from future work.
- Old wording or diagram: safe-for-cdao-demo-with-caveats
- Corrected wording or diagram: Demo is safe with caveats; no production data, no realized ROI, no certified AWS/Databricks, no Tower outcome proof.
- Rationale: Keeps demo claims defensible.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 36. Client Data Request Pack

- Severity: low
- Issue found: Data request list needed lifecycle tie-back.
- Old wording or diagram: Client data request pack
- Corrected wording or diagram: Requested files fill context dimensions and enter the same template/adapter, validation, active/candidate lifecycle.
- Rationale: Makes client ask purposeful.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 37. Good Enough by Phase

- Severity: low
- Issue found: Good-enough criteria needed evidence-gated caveat.
- Old wording or diagram: P0/P1 enough context, P2 enough evidence...
- Corrected wording or diagram: Good enough means sufficient evidence and explicit caveats for that phase, not complete enterprise truth.
- Rationale: Avoids over-scoping.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

### 38. Recommended Client Onboarding Sequence

- Severity: medium
- Issue found: Sequence needed corrected lifecycle.
- Old wording or diagram: Week 0 use case + sponsors + templates
- Corrected wording or diagram: Use case selects required context; weeks collect evidence, validate candidate context, assemble context packs, and recycle gaps.
- Rationale: Aligns operating model with architecture.
- Demo risk: Could create ambiguity in a live demo if not caveated.
- Fixed status: fixed

### 39. Appendix / Raw Proof Tables

- Severity: low
- Issue found: Appendix needed no-runtime-change caveat.
- Old wording or diagram: Raw proof tables
- Corrected wording or diagram: Tables support the guide but do not represent runtime mutation, client production data, or candidate promotion.
- Rationale: Protects audit boundary.
- Demo risk: Low risk after clarification.
- Fixed status: fixed

