# U-651 — The phase build control is painted as held when it is held

## Release ID

`2026-10-09-phase-build-action-state`

## Status

`candidate`

## Plain-English Summary

The governed "Approve & Build" control on a Move's phase step had its held
condition written out four separate times. The `disabled` attribute and the
cursor read four terms. The background colour and the text colour read only
three — they left out the term for open required evidence, three lines above
them. So in the one state covered by that missing term, the button was
genuinely inert while being painted in the full-strength primary green on
white: the live "go" treatment, on a control that did nothing when clicked.

That state is the ordinary one on this step, not an edge case. The transition
readiness workbook deliberately does not hold the capture step's Continue, so a
phase can have every input answered and saved — no blocker from the capture
side — with the workbook still open. The only hint that the button was inert
was its own label.

The same two holds were also resolved in opposite orders by two slots that sit
beside each other: the button's label named open required evidence first, and
the status sentence under it named the capture blocker first. With both open,
the button and the line beside it prescribed different work. The sentence had
it right — the write path finalizes the capture before it enqueues the build
set, so incomplete inputs are what the server refuses on first — so the label
now follows that order.

The hold is now a value rather than a condition re-typed per slot. A new module
returns `null` when nothing holds the build and otherwise returns the hold with
every string the control renders for it. The colours read whether a hold
exists, so a state the attribute treats as held can no longer be styled as
live, and adding a hold does not compile until both of its sentences are
written.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not
feature-gated.

- **Layer 4 (Products — Moves).** Presentation only, on the phase approve step.
  No change to when the build POST fires, to what the server accepts, or to any
  read model. The set of states in which the control is disabled is unchanged;
  what changed is how one of those states is painted, and which hold the label
  names when two stand at once.

No change to layers 1-3.

## Client Applicability

- All clients: yes — the control is not flag-gated. The surface that hosts it on
  the redesigned capture flow is reached under the existing capture flags.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none added. Behaviour is identical for a tenant on the legacy
  canvas and one on the redesigned flow, because both mount the same control.

## Changes Included

- `src/lib/programs/phase-build-action-state.ts` — new. `resolvePhaseBuildBlock`
  plus the exported `PHASE_BUILD_BLOCK_ORDER` for cross-checking a surface that
  renders its own prose for these holds.
- `src/components/strategic-moves/PhaseApproveAndBuild.tsx` — the build
  control's `disabled`, background, colour, cursor, label and status sentence
  all derive from the one resolved hold.
- `src/lib/programs/__tests__/phase-build-action-state.test.ts` — new, 12 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx`
  — 3 render cases on the live host.
- `docs/architecture/test-ci-coverage-census.json` — regenerated for the one
  added test file.

## QA / Validation

- **PASS** `npx jest --runTestsByPath src/lib/programs/__tests__/phase-build-action-state.test.ts` — 12/12.
- **PASS** `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 294/294 (291 before, +3).
- **PASS** `npx jest src/components/strategic-moves/__tests__` — 54 suites / 886 tests.
- **PASS** `npx jest src/lib/programs/__tests__` — 207 suites / 2922 tests.
- **PASS** `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — exit 0.
- **PASS** `npx eslint` on all four changed files — 0 problems.
- **PASS** `npx prettier --check` on all four changed files.
- **PASS** Mutation testing: **13 designed mutants, 12 killed.** Both defect
  directions are covered — reverting the background or the colour to the
  three-term condition fails 1 each (the new appearance case), and swapping the
  two holds' resolution order fails 2. The over-suppression direction is
  covered too: painting the control as held unconditionally fails 30. The one
  survivor is behaviour-neutral by construction: re-typing the `disabled`
  attribute as the identical four-term list it had before. It is reported as
  neutral, not as a coverage gap.
- **NOT RUN** Live signed-in walk. Nothing here is `live-proven`.
- **PASS** `npm run release:check -- --base origin/main --head HEAD`.

## Rollout Plan

Merge to `main`. The change is in the web image, so it becomes active on the
next repo-owned ACA main deploy; no migration, no flag, no worker job, no data
build.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` only.
- Shared runtime mutators: none. This change runs no Azure command.
- Approved image digest: whatever the main deploy workflow produces for the
  merge commit. No digest is pinned or changed by this record.
- ACA runtime invariant: unverified here. To be proven after the next main
  deploy, not by this record.
- Worker image invariant: unaffected — no worker job changes.
- Feature/env flag update path: not used.
- Live signed-in proof required: **yes** — see Known Gaps.

## Rollback Plan

Revert the squash commit. The change is presentation-only and carries no
migration and no stored state, so a revert is complete and immediate — the
control returns to its previous colours and label order. No data to unwind.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation table above, reproducible by applying each listed revert and
  re-running the three suites named in QA.
- The pre-existing case in `MovesPhaseStandaloneClient.test.tsx` that asserted
  `toBeDisabled` on this control in exactly the mis-painted state, and nothing
  about its appearance — which is why the defect was green in CI.

## Known Gaps

- **A signed-in walk is owed, regression direction first.** An offerable build
  must still render in the live treatment and still read `Approve & Build`; a
  build held by incomplete inputs must still read `Complete phase inputs before
  build`. Only then the forward direction: a phase with every input saved and
  the readiness workbook still open must show the held treatment. This is a
  human-in-the-loop step and is not claimed here.
- **Two slots that answer this question are dark on the redesigned flow** and
  were deliberately left alone: the phase progress card's remaining/next-action
  pair and the approve-step progress header both sit inside branches that the
  redesigned capture flow replaces. A fix there would change no screen for a
  tenant on that flow. Measured, recorded, not shipped.
- **The gate-submit-without-build control's own held condition does not include
  open required evidence.** Measured while here, not changed: it is a different
  control with a different submittability plan, and widening it needs its own
  reckoning rather than a shared one assumed to fit.
