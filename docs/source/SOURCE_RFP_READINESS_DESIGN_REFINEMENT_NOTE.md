# Source RFP Readiness & Nexus Intake — Design Refinement Note

**Author:** Master Source Product Architect. **Date:** 2026-06-10. **Branch:** `source-rfp-readiness` off `origin/main` (0375fd920).

Purpose: before coding, review what exists, refine the proposed design, and set the
implementation sequence. The headline: **~70% of the required architecture already
exists** (archetype framework + evidence-readiness + RFP canon + grounded-answer +
context-bundle trace + the 4-mode intake model + a live-proven SkyHarbor data plane).
The right move is to **extend, not rebuild** — and the principal refinement is to
collapse the proposed parallel types into the existing ones so there is one source of
truth.

## 1 · What already exists (and where)

**On `origin/main` (merged):**
- `src/lib/source/archetypes/` — `SourceEventArchetype` (registry.ts) with `rfpDocumentStructure`, `requiredEvidenceFamilies`/`optionalEvidenceFamilies`, `pricingModel`, `evaluationModel`, `riskModel`, `negotiationLevers`, `deliverablePack`, `gateCriteria`, `agentGuidance`. **This already IS the `SourceEventArchetype` the brief asks for** (AMS_MANAGED_SERVICES is the live archetype).
- `evidence-readiness.ts` — `buildSourceEvidenceReadiness`, the 9-rung promotion-only `EvidenceState` ladder, per-stage gate clearance, `agentUsableFamilies` (the allow-list). **This is the evidence side of section readiness.**
- `rfp-canon.ts` — `buildArchetypeRfp` already renders each section and marks it `evidence_blocked` / `optional_omitted` when dependencies aren't `agent_ready` (never fabricated). **This is the binary precursor to the 4-mode model.**
- `grounded-answer.ts` — `buildGroundedSourceAnswer` + `GroundedSourceAnswerEnvelope` (tenant fence, derived confidence, refuse-on-insufficient). **This is the governance gate for any generation.**
- `event-archetype-resolver.ts` — classifier category → archetype.

**On unmerged PR #3378 (`skyharbor-dataset-v2`):**
- `src/lib/source/context-bundle-trace.ts` — `SourceContextBundleTrace` (the PR-8 trace; needs an RFP-section variant).
- `docs/source/SOURCE_RFP_SECTION_INTAKE_MODEL.md` — **the approved 4-mode model + the AMS section→mode matrix + the Nexus intake question pack** (this brief's product model, already designed).
- `docs/source/SOURCE_DELIVERABLE_STANDARD.md` — gold-standard TOC/format/quality bar.
- `gen-rfp-issued.cjs` / `render-rfp-issued.mjs` — disclosure-tiered issued RFP generator + typeset DOCX renderer.
- Context-ingestion: `template-registry.ts` (extended with `sla-register` + `service_levels` dimension); the governed Admin bulk loader (`runBulkContextUpload`, `stage_and_process`) with dimension→segment→record_type→facts routing + supersede.

**Live data plane (proven this program):** SkyHarbor v2 loaded (3,101 records / 23,895 facts), indexed to Azure AI Search `tenant-context-v1`, retrieval + tenant-isolation proven (12/12), promoted to `agent_ready`. So PR-9's live proof has a real substrate.

## 2 · What to reuse (do not rebuild)
- **SourceEventArchetype** (registry) — the source of truth for evidence families + `rfpDocumentStructure`. PR-2's "AMS section map" extends this, not a new model.
- **Evidence families** — reuse the archetype family keys (`ticket_volumes`, `sla_baseline`, `run_cost_baseline`, …). Do not invent a parallel family vocabulary.
- **buildSourceEvidenceReadiness** + the promotion ladder — the evidence half of section readiness.
- **The governed Admin bulk loader + template-registry** — intake capture (PR-5) commits through this (`source_basis=user_attested`), NOT a side table. The brief's `SourceIntakeEvidenceTemplate` maps onto the existing `ContextTemplateDefinition` (dimension/required-columns) — extend it, don't fork it.
- **buildGroundedSourceAnswer** — every section generation routes through it (governance gate + envelope).
- **context-bundle-trace** — extend into `SourceRfpContextBundleTrace` (PR-8).
- **Disclosure tiering** (issued vs internal) — preserved in section generation.

## 3 · What to change / improve (refinements to the brief)
1. **One section model, not two.** The brief proposes `RfpSectionDefinition` + `RfpSectionReadiness`. The existing `RfpSection` (rfp-canon) is a thinner subset. Refinement: introduce `RfpSectionDefinition` as the **superset config** and have `rfp-canon` consume it; `RfpSectionReadiness` is the computed result. Migrate `buildArchetypeRfp`'s binary `evidence_blocked` into the **4-mode resolver** so there is a single readiness path, not two.
2. **4 modes are computed, not just declared.** A section has a `defaultMode`, but the *effective* mode is resolved against live evidence: a section declared AUTO-GOVERNED with missing `agent_ready` evidence **drops to ELICIT** (or CLIENT-COMPLETE if its inputs are judgment/policy). This enforces the hard rule "missing evidence never becomes AUTO-GOVERNED" in code, not prose.
3. **Readiness status is a richer label set** than the binary today: `issue_ready | preliminary | evidence_missing | client_to_complete | legal_review_required | procurement_review_required | pricing_review_required | blocked`. The resolver derives it from mode + evidence coverage + review flags.
4. **Intake templates reuse the loader.** `SourceIntakeEvidenceTemplate.targetContextDimension/targetRecordType` map to the existing `ContextDimension` + record_type routing, so a captured upload flows through the *same* governed path that already works.
5. **Disclosure tier is a section property.** Carry `disclosureTier: vendor_facing | internal_only | aggregate_only` on the section definition so the issued-RFP generator filters automatically (the lesson from the leak fix).

## 4 · What NOT to build yet
- The full **Source UI** (PR-6) until the readiness + intake engine is proven headless.
- The **live interactive Nexus chat** runtime until the capture API (PR-5) + trace (PR-8) exist.
- **Archetypes beyond AMS_MANAGED_SERVICES** — the design must support them, but only AMS is implemented now.
- A **new trace system** — extend the existing one.

## 5 · Risks
- **Duplication**: building parallel section/readiness types instead of extending → mitigated by §3.1.
- **Foundation split**: the 4-mode model doc + trace are on unmerged #3378. **Recommendation: merge #3378 to main first** (it's additive, green-equivalent) OR port `context-bundle-trace.ts` + the intake-model doc into this branch. This note assumes the readiness *engine* (new code) builds cleanly on main today; the trace is ported in PR-8.
- **Governance bypass risk**: intake captured only in chat. Mitigated by PR-5 routing through the governed loader (`user_attested`, never auto-`agent_ready`).
- **Disclosure leak**: section generation must respect the tier (§3.5).
- **Scope**: this is a 10-PR program; trying to land it in one pass would lower quality. Executed PR-by-PR, each green before merge.

## 6 · Implementation sequence (refined)
- **PR-1 (this):** design note + `rfp-readiness/` foundation — `SectionMode`, `ReadinessStatus`, `DisclosureTier` enums; `RfpSectionDefinition`, `RfpSectionReadiness`, `NexusIntakeItem`, `SourceIntakeEvidenceTemplate` types; `resolveSectionReadiness` (4-mode, enforces no-AUTO-GOVERNED-without-evidence) + tests across all four modes.
- **PR-2:** AMS section map (data-driven `RfpSectionDefinition[]` extending the archetype `rfpDocumentStructure`; the 16-section AMS pack; issue-ready/preliminary/client-complete rules + Nexus next-actions).
- **PR-3:** intake evidence-template registry (14 families → loader templates, accepted types, columns, sample rows, affected sections).
- **PR-4:** Nexus intake queue builder + prioritization + targeted question generator.
- **PR-5:** intake capture → governed context (chat answer + upload commit via the loader; readiness recompute; no auto-`agent_ready`).
- **PR-6:** Source readiness UI panel (section cards, missing-input actions, scorecard).
- **PR-7:** section/package regeneration (reuse rfp-canon + issued generator; preserve placeholders/citations/missing-evidence).
- **PR-8:** `SourceRfpContextBundleTrace` + claim/source validation (extend existing trace).
- **PR-9:** SkyHarbor AMS live proof (readiness → intake → capture → recompute → regenerate → export → trace) on the live data plane.
- **PR-10:** reports.

## 7 · Integration points
- **Context layer:** `governed_object_readiness` + `enterprise_context_*` + the Admin bulk loader. Intake capture writes governed objects (`source_basis=user_attested`, `confidence`, owner, `intake_batch_id`), promotion-only to `agent_ready`. Readiness reads `agentUsableFamilies` + the ledger.
- **Source UI:** a Readiness panel in the Source event surface — section cards with mode/status/score/missing-inputs/actions + a front scorecard. (PR-6.)
- **Nexus:** the intake queue feeds the Nexus chat; section generation calls `buildGroundedSourceAnswer` (governed bundle) and emits `SourceRfpContextBundleTrace`; no raw-prompt generation of client facts.

## 8 · Document-generation quality standard (addendum) — adopted
The final-document quality standard (explicit Claude prompt spec; 11pt body / styled headings / banded tables; Word+Excel companion split for pricing/SLA/scope/inventory/scorecard/response-matrix; mandatory client placeholders; readiness scorecard in-document; senior-advisor tone) is adopted as the rendering contract for PR-7. The renderers (`render-rfp-issued.mjs` foundation) already implement cover/TOC/header-footer/typography; PR-7 extends to the Excel companion workbook + placeholder discipline.
