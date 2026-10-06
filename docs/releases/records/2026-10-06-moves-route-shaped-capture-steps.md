# 2026-10-06-moves-route-shaped-capture-steps — The design phase asks every question its route declares

## Release ID

`2026-10-06-moves-route-shaped-capture-steps`

## Status

`candidate`

## Plain-English Summary

A Move's design phase does not always ask the same questions. Which questions it asks depends on the
solution route the discovery phase confirmed. A route that produces a technical product does not ask
for an operating-model design or a workflow redesign; it asks instead for the boundary — what the
build covers, and who is accountable for training and adoption. A route that changes a process only
slightly does not ask for a full redesign either; it asks for the steps that actually move, who owns
the adoption, and the sizing inputs the planning phase will have to resolve. This is the capture
contract's own behaviour and it is correct: asking for a full process design when nothing material
about the process changes produces work nobody needed.

The redesigned three-step capture screens did not know about it. They grouped a phase's questions
into three steps using one grouping per phase number, written against the phase's default question
set. On the two re-shaped routes that grouping was wrong in both directions at once: the questions
the route declares were placed in no step, so they were mounted nowhere and could not be answered at
all; and the step that referenced the two questions the route drops resolved to nothing, so it
rendered as an empty panel.

The result was a dead end. The design phase reported those unanswerable questions as missing for as
long as the Move existed, so the phase could never read complete and could never be built. It was
also where a reload landed: a step whose questions do not all resolve can never read complete, so the
resume rule sent the person straight to the empty panel. On the default route — a process change with
material workflow and role impact — none of this happened, which is why it held together in the only
shape anyone had walked.

This change resolves the grouping from the questions the phase actually declares rather than from its
number. The two re-shaped sets get their own three-step groupings, with their own step titles. Any
set that no grouping anticipates is repaired instead of silently dropped: a question nothing grouped
is appended to the last step, and a reference the contract no longer declares is removed. So the
property the screens depend on — every declared question is reachable in some step, and no step
references a question that is not asked — now holds for every route, including routes that do not
exist yet.

Nothing about what is asked, stored, gated or generated changes. The questions, their help text,
their structured input types, their saves and the gate and generation rules that read them are all
the capture contract's, untouched. Only which step a question appears on is decided here.

## Layer Impact

Lane: `global-control-lane`.

- **Layer 4 (Products — Moves).** The redesigned capture screens resolve their three-step grouping
  from the phase's declared questions. No capture contract, read model, API route, gate rule,
  approval payload or deliverable type is changed.
- **Layers 1–3 — no impact.** No intake tab, adapter, canonical object or dataset is touched.

## Client Applicability

- All clients: yes, wherever the redesigned capture screens render — the defect and the fix are both
  reached through the same existing flag, not a new one. It is live for any Move whose design phase
  is entered after the discovery phase confirms either re-shaped route.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: no new flag. The affected screens are the ones already behind `moves_capture_v2`; a
  tenant without it keeps the legacy canvas, which reads the declared sections directly and never had
  this defect.

## Changes Included

- `src/lib/programs/moves-phase-step-plan.ts` — new. `phaseStepPlan(phase, sections)` returns the
  grouping to render plus how it was reached (`default`, `variant` or `repaired`) and, for a repair,
  which keys were dropped and which appended; `resolvePhaseStepGroups` is the grouping alone.
  Variants are matched by key set rather than by route name, so a future route that re-shapes a phase
  is covered without naming it here, and the repair path holds the covering property for a set no
  variant anticipates. The two re-shaped design-phase groupings and their step copy live here.
- `src/components/strategic-moves/MovesCaptureFlow.tsx` — resolves its groups from the sections it
  was already given instead of from the phase number. One call site; no other behaviour changes.
- `src/lib/programs/__tests__/moves-phase-step-plan.test.ts` — new, 24 cases.
- `src/components/strategic-moves/__tests__/MovesCaptureFlowRouteSteps.test.tsx` — new, 6 cases,
  pinning the rendered screen rather than the module, since the module alone cannot prove a question
  reaches a person.
- `.github/workflows/ai-surface-control-catalog.yml` — the new component suite is named by exact path
  in the step that already names the other suites in this directory, because the directory is not
  swept.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- **PASS** — `npx jest src/components/strategic-moves/__tests__ src/lib/programs/__tests__` — 150
  suites, 1625 tests. Both whole directories were run rather than the related suites, because this
  changes a host component many suites mount.
- **PASS** — the grouping suite, 24 cases. The load-bearing one is parameterised over all six phases
  and all three design-phase routes: for each, the resolved grouping covers every declared question
  exactly once and references no question the contract does not declare, and keeps three non-empty
  steps. The rest pin each re-shaped route to its own grouping, pin every phase the default already
  fits as still using the default, and pin the repair path — appending an unanticipated question to
  the last step, dropping a reference the contract no longer declares and reporting both, and a set
  that does both at once.
- **PASS** — the screen suite, 6 cases. For each re-shaped route it walks all three steps and asserts
  an input is mounted for every question the route declares, that none is asked twice, and that no
  step is empty; that the route's own question is asked and the two dropped ones are not; that the
  route's step title is in the step bar; and that the default route still asks the operating-model
  pair and not the boundary question.
- **PASS** — mutation check, 8 of 8 killed off a green baseline: revert the host to the route-blind
  grouping, which is the defect itself (killed by the screen suite only — the grouping suite cannot
  see a host that ignores it); remove each of the two route groupings (both suites); stop consulting
  variants at all (both suites); drop the undeclared-key check from the exact-match test; never
  append in the repair path; never drop an undeclared key in the repair path; accept a grouping of a
  different length as an exact match.
- **PASS** — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit`, exit 0.
- **PASS** — `npx eslint` on the four changed source files, exit 0.
- **NOT RUN** — any signed-in walk. This change cannot be rendered signed-in off the private data
  plane from a development machine; it is not live-proven until a walk of a design phase on a
  confirmed technical-product route.
- Censuses regenerated. Against a freshly regenerated baseline the coverage census moves test files,
  covered test files and pull-request-covered test files each +2, with uncovered test files
  unchanged — that delta is the evidence both new suites run in CI rather than only locally. The
  committed census was additionally one behind a clean regeneration before this change; that
  pre-existing drift is folded in honestly rather than reverted, which is why the diff against the
  merge base reads +3. The fence census is unchanged.

## Rollout Plan

Merge to main. The repo-owned ACA main deploy workflow builds and deploys the image; no migration, no
flag change, no Azure command. The corrected grouping applies on the next deploy for any tenant
already on the redesigned capture screens.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may shift
  shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: unchanged by this record; the merge deploy's own proof applies.
- Worker image invariant: unaffected — no worker job, image, or queue behaviour changes.
- Feature/env flag update path: not used. No flag, env var, or secret is added or changed.
- Live signed-in proof required: **yes** — a signed-in walk of a design phase whose route is a
  confirmed technical product: all three steps ask questions, the boundary question is one of them,
  no step is empty, and the phase can be completed and built. Until that walk, this record is
  `candidate`, not `live-proven`.

## Rollback Plan

Revert the merge commit. The change is additive but for one call site: a new library module, one line
in the capture flow that chooses how its groups are resolved, two new test files, one workflow line
and a regenerated census. Reverting restores the previous grouping exactly, which means it restores
the defect — so a revert should be paired with keeping the affected routes off the redesigned screens
rather than treated as a safe no-op. No stored data is written, migrated or reinterpreted: step
grouping is presentation only, and an answer saved under this change is saved under the same section
key it would have been saved under before.

## Audit Evidence

- The PR for this branch and its CI run.
- The mutation table above, reproducible against the branch head.
- `docs/architecture/test-ci-coverage-census.json` — the covered/uncovered delta is the evidence both
  new suites run in CI rather than only locally.
- `.github/workflows/ai-surface-control-catalog.yml` — the step that names the component suite, in a
  job that is a required status check.

## Known Gaps

- **No signed-in proof.** See QA above. This is a phase transition the end-to-end deadline depends
  on, so the walk matters more than usual — and the defect was reachable only on a confirmed route,
  which is exactly the state no walk had reached yet.
- **The route groupings' step copy is written here, not with the questions.** The two new groupings
  carry their own step titles and intros in the plan module, beside the phase-number groupings they
  sit next to. If a route's question set changes again, its step copy has to be revisited in this
  file; nothing forces that, beyond the covering test failing if a question ends up ungrouped.
- **A repaired grouping has no editorial copy for the question it appends.** The repair path
  guarantees the question is reachable, which is the property that matters, but it lands at the end
  of the last step under that step's title. The `repaired` basis is returned so the condition is
  observable, and no surface renders it today.
- **Only the design phase re-shapes its question set.** The resolution is phase-agnostic, but the
  variants declared are the design phase's two. If another phase gains a route-dependent set, it gets
  the repair path rather than authored steps until a variant is written for it.
- **Nothing pins the capture contract against the variants.** A route set the contract adds is covered
  by the repair path and by the parameterised covering test only if the test's route list is extended
  to include it. The route list is a literal in the test, deliberately — reading the routes off the
  module under test would let a new route pass unexamined.
