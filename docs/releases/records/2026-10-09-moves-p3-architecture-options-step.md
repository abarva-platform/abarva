# 2026-10-09 — P3 Step 2: choose a direction from the team's options

## Release ID

`2026-10-09-moves-p3-architecture-options-step`

## Status

`candidate`

## Plain-English Summary

The fourth step page on the finalized template (v1.8): P3 Design, Step 2,
"Choose a direction". It sits behind `moves_step_pages_v3` and is
on only for the synthetic demo tenant.

The page shows the options the team brought exactly as written. For a
client-supplied set that means scope, benefit, tradeoff and condition. There
are no scores, no rank, no highlight and nothing preselected. A field no
option fills is left out. A template option set shows its effort and time to
value labelled as template estimates.

Choosing an option writes a new **step record**, `architecture_choice`. The
choice is the team's working decision. The build still records it through the
existing gate-authority approval route before any architecture is assembled.
The host now prefers the record's choice over an older approval, so the build
approves the current choice.

After a choice, a Coverage instrument asks what the chosen option answers of
each Step 1 design element: Covers, Partly or Doesn't.
- Partly or Doesn't needs one line on how the element still gets answered.
- Elements handed off in Step 1 are listed but not asked.
- A rule pre-marks "Covers" as a draft, labelled "Named in the option", only
  where the option's own scope or benefit names the element. It never marks
  Partly or Doesn't, and the mark is not credited to aVa.
- Each mark keeps the element's words, so an element rewritten in Step 1 is
  asked again.

The rationale row confirms why the option was chosen. That text is the
existing P3 `recommendation` answer, the one the approval route records.
- The consultant's own words are saved ("Save").
- Words written elsewhere are accepted ("Accept").
- An edit made elsewhere asks for confirmation again.
- If the answer argues for a different option than the one chosen, the row
  says so and offers only Edit.

Changing the option warns first when coverage marks or a confirmed reason
would be lost. When the charter records a platform-fit classification, it is
shown read-only under the chosen direction; this page never writes it.

The step is blocked, with a link to Step 1, until every root cause there is
settled.

Fill from notes supplies only empty fields: the why, and the "how" under a
Partly or Doesn't. Proposals are verbatim and cite their line. Notes never
choose an option or mark coverage.

Also in this change:
- Claude Design's fourth review of this page:
  - the step bar and the Blocked sentence read one completion source, so an
    unsettled Step 1 shows as open;
  - the Change warning, the Save and Accept verbs and the mismatch rule;
  - the read-only platform fit;
  - the evidence line says "Reading evidence…" until the first read settles,
    instead of claiming the read failed, and offers "Try again" after a
    failure.
- Claude Design's third review of P3 Step 1:
  - one clause for every open cause;
  - a cause P2 carried as a known gap names its owner and pre-fills the
    hand-off;
  - note drafts cite their line;
  - session-output upload label;
  - depth-only Blocked context.
- A template-wide fix: the Settled summary no longer prints internal row ids
  (for example "DIR", "SUBMIT"). An id shows there only where the row itself
  shows it.
- One map of step pages (`step-page-views.ts`). The phase page parses
  `?step=` from it, and the P3 step pages link to each other through it.

## Layer Impact

- Release lane: `global-control-lane`, feature-flagged.
- Capture route: unchanged code. The registry declares the new record key,
  and the route already saves and reads every declared step record.
- Readers: `structured-capture-text.ts` renders the choice for generation and
  evidence. The gate's phrase checks see only the team's "how" lines.
- Canonical model: no schema change. The record is a module row like any
  answer.
- Approval: unchanged route and authority. The host's selected option now
  prefers the step record's choice.

## Client Applicability

- All clients: no visible change while the flag is off. The host's selected
  option reads the record only when one exists, which happens only from the
  flagged page.
- Specific clients: the synthetic demo tenant (flag on).
- Internal only: no.
- Public/demo only: no.
- Feature flag: `moves_step_pages_v3`. It requires `moves_capture_v2`.

## Changes Included

- `src/lib/programs/architecture-choice.ts` (new): the record, the option
  comparison as written, text-matched pre-marks, coverage operations, why
  confirmation, and the text readers.
- `src/lib/programs/architecture-choice-notes.ts` (new): fill-from-notes
  proposals.
- `src/lib/programs/step-page-views.ts` (new): the step-page view map.
- `phase-workflow-registry.ts`: P3.2 owns `architecture_choice`.
- `structured-capture-text.ts`: dispatches the new record.
- `step-page/ArchitectureOptionsStep.tsx` (new), the template CSS for the
  Coverage instrument, and the settled-summary rule in `MovesStepPage.tsx`.
- `DesignTraceabilityStep.tsx`, `design-traceability.ts`, `StepEvidence.tsx`:
  the review-3 changes.
- The phase page and the host: the view map, the flagged mount, shared P3
  step-page chrome, the record's choice in the selected option, and the entry
  link.

## QA / Validation

- New suites pass:
  - choice record (18);
  - notes proposer (3);
  - view map (3);
  - page render (14);
  - host mount and step bar (3);
  - template settled summary (1);
  - Step 1 review-3 cases (6).
- Mutation checks pass: 38 mutations, each failing a test. They cover:
  - a tradeoff counted as a claim, a too-short name matched, an empty field
    kept;
  - a Partly accepted without a how, a mark kept after its element was
    rewritten, an acceptance surviving an edit;
  - pre-marks left as aVa's after acceptance, a stale why counted as
    confirmed;
  - Accept coverage enabled while open, a removed option kept as the choice,
    the Step 1 block dropped, why not written to the answer;
  - notes overwriting a why or a how, or explaining a Covers;
  - the Step 1 review-3 behaviours;
  - review 4: no Change warning (for marks, or for a confirmed reason alone),
    Accept on a mismatched rationale, Accept for typed words, no platform
    fit, a mismatch counted while the chosen option is named, completion
    without a why or with a removed option, no reading state, a dead retry,
    and a step bar ignoring record completion.
- One term was removed rather than tested. The gate text's team-source filter
  could never change the result, because only the team writes a "how".
- Combined run: pass, all Moves component, programs library and programs
  route suites (7,706 tests).
- Census regenerated: pass. All four new test files are swept (2,762 → 2,766).
- Route and export reachability: pass.
- `npm run typecheck`: pass. ESLint: pass.
- Visual check: pass. Five states of the real component were rendered with
  the template CSS and checked at 1440 and 375 wide, with no horizontal
  scroll. Claude Design reviewed those renders (review 4). Its must-fixes and
  should-fixes are applied, and the changed states were rendered again.

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
- Live signed-in proof required: on the demo Move:
  1. With Step 1 settled, open P3 at `?step=architecture-options`.
  2. Choose an option, mark coverage and confirm why.
  3. Confirm the P3 build's approval records that option and that rationale.

## Rollback Plan

Remove the demo tenant from the flag, or revert through a pull request. A
saved record stays a valid module row. Without the reader, capture ignores
it, generation treats it as free text, and the host's selected option falls
back to the approval or the recommendation text as before.

## Audit Evidence

- Pull request and CI results.
- The suites and mutation results above.
- The Claude Design review notes (review 4).

## Known Gaps

- Platform fit is shown read-only and only when the charter records it. It is
  set through its own governed gate, not on this page.
- An option or program name is shown as the team typed it; mid-sentence
  capitalisation is not normalised.
- Client-supplied options carry no effort or time-to-value field, so the
  comparison omits them. P3 Step 4 sizes the chosen option.
- The approver's real name is not yet resolved. Role wording is used.
