# Solution Intelligence Verification Runbook

Slice ID: QA3
Slice name: Solution Intelligence Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
**solution intelligence** layer — the Solution Archetype Registry
(SOL3), the Analytics Modernization Component Pack (SOL4), the
Healthcare AI Archetypes (SOL5), the Build / Buy / Partner Decision
Framework (SOL6), the Solution Archetype Detail Read Model (SOL7),
and the Solution Intelligence Canvas Contract (SOL8) — lands
**honestly** before push or PR. It is the third companion to the
QA1 ([`AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md))
and QA2 ([`SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md`](./SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md))
runbooks.

The runbook is meant to be **walked manually** after the relevant
slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Each section has one expected outcome per row; do not skip rows.

---

## §A · Purpose and scope

QA3 verifies six canonical artifacts that together describe how the
platform **knows what to build for a specific client** and how it
**presents that knowledge honestly** today:

- **SOL3 — Solution Archetype Registry.** The canonical 12-archetype
  catalog of recurring solution shapes (e.g., AI-led PDLC
  transformation, analytics modernization, ambient clinical, HCC risk
  adjustment, prior authorization automation, build-buy-partner
  evaluation). Each archetype carries 21 required fields covering
  applicability, components, workshops, deliverables, evidence
  requirements, and governance.
- **SOL4 — Analytics Modernization Component Pack.** The 15
  canonical components of an analytics-modernization solution
  (data foundation, semantic layer, governance, AI readiness, etc.),
  each with 13 required fields. SOL4 is the analytics analogue of
  SOL2's AI-led PDLC component pack.
- **SOL5 — Healthcare AI Archetypes.** Twelve healthcare-specific
  archetypes (ambient clinical, HCC risk adjustment, prior auth,
  revenue integrity, denial prevention, etc.) with deeper clinical
  workflow, governance, and SME requirements than the generic
  registry.
- **SOL6 — Build / Buy / Partner Decision Framework.** A
  deterministic evaluator that takes a solution archetype plus the
  client's current state and recommends `build` / `buy` / `partner`
  based on 14 canonical criteria, ≥8 vendor / startup factors across
  five categories, and ≥5 enterprise readiness risks. Governance
  warnings populate when the archetype is regulated or carries a
  high-risk tag.
- **SOL7 — Solution Archetype Detail Read Model.** Pure deterministic
  view-model that projects an archetype + client context into a
  byte-equal canvas read model with 12 sections and a readiness
  summary; the read model is what the canvas (SOL9+) renders.
- **SOL8 — Solution Intelligence Canvas Contract.** Documentation-
  only specification of the canvas itself: route candidates, agent
  roles, sections, interaction model, versioning, handoff to the
  deliverable renderer (PDEL), no-live-model rules, future slices.

**In scope.** Reading the artifact specs / source modules; running
the tests; reading the JSON projection of each module to check for
fabricated dollars, fake citations, or named-vendor endorsements;
walking the deterministic evaluator outputs across the canonical
test scenarios.

**Out of scope.** Workshop dynamics (covered in QA2). Agentic spine
walks of Programs / Tower / Intelligence / Admin (covered in QA1).
Live retrieval, live model calls, exporter / download pipelines, real
evidence citations, live agent runtimes — all deferred.

---

## §B · Branch hygiene

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope; no surprise commits. |
| Last three commits | `git log --oneline -3` | Each commit message names a SOL3–SOL8 slice (or QA3 itself); subjects are short and scoped. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / runtime / migration files. |
| Pre-commit staged set was exact | `git diff --cached --name-only` after the commit returns empty (because everything staged was committed) — and re-staging the same files prints exactly the slice's allowed file list | Means the staged set matched the slice's `allowedFiles`; nothing slipped in. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase files. |

**Pass criterion for each row:** the actual output equals the
expected outcome verbatim, modulo whitespace. **Stop and investigate**
if any check fails. Do not push or demo from a working tree with
unexplained modifications.

---

## §C · Required validation commands

Run from the repo root in order. Each must pass before the per-slice
checklist walks.

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. |
| DOM integrity linter | `npm run integrity:dom` | Reports **0 violations**. (Re-enabled by the recent integrity fix; "Coming soon" / "TBD" / "Lorem ipsum" anywhere in the source tree fails the run.) |
| SOL3 — archetype registry | `npx jest src/__tests__/integration/solutions/solution-archetype-registry.test.ts` | All green. |
| SOL4 — analytics modernization components | `npx jest src/__tests__/integration/solutions/analytics-modernization-components.test.ts` | All green. |
| SOL5 — healthcare AI archetypes | `npx jest src/__tests__/integration/solutions/healthcare-ai-archetypes.test.ts` | All green. |
| SOL6 — build / buy / partner framework | `npx jest src/__tests__/integration/solutions/build-buy-partner-framework.test.ts` | All green. |
| SOL7 — archetype detail read model | `npx jest src/__tests__/integration/solutions/solution-archetype-detail-view.test.ts` | All green. |
| SOL8 — canvas contract (docs-only) | `ls docs/build/slices/SOL8_*.md && grep -E '^## §[A-K]' docs/build/slices/SOL8_*.md` | File exists; eleven `## §A` … `## §K` headings print in order. No section missing. |

If any command fails, **stop and decide**: amend the slice, discard,
or capture the failure in a tracked issue before proceeding to the
per-slice walk.

---

## §D · Per-slice verification checklists

### SOL3 — Solution Archetype Registry

Read `src/lib/solutions/archetype-registry.ts` (or whichever module
the SOL3 slice declared) alongside its slice doc. Assert each row
explicitly.

| Check | Expected |
|---|---|
| Twelve archetypes in canonical order | `ai_led_pdlc_transformation`, `analytics_modernization`, `ambient_clinical_value_chain`, `hcc_risk_adjustment_coding_accuracy`, `prior_authorization_automation`, `revenue_integrity_ai`, `denial_prevention_ai`, `data_governance_modernization`, `customer_360_unification`, `agent_assist_for_contact_center`, `build_buy_partner_evaluation`, and `regulatory_change_management`. Order is byte-equal across runs. |
| Twenty-one required fields per archetype | `key`, `displayName`, `summary`, `industryFit`, `applicabilityCriteria`, `currentStateInputs`, `targetOutcomes`, `solutionComponents`, `recommendedFirstWorkshop`, `workshopsRequired`, `deliverablesGenerated`, `evidenceRequired`, `governanceConsiderations`, `risks`, `dataSources`, `requiredSmes`, `successMetrics`, `failureModes`, `relatedPatterns`, `provenance`, `lastUpdated`. Every archetype defines all 21; no field is `undefined`, `null`, or empty string. |
| AI-led PDLC linkage | `ai_led_pdlc_transformation.solutionComponents` contains at least one `AiLedPdlcComponentKey` from the canonical SOL2 component pack (string match against the SOL2 union type). |
| Analytics modernization concepts | `analytics_modernization.summary`, `applicabilityCriteria`, or `solutionComponents` mention `data foundation`, `governance`, and `semantic layer` (case-insensitive substring match). |
| Healthcare archetypes 3–5 | `ambient_clinical_value_chain`, `hcc_risk_adjustment_coding_accuracy`, and `prior_authorization_automation` each reference clinical workflow steps **and** governance considerations (each has ≥1 `governanceConsiderations` row). |
| Build / Buy / Partner referencing | `build_buy_partner_evaluation.summary` or `applicabilityCriteria` mentions vendor and startup assessment. |
| No invented dollars | `JSON.stringify(SOLUTION_ARCHETYPES)` does not match `/\$\s?\d/`. |
| Module hygiene | The module imports nothing from `lib/auth/**`, `lib/source/**`, `lib/agent/**`, `supabase/**`. No `Date.now`, `Math.random`, `new Date()`, `fetch`, `anthropic`, `openai`, `useState`, `useEffect`. |

### SOL4 — Analytics Modernization Component Pack

Read `src/lib/solutions/analytics-modernization-components.ts`
alongside its slice doc.

| Check | Expected |
|---|---|
| Fifteen components in canonical order | `data_foundation`, `data_quality_and_observability`, `data_governance_and_stewardship`, `semantic_layer_and_metrics_modeling`, `metadata_catalog_and_lineage`, `master_data_management`, `analytics_engineering_practices`, `self_service_bi_enablement`, `embedded_analytics`, `decision_intelligence_layer`, `ai_readiness_for_analytics`, `streaming_and_real_time_analytics`, `cost_and_consumption_governance`, `analytics_security_and_privacy`, `analytics_change_and_adoption`. Order is byte-equal across runs. |
| Thirteen required fields per component | `key`, `displayName`, `summary`, `definition`, `outcomes`, `prerequisites`, `relatedArchetypes`, `relatedPatterns`, `risks`, `successMetrics`, `evidenceRequired`, `provenance`, `lastUpdated`. Every component defines all 13. |
| Coverage of the four pillars | At least one component each addresses **semantic layer**, **data quality**, **governance**, and **AI readiness** (verified by the field-name check above plus `summary` / `definition` substring). |
| `relatedArchetypes` cross-reference | Every component's `relatedArchetypes` entries are valid SOL3 archetype keys (string match against `SolutionArchetypeKey`). At least `analytics_modernization` appears across the pack. |
| No invented dollars | `JSON.stringify(ANALYTICS_MODERNIZATION_COMPONENTS)` does not match `/\$\s?\d/`. |
| Module hygiene | Same forbidden-import list as SOL3. |

### SOL5 — Healthcare AI Archetypes

Read `src/lib/solutions/healthcare-ai-archetypes.ts`. SOL5 augments
SOL3 with deeper clinical / governance content; the registry order
matches SOL3 healthcare entries plus seven additional healthcare-only
archetypes.

| Check | Expected |
|---|---|
| Twelve archetypes in canonical order | `ambient_clinical_value_chain`, `hcc_risk_adjustment_coding_accuracy`, `prior_authorization_automation`, `revenue_integrity_ai`, `denial_prevention_ai`, `clinical_documentation_integrity`, `utilization_management_ai`, `care_management_risk_stratification`, `population_health_analytics`, `quality_measure_automation`, `payer_provider_data_exchange`, `clinical_decision_support_governance`. |
| Ambient clinical workflow | `ambient_clinical_value_chain.workflow` (or `clinicalWorkflow`) lists downstream **coding**, **billing**, and **quality** stages — not just the encounter capture step. Substring match for each. |
| HCC risk adjustment workflow | `hcc_risk_adjustment_coding_accuracy.workflow` mentions `RAF`, `submission`, and `audit` (case-insensitive). |
| Prior authorization workflow | `prior_authorization_automation.workflow` (or related field) contains the strings `evidence packet`, `clinical policy`, and `payer workflow`. |
| Distinct revenue integrity vs denial prevention | `revenue_integrity_ai` and `denial_prevention_ai` resolve to different objects with different summaries, different success metrics, and different failure modes. (No copy-paste duplication.) |
| Each healthcare archetype has ≥3 data sources | `dataSources.length >= 3` for every entry. |
| Each healthcare archetype has ≥2 SMEs | `requiredSmes.length >= 2` for every entry. |
| Each healthcare archetype has ≥2 governance considerations | `governanceConsiderations.length >= 2`. |
| Vendor deny-list | No archetype's text fields contain any of the named-vendor strings on the deny-list (e.g., `Epic`, `Cerner`, `Athena`, `Nuance DAX`, `Abridge`, `Suki`, `Augmedix`, `Olive`, `Innovaccer`, `Cohere Health`, `Availity`, etc.). The exact deny-list lives next to the SOL5 source module; the test asserts zero matches. |
| Module hygiene | Same forbidden-import list as SOL3. |

### SOL6 — Build / Buy / Partner Decision Framework

Read `src/lib/solutions/build-buy-partner-framework.ts` and the
deterministic recommender `recommendBuildBuyPartner(...)`.

| Check | Expected |
|---|---|
| Fourteen criteria in canonical order | `strategic_differentiation`, `time_to_value`, `internal_capability`, `market_maturity`, `vendor_landscape`, `data_sensitivity`, `regulatory_exposure`, `ip_and_moat_implications`, `total_cost_of_ownership`, `change_management_burden`, `integration_surface_area`, `ongoing_operating_model`, `risk_tolerance`, `flexibility_and_exit_options`. |
| Vendor / startup factors | At least 8 factors across five categories: **product fit**, **company viability**, **commercial / contract**, **integration / extensibility**, **trust / governance**. The framework module exports the categories enum; the test asserts category coverage. |
| Enterprise readiness risks | At least 5 named risks (e.g., `data_residency_misalignment`, `vendor_lockin`, `model_drift_unmonitored`, `regulatory_change_exposure`, `staffing_gap_for_in_house_path`). |
| Deterministic recommendation rules | The recommender is a pure function: same `(archetype, currentState)` input always returns the same `{ recommendation, confidence, rationale, vendorChecks?, governanceWarnings? }`. Re-call ≥3 times; results are byte-equal. |
| Rule: build | `recommendation === 'build'` when the input has `differentiation === 'high'` AND `internalCapability === 'present_or_buildable'`. Confidence is `medium` or `high` per the spec. |
| Rule: buy | `recommendation === 'buy'` when `timeToValuePressure === 'high'` AND `marketMaturity === 'mature'` AND `differentiation !== 'high'`. |
| Rule: partner | `recommendation === 'partner'` when `marketMaturity === 'fragmented'` AND `differentiation !== 'low'`. |
| Confidence levels valid | Every output's `confidence` is one of `low`, `medium`, `high`. No invented levels. |
| Vendor / startup checks populated when option ≠ build | When `recommendation` is `buy` or `partner`, `vendorChecks` is non-empty and references the SOL6 vendor / startup factors (string match). When `recommendation` is `build`, `vendorChecks` may be empty or a short build-readiness list — never a list of named vendors. |
| Governance warnings populated | `governanceWarnings` is non-empty when the input archetype is `regulated === true` (e.g., any healthcare archetype, `regulatory_change_management`) **or** carries a `risks` entry with `severity === 'high'`. |
| No vendor names appear as factual endorsements | The framework's text fields (`rationale`, `vendorChecks`, `governanceWarnings`) never contain a named vendor as an endorsement; the deny-list scan from SOL5 applies. Generic phrasing like "evaluate vendors against …" is allowed. |
| No invented dollars | `JSON.stringify(BUILD_BUY_PARTNER_FRAMEWORK)` and the recommender output do not match `/\$\s?\d/`. |
| Module hygiene | Same forbidden-import list as SOL3. |

### SOL7 — Solution Archetype Detail Read Model

Read `src/lib/solutions/archetype-detail-view.ts` (the
`buildSolutionArchetypeDetailView`, `buildSolutionArchetypeCanvasSections`,
`summarizeSolutionArchetypeReadiness` functions).

| Check | Expected |
|---|---|
| Byte-equal across calls | `buildSolutionArchetypeDetailView(archetypeKey, currentState)` returns the same object (deep-equal, JSON-stringify-equal) when called repeatedly with the same inputs across the canonical test fixtures. No `Date.now` / `Math.random` / `new Date()` anywhere in the call path. |
| Twelve canvas sections | `buildSolutionArchetypeCanvasSections(archetypeKey, currentState)` returns exactly 12 sections in canonical order: `summary`, `applicability`, `currentStateInputs`, `solutionComponents`, `workshopsRequired`, `deliverablesGenerated`, `evidenceRequired`, `governanceConsiderations`, `risksAndFailureModes`, `successMetrics`, `buildBuyPartnerVerdict`, `provenanceAndCitations`. |
| Readiness summary returns a valid level | `summarizeSolutionArchetypeReadiness(archetypeKey, currentState)` returns a `{ level, reasons[] }` where `level` is one of `complete`, `usable_with_gaps`, `pattern_only`, `insufficient`, `blocked` — the same five-state classifier used by S1 / S2. |
| Honest missing-input prompts | When `currentState` lacks a hard input (e.g., DORA baseline missing for AI-led PDLC; clinical workflow missing for ambient clinical), the `reasons[]` names the missing input verbatim and the canvas section's `prompts[]` surfaces a "needs current-state X" line. No hallucinated values. |
| No fabricated dollars or citations | `JSON.stringify(buildSolutionArchetypeDetailView(...))` does not match `/\$\s?\d/` and does not contain any `E-\d{3}` substring. |
| Module hygiene | Same forbidden-import list as SOL3. |

### SOL8 — Solution Intelligence Canvas Contract

Read `docs/build/slices/SOL8_SOLUTION_INTELLIGENCE_CANVAS_CONTRACT.md`.

| Check | Expected |
|---|---|
| §A through §K sections present | Eleven `## §A` through `## §K` headings render in order, none missing. (Use the `§C` validation command above.) |
| §A — purpose and scope | Names the canvas as the **read** surface for SOL3 / SOL4 / SOL5 / SOL6 / SOL7 outputs. |
| §B — route candidates | Names the index route `/tenant/[tenantSlug]/solutions` and the per-archetype canvas `/tenant/[tenantSlug]/solutions/[solutionKey]`. |
| §C — agent roles | Defines per-agent behavior on the canvas: Nexus composes, Sentinel surfaces patterns, Steward refuses on missing hard inputs, Atlas explains posture. |
| §D — canvas sections | Lists the 12 SOL7 canvas sections in canonical order. |
| §E — interaction model | Click-to-explore with single-instance drawer overlay, 120ms fade-only animation, no slide / scale / bounce. |
| §F — versioning and approval | Each archetype canvas carries a `version`, `approvedBy?`, and `approvalState` (`draft` / `in_review` / `approved`); approval state visible on the canvas header. |
| §G — handoff to deliverable renderer | Canvas explicitly hands off to PDEL / PDEL5 for any deliverable preview; no inline document rendering on the canvas itself. |
| §H — no-live-model rules | Names that no `anthropic` / `openai` / `pinecone` / live-retrieval call may be wired into the canvas read path; all values trace to deterministic seed. |
| §I — future slices | Lists SOL9 (canvas index page), SOL10 (per-archetype canvas page), SOL11 (build / buy / partner sub-canvas), SOL12 (canvas → PDEL handoff wiring), and any deferred SOL13+ items. |
| §J — no-fabrication rules | Forbids invented dollars, fake `E-###` citations, branded vendor endorsements; "Coming soon" / "TBD" / "Lorem ipsum" forbidden by DOM integrity. |
| §K — handoffs to QA / morning review | Names this runbook (QA3) as the verification companion. |
| Documentation only | The slice's `allowedFiles` are limited to the contract markdown and `docs/build/build-slices.json`. |

---

## §E · Route / canvas future verification checklist

When SOL9–SOL12 land (canvas implementation slices), the founder
walk extends to the live canvas. Until then, the rows below are
**read-and-defer**: the canvas does not render yet; the runbook
captures the exact checklist that **will** apply.

| Check | Where | Expected |
|---|---|---|
| Solutions index route mounts | `/tenant/[tenantSlug]/solutions` | Renders the SOL3 archetype catalog as 12 cards in canonical order; each card hrefs to the per-archetype canvas. |
| Per-archetype canvas mounts | `/tenant/[tenantSlug]/solutions/[solutionKey]` | Renders the 12 canvas sections from SOL7's `buildSolutionArchetypeCanvasSections(...)`; section order is byte-stable. |
| Click-to-open drawer | Any expandable section header | Single drawer at a time; opening a second drawer closes the first. 120ms fade-in / fade-out only — no slide, no scale, no bounce. |
| Versioning visible | Canvas header | Carries the archetype's `version`, `approvedBy?`, and `approvalState` chip (`draft` / `in_review` / `approved`). |
| Steward refusal language | When hard inputs missing | Names the missing input verbatim; routes to the right next action (workshop scheduling, evidence capture, or admin onboarding). No invented values. |
| Deliverable handoff | Canvas → PDEL | "Open deliverable" or equivalent affordance produces an OUT1-compliant output (PDEL render mode + canonical placeholder body until export wires). No inline render on the canvas. |
| Build / Buy / Partner sub-canvas | Section §D-11 | Reflects SOL6 evaluator output; recommendation chip + rationale list + vendor / startup checks block + governance warnings block. |
| Honest empty states | Tenants without context | Canvas renders explicit "no current-state inputs captured for this tenant yet" copy that names the absence; no blank screens, no placeholder dollars. |
| Disabled affordances | "Ask Nexus" / "Refine architecture" chips | Render `disabled` + `aria-disabled="true"` + `deferred · live <agent> runtime` sub-label until the runtime slice ships. |

---

## §F · No-fabrication checks

Walk every SOL3–SOL8 surface (source modules and the slice doc for
SOL8) and assert each line below explicitly.

| Check | Expected |
|---|---|
| No fake dollar values | For every solution module, `JSON.stringify(<MODULE_EXPORT>)` does not match `/\$\s?\d/`. Re-run after the per-slice tests. |
| No fabricated `E-###` citations | `git grep -E 'E-[0-9]{3}'` across the SOL3–SOL8 source modules returns zero matches. (Real evidence citations are wired via PDEL evidence trail; SOL surfaces may reference the **shape** but not invent IDs.) |
| No branded vendor endorsements | The deny-list scan from SOL5 (`grep -ri -f tools/sol-vendor-deny-list.txt src/lib/solutions/`) returns zero hits in any SOL3–SOL7 source module. SOL8's contract may name vendors only as **examples of categories to evaluate**, never as endorsements. |
| No "Coming soon" / "TBD" / "Lorem ipsum" | `npm run integrity:dom` (re-enabled by the recent integrity fix) reports 0 violations across the entire repo, including SOL3–SOL8 source. |
| Honest fallbacks | For deferred surfaces (canvas pages SOL9+, exporters, live retrieval), the canvas contract and the SOL7 read model use the explicit phrase "not yet wired" or "deferred" rather than implying live behavior. |
| Deterministic-source captions | Every solution-related read model carries a `provenance` field naming `deterministic_seed` (or equivalent) — never `live_retrieval`, never `agent_runtime`. |

Stop if any fabrication slips through. The platform's defensibility
depends on it.

---

## §G · Build / Buy / Partner checks

Walk the SOL6 evaluator's canonical test scenarios. Each scenario
has fixtures in
`src/__tests__/integration/solutions/build-buy-partner-framework.test.ts`.

| Scenario | Input shape | Expected recommendation | Other expectations |
|---|---|---|---|
| High-differentiation + internal capability | `differentiation === 'high'` AND `internalCapability === 'present_or_buildable'` | `build` | `confidence` ∈ {`medium`, `high`}; `vendorChecks` empty or build-readiness only; `governanceWarnings` populated only if regulated. |
| High time-to-value + mature market + non-high diff | `timeToValuePressure === 'high'` AND `marketMaturity === 'mature'` AND `differentiation !== 'high'` | `buy` | `vendorChecks` non-empty across product-fit / commercial / integration / trust categories; no named vendors. |
| Fragmented market + non-low diff | `marketMaturity === 'fragmented'` AND `differentiation !== 'low'` | `partner` | `vendorChecks` references startup-stage factors (e.g., funding, tenure, customer references); governance warnings populated for regulated archetypes. |
| Regulated archetype, any recommendation | `archetype.regulated === true` | (any recommendation) | `governanceWarnings` non-empty; references the archetype's specific regulatory exposure (HIPAA, OCR, CMS, payer policy, etc. as relevant). |
| High-risk-tagged archetype | Any archetype with a `risks` entry where `severity === 'high'` | (any recommendation) | `governanceWarnings` non-empty; references the high-risk row by name. |
| Confidence validity | All scenarios | n/a | `confidence` ∈ {`low`, `medium`, `high`} every time. |

Pass criterion: every fixture row above results in the expected
recommendation **and** the auxiliary expectations. The test suite
already encodes these; the runbook walks them so the founder reads
the rules in plain language before signing off.

---

## §H · Healthcare archetype checks

Walk the SOL5 fixtures.

| Check | Expected |
|---|---|
| Twelve archetypes, three sources each | Every healthcare archetype has `dataSources.length >= 3`. (Tested in `healthcare-ai-archetypes.test.ts`.) |
| Twelve archetypes, two SMEs each | Every archetype has `requiredSmes.length >= 2`. |
| Twelve archetypes, two governance considerations each | Every archetype has `governanceConsiderations.length >= 2`. |
| Ambient clinical workflow | `ambient_clinical_value_chain.workflow` (or `clinicalWorkflow`) lists `coding`, `billing`, and `quality` stages downstream of capture. |
| HCC risk adjustment workflow | `hcc_risk_adjustment_coding_accuracy.workflow` mentions `RAF`, `submission`, `audit`. |
| Prior authorization workflow | `prior_authorization_automation` includes the strings `evidence packet`, `clinical policy`, `payer workflow`. |
| Revenue integrity vs denial prevention distinct | Different summaries, success metrics, and failure modes; no field-level duplication. |
| No branded vendor endorsements | Deny-list scan returns zero hits across all healthcare archetypes. Generic phrasing ("ambient clinical scribe vendors", "payer-side rules engines") is allowed; named products are not. |

---

## §I · Analytics modernization checks

Walk the SOL4 fixtures.

| Check | Expected |
|---|---|
| AI readiness coverage | At least one component (e.g., `ai_readiness_for_analytics`) explicitly addresses AI readiness in `summary` / `definition` / `outcomes` / `prerequisites`. **All 15 components address AI readiness somewhere across their fields** — i.e., the union of fields per component contains an AI-readiness clause (substring `ai`, `ml`, `model`, `feature`, `inference`, `governance`, `lineage`, `quality`, `metadata`, `semantic` — the exact substring set lives in the test). |
| Semantic layer represented | `semantic_layer_and_metrics_modeling` exists and its `definition` references metric definitions, dimensions, and the consumer surface. |
| Data quality represented | `data_quality_and_observability` exists and its `outcomes` reference freshness, completeness, accuracy, lineage. |
| Governance represented | `data_governance_and_stewardship` exists; field text references stewardship, ownership, policy. |
| Metadata catalog represented | `metadata_catalog_and_lineage` exists; field text references catalog, lineage, discoverability. |
| `relatedArchetypes` cross-reference | Every component lists ≥1 valid SOL3 archetype key in `relatedArchetypes`; at least `analytics_modernization` appears across the pack. |

---

## §J · AI-led PDLC component linkage

Walk the SOL2 ↔ SOL3 / SOL4 cross-references.

| Check | Expected |
|---|---|
| SOL3 archetype references SOL2 components | `ai_led_pdlc_transformation.solutionComponents` contains at least one canonical `AiLedPdlcComponentKey` from SOL2 (string match against the union type). The test fails the build if any component key drifts out of the SOL2 canonical list. |
| SOL4 component references SOL3 archetypes | Every SOL4 component's `relatedArchetypes` entries are valid SOL3 archetype keys (string match against `SolutionArchetypeKey`). At least one SOL4 component lists `analytics_modernization`; at least one lists a healthcare archetype where applicable. |
| No orphan keys | A grep across `src/lib/solutions/**` for archetype / component keys returns zero references that don't resolve to a canonical key in the registry. |

---

## §K · Workshop and deliverable linkage

Walk the SOL3 ↔ MW1 / MW2 / PDEL cross-references.

| Check | Expected |
|---|---|
| Every archetype names ≥2 workshops | `archetype.workshopsRequired.length >= 2` for every entry in SOL3. |
| Every archetype names a recommended first workshop | `archetype.recommendedFirstWorkshop` is a valid MW1 / MW2 workshop key (string match). |
| Every archetype names ≥2 deliverables | `archetype.deliverablesGenerated.length >= 2`; each entry is a valid PDEL deliverable / artifact key (string match). |
| No fabricated workshop names | Grep across SOL3 source for any string in `workshopsRequired` / `recommendedFirstWorkshop` returns zero matches that don't resolve to a canonical MW1 / MW2 key. |
| No fabricated deliverable names | Grep across SOL3 source for any string in `deliverablesGenerated` returns zero matches that don't resolve to a canonical PDEL key. |

---

## §L · Morning review decisions

After the per-slice walk, decide for **each** SOL3–SOL8 slice and
for QA3 itself:

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass; the slice reflects intent. | Leave the branch / commit as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (a missing field, a stale provenance string, an extra honest caption). | Amend on the same branch; re-run §C validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends on it). Document the reason in the morning review note. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch / a clean integration branch. | Use the canonical cherry-pick path documented below. |
| **push / PR** | Slice is `keep`-ready and the founder has explicitly signed off. | `git push origin <branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria and §C validation are explicitly verified. |

**Default for unsupervised overnight runs:** do not push, do not
merge, do not open PRs. Local commits only. The morning review
chooses one of the five outcomes above per branch. **Push only with
explicit founder go-ahead.**

### Canonical cherry-pick path

When a pack lane lands SOL3–SOL8 in parallel and each lane appended
its own slice entry to `docs/build/build-slices.json`, every lane's
JSON edit conflicts with every other lane's. The morning review
resolves it like this:

1. Branch off `main` into a fresh integration branch:
   `git checkout -b integration/sol3-sol8 main`.
2. For each lane to keep, in dependency order
   (SOL3 → SOL4 → SOL5 → SOL6 → SOL7 → SOL8 → QA3):
   `git cherry-pick <lane-head-sha>`.
3. On each `build-slices.json` conflict, **keep both entries** (each
   lane appended an entry; the JSON array order is `SOL3`, `SOL4`,
   `SOL5`, `SOL6`, `SOL7`, `SOL8`, `QA3`). Resolve with the editor
   so both objects survive; bump `lastUpdated` once at the top of
   the file.
4. Re-run §C validation on the integration branch:
   `npx tsc --noEmit --pretty false && npm run build &&
   npm run integrity:dom` plus every per-slice jest suite.
5. Push **only with founder go-ahead**:
   `git push origin integration/sol3-sol8` and open the PR with the
   QA3 runbook linked from the PR body.

---

## Branch / worktree hygiene appendix

When running multi-lane batches via `git worktree`:

- One worktree per slice.
- Symlinking `node_modules` into a worktree breaks Next.js Turbopack;
  run `npm install --prefer-offline` per worktree instead.
- Each worktree's `.next/` is independent; clearing it can be needed
  when the route table changes (e.g., a route directory is removed
  or renamed).
- Never run `git add .` in a worktree. Stage only the slice's
  declared allowed files.
- Before commit: `git diff --cached --name-only`. Confirm only
  allowed files are staged. Unstage anything else with
  `git restore --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision.
