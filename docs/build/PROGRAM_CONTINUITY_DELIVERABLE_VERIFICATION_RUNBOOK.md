# Program Continuity / Deliverable Verification Runbook

Slice ID: QA7
Slice name: Program Continuity + Deliverable Verification Runbook
Status: code_complete (pending founder review for `verified`)
Authored: 2026-04-26
Author: Lane H (parallel build pack — overnight batch)
Type: Documentation only — no application code, no runtime
modification, no migrations, no model calls.

This runbook is the founder-facing checklist for verifying that the
**program continuity** and **deliverable** surfaces — the workshop
mode shell (PW1), the deliverable artifact canvas renderer (PDEL5),
the future meeting-notes update proposal pack (MW5), the future SME
recommendation pack (MW6), the future program resume-state pack
(PROG7), the future deliverable viewer (PDEL7), the future
deliverable version-state pack (PDEL6), and the future deliverable
evidence-trace pack (PDEL8) — land **honestly** before push or PR.
It is the seventh companion to:

- QA1 — [`AGENTIC_SPINE_VERIFICATION_RUNBOOK.md`](./AGENTIC_SPINE_VERIFICATION_RUNBOOK.md)
- QA2 — [`SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md`](./SOLUTION_WORKSHOP_VERIFICATION_RUNBOOK.md)
- QA3 — [`SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md`](./SOLUTION_INTELLIGENCE_VERIFICATION_RUNBOOK.md)
- QA4 — [`AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md`](./AGENT_MISSION_PERSONA_VERIFICATION_RUNBOOK.md)
- QA5 — `slices/QA5_ROUTE_SMOKE_HARNESS.md`
- QA6 — [`GOLDEN_PROMPT_HARNESS_CONTRACT.md`](./GOLDEN_PROMPT_HARNESS_CONTRACT.md)

The runbook is meant to be **walked manually** after the relevant
slice work has reached `code_complete`. It supports:

- Solo overnight founder review when batch slices land.
- Pre-PR sanity sweep before pushing to a remote.
- Pre-demo dry-run on a local dev server.

Each section has one expected outcome per row; do not skip rows.

---

## §A · Purpose and scope

QA7 verifies the **continuity contract** that a Maestro program
must hold across two cuts of the same render: workshop walks
(meeting notes feeding an update-proposal pack, SME recommendation
loop, save / resume state) and deliverable walks (artifact canvas,
deliverable viewer, version state, evidence trace). The continuity
contract is the founder-defensible promise that **what the user
sees on a return visit is the same shape, with deltas only where a
deterministic update was authored**, and that **every deliverable
the system shows is anchored in evidence the system can name and
trace**.

QA7 covers six concrete continuity surfaces and four deliverable
surfaces:

- **PW1 — Program Workshop Mode Shell.** The deterministic React
  shell that hosts the workshop walk for a program detail route.
  PW1 is a UI shell, not a state machine; it consumes the
  workshop-readiness read model (MW2) and the meeting-notes capture
  read model (MW4) without writing any persistence.
- **MW5 — Meeting Notes Update Proposals (deferred / conditional).**
  The deterministic projection that takes captured meeting-notes
  segments (MW4) and proposes typed updates to program state
  (phase progress, gate readiness, evidence ask). MW5 must be
  byte-equal across calls for the same input. **Verified only if
  installed** in the slice batch under review.
- **MW6 — SME Recommendations (deferred / conditional).** The
  deterministic projection of subject-matter-expert recommendations
  surfaced inline during a workshop walk. MW6 must reference named
  patterns / archetypes / data domains rather than freeform prose.
  **Verified only if installed.**
- **PROG7 — Program Resume State (deferred / conditional).** The
  deterministic resume-state projection that records the last
  acknowledged workshop walk position and surfaces it on the next
  visit. PROG7 is a read-only continuity contract; persistence is
  deferred. **Verified only if installed.**
- **PDEL5 — Deliverable Artifact Canvas Renderer.** The
  deterministic renderer for the deliverables-by-phase view on a
  program detail route. PDEL5 is the canvas shell, not the
  document body.
- **PDEL7 — Deliverable Viewer (deferred / conditional).** The
  deterministic single-deliverable view that renders a deliverable
  body (markdown / HTML / structured fields). PDEL7 is read-only;
  edit / regenerate / download / approve actions are explicitly
  disabled. **Verified only if installed.**
- **PDEL6 — Deliverable Version State (deferred / conditional).**
  The deterministic projection of named versions for a deliverable
  (e.g., `draft-1`, `reviewed`, `superseded`), surfaced as a
  version chip strip in the viewer. PDEL6 is the version label
  contract; version content authoring is deferred. **Verified only
  if installed.**
- **PDEL8 — Deliverable Evidence Trace (deferred / conditional).**
  The deterministic projection that lists, for the active
  deliverable, the named evidence references the deliverable
  rendered against. PDEL8 is the trace shape; live evidence
  citations remain deferred. **Verified only if installed.**

**In scope.** Walking the canonical Apex Retail programs index and
program detail routes; walking the platform admin
production-readiness route; reading the workshop mode shell, the
artifact canvas shell, and any deliverable viewer / version /
evidence-trace surface that has landed; asserting determinism,
honest disclaimers, and no fabrication; confirming the
production-readiness tracker reflects exactly the components QA7
touched and never silently promotes a component to
`production_ready`.

**Out of scope.** Live retrieval, live model calls, live deliverable
generation, real evidence ledger writes, browser automation,
persona crawler, security scan, deploy verification. Workshop
dynamics beyond the shell are covered by QA2. Solution intelligence
canvas walks are covered by QA3. Agentic spine deep walks of every
program / tower / intelligence / admin route are covered by QA1.
Mission queue / panel verification is covered by QA4. Route smoke
inventory is covered by QA5. Golden prompt harness contract / seed
is covered by QA6.

**Why this runbook exists separately.** Program continuity and
deliverable surfaces are the two surfaces where users most expect
durable state ("the deck I saw last time", "the recommendation the
agent made yesterday") and where the system most easily lies — by
showing fabricated approvals, fake dollar figures, fake citations,
fake version strings, or by claiming a download / regenerate /
approve action exists when it does not. QA7 walks every one of
those failure modes and refuses any wording that crosses the line.

---

## §B · Branch hygiene

Run from the repo root before any verification walk.

| Check | Command | Expected outcome |
|---|---|---|
| Current branch | `git branch --show-current` | Names the slice / batch branch you intend to verify (no detached HEAD). For QA7 worktree review the branch is `loop/qa7-program-continuity-verification`. |
| Working tree | `git status --short` | No unexpected modifications. Untracked founder / canon docs are allowed (they were never staged). |
| Branch position | `git status -sb` (header line) | Branch is ahead of `origin/<branch>` by the expected commit count; never behind without intent. |
| Ahead-of-main delta | `git log --oneline origin/main..HEAD` | Lists exactly the slices in scope (QA7 alone for this lane; PW1, MW5, MW6, PROG7, PDEL5, PDEL6, PDEL7, PDEL8 land in their own lane worktrees). |
| Last three commits | `git log --oneline -3` | Each commit message names a slice in scope (or QA7 itself); subjects are short and scoped. |
| Last commit scope | `git show --stat HEAD` | Touches only the slice's allowed files; no Source / migration / supabase files. |
| Pre-commit staged set was exact | `git diff --cached --name-only` immediately after the QA7 commit returns empty (because everything staged was committed). Re-staging the QA7 allowed files prints exactly four lines: `docs/build/PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md`, `docs/build/slices/QA7_PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION.md`, `docs/build/build-slices.json`, `docs/build/production-readiness.json`. | Means the staged set matched the slice's `allowedFiles`; nothing slipped in. |
| Untracked surprise check | `git ls-files --others --exclude-standard` | Only known founder / canon docs. No new src / supabase / migration files. |
| Worktree-per-slice rule | `git worktree list` | Each parallel lane lives in its own worktree (one worktree per slice = one branch = one local commit); the integration agent — not the lane agent — performs cherry-picks and merges. Lane agents commit only and never push, never merge, never open a PR. |

**Pass criterion for each row:** the actual output equals the
expected outcome verbatim, modulo whitespace. **Stop and investigate**
if any check fails. Do not push or demo from a working tree with
unexplained modifications.

---

## §C · Required validation commands

Run from the repo root in order. Each must pass before the per-slice
checklist walks. QA7 itself is documentation only; the per-slice
suites listed below are required for every continuity / deliverable
slice that lands in the same batch as QA7 (and are run only if the
named test file exists in the worktree under review — see §C.1 on
conditional execution).

| Step | Command | Pass criterion |
|---|---|---|
| TypeScript | `npx tsc --noEmit --pretty false` | Empty output (no errors). |
| Production build | `npm run build` | Completes; route table emitted; no compile errors. |
| Build-slice JSON validity | `node -e "JSON.parse(require('fs').readFileSync('docs/build/build-slices.json','utf8')); JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8')); console.log('json ok')"` | Prints `json ok`. |
| PW1 — workshop mode shell | `npx jest src/__tests__/integration/programs/program-workshop-mode-shell.test.ts` | All green (if PW1 has landed). |
| PDEL5 — artifact canvas renderer | `npx jest src/__tests__/integration/programs/deliverable-artifact-canvas.test.ts` | All green (if PDEL5 has landed). |
| MW4 — meeting notes capture | `npx jest src/__tests__/integration/programs/meeting-notes-capture.test.ts` | All green (if MW4 has landed). |
| MW5 — meeting-notes update proposals | `npx jest src/__tests__/integration/programs/meeting-notes-update-proposals.test.ts` | All green if MW5 has landed; otherwise skipped (conditional — see §C.1). |
| MW6 — SME recommendations | `npx jest src/__tests__/integration/programs/sme-recommendations.test.ts` | All green if MW6 has landed; otherwise skipped. |
| PROG7 — program resume state | `npx jest src/__tests__/integration/programs/program-resume-state.test.ts` | All green if PROG7 has landed; otherwise skipped. |
| PDEL6 — deliverable version state | `npx jest src/__tests__/integration/programs/deliverable-version-state.test.ts` | All green if PDEL6 has landed; otherwise skipped. |
| PDEL7 — deliverable viewer | `npx jest src/__tests__/integration/programs/deliverable-viewer.test.ts` | All green if PDEL7 has landed; otherwise skipped. |
| PDEL8 — deliverable evidence trace | `npx jest src/__tests__/integration/programs/deliverable-evidence-trace.test.ts` | All green if PDEL8 has landed; otherwise skipped. |
| PROD2 — readiness validator | `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` | All green. |
| PROD2 regression — readiness tracker | `npx jest src/__tests__/integration/admin/production-readiness-tracker.test.ts` | All green. (Confirms the validator's input schema still matches the tracker that produced it.) |

If any required command fails, **stop and decide**: amend the slice,
discard, or capture the failure in a tracked issue before
proceeding to the persona walks.

### §C.1 — Conditional jest paths

MW5, MW6, PROG7, PDEL6, PDEL7, and PDEL8 are documented as future /
deferred slices in the OPS1 dispatch queue. Any one of them may
land in a parallel lane without the others. Run each conditional
jest command **only if the matching test file exists**:

```
test -f <path> && npx jest <path>
```

Skip the row otherwise; record "not yet installed" in the morning
review note rather than failing the runbook.

### Why MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8 each get their own check

Each conditional slice is a load-bearing honesty contract for the
program-continuity story:

- **MW5** must produce **deterministic** update proposals: same
  inputs → same proposals; never a fabricated value (no `$<digit>`,
  no `E-\d+`, no live-monitoring claim).
- **MW6** must reference named SMEs / archetypes / patterns; it
  must never invent a vendor or a credential.
- **PROG7** must surface a resume hint that reflects **only**
  recorded position — it must never claim "you completed phase 3"
  when the underlying phase state says otherwise.
- **PDEL6** must label versions deterministically (`draft-1`,
  `reviewed`, `superseded`) and never invent a version that the
  fixture does not declare.
- **PDEL7** must render the deliverable body **read-only** — edit /
  regenerate / download / approve buttons exist only as **disabled**
  affordances with an honest tooltip ("download deferred until
  PDEL10").
- **PDEL8** must list named evidence references that the system
  can show (a row pointing at a real evidence-ledger entry); it
  must never invent an `E-\d+` token.

These suites are tiny by line count, but skipping them is the
fastest way to ship a continuity story that quietly implies live
behavior or fabricated state.

---

## §D · Persona walks

Each subsection lists the routes a persona walks and what they
should see. Where a downstream surface (MW5 / MW6 / PROG7 / PDEL6 /
PDEL7 / PDEL8) has not yet landed, the row is marked
**static-source assertion** — the founder reads the relevant
fixture or read-model export rather than the rendered surface.

### §D.1 — Founder / Platform Operator

Routes:

- `/platform/admin/production-readiness`

| Check | Where | Expected |
|---|---|---|
| Production-readiness tracker mounts | `/platform/admin/production-readiness` | Lists exactly **15 components** in canonical order; each row carries `status`, `dimensions`, `nextAction`, and `blockers` chips. |
| Maturity snapshot rendered | `/platform/admin/production-readiness` | Shows **3 indicators** (overall product maturity, demo / proof-of-concept maturity, production readiness) and **20 areas**. Each indicator's `percentLow` and `percentHigh` match the manifest. |
| `overallReadinessPercent` honest | `/platform/admin/production-readiness` | Header shows a value within **20–25** (matches the `production_readiness` indicator band). Never claims `>=50` or `production_ready` overall. |
| No false `production_ready` promotions | `/platform/admin/production-readiness` | No component card shows `production_ready`. The components QA7 touches (`programs`, `program_workshop_mode`, `deliverables_artifacts`, `data_evidence_knowledge_fabric`, `production_deployment`, `validation_qa`) keep their prior status; QA7 only updates notes / nextAction. |
| `validation_qa` notes reflect QA7 | `/platform/admin/production-readiness` | The `validation_qa` row's notes mention the QA7 runbook name and that it covers program continuity + deliverable verification. The `nextAction` is updated conservatively (UNION; never overwriting QA1–QA6 wording). |
| QA7 row visible in build-progress | `/platform/admin/build-progress` | A row for QA7 is present with status `code_complete` and the slice name "Program Continuity + Deliverable Verification Runbook". |

Stop if any of: a component shows `production_ready`; the maturity
snapshot is missing; QA7's edits to `validation_qa` overwrote QA1–
QA6 wording.

### §D.2 — Client Maestro · Programs index

Routes:

- `/tenant/apex-retail/programs`

| Check | Where | Expected |
|---|---|---|
| Programs index renders | `/tenant/apex-retail/programs` | Canonical 4-program seed for Apex Retail (Contact Center AI, CDP, Store Associate Productivity, Demand Forecasting) per the demo-seed anchor. |
| No fake counts | Anywhere on the index | No invented counts. Every numeric chip is either a phase index, a gate index, or an honest "not yet baselined" descriptor. |
| No fake approvals | Program cards | No card shows "Approved by <name>" with a fabricated approver. Every approval state ties back to the seed. |
| No fake dollars | Anywhere on the index | `$<digit>` substring search returns zero hits. |
| No fake timestamps | Anywhere on the index | No "Last updated 2 minutes ago" copy. Time copy uses explicit ISO date or honest descriptor ("not yet recorded"). |

Stop if any of: a fabricated approval / dollar / timestamp /
citation appears.

### §D.3 — Client Maestro · Program detail (continuity)

Routes:

- `/tenant/apex-retail/programs/[programSlug]` (e.g., the first program card)

| Check | Where | Expected |
|---|---|---|
| Workshop mode shell visible (PW1) | Detail body | The PW1 workshop mode shell mounts; phases 1–6 strip rendered; gate row G1–G4 visible. Disclaimer ("Workshop mode is a deterministic shell; runtime triggers deferred." or verbatim equivalent) is visible. |
| Workshop readiness chips honest (MW2) | Workshop shell header | Readiness state reads as `not_seeded` / `partial` / `ready` per the MW2 read model. No `high` confidence claim against partial seeds. |
| Meeting notes update proposals deterministic (MW5) — **if installed** | Workshop shell right column or update strip | MW5 surface (or static-source fallback) lists typed update proposals (`phase_progress`, `gate_readiness`, `evidence_ask`); same fixture → same proposals byte-equal across reloads. Each proposal names the source meeting-notes segment id; no fabricated dollar; no fabricated approval; no `E-\d+` token. |
| MW5 not installed — static-source fallback | If MW5 has not landed | Read the MW4 capture fixture and confirm the shape `{ id, segments: [{ id, text, speaker, capturedAtIsoDate? }] }` is honest (no fabricated speaker, no fabricated time, no `$<digit>`). Record "MW5 deferred" in the morning review note. |
| SME recommendations visible (MW6) — **if installed** | Inline recommendation row inside workshop shell | MW6 surface lists SME recommendations as `{ name, role, recommendsArchetype \| recommendsPattern \| recommendsDataDomain }`. Each row references a named archetype / pattern / domain that exists in the registry (no fabricated SME, no fabricated vendor). |
| MW6 not installed — static-source fallback | If MW6 has not landed | No invented SME chip is rendered; the workshop shell omits the SME row gracefully. Record "MW6 deferred" in the morning review note. |
| Resume state present (PROG7) — **if installed** | Workshop shell on a return visit | PROG7 surface (or static-source fallback) shows a resume hint naming the last acknowledged workshop walk position (e.g., "Resuming Phase 2 · CXO interview prep"). Same fixture → same hint byte-equal across reloads. The hint does not claim a phase advance that the program state does not record. |
| PROG7 not installed — static-source fallback | If PROG7 has not landed | The workshop shell does not show a resume hint, OR shows the static "no resume state recorded" copy. Record "PROG7 deferred" in the morning review note. |
| No fake decisions | Anywhere on detail | No "<decision> approved" copy with a fabricated approver. Every gate / decision row ties to the seed. |
| No fake timestamps | Anywhere on detail | `git grep -E '\b[0-9]+ (minute|hour)s? ago\b'` against the program detail surface returns zero hits in QA7-touched code. |

Stop if any of: MW5 shows non-deterministic output across reloads;
MW6 invents an SME; PROG7 claims a position the seed does not
record; a fake decision / timestamp / dollar / citation is present.

### §D.4 — Client Maestro · Program detail (deliverables)

Routes:

- `/tenant/apex-retail/programs/[programSlug]`

| Check | Where | Expected |
|---|---|---|
| Artifact canvas visible (PDEL5) | Detail body | The PDEL5 artifact canvas shell mounts; the deliverables-by-phase logic surfaces ≥1 artifact for the active phase; missing-input copy is honest where the seed is partial. |
| Deliverable viewer visible (PDEL7) — **if installed** | Click-through from a canvas row | PDEL7 surface (or static-source fallback) opens the deliverable body in a read-only viewer. The body renders deterministic content from the fixture; nothing fabricated. |
| PDEL7 not installed — static-source fallback | If PDEL7 has not landed | Canvas rows are present but a viewer is not yet wired. Record "PDEL7 deferred" in the morning review note. |
| Version state visible (PDEL6) — **if installed** | Viewer header chip strip | PDEL6 surface lists named versions (`draft-1`, `reviewed`, `superseded`) per the fixture; no invented version name. The active version is marked. Same fixture → same strip byte-equal across reloads. |
| PDEL6 not installed — static-source fallback | If PDEL6 has not landed | Viewer (if mounted) does not show a version strip, OR shows static "version state deferred" copy. Record "PDEL6 deferred" in the morning review note. |
| Evidence trace visible (PDEL8) — **if installed** | Viewer right column or footer | PDEL8 surface lists named evidence references for the active deliverable. Each row points at a real evidence-ledger entry id (no fabricated `E-\d+` token). The trace is sorted deterministically. |
| PDEL8 not installed — static-source fallback | If PDEL8 has not landed | Viewer (if mounted) shows the static "evidence trace deferred" copy. Record "PDEL8 deferred" in the morning review note. |
| All future actions disabled | Viewer toolbar | Edit, Regenerate, Download, and Approve affordances exist only as **disabled** buttons. Each carries an honest tooltip ("Edit deferred until PDEL9", "Regenerate deferred until live model gateway is wired", "Download deferred until PDEL10", "Approve deferred until gate workflow lands"). No active handler fires. |
| No fabricated approvals | Anywhere on viewer | No "Approved by <name>" chip with an invented approver / time. Approval state reads as the seed says — typically `pending`, `not_yet_recorded`, or omitted. |
| No fabricated dollars | Anywhere on viewer | `$<digit>` substring search returns zero hits. Value at stake reads as a band, descriptor, or honest "not yet baselined" copy. |
| No fabricated `E-###` citations | Anywhere on viewer | `E-\d{3}` substring search returns zero hits unless every match is a real evidence-ledger id; PDEL8 (when installed) is the only place a real `E-\d+` reference may appear. |
| No live model claim | Anywhere on viewer | No copy says "regenerated by Claude / GPT", "live model run", or implies an active inference. The MG2 deferred disclaimer applies. |

Stop if any of: a future action fires (edit / regenerate /
download / approve); a fabricated approval / dollar / `E-###` /
version / live-model claim is present.

### §D.5 — Steward Admin

Routes:

- `/platform/admin/production-readiness`

| Check | Where | Expected |
|---|---|---|
| Programs row honest | Tracker row for `programs` | Status preserved (no silent promotion); `nextAction` and notes acknowledge whatever continuity slices (PW1, MW5, MW6, PROG7) actually landed in the batch under review. |
| program_workshop_mode row honest | Tracker row for `program_workshop_mode` | Status preserved; notes acknowledge MW5 / MW6 only when those slices have landed; otherwise the row is unchanged. |
| deliverables_artifacts row honest | Tracker row for `deliverables_artifacts` | Status preserved; notes acknowledge PDEL6 / PDEL7 / PDEL8 only when those slices have landed; otherwise the row is unchanged. |
| data_evidence_knowledge_fabric row honest | Tracker row for `data_evidence_knowledge_fabric` | Status preserved; PDEL8 (when landed) appends a note tying the evidence trace shape to the fabric; never claims live evidence persistence. |
| production_deployment row honest | Tracker row for `production_deployment` | Status preserved at `blocked`. QA7 never promotes this row. |
| validation_qa row reflects QA7 | Tracker row for `validation_qa` | Notes append a row naming the QA7 runbook; `nextAction` is UNIONed conservatively (QA1 / QA2 / QA3 / QA4 / QA5 / QA6 wording is preserved verbatim). |

Stop if any of: a status promotion was silently performed; a note
overwrote a prior QA1–QA6 row; the validator returns
`passed: false`.

---

## §E · Route coverage table

| Route | Primary agent | Continuity / deliverable surfaces expected | Current status |
|---|---|---|---|
| `/tenant/apex-retail/programs` | Nexus | program seed (4 canonical programs) | exists (programs index mounted) |
| `/tenant/apex-retail/programs/[programSlug]` | Nexus | PW1 workshop mode shell, MW2 readiness, MW4 meeting notes, MW5 update proposals (deferred), MW6 SME recommendations (deferred), PROG7 resume state (deferred), PDEL5 artifact canvas, PDEL7 viewer (deferred), PDEL6 version state (deferred), PDEL8 evidence trace (deferred) | exists (PW1 + PDEL5 mounted; MW4 read-model exists; MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8 deferred per OPS1 dispatch queue) |
| `/platform/admin/production-readiness` | Steward | tracker manifest, maturity snapshot, validation_qa notes (QA1–QA7) | exists (tracker mounted; PROD2 validator runs against this manifest) |

The "Current status" column reflects what is renderable today.
Mounting each deferred surface (MW5 / MW6 / PROG7 / PDEL6 / PDEL7
/ PDEL8) on the program detail route is the **lane work** of those
slices, not QA7. QA7 only verifies that **whatever has landed**
holds the continuity contract honestly.

### Cross-tenant note

QA7 walks Apex Retail because it is the Programs demo seed anchor.
Meridian's Programs surface is intentionally minimal in the demo
seed; QA7 does not require a Meridian walk. Tenant isolation
itself is QA1 §D's responsibility.

---

## §F · Program continuity verification

Walk every continuity surface that has landed in the slice batch
under review. Assert each line below explicitly.

| Check | Expected |
|---|---|
| Workshop mode shell renders | PW1 component mounts on `/tenant/apex-retail/programs/[programSlug]`; phases 1–6 strip + gate row G1–G4 visible; deterministic-shell disclaimer present. |
| Workshop readiness chips deterministic | MW2 read-model output is byte-equal across reloads for the same program slug. |
| Meeting notes update proposals deterministic (MW5) | If MW5 is installed: same MW4 capture → same MW5 update-proposal list, byte-equal across reloads. Every proposal carries `{ proposalId, type ∈ ['phase_progress' \| 'gate_readiness' \| 'evidence_ask'], sourceSegmentId, summary, rationale }`. No fabricated dollar / `E-\d+` / approver / timestamp. |
| SME recommendations visible (MW6) | If MW6 is installed: every recommendation references a named archetype / pattern / data domain that exists in the registry. `git grep` for vendor names against the SOL vendor deny-list returns zero hits in MW6 source / fixtures. |
| Resume state present (PROG7) | If PROG7 is installed: the resume hint reflects only positions that the underlying program / workshop state records. The hint is byte-equal across reloads for the same input. |
| No fake decisions | `git grep -niE 'approved by\|signed off by\|decided by' src/lib/programs/ src/components/programs/` returns matches only inside an honest-disclaimer caveat or seed-driven row. No fabricated approver. |
| No fake timestamps | `git grep -niE '\b[0-9]+ (minute\|hour\|day)s? ago\b\|just now' src/lib/programs/ src/components/programs/` returns zero hits in QA7-touched continuity code. |

Stop if any continuity surface drifts non-deterministic; any
fabricated decision / timestamp / SME / vendor slips through.

---

## §G · Deliverable verification

Walk every deliverable surface that has landed in the slice batch
under review. Assert each line below explicitly.

| Check | Expected |
|---|---|
| Artifact canvas visible (PDEL5) | PDEL5 component mounts on `/tenant/apex-retail/programs/[programSlug]`; deliverables-by-phase logic surfaces ≥1 artifact for the active phase; missing-input copy honest where seed is partial. |
| Deliverable viewer visible (PDEL7) | If PDEL7 is installed: viewer mounts in read-only mode; deterministic body renders for the fixture; `useEffect` with model fetch is **not** present; `fetch()` to live model is **not** present. |
| Version state visible (PDEL6) | If PDEL6 is installed: version chip strip lists named versions per fixture; active version marked; byte-equal across reloads. |
| Evidence trace visible (PDEL8) | If PDEL8 is installed: trace lists named evidence references; each `E-\d+` token (if any) maps to a real evidence-ledger entry; sort order deterministic. |
| All future actions disabled | Edit / Regenerate / Download / Approve affordances exist only as **disabled** buttons; each tooltip names the deferring slice (e.g., "Download deferred until PDEL10"). No active handler fires; `onClick` is either absent or a no-op that returns `false`. |
| No fabricated approvals | `git grep -niE 'approved by [a-z]' src/lib/deliverables/ src/components/deliverables/ src/lib/programs/ src/components/programs/` returns zero hits unless every match is inside a fixture row whose approver is named in the seed. |
| No fabricated dollars | `git grep -E '\\$\s?\d' src/lib/deliverables/ src/components/deliverables/` returns zero hits. |
| No fabricated `E-###` citations | `git grep -E 'E-[0-9]{3}'` against `src/lib/deliverables/` and `src/components/deliverables/` returns zero hits unless PDEL8 (when installed) is the matching row and the id maps to a real evidence-ledger entry. |
| No fabricated version strings | `git grep -E '"v\d+\.\d+\.\d+"|\"draft-[a-z]+\"' src/lib/deliverables/` returns zero hits unless every match is in a PDEL6 fixture with a declared, named version. |
| No live model claim | `git grep -niE 'regenerated by\|generated by claude\|generated by gpt\|live model run\|real-time inference' src/lib/deliverables/ src/components/deliverables/ src/lib/programs/ src/components/programs/` returns zero hits. The model gateway is contract-only (MG2). |

Stop if any deliverable surface allows a future action to fire;
any fabricated approval / dollar / `E-###` / version / live-model
claim slips through.

---

## §H · No-fabrication checks

Walk every QA7-relevant module (PW1, PDEL5, MW4 read-model, plus
MW5 / MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8 if installed) and the
live PROD2 manifest. Assert each line below explicitly.

| Check | Expected |
|---|---|
| No fake citations | `git grep -E 'E-[0-9]+' src/lib/programs/ src/components/programs/ src/lib/deliverables/ src/components/deliverables/` returns zero hits unless the match is inside a PDEL8 fixture pointing at a real evidence-ledger entry. |
| No fake approvals | No "Approved by <name>" copy / chip / row with a fabricated approver. Every approval row ties to a seed-declared approver (if any). |
| No fake dollar amounts | `git grep -E '\\$\s?\d' src/lib/programs/ src/components/programs/ src/lib/deliverables/ src/components/deliverables/` returns zero hits. Value at stake reads as a band, descriptor, or honest "not yet baselined" copy. |
| No live model claim (gateway is contract-only) | `git grep -niE 'live model\|live inference\|live retrieval' src/lib/programs/ src/components/programs/ src/lib/deliverables/ src/components/deliverables/` returns zero positive claims. The MG2 deferred-runtime disclaimer applies wherever an agent recommendation, deliverable regeneration, or model output is implied. |
| No fake timestamps | `git grep -niE '\b[0-9]+ (minute\|hour\|day)s? ago\b\|just now\|moments ago' src/lib/programs/ src/components/programs/ src/lib/deliverables/ src/components/deliverables/` returns zero hits. ISO date strings or honest "not yet recorded" copy only. |
| No banned placeholders | `npm run integrity:dom` reports 0 violations. "Coming soon" / "TBD" / "Lorem ipsum" anywhere in the source tree fails the run. |
| Honest disclaimers present | The PW1 shell carries the deterministic-shell disclaimer; the PDEL5 canvas carries the deterministic-canvas disclaimer; PDEL7 (if installed) carries the read-only-viewer disclaimer; PDEL6 / PDEL8 (if installed) carry the deferred-persistence disclaimer; MG2 deferred-runtime disclaimer is reachable from any surface that implies a model regeneration. |
| No named-vendor endorsements | The QA3 vendor deny-list scan applies to MW5 / MW6 / PDEL5 / PDEL7 text fields too (`grep -ri -f tools/sol-vendor-deny-list.txt src/lib/programs/ src/lib/deliverables/`). Zero hits. |
| No model / API call leakage | `git grep -nE 'anthropic\|openai\|pinecone' src/lib/programs/ src/components/programs/ src/lib/deliverables/ src/components/deliverables/` returns zero hits. No imports from `anthropic` / `openai` SDKs anywhere in QA7-relevant code. |

Stop if any fabrication slips through. The platform's defensibility
depends on it.

---

## §I · Production-readiness tracker verification

Walk the live `docs/build/production-readiness.json` after every
batch's cherry-pick. Each row below must hold for QA7's relevant
components.

| Check | Expected |
|---|---|
| Manifest parses | `node -e "JSON.parse(require('fs').readFileSync('docs/build/production-readiness.json','utf8'))"` returns no parse error. |
| Fifteen canonical components present | The `components` array has exactly **15** entries with IDs `programs`, `program_workshop_mode`, `deliverables_artifacts`, `intelligence`, `ai_control_tower`, `admin_setup`, `source`, `data_evidence_knowledge_fabric`, `solution_intelligence`, `agent_runtime`, `model_gateway`, `ingestion_parsing`, `audit_governance`, `validation_qa`, `production_deployment`. |
| Maturity snapshot has 3 indicators + 20 areas | `maturitySnapshot.indicators.length === 3`; `maturitySnapshot.areas.length === 20`. |
| `overallReadinessPercent` honest | Value ∈ [20, 25] and equals or sits inside the `production_readiness` indicator's `[percentLow, percentHigh]` band. |
| PROD2 validator returns `passed: true` | `npx jest src/__tests__/integration/admin/production-readiness-validator.test.ts` reports the validator returned `{ passed: true, violations: [] }` against the live manifest. |
| `lastUpdated` reflects QA7 cherry-pick | After QA7 lands, the top-level `lastUpdated` ISO date is `2026-04-26`. |
| Relevant components updated | `programs`, `program_workshop_mode`, `deliverables_artifacts`, `data_evidence_knowledge_fabric`, `production_deployment`, and `validation_qa` are the QA7-relevant components. QA7 itself updates **only** `validation_qa.notes` and `validation_qa.nextAction` (UNION; conservative). The other five rows are read-only for QA7; their notes / status may have been updated by their own lane and must not be overwritten. |
| No false `production_ready` promotions | No QA7-relevant component's `status` advanced to `tested`, `full_flow_ready`, `pilot_ready`, or `production_ready` without explicit founder verification. PROD2 enforces this; QA7 never promotes. |
| `validation_qa` notes append, not overwrite | `components[id=validation_qa].notes` lists every prior runbook (QA1 / QA2 / QA3 / QA4 / QA5 / QA6) **plus** the new QA7 row. The QA7 row names the runbook ("Program Continuity + Deliverable Verification Runbook") and explicitly states that the runbook is documentation only and execution remains deferred. |
| `validation_qa.nextAction` UNIONed conservatively | QA7 may append a follow-up sentence about program continuity / deliverable verification, but **never overwrites** the prior `nextAction` text. If both QA7 and another lane edit `nextAction` in the same batch, apply the §J conflict-resolution policy (latest wins, or append). |

Stop if any of: a component's status promoted silently; the
validator returns `passed: false`; the maturity snapshot loses an
indicator or area; `overallReadinessPercent` drifts outside the
honest band; a prior runbook's `validation_qa.notes` row was
overwritten.

---

## §J · Morning review · PR merge rules

After the per-slice walk, decide for **each** of QA7 (and each
continuity / deliverable slice that landed in the same batch):

| Decision | When to choose | Action |
|---|---|---|
| **keep** | All checks pass; the slice reflects intent. | Leave the branch / commit as-is; recommend it for push / PR after founder review. |
| **amend** | Validation passes but the surface needs polish (a missing PDEL5 row, a stale rationale, a missed PROD2 violation). | Amend on the same branch; re-run §C validation; do not change scope. |
| **discard** | Validation fails or the slice does not reflect intent and is not worth amending. | `git branch -D <branch>` (only after confirming no other branch / worktree depends on it). Document the reason in the morning review note. |
| **cherry-pick** | A subset of the slice's commits is worth keeping in a different branch / a clean integration branch. | The **integration agent** — not the lane agent — performs the cherry-pick onto `integration/program-continuity-batch` (or the named integration branch for the night). Lane agents commit only. |
| **push / PR** | Slice is `keep`-ready and the founder has explicitly signed off. | The integration agent runs `git push origin <integration-branch>` and `gh pr create`. Apply only after the slice's own acceptance criteria and §C validation are explicitly verified. PR merge requires the morning review's explicit "merge" decision; never auto-merge a continuity / deliverable lane PR without a green PROD2 validator run on the merged manifest. |

**Default for unsupervised overnight runs:** lane agents do not
push, do not merge, do not open PRs. Local commits only. The
morning review chooses one of the five outcomes above per branch.
The integration agent owns the cherry-pick / push / PR steps; the
founder owns the merge decision. **Push only with explicit founder
go-ahead. Merge only after PROD2 reports `passed: true` against the
merged manifest.**

### Conflict resolution policy for `production-readiness.json`

When multiple lanes touch the manifest in parallel (the PW1 lane,
the PDEL5 lane, any of the MW5 / MW6 / PROG7 / PDEL6 / PDEL7 /
PDEL8 lanes, and QA7 itself all may edit `programs`,
`program_workshop_mode`, `deliverables_artifacts`,
`data_evidence_knowledge_fabric`, or `validation_qa` in the same
batch), apply the conservative merge rule from PROD2 §I:

1. **Conservative status.** When two lanes propose different
   `status` values for the same component, take the **less
   advanced** of the two (`scaffolded` < `code_complete` < `tested`
   < `full_flow_ready` < `pilot_ready` < `production_ready`;
   `blocked` outranks all). Never auto-promote.
2. **Union blockers.** When two lanes append different `blockers`
   to the same component, **union** them by `id`. Drop nothing.
3. **Latest `nextAction` wins, or append.** When two lanes propose
   different `nextAction` strings, prefer the lane whose commit is
   chronologically later. If both are equally relevant, append the
   second as a follow-up sentence rather than overwriting. QA7's
   `validation_qa.nextAction` edit is a UNION-only append; it never
   overwrites prior wording from QA1–QA6 or another QA-series lane.
4. **Preserve notes from both sides.** When two lanes append
   different rows to a component's `notes` array, keep both in the
   order each lane added them.
5. **Bump `lastUpdated`.** After resolving, set the top-level
   `lastUpdated` to today's ISO date. Set `updatedBy` to the agent
   that performed the merge (typically `Code` for unsupervised batch
   runs).

This rule is applied by hand during the morning review; the PROD2
validator then re-runs against the merged manifest and must report
`passed: true` before the integration branch is pushed.

---

## §K · Branch hygiene appendix · canonical cherry-pick path

When a pack lane lands PW1, PDEL5, MW4, plus any subset of MW5 /
MW6 / PROG7 / PDEL6 / PDEL7 / PDEL8, plus QA7 in parallel and each
lane appended its own slice entry to `docs/build/build-slices.json`
and / or its own note to `production-readiness.json`, every lane's
JSON edit conflicts with every other lane's. The morning review
resolves it like this (the **integration agent** drives this; lane
agents only commit on their own worktree branch):

1. Branch off `main` into a fresh integration branch:
   `git checkout -b integration/program-continuity-batch main`.
2. For each lane to keep, in dependency order
   (PW1 → MW4 → MW5 → MW6 → PROG7 → PDEL5 → PDEL6 → PDEL7 → PDEL8 → QA7):
   `git cherry-pick <lane-head-sha>`.
3. On each `build-slices.json` conflict, **keep both entries** (each
   lane appended an entry; the JSON array order matches the
   dependency order above). Resolve with the editor so all objects
   survive; bump `lastUpdated` once at the top of the file.
4. On each `production-readiness.json` conflict, apply the §J
   conflict-resolution policy: conservative status, union blockers,
   latest `nextAction` wins (or append), preserve notes from both
   sides, bump `lastUpdated`.
5. Re-run §C validation on the integration branch:
   `npx tsc --noEmit --pretty false && npm run build` plus every
   per-slice jest suite, including the PROD2 validator and the
   production-readiness-tracker regression.
6. Push **only with founder go-ahead**:
   `git push origin integration/program-continuity-batch` and open
   the PR with the QA7 runbook linked from the PR body. Merge only
   after PROD2 reports `passed: true` on the merged manifest.

This path is the same shape used by QA1 (agentic spine batch), QA2
(solution / workshop batch), QA3 (solution intelligence batch),
and QA4 (agent mission / persona batch).

### Worktree hygiene reminder

When running multi-lane batches via `git worktree`:

- **One worktree per slice.** One worktree = one branch = one
  local commit. Lane agents commit only and never push, never
  merge, never open a PR. The integration agent — running on its
  own branch — performs cherry-picks and merges.
- Symlinking `node_modules` into a worktree breaks Next.js Turbopack;
  run `npm install --prefer-offline` per worktree instead.
- Each worktree's `.next/` is independent; clearing it can be
  needed when the route table changes.
- Never run `git add .` in a worktree. Stage only the slice's
  declared allowed files. For QA7 the staged set is exactly four
  lines:
  - `docs/build/PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION_RUNBOOK.md`
  - `docs/build/slices/QA7_PROGRAM_CONTINUITY_DELIVERABLE_VERIFICATION.md`
  - `docs/build/build-slices.json`
  - `docs/build/production-readiness.json`
- Before commit: `git diff --cached --name-only`. Confirm only
  allowed files are staged. Unstage anything else with
  `git restore --staged <path>` before committing.
- After commit: do not push. The morning review owns the push
  decision; the integration agent owns the cherry-pick step;
  the founder owns the merge decision.
