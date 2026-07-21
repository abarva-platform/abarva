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

- This pass runs against the **First Capital Financial** tenant (login
  `anand.sundaram+firstcapital@thesundaram.com`). Find and use whatever sandbox/test Move
  exists there with the same "obviously not a real client engagement" naming pattern as
  `Codex Proof Agent Assist 123131` was for the healthcare tenant (e.g. a "Codex Proof..."-
  or "Test..."-named Move). Confirm its name explicitly before doing anything irreversible.
- If no such sandbox Move exists on First Capital, **stop and ask** rather than creating one
  yourself or guessing which real Move is "probably fine to use." Do not originate a brand-new
  Move as a workaround without explicit confirmation that's acceptable.
- Do NOT click Approve & Build, submit a gate approval, or upload a "final" superseding
  artifact on any Move other than the confirmed sandbox.
- If the sandbox Move reaches P5/terminal during this exercise, that's fine — it's disposable
  by design. A real client Move must never be touched this way.

## Sign-in

`anand.sundaram+firstcapital@thesundaram.com` — OTP-based, wait for the user to supply the
code. Confirm the sandbox Move is reachable from this tenant; if it isn't, ask before
proceeding.

## Synthetic data generation and storage

- Generate every synthetic file yourself, dynamically, at the point you need it — do not rely
  on any pre-staged fixture. Each file's content must be tailored to First Capital Financial's
  domain (financial services — e.g. plausible loan/account portfolios, vendor/contract line
  items, compliance or audit findings, claims or transaction volumes — not healthcare content
  carried over from the prior pass) and to the specific phase input it's meant to satisfy.
- Save every generated synthetic file to the real local `~/Downloads` folder (or this
  environment's equivalent user Downloads directory) before uploading it, exactly as a real
  user would have a file sitting in Downloads before attaching it. Use a clear, dated,
  obviously-synthetic naming convention (e.g. `synthetic-firstcapital-<phase>-<artifact>-
2026-07-21.csv`) so nothing generated here could be mistaken for a real client file if it's
  ever found later.
- List every synthetic file you created (path, purpose, which phase input it satisfies) in your
  final report — this is itself part of the audit trail.

## Task

Using only the confirmed sandbox Move, drive the following, capturing screenshots and
network/console logs at each step, and reporting pass/fail per item (not a summary):

### 1. Rich synthetic file preparation

Before uploading anything, generate realistic (not `hello.txt`-trivial) synthetic files
appropriate to whatever phase inputs the sandbox Move's current phase actually calls for
(check `getPhaseCaptureSections`/the real UI for what each phase asks for), per the
"Synthetic data generation and storage" section above. Examples, adapt to what's actually
asked for and to First Capital's financial-services domain:

- A CSV with plausible columns and 20-50 rows (e.g. vendor/contract line items, transaction or
  claims volumes, portfolio metrics — whatever the phase's real evidence ask is).
- A short DOCX or richly-formatted text file simulating a real "current-state findings" memo
  or workshop notes — a few paragraphs, not one sentence.
- If the phase asks for something you can't reasonably synthesize (e.g. a real system export),
  note that explicitly and substitute the closest honest synthetic equivalent.

Do not use tiny placeholder files for this pass — the point is to exercise real parsing/
ingestion paths, not just the upload button.

### 1a. Workshop/session insight capture

If the client (First Capital) is meant to have conducted a workshop or working session for
this phase, simulate the capture of that session's insights as follows — this is the concrete
mechanism, don't leave it open-ended:

- Generate a synthetic "session notes" document (DOCX or richly-formatted text) representing
  what a facilitator or note-taker would have produced from a real workshop: a short agenda,
  3-6 named discussion points with 1-2 sentences of substance each, at least one explicit
  decision or action item, and (if the phase's template supports attribution) a plausible
  attendee/role list. This should read like real workshop output, not a bullet-point stub.
- Upload this session-notes document through the SAME evidence-upload path used for any other
  phase-input file — there is no separate "workshop insight" upload channel in the current
  product; a workshop's output becomes evidence the same way any other uploaded document does.
  Confirm this is actually true in the live UI (i.e. that there is no dedicated
  session/workshop capture control you're missing) and report explicitly which mechanism
  actually exists if it differs from this.
- After upload, check whether any phase-capture field or generated deliverable reflects content
  traceable back to this session-notes file (a citation, an extracted quote, a referenced
  decision). Report honestly whether the session's insights actually flowed into anything
  downstream, or whether the document just sits in Files & Evidence unused — that distinction
  matters and should not be glossed over.

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

**Quality score the generated deliverable itself** — don't just confirm it exists. Read its
actual content and score it honestly against a simple rubric:

- **Grounded**: does it reference/reflect the specific synthetic evidence you uploaded (real
  numbers, real named findings from your files), or does it read as generic boilerplate that
  would look the same regardless of what was uploaded?
- **Specific vs. filler**: what fraction of the document is substantive vs. templated filler
  language, disclaimers, or restated section headers with no content?
- **Structurally complete**: does it match what the artifact's registry/spec says it should
  contain (check `DELIVERABLE_REGISTRY` for this artifact type), or are sections missing/thin?
- **Actionable**: could a real reviewer act on this without needing to ask "what does this
  actually mean for us"?

Give each dimension a 1-5 score with one sentence of justification citing actual document
content, not a vibe. If the deliverable is genuinely good, say so plainly — this is not meant
to be a hunt for problems, it's meant to be an honest read.

### 4. Client-edit-and-reupload (supersession) simulation — with redlining

This is the core ask — simulate a client reviewing an AI-drafted deliverable through a
realistic two-stage review cycle, not a single flat edit:

**Stage A — redline.** Produce a "redlined" version of the AI-draft deliverable simulating a
human reviewer marking it up: use visible tracked-changes-style markup (e.g. `~~struck
text~~` for deletions and `**[inserted text]**` or similar clear marker for insertions if the
format is plain text/Markdown; real Word tracked-changes if you're working with a DOCX and
have the tooling to produce it) with at least 3-5 distinct, substantive edits — correcting a
number, sharpening a vague claim, adding a missing consideration, striking boilerplate. This
redlined version represents a work-in-progress review, not the final artifact. Upload it and
observe: does the product have any concept of an "in review with markup" state distinct from
plain AI-draft and plain final, or does it only support draft/final? Report which is actually
true — do not assume a redline-aware state exists if you haven't seen it.

**Stage B — approved final.** Produce a second, clean (no markup) version that incorporates
the redline edits as accepted changes — this is what a client would actually submit as their
sign-off copy. Upload this as the authoritative final through whatever path the Files &
Evidence UI offers for "provide the final/reviewed version of this deliverable" (same generic
upload control, or a dedicated action — investigate, don't assume).

- Confirm the result: does the clean final-version upload correctly supersede the AI draft
  (lifecycle state moves to final/accepted, the AI draft is marked superseded, not silently
  overwritten or duplicated)? Read `MOVES-CAPABILITY-001` and `MOVES-BUG-002` in the backlog
  first — this is exactly the gap/capability those items describe. Report explicitly whether
  real behavior matches what those backlog entries say should happen, and flag any discrepancy
  as a real finding, not a guess.
- **Quality score the approval delta**: compare the AI draft, the redline, and the final —
  does the final version actually reflect a genuine improvement over the AI draft (the redline
  edits visibly landed), or would the "approved" version read identically to the AI draft to
  an outside reader? An honest answer here matters more than confirming the upload succeeded.

### 5. Files Explorer audit-availability check

For every artifact produced or uploaded in steps 1-4 (every synthetic input file, the
session-notes document, the AI-draft deliverable, the redlined version, and the approved
final), independently verify in the Files & Evidence explorer that:

- The artifact is actually present and visible (not silently dropped).
- Its lifecycle state/label is correct and distinguishable from the others (a reviewer scanning
  the list should be able to tell draft from redline from final without opening each file).
- Its name, format, and phase association are all legible and correct — this is the "can an
  auditor find and understand this later" bar, not just "did the upload API return 200."
- If the product shows any lineage/version relationship between the AI draft and its
  superseding final, confirm it's visible and accurate; if it does not show this, say so
  plainly as a gap rather than assuming it exists.

### 6. Console/network capture

Throughout all five steps above, capture every console error and failed network request, not
just a final summary — same standard as the prior E2E pass.

## Report format

A per-item checklist (same style as the prior E2E report) with pass/fail, evidence
(screenshot/log paths), and:

- The list of every synthetic file you generated and where it's stored (per the "Synthetic
  data generation and storage" section).
- The quality scores and justifications from steps 3 and 4, stated plainly — do not soften a
  low score to seem more successful, and do not manufacture a problem to seem more thorough.
- An honest note on step 4 specifically: state plainly whether the supersession/redline
  behavior you observed matches the documented design intent, or diverges from it.
- An honest note on the workshop-insight mechanism (step 1a): state plainly what actually
  happens when workshop output is uploaded, not what you expected to happen.

Save all proof artifacts (screenshots, logs, and copies of every synthetic file you generated)
under a new `proof/moves-ui-deliverable-generation-e2e-<date>/` directory, matching the
existing proof-bundle convention.
