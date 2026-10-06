# 2026-10-06-moves-p3-solution-option-choice — The design phase gets the control its own blocker asks for

## Release ID

`2026-10-06-moves-p3-solution-option-choice`

## Status

`candidate`

## Plain-English Summary

A Move's design phase cannot be approved until someone says WHICH of the assembled solution options
architecture should implement. That is deliberate: the recorded approval carries the chosen option's
name, its summary, the basis for recommending it and its risks forward into the planning phase, so
the plan is a plan for a specific option rather than for a shortlist. The phase therefore refuses to
build while no option is chosen, and it says so: "Select the solution option that architecture
should implement before Approve & Build."

On the redesigned three-step capture screens there was no control to select one. The legacy capture
canvas offers the options as selectable cards; the redesigned screens rendered none, so the stated
blocker named something that was not on the page. A design phase with every question answered was a
dead end — the step bar read "7 of 7 answered", the build control read "Complete phase inputs before
build", and there was nothing left to type.

The only way past it was accidental: the phase also reads the free-text recommendation answer and
tries to find an option named in it. A person who wrote "Back the governed workflow path" in prose
got no choice recorded and no way to record one; a person who happened to write "Choose Option B"
got through. That is a coin toss, not a decision.

This change adds the missing control. It appears in two places on those screens — beside the
recommendation question, which is where the choice is formed, and beside the build control, which is
where the blocker is stated and therefore has to be actionable. Only one capture step is on screen at
a time, so the two never appear together. Whatever choice is already standing — one restored from a
recorded approval, or one read out of the recommendation text — is shown as the chosen one, so a
reload does not present an already-made decision as unmade.

Nothing about how the choice is stored changes. It is held on the page and persisted by the gate
approval, exactly as it is on the legacy canvas; this change adds no storage format and no save path.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves).** The redesigned capture screens gain a selection control for the
  design phase's solution option. No read model, API route, gate rule, capture contract or approval
  payload is changed.
- **Layers 1–3 — no impact.** The option set is assembled by the existing assembler from existing
  design inputs; the selection reaches the existing approval payload through the existing handler.

## Client Applicability

- All clients: yes, wherever the redesigned capture screens render — the defect and the fix are both
  reached through the same existing flag, not a new one.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The affected screens are the ones already behind `moves_capture_v2`; a
  tenant without it keeps the legacy canvas, whose option cards are untouched.

## Changes Included

- `src/components/strategic-moves/SolutionOptionChooser.tsx` — new. A radio group over the assembled
  options: each names its identifier and label, marks the recommended one, and shows either its
  summary with time-to-value, effort and confidence, or, for an option taken from the client's own
  approved evidence, only the fields that evidence supplied. When no option was assembled it says so
  rather than rendering an empty group, because that is a state the person cannot act out of.
- `src/components/strategic-moves/MovesPhaseStandaloneClient.tsx` — mounts the chooser on the design
  phase's recommendation question and beside that phase's build control, reporting through the same
  selection handler the legacy cards use and reading the same standing choice. The style block gains
  the chooser's rules.
- `src/components/strategic-moves/__tests__/SolutionOptionChooser.test.tsx` — new, 7 cases.
- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — 5 cases added,
  pinning the host's mounts and that choosing actually releases the build.
- `.github/workflows/ai-surface-control-catalog.yml` — the new suite is named by exact path in the
  step that already names the other suites in this directory, because the directory is not swept.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest --runTestsByPath` over the new suite and the capture host, flow, workspace and
  structured-editor suites — 5 suites, 246 tests.
- **PASS** — `npx jest .../SolutionOptionChooser.test.tsx` — 7 cases: one selectable, enabled control
  per assembled option, in order; the clicked option's identifier is what is reported; a standing
  choice renders as checked and the others do not; nothing is checked when none is standing; each
  option is named by identifier and label and the recommended one is marked; an option supplied from
  client evidence shows its own benefit and trade-off and no generated effort figures; an empty
  option set offers no control and states why.
- **PASS** — 5 host cases: on the redesigned screens the design phase states the selection blocker
  and offers the chooser beside the build control; choosing an option replaces "Complete phase inputs
  before build" with an enabled build action; a choice already named by the recommendation text shows
  as chosen and does not block the build; the recommendation question carries the same standing
  choice on its own step; a different phase, answered in full so that its own recommendation question
  is on screen, gets no chooser.
- **PASS** — mutation check, 13 of 13 killed off a green baseline: remove either mount (2 and 1
  failures); drop the phase guard so the chooser reaches another phase's recommendation question (1);
  drop the section guard so it reaches every question of the phase (3); read only a click rather than
  the standing choice, at each of the two mounts (1 and 1); disable the controls (1); never render the
  standing choice as checked (1); report the first option instead of the clicked one (1); drop the
  empty-set statement (1); show generated effort figures for a client-supplied option (1); name an
  option by label without its identifier (1); drop the recommended marker (1). Two early attempts are
  not counted: one mutation changed no behaviour (a dead ternary arm) and one targeted a knob nothing
  observed — a per-instance radio-group name, which was removed from the component rather than pinned
  with a test that could not fail.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the four changed source files, exit 0 (2 pre-existing unused-import
  warnings in the host, untouched by this change).
- **NOT RUN** — any signed-in walk. This change cannot be rendered signed-in off the private data
  plane from a development machine; it is not live-proven until a walk of the redesigned design-phase
  capture is performed.
- Censuses regenerated. The coverage census moves test files, covered test files and
  pull-request-covered test files each +1 against a freshly regenerated baseline, with uncovered test
  files unchanged at 164 — that delta is the evidence the new suite runs in CI rather than only
  locally. The committed census was additionally one behind a clean regeneration before this change;
  that pre-existing drift is folded in honestly rather than reverted. The fence census is unchanged.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys the image; no migration, no
flag change, no Azure command. The control appears on the next deploy for any tenant already on the
redesigned capture screens.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: unchanged by this record; the merge deploy's own proof applies.
- Worker image invariant: unaffected — no worker job, image, or queue behaviour changes.
- Feature/env flag update path: not used. No flag, env var, or secret is added or changed.
- Live signed-in proof required: **yes** — a signed-in walk of the redesigned design-phase capture:
  choose an option, confirm the build action becomes available, and confirm the chosen option is what
  the recorded approval names. Until that walk, this record is `candidate`, not `live-proven`.

## Rollback Plan

Revert the merge commit. The change is additive: one new component, two mount points in the capture
host, one style block addition, two test files and a workflow line. Reverting restores the previous
rendering exactly. No stored data is written, migrated or reinterpreted by this change — the
selection lives on the page and is persisted only by the gate approval, whose payload is unchanged —
so an approval recorded while this control was present is read back identically after a revert.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation table above, reproducible against the branch head.
- `docs/architecture/test-ci-coverage-census.json` — the covered/uncovered delta is the evidence the
  new suite runs in CI rather than only locally.
- `.github/workflows/ai-surface-control-catalog.yml` — the step that names the suite, in a job that is
  a required status check.

## Known Gaps

- **No signed-in proof.** See QA above. This is the phase transition the end-to-end deadline depends
  on, so the walk matters more than usual.
- **The selection is still page-local.** It is held in page state and persisted only by the gate
  approval, which is the behaviour the legacy canvas has always had. A person who chooses an option,
  does not approve, and reloads gets the choice back only if the recommendation text happens to name
  it. Persisting the choice at the moment it is made — as its own capture value — is the honest fix
  and is a larger change than this one; it is not taken here.
- **An empty option set is still a dead end, now a legible one.** If the assembler returns no option
  for a Move, the chooser says so and the phase still cannot be approved. Why a Move would have no
  assembled option, and what should happen then, is a product question this change only surfaces.
- **The free-text inference is left in place.** Reading an option out of the recommendation prose is
  now a fallback behind an explicit control rather than the only route. Whether it should be removed
  entirely, now that a person can say which option they mean, is a follow-up decision.
