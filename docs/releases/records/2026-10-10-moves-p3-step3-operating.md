# 2026-10-10 — P3 Step 3: name the owners and describe the change

## Release ID

`2026-10-10-moves-p3-step3-operating`

## Status

`candidate`

## Plain-English Summary

The sixth step page on the finalized template, built to Claude Design's
governed design for P3 Design, Step 3, "Operating & adoption" (template
v1.10, design review 6). It sits behind `moves_step_pages_v3` (which requires
`moves_capture_v2`) and opens with `?step=operating-adoption`. It is on only
for the synthetic demo tenant.

**Depth is never set on this page.** It is read from the change profile of the
route the consultant confirmed in P2 (`resolveChangeProfile`) and shown with
its source: "Light depth · from the P2 route, confirmed by <reviewer>". The
only action is "Re-check the P2 route →", a link to P2's route validation.
There is no depth control anywhere, including the Skipped state.

What the page asks depends on that profile:
- **Technical:** Skipped. The page shows its own sentence, a plain context line
  with the route, and the business-change boundary attestation: the team's
  boundary statement (the existing `business_change_boundary` answer) and the
  adoption owner recorded with the confirmed route. Continue is enabled, and
  the step counts as done in the step bar.
- **Limited (Light):** the owners grid, "What changes in people's work"
  (`workflow_delta`), "Where adoption stops" (`process_adoption_boundary`) and
  the baseline owner.
- **Full:** the owners grid, "Who does what once it's live"
  (`operating_model`), "The changed process, start to finish"
  (`process_design`) and the baseline owner.

The owners grid lists Step 1's accepted design elements, read from the
`design_traceability` record, plus rows the team adds. An element Step 1
handed to another program is listed read-only ("Not this Move's to staff").
Owners are chosen from the Move's sponsor and participants. The three
decision-rights columns come from one glossary in code, so a new right is
added there first. An owner or right filled from notes carries
"Session notes · review" until the consultant changes it; once the owners are
accepted, the badges go and the provenance moves to the settled note.

The two capture-text rows save the team's words only, as plain text, into
their capture answers. A draft from notes or aVa is badged by who wrote it
and needs Accept; typed words need Save. The capture answer stays the
authority: if it is edited elsewhere the row asks for confirmation again.

"Name who receives the baseline" says what actually happens ("Tower tracks
the baseline from go-live; P5 hands it to this owner"). No gate is implied.

No figure on this page is ours, and there is no money on it. "Size of the
change" shows one FACT with its source and ESTIMATE lines that cite
Assumptions register rows (`[A:A1] open · Steward lead`), read through the
register's own GET route when `moves_assumption_register_v1` is on. Proposals,
rejected and superseded rows are never cited, a row stated in money is left
to the Step 4 estimate, and a figure withheld from the viewer falls back to
the row's statement. If the register cannot be read, the page says so instead
of showing an estimate.

When pasted notes read as a heavier change than the route, the page shows one
**Advisory** row ("Your notes suggest a heavier change than the route"). It
quotes the notes with their line and offers "Re-check the P2 route →" or
"Dismiss". It never blocks, is never counted, and its clause comes last. On a
technical route aVa offers only "Check my notes against the P2 route", which
writes nothing but the flag; the fill suggestion is not offered there or while
the step is blocked.

The step is blocked, with a link to Step 2, until Step 2 is settled (the same
`recordStepDone["P3.2"]` the step bar reads). A technical route is Skipped
whatever Step 2's state.

### Owner lines in a capture answer (product decision)

Accepting the owners also writes them, as plain lines in the team's words,
into a capture answer so generation and the gate's phrase checks read them:
`process_adoption_boundary` on a limited route, `operating_model` on a full
route. A line reads "Stewardship council: owner Data governance lead; certifies its
output, approves access", with no label, id or badge.

How it avoids overwriting the team's words: the page appends one section after
the team's text and stores that section verbatim in the step record. Later it
removes or replaces only an exact copy of what it wrote. Reopening the owners
takes back exactly that section. Saving the team's own text on that answer
keeps the page's section after it. If the team edits those lines elsewhere,
they become the team's words and are never removed; the page then writes its
current lines after them.

## Layer Impact

- Release lane: `global-control-lane`, feature-flagged.
- Step-page template (`step-page-model.ts`, `MovesStepPage.tsx`): v1.10
  changes for every step page. An `advisory` row state and an Advisory group
  (never counted, its clause last and only beside another clause). An option
  to state clauses in row order. A step's own Skipped sentence. The Skipped
  context line is plain, with only the route link. Class names passed as one
  string ("list settled") are now each mapped to the CSS module.
- Capture route: unchanged code. The registry declares the new
  `operating_adoption` record for P3.3, and the route already saves and reads
  every declared step record.
- Readers: `structured-capture-text.ts` renders the record for generation and
  evidence. The gate's phrase checks see only the team's words: accepted row
  names and owners, and the baseline owner.
- Canonical model: no schema change. The record is a module row like any
  answer.

## Client Applicability

- All clients: no visible change while the flag is off. The template changes
  only add states that no other page uses yet.
- Specific clients: the synthetic demo tenant (flag on).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_v3`. It requires `moves_capture_v2`.

## Changes Included

- `src/lib/programs/operating-adoption.ts` (new): the record, the owners grid,
  the owner-lines section, readiness, the next action and the text readers.
- `src/lib/programs/operating-adoption-notes.ts` (new): fill from notes and
  the route flag reading.
- `src/lib/programs/assumption-register/step-reliance.ts` (new): the register
  rows a step relies on, and their ESTIMATE reference lines.
- `phase-workflow-registry.ts`: P3.3 owns `operating_adoption`.
- `structured-capture-text.ts`: dispatches the new record to both readers.
- `step-page-views.ts`: `operating-adoption` → P3.3.
- `step-page-model.ts`, `MovesStepPage.tsx`, `MovesStepPage.module.css`: the
  template v1.10 changes above.
- `step-page/OperatingAdoptionStep.tsx` (new).
- The host: the flagged mount, `recordStepDone["P3.3"]`, Step 2's Continue now
  opens Step 3, and the entry link in the P3 capture.

## QA / Validation

- New and updated suites pass: the record and readiness (37), notes (12),
  register reliance (3), the template model (+5), the page (25), the host
  (5), the registry and view map.
- Mutation checks: every mutation, applied one at a time, fails a test. See
  the pull request for the list.
- Combined run of the Moves component, step-page and programs library suites:
  pass.
- `npm run typecheck`: pass. ESLint: pass.
- Visual check: the real component rendered with the module CSS for the
  technical, limited and full profiles (and blocked), at 1440 and 390 wide,
  light and dark, compared with Claude Design's mocks. No horizontal scroll.

## Rollout Plan

Merge through the protected main branch. The repo-owned ACA main deploy
workflow builds and deploys the digest-pinned image. The flag is on for the
synthetic demo tenant only.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: assigned by the workflow.
- ACA runtime invariant: verify the web template and the serving revision
  match the approved digest.
- Worker image invariant: verify the required worker images match the
  approved digest.
- Feature/env flag update path: code registry (`includeTenants`).
- Live signed-in proof required: on the demo Move (technical route):
  1. Open P3 at `?step=operating-adoption`; confirm it is Skipped with the
     attestation and adoption owner, and Continue is enabled.
  2. Confirm the P3 step bar shows "Operating & adoption · Skipped".

## Rollback Plan

Remove the demo tenant from the flag, or revert through a pull request. A
saved record stays a valid module row; without the reader, capture ignores it
and generation treats it as free text. Owner lines already written into a
capture answer stay there as plain text; reopening the owners before rollback
removes them.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.
- The renders beside Claude Design's review-6 mocks.

## Known Gaps

- The route has no confirmation date, so the page names who confirmed it but
  not when.
- On a technical route the route flag arises only from notes the consultant
  pastes into "Check my notes against the P2 route"; uploaded session files
  are not read for it yet.
- Owner lines are written to the answer for the current profile only. If the
  route changes between limited and full, lines written under the earlier
  profile stay in that answer until removed by hand.
- The gate readiness page's "not built" reason for the operating-model
  document is unchanged; review 6 suggests "Step 3 is skipped (technical route
  from P2)".
