# Pricing Engine — Current-State Audit (PR0)

Audit only. No functional code changed, no migrations run. Scope: read the real
Nexus/AbarVa codebase (worktree `nexus-pricing-engine`, branch
`feat/pricing-engine-pr0-audit`, based on `origin/main`) and document what
exists today before PR1 (taxonomy pack) begins.

All paths are relative to the repo root. All line numbers were read directly
from the files on disk at audit time; re-check if the base branch has moved on
before relying on an exact line number.

---

## 1. Existing pricing / cost / rate-card / business-case code

There is a **substantial, non-trivial existing subsystem** for exactly this
problem — this is not a greenfield build. It lives under
`src/lib/programs/expert-kernel/` ("Moves Expert Kernel") and is wired into a
real, live UI surface, not just tests.

- **Rate-card subsystem** — `src/lib/programs/expert-kernel/rate-card/`:
  - `benchmark-rate-card.ts` (465 lines) — researched market rate bands
    (archetype × onshore/offshore × work specialization), hourly USD, with
    provenance (`source`, `as_of`, `confidence`).
  - `comprehensive-rate-card.ts` (443 lines), `demo-rate-card-packs.ts` (532
    lines) — fuller/demo variants of the same shape.
  - `derived-planning-rate-card.ts` (184 lines) — the documented bridge that
    projects the hourly benchmark card onto annual, fully-loaded
    `RoleRateCard[]` for the should-cost engine (`ANNUAL_BILLABLE_HOURS =
    2080`, `ROLE_TO_SPECIALIZATION` map, honest `OFFSHORE_SPECIALIZATION_FALLBACK`
    proxy table, throws rather than fabricates a missing cell).
  - `rate-card-ingestion.ts` (575 lines), `rate-card-row-parser.ts` (273
    lines) — CSV/XLSX/JSON row parsing and ingestion for uploaded rate cards.
  - `rate-card-templates.ts` (119 lines) — upload template contracts:
    `RATE_CARD_TEMPLATE_DEFINITIONS` for `rate_card_internal`,
    `rate_card_vendor`, `geo_modifier` object types, each with
    `requiredFields`, `ownerRole`, `tenantScoped`. **The file's own header
    comment is explicit**: "These templates are intentionally separate from
    the enterprise-context template registry. Rate cards price Moves
    estimates; they are not business context facts and should not be forced
    into `ContextDimension`." (`rate-card-templates.ts:1-5`) — i.e. the prior
    author already decided rate cards are a distinct governed object type from
    tenant enterprise-context facts.
  - Full test coverage exists under `rate-card/__tests__/`.

- **Effort estimator** — `src/lib/programs/expert-kernel/effort-estimator.ts`
  (367 lines). Decomposes a Move into 8 standard workstreams (`ai_build`,
  `integration`, `data`, `foundational`, `data_governance`,
  `process_redesign`, `change_adoption`, `run`), each a role-mix effort with
  base/conservative/upside `Range`s and a human/agent split. Explicitly reuses
  `src/lib/source/should-cost/should-cost-model.ts`'s role-mix engine — **the
  same blended-rate, on/offshore labour math is shared source-of-truth across
  Source (vendor RFP) and Moves** (`effort-estimator.ts:8-10`).

- **AI operating-cost calculator** — `src/lib/programs/expert-kernel/ai-ops-cost/`
  (`calculator.ts`, `model-cost-catalog.ts`, `embedding-cost-catalog.ts`,
  `eval-cost-catalog.ts`, `types.ts`). Token-based inference/embedding/eval/
  fine-tune cost projection by model tier, separate from labour rate-carding.

- **Business-case compiler** —
  `src/lib/programs/expert-kernel/business-case-compiler.ts` (538 lines).
  Assembles baseline + effort + run cost + change effort + value forecast +
  risk into a `BusinessCaseSkeleton` with the 8 required elements (baseline,
  value range, cost/effort range, named assumptions, sensitivity, kill
  criteria, recommendation, Tower measurement handoff). Runs `critic.ts`
  (below) before finalizing.

- **Real-Move business-case runner** — `src/lib/programs/move-business-case.ts`
  (1035 lines). `buildMoveBusinessCase()` is the pipeline that runs the kernel
  for a *real, originated* Move (as opposed to the three hand-authored
  reference cases `apex-contact-center-case.ts`,
  `meridian-ambient-clinical-case.ts`, `firstcapital-fraud-detection-case.ts`).
  Header comment (`move-business-case.ts:1-40`) documents the pipeline order:
  `buildBaselineModel → buildAssumptionLedger → buildEffortEstimate →
  buildValueForecast → compileBusinessCase`, and the honesty discipline (never
  fabricate a benchmark; unrecorded metrics become named seed gaps; effort is
  a planning range, never a quote).

- **Live call site — this is wired to the UI, not dormant**:
  `src/components/moves/living/LivingMoveView.tsx:58` imports
  `Recommendation` from `expert-kernel/business-case-compiler` and renders it
  (`LivingMoveView.tsx:852`, `LivingMoveView`). This differs from several
  other "complete but dormant" subsystems noted in project history (e.g. the
  Source Event Archetype Framework) — the kernel pipeline has a real render
  path today.

- **Board-grade export renderers** consume the kernel output:
  `src/lib/programs/expert-kernel/exports/business-case-docx.ts`,
  `business-case-pdf.tsx`, `financial-model-xlsx.ts`, and the
  `exports/board-grade/` family (`estimate-model-model.ts`,
  `estimate-model-renderer.ts`, `move-estimate-model.ts`,
  `move-estimate-renderer.ts`, `move-workforce-economics-binding.ts`, etc.) —
  30+ renderer/model file pairs for CFO packs, charter skeletons, mobilize
  packets, master dossiers.

- **Workforce economics** — `src/lib/workforce-economics/workforce-economics.ts`
  (425 lines). Per prior project memory this is a "substrate" (21 towers / 321
  roles) with **no in-product engine wired to it** — worth checking for reuse
  of its taxonomy/role data, but do not assume it is live like the kernel
  pipeline above.

- **`src/lib/estimation/templates.ts`** exists as a separate, smaller
  estimation-templates module — not investigated in depth this pass; flag for
  PR1 to check for overlap/duplication with `expert-kernel/rate-card/`.

**This is NOT the Source-module "pricing"** the naive grep also surfaces in
volume (`src/lib/source/pricing-normalization*`, `src/lib/source/exports/renderers/pricing-*`,
`src/components/source/PricingNormalizationMatrix.tsx`,
`src/components/source/canvas/pricing/*`, etc.) — that is vendor RFP/BAFO bid
pricing comparison inside the **Source** (sourcing/RFP) module, a completely
different domain from the workforce rate-card/effort-estimating engine this
PR sequence is building. Do not conflate the two "pricing" hits when grepping;
filter for `expert-kernel/rate-card`, `effort-estimator`,
`business-case-compiler`, `ai-ops-cost` specifically.

---

## 2. Move / Phase / Workspace / Artifact / Approval schema

The product name is "Moves"; the underlying data model and API/table names
are **"programs" / "engagements"** — do not expect a `moves` table or a
`moves` API root.

- **Core Move row** — `ProgramCore` in `src/lib/programs/types.db.ts:109-166`
  (backs the `engagements` table). Key fields: `id`, `clientId`,
  `valueProjectedLowUsd/HighUsd`, `valueVerifiedUsd`, `valueVerifiedStatus`,
  `valueCurrency`, `valueAssumptions` (already has a value-money shape at the
  Move level, worth reusing/extending rather than re-inventing), `archetype`,
  `lifecycleState`, `currentPhase`, `phaseLockedAt/phaseLockedByUserId`,
  `charter` (JSONB), `functionPackKey` + `functionPackConfidence` (the Domain
  Function Pack binding used by the kernel), `gatesPassed`.
- **Phase/gate types** — `types.db.ts:303-321`: `PhaseSnapshot` (per-phase
  JSONB `snapshot`, `lockedByUserId`, `lockedAt`, `approvalStatus: "draft" |
  "pending" | "approved" | "rejected"`) and `GateCheck` (`pass`,
  `failedChecks[]` with `severity: "hard" | "soft"`, `requiresApproval`,
  `approverRole`).
- **Module/work-item/milestone/risk rows** — `ProgramModuleRow`,
  `ProgramWorkItemRow`, `ProgramMilestoneRow`, `ProgramRiskRow`
  (`types.db.ts:168-227`), all `engagementId`-scoped.
- **Phase packs** (the actual P0–P5 phase content/behavior definitions) —
  `src/lib/programs/phase-packs/P0_originate.ts` … `P5_activate.ts`, and a
  parallel, newer **`v2/`** generation:
  `src/lib/programs/phase-packs/v2/P0_originate.v2.ts`,
  `P1_charter.v2.ts`, `P2_diagnose.v2.ts`, `P3_design.v2.ts`,
  `P4_roadmap.v2.ts`, `P5_mobilize.v2.ts`. **Two live phase-pack generations
  coexist** (`types.v2.ts`, `format-v2.ts` alongside the v1 `types.ts`) — check
  which one the live Move UI actually reads before adding a P4 "Cost & Effort"
  step; do not assume v1 P4_build.ts is the active one without confirming
  against the render path.
- **Move context extract** — `src/lib/programs/move-context-extract.ts` (880
  lines) — the schema for what gets extracted from a Move into
  context/corpus objects.
- **Components** — `src/components/strategic-moves/`: `MoveListTable.tsx`,
  `ManageMovesClient.tsx`, `PhaseRail.tsx`, `PhaseApproveAndBuild.tsx` (686
  lines — the phase gate approve/build action), `RoleApprovalsPanel.tsx` (262
  lines), `BoardArtifactsPanel.tsx`, `PhaseDocumentsPanel.tsx`,
  `MoveArtifactUpload.tsx`, `CurrentStateReadinessPanel.tsx`, plus a
  `phase-workspace/` sub-directory with shared presentational primitives
  (`primitives.tsx` — `Chip`, `Card`, `KeyValue`, `statusMeta`,
  `confidenceTone`) and cards (`ApprovedInputsPackCard.tsx`,
  `AssembledPatternCard.tsx`, `PhaseTaskChecklist.tsx`,
  `PhaseWorkspaceComposition.tsx`).

---

## 3. Admin context-layer template registry + upload/approval/commit path

**The brief's guessed name `TemplateRegistry`/`template_registry` does not
exist anywhere in the codebase** — this is a naming miss, not a missing
feature. The real registry:

- **`src/lib/context-ingestion/template-registry.ts`** (1467 lines). Exports
  `ContextTemplateDefinition`, the tenant template arrays
  (`UNIVERSAL_CONTEXT_TEMPLATES`, `NORTHSTAR_CONTEXT_TEMPLATES`,
  `MERIDIAN_CONTEXT_TEMPLATES`), `SUPPORTED_CONTEXT_UPLOAD_FORMATS`,
  `getTemplatesForTenant()`, `getTemplatesForTenantWithFallback()`,
  `getTemplateById()`, `getTemplateForDimension()`, `getTemplateFormatCoverage()`.
  Consumed directly by
  `src/app/(maestro)/admin/context-layer/templates/page.tsx:1-6`.
- **Parse → validate → preview → approve → commit pipeline** —
  `src/lib/context-ingestion/loader/`: `parse-adapter.ts`,
  `understand-pipeline.ts` (parse+understand), `mapping-proposal.ts`
  (`MappingProposal` type), `steward-validation.ts`, `steward-reviewer.ts`,
  `steward-chat.ts` (an AI-assisted mapping reviewer), `landing-zone.ts`
  (staging), `commit-adapter.ts` (`commitAcceptedProposals()` — the actual
  commit function name), `contract.ts` (shared types), `preserve-original.ts`.
- **API routes** wiring the pipeline —
  `src/app/api/admin/context-layer/loader/understand/route.ts`,
  `.../loader/landing-zone/route.ts`, `.../loader/steward-chat/route.ts`,
  `.../loader/commit/route.ts` (145 lines — read in full; see below), plus
  the older/parallel `csv-upload/route.ts`, `bulk-upload/route.ts`,
  `manifest-load/route.ts`, `corpus-import/route.ts`, `triage/route.ts` and
  `triage/[id]/route.ts`.
- **Commit route contract** (`loader/commit/route.ts:41-145`): calls
  `requireTenancy()`, rejects a `clientId` that doesn't match the tenancy
  context (`403 forbidden_cross_tenant`), requires an explicit operator
  attestation (`validatePilotUploadAttestation`), canonicalizes the tenant key
  via `canonicalTenantKey()` from `@/lib/tenant/aliases` **before** calling
  `commitAcceptedProposals()`, and supports three modes:
  `validate_only` (202, no mutation), `stage_and_process`,
  `stage_and_enqueue`. This "canonicalize the tenant key right at the write
  boundary, not at read time" pattern is the fix for the known
  app-alias-vs-canonical mismatch (see §10) and is the pattern PR2+ should
  copy for any pricing-object commit route.
- **UI** — `src/app/(maestro)/admin/context-layer/` has `templates/`,
  `uploads/`, `approval-queue/`, `evidence-map/`, `triage/`, `syncs/`,
  `layout.tsx`, `page.tsx`.
- **Dataset manifest governance layer** (referenced by AGENTS.md) lives
  alongside this at `docs/governance/dataset-manifests/` with
  `docs/governance/DATASET_POLICY_MANIFEST_TEMPLATE.json` — any new
  pricing/rate-card dataset onboarded through this pipeline needs a manifest
  here per `docs/governance/NEW_DATASET_ONBOARDING_POLICY.md`, gated by
  `validate:context-corpus manifests`.

---

## 4. Migration and RLS/tenant-isolation conventions

- **Real migrations directory**: **`supabase/migrations/`** — the brief's
  guess is correct; it is not stale. 285 files present at audit time. (A
  `supabase/migrations-archive/` also exists — do not add new files there.)
  Other migration-adjacent paths that exist but are not the primary lane:
  `scripts/migrations/`, `db/graph/migrations/`, `src/scripts/run-migrations.ts`,
  `src/scripts/verify-migrations.ts`, `CONTRIBUTING-MIGRATIONS.md`.
- **Naming convention**: `YYYYMMDDHHMMSS_snake_case_description.sql`, e.g. the
  most recent files at audit time: `20260723230000_source_stage_guidebooks_seed_rfp.sql`,
  `20260723120000_moves_p3b_run_dependencies.sql`,
  `20260723100000_deliverable_lifecycle_events.sql`,
  `20260722150000_source_artifact_acceptances.sql`. Use a real, current
  UTC timestamp prefix for any PR1+ migration — do not hand-pick a number.
- **RLS/tenant-scoping convention, real example** —
  `supabase/migrations/20260722150000_source_artifact_acceptances.sql`: the
  table gets `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;` plus a single
  **permissive** `service_role_full_access` policy (`USING (true) WITH CHECK
  (true)`). The migration's own comment is explicit that tenant scoping here
  is enforced **at the application query layer** (join through
  `event_id -> source_events.client_key`), **not per-row RLS**
  (`...acceptances.sql:9-11`). This matches the standing project note that
  genuine per-user/per-tenant RLS is still pre-pilot work (see project memory
  `project_per_user_rls_pilot_ready`) — do not assume row-level tenant
  isolation exists in Postgres itself; the tenancy boundary today is
  `requireTenancy()` in the API layer plus scoped `WHERE` clauses in queries.
- **Append-only/immutable-snapshot convention** — same migration: no
  UPDATE/DELETE path, "latest wins" by `accepted_at DESC` (indexed), with
  explicit `approval_rationale`, `accepted_by`, `accepted_at` columns and a
  `downstream_context_policy` governance hook column. This is the concrete
  precedent to copy for an approved ROM/business-case snapshot table (see
  §11c).

---

## 5. P4 business-case generation gate today

There **is** a real, working gate — it is the **critic** —
`src/lib/programs/expert-kernel/critic.ts` (209 lines), run by
`business-case-compiler.ts` before finalizing a `BusinessCaseSkeleton`.

- Three adversarial lenses, each returning `CriticFinding[]`:
  `cfoChallenge()` (`critic.ts:45-`), a delivery challenge, and a data
  challenge. Each finding carries `severity: "blocker" | "concern" | "note"`.
- **A `blocker` downgrades the recommendation** — the compiler's header
  comment states the rule directly: "a blocker downgrades 'fund' to 'shape'"
  (`business-case-compiler.ts:15`).
- Concretely, in `cfoChallenge()`: if `value.monetisationBlocked` is true
  (the value forecast rests on a seed-gap proxy rather than the tenant's own
  unit economics), that is an automatic `blocker` — `cfo_monetisation_blocked`
  — with message text that explicitly refuses to let the CFO see "a
  fabricated return" (`critic.ts:47-58`). A downside-net-value-below-effort
  case and a suspiciously light value haircut (<10%) are `concern`-level
  findings, not blockers.
- Upstream of the critic, `buildMoveBusinessCase()`
  (`src/lib/programs/move-business-case.ts`) enforces the same honesty
  discipline structurally: an unrecorded baseline metric becomes a named,
  precise "seed gap" (never a fabricated number), and effort/value are always
  labelled planning ranges, never quotes (`move-business-case.ts:14-40`).
- **Net answer**: today, "can we claim this cost/ROI" is decided by (a)
  whether the Move's own `baseline_metrics` / Domain Function Pack binding
  supplies real inputs (absent data → seed gap → `monetisationBlocked` →
  automatic critic blocker → forced `shape`/`kill`), and (b) the critic's
  three-lens pass over whatever `BusinessCaseSkeleton` the kernel produces.
  There is **no separate "is this priced with an approved rate card" gate**
  yet — the rate card the kernel currently uses
  (`RESEARCHED_PLANNING_RATES` in `derived-planning-rate-card.ts:184`) is a
  single hard-coded researched benchmark, not a tenant-specific approved
  pricing profile. That is the gap PR2+ needs to close: today there is no
  concept of "this Move's estimate is priced against client X's committed
  rate card, version N, approved on date D" — only a shared benchmark.

---

## 6. Decimal / currency helpers

- **No arbitrary-precision decimal library is used anywhere in the pricing
  path.** `package.json` has no `decimal.js` (or similar) dependency; the one
  hit for the literal string "Decimal" in the rate-card code
  (`rate-card-ingestion.ts:63`) is just a code comment ("Decimal percentage,
  e.g. 0.28 for 28%"), not a type or import.
- All existing money math is plain JS `number` (IEEE-754 float), with
  formatting-time rounding only.
- **The one real formatting helper module** —
  `src/lib/programs/expert-kernel/exports/format-helpers.ts` (107 lines):
  `usd()` (whole-dollar, thousands-separated, `Math.round`), `usdRange()`,
  `pct()`, `numberOrGap()`, `paybackText()`, plus the load-bearing
  `SEED_GAP_MARKER = 'Not recorded — seed gap'` constant and the "HARD RULE"
  comment (§10.2 reference) that a null/seed-gap figure must render as an
  explicit gap string, never blank, never invented
  (`format-helpers.ts:1-9`).
- `derived-planning-rate-card.ts:120-122` has one intentional-rounding
  helper (`toAnnual()`, `Math.round`) with a comment that annual rates are
  "never quoted to the cent."
- **Assessment**: this is adequate for *display* honesty but is **not** a
  currency-safe computation layer — repeated float arithmetic across
  workstream sums, offshore/onshore blends, and multi-year AI-ops projections
  will accumulate rounding drift at the kind of dollar totals this system
  produces (six/seven figures). PR1/PR4 should decide explicitly whether to
  introduce a fixed-point/integer-cents convention (or a real decimal
  library) for the new pricing engine's core math, rather than silently
  inheriting the existing float convention. This is a real gap, not
  a nitpick — flag it for the PR1 design doc.

---

## 7. Reusable form / wizard / table / approval components

No dedicated "5-step wizard" primitive exists in the repo (searched
`src/components` for `*wizard*` — no hits). The closest reusable building
blocks for a future Cost & Effort wizard:

| Purpose | File |
|---|---|
| Phase gate approve/build action (the closest existing analog to a wizard "submit for approval" step) | `src/components/strategic-moves/PhaseApproveAndBuild.tsx` (686 lines) |
| Role-based approval list/actions | `src/components/strategic-moves/RoleApprovalsPanel.tsx` (262 lines) |
| Board-grade generated artifact display | `src/components/strategic-moves/BoardArtifactsPanel.tsx` |
| Document/evidence upload panel | `src/components/strategic-moves/MoveArtifactUpload.tsx`, `PhaseDocumentsPanel.tsx` |
| Portfolio/list table pattern | `src/components/strategic-moves/MoveListTable.tsx` (234 lines) |
| Shared presentational primitives (chips, status tone, cards, key-value rows) | `src/components/strategic-moves/phase-workspace/primitives.tsx` |
| Per-phase task checklist | `src/components/strategic-moves/phase-workspace/PhaseTaskChecklist.tsx` |
| Multi-card phase workspace composition/layout | `src/components/strategic-moves/phase-workspace/PhaseWorkspaceComposition.tsx` |
| Assumption/pattern disclosure card (good precedent for a "planning range, not a quote" disclosure in the new wizard) | `src/components/source/EstimateAssumptionDisclosure.tsx` |

Recommendation for PR5: build the wizard shell new (there's no existing
step-wizard chrome to inherit), but compose its steps from
`phase-workspace/primitives.tsx` + `PhaseTaskChecklist.tsx` patterns, and
reuse `PhaseApproveAndBuild.tsx`'s approval-submission shape for the final
approve/lock step rather than inventing a new approval UX.

---

## 8. API / server-action conventions (`src/app/api/v1/...`)

**Correction to the brief**: `src/app/api/v1/moves/` is real but is a
**narrow slice** — only board-grade export generators
(`board-grade-business-case`, `board-grade-cfo-pack`,
`board-grade-charter-skeleton`, `board-grade-discover-brief`,
`board-grade-estimate-model`, `board-grade-master-dossier`,
`board-grade-mobilize-packet`, `board-grade-solution-architecture`,
`audit-pack`) plus `phs-command-center/generate`. **The actual Move CRUD/
workflow REST surface lives under `src/app/api/v1/programs/`**, with `Move` =
`Program` = `engagements` row throughout the codebase. Real structure:
`src/app/api/v1/programs/route.ts` (portfolio GET / originate POST),
`src/app/api/v1/programs/_auth.ts` (re-exports tenancy helpers), and
`[programId]/{advance,approvals,approve-brief,artifacts,charter-capture,
current-state,decision-options,deliverables,design,diagnose,execute,flags,
generate,milestones,module,nexus,p0-brief,phase,phase-capture,
phase-gate-approval,phase-intelligence,phase-success-package,playbook,risks,
solution-options,work-items}/route.ts`.

- **Auth/tenancy pattern** (`_auth.ts`, `route.ts:16,32-43`):
  `requireTenancy()` from `@/lib/auth/tenancy`, wrapped in try/catch with
  `tenancyErrorResponse(err)` as the standard unwind path. Permission checks
  layer on top via `loadUserProgramAccessPolicy(ctx)` (`route.ts:75-81`) —
  e.g. `accessPolicy.canCreatePrograms` gates POST with a `403 forbidden`.
- **Error shape**: `{ error: string, detail?: string, fields?: string[] }`
  JSON with the matching HTTP status — `400 bad_request` for malformed/missing
  input, `403 forbidden` / `forbidden_cross_tenant` for authz, `500
  internal_error` as the generic catch-all, logged via `console.error` with
  the route path as a tag (`route.ts:38-42`).
- **Payload redaction discipline**: `route.ts:51-69` — `redactPayload()`
  strips/truncates any key matching `/(token|secret|password|key|
  authorization|cookie|api[_-]?key)/i` before it's ever logged on a 5xx, and
  truncates long string values. Copy this pattern for any new pricing route
  that logs request bodies.
- **Read/write split**: reads go through
  `src/lib/data-plane/azureRead.ts` (`azureRead.select/.maybeSingle/.count`,
  typed `WherePredicate`s, `missingTable: 'empty' | 'throw'` for graceful
  degradation) or a dedicated `read-adapters/*ReadAdapter.ts`; writes go
  through `src/lib/data-plane/write-adapters/*WriteAdapter.ts` (e.g.
  `programsWriteAdapter.ts`). See §11 for the write-adapter recommendation.

---

## 9. Context broker / validated-agent-bundle behavior

- **`src/lib/governance/context-corpus-policy.ts`** (284 lines) — the
  canonical contract named in AGENTS.md, confirmed present and matching:
  `GovernedObjectSchema`/`GovernedObject` (zod), `POLICY_VERSION = "1.0.0"`,
  `SOURCE_LAYERS`, `ENTERPRISE_AREAS`, `CLASSIFICATIONS`,
  `SENSITIVE_CLASSIFICATIONS`, `AGENT_READINESS`, `RETRIEVABILITY`,
  `RETRIEVABLE_STATES`, `APPLICABLE_AGENTS`, `CONFIDENCE_LEVELS`,
  `MOVE_PHASES = ["P0","P1","P2","P3","P4","P5"]`, `evaluateGovernedObject()`,
  `isAgentUsable()`, `isCanonicalClientKey()`.
- **`src/lib/governance/agent-context-bundle.ts`** (256 lines) — real home of
  `buildValidatedAgentContextBundle()` (`agent-context-bundle.ts:146`), plus
  `GovernedCandidate`, `BlockedCandidate`, `ValidatedAgentContextBundle`,
  `DownstreamContextPolicy = "include" | "restricted" | "exclude"`,
  `BuildBundleOptions`, and `buildDecisionReasoningRequest()`.
- **`src/lib/knowledge/agent-context-broker.ts`** (944 lines) — the actual
  app-tier seam (per `feedback_broker_boundary`: app-tier code must not
  bypass this to reach `EnterpriseDataRoom`/tenant-data adapters/vector or
  graph stores directly). Header docstring (`agent-context-broker.ts:1-46`)
  documents the **two-source consumer** design: persisted tenant data via
  `TenantDataAdapter` (`hasPersistedData(tenantKey)`) when present, else the
  legacy synchronous `EnterpriseDataRoom` fixture — never mixed in one
  response — and two entry points, `buildEnterpriseAgentContextBundle`
  (sync, fixture-only) vs. `buildEnterpriseAgentContextBundleAsync`
  (two-source). It composes `mapTenantRecordsToContextItems`,
  `getTenantDataAdapter`, `normalizePrivateTenantKey`, and finally calls
  `buildValidatedAgentContextBundle` / `fromEnterpriseBundle` from the
  governance modules above.
- **`src/lib/knowledge/tenant-enterprise-context.ts`** exists as named in
  AGENTS.md (confirmed present in `src/lib/knowledge/`) — not read in full
  this pass; treat as in-scope for PR3/PR4 to check how it composes with the
  broker for any new rate-card/pricing-profile context object.
- **Rate cards are explicitly out of this policy today** — per §1, the
  kernel's own `rate-card-templates.ts` comment says rate cards are
  deliberately *not* pushed into `ContextDimension`/the enterprise-context
  registry. PR3 needs to decide: does a tenant pricing profile become a new
  governed `GovernedObject` kind flowing through
  `buildValidatedAgentContextBundle` (for narrative/ Claude-facing use), while
  the numeric rate-card rows stay a separate, deterministic Postgres table
  the kernel reads directly (per the "Tower numbers remain deterministic"
  rule in AGENTS.md)? The existing precedent (rate cards excluded from
  context-dimension governance, but numerically canonical in their own
  Postgres tables) argues for that split, not for folding pricing rows into
  the context-corpus policy wholesale.

---

## 10. Canonical tenant key pattern

**Two canonical-key sources exist and must be kept straight** (this is the
documented app-alias-vs-canonical-key gotcha referenced in project memory,
concretely present in code):

- **`src/config/tenants/CANONICAL_TENANTS.ts:84-127`** — the tenant registry
  of record: `CANONICAL_TENANTS` array with keys `apex-retail`,
  `meridian-health`, `northstar-clinical`, `first-capital`, `skyharbor-air`,
  `lakeshore-holdings` (hyphenated, human-readable canonical form), each with
  `name`, `industry`, `mimics`, `patternOverlays`, optional `compliance`
  metadata. `export const CANONICAL_TENANT_KEYS = CANONICAL_TENANTS.map(t =>
  t.key)` (`CANONICAL_TENANTS.ts:131-133`).
- **`src/lib/tenant/aliases.ts:152-158`** — a second, **consistent**
  `CANONICAL_TENANT_KEYS` derived from `TENANT_ALIAS_PROFILES`
  (`aliases.ts:20-107`), which maps each *app* client key (`apexretail`,
  `meridian`, `arcturus`, `northstar`, `skyharbor`, `lakeshore` — no hyphens,
  matches `ClientKey`/`src/lib/client-config`) to the same canonical,
  hyphenated key plus a `brokerKey` and a list of free-text `aliases`
  ("apex", "retail demo", etc.). Exposes `resolveTenantAlias()`,
  `canonicalTenantKey()`, `appClientKeyForTenant()`, `brokerTenantKey()`,
  `tenantAliasesFor()`, `canonicalTenantDisplayName()`,
  `tenantIndustryCode()`, `isLegacyTenantAlias()`.
- **The gotcha, concretely**: the app/session layer generally carries the
  *app* client key (`apexretail`, no hyphen — e.g. `TenancyCtx.clientKey` in
  `types.db.ts:99`), while the DB `clients.key` column and cross-system
  broker/mart keys use the *canonical* hyphenated form (`apex-retail`). Prior
  project history (`project_apex_tenant_key_split`,
  `project_tower_command_center_v2`) records real bugs from comparing these
  directly. The **fixed pattern to copy**, seen live in
  `load-move-business-case-input.ts:68-79` and
  `loader/commit/route.ts:84`: read the app-session key, then call
  `canonicalTenantKey()` (or, in the business-case loader, prefer the DB
  `clients.key` row value over the session key when available) **only at the
  boundary where it's about to be used for a cross-system write/compare** —
  never assume the session key and the DB/canonical key are already the same
  string. PR2's pricing tables should store the canonical hyphenated key (to
  match `clients.key` / mart convention) and canonicalize at the API
  boundary, exactly like the context-layer commit route does.

---

## 11. Explicit answers

**(a) Are any pricing tables or services already present?**
Yes, extensively, but as **deterministic in-app/in-memory modules and
hard-coded/demo data, not as versioned, tenant-owned Postgres tables**. The
rate-card, effort-estimator, ai-ops-cost, business-case-compiler, and critic
modules under `src/lib/programs/expert-kernel/` (§1) are real, tested, and
live-rendered (`LivingMoveView.tsx`). There is **no `pricing_*` table family
in `supabase/migrations/`** (grepped; none found) and no persisted, versioned,
tenant-approved rate card — today's rate card is one shared researched
benchmark (`RESEARCHED_PLANNING_RATES`), not a per-client committed pricing
profile with history. PR2 is building genuinely new persistence for
genuinely-existing business logic, not new business logic.

**(b) What is the canonical tenant/client key pattern?**
`src/lib/tenant/aliases.ts` (`CANONICAL_TENANT_KEYS`, `canonicalTenantKey()`,
`resolveTenantAlias()`), backed by the tenant-of-record list in
`src/config/tenants/CANONICAL_TENANTS.ts`. Canonical form is hyphenated
(`apex-retail`); the app/session layer's `ClientKey` (`apexretail`, no
hyphen) is a distinct, related-but-different string — canonicalize at the
write/cross-system boundary, never assume equality. See §10.

**(c) How are immutable accepted artifacts/snapshots represented today?**
The concrete, current precedent is
`supabase/migrations/20260722150000_source_artifact_acceptances.sql`
(`source_artifact_acceptances` table): append-only (no UPDATE/DELETE path),
"latest wins" via `accepted_at DESC` index rather than in-place mutation,
explicit `approval_rationale` + `accepted_by` + `accepted_at`, a
`content_drift_status` field to flag staleness against the live artifact, and
a `downstream_context_policy` column as the governance hook. `PhaseSnapshot`
(`types.db.ts:303-312`, `lockedByUserId`/`lockedAt`/`approvalStatus`) is the
lighter-weight, engagement-level analog already used for phase gates. PR6's
"approved ROM/business-case snapshot" table should follow the
`source_artifact_acceptances` shape: append-only, `accepted_by`/`accepted_at`/
`approval_rationale`, a version/superseding column, RLS enabled with
tenant scoping enforced at the query layer (matching current convention) —
not a mutable "current ROM" row that gets overwritten.

**(d) How does P4 currently decide whether a cost/ROI claim is
supportable?**
Via `runCritic()` in `src/lib/programs/expert-kernel/critic.ts`, called by
`business-case-compiler.ts` before finalizing. A `blocker`-severity finding
(most importantly `cfo_monetisation_blocked`, raised whenever the value
forecast rests on a seed-gap proxy rather than the tenant's own recorded
data) forces the recommendation down from `fund` to `shape`/`kill`. Upstream,
`buildMoveBusinessCase()` (`move-business-case.ts`) enforces the same
discipline structurally by turning any unrecorded baseline metric into a
named seed gap rather than a fabricated number. See §5 for the full mechanism
and the gap this PR sequence needs to close (no tenant-approved rate-card
version gate exists yet — only a shared researched benchmark).

**(e) Where should the new Cost & Effort workspace live without forking the
Moves architecture?**
Recommend: **extend the existing phase-pack + phase-workspace architecture,
do not create a parallel Move sub-app.**
- New UI: a `src/components/strategic-moves/phase-workspace/cost-effort/`
  (or sibling `CostEffortWizard.tsx` + supporting cards) directory, composed
  from the existing `phase-workspace/primitives.tsx` + `cards.tsx` +
  `PhaseTaskChecklist.tsx` patterns (§7), surfaced from whichever P4 phase
  pack generation (`phase-packs/P4_build.ts` vs. `phase-packs/v2/
  P4_roadmap.v2.ts` — **confirm which is live before wiring**, §2) actually
  renders in the current Move UI.
- New API: under `src/app/api/v1/programs/[programId]/` as a new
  sub-resource (e.g. `.../cost-effort/route.ts`), following the
  `requireTenancy()` + `tenancyErrorResponse()` + `{error,detail}` JSON
  conventions in §8 — **not** under `src/app/api/v1/moves/`, which is
  reserved for board-grade export generation only.
- New business logic: a new module under
  `src/lib/programs/expert-kernel/` (e.g. `pricing-profile/` or
  `cost-effort-workspace/`) that **calls into**, rather than duplicates,
  the existing `effort-estimator.ts` / `business-case-compiler.ts` /
  `derived-planning-rate-card.ts` pipeline — the new workspace's job is to
  supply a tenant-approved, persisted rate card and pricing profile as an
  *input* to that pipeline in place of `RESEARCHED_PLANNING_RATES`, not to
  re-implement should-cost math.
- Rationale: the kernel pipeline is real, tested, and already the single
  source of truth for Move labour economics (shared with Source's
  should-cost model). Forking a new estimating engine would immediately
  create two divergent cost models for the same company. The gap is
  entirely on the *input* side (no persisted, versioned, tenant-specific
  rate card / pricing profile) and the *gate* side (no "priced against an
  approved rate card" check in the critic) — both additive, not
  replacements.

---

## 12. Seam corrections (brief's guessed paths vs. reality)

| Brief guessed | Status | Correction |
|---|---|---|
| `src/lib/context-ingestion/` | **Correct** | Real and heavily used; template registry lives here (`template-registry.ts`), plus the `loader/` pipeline. |
| `src/app/(maestro)/admin/context-layer/` | **Correct** | Real; has `templates/`, `uploads/`, `approval-queue/`, `evidence-map/`, `triage/`, `syncs/`. |
| `src/app/api/admin/` | **Correct** | Real; `context-layer/{csv-upload,bulk-upload,corpus-import,manifest-load,triage,loader/*}` all present. |
| `src/lib/governance/context-corpus-policy.ts` | **Correct** | Exists exactly as named, with `GovernedObject`, zod schema, `evaluateGovernedObject`. |
| `src/lib/knowledge/tenant-enterprise-context.ts` | **Correct** | Confirmed present in `src/lib/knowledge/`. |
| `src/lib/data-plane/postgresCompat.ts` | **Correct but legacy-adjacent** | The file exists (22 KB) and is still referenced by hundreds of call sites (grep shows 250+ importers across `src/app` and `src/lib`). But **it is not the pattern to copy for new code** — the newer, narrower `src/lib/data-plane/azureRead.ts` (typed `select`/`maybeSingle`/`count`, `WherePredicate`, `missingTable` handling) plus the `read-adapters/*ReadAdapter.ts` / `write-adapters/*WriteAdapter.ts` families are what recent code (e.g. `load-move-business-case-input.ts`) actually uses. PR2's pricing persistence should follow the `azureRead` + dedicated `pricingReadAdapter.ts`/`pricingWriteAdapter.ts` pattern, not call `postgresCompat` directly. |
| `src/components/strategic-moves/` | **Correct** | Real, matches described contents (BoardArtifactsPanel, PhaseApproveAndBuild, RoleApprovalsPanel, etc.), plus a `phase-workspace/` sub-directory the brief didn't anticipate. |
| `src/app/api/v1/moves/` | **Partially wrong — needs correction** | Exists, but is a **thin slice**: only board-grade export routes + `phs-command-center/generate`. **The real Move CRUD/workflow REST surface is `src/app/api/v1/programs/[programId]/...`** — Move ≡ Program ≡ `engagements` row throughout the codebase. Any new pricing/cost-effort API route should go under `programs/[programId]/`, not `moves/`. |
| `supabase/migrations/` | **Correct** | Confirmed the real, current migrations directory (285 files, `YYYYMMDDHHMMSS_description.sql`, latest at audit time `20260723230000_...`). No stale-assumption correction needed here — this is one guess in the brief that was right. |
| (not guessed, but material) `template_registry` / `TemplateRegistry` as a literal name | **Does not exist** | The concept exists; the name is `src/lib/context-ingestion/template-registry.ts` exporting plain functions (`getTemplatesForTenant`, etc.), not a class/registry object named `TemplateRegistry`. |

---

## 13. Recommended schema/ownership approach for PR1+ (non-binding ADR)

**Status**: recommendation only. No tables created, no code changed.

1. **New `pricing_*` table family, tenant-owned, in `supabase/migrations/`.**
   Minimum shape for PR2:
   - `pricing_rate_cards` — one row per tenant-approved rate card *version*
     (not per role/rate). Columns: `id`, `client_id` (FK `clients.id`),
     `tenant_key` (canonical, hyphenated — see §10), `version`, `status`
     (`draft` / `approved` / `superseded`), `source` provenance fields
     (mirroring `rate-card-templates.ts`'s existing `source`/`as_of`/
     `confidence` convention), `approved_by`, `approved_at`,
     `approval_rationale`, `created_at`. Append-only for approved versions —
     copy the `source_artifact_acceptances` pattern (§11c): a new approval is
     a new row, never an UPDATE of an approved row.
   - `pricing_rate_card_rows` — the actual role/tier/geo rate rows, FK'd to
     `pricing_rate_cards.id`, shaped to match (not duplicate) the existing
     `RoleRateCard` / benchmark-rate-card row shape so
     `derived-planning-rate-card.ts`'s projection logic can be pointed at a
     tenant row set with minimal change.
   - `pricing_client_profiles` — the client-specific pricing/commercial
     profile (offshore ratio defaults, discount tiers, geo modifiers) that
     today only exists as one-off fields scattered in `EffortEstimatorInput`
     (`effort-estimator.ts:71-85`) — centralize it here, tenant-scoped.
   - `pricing_estimate_snapshots` (PR6) — the approved ROM/business-case
     snapshot, same append-only/immutable convention.
   - RLS: `ENABLE ROW LEVEL SECURITY` + service-role policy, tenant scoping
     enforced in the read/write adapters (matches current repo-wide
     convention, §4) — do not attempt real per-row RLS in this PR sequence
     unless the broader per-user-RLS pilot-readiness work (project memory:
     still open) lands first; stay consistent with the rest of the codebase
     rather than introducing an inconsistent stricter model in one table
     family.

2. **Relationship to existing Move/tenant tables**: `pricing_rate_cards` and
   `pricing_client_profiles` key off `client_id`/`tenant_key` directly (they
   are tenant-level reference data, not Move-level) — a Move's business case
   then *references* an approved `pricing_rate_cards.id` (and, once it
   exists, a `pricing_estimate_snapshots.id`) rather than embedding pricing
   data inline in `engagements`. Extend `ProgramCore`
   (`types.db.ts:109-166`) with a nullable `pricingRateCardId` /
   `pricingSnapshotId` pointer only when PR6 needs it — don't touch
   `engagements` in PR1/PR2.

3. **Reuse vs. build new**:
   - **Reuse as-is**: `effort-estimator.ts`'s workstream/role-mix math,
     `business-case-compiler.ts`, `critic.ts`, the should-cost engine in
     `src/lib/source/should-cost/`, `format-helpers.ts`'s honesty-formatting
     rules, the `azureRead`/write-adapter pattern, the `requireTenancy()` +
     `tenancyErrorResponse()` API convention, the
     `source_artifact_acceptances` immutable-snapshot pattern, and
     `canonicalTenantKey()` for all tenant-key handling.
   - **Extend, don't fork**: `derived-planning-rate-card.ts` — change its
     single `card` parameter from always defaulting to the hard-coded
     `BENCHMARK_RATE_CARD` to optionally resolving a tenant's approved
     `pricing_rate_cards` row when one exists, falling back to the
     researched benchmark when it doesn't (explicit, disclosed fallback —
     matching the existing honesty discipline, never silently swap without
     saying so in the UI).
   - **Build new**: the persistence layer (§1 above), the upload/approve/
     commit UI and API for tenant rate cards (reusing the
     `context-ingestion/loader/` parse→validate→preview→approve→commit
     shape structurally, but as its own pipeline per `rate-card-templates.ts`'s
     existing "not enterprise-context" boundary — do not literally push rate
     cards through `template-registry.ts`/`buildValidatedAgentContextBundle`),
     the new critic check ("priced against an approved, non-expired rate
     card version"), and the Cost & Effort wizard UI (§11e).
   - **Decide explicitly, do not silently inherit**: the float-vs-fixed-point
     money representation question (§6) — this PR sequence is a good forcing
     function to introduce a disciplined integer-cents or decimal convention
     for new pricing tables/computation, even if the existing kernel keeps
     using floats for now.

---

## 14. Direction decision (2026-07-23)

PR0 surfaced a third overlapping system beyond the expert-kernel rate-card
subsystem documented above: `src/lib/workforce-economics/workforce-economics.ts`
(a 321-role/21-tower/891-rate-card-unit parametric "estimate twice"
traditional-vs-AI-native compute engine, ~425 lines), which is further along
than a point-in-time record suggested — it is now imported by
`src/lib/programs/expert-kernel/exports/board-grade/move-workforce-economics-binding.ts`
and `move-pack-model.ts`, and gated behind the `moves_workforce_economics`
feature flag (registered in `src/lib/features/registry.ts` and
`src/lib/agent/product-truth/capability-registry.ts`, default OFF).

Given three overlapping candidate foundations (expert-kernel's rate-card/
effort-estimator/business-case-compiler, workforce-economics's parametric
taxonomy/engine, and this brief's proposed `pricing_*` schema), the explicit
decision — confirmed with the product owner — is:

**Build the new pricing engine fresh, exactly per the brief's PR1–PR7
sequence**, as its own independent `pricing_*` schema, taxonomy pack, and
`src/lib/pricing/` engine. It will **coexist** with expert-kernel and
workforce-economics for the duration of this build; reconciling/replacing
those systems is explicitly **out of scope** for this PR sequence and is not
to be attempted opportunistically mid-slice. Do not silently fold this
brief's taxonomy or rate-card work into `rate-card/` or
`workforce-economics.ts` — keep the new `pricing_*` persistence, taxonomy,
and engine modules independent, per brief §2.12 ("Do not create parallel
infrastructure when an existing repository pattern is suitable" is
acknowledged and explicitly overridden by product decision for this build,
not silently ignored).

Downstream implication for PR1: the workbook seed is **not**
`AbarVa_Workforce_Model_v3.xlsx` (that literal filename does not exist on
disk) — the closest available seed in `~/Downloads` is
`AbarVa_Workforce_Economics_Model.xlsx`, with `Workforce_Taxonomy_Master.xlsx`
as a secondary reference for the already-built 321-role/21-tower taxonomy
(useful for cross-checking coverage and level-banding decisions, not as a
literal source to copy — the new taxonomy is being built independently, see
above).
