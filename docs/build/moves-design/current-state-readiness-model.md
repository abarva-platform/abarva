# Current-State Document-Readiness Model (Moves P0/P1/P2)

**Status:** design · 2026-06-09
**Driver:** Originate a _real_ Move — "AI-Powered Product Development Lifecycle" (SkyHarbor Air) — whose charter actually requests and tracks the real current-state inputs (DORA metrics, IT-systems inventory, IT org, etc.). No seeded moves.
**Design principle:** reuse the substrate that already exists; close the one real gap (a per-phase, user-supplied document-readiness model). Pilot-grade, not demo.

---

## 1. The gap this closes

Today the Moves module has **no concept of "current-state documents the user must supply"**:

- `WorkflowStep.required_user_inputs[]` exists but is **purely descriptive** — no DB binding, no tracking, no enforcement, no UI.
- Gate criteria (`governance.ts` `GATE_RULES` + PhasePack `gate_criteria[]`) are **artifact-centric**: they check _"is the charter signed off"_, never _"did the user provide the DORA baseline / IT org / systems inventory that the charter is supposed to be built on."_
- The charter sections (`PHASE_CANVAS_SECTIONS` in `StrategicMovePhaseClient.tsx`) are populated by chat, with no notion of the evidence they should rest on.

Result: a charter can advance on prose alone. For a pilot we want the charter to **name the current-state evidence it needs, show what's provided vs missing, and let the user supply it** (paperclip), with an **honest ingestion-state ladder** (never claim "loaded" before it's committed + retrievable — per AGENTS.md context-ingestion truth standard).

## 2. What already exists (reuse, do not rebuild)

| Need                      | Existing backing table(s)                                                                                           | Source doc              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- | ----------------------- |
| DORA engineering baseline | `tower_dora_metrics` (deploy_freq, lead_time, change_fail_rate, mttr)                                               | CI/CD export CSV        |
| Delivery quality / MTTR   | `tower_itsm_records` (incidents/changes, mttr_minutes, change_success)                                              | ServiceNow ITSM export  |
| IT systems & dependencies | `tower_cmdb_cis`, `tower_cmdb_dependencies`                                                                         | CMDB export             |
| IT / engineering org      | `tower_workforce`, `enterprise_graph_edges` (reports_to)                                                            | HRIS export / org chart |
| AI tooling adoption       | `tower_ai_tool_usage`, `tower_claude_code_usage`                                                                    | tool admin export       |
| Toolchain / throughput    | `tower_jira_issues`                                                                                                 | Jira export             |
| Segment coverage/health   | `data_inventory_segments` (coverage_score, health_state per segment: it_landscape, org_structure, it_financials, …) | computed                |
| Citations / trust         | `evidence_ledger` (append-only, every claim cites a source)                                                         | —                       |
| Upload intake             | `POST /api/programs/workspace/[moveId]/upload` → `program_attachments` → async chunk → `program_evidence_items`     | paperclip               |

Design precedents to mirror: `src/lib/programs/workshop-readiness.ts` (deterministic `evidenceToCapture[]` per workshop) and `docs/build/moves-design/discovery-engine-design.md` (P2 maturity model, 8 dimensions, two-gap model).

**The only missing seam:** upload → _classify_ → _commit to the domain table_ (a DORA CSV lands as an attachment + RAG chunks today, but is **not** parsed into `tower_dora_metrics`).

## 3. Current-state evidence families (for this Move type)

For "AI across the product-development lifecycle":

| Family key              | Evidence                                                     | Backing source                                        | Phase first required | Severity       |
| ----------------------- | ------------------------------------------------------------ | ----------------------------------------------------- | -------------------- | -------------- |
| `eng_performance_dora`  | DORA 4-metric baseline                                       | `tower_dora_metrics` / upload CSV                     | P1                   | hard           |
| `it_org_structure`      | Eng/IT org: teams, levels, contractor ratio, decision rights | `tower_workforce` + `enterprise_graph_edges` / upload | P1                   | hard           |
| `stakeholder_map`       | Named decision-rights map                                    | `program_evidence_items` / charter                    | P1                   | hard           |
| `it_systems_landscape`  | App/system inventory + dependencies the SDLC touches         | `tower_cmdb_cis` / upload                             | P1                   | soft → P2 hard |
| `delivery_quality_itsm` | Incidents/changes, MTTR, change-success                      | `tower_itsm_records` / upload                         | P2                   | soft           |
| `ai_tooling_adoption`   | Current AI dev-tool penetration                              | `tower_ai_tool_usage` / upload                        | P2                   | soft           |
| `toolchain_process`     | SDLC workflow / throughput                                   | `tower_jira_issues` / upload                          | P2                   | soft           |

Phase intent:

- **P0 Originate** — lightweight. No hard current-state. Surface a _manifest preview_: "to charter this, you'll need: DORA baseline, IT org, systems inventory." Sets expectations; nothing blocks.
- **P1 Charter** — hard: `eng_performance_dora`, `it_org_structure`, `stakeholder_map` (the Stakeholders, Success-metrics and Value-range sections can't be honest without them). Soft: `it_systems_landscape`.
- **P2 Diagnose** — all families, quantified + maturity-scored → feeds `discovery_report` "Current State Baseline (quantified metrics with source citations)".

## 4. Readiness data model (minimal new schema)

**v1 = compute-on-the-fly, no migration.** A pure resolver answers, per required family for `(moveId, clientId, phase)`:

```
status ∈ { committed | parsing | staged | missing }
```

honest ladder (AGENTS.md): `staged` = attachment uploaded; `parsing` = chunked / extraction queued; `committed` = rows actually in the backing tower\_\* table for this client_id; (retrieval proof handled by the existing retrieval path). The panel **never** shows "committed" until rows exist.

Satisfaction check per family:

1. committed rows in backing table for `client_id`? → `committed`
2. else attachment in `program_attachments` classified to this family, extraction done? → `parsing`
3. else attachment staged but not yet parsed? → `staged`
4. else → `missing`

Persist only the **requirement→attachment link** when a doc is supplied (a thin `family` tag on the attachment + an in-row note), so we avoid a new table and avoid drift. If a durable per-move ledger is wanted later, add `move_current_state_requirements(move_id, family, phase, severity, status, source_attachment_id, last_checked)` — deferred.

## 5. Resolver + registry (code shape)

- `src/lib/programs/current-state-readiness.ts`
  - `CURRENT_STATE_FAMILIES: Record<FamilyKey, FamilySpec>` — label, why-needed, backing table, source-doc hint, accepted mime/format.
  - `requiredFamiliesForPhase(moveType, phase): RequiredFamily[]` (with severity).
  - `resolveCurrentStateReadiness(ctx, moveId, phase): Promise<ReadinessReport>` → `{ families: [{key,label,severity,status,backing,whyNeeded,attachmentId?}], coverageScore, hardGaps[], softGaps[] }`.
  - Pure + deterministic seed for the registry; the resolver does read-only counts against tower tables / attachments. Unit-tested with a mocked fluent client.
- Mirrors `workshop-readiness.ts` exactly in spirit (deterministic request list + status), so it's idiomatic.

## 6. UI surface

New **"Current-state readiness"** region in `StrategicMovePhaseClient.tsx`, beside Gate criteria:

- P0: manifest preview (read-only "what you'll need").
- P1/P2: each family as a row → status chip (Committed / Parsing / Staged / Missing) + why-needed + a **"Provide…"** paperclip that calls the existing upload route with a `family` hint.
- Hard `missing` families render as **soft blockers** next to the gate ("Charter can advance, but DORA baseline is unprovided — Success metrics will be unsourced").
- Honest copy throughout (received ≠ committed ≠ retrievable).

Served via `GET /api/v1/programs/[id]/current-state-readiness?phase=N` (thin wrapper over the resolver).

## 7. Ingest ladder (the missing classify→commit seam)

Upload (exists) → staged → chunked (exists) → **[NEW] classify to family** (mime + filename + header sniff; cheap, deterministic for CSV) → **[NEW] per-family parser** commits rows to the tower table → segment coverage refresh → readiness flips `committed`.

- v1 parsers: **CSV families with tested deterministic mapping** (DORA first, then CMDB, workforce). XLSX/PDF org charts stay `staged` / review-required (never auto-committed) — per the bulk-loader contract.
- Every committed row also writes an `evidence_ledger` entry (`source_type: document_extract`, `source_ref: {attachmentId, row}`).

## 8. Build slices (step by step)

| Slice  | Scope                                                                                                                                                                       | Migration?   | Deploy?            |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------ |
| **S1** | This design doc                                                                                                                                                             | no           | no                 |
| **S2** | `current-state-readiness.ts` registry + resolver + unit tests                                                                                                               | no           | no                 |
| **S3** | Readiness panel in workspace + `GET …/current-state-readiness` route                                                                                                        | no           | yes                |
| **S4** | Upload `family` hint + attachment→requirement link + honest status ladder                                                                                                   | maybe (thin) | yes                |
| **S5** | DORA CSV parser → `tower_dora_metrics` commit + evidence_ledger + coverage refresh + retrieval proof                                                                        | maybe        | yes (ACA, in-VNet) |
| **S6** | Originate the REAL SkyHarbor "AI-Powered Product Development Lifecycle" Move P0→P1 through the panel; supply a real DORA CSV; prove readiness flips Committed + retrievable | no           | live verify        |

P2 Diagnose maturity model = separate arc, reuses `discovery-engine-design.md`.

## 9. Boundaries honored

- Identity vs context separation intact: this is **context/evidence**, supplied via the **governed upload path** only (no backdoor writes; the operator-persona identity work stays separate).
- Single-tenant: readiness is scoped to `ctx.clientId`; no cross-tenant reads.
- Truth standard: states reported separately; no "loaded" until committed + retrievable; CSV-only auto-commit in v1, binaries stay review-required.
- No seeded move: S6 originates for real.

---

# R1 — Profile-driven (non-linear) model · supersedes §3–§5 · 2026-06-09

**Why:** §3's fixed family list (DORA + IT-systems + IT-org for every Move) is a
**linear** model and is wrong. AI applicability across the product-development
lifecycle is **non-linear**: a full-stack/cloud-native team, a mainframe/COBOL
team, and a legacy DataStage analytics team have radically different AI-leverage
ceilings — and therefore different current-state baselines, questions, and
documents. DORA deploy-frequency is meaningful for the first and near-meaningless
for the second. **The P0/P1/P2 criteria, inputs, and documents must be derived
from the Move's profile, not hardcoded by phase.**

## R1.1 Move Profile — the "shape" the system detects (at P0)

Dimensions along which requirements branch (all optional; built up progressively,
context-layer pre-filled — _don't re-ask what we already know_):

| Dimension                           | Examples                                                                                                                                                       | Why it changes the requirements                                                |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Use-case archetype**              | code-gen / test-automation / reqs-&-design / legacy-modernization / data-pipeline / docs-&-review                                                              | Sets which baselines + "where to start"                                        |
| **Team work archetype(s)**          | full_stack_cloud · mainframe · legacy_data_analytics (DataStage/Informatica) · packaged_cots (SAP/SFDC) · data_engineering · embedded                          | The crux of non-linearity — AI ceiling + relevant metrics differ per archetype |
| **Delivery maturity / agility**     | waterfall ↔ hybrid ↔ scrum ↔ continuous; release cadence; test automation                                                                                      | DORA only meaningful where deployment is a practice                            |
| **Org topology & change readiness** | centralized platform / federated squads / vendor-heavy; locations (on/off/near-shore); contractor ratio; culture for change; prior transformation track record | "How will they embark", who decides, adoption risk                             |
| **Tech estate / tooling today**     | cloud posture (AWS/Azure/GCP/on-prem); existing AI tools (Copilot/CodeWhisperer/Claude/none) — where used, **benefits or gaps seen today**                     | What they already have + perceived value drives the first wave                 |
| **Industry / regulatory**           | health / finance / airline / retail                                                                                                                            | Shifts data-handling, model-risk, approval evidence                            |

## R1.2 Architecture: instrument library + applicability predicates + Claude tailoring

A hardcoded if/else per archetype is itself a linear trap. Instead:

1. **Dimension scaffold (deterministic):** the profile ontology above — stable, code-defined.
2. **Evidence-instrument library (data, extensible):** each entry is an evidence
   family / question instrument tagged with an **applicability predicate** over the
   profile + the phase it becomes relevant + a profile-dependent severity. e.g.
   - `dora_baseline` — applies when `team ∈ {full_stack_cloud, data_engineering}` **and** `delivery ∈ {scrum, continuous}`; **not** for mainframe/legacy-analytics.
   - `mainframe_change_cadence`, `batch_window_profile`, `sme_coverage`, `modernization_candidates` — apply when `team includes mainframe`.
   - `etl_job_inventory`, `data_lineage`, `run_sla` — apply when `team includes legacy_data_analytics`.
   - `cloud_estate` — applies when `cloudPosture` is set (what's used, where).
   - `ai_tooling_today` — applies when `existingAiTools` non-empty (adoption + **benefits/gaps seen**).
   - `agility_assessment`, `change_readiness_culture`, `org_topology_locations` — broadly applicable, but the **questions inside** are tailored per profile.
   - `stakeholder_map`, `sponsor_commitment` — universal.
3. **Derivation = predicates ∪ Claude:** deterministic predicates pre-select the
   obviously-applicable instruments; **Claude tailors and extends** — generating
   profile-specific questions and additional doc requests the static library can't
   anticipate, **grounded by the context layer and constrained to the ontology**
   (every derived requirement cites _why it applies to this profile_; no invented asks).
4. **Readiness resolver** then checks supplied-vs-needed against the **derived** set
   (not a fixed list), honest committed/missing ladder unchanged.

## R1.3 Phase intent (profile-driven)

- **P0 Originate = profile detection.** Scoped adaptive Q&A (Nexus) + context-layer
  pre-fill establishes the dimensions well enough to classify the Move's archetype(s).
  Output: a `MoveProfile`. Surfaces "based on this, here's what we'll need" — no heavy docs yet.
- **P1 Charter = derive the targeted current-state evidence + doc requests for THIS profile.**
  Full-stack → DORA + CI/CD + Copilot adoption. Mainframe → change cadence + batch +
  SME coverage + modernization candidates (not DORA). Universal: sponsor + stakeholders.
  Plus the **"where to start"** framing (teams/areas ranked by AI leverage × readiness).
- **P2 Diagnose = score maturity on the dimensions that apply**, two-gap model
  (foundation vs use-case), benchmark vs industry/peer, name first-wave candidates.

## R1.4 Code impact

- `requiredFamiliesForPhase(phase)` (static) → **removed**, replaced by
  `deriveCurrentStateRequirements(profile, phase)` over an `INSTRUMENT_LIBRARY` whose
  entries carry `appliesWhen(profile)` + `phase` + `severityFor(profile)`.
- `resolveCurrentStateReadiness(ctx, profile, phase)` now resolves the **derived** set.
- The §3 families survive as **library instruments with predicates**, not an unconditional phase list.
- Claude-augmented derivation + the P0 profiling flow are their own slices (R-S2/R-S3).

## R1.5 Open design decisions (for confirmation)

1. **Profile capture at P0:** adaptive Nexus Q&A (conversational, grounded) vs a short
   structured intake vs both. Recommend: conversational, pre-filled from context layer,
   with a compact structured summary the user can correct.
2. **Deterministic vs Claude balance in derivation:** library predicates as the floor,
   Claude as the tailoring layer (recommended) vs Claude-only (more flexible, less auditable).

---

# R2 — Moves is a consulting engine; collection feeds the recommendation · 2026-06-09

**Why (supersedes any framing where we ask the client to self-decide):** The client
does **not** have the answers. They don't know whether to start with mainframe, data,
or full-stack, how to sequence the rollout, or what it will cost. **Producing the right
approach, solution, rollout/roadmap, and estimates IS the product.** So:

- **We never ask the client "where will you start?"** — sequencing/where-to-start is an
  **output** the system computes, not an input. Asking it abdicates the consulting value.
- **We must collect all the current-state detail needed to devise the right approach** —
  comprehensively, **scoped to the client's actual estate** — so the system can reason to
  the recommendation.
- **Universal:** this holds for **any use case, any client**. The Moves module is a
  consulting engine; current-state collection exists to _feed the recommendation_.

## R2.1 Three movements (replaces "detect the profile by asking")

- **A · Estate discovery (broad, shallow, mostly automatic).** Establish what the client
  _has_ — which team/work archetypes, systems (CMDB), clouds, data platforms, tooling —
  primarily from the **context layer** + high-level inventories, with minimal human
  confirmation. This **scopes** what's relevant (no mainframe → skip mainframe instruments).
  The "profile" is **inferred from evidence**, not self-declared.
- **B · Comprehensive current-state collection (deep, within scope).** For every relevant
  area, collect the evidence to assess **AI leverage × readiness**. The client supplies
  **data/docs**, never decisions:
  - full-stack/cloud → DORA, CI/CD maturity, test automation, Copilot/Claude adoption + **benefits/gaps seen**;
  - mainframe → change cadence, batch windows, code size/complexity, SME coverage, modernization candidates;
  - data/analytics (DataStage/Informatica) → job inventory, lineage, run SLAs, data quality;
  - cross-cutting → org topology, locations, agility/ways-of-working, change-readiness/culture, tooling estate + perceived value.

  _Scoped-not-exhaustive applies to the human interrogation, not the data:_ comprehensive
  in evidence, minimal in questions, and never re-ask what the context layer already knows.

- **C · Analysis → recommendation (the value).** Maturity scoring per area + **AI-leverage ×
  readiness ranking** → **recommended sequencing / where-to-start**, target state, strategy
  (workflow + dataflow), roadmap (work packages), and **estimates aligned to the roadmap**.
  These are the Move deliverables (P2→P5), per `strategy-content-model.md` and the
  consulting story arc (use case → current → gaps → target → approach → strategy → roadmap → estimates).

## R2.2 What "readiness" now means

Readiness = _"have we collected enough current-state, across the areas the estate makes
relevant, to produce a defensible recommendation?"_ — **not** "did the client tick a
checklist." The instrument library + predicates stay, but:

- predicates branch on the **discovered estate** (what they have), not self-declared strategy;
- the coverage score is **recommendation-readiness**; hard gaps = areas we cannot yet reason about;
- "where to start" is **removed as an input** and added as a **derived output** of movement C.

## R2.3 Build implication

This grows the scope from a "readiness panel" to the **intake → analysis → recommendation**
spine of the Moves engine. Current-state collection (this doc) is the intake half; the
analysis/recommendation half is the maturity + leverage-scoring + sequencing engine
(`discovery-engine-design.md` + `strategy-content-model.md`). They must be designed as one
arc. SkyHarbor "AI-Powered Product Development Lifecycle" is the first real instance, but
the engine is client/use-case agnostic.
