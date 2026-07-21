# Codex handoff — Live deliverable generation, rich file upload, and client-edit supersession crawl

**Date**: 2026-07-21
**Requested by**: Anand Sundaram
**Context**: MOVES-UI-001/002/003 (Finder-shell rebuild, Approvals overview, rail collapse) are
merged, deployed, and click/upload verified (see
`docs/codex-handoff/MOVES_UI_001_E2E_CLICK_UPLOAD_VERIFICATION_PROMPT_2026-07-21.md` and
`proof/moves-ui-001-002-e2e-20260721/`). That pass verified navigation and one small text-file
upload. It did NOT exercise real deliverable generation (Approve & Build), rich multi-format
file uploads, or the "client edits an AI draft and uploads it back as final" supersession flow.
This handoff asks for that.

## Read first (mandatory)

1. `docs/backlog/moves-product-backlog.md` — sections `MOVES-GATE-001`–`004` (the phase-gate
   fabrication incident this program spent real effort closing), `MOVES-CAPABILITY-001`
   (Explicit supersession), `MOVES-BUG-002` (`completeDeliverable()` lineage gap), and
   `MOVES-TEST-001` (isolated governed Moves test tenant — **design only, not yet built**).
2. `docs/specs/programs/deliverable-quality-and-approval-lifecycle-design.md` — the artifact
   lifecycle model (AI draft → review → final/accepted → locked as input of record).
3. `docs/specs/programs/moves-isolated-e2e-test-tenant.md` — describes what a _real_ isolated
   test tenant should look like. It has not been provisioned. You are NOT authorized to
   provision it in this task — that's separate, gated work.

## HARD SAFETY CONSTRAINT — read this twice

Real Approve & Build generation and gate-approval submission **permanently advance a Move's
phase and mutate production Postgres data**. This is not reversible through the UI. This
program has an explicit standing rule, established after a real incident (the MEMBER AI ASSIST
Move was advanced on fabricated evidence): **do not run a live phase transition against a
real, client-named production Move.**

- Use **only** the Move named `Codex Proof Agent Assist 123131`
  (`HEALTHCARE_PROVIDER-CODEX-2026`, currently at P0 Originate, 0%) as your sandbox. This
  appears to be an existing sanctioned test Move for exactly this kind of exercise — confirm
  its name and tenant match exactly before doing anything irreversible to it.
- If that Move is not available, or you're not certain it's a real sandbox (as opposed to a
  live client Move that merely has a test-sounding name), **stop and ask** rather than guessing.
- Do NOT click Approve & Build, submit a gate approval, or upload a "final" superseding
  artifact on any Move other than the confirmed sandbox.
- If the sandbox Move reaches P5/terminal during this exercise, that's fine — it's disposable
  by design. A real client Move must never be touched this way.

## Sign-in

`anand.sundaram+meridian@thesundaram.com` or `anand.sundaram+firstcapital@thesundaram.com` —
OTP-based, wait for the user to supply the code. Confirm the sandbox Move is reachable from
whichever tenant you land in; if it isn't, ask which login reaches it.

## Task

Using only the confirmed sandbox Move, drive the following, capturing screenshots and
network/console logs at each step, and reporting pass/fail per item (not a summary):

### 1. Rich synthetic file preparation

Before uploading anything, generate realistic (not `hello.txt`-trivial) synthetic files
appropriate to whatever phase inputs the sandbox Move's current phase actually calls for
(check `getPhaseCaptureSections`/the real UI for what each phase asks for). Examples, adapt to
what's actually asked for:

- A CSV with plausible columns and 20-50 rows (e.g. handle-time/volume data, vendor line
  items — whatever the phase's real evidence ask is).
- A short DOCX or richly-formatted text file simulating a real "current-state findings" memo
  or workshop notes — a few paragraphs, not one sentence.
- If the phase asks for something you can't reasonably synthesize (e.g. a real system export),
  note that explicitly and substitute the closest honest synthetic equivalent.

Do not use tiny placeholder files for this pass — the point is to exercise real parsing/
ingestion paths, not just the upload button.

### 2. Upload and confirm ingestion

Upload each synthetic file via the real UI (file picker; drag-and-drop if a dropzone exists for
that step — per the prior E2E pass, it may not). Confirm:

- The upload succeeds (network tab: real 2xx response).
- The file appears in Files & Evidence with a sensible name/format/lifecycle state.
- If the phase-capture UI reflects uploaded content back (e.g. a summary, an extracted
  reference), confirm it's real and not empty/broken.

### 3. Real deliverable generation (Approve & Build)

On the sandbox Move only: once the current phase's inputs are satisfied enough to enable
Approve & Build, click it. Confirm:

- The two-sequential-calls behavior holds (generation queues and completes, THEN gate approval
  is submitted separately — per `MOVES-GATE-002`, already fixed, but re-verify it live).
- A real deliverable (DOCX/PDF/HTML — whatever this phase's registry produces) is generated and
  appears in Files & Evidence, correctly labeled AI-draft.
- The phase advances only after this completes, and the new phase's Steps view populates
  correctly (this is the "guide pack" experience — confirm the "What this phase needs" /
  session-guide content for the newly-opened phase renders real, non-empty guidance, not a
  blank or templated-but-unfilled panel).

### 4. Client-edit-and-reupload (supersession) simulation

This is the core ask — simulate a client reviewing an AI-drafted deliverable, editing it, and
uploading their edited version as the authoritative final:

- Download (or otherwise obtain the content of) the AI-draft deliverable generated in step 3.
- Make a real, visible edit to it (e.g. append a paragraph, change a number, add a section) —
  not a no-op resave.
- Upload the edited version back through whatever upload path the Files & Evidence UI offers
  for "provide the final/reviewed version of this deliverable" (this may be the same generic
  upload control, or a dedicated action — investigate the real UI, don't assume).
- Confirm the result: does the edited upload correctly supersede the AI draft (lifecycle state
  moves to final/accepted, the AI draft is marked superseded, not silently overwritten or
  duplicated)? Read `MOVES-CAPABILITY-001` and `MOVES-BUG-002` in the backlog first — this is
  exactly the gap/capability those items describe. Report explicitly whether real behavior
  matches what those backlog entries say should happen, and flag any discrepancy as a real
  finding, not a guess.

### 5. Console/network capture

Throughout all four steps above, capture every console error and failed network request, not
just a final summary — same standard as the prior E2E pass.

## Report format

A per-item checklist (same style as the prior E2E report) with pass/fail, evidence
(screenshot/log paths), and — critically — an honest note on step 4 specifically: state
plainly whether the supersession behavior you observed matches the documented design intent,
or diverges from it, rather than assuming it's correct because the UI didn't show an error.

Save all proof artifacts under a new `proof/moves-ui-deliverable-generation-e2e-<date>/`
directory, matching the existing proof-bundle convention.
