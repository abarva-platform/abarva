# 2026-10-06-moves-routed-phase-capture-read-alignment — Routed phase capture is read against the set the Move was asked for

## Release ID

`2026-10-06-moves-routed-phase-capture-read-alignment`

## Status

`candidate`

## Plain-English Summary

The Design phase does not always ask the same questions. Once the preceding phase confirms how a
Move will be delivered, the Design phase swaps some of its questions for others that fit that
delivery shape — one route replaces two broad design questions with a single boundary question,
another replaces them with three narrower ones.

Two read-only surfaces were still asking the phase for its DEFAULT question list rather than the
list the Move was actually given. On a Move whose route had narrowed the set, that was wrong in
both directions at once: the question the route added was never read, so the answer a user had
already written was invisible to the assistant and never counted as answered; and the two questions
the route had deliberately removed were read as permanently unanswered. The practical effect was
that a Design phase whose questions were all genuinely answered could still be described as having
empty fields, and the assistant drafting help could not see or help with the one question the route
had introduced.

Both surfaces now resolve the Move's route first and read the questions that route declares, which
is what the capture and gate-approval endpoints already did. The resolution now lives in one place
so the three readers cannot drift apart again. Nothing about what is stored, which questions are
asked on screen, or how a gate is evaluated changes.

## Layer Impact

Release lane: `global-control-lane` — shared app behaviour for all clients, not feature-gated.

- **Products (Moves)** — read-only paths only: the assistant's view of saved phase answers and the
  phase-input drafting assist. No change to capture storage, gate evaluation, deliverable
  generation, or phase advancement logic.
- **Canonical model** — unchanged. No schema, migration, or stored shape is touched.

## Client Applicability

- All clients: yes — the corrected read applies to every Move whose Design route has narrowed its
  capture set. Moves with no confirmed route read exactly as before.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none. This corrects an existing read; it adds no new surface to gate.

## Changes Included

- New `src/lib/programs/phase-capture-values-for-move.ts` — the route-aware per-phase saved-answer
  map, plus the single route-resolution recipe and the module-state reader. Pure; callers supply the
  saved-answer lookup and the approved prior-phase evidence ids.
- `src/app/api/chat/agent/route.ts` — the assistant's per-phase capture loader resolves the route
  before reading sections. One now-unused import removed.
- `src/app/api/v1/programs/[programId]/phase-input-draft/route.ts` — same loader change; the
  resolved route is passed through to the proposal and refusal builders.
- `src/lib/programs/phase-input-draft-proposals.ts` — `PhaseInputDraftProposalInput` accepts an
  optional confirmed route; both "what is still empty" computations read the route's set. Omitted
  or null keeps the previous default-set behaviour.
- New `src/lib/programs/__tests__/phase-capture-values-for-move.test.ts` — 14 tests. The directory
  is already swept by CI; no workflow change was needed.
- `docs/architecture/test-ci-coverage-census.json` — regenerated.

## QA / Validation

- `npx jest src/lib/programs/__tests__/phase-capture-values-for-move.test.ts` — **PASS**, 14/14.
- `npx jest src/lib/programs/__tests__` (the CI-swept directory containing the changed library
  module) — **PASS**, 121 suites / 1225 tests.
- `npx jest src/app/api/chat/agent/__tests__ src/lib/programs/ava-chat/__tests__` (the suites over
  the two changed routes' surrounding behaviour) — **PASS**, 17 suites / 155 tests.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` — **PASS**, exit 0.
- `npx eslint` over all five changed/added source files — **PASS**, 0 errors, 0 warnings.
- Mutation testing, 8 mutations against the new suite: **7 killed, 1 documented false survivor.**
  Killed: dropping the route from the section read; the refusal reading the default set again;
  route resolution skipping the approved-evidence requirement; omitting an unanswered section
  instead of returning it empty; the module reader ignoring the phase; the phase list stopping one
  phase short; the module reader coercing a non-string stored value instead of reading it as no
  answer. The survivor is the route thread into the PROPOSAL builder, and it is unobservable by
  construction rather than untested: that builder returns no proposals for any phase after the
  first regardless of the route, so the route-aware early return and the route-blind fall-through
  produce the same empty result today. It is kept because the input type is shared with the
  refusal builder, which does observe it, and because leaving one of the two readers route-blind is
  how this defect arose.
- `npm run release:check -- --base origin/main --head HEAD` — recorded below with the PR.
- Census contribution isolated by regenerating in the same tree with the source changes stashed:
  the unmodified base regenerates to 2756 / 2592 / 2591 against a committed 2755 / 2591 / 2590, so
  the base carries a standing +1 drift. This branch reads 2757 / 2593 / 2592 — exactly +1 on each
  count over the regenerated base, with `uncoveredTestFiles` unchanged at 164.
- Live signed-in verification: **NOT RUN.** Requires a signed-in walk, which this lane does not
  perform.

Lane: `global-control-lane`.

## Rollout Plan

Merge to main via squash. No migration, no feature flag, no environment variable, no worker job.
The change reaches the product through the ordinary repo-owned Azure Container Apps main deploy.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` — the only path that may
  shift shared web traffic.
- Shared runtime mutators: none in this change.
- Approved image digest: assigned by the main deploy workflow on merge; not pinned by this record.
- ACA runtime invariant: to be proven after deploy by the deploy workflow's own checks — template
  image, 100%-traffic revision image, and worker job images matching the approved digest.
- Worker image invariant: unaffected; no worker job image changes.
- Feature/env flag update path: not applicable — no flag or environment variable is added or
  changed.
- Live signed-in proof required: yes, before this may be described as live-proven. Not performed
  here.

## Rollback Plan

Revert the squash commit. The change is read-only and additive: the new module has no callers after
a revert, and both route loaders return to their previous route-blind reads. Nothing was written,
migrated, or backfilled, so there is no data to unwind and no ordering constraint on the revert.

## Audit Evidence

- The pull request and its CI run, recorded on the PR.
- The validation commands and results listed under QA / Validation, reproducible on this branch.
- The mutation results above, reproducible by applying each described edit and re-running the new
  suite.
- The census isolation measurement above, reproducible by stashing the source changes in a tree at
  this base and regenerating.

## Known Gaps

- The proposal builder's route thread is correct but produces no observable difference today, for
  the reason given under QA / Validation. If per-phase proposals are ever extended past the first
  phase, that path becomes observable and should gain its own assertion at that point.
- Three further readers of the same phase-capture contract still read it without a route:
  `src/lib/programs/move-archetype-resolution.ts`, and the label/evidence-reference helpers inside
  `phase-input-draft-proposals.ts`. Neither was changed here. The label helpers are reached only
  for the first two phases, which declare no route variants, so they cannot be wrong today; the
  archetype resolver scans capture text across phases and is a separate question that needs its own
  reading before it is changed. Left out deliberately rather than swept.
- Live signed-in proof of the corrected read on a routed Move is still owed, and needs a human
  walk. A Move only narrows its Design set after the preceding phase's route validation is captured
  AND its evidence is approved, so this cannot be exercised until that approval exists.
