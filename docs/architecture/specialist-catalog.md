# AbarVa Specialist Catalog

| | |
|---|---|
| **Doc ID** | `SPECIALIST_CATALOG_v0.1` |
| **Established** | 2026-05-06 |
| **Status** | Scaffold · Source partially populated · Moves / Tower / Intelligence / Setup pending |
| **Purpose** | The published inventory of every narrow specialist that runs behind the front agents. Architecture reviews use this. Primary product UI does not. |

---

## 1 · Architecture model (anchor)

The AbarVa product surface has a layered agent architecture:

| Layer | What lives here | User sees? |
|---|---|---|
| Primary UI nav + page headers | Workflow verbs and outcomes | Yes — workflow-anchored |
| Chat window | One brand-named front agent per product | Yes — brand voice |
| Master orchestrator | Routes user intent to specialists | No |
| Specialists (this catalog) | Narrow function-named workers | No (cataloged here only) |
| Trace drill-down | "Show me how this was produced" | Optional — exposes specialists on demand |

**Front-agent mapping per product:**

- **Moves / Programs** → Nexus
- **Source** → Sentinel
- **Tower** → Atlas
- **Intelligence** → Sentinel (same identity, different surface)
- **Setup / Admin** → Steward

See `feedback_workflow_first_agents_hidden.md` in user memory for the directive lineage.

---

## 2 · Entry schema

Every specialist in this catalog has one entry with the following fields:

```yaml
id: kebab-case-name                      # unique, stable
name: HumanReadableName                   # function-named, never user-named
purpose: One-line statement               # what it does, narrow scope
owner_front_agent: nexus | sentinel | atlas | steward
surfaces_served:                          # which products call this specialist
  - source
  - moves
  - …
inputs:                                   # what it consumes
  - description of input 1
  - description of input 2
outputs:                                  # what it returns
  - description of output 1
cite_tag_format: source-pricing-normalizer-v1   # tag rendered in trace
implementation_pointer: src/lib/source/foo.ts:42  # current code anchor (or "not yet built")
status: shipped | partial | not_built
notes: optional free text
```

The catalog is the single source of truth for which specialists exist, what they do, and which front agent they report through. New specialists land here first; code references this entry as the contract.

---

## 3 · Source specialists (12 of ~22 captured · partial)

These are pulled from the M2/M4 audit findings. The existing code-level voice generators map cleanly to specialists with no rewrite — they just stop being four parallel agents and become twenty-something specialists routing through Sentinel.

### 3.1 · Next-action and orchestration specialists

```yaml
id: next-action-recommender
name: NextActionRecommender
purpose: Given current event state, name the operationally-next concrete action.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - event context bundle
  - current stage
  - blockers list
  - missing inputs list
outputs:
  - one-line next action with handoff target
cite_tag_format: source-next-action-v1
implementation_pointer: src/lib/source/agent-missions.ts:45 (currently in buildNexusSourceMissions)
status: shipped
notes: Existing `buildNexusSourceMissions` next_action mission becomes this specialist with no rewrite.
```

```yaml
id: minimum-data-request-generator
name: MinimumDataRequestGenerator
purpose: When inputs are missing, produce a structured data request to the right human owner.
owner_front_agent: sentinel
surfaces_served: [source, intelligence]
inputs:
  - missing inputs list
  - event tenant context
  - admin/setup readiness contract
outputs:
  - data request artifact with named owner per request
cite_tag_format: source-minimum-data-request-v1
implementation_pointer: src/lib/source/agent-missions.ts:66 (data_readiness mission)
status: shipped
```

```yaml
id: pattern-signal-detector
name: PatternSignalDetector
purpose: Identify which pattern pack matches the current sourcing archetype and surface its guidance.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - sourcingArchetype
  - selectedPatternPack
outputs:
  - pattern citation with applicable guidance sections
cite_tag_format: source-pattern-signal-v1
implementation_pointer: src/lib/source/stage-packs/
status: shipped
```

### 3.2 · Evidence and validation specialists

```yaml
id: evidence-gap-detector
name: EvidenceGapDetector
purpose: Identify missing citations, parsed-file gaps, and unsupported claims for the current event.
owner_front_agent: sentinel
surfaces_served: [source, intelligence]
inputs:
  - context bundle
  - context validation report
  - citation coverage map
outputs:
  - ranked list of evidence gaps with remediation
cite_tag_format: source-evidence-gap-v1
implementation_pointer: src/lib/source/agent-missions.ts:107 (buildSentinelSourceMissions evidence_gap)
status: shipped
```

```yaml
id: context-validation-checker
name: ContextValidationChecker
purpose: Verify context bundle integrity; flag intentional defers that must remain visible.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - context validation report
outputs:
  - defer list with reasons + remediation pre-pass
cite_tag_format: source-context-validation-v1
implementation_pointer: src/lib/source/agent-missions.ts:115
status: shipped
```

```yaml
id: low-context-warner
name: LowContextWarner
purpose: Detect when context confidence falls below decision-grade and surface the gap.
owner_front_agent: sentinel
surfaces_served: [source, intelligence]
inputs:
  - context quality summary
outputs:
  - warning with missing-context reasons
cite_tag_format: source-low-context-v1
implementation_pointer: src/lib/source/agent-missions.ts:155
status: shipped
```

### 3.3 · Pricing and commercial specialists

```yaml
id: pricing-normalizer
name: PricingNormalizer
purpose: Reduce vendor pricing responses to a single common assumption set; surface trapped costs.
owner_front_agent: sentinel
surfaces_served: [source, tower]
inputs:
  - vendor pricing components
  - common assumption set v3
outputs:
  - normalized TCO per vendor + Δ-vs-list + assumption diff
cite_tag_format: source-pricing-normalize-v1
implementation_pointer: src/lib/source/source-pricing-comparison-view.ts (partial)
status: partial
notes: Logic exists for view-model rendering. Specialist contract needs codification.
```

```yaml
id: pricing-trap-detector
name: PricingTrapDetector
purpose: Enumerate every carried cost, hidden assumption, and exclusion in vendor pricing.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - normalized TCO output
  - vendor commercial exceptions table
outputs:
  - trap log P0/P1/P2 with vendor attribution
cite_tag_format: source-pricing-traps-v1
implementation_pointer: src/lib/source/commercial-risk-detection.ts
status: shipped
notes: Backed by `source_commercial_exceptions` table.
```

```yaml
id: bafo-question-generator
name: BafoQuestionGenerator
purpose: From the trap log, produce vendor-specific BAFO question packs targeting unique pricing traps.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - trap log
  - vendor response history
outputs:
  - per-vendor question pack with rationale per question
cite_tag_format: source-bafo-questions-v1
implementation_pointer: src/lib/source/bafo-negotiation.ts
status: shipped
notes: Generates guidance only; never auto-sends to vendors (per dossier prohibition).
```

### 3.4 · Governance and gate specialists

```yaml
id: gate-criteria-checker
name: GateCriteriaChecker
purpose: Evaluate per-criterion gate state; produce ready/blocked/waiver-eligible verdict.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - stage gate criteria
  - artifact states
  - sign-off log
outputs:
  - gate state with named blockers
cite_tag_format: source-gate-criteria-v1
implementation_pointer: src/lib/source/source-stage-gates.ts
status: partial
notes: Currently action-level (advance/block); needs per-criterion granularity per F-M1-204.
```

```yaml
id: workflow-blocker-detector
name: WorkflowBlockerDetector
purpose: Identify workflow-validation blockers and failed expectations across the event.
owner_front_agent: sentinel
surfaces_served: [source]
inputs:
  - workflow validation report
outputs:
  - prioritized blocker list with remediation per blocker
cite_tag_format: source-workflow-block-v1
implementation_pointer: src/lib/source/agent-missions.ts:233 (buildStewardSourceMissions workflow_blocker)
status: shipped
```

### 3.5 · Executive synthesis specialists

```yaml
id: value-at-stake-summarizer
name: ValueAtStakeSummarizer
purpose: Summarize projected/committed/measuring/realized value with confidence framing for executives.
owner_front_agent: sentinel
surfaces_served: [source, tower]
inputs:
  - event value attribution
  - realized value ledger
outputs:
  - executive value summary with confidence bands
cite_tag_format: source-value-summary-v1
implementation_pointer: src/lib/source/agent-missions.ts:181 (buildAtlasSourceMissions value_risk)
status: shipped
notes: Atlas-native logic in code; under refined model, becomes Sentinel-routed when running inside Source. Atlas-the-front-agent only fronts Tower.
```

```yaml
id: executive-decision-brief-writer
name: ExecutiveDecisionBriefWriter
purpose: Compose 1-page decision brief with tradeoff card (value/risk/transition postures).
owner_front_agent: sentinel
surfaces_served: [source, tower]
inputs:
  - finalist comparison
  - commercial risk register
  - value summary
outputs:
  - decision brief with named recommendation + caveats
cite_tag_format: source-decision-brief-v1
implementation_pointer: src/lib/source/executive-decision-summary.ts
status: shipped
```

---

## 4 · Specialists not yet built · gaps from the audit

| Specialist | Gap source | Status |
|---|---|---|
| GateCriterionStateTracker | F-M1-204 — substrate needs per-criterion state | Substrate gap |
| ValueLineStateAdvancer | F-M1-205 — substrate needs per-line value state | Substrate gap |
| ScopeTierAssessor | Outline-tier vs Full-tier classification | Pattern exists; not yet a named specialist |
| ArtifactTierClassifier | Tier (rich/outline/stub) is in types but not abstracted as specialist | Refactor candidate |
| TransitionChecklistRunner | KT/access/runbook/RACI — present as data, not as named specialist | Refactor candidate |
| EvidenceCitationValidator | Citation infrastructure exists; specialist contract missing | Refactor candidate |

---

## 5 · Setup / Admin specialists (front: Steward · 16 captured · partial)

The Setup specialists derive from the failure-mode design (12 failure modes × prevention mechanisms) plus the existing admin code patterns (acts registry, dataset trust workflow, blocker tracker). Most have substrate or code already.

### 5.1 · Data-health and gap specialists (typically Sentinel-flavored, fronted through Steward)

```yaml
id: data-health-summarizer
name: DataHealthSummarizer
purpose: Compose tenant-level data-health summary (coverage, completeness, gaps) for the Setup landing.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - admin_datasets quality scores
  - admin_setup_progress per-step status
  - tenant expected baselines
outputs:
  - one-paragraph data-health narrative + 3-5 priority gaps
cite_tag_format: setup-data-health-v1
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §B.4 (specified, partial implementation)
status: partial
notes: Spine doc Sentinel-voice top summary becomes a specialist that Steward orchestrates and presents.
```

```yaml
id: coverage-scorer
name: CoverageScorer
purpose: Compute per-segment coverage score against tenant-archetype expected baselines.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - segment record counts
  - tenant_expected_baselines per segment
  - tenant archetype (retail/healthcare/financial-services)
outputs:
  - 0-100 coverage score per segment with band classification (complete/partial/sparse/not_started)
cite_tag_format: setup-coverage-v1
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §D.6 (open question on weighting)
status: not_built
notes: Prevents failure mode #1 (inventory shows what's there but not what's missing).
```

```yaml
id: gap-detector
name: GapDetector
purpose: Surface specific data gaps with click-through actionability ("upload to fill this gap").
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - segment coverage scores
  - active programs that depend on each segment
outputs:
  - prioritized gap list with affordance per gap
cite_tag_format: setup-gap-detect-v1
implementation_pointer: src/lib/admin/data-lineage-read-model.ts (partial)
status: partial
notes: Prevents failure mode #3 (gaps visible but not actionable).
```

```yaml
id: staleness-detector
name: StalenessDetector
purpose: Flag records older than freshness-window thresholds parameterized by data type.
owner_front_agent: steward
surfaces_served: [setup, source, intelligence]
inputs:
  - record last_reviewed timestamps
  - per-data-type freshness thresholds
outputs:
  - stale-flagged record IDs grouped by segment
cite_tag_format: setup-stale-v1
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §B.4 freshness thresholds
status: not_built
notes: Prevents failure mode #11 (stale data not flagged for re-review).
```

```yaml
id: provenance-resolver
name: ProvenanceResolver
purpose: Trace any record back through ingestion → graph → vector → agent retrieval, surfacing the full chain.
owner_front_agent: steward
surfaces_served: [setup, source, intelligence]
inputs:
  - record_id or chunk_id or evidence_id
outputs:
  - upload event + persistence + graph node + chunk + retrieving agent context receipt
cite_tag_format: setup-provenance-v1
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §E.4
status: partial
notes: Prevents failure mode #4 (provenance buried) and #10 (provenance lost).
```

### 5.2 · Upload, ingestion, classification specialists (operational core)

```yaml
id: schema-validator
name: SchemaValidator
purpose: Validate uploads against per-family schema; reject ingestion when required fields missing.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - uploaded file
  - family schema definition
outputs:
  - pass/fail with field-level error list
cite_tag_format: setup-schema-validate-v1
implementation_pointer: src/lib/admin/dataset-trust-model.ts (partial)
status: partial
```

```yaml
id: classification-enforcer
name: ClassificationEnforcer
purpose: Require data classification declaration on upload; enforce per-tenant policy.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - upload context
  - tenant classification policy
outputs:
  - classification verdict (Public/Internal/Confidential/Restricted)
cite_tag_format: setup-classify-v1
implementation_pointer: src/app/api/admin/upload-dataset/route.ts
status: shipped
```

```yaml
id: graph-projector
name: GraphProjector
purpose: Project ingested records into graph nodes and resolve cross-segment edges.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - persisted record
  - family graph mapping (per spine doc §C.0X)
outputs:
  - graph node + outgoing edges with referential integrity check
cite_tag_format: setup-graph-project-v1
implementation_pointer: src/scripts/migrate-graph.ts + spine doc §E.1 step 3
status: partial
```

```yaml
id: vector-embedder
name: VectorEmbedder
purpose: Chunk record content per family rules and generate embeddings into tenant-scoped namespace.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - persisted record
  - chunking rules
  - embedding model (text-embedding-3-small, 1536 dim)
outputs:
  - chunk rows with provenance metadata + embedding_status
cite_tag_format: setup-vector-embed-v1
implementation_pointer: src/scripts/ingest-knowledge.ts + spine doc §E.1 step 4
status: partial
```

```yaml
id: tenant-isolation-enforcer
name: TenantIsolationEnforcer
purpose: Reject any cross-tenant query attempt at the broker layer; log violations.
owner_front_agent: steward
surfaces_served: [all]
inputs:
  - query with tenant_key
  - authenticated user's tenant_key
outputs:
  - allow/deny verdict; violation logged on deny
cite_tag_format: setup-tenant-iso-v1
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §E.3 (negative tests required)
status: partial
notes: Pilot-blocking. Per-user RLS gap (F-SU-106) needs to close.
```

### 5.3 · Governance and trust workflow specialists

```yaml
id: trust-rung-promoter
name: TrustRungPromoter
purpose: Move datasets up the 5-rung trust ladder (raw → verified → blessed → ground_truth → audit_trail) with approval workflow.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - dataset_id, from_rung, to_rung
  - approver identity + role
outputs:
  - admin_dataset_approvals row + audit log entry
cite_tag_format: setup-trust-promote-v1
implementation_pointer: src/lib/admin/dataset-approval-workflow.ts
status: shipped
```

```yaml
id: dataset-quality-scorer
name: DatasetQualityScorer
purpose: Compute six quality dimensions per dataset (completeness, freshness, schema_conformance, lineage, sample_agreement, overall).
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - dataset content
  - reference baselines
outputs:
  - 6 scores + computed overall
cite_tag_format: setup-quality-score-v1
implementation_pointer: substrate `admin_dataset_quality` (table exists; scorer logic location TBC)
status: partial
```

```yaml
id: blocker-tracker
name: BlockerTracker
purpose: Maintain pilot/production readiness blockers with agent ownership and severity.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - blocker description, severity, affected_scope
  - owner_agent (steward/nexus/sentinel/atlas)
outputs:
  - admin_blockers row + readiness state propagation
cite_tag_format: setup-blocker-v1
implementation_pointer: substrate `admin_blockers`
status: shipped
notes: The `owner_agent` enum here is the substrate evidence that work is divisible by capability bucket. Useful tagging at specialist level.
```

```yaml
id: setup-progress-rollup
name: SetupProgressRollup
purpose: Aggregate per-step setup status into the rolled-up tenant readiness state.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - per-step admin_setup_progress rows
outputs:
  - rolled-up status (done/in_progress/pending) with next-action recommendation
cite_tag_format: setup-progress-v1
implementation_pointer: substrate `admin_setup_progress` + src/lib/admin/setup-acts-registry.ts
status: shipped
```

### 5.4 · Audit and observability specialists

```yaml
id: admin-action-logger
name: AdminActionLogger
purpose: Write admin/setup interactions to admin_audit_log with proper categorization.
owner_front_agent: steward
surfaces_served: [setup]
inputs:
  - actor, action, before/after state, classification
outputs:
  - admin_audit_log row
cite_tag_format: setup-audit-log-v1
implementation_pointer: substrate `admin_audit_log`
status: shipped
```

```yaml
id: cross-segment-edge-resolver
name: CrossSegmentEdgeResolver
purpose: Maintain cross-segment relationships (e.g., system OWNED_BY person, COVERED_BY contract) so retrievals surface them.
owner_front_agent: steward
surfaces_served: [setup, source, tower, intelligence]
inputs:
  - new or updated records in any segment
outputs:
  - graph edges with referential integrity verified
cite_tag_format: setup-cross-segment-v1
implementation_pointer: spine doc §E.1 step 3 (resolve cross-segment edges)
status: partial
notes: Prevents failure mode #12 (cross-segment relationships invisible).
```

---

## 6 · Moves / Programs specialists (front: Nexus · 12 captured)

**Important architectural note:** Moves does NOT use the parallel-all multi-agent pattern that Source uses. Nexus is the singular front; Atlas/Sentinel/Steward appear as lookup-only role labels in phase templates ([src/lib/programs/nexus-program-workbench-view.ts:198-384](src/lib/programs/nexus-program-workbench-view.ts:198)). Moves is closer to the front-agent-per-product target than Source — the redesign work is Source converging toward Moves' pattern, not the other way around.

```yaml
id: phase-gate-advancement-flow
name: PhaseGateAdvancementFlow
purpose: Govern phase transitions (P0→P1→...→P5); enforce gate readiness before advancement.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - program state
  - gate criteria status per phase
outputs:
  - advance/block verdict + missing criteria
cite_tag_format: moves-phase-gate-v1
implementation_pointer: src/lib/programs/phase-gate-advancement-flow.ts
status: shipped
```

```yaml
id: ai-program-failure-mode-detector
name: AiProgramFailureModeDetector
purpose: Catalog AI-program-specific failure patterns; surface risk antipatterns relevant to current program.
owner_front_agent: nexus
surfaces_served: [moves, intelligence]
inputs:
  - program archetype
  - current phase context
outputs:
  - applicable failure modes with prevention guidance
cite_tag_format: moves-failure-mode-v1
implementation_pointer: src/lib/programs/failure-modes.ts + src/lib/intelligence/ai-program-failure-modes
status: shipped
notes: Cross-product — Moves consumes from Intelligence corpus.
```

```yaml
id: sme-recommendation-engine
name: SmeRecommendationEngine
purpose: Recommend role-anchored specialist staffing for phase workshops (12 SmeRole types).
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - phase context
  - program archetype
  - tenant org structure
outputs:
  - SME roster per workshop with role assignments
cite_tag_format: moves-sme-recommend-v1
implementation_pointer: src/lib/programs/sme-recommendations.ts
status: shipped
```

```yaml
id: evidence-ingestion-normalizer
name: EvidenceIngestionNormalizer
purpose: Validate and normalize captured evidence into phase-locked deliverables.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - raw captured evidence
  - phase deliverable schema
outputs:
  - normalized evidence with phase lock
cite_tag_format: moves-evidence-ingest-v1
implementation_pointer: src/lib/programs/evidence-ingestion.ts
status: shipped
```

```yaml
id: evidence-trace-indexer
name: EvidenceTraceIndexer
purpose: Provenance mapping for evidence changes; audit-trail per deliverable update.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - deliverable updates
  - evidence references
outputs:
  - trace entries with before/after state
cite_tag_format: moves-evidence-trace-v1
implementation_pointer: src/lib/programs/deliverable-evidence-trace.ts
status: shipped
```

```yaml
id: workshop-readiness-validator
name: WorkshopReadinessValidator
purpose: Determine next recommended workshop and readiness conditions.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - phase state
  - completed deliverables
  - SME availability
outputs:
  - next workshop recommendation with readiness checklist
cite_tag_format: moves-workshop-ready-v1
implementation_pointer: src/lib/programs/workshop-readiness.ts
status: shipped
```

```yaml
id: quality-gates-enforcer
name: QualityGatesEnforcer
purpose: Apply hard/soft gate rules; block draft advancement until thresholds met.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - draft state
  - gate threshold definitions
outputs:
  - gate verdict per criterion + summary
cite_tag_format: moves-quality-gates-v1
implementation_pointer: src/lib/programs/quality-gates.ts
status: shipped
```

```yaml
id: deliverable-versioning-tracker
name: DeliverableVersioningTracker
purpose: Track draft→sign-off transitions; render version history per deliverable.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - deliverable updates
outputs:
  - version chain with sign-off metadata
cite_tag_format: moves-deliverable-version-v1
implementation_pointer: src/lib/programs/deliverable-versioning.ts
status: shipped
```

```yaml
id: origination-drafts-persister
name: OriginationDraftsPersister
purpose: Hold P0 partial drafts; scaffold resume flow for the 7-step originate sequence.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - draft state
  - resume context
outputs:
  - persisted partial draft + resume payload
cite_tag_format: moves-originate-drafts-v1
implementation_pointer: src/lib/programs/origination-drafts.ts
status: shipped
```

```yaml
id: pattern-match-classifier
name: PatternMatchClassifier
purpose: Cross-reference Pinecone `nexus-knowledge` index; surface applicable archetype primers.
owner_front_agent: nexus
surfaces_served: [moves, intelligence]
inputs:
  - program description
  - sourcing archetype
outputs:
  - top-K matched patterns with confidence
cite_tag_format: moves-pattern-classify-v1
implementation_pointer: src/lib/programs/classifier.ts
status: shipped
```

```yaml
id: enhancement-seed-writer
name: EnhancementSeedWriter
purpose: Produce training-data payloads from signed-off deliverables (marks created_by: nexus vs maestro).
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - signed-off deliverables
outputs:
  - enhancement seed records
cite_tag_format: moves-enhancement-seed-v1
implementation_pointer: src/lib/programs/enhancement-seed-writer.ts
status: shipped
```

```yaml
id: program-artifact-inventory
name: ProgramArtifactInventory
purpose: Asset registry — controls which artifacts are phase-gated vs always-visible.
owner_front_agent: nexus
surfaces_served: [moves]
inputs:
  - program state
  - artifact registry
outputs:
  - phase-aware artifact list with visibility flags
cite_tag_format: moves-artifact-inventory-v1
implementation_pointer: src/lib/programs/program-artifact-inventory.ts
status: shipped
```

---

## 7 · Tower specialists (front: Atlas · 15 captured)

**Architectural note:** Tower is the cleanest implementation of the front-agent-per-product model. Atlas is the sole chat agent ([src/lib/atlas/prompt.ts:5](src/lib/atlas/prompt.ts:5)), no parallel-all, dedicated `atlas_threads` + `atlas_observations` substrate, full orchestrator. Tower is the reference architecture other products should converge toward.

**Atlas dual-scope confirmed:** Atlas is one identity applied in two scopes — front-agent in Tower (with full orchestrator, threads, observations) and specialist in Source (called via `buildAtlasSourceMissions()` for executive-brief generation only). The brand identity is shared; the depth of application differs by product.

```yaml
id: portfolio-analyzer
name: PortfolioAnalyzer
purpose: Catalog active programs, projects, tech stack, and integrations into a unified portfolio view.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - active programs from substrate
  - tech stack inventory
  - project registry
outputs:
  - portfolio snapshot with 5D pillar tagging
cite_tag_format: tower-portfolio-v1
implementation_pointer: src/lib/tower/ai-portfolio-inventory.ts
status: shipped
```

```yaml
id: ai-adoption-tracker
name: AiAdoptionTracker
purpose: Surface AI adoption and usage signals across the portfolio.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - use_case_usage_metrics
  - adoption signals
outputs:
  - adoption posture by program with trend
cite_tag_format: tower-adoption-v1
implementation_pointer: src/lib/tower/ai-adoption-usage.ts
status: shipped
```

```yaml
id: dora-productivity-scorer
name: DoraProductivityScorer
purpose: Compute DORA metrics and engineering velocity correlation across programs.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - engineering metrics
  - delivery cadence data
outputs:
  - DORA scorecard with productivity correlation
cite_tag_format: tower-dora-v1
implementation_pointer: src/lib/tower/ai-productivity-dora.ts
status: shipped
```

```yaml
id: value-outcome-ledger
name: ValueOutcomeLedger
purpose: Track projected and realized value across the portfolio with measurement state.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - per-program value commitments
  - measurement evidence
outputs:
  - portfolio value ledger (projected/committed/measuring/realized)
cite_tag_format: tower-value-ledger-v1
implementation_pointer: src/lib/tower/ai-value-outcome-ledger.ts
status: shipped
notes: Mirrors Source's value-state vocabulary; portfolio aggregation.
```

```yaml
id: ai-cost-analyzer
name: AiCostAnalyzer
purpose: Aggregate AI spend, model token consumption, infrastructure cost across programs.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - cloud_costs
  - per-model usage telemetry
outputs:
  - cost rollup by program + concentration risks
cite_tag_format: tower-cost-v1
implementation_pointer: src/lib/tower/ai-cost-consumption.ts
status: shipped
```

```yaml
id: risk-governance-tracker
name: RiskGovernanceTracker
purpose: Surface risk escalations and governance findings; map to active programs.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - use_case_risk
  - audit findings
outputs:
  - portfolio risk register with severity
cite_tag_format: tower-risk-v1
implementation_pointer: src/lib/tower/ai-risk-governance.ts
status: shipped
```

```yaml
id: tech-readiness-assessor
name: TechReadinessAssessor
purpose: Assess data platform, ML ops, infrastructure readiness for AI workloads.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - data_pipelines
  - infra_assets
  - ML platform inventory
outputs:
  - readiness score per platform pillar
cite_tag_format: tower-tech-ready-v1
implementation_pointer: src/lib/tower/tech-data-readiness.ts
status: shipped
```

```yaml
id: tool-waste-detector
name: ToolWasteDetector
purpose: Identify unused or inefficiently adopted AI tools across the portfolio.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - usage telemetry
  - license inventory
outputs:
  - waste signals with cost/program attribution
cite_tag_format: tower-tool-waste-v1
implementation_pointer: src/lib/tower/ai-tool-waste-signals.ts
status: shipped
```

```yaml
id: portfolio-pressure-synthesizer
name: PortfolioPressureSynthesizer
purpose: Synthesize portfolio pressure (dependency, adoption, risk) into named pressure narratives.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - cross-program signals
  - portfolio state
outputs:
  - pressure narratives ranked by severity
cite_tag_format: tower-pressure-v1
implementation_pointer: src/lib/tower/control-tower-active-lens-view.ts
status: shipped
```

```yaml
id: adoption-cost-correlation
name: AdoptionCostCorrelation
purpose: Compute adoption × cost × productivity correlation shape across programs.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - adoption metrics
  - cost metrics
  - productivity scores
outputs:
  - correlation matrix with insights
cite_tag_format: tower-adoption-cost-v1
implementation_pointer: src/lib/tower/adoption-cost-productivity-correlation.ts
status: shipped
```

```yaml
id: portfolio-executive-brief-writer
name: PortfolioExecutiveBriefWriter
purpose: Compose CIO-of-staff executive brief integrating 5D signals across the portfolio.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - 5D signals (inventory/adoption/value/risk/cost)
  - posture computation
outputs:
  - executive brief with tradeoff card
cite_tag_format: tower-exec-brief-v1
implementation_pointer: src/components/tower/AtlasExecutiveBriefCanvas.tsx + src/lib/atlas/orchestrator.ts
status: shipped
notes: This is Atlas-the-front-agent's primary output. Note distinction from Source's `executive-decision-brief-writer` specialist (event-scoped, called via Sentinel routing).
```

```yaml
id: signal-classifier
name: SignalClassifier
purpose: Classify portfolio signals into pillar + severity + program attribution.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - raw signal inputs
outputs:
  - classified signal (pillar, severity, programs_involved)
cite_tag_format: tower-signal-classify-v1
implementation_pointer: src/lib/tower/classify.ts
status: shipped
```

```yaml
id: programme-gate-monitor
name: ProgrammeGateMonitor
purpose: Track phase gate status and stage progress across the portfolio's active programs.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - per-program phase state
  - gate criteria
outputs:
  - portfolio gate dashboard with at-risk flags
cite_tag_format: tower-gate-monitor-v1
implementation_pointer: src/lib/tower/programme-gate-status-view.ts
status: shipped
```

```yaml
id: activity-narrator
name: ActivityNarrator
purpose: Narrate portfolio activity timeline; surface notable events for executive review.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - activity log
outputs:
  - narrated timeline with attribution
cite_tag_format: tower-activity-narrate-v1
implementation_pointer: src/lib/tower/reasoning-activity-brief-view.ts
status: shipped
```

```yaml
id: enterprise-context-summarizer
name: EnterpriseContextSummarizer
purpose: Snapshot tech, projects, staff, volumetrics for executive context.
owner_front_agent: atlas
surfaces_served: [tower]
inputs:
  - tech stack
  - project inventory
  - staff augmentation
  - volumetrics
outputs:
  - enterprise context summary
cite_tag_format: tower-enterprise-context-v1
implementation_pointer: src/lib/tower/enterprise-summary.ts
status: shipped
```

---

## 8 · Intelligence specialists (front: Sentinel · 11 captured)

**Architectural note:** Intelligence is the "primary" Sentinel surface — has dedicated `sentinel-broker-adapter.ts` (corpus-wide, tenant optional), full voice doctrine with 17 banned patterns, 4-mode answer model. Source's use of Sentinel is secondary (no named broker adapter). One identity, two broker scopes — Intelligence is the deeper application, Source the secondary.

```yaml
id: pattern-search
name: PatternSearch
purpose: Keyword + semantic search over patterns; returns scored, ranked matches scoped to tenant + domain.
owner_front_agent: sentinel
surfaces_served: [intelligence, source, moves]
inputs:
  - query string
  - tenant + domain scope
outputs:
  - top-K patterns with scores
cite_tag_format: int-pattern-search-v1
implementation_pointer: src/lib/intelligence/tools/searchPatterns.ts
status: shipped
```

```yaml
id: pattern-neighborhood-walker
name: PatternNeighborhoodWalker
purpose: Graph-walk retrieval — given a pattern, surface neighbors (related patterns, contradictions, evidence).
owner_front_agent: sentinel
surfaces_served: [intelligence]
inputs:
  - pattern_id
  - hop depth
outputs:
  - neighborhood graph slice
cite_tag_format: int-pattern-neighborhood-v1
implementation_pointer: src/lib/intelligence/tools/patternNeighborhood.ts
status: shipped
```

```yaml
id: evidence-lookup
name: EvidenceLookup
purpose: Look up evidence supporting or challenging a claim across the three corpora.
owner_front_agent: sentinel
surfaces_served: [intelligence, source]
inputs:
  - claim text
  - tenant + corpus scope
outputs:
  - cited evidence with confidence
cite_tag_format: int-evidence-lookup-v1
implementation_pointer: src/lib/intelligence/tools/evidenceLookup.ts
status: shipped
```

```yaml
id: synthesis-validator
name: SynthesisValidator
purpose: Run quality gates + failure-mode check + four-layer-reasoning instructions on a synthesis attempt.
owner_front_agent: sentinel
surfaces_served: [intelligence]
inputs:
  - draft synthesis
outputs:
  - validation verdict + remediation list
cite_tag_format: int-synthesis-validate-v1
implementation_pointer: src/lib/intelligence/tools/validateSynthesis.ts
status: shipped
```

```yaml
id: contradiction-detector
name: ContradictionDetector
purpose: Detect contradictions between current synthesis and prior synthesis; emit contradiction-flag artifact.
owner_front_agent: sentinel
surfaces_served: [intelligence, tower]
inputs:
  - prior synthesis
  - current synthesis
outputs:
  - contradiction artifacts with severity
cite_tag_format: int-contradiction-v1
implementation_pointer: src/lib/intelligence/contradiction-detector.test.ts (logic implied)
status: shipped
```

```yaml
id: four-mode-router
name: FourModeRouter
purpose: Route reasoning queries to one of four modes — generic / corpus_grounded / tenant_grounded / cross_corpus — with appropriate retrieval profile.
owner_front_agent: sentinel
surfaces_served: [intelligence]
inputs:
  - query intent
  - tenant context
outputs:
  - mode selection + retrieval scope
cite_tag_format: int-four-mode-v1
implementation_pointer: src/lib/intelligence/intelligence-canvas-modes.ts
status: partial
notes: 4-mode toggle UI is INT-5 pending; canvas mode-tabs exist for pattern-detail but not yet for J3 conversational ask.
```

```yaml
id: three-corpus-retriever
name: ThreeCorpusRetriever
purpose: Query three Pinecone namespaces (tenant, industry, global:ai_governance) in parallel and decay-rank by freshness.
owner_front_agent: sentinel
surfaces_served: [intelligence, source]
inputs:
  - query embedding
  - tenant + industry context
outputs:
  - merged ranked chunk list with namespace attribution
cite_tag_format: int-three-corpus-v1
implementation_pointer: src/lib/agent/retrieval.ts:134-178 (assembleRetrievalContext)
status: shipped
notes: Uses text-embedding-3-large (3072 dims). Halflife = 365 days for freshness decay.
```

```yaml
id: voice-doctrine-validator
name: VoiceDoctrineValidator
purpose: Detect voice drift — coach drift, marketing register, hedge drift, hollow openers, ungrounded openers.
owner_front_agent: sentinel
surfaces_served: [intelligence, source]
inputs:
  - draft Sentinel response
outputs:
  - drift verdict + flagged patterns
cite_tag_format: int-voice-doctrine-v1
implementation_pointer: src/lib/agent/voice-doctrine/sentinel.ts (17 banned patterns, checkSentinelVoice)
status: shipped
notes: Tests in voice-doctrine/__tests__/sentinel.test.ts. Doctrine gated behind SENTINEL_VOICE_DOCTRINE_DRAFT flag (P1 — needs founder sign-off to flip to prod).
```

```yaml
id: failure-mode-classifier
name: FailureModeClassifier
purpose: Surface relevant failure modes from the AI program failure-mode catalog given current context.
owner_front_agent: sentinel
surfaces_served: [intelligence, moves]
inputs:
  - program archetype or pattern context
outputs:
  - applicable failure modes with prevention guidance
cite_tag_format: int-failure-mode-classify-v1
implementation_pointer: src/lib/intelligence/ai-program-failure-modes
status: shipped
notes: Cross-consumed by Moves' AiProgramFailureModeDetector specialist.
```

```yaml
id: provenance-ribbon-renderer
name: ProvenanceRibbonRenderer
purpose: Render source basis + confidence + citation chain on every artifact rendered in Intelligence UI.
owner_front_agent: sentinel
surfaces_served: [intelligence]
inputs:
  - artifact with provenance metadata
outputs:
  - rendered provenance ribbon
cite_tag_format: int-provenance-ribbon-v1
implementation_pointer: src/components/intelligence/IntelligenceProvenanceRibbon.tsx
status: shipped
```

```yaml
id: tenant-corpus-scoper
name: TenantCorpusScoper
purpose: Apply tenant-isolation metadata filter to vector retrieval; reject cross-tenant query construction.
owner_front_agent: sentinel
surfaces_served: [intelligence, source]
inputs:
  - retrieval query
  - tenant_key
outputs:
  - tenant-scoped query with metadata filter
cite_tag_format: int-tenant-scope-v1
implementation_pointer: src/lib/agent/retrieval.ts (clientVectorMetadataFilter)
status: shipped
notes: Cross-product utility — same scope check applies to Source's evidence retrieval.
```

---

## 9 · Cross-product utilities (callable from any orchestrator · 4 captured)

These specialists serve multiple front agents and don't naturally belong to any single product surface.

```yaml
id: tenant-isolation-enforcer
name: TenantIsolationEnforcer
purpose: Enforce tenant-isolation across all data access; reject cross-tenant queries; log violations.
owner_front_agent: shared
surfaces_served: [all]
implementation_pointer: docs/build/SETUP_ADMIN_DATA_VIEW_FAILURE_MODE_DRIVEN_DESIGN.md §E.3
status: partial
notes: Substrate-level RLS still service-role-only; per-user RLS is pilot-blocking (F-SU-106).
```

```yaml
id: context-broker
name: ContextBroker
purpose: Single seam between app tier and data corpora (graph + vector + relational + evidence ledger). All agent retrievals route through this.
owner_front_agent: shared
surfaces_served: [all]
implementation_pointer: src/lib/agent/context-builder.ts + src/lib/intelligence/sentinel-broker-adapter.ts
status: partial
notes: Memory directive (`feedback_broker_boundary.md`) — app tier MUST NOT directly import EnterpriseDataRoom / vector / graph; everything through this contract.
```

```yaml
id: provenance-resolver
name: ProvenanceResolver (cross-product version)
purpose: Trace any artifact back through ingestion → graph → vector → agent retrieval; produce full provenance chain.
owner_front_agent: shared
surfaces_served: [all]
implementation_pointer: spine doc §E.4 + admin_audit_log + source_context_receipts
status: partial
notes: Each product front agent presents provenance through their voice; the resolver itself is shared.
```

```yaml
id: agent-voice-router
name: AgentVoiceRouter
purpose: Route incoming user intent to the correct front agent based on surface; apply per-agent voice doctrine.
owner_front_agent: shared
surfaces_served: [all]
implementation_pointer: src/app/api/chat/agent/route.ts
status: partial
notes: Voice doctrine currently exists for Sentinel only; needs to expand to Nexus, Atlas, Steward.
```

---

## 10 · Catalog summary

**Captured: 67 specialists** across 5 products + cross-product utilities.

| Section | Front agent | Specialists captured | Status mix |
|---|---|---|---|
| Source (§3) | Sentinel | 12 | mostly shipped, some partial |
| Setup (§5) | Steward | 16 | mix shipped/partial/not-built |
| Moves (§6) | Nexus | 12 | all shipped |
| Tower (§7) | Atlas | 15 | all shipped |
| Intelligence (§8) | Sentinel | 11 | mostly shipped, doctrine flag-gated |
| Cross-product (§9) | shared | 4 | partial |

The catalog is now load-bearing for the redesign — it shows which capabilities exist, which need to be built, and which front agent owns which scope. New specialists land here first; code references the entry by `id`.

---

## 6 · Catalog governance

- **Add a specialist:** PR with new entry, must include all schema fields. Code references the entry by `id`.
- **Retire a specialist:** mark `status: retired` with replacement pointer; do not delete entries (history matters for trace reconstruction).
- **Rename a specialist:** new entry with `replaces:` pointing at the old; old marked retired. The cite_tag_format includes a version suffix to support clean renames.
- **Change ownership:** if a specialist changes its `owner_front_agent` (e.g., as products converge), update the entry; trace renderers should resolve historical cite tags to the original ownership at the time of generation.

End of v0.1 scaffold.
