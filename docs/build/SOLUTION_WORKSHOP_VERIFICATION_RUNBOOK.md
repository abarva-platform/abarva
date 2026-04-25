# Solution / Workshop Verification Runbook

Slice ID: QA2
Slice name: Solution / Workshop Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-25
Author: Code (sole)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
**solution** and **workshop** spine — Solution Architecture
Composition (SOL1), AI-led PDLC Component Pack (SOL2), Workshop
Readiness Read Model (MW2), and Phase Workspace Contract (PF2) —
land **honestly** before push or PR. It is the companion to the
existing QA1 runbook at
[`docs/build/AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md).

QA1 covers the **agentic spine** (Programs ↔ Tower ↔ Intelligence ↔
Admin, mediated by Nexus / Sentinel / Atlas / Steward). QA2 extends
the verification surface to the **solution composition** and
**workshop / phase** layer — i.e., what the platform produces
**inside** a phase of work for an active program.

The runbook is meant to be **walked manually** in a browser after the
relevant slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Use one section per verification target. Each row has a single
expected outcome; do not skip rows.

---

## 1. Purpose and scope

QA2 verifies four canonical artifacts that together describe how the
platform produces **honest, deterministic, founder-safe** solution
and workshop output today:

- **SOL1 — Solution Architecture Composition Contract.** Defines how
  Nexus assembles a Solution Architecture for a specific client
  context from canonical Patterns, current-state inputs, and the AI-
  led PDLC component pack. Names the 12-category Solution Context
  Bundle, the 7-step composition flow, the three composition styles,
  the four agent roles, the missing-input behavior, and the six
  deliverable outputs.
- **SOL2 — AI-led PDLC Component Pack.** Defines the 14 canonical
  components of the AI-led product / program development lifecycle;
  each component carries definitionally complete fields, maps to PF1
  failure modes and I1 patterns, and is recommended deterministically
  from current-state inputs.
- **MW2 — Workshop Readiness Read Model.** Defines, per active
  program, the next recommended workshop with required attendees,
  agenda, evidence-to-capture, and gate implication. All deterministic
  from seed; no fabricated notes or decisions.
- **PF2 — Phase Workspace Contract.** Defines the center-canvas phase
  workspace experience: layout invariants, six phase modes, lifecycle
  (save / stop / resume), meeting notes ingestion (typed / pasted /
  uploaded — no audio), dynamic deliverables by phase via PDEL,
  evidence / value / gate integration, and interaction model.

Out of scope for QA2: live retrieval, live model calls, audio
ingestion, exporter / download pipelines, real evidence citations,
real run-time agent runtimes. All of those are deferred and must
read as deferred on every surface today.

---

## 2. Branch hygiene checklist

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope; no surprise commits. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / runtime / migration files. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase files. |

**Stop and investigate** if any check fails. Do not push or demo
from a working tree with unexplained modifications.

---

## 3. Required validation commands

Run from the repo root in order. Each must pass before the live walk.

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. |
| Intelligence · failure modes (PF1) | `npx jest src/__tests__/integration/intelligence/ai-program-failure-modes.test.ts` | All green. |
| Solutions · AI-led PDLC component pack (SOL2) | `npx jest src/__tests__/integration/solutions/ai-led-pdlc-components.test.ts` | All green. |
| Programs · workshop readiness (MW2) | `npx jest src/__tests__/integration/programs/workshop-readiness.test.ts` | All green. |
| Programs · artifact inventory (PDEL) | `npx jest src/__tests__/integration/programs/program-artifact-inventory.test.ts` | All green. |
| Admin · dataset domain inventory (ADM3) | `npx jest src/__tests__/integration/admin/dataset-domain-inventory.test.ts` | All green. |
| Admin · dataset explorer panel (ADM4) | `npx jest src/__tests__/integration/admin/dataset-explorer-panel.test.ts` | All green. |
| Admin · steward setup control center (ADM2) | `npx jest src/__tests__/integration/admin/steward-setup-control-center.test.ts` | All green. |
| Auth · tenant isolation (S7) | `npx jest src/lib/auth/__tests__/tenant-isolation-probes.test.ts` | All green. |

If any command fails, **stop and decide**: amend the slice, discard,
or capture the failure in a tracked issue before proceeding to the
live walk.

---

## 4. How to verify SOL1 outputs (Solution Architecture Composition Contract)

SOL1 is a **specification** slice. It establishes the canonical
shape of a Solution Architecture and how Nexus composes one for a
specific client. Verification is by **reading** the contract and
asserting each row below.

| Check | Expected |
|---|---|
| Pattern ≠ Solution Architecture distinction | The contract names that a **Pattern** (I1 canon) is a generic, reusable building block; a **Solution Architecture** is a client-specific composition that may apply many patterns plus client context. The two are never collapsed. |
| Solution Context Bundle has 12 categories | Bundle exposes: client context, current-state, tech stack, DORA / delivery posture, persona, AI adoption posture, security / compliance posture, target outcomes, applicable patterns, workshop findings, existing deliverables, missing inputs. All 12 are named. |
| 7-step composition flow named | Steps named in order: (1) collect bundle inputs, (2) score applicable patterns, (3) recommend AI-led PDLC components, (4) compose architecture skeleton, (5) flag missing inputs, (6) cap confidence, (7) produce deliverable outputs. |
| Three composition styles named | `pattern_driven` (compose from canonical patterns), `llm_composed` (deferred — placeholder for future live composition), `sme_validated` (Maestro / SME hand-tuned). All three named explicitly. |
| Four agent roles named | Nexus (program mastermind, composes), Sentinel (detects pattern fit / failure modes), Steward (governs missing inputs / gate readiness), Atlas (executive summarisation). |
| Missing-input behavior surfaces honestly | Contract states that missing inputs are surfaced **explicitly** in the bundle, cap confidence to `medium` or below, and never auto-fabricate values. |
| Six deliverable outputs named | Solution context bundle, applicable-patterns shortlist, AI-led PDLC component recommendation, architecture skeleton, missing-inputs list, confidence + source captions. |
| Future slices listed | SOL2 → SOL6 named with one-line scope each (SOL2 = AI-led PDLC component pack — done; SOL3 = applicable-pattern scorer; SOL4 = architecture skeleton renderer; SOL5 = missing-input surface; SOL6 = SME-validation loop). |

Stop if: pattern and solution architecture are conflated; bundle has
fewer than 12 categories; composition flow is fewer than 7 steps;
contract claims live composition runtime today; deliverables list
missing inputs as anything other than explicit and honest.

---

## 5. How to verify SOL2 outputs (AI-led PDLC Component Pack)

SOL2 is a **read-model** slice. The pack lives in
`src/lib/solutions/ai-led-pdlc-components.ts` (or equivalent) with
contract tests at `src/__tests__/integration/solutions/ai-led-pdlc-components.test.ts`.

| Check | Expected |
|---|---|
| 14 components present in canonical order | The pack exports exactly 14 components in deterministic canonical order. The order is stable across reads and across recommendation calls. |
| Each component has all required fields | For every component, all of: `definition`, `problemSolved`, `requiredCurrentStateInputs`, `requiredMetrics`, `targetCapabilities`, `enablingTools`, `governanceRequirements`, `implementationSteps`, `expectedOutcomes`, `risks`, `relatedFailureModes`, `relatedPatterns`, `requiredWorkshops`, `deliverablesProduced`, `createdFrom` are non-empty (or honestly empty arrays where appropriate, e.g., a component with no related pattern). |
| `relatedFailureModes` maps to canonical PF1 keys | Every key in `relatedFailureModes` resolves to a canonical PF1 failure-mode key. No invented keys. |
| `relatedPatterns` maps to canonical I1 keys | Every key in `relatedPatterns` resolves to a canonical I1 pattern key. No invented keys. |
| No invented dollars | No string field on any component contains a `$` followed by a number. Risks, expected outcomes, and problem-solved descriptions decline to invent dollar impact. |
| `recommendPdlcComponentsFromInputs` is deterministic and canonical-order | The recommender returns the same components in the same order for the same inputs. Output preserves the canonical pack order, not insertion order from input. |
| Module hygiene | Pack and recommender import nothing from Sentinel / Atlas / Nexus / Agent runtime, Source UI, legacy `/programs`, `mock.ts`, auth, supabase, or model SDKs. |

Stop if: component count ≠ 14; any required field is missing; a
related-failure-mode or related-pattern key is invented; the
recommender output order is non-deterministic; any field invents a
dollar amount.

---

## 6. How to verify MW2 outputs (Workshop Readiness Read Model)

MW2 is a **read-model** slice. It lives in
`src/lib/programs/workshop-readiness.ts` (or equivalent) with
contract tests at
`src/__tests__/integration/programs/workshop-readiness.test.ts`.

| Check | Expected |
|---|---|
| Every active program has ≥ 1 workshop readiness record | The read model returns at least one workshop-readiness record per active canonical program (Apex Retail's four programs at minimum). No active program returns an empty array silently. |
| `buildNextRecommendedWorkshop` returns non-null per program | For every active program, the recommender returns a non-null `NextRecommendedWorkshop` with a populated objective and agenda. |
| `requiredAttendees` always includes `client_maestro` | Every workshop record's `requiredAttendees` array includes the `client_maestro` role. The Maestro is never optional — they lead the engagement. |
| Every workshop has evidence-to-capture, expected outputs, questions to ask | `evidenceToCapture`, `expectedOutputs`, and `questionsToAsk` are all non-empty arrays for every record. |
| All records tagged `createdFrom: 'deterministic_program_seed'` | Every record's `createdFrom` is exactly `'deterministic_program_seed'`. No record claims to be sourced from a live transcript, a live agent, or a real meeting. |
| No fake notes / fake decisions | No record carries fabricated meeting notes, decisions, or attendee quotes. The during/after-workshop capture types are present as **schema** only; today's read model returns honest empty arrays for those fields. |
| Summary counts reconcile | A summary helper (e.g., `summarizeWorkshopReadiness`) returns counts that match the underlying records: total workshops = sum of per-program workshops; per-status counts sum to total. |

Stop if: any active program has zero workshops; `client_maestro` is
absent from any required-attendees list; a record claims a real
transcript or live decision; counts don't reconcile.

---

## 7. How to verify PF2 outputs (Phase Workspace Contract)

PF2 is a **specification** slice. Verification is by reading the
contract document and asserting each row below.

| Check | Expected |
|---|---|
| Center-canvas layout described | Contract names: left rail ≤ 220px (program nav + phase strip), center ≈ 70% (phase canvas), right rail ≤ 320px (Steward gate readiness · evidence · agent handoffs), drawer (Ask Atlas / Ask Nexus / Ask Sentinel / Ask Steward — disabled today). |
| Six phase modes named | `overview` · `preparation` · `live` · `synthesis` · `refinement` · `gate_readiness`. All six are named. Mode is a view-state inside the phase, not a navigation event. |
| Save / stop / resume lifecycle described | Contract names that a phase session can be saved (current state durable), stopped (closed without losing state), and resumed (re-entered at the saved mode). Audit-row emission per lifecycle event is named. |
| Meeting notes ingestion: typed / pasted / uploaded; no audio; deterministic extractors | Contract names that v1 supports typed, pasted, and uploaded text (paste box, upload of `.txt` / `.md` / `.docx` deferred to a parser slice). **Audio and real-time transcription are out of scope** for v1. Extractors that surface candidate decisions / risks / objections are deterministic regex / pattern based; live model extraction is deferred. |
| Dynamic deliverables by phase via PDEL | Contract names that the deliverables grid in each phase reads from the PDEL inventory, filtered by the phase's `phaseKey`. No deliverable is hard-coded into a phase view. |
| Evidence / value / gate integration | Right rail shows: evidence readiness for the phase's contributing artifacts, value readiness against the phase's contributing G3 / G4 inputs, and Steward gate readiness implied by the next gate. |
| Interaction model: mode switches do not navigate; drawer single-instance; 120ms fade only | Contract names that switching modes is a **view-state change** (no route navigation, no scroll-jump). The drawer is single-instance (only one Ask-agent drawer open at a time). The only animation is a 120ms opacity fade on mode swap; no slide / no spring. |

Stop if: layout omits the right rail or the drawer; modes are fewer
than six; lifecycle omits audit-row emission; v1 claims to ingest
audio; phase view hard-codes deliverables; drawer claims a live
agent runtime today; animation budget exceeds 120ms or uses
non-opacity transforms.

---

## 8. AI-led PDLC scenario · live-walk

Start the dev server (`npm run dev`) and walk this scenario as a
Maestro on a canonical demo tenant (default: `apex-retail`).

| Step | Where | Expected |
|---|---|---|
| 1. Open Programs index | `/tenant/apex-retail/programs` | Index renders with Apex Retail's canonical programs (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting). Each card carries an honest source caption. |
| 2. Click into an Apex Retail program | `/tenant/apex-retail/programs/<programSlug>` | Program detail loads. Nexus rail mounts. Six-phase journey rail renders with the current phase highlighted. |
| 3. Inspect six-phase journey rail | Phase strip on detail page | Phases 1 → 6 render in canonical order (Origination → Verify). Current phase is visually distinguished. Each phase chip names its canonical phase title. |
| 4. Click into the active phase → see deliverables grid | Phase canvas | Active phase opens. Deliverables grid renders the PDEL inventory filtered by this phase's `phaseKey`. File-type chips (DOC / PDF / XLS / PPT / NOTE / HTML / DATA) render. |
| 5. Open MW2 pre-workshop brief (when wired) | Phase canvas — preparation mode, or right rail Workshop card | Pre-workshop brief renders objective + required attendees (including `client_maestro`) + agenda + questions to ask + evidence to capture. Source caption names `deterministic_program_seed`. If the brief surface is not yet wired into UI, this row is **deferred** and must read as deferred on the page (not silently absent). |
| 6. Inspect Steward gate readiness in right rail | Right rail | Steward gate readiness panel names the next canonical hard gate (G1–G4) and lists missing inputs **honestly**. No fabricated readiness. Confidence chip never claims `high` from seed alone. |
| 7. Open one I1 pattern detail | `/tenant/apex-retail/intelligence/patterns/<patternKey>` (e.g., `value_ledger_incompleteness`) | Pattern detail loads. Authored content panel renders with `source · deterministic seed` chip, "Evidence citations are not yet wired" caption, and disabled Ask-Sentinel chips. |
| 8. Open Atlas Tower brief | `/tenant/apex-retail/tower` | Programs pressure section renders three pressure cards. Atlas Executive Brief renders title, top pressure, why it matters, programs affected, recommended action. Three disabled Ask-Atlas chips visible. Footer names deterministic source. |

Stop if any step shows: a `high` confidence claim from seed only; a
fabricated dollar amount; an enabled Ask-agent chip; a "live
retrieval" or "live runtime" claim; a real `E-###` evidence
citation; a silently absent surface.

---

## 9. Questions to ask Nexus / Client Maestro during the walk

Treat the walk as a real engagement. For each program, **ask** the
following questions out loud and confirm the surface answers
honestly. Nexus / Sentinel / Steward / Atlas chips are disabled
today, so the **answer must come from the canonical surface** (the
phase canvas, the right rail, the workshop brief, the gate
readiness panel, the pattern detail, the Atlas brief). Any chip
that promises an answer must read as **deferred** today.

| Question | Where the honest answer lives today |
|---|---|
| "What is the program's current canonical phase?" | Six-phase journey rail on program detail; the highlighted phase chip names it. |
| "What is missing to advance the next gate?" | Steward gate-readiness panel in the right rail; missing-inputs list. |
| "Which AI-led PDLC component is the highest leverage next step?" | SOL2 recommender output (when wired into a phase view); otherwise the SOL2 pack itself in source. |
| "What workshop should we run next, and who must attend?" | MW2 `buildNextRecommendedWorkshop` — pre-workshop brief surface (when wired); otherwise the read-model output. |
| "What evidence is captured today vs missing?" | Evidence readiness state on the program detail (`not_seeded` / `partial` / `ready`); right rail evidence panel. |
| "What does Sentinel detect that we should address before the next steering touchpoint?" | Sentinel Brief on `/tenant/<tenant>/intelligence`; Active Patterns grid; per-program affected list. |

Stop if: any question's honest answer is fabricated, claims live
runtime, or routes to an enabled Ask-agent chip that promises an
answer the platform cannot deliver today.

---

## 10. No-fabrication checks

Walk every surface in §8 and assert each line below explicitly.

| Check | Expected |
|---|---|
| No `$\s?\d` (dollar amount) on any seed-driven surface | No string field on Programs / Tower / Intelligence / Admin / phase canvas / workshop brief / pattern detail / SOL2 component contains `$` followed by a number. Atlas / Sentinel / Steward / Nexus all decline to invent dollar impact. |
| No real `E-###` evidence citation rendered today | Pattern detail reads "Evidence citations are not yet wired for this deterministic pattern view." No surface displays a real `E-###` citation. |
| No "live retrieval" / "live runtime" claim in any source label | Every source label is one of `deterministic_seed`, `deterministic_program_seed`, `*_read_model`, or an equivalent honest deterministic marker. No surface implies live Claude / OpenAI / Pinecone retrieval. |
| All "Ask <agent>" chips render disabled with sub-label `deferred · live <agent> runtime` | Every Ask-Atlas / Ask-Sentinel / Ask-Steward / Ask-Nexus chip carries `disabled` + `aria-disabled="true"` + sub-label `deferred · live <agent> runtime`. |
| Empty states render explicit "honest empty" copy that names the absence | Tenants / programs / phases / inventories with no records render explicit "no items today" copy that names the absence and the deterministic basis; no blank screens. |

Stop if any fabrication slips through. The platform's defensibility
depends on it.

---

## 11. Solution context bundle checks

Walk the SOL1 bundle output (when surfaced) or read the bundle
contract directly. Assert:

| Check | Expected |
|---|---|
| Bundle exposes the 12 SOL1 categories | All 12 categories named in §4 are present and addressable: client context, current-state, tech stack, DORA / delivery posture, persona, AI adoption posture, security / compliance posture, target outcomes, applicable patterns, workshop findings, existing deliverables, missing inputs. |
| Missing-inputs list is explicit and sorted | Missing inputs are surfaced as a first-class field on the bundle. The list is sorted (e.g., by canonical category order or severity), not random. |
| Confidence cap at `medium` from seed alone | Bundle confidence is at most `medium` when sourced only from deterministic seed. `high` is reserved for SME-validated bundles. |
| Source label is `deterministic_seed` or a `*_read_model` marker | Bundle's source caption is one of `deterministic_seed`, `deterministic_program_seed`, or a `*_read_model` marker. No bundle claims live retrieval. |

Stop if: bundle has fewer than 12 categories; missing-inputs list is
absent or unsorted; confidence claims `high` from seed alone; source
label implies live retrieval.

---

## 12. Workshop readiness checks

Walk the MW2 read model output (when surfaced) or run the contract
test. Assert:

| Check | Expected |
|---|---|
| Every workshop record has the canonical type from MW2 | Each record's `workshopType` resolves to a canonical MW2 workshop type (e.g., `executive_alignment`, `cxo_interview`, `current_state_walkthrough`, `value_target_workshop`, `solution_design_review`, `gate_readiness_review`). No invented types. |
| Required attendees + optional SMEs surfaced honestly | `requiredAttendees` always includes `client_maestro`. `optionalSmes` is a separate array; today's read model returns SME slugs as **recommendations**, not auto-assignments. |
| Evidence-to-capture list is non-empty | `evidenceToCapture` is a non-empty array per workshop. Each entry names a concrete artifact / observation type (not a free-text wish). |
| Steward gate implication is named per workshop | Each workshop record names the canonical hard gate it advances toward (one of G1 / G2 / G3 / G4). The Steward gate-readiness panel reads the same field. |

Stop if: a workshop type is invented; `client_maestro` is missing
from required attendees; `evidenceToCapture` is empty; gate
implication is missing or non-canonical.

---

## 13. Deliverable / artifact checks

Walk the PDEL inventory (program artifact inventory read model) on
each canonical program. Assert:

| Check | Expected |
|---|---|
| PDEL inventory renders deliverables grouped by phase | The inventory groups deliverables by canonical `phaseKey` (Phases 1 → 6). Every group renders in canonical phase order. |
| File chips render correctly | Each deliverable's `fileType` chip renders one of: DOC · PDF · XLS · PPT · NOTE · HTML · DATA. The chip color / glyph matches the type. |
| `renderableInCanvas: true` only for `html_render` / `markdown_render` / `note_list` | A deliverable is marked renderable in the phase canvas only when its `renderingMode` is one of `html_render`, `markdown_render`, or `note_list`. Other modes route to download (deferred) or the file viewer drawer. |
| `downloadable: false` everywhere today | Every deliverable carries `downloadable: false` today. The export pipeline is deferred. The download button (when rendered) is disabled with sub-label `deferred · export pipeline`. |

Stop if: deliverables are not grouped by phase; a file chip is
missing or wrong; a non-renderable deliverable is marked
`renderableInCanvas: true`; any deliverable is marked
`downloadable: true` today.

---

## 14. Morning review decision

After the live walk, decide for each slice / batch branch:

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass and the slice reflects intent. | Leave the branch as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (copy, spacing, an extra honest caption). | Amend on the same branch; re-run §3 validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends). Document the reason. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch. | `git cherry-pick <sha>` onto the target branch. Re-run §3 validation. |
| **push / PR** | Slice is `keep`-ready and founder is signed off. | `git push origin <branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria are explicitly verified. Default is to **wait** rather than push from an unsupervised batch. |

**Default for unsupervised overnight runs**: do not push, do not
merge, do not open PRs. Local commits only. Push only with
**explicit founder go-ahead** in the morning. The morning review
chooses one of the five outcomes above per branch.

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
  allowed files are staged. Unstage anything else with `git restore
  --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision.
