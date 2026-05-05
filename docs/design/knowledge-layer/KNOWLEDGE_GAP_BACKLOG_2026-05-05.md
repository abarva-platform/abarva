# Knowledge Layer · Gap Backlog

| Field    | Value |
|----------|-------|
| Date     | 2026-05-05 |
| Status   | Design pack · read-only |
| Source   | `docs/design/strategic-moves/PHASE_PATTERN_BINDING_MATRIX_2026-05-05.md` § 11 + codebase audit |
| Predecessor | `docs/build/KNOWLEDGE_LAYER_AUDIT_CURRENT.md` (2026-04-29) |

Each item carries: **What** is wrong · **Why** it matters · **Action** to fix · **Priority** (P0 = blocks doctrine; P1 = blocks next impl wave; P2 = important; P3 = cleanup).

---

## GAP-1 · `failure-modes.ts` carries P6 phase references (doctrine violation)

**Priority**: P0 — blocks any impl that reads failure modes against the 6-phase model.

**What**: `src/lib/programs/failure-modes.ts` items 5, 9, 10 still have `primaryPhases` containing 6, and their narrative text says "P5 Activate" and "P6 Operate" — vocabulary from the old 8-phase model.

- Item 5 (`primaryPhases: [3, 5, 6]`): "P5 Activate requires evidence of workflow changes in production… P6 Operate measures sustained behavior change."
- Item 9 (`primaryPhases: [1, 5, 6]`): "P5 and P6 require post-deployment measurement against that baseline."
- Item 10 (`primaryPhases: [0, 6]`): "P6 closeout harvests outcomes into the pattern catalog."

Under the doctrine: P5 = "Mobilize & Handoff." P6 does not exist. P5 hands off to Tower; execution and outcome measurement are Tower's responsibility.

**Why it matters**: the agent route calls `failure-mode-prompt.ts` which uses `getFailureModesForPhase(phase)`. On phase 5, it will return items 5, 9 with P5 in `primaryPhases` — that's correct. But those items' narrative text will confuse Nexus by referring to post-deployment measurement tasks that belong in Tower, not in P5 (Mobilize & Handoff). Items tied to P6 will never be surfaced (no phase 6 exists), silently dropping the failure mode.

**Action**:
1. Rewrite items 5, 9, 10 narratives to use doctrine vocabulary ("P5 Mobilize & Handoff", "Control Tower").
2. For failure modes genuinely about execution/measurement (post-P5), update `primaryPhases` to reflect they are Tower-owned signals, not Strategic Move gates. Options: (a) remove them from the Move failure-mode catalog and document them in a Tower-specific catalog; (b) keep them in the Move catalog but mark them as "Tower-monitored" with a flag.
3. Remove 6 from all `primaryPhases` arrays.
4. Update the narrative of item 10: "P0 Tenant Admin approval gate filters new programs against the active portfolio for overlap and capacity; **after P5**, Tower closeout harvests outcomes into the pattern catalog."

**Files**: `src/lib/programs/failure-modes.ts` (items 5, 9, 10).

---

## GAP-2 · `phase-packs/` exposes P6_OPERATE and old vocabulary (doctrine violation)

**Priority**: P0 — Nexus reads phase packs every turn via `src/app/api/chat/agent/route.ts:381-384`. Old vocabulary reaches the model in every prompt.

**What**: `src/lib/programs/phase-packs/` exports:
- `P0_ORIGINATE`, `P1_DISCOVERY`, `P2_SYNTHESIS`, `P3_DESIGN`, `P4_BUILD`, `P5_ACTIVATE`, `P6_OPERATE`

Doctrine labels are: Originate, Charter, Discover & Diagnose, Design Future State, Roadmap & Business Case, Mobilize & Handoff. `P4_BUILD` and `P5_ACTIVATE` and `P6_OPERATE` are wrong names. Every phase-pack currently coaches Nexus with terminology that conflicts with the doctrine, contradicting `phase-labels.ts` (which PR #1517 corrects).

**Why it matters**: `formatPhasePackForPrompt(getPhasePack(promptPhase))` runs every turn. If the pack says "P4 Build" and `phase-labels.ts` says "P4 Roadmap & Business Case", Nexus receives contradictory instructions. Prompted behavior becomes unpredictable.

**Action**:
1. Rename and rewrite the 6 phase packs to doctrine labels:
   - `P0_ORIGINATE` → keep name; update content to doctrine
   - `P1_DISCOVERY` → rename `P1_CHARTER`; rewrite to Charter content
   - `P2_SYNTHESIS` → rename `P2_DIAGNOSE`; rewrite to Discover & Diagnose content
   - `P3_DESIGN` → keep name; update content (still Design, but now "Future State")
   - `P4_BUILD` → rename `P4_ROADMAP`; rewrite to Roadmap & Business Case
   - `P5_ACTIVATE` → rename `P5_MOBILIZE`; rewrite to Mobilize & Handoff
2. Retire `P6_OPERATE` entirely. Move any Tower-relevant content to a `tower-packs/` registry (separate surface, not a Strategic Move phase). If Tower surface doesn't exist yet, stub the directory.
3. Update `index.ts` and `types.ts` `PhaseNumber` type to `0 | 1 | 2 | 3 | 4 | 5` (remove 6).
4. Update all tests in `phase-packs/__tests__/` for new names and content.

**Files**: `src/lib/programs/phase-packs/*.ts`, `src/lib/programs/phase-packs/__tests__/*.ts`.

---

## GAP-3 · Two failure-mode catalogs with inconsistent scope, IDs, and phase bindings

**Priority**: P1 — affects Nexus's failure-mode coaching, gate evaluation, and Intelligence surface.

**What**: Two distinct catalogs exist with no federation contract:

| Catalog | File | Count | ID format | Phase binding | Surface |
|---------|------|------:|-----------|--------------|---------|
| Programs FM | `src/lib/programs/failure-modes.ts` | 10 | Integer 1..10 | `primaryPhases: number[]` | Gate evaluation (`governance.ts`), programs coaching |
| AI-Programs FM | `src/lib/intelligence/ai-program-failure-modes.ts` | 12 | String key (`snake_case`) | `AiProgramFailurePhase` (separate type) | Intelligence Ask, `failure-mode-prompt.ts` |

The catalogs partially overlap:

| Programs FM (id) | AI-Programs FM (key) | Overlap judgment |
|-----------------|-----------------------|-----------------|
| 3 Lack of data foundation | `weak_data_foundation` | Same concept |
| 2 Unclear problem def | `poor_use_case_framing` | Same concept |
| 1 Lack of executive sponsorship | `no_business_owner` | Same concept |
| 9 Inability to measure outcomes | `no_measurable_baseline` + `no_value_ledger` | Split across two FM keys |
| 5 Lack of OM/workflow change commitment | `no_adoption_change_plan` + `no_operating_model_for_scale` | Split |
| 8 Pilot-to-production scaling gap | `pilot_purgatory` | Same concept |
| 10 Unrealistic expectations | `ai_tool_sprawl_without_value` | Related, not identical |
| 6 Late governance/privacy/risk | `missing_governance_risk` | Same concept |
| 7 Vendor / build-buy errors | `tool_first_thinking` | Related, not identical |

No entry for `no_value_ledger`, `weak_workflow_integration` in the Programs catalog. No entry for FM-4 (talent) in the AI-Programs catalog.

**Why it matters**: Nexus receives different failure-mode signals depending on which surface it's running on. Gate evaluation uses the 10-id catalog; Intelligence Ask uses the 12-key catalog. A user starting a Move in the Strategic Moves surface and then switching to Intelligence Ask will see different failure modes for the same situation.

**Action**: Produce a **federation map** and pick an architecture:
- Option A: **Canonical 10-id + augmentation keys**. Programs FM is canonical for gate evaluation; AI-Programs FM keys are added as optional augmentations. Each Programs FM entry gains a `relatedAiProgramKeys: AiProgramFailureKey[]` field.
- Option B: **Merge to single catalog**. New catalog carries both numeric IDs and string keys. Backward-compatible.
- Option C: **Keep separate, publish formal boundary**. Programs FM = gate evaluation + coaching; AI-Programs FM = Intelligence Ask + pattern matching. Publish a cross-reference table.

Recommended: **Option C short-term** (zero migration risk), **Option B long-term** (single source of truth for both surfaces). Commit to Option B in the implementation plan.

**Files**: `src/lib/programs/failure-modes.ts`, `src/lib/intelligence/ai-program-failure-modes.ts`, `src/lib/programs/failure-mode-prompt.ts`.

---

## GAP-4 · Pattern packs (`pattern_packs` SQL table) have untyped jsonb fields

**Priority**: P1 — Nexus cannot compose safely against `likely_root_causes`, `intervention_options`, `common_failure_modes` without a schema.

**What**: `pattern_packs` (from `supabase/migrations/20260421152501_intelligence_layer_core.sql`) has these jsonb columns: `detection_signals jsonb`, `diagnostic_questions[]`, `evidence_requirements jsonb`, `likely_root_causes jsonb`, `intervention_options jsonb`, `anti_patterns jsonb`, `common_failure_modes jsonb`.

No TypeScript type for the jsonb shapes exists in the codebase (checked: no `PatternPackJson*` type in `src/lib/`). Nexus agents that read from `pattern_packs` via the broker must cast to `any` or make undocumented assumptions about the shape.

**Why it matters**: Nexus will hallucinate field names or miss content when the jsonb structure is inconsistent across rows. Gate evaluation and coaching logic cannot reliably extract root causes or intervention options.

**Action**:
1. Publish a TypeScript interface for each jsonb column (e.g., `PatternPackDetectionSignal`, `PatternPackRootCause`, `PatternPackInterventionOption`).
2. Write a Zod or similar runtime validator so ingestion scripts and broker reads can detect malformed rows.
3. Backfill any rows that don't conform.

**Files**: New `src/lib/intelligence/pattern-pack-schema.ts` (to create). Migration to add Postgres CHECK constraints or JSON schema validation (optional/follow-up).

---

## GAP-5 · Source stage packs (S0..S7) not mapped to the 6-phase Strategic Moves model

**Priority**: P1 — sourcing triggers in P3–P5 need to hand off to the correct source stage.

**What**: `src/lib/source/stage-packs/` has 8 stage packs (S0..S7) with `SOURCE_STAGE_KEY_TO_PACK_STAGE` map. There is no published mapping from Strategic Moves phases (P0..P5) to Source stages (S0..S7). When Nexus fires a sourcing trigger at P3 or P4, it must know which source stage to start.

**Why it matters**: The P3 binding matrix flags "hot sourcing trigger" and the P4 entry says "a Source event must be in flight before P4 → P5." Neither can be wired until the P→S mapping is explicit.

**Action**: Publish the mapping:
| Strategic Move phase | Sourcing entry stage | Rationale |
|---------------------|---------------------|-----------|
| P3 (Design) — sourcing trigger fires | S0 (needs assessment) or S1 (sourcing strategy) | Vendor/SI selection starts when design implies external dependency |
| P4 (Roadmap) — source event matures | S2 (RFP/RFI) or S3 (vendor eval) | Business case drives formal procurement |
| P5 (Mobilize) — source event completes | S5 (contracting) or S6 (onboarding) | SI/vendor onboarded before handoff |

This mapping should live in `src/lib/source/phase-to-stage-map.ts` (new file) and in the binding matrix.

**Files**: New `src/lib/source/phase-to-stage-map.ts`.

---

## GAP-6 · 17-pattern generated manifest conflated with 198-primitive live corpus

**Priority**: P2 — causes stale count references in docs, components, and comments; creates confusion for any code that queries the manifest.

**What**: `src/lib/intelligence/generated/pattern-manifest.json` has 17 patterns (`generatedAt 2026-04-23, sourceDir "Patterns"`). The live corpus in `loader.ts` has 198 primitives (149 patterns, 30 signals, 9 solutions, 10 contradictions). Multiple components, docs, and comments still reference the older count (60/30/109 or 17 or some other stale number).

The manifest overlaps the corpus by **slug, not by ID**. `pattern-graph-validation.ts` uses the 17-entry manifest and no other component, meaning graph validation covers only 8.5% of the corpus.

**Why it matters**: Agents, UI, and CI that check pattern counts will get wrong numbers. `pattern-graph-validation.ts` gives false confidence (it validates 17 patterns, not 149). Comments referencing old counts mislead contributors.

**Action**:
1. Rename `generated/pattern-manifest.json` → `generated/pattern-design-pack-manifest.json`; update all references.
2. Update `pattern-graph-validation.ts` to validate against the full corpus (or at minimum, document that it only covers the design-pack subset).
3. Regenerate the manifest against the current corpus, or at minimum add a CI check that the manifest `generatedAt` date is not stale beyond 30 days.
4. Remove stale count references from docs and comments.

**Files**: `src/lib/intelligence/generated/pattern-manifest.json`, `src/lib/intelligence/pattern-graph-validation.ts`, `src/lib/intelligence/pattern-manifest.ts`.

---

## GAP-7 · Naming doctrine drift: "Strategic Move" / `engagements` / `programs` used inconsistently

**Priority**: P2 — contributor confusion, URL/API confusion, incorrect UI copy.

**What**: Three naming layers coexist:
- External UI: "Strategic Move" (singular), "Moves" (plural) — the user-facing surface
- DB substrate: `engagements`, `program_*`, `program_archetype`, `current_phase` — internal schema
- API routes: `/api/v1/programs/*` — REST surface
- Internal docs: mix all three freely

Code sometimes uses "program" where it means "Move" in UI copy. The AI agent sometimes refers to "your program" when users see "your Move." Comments say "program lifecycle" where they mean "Move lifecycle."

**Why it matters**: (a) On-screen text confused users in prior demo feedback. (b) New contributors edit the wrong abstraction. (c) AI agent coaching text mixes the vocabulary, reducing trust.

**Action**:
1. Publish a **one-page naming doctrine** (a section in this gap backlog or a separate file): "In all UI copy, use 'Move'. In DB schema and API, use 'engagement/programs' — do not rename. In agent prompts and coaching, use 'Move' except when referring to a specific DB field."
2. Audit user-facing strings in `src/components/strategic-moves/` for "program" and replace with "Move" where appropriate.
3. Add a lint rule or grep check to flag UI copy additions that use "program" in the strategic-moves component tree.

**Files**: `src/components/strategic-moves/**/*.tsx`, agent route prompt strings.

---

## GAP-8 · No per-phase pattern pre-load (patterns surface reactively only)

**Priority**: P1 — the training framework requires Nexus to load the right pattern bundle before guiding the user, not just when a classifier match fires.

**What**: Currently, `src/lib/programs/classifier.ts` surfaces patterns **reactively** — when a user message triggers a classifier match. There is no mechanism to load a prescribed set of patterns at phase entry. `STAGE_PATTERN_MAP` in `src/lib/intelligence/agent-retrieval.ts:45-56` provides a stage-to-pattern mapping for the Source surface, but no equivalent exists for Strategic Moves phases.

**Why it matters**: The training framework specifies a `required_patterns` bundle per phase (e.g., P0 must have industry + AI use-case + failure-mode patterns loaded before first guidance). Without proactive loading, Nexus may give guidance without the relevant patterns in its context window.

**Action**:
1. Create `src/lib/programs/phase-pattern-map.ts` (analogue to `STAGE_PATTERN_MAP`) that maps each phase (0..5) to a list of required pattern IDs and optional pattern IDs.
2. Wire this into the agent route at phase entry: at the start of a session on a given phase, load the required pattern bundle into the system block.
3. Required content: pattern IDs from the binding matrix `required_patterns` field for each of P0..P5.

**Files**: New `src/lib/programs/phase-pattern-map.ts`. Modify `src/app/api/chat/agent/route.ts` phase initialization block.

---

## GAP-9 · Self-approval and delegation model is ad-hoc

**Priority**: P2 — needed before pilot (pilot requires audit trail on gate approvals).

**What**: There is no first-class `self_approval_token` or delegation model. Gate advancement is gated on `founder_approval_requests` (hard) or silently bypassed (soft). The training framework specifies that authorized users must be able to self-approve gates when evidence is complete, and that the gate action must be auditable.

**Why it matters**: In a pilot, every gate approval must carry a record of who approved, when, what evidence was present, and whether it was self-approved or delegate-approved. Today there is no such record.

**Action**:
1. Add `approval_type: 'self' | 'delegate' | 'founder'` and `approved_by: uuid` to `founder_approval_requests` (or a new `gate_approvals` table if cleaner).
2. Implement a delegation token: sponsor can delegate P1 → P2 self-approval to program lead.
3. Wire gate approval event into an audit log (can reuse `program_audit_log` table added in the impl PR migration).

**Files**: Migration (new or addendum to migration in PR #1517). `src/lib/programs/governance.ts`. `src/app/api/v1/programs/` gate routes.

---

## GAP-10 · `PhaseEvidenceItem` and `PhasePack.antiPatterns` are untyped strings

**Priority**: P3 — improves reliability of coaching and gate evaluation; not a blocker for doctrine compliance.

**What**:
- `PhaseEvidenceItem.evaluationHint` is a free string. No structured check, no reference to a failure mode ID or key.
- `PhasePack.antiPatterns[]` is a `string[]`. Nexus uses it, but it cannot programmatically cross-reference it to a failure mode.

**Action**:
1. Add `relatedFailureModeId?: number` and `relatedFailureModeKey?: AiProgramFailureKey` to `PhaseEvidenceItem`.
2. Change `PhasePack.antiPatterns[]` to `AntiPattern[]` with shape `{ pattern: string; failureModeId?: number; failureModeKey?: AiProgramFailureKey; exampleViolation?: string }`.

**Files**: `src/lib/programs/phase-packs/types.ts`, all phase pack files.

---

## Summary table

| ID | Priority | Title | Effort estimate | Blocks |
|----|----------|-------|----------------|--------|
| GAP-1 | P0 | `failure-modes.ts` P6 references | S — edit 3 items | Impl PR #1517 correctness |
| GAP-2 | P0 | Phase packs P6_OPERATE + old vocabulary | M — rewrite 6 files + tests | Agent coaching correctness |
| GAP-3 | P1 | Two failure-mode catalogs unreconciled | M — federation map + long-term merge | Cross-surface FM consistency |
| GAP-4 | P1 | `pattern_packs` jsonb fields untyped | M — TS interfaces + validator | Safe broker reads |
| GAP-5 | P1 | Source stage packs not mapped to P0..P5 | S — new map file | P3/P4 sourcing triggers |
| GAP-6 | P2 | 17-pattern manifest vs 198-primitive corpus | S — rename + update readers | Count accuracy |
| GAP-7 | P2 | Naming doctrine drift | S — doc + targeted string audit | UX consistency |
| GAP-8 | P1 | No per-phase pattern pre-load | M — new phase-pattern-map.ts + agent route wiring | Phase-entry context quality |
| GAP-9 | P2 | Self-approval / delegation ad-hoc | L — audit table + delegation token + gate route changes | Pilot audit trail |
| GAP-10 | P3 | `PhaseEvidenceItem` + `antiPatterns` untyped | S — type additions | Gate evaluation quality |

Effort: S = 0.5–1 dev-day · M = 1–3 dev-days · L = 3–5 dev-days.
