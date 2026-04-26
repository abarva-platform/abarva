# Solution / Workshop Verification Runbook

Slice ID: QA14
Slice name: Solution / Workshop Verification Runbook (SOL10–SOL14 + MW7)
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane G (Wave2 parallel build pack)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls, no live retrieval, no
browser automation.

This runbook is the founder-facing checklist for verifying that the
**solution canvas implementation** layer — the Solution Canvas UI
Shell (SOL10), the Solution Architecture Draft Read Model (SOL11),
the Workshop-to-Architecture Refinement (SOL12), the Architecture
Deliverable Renderer (SOL13), the Solution Canvas Versioning Layer
(SOL14), and the Workshop Deliverable Refinement Loop (MW7) — land
**honestly** before push or PR.

It is the fourth companion runbook in the QA family:

- QA1 — [`AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md) covers the agentic spine (Programs ↔ Tower ↔ Intelligence ↔ Admin).
- QA2 — superseded; the SOL1 / SOL2 / MW2 / PF2 contracts live now under [`SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`](./SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md) §A and §I.
- QA3 — [`SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`](./SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md) covers SOL3–SOL9 (archetype registry, component packs, evaluator, detail read model, canvas contract, recommendation engine).
- QA14 (this file) extends that surface to the **canvas implementation** slices SOL10 → SOL14 plus the **MW7 workshop refinement loop** that closes the workshop ↔ deliverable cycle.

The runbook is meant to be **walked manually** in a browser after the
relevant slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Each section has one expected outcome per row; do not skip rows.

---

## §A · Purpose and scope

QA14 verifies six canonical artifacts that together describe how the
platform **renders a solution architecture for a specific client and
keeps it honestly current as workshops execute**:

- **SOL10 — Solution Canvas UI Shell.** Server-Component canvas shell
  that consumes the SOL8 contract sections and renders them with the
  AbarVa visual canon (calm Georgia / DM Sans, #F8F7F4 bg, 120ms fade
  on mode swap). Mounts the Builder + Reviewer agent partition,
  surfaces deterministic source captions, and never invents content.
- **SOL11 — Solution Architecture Draft Read Model.** Pure
  deterministic projection of (tenant, archetype, current-state,
  workshop notes) into an architecture-draft view-model with twelve
  canvas sections (overview, applicable patterns, components, build /
  buy / partner verdict, evidence requirements, governance, workshops,
  deliverables, risks, missing inputs, confidence, source captions).
- **SOL12 — Workshop-to-Architecture Refinement.** Deterministic
  merge layer that takes MW2 workshop readiness records plus MW4
  meeting notes and updates the SOL11 draft *honestly* — appending
  observed decisions / risks / objections without overwriting the
  base architecture. Live LLM-assisted refinement is deferred to
  SOL12 Phase 2.
- **SOL13 — Architecture Deliverable Renderer.** Renders the SOL11
  draft into an OUT1-compliant deliverable (HTML render, markdown
  render, note list) with file-type chip, downloadable: false today,
  and PDEL inventory binding. Export pipeline is deferred.
- **SOL14 — Solution Canvas Versioning Layer.** Read-only versioning
  surface that captures every SOL11 draft snapshot, every SOL12
  refinement merge, and every SOL13 render in an append-only seed-
  backed log; the canvas exposes "version N · created from X" chips
  on every section. No mutations are persisted; the layer is a view
  over the deterministic seed.
- **MW7 — Workshop Deliverable Refinement Loop.** Closes the workshop
  ↔ deliverable cycle: after each workshop, MW7 promotes the workshop
  notes (MW4) and SME recommendations (MW6) into the SOL12 refinement
  call, then re-renders the SOL13 deliverable. Stub → Outline → Rich
  refinement is deterministic; audit-ledger emission per refinement
  is named in the contract.

**In scope.** Reading the artifact specs / source modules (when they
exist); running the tests; reading the JSON projection of each module
to check for fabricated dollars, fake citations, or named-vendor
endorsements; walking the canvas surface across the canonical demo
tenant (`apex-retail`) when SOL10+ are wired into a route.

**Out of scope.** Workshop dynamics (covered in QA2-superseded /
QA3). Agentic spine walks of Programs / Tower / Intelligence / Admin
(covered in QA1). Live retrieval, live model calls, live LLM-assisted
refinement, exporter / download pipelines, real evidence citations,
live agent runtimes, audio ingestion — all deferred.

---

## §B · Branch hygiene checklist

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope; no surprise commits. |
| Last three commits | `git log --oneline -3` | Each commit message names a SOL10–SOL14 / MW7 slice (or QA14 itself); subjects are short and scoped. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / runtime / migration files. |
| Pre-commit staged set | `git diff --cached --name-only` after commit returns empty | Means the staged set matched the slice's `allowedFiles`; nothing slipped in. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase files. |

**Stop and investigate** if any check fails. Do not push or demo
from a working tree with unexplained modifications.

---

## §C · Required validation commands

Run from the repo root in order. Each must pass before the per-slice
walks. Items marked *(when wired)* are conditional on the slice
having reached `code_complete`; until then, the row is **deferred**
and must read as deferred — never silently skipped.

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. The well-known Next.js worktree symlink panic is acceptable to mitigate by clearing `.next/` and re-running once. |
| JSON manifest parse | `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"` | Prints `json ok`. |
| SOL10 — canvas UI shell *(when wired)* | `npx jest src/__tests__/integration/solutions/solution-canvas-shell.test.ts` | All green. |
| SOL11 — architecture draft *(when wired)* | `npx jest src/__tests__/integration/solutions/solution-architecture-draft.test.ts` | All green. |
| SOL12 — workshop refinement *(when wired)* | `npx jest src/__tests__/integration/solutions/solution-workshop-refinement.test.ts` | All green. |
| SOL13 — deliverable renderer *(when wired)* | `npx jest src/__tests__/integration/solutions/solution-deliverable-renderer.test.ts` | All green. |
| SOL14 — canvas versioning *(when wired)* | `npx jest src/__tests__/integration/solutions/solution-canvas-versioning.test.ts` | All green. |
| MW7 — workshop refinement loop *(when wired)* | `npx jest src/__tests__/integration/programs/workshop-deliverable-refinement-loop.test.ts` | All green. |
| SOL8 contract regression | `npx jest src/__tests__/integration/solutions/solution-intelligence-canvas-contract.test.ts` | All green (canvas implementation must not break the contract). |
| SOL9 recommendation engine | `npx jest src/__tests__/integration/solutions/solution-recommendation-engine.test.ts` | All green (recommendation pack feeds SOL10/11). |
| MW2 workshop readiness | `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` | All green (refinement consumer). |
| Auth · tenant isolation (S7) | `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` | All green. |

If any required command fails, **stop and decide**: amend the slice,
discard, or capture the failure in a tracked issue before proceeding
to the live walk.

---

## §D · How to verify SOL10 outputs (Solution Canvas UI Shell)

SOL10 is a **UI** slice. It lives in
`src/components/solutions/SolutionCanvasShell.tsx` (Server Component)
with a deterministic view binding at
`src/lib/solutions/solution-canvas-shell-view.ts`, contract tests at
`src/__tests__/integration/solutions/solution-canvas-shell.test.ts`,
and a slice doc at
[`docs/build/slices/SOL10_SOLUTION_CANVAS_UI_SHELL.md`](./slices/SOL10_SOLUTION_CANVAS_UI_SHELL.md).

| Check | Expected |
|---|---|
| Server Component invariant | `SolutionCanvasShell.tsx` declares no `'use client'` directive and uses no React hooks. The component reads its data from a `props.view` argument (the view binding), never from `fetch`, `process.env`, `cookies()`, or `headers()`. |
| Canon imports only | The component imports `COLORS`, `FONT`, `BORDER`, `RADIUS`, `SPACING`, and `TYPE` from `@/lib/design/abarva-theme`. No local hex literals (`#[0-9a-fA-F]{3,8}`); no local `const COLORS`; no inline `style={{ background: '...' }}` with a literal color. |
| Twelve SOL8 sections rendered | The shell renders exactly the twelve SOL8 canvas sections in canonical order: overview · applicable patterns · components · build / buy / partner · evidence requirements · governance · workshops · deliverables · risks · missing inputs · confidence · source captions. |
| Builder + Reviewer agent partition surfaced | The shell shows the Builder agent (Nexus) on the left and the Reviewer agent (Sentinel) on the right per SOL8 §C. Both render as `disabled` chips today with sub-label `deferred · live <agent> runtime`. |
| Source caption per section | Every section renders a source-caption chip naming `deterministic_seed`, `deterministic_archetype_seed`, `deterministic_workshop_seed`, or a `*_read_model` marker. No section lacks a caption. |
| 120ms fade only on mode swap | The shell's mode swap (overview → component-zoom → workshop-zoom) animates with a 120ms opacity fade only — no slide, no spring, no CSS transform. |
| No fabricated dollars | No string in any rendered section contains `\$\s?\d`. |
| No real `E-###` evidence citation | The evidence-requirements section reads "Evidence citations are not yet wired for this deterministic canvas view." No `E-\d{3,}` reference appears. |
| Empty-tenant honest copy | When the input view is the empty / unknown tenant, the shell renders explicit "no archetype draft today" copy that names the absence and the deterministic basis; no blank screen. |
| Module hygiene | The shell imports nothing from `src/lib/source/`, `src/lib/auth/`, `src/lib/supabase/`, `supabase`, model SDKs (`anthropic`, `openai`, `cohere`), or agent runtime modules. |

Stop if: any section is missing; any local hex literal is found;
any `'use client'` is added; any hook is used; the fade exceeds 120ms
or uses a non-opacity transform; any Ask-agent chip is enabled; any
fabricated dollar slips through.

---

## §E · How to verify SOL11 outputs (Solution Architecture Draft)

SOL11 is a **read-model** slice. It lives in
`src/lib/solutions/solution-architecture-draft.ts` with contract
tests at
`src/__tests__/integration/solutions/solution-architecture-draft.test.ts`
and a slice doc at
[`docs/build/slices/SOL11_SOLUTION_ARCHITECTURE_DRAFT.md`](./slices/SOL11_SOLUTION_ARCHITECTURE_DRAFT.md).

| Check | Expected |
|---|---|
| `buildSolutionArchitectureDraft` is deterministic | Calling the function with the same `(tenantKey, archetypeKey, currentState, workshopNotes)` arguments returns a byte-equal output across runs. No `Date.now`, no `Math.random`, no `new Date(...)`, no time-stamped values. |
| Twelve canvas sections present | The draft exposes exactly twelve sections: `overview`, `applicablePatterns`, `components`, `buildBuyPartner`, `evidenceRequirements`, `governance`, `workshops`, `deliverables`, `risks`, `missingInputs`, `confidence`, `sourceCaptions`. |
| Confidence cap from seed alone | `confidence` is at most `medium` when sourced only from deterministic seed. `high` is reserved for SME-validated or workshop-merged drafts. |
| `applicablePatterns` references canonical I1 keys only | Every key in the `applicablePatterns` list resolves to a canonical I1 pattern key. No invented keys. |
| `components` references canonical SOL2 / SOL4 / SOL5 keys only | Every key in the `components` list resolves to a canonical SOL2 / SOL4 / SOL5 component key. No invented keys. |
| `buildBuyPartner` is the SOL6 verdict | The verdict is exactly the value returned by the SOL6 evaluator for the same input; no separate evaluator is fabricated inside SOL11. |
| `missingInputs` is explicit and sorted | Missing inputs are surfaced as a first-class field; the list is sorted (canonical category order or severity), not random. |
| `sourceCaptions` is per-section | Every section in the output carries a `sourceCaption` field with one of `deterministic_archetype_seed`, `deterministic_workshop_seed`, `deterministic_pattern_seed`, `deterministic_component_seed`, or a `*_read_model` marker. |
| `createdFrom` provenance | Every record carries `createdFrom: 'deterministic_solution_architecture_draft_seed'` (or the canonical equivalent). No record claims live retrieval or live model composition. |
| No invented dollars | No string field contains `\$\s?\d`. |
| Module hygiene | Imports nothing from `Sentinel`, `Atlas`, `Nexus`, agent runtime, Source UI, `mock.ts`, auth, supabase, or model SDKs. |

Stop if: section count ≠ 12; any required field is missing; an
applicable-pattern or component key is invented; the draft claims
`high` confidence from seed alone; any `Date.now` / `Math.random`
slip in; the build/buy/partner verdict diverges from SOL6.

---

## §F · How to verify SOL12 outputs (Workshop-to-Architecture Refinement)

SOL12 is a **deterministic merge** slice. It lives in
`src/lib/solutions/solution-workshop-refinement.ts` with contract
tests at
`src/__tests__/integration/solutions/solution-workshop-refinement.test.ts`
and a slice doc at
[`docs/build/slices/SOL12_SOLUTION_WORKSHOP_REFINEMENT.md`](./slices/SOL12_SOLUTION_WORKSHOP_REFINEMENT.md).

| Check | Expected |
|---|---|
| `refineDraftFromWorkshopNotes` is deterministic | Same inputs → byte-equal output. No `Date.now`, no `Math.random`, no `fetch`, no model SDK call. |
| Refinement is **append**, not **overwrite** | The base SOL11 architecture is preserved verbatim; the workshop merge appends observed decisions, observed risks, and observed objections to existing fields. The original `applicablePatterns`, `components`, and `buildBuyPartner` verdict are never silently overwritten. |
| Conflict surfacing is explicit | When workshop notes contradict the base draft (e.g., the workshop concludes `partner` but SOL6 returned `build`), the merge produces an explicit `conflicts` array with `{ field, baseValue, workshopValue, severity }` entries. The verdict is **not** auto-flipped. |
| Workshop-merged confidence cap | After a workshop merge, confidence may rise to `medium-high` only if the workshop is `executive_alignment` or `solution_design_review` AND the merge produced no conflicts. Otherwise confidence stays at or below `medium`. `high` remains reserved for SME-validated drafts. |
| `createdFrom` chain preserved | The merged draft carries `createdFrom: 'deterministic_workshop_refinement_seed'` and a `basedOn: { sol11DraftId, mw4WorkshopId, mw2ReadinessId }` provenance triple. No provenance is invented. |
| Live LLM Phase 2 is deferred | The contract names that LLM-assisted refinement is **deferred** to SOL12 Phase 2. Today's implementation contains no `anthropic` / `openai` / `cohere` import and no `fetch` to a model gateway. |
| Module hygiene | Imports nothing from `Sentinel`, `Atlas`, `Nexus`, agent runtime, Source UI, auth, supabase, or model SDKs. |

Stop if: the merge overwrites the base draft silently; conflicts are
absent or auto-resolved; confidence claims `high` from a workshop
merge alone; any model SDK import slips in; provenance is missing.

---

## §G · How to verify SOL13 outputs (Architecture Deliverable Renderer)

SOL13 is a **renderer** slice. It lives in
`src/lib/solutions/solution-deliverable-renderer.ts` (and a Server-
Component view at
`src/components/solutions/SolutionDeliverableView.tsx`) with contract
tests at
`src/__tests__/integration/solutions/solution-deliverable-renderer.test.ts`
and a slice doc at
[`docs/build/slices/SOL13_SOLUTION_DELIVERABLE_RENDERER.md`](./slices/SOL13_SOLUTION_DELIVERABLE_RENDERER.md).

| Check | Expected |
|---|---|
| OUT1 deliverable shape | The renderer emits an OUT1-compliant deliverable: `{ deliverableId, fileType, renderingMode, body, downloadable, createdFrom, sourceCaptions }`. Field names match OUT1 verbatim. |
| `fileType` is canonical | `fileType` is one of `DOC` · `PDF` · `XLS` · `PPT` · `NOTE` · `HTML` · `DATA`. The chip color / glyph matches. |
| `renderingMode` is canonical and gated | `renderingMode` is one of `html_render`, `markdown_render`, `note_list`. Other modes (e.g., `pdf_export`, `pptx_export`) are **deferred** and the renderer refuses to emit them — instead it emits a `deferred · export pipeline` placeholder with the file-type chip. |
| `downloadable: false` everywhere today | Every emitted deliverable carries `downloadable: false`. The download button (when rendered in canvas) is `disabled` with sub-label `deferred · export pipeline`. |
| `body` cites SOL11 sections only | The rendered body content cites only sections present in the SOL11 draft input. No section is fabricated. The body never names a vendor by name as an endorsement (Snowflake / Databricks / Vertex / Bedrock / Azure OpenAI mentions render as neutral capability shapes, not endorsements). |
| PDEL inventory binding | The deliverable, when published, registers in the PDEL inventory under the correct `phaseKey` with `renderableInCanvas: true` only when `renderingMode` is one of `html_render` / `markdown_render` / `note_list`. |
| No fake citations | No `E-\d{3,}` evidence citation appears in the body. The evidence section reads "Evidence citations are not yet wired" verbatim. |
| `createdFrom` provenance | Every deliverable carries `createdFrom: 'deterministic_solution_deliverable_seed'` and a `basedOn: sol11DraftId`. |

Stop if: a deferred render mode is emitted as a real deliverable;
`downloadable: true` appears anywhere; a vendor name is cited as
an endorsement; a fake `E-###` citation slips through; PDEL binding
is wrong.

---

## §H · How to verify SOL14 outputs (Solution Canvas Versioning Layer)

SOL14 is a **read-only versioning** slice. It lives in
`src/lib/solutions/solution-canvas-versioning.ts` with contract
tests at
`src/__tests__/integration/solutions/solution-canvas-versioning.test.ts`
and a slice doc at
[`docs/build/slices/SOL14_SOLUTION_CANVAS_VERSIONING.md`](./slices/SOL14_SOLUTION_CANVAS_VERSIONING.md).

| Check | Expected |
|---|---|
| Append-only log shape | The version log exposes `{ versionId, parentVersionId, kind, sourceSlice, createdFrom, snapshot }` per entry. Entries are emitted in deterministic seed order; no entry is mutated after emission. |
| `kind` is canonical | `kind` is one of `sol11_draft_snapshot`, `sol12_refinement_merge`, `sol13_render`. No other kinds. |
| `parentVersionId` chains correctly | Every entry except the genesis entry has a non-null `parentVersionId` pointing at a prior entry in the log. The chain is a tree (multiple draft branches allowed) but never a cycle. |
| `sourceSlice` provenance is canonical | `sourceSlice` is one of `SOL11`, `SOL12`, `SOL13`. No invented source slice. |
| Canvas chip "version N · created from X" surfaces | The canvas shell (SOL10) renders a per-section version chip reading `version N · created from <sourceSlice>` based on the latest entry covering that section. The chip is read-only and disabled. |
| No persistence | The versioning layer is a view over the deterministic seed; nothing is written to disk, supabase, or any external store. The module imports nothing from `supabase`, `fs`, `path`, or model SDKs. |
| `createdFrom` constant | The module exports `CREATED_FROM_DETERMINISTIC_SOLUTION_VERSIONING_SEED = 'deterministic_solution_versioning_seed'` for provenance. |

Stop if: any entry is mutated; the chain has a cycle; a non-canonical
`kind` slips in; the layer writes to any external store; any module
import drifts off the deterministic seed.

---

## §I · How to verify MW7 outputs (Workshop Deliverable Refinement Loop)

MW7 is a **wiring** slice. It lives in
`src/lib/programs/workshop-deliverable-refinement-loop.ts` with
contract tests at
`src/__tests__/integration/programs/workshop-deliverable-refinement-loop.test.ts`
and a slice doc at
[`docs/build/slices/MW7_WORKSHOP_DELIVERABLE_REFINEMENT_LOOP.md`](./slices/MW7_WORKSHOP_DELIVERABLE_REFINEMENT_LOOP.md).

| Check | Expected |
|---|---|
| Stub → Outline → Rich progression | Each refinement pass advances the deliverable through exactly three deterministic stages: `stub` (placeholder content with named sections), `outline` (one-line summaries per section), `rich` (full body per section). The progression is monotonic; a `rich` deliverable is never demoted. |
| MW2 readiness consumed | The loop reads MW2 workshop readiness records and uses `requiredAttendees` / `evidenceToCapture` / `gateImplication` as inputs. No MW2 field is invented. |
| MW4 notes consumed | The loop reads MW4 meeting-notes records (typed / pasted / uploaded). It does NOT read audio. The `notesIngestionMode` is one of `typed`, `pasted`, `uploaded`; never `audio`. |
| MW6 SME recommendations consumed | The loop reads MW6 SME recommendations and surfaces them as `optionalSmes` on the refined deliverable; never as auto-assigned attendees. |
| SOL12 invocation is deterministic | The loop calls `refineDraftFromWorkshopNotes` (SOL12) and re-renders via SOL13. The same inputs yield byte-equal outputs across runs. |
| Audit-ledger emission named | The contract names that each refinement loop pass emits one canonical AUD2 audit event with `eventType: 'deliverable_refinement_pass'`, `actor`, `traceId`, `tenantKey`, `workObject`, and `createdFrom: 'mw7_workshop_refinement_loop'`. The actual audit-ledger persistence is **deferred** (production audit ledger is not live today). |
| `createdFrom` provenance | Every refined deliverable carries `createdFrom: 'mw7_workshop_refinement_loop'` and a `basedOn: { sol11DraftId, sol12RefinementId, sol13RenderId, mw2ReadinessId, mw4NotesId, mw6SmeRecommendationId }` provenance set. |
| Live LLM is deferred | The loop contains no `anthropic` / `openai` / `cohere` import and no `fetch` to a model gateway. Live LLM-assisted refinement is **deferred** and must read as deferred wherever the loop is surfaced. |

Stop if: the progression is non-monotonic; audio ingestion appears;
the loop overwrites the base draft (refinement must call SOL12, not
re-implement merge); any model SDK import slips in; provenance is
missing.

---

## §J · Route check (when SOL10 is wired into a route)

When the SOL10 canvas is mounted at a public route, walk the
following on a canonical demo tenant (default: `apex-retail`).

| Step | Where | Expected |
|---|---|---|
| 1. Open Solutions index | `/tenant/apex-retail/solutions` | Index renders with the tenant's canonical archetype shortlist (from SOL9 recommendation engine). Each archetype card carries an honest source caption. No fabricated dollar amounts. |
| 2. Click into one archetype | `/tenant/apex-retail/solutions/<archetypeKey>` | Solution Canvas Shell loads. Twelve SOL8 sections render in canonical order. Builder (Nexus) chip on the left; Reviewer (Sentinel) chip on the right; both `disabled`. Mode-swap fade is 120ms opacity only. |
| 3. Inspect Components section | Components section of the canvas | Components list cites canonical SOL2 / SOL4 / SOL5 keys only. No invented component. Each component carries a source caption. |
| 4. Inspect Build / Buy / Partner section | Build / Buy / Partner section | Verdict matches the SOL6 evaluator output for the same archetype + current-state inputs. Vendor / startup factors render as neutral capability shapes, never as endorsements. Governance warnings populate only when the archetype is regulated or carries a high-risk tag. |
| 5. Inspect Workshops section | Workshops section | Pre-workshop briefs render objective + required attendees (including `client_maestro`) + agenda + questions + evidence-to-capture. Source caption names `deterministic_program_seed`. |
| 6. Inspect Deliverables section | Deliverables section | SOL13 deliverables render with file-type chips (DOC / PDF / XLS / PPT / NOTE / HTML / DATA). Every download button is `disabled` with sub-label `deferred · export pipeline`. `renderableInCanvas` is true only for `html_render` / `markdown_render` / `note_list`. |
| 7. Inspect Versioning chips | Each section | Per-section "version N · created from <sourceSlice>" chips render. Chips are read-only / disabled. |
| 8. Inspect Confidence section | Confidence section | Confidence reads `low` or `medium` from seed alone. `high` appears only if the canvas was opened against a workshop-merged draft (SOL12 / MW7 path). |
| 9. Empty / unknown tenant | `/tenant/unknown/solutions` | Renders explicit "no solution canvas today" copy that names the absence and the deterministic basis. No blank screen. |
| 10. Drawer single-instance | Open one Ask-agent drawer; try to open a second | Only one drawer instance opens at a time per SOL8 §F.4. The second click closes the first or no-ops. |

Stop if any step shows: a `high` confidence claim from seed only;
a fabricated dollar amount; an enabled Ask-agent chip; a "live
retrieval" or "live runtime" claim; a real `E-###` evidence
citation; a silently absent surface; a mode-swap animation that
exceeds 120ms or uses a non-opacity transform.

---

## §K · No-fabrication audits

Walk every surface in §J and assert each line below explicitly.

| Check | Expected |
|---|---|
| No `\$\s?\d` (dollar amount) on any seed-driven surface | No string field on Solutions / Canvas / Workshops / Deliverables surfaces contains `$` followed by a number. SOL11 / SOL12 / SOL13 / SOL14 / MW7 all decline to invent dollar impact. |
| No real `E-\d{3,}` evidence citation rendered today | Every surface that mentions evidence reads "Evidence citations are not yet wired" verbatim. No real `E-###` is rendered. |
| No "live retrieval" / "live runtime" / "live model" claim | Every source label is one of `deterministic_seed`, `deterministic_archetype_seed`, `deterministic_workshop_seed`, `deterministic_pattern_seed`, `deterministic_component_seed`, `deterministic_solution_architecture_draft_seed`, `deterministic_workshop_refinement_seed`, `deterministic_solution_deliverable_seed`, `deterministic_solution_versioning_seed`, `mw7_workshop_refinement_loop`, or a `*_read_model` marker. No surface implies live Claude / OpenAI / Pinecone retrieval. |
| All "Ask <agent>" chips render disabled | Every Ask-Atlas / Ask-Sentinel / Ask-Steward / Ask-Nexus chip carries `disabled` + `aria-disabled="true"` + sub-label `deferred · live <agent> runtime`. |
| All download buttons render disabled | Every download / export button carries `disabled` + sub-label `deferred · export pipeline`. |
| No vendor endorsement | No surface names a vendor (Snowflake / Databricks / Vertex / Bedrock / Azure OpenAI / Anthropic / OpenAI / Cohere) as an endorsement. Vendor names appear only as neutral capability shapes inside the Build / Buy / Partner verdict body, never as "we recommend X". |
| Empty states render explicit "honest empty" copy | Tenants / archetypes / sections with no records render explicit "no items today" copy that names the absence and the deterministic basis; no blank screens. |
| No `Date.now` / `Math.random` / `new Date(...)` in any read model | All five read-model modules (SOL11, SOL12, SOL13, SOL14, MW7) are byte-equal across runs; a sha256 round-trip on the JSON projection is identical. |

Stop if any fabrication slips through. The platform's defensibility
depends on it.

---

## §L · Design canon checks

Walk the canvas surface and assert the AbarVa visual canon. Refer to
[`DES1_ABARVA_VISUAL_CANON.md`](./slices/DES1_ABARVA_VISUAL_CANON.md)
for the source of truth.

| Check | Expected |
|---|---|
| Background is `#F8F7F4` | Canvas background is the canon off-white `#F8F7F4`. No `#FFFFFF`, no `#FAFAFA`. |
| Headlines render in Georgia (normal weight) | Section headlines use `font-family: Georgia, serif; font-weight: normal`. No bold weights on headlines. |
| Body copy renders in DM Sans | Body / paragraph text uses `font-family: 'DM Sans', sans-serif`. |
| Buttons are black or ghost | Primary buttons are filled black; secondary buttons are ghost (transparent border, dark text). No accent fills outside the canon. |
| Theme imports only — no local hex | Every component imports `COLORS`, `FONT`, `BORDER`, `RADIUS`, `SPACING`, `TYPE` from `@/lib/design/abarva-theme`. No local hex literal regex match. No `const COLORS = {...}` redefined locally. |
| Density is Snowflake / Datadog tier | Section grids use 8 / 12 / 16-column layouts with tight gutters; no airy whitespace tracts. The canvas is denser than the marketing-home page. |
| Animation budget is 120ms opacity | Mode swaps and drawer opens use a 120ms opacity fade only. No spring, no slide, no transform. |

Stop if: a non-canon color appears; a headline is bold; the canvas
is sparser than marketing; any animation exceeds 120ms or uses a
non-opacity transform.

---

## §M · Production readiness checks

Confirm the manifest UNION-update is conservative and append-only.

| Check | Expected |
|---|---|
| `validation_qa.status` is preserved | The `validation_qa` component status remains `tested`. QA14 does NOT promote. |
| `validation_qa.notes` UNION-appends a single QA14 row | The notes array has one new entry naming QA14 as the founder-facing runbook for SOL10 / SOL11 / SOL12 / SOL13 / SOL14 / MW7; no prior note is overwritten or reordered. |
| `validation_qa.nextAction` UNION-appends a short sentence | The nextAction string ends with a sentence acknowledging that the QA14 runbook lands and that execution remains deferred (no browser, no automation, no persona crawler integration). Prior wording is preserved verbatim. |
| `lastUpdated` set to `2026-04-26` | Manifest top-level `lastUpdated` is `2026-04-26`. |
| No other component is promoted | `overallStatus`, `overallReadinessPercent`, and component statuses are unchanged. The `qa-ci-gates` blocker (if present) is preserved verbatim. |
| `solution_intelligence` is not promoted from QA14 | QA14 is a docs-only runbook; the SOL10–SOL14 / MW7 components remain at their current status (typically `not_started` until each implementation slice lands). |

Stop if: any component status is promoted; any blocker is removed;
any nextAction wording is overwritten rather than UNIONed.

---

## §N · Cherry-pick canonical order

When integrating QA14 onto `main` alongside other Wave2 lanes, the
canonical cherry-pick order is:

1. **OPS5 / OPS6 / OPS7 / OPS8** — manifest helpers and worktree
   cleanup (operational hardening).
2. **PROD3 / PROD4 / PROD5** — production readiness signal /
   deployment status surface.
3. **SOL10** — Solution Canvas UI Shell (Server Component + view).
4. **SOL11** — Solution Architecture Draft Read Model (data the
   canvas renders).
5. **SOL12** — Workshop-to-Architecture Refinement (deterministic
   merge layer).
6. **SOL13** — Architecture Deliverable Renderer (OUT1 deliverable
   binding).
7. **SOL14** — Solution Canvas Versioning Layer (read-only audit
   over the deterministic seed).
8. **MW7** — Workshop Deliverable Refinement Loop (closes the
   workshop ↔ deliverable cycle).
9. **QA14** — this runbook (lands last so it can reference all
   six artifacts above).

If any of SOL10 → MW7 are not yet `code_complete` at integration
time, QA14 still cherry-picks last. The runbook rows for absent
artifacts read as **deferred** until the corresponding implementation
slice lands.

When resolving cherry-pick conflicts on
`docs/build/build-slices.json` and
`docs/build/production-readiness.json`, follow OPS1 §G and §H
verbatim:

- `build-slices.json` — append the QA14 entry only if the id is
  absent; never duplicate ids; preserve all other slices verbatim;
  bump top-level `lastUpdated` to the integration date.
- `production-readiness.json` — UNION the validation_qa notes by
  string equality; preserve every prior note verbatim; conservatively
  append the QA14 nextAction sentence without overwriting prior
  QA1–QA13 / PROD1–PROD5 / OPS1–OPS8 / WAVE1 wording; preserve
  every component status verbatim.

If `scripts/integration/cherry_resolve.py` (OPS5) is available, run
it with `--dry-run` first; it implements the conflict policy
deterministically.

---

## §O · Morning review decision

After the live walk, decide for each slice / batch branch:

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass and the slice reflects intent. | Leave the branch as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (copy, spacing, an extra honest caption). | Amend on the same branch; re-run §C validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends). Document the reason. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch. | `git cherry-pick <sha>` onto the target branch using §N order. Re-run §C validation. |
| **push / PR** | Slice is `keep`-ready and founder is signed off. | `git push origin <branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria are explicitly verified. Default is to **wait** rather than push from an unsupervised batch. |

**Default for unsupervised overnight runs:** do not push, do not
merge, do not open PRs. Local commits only. Push only with
**explicit founder go-ahead** in the morning. The morning review
chooses one of the five outcomes above per branch.

---

## §P · Branch / worktree hygiene appendix

When running multi-lane batches via `git worktree`:

- One worktree per slice. The QA14 worktree is
  `/Users/anand/Projects/nexus-wave2-qa14` on branch
  `wave2/qa14-solution-workshop-verification`.
- Symlinking `node_modules` into a worktree breaks Next.js Turbopack;
  run `npm install --prefer-offline` per worktree instead.
- Each worktree's `.next/` is independent; clearing it can be needed
  when the route table changes (e.g., a route directory is removed
  or renamed) — the well-known symlink panic is acceptable to
  mitigate this way.
- Never run `git add .` in a worktree. Stage only the slice's
  declared allowed files (this slice's allowed files are listed in
  the QA14 build-slices entry).
- Before commit: `git diff --cached --name-only`. Confirm only
  allowed files are staged. Unstage anything else with
  `git restore --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision.
- When the integration agent picks QA14 up for cherry-pick onto
  `main`, run `scripts/integration/check_duplicate_slices.py` (OPS6)
  first to confirm QA14 is not already in the manifest under a
  different commit.
