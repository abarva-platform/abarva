# 2026-09-22-source-ask-negative-savings-routing — Source ask routes negative savings instructions to the event-stage answer

## Release ID

`2026-09-22-source-ask-negative-savings-routing`

## Status

`candidate`

## Plain-English Summary

Source aVa now distinguishes between a reader asking for value-ledger information and a reader
explicitly telling it not to estimate, calculate, or claim savings while asking about event-stage
blockers.

Before this change, the Source ask route could treat the word "savings" inside a negative instruction
as a positive value-ledger signal. A prompt asking what blocks a Define-stage event from advancing,
while also saying not to estimate savings or recommend a supplier, could therefore miss the
stage-readiness answer. The route now strips negative value instructions before value-ledger intent
classification, recognizes "advancing from" as stage-completion wording, and gives the existing
stage/evidence-readiness branch priority before specialized commercial-answer branches.

Genuine value-ledger questions still route to the governed value-ledger answer.

## Layer Impact

Release lane: `global-control-lane` — shared Source ask behavior for every client using the Source
event chat route.

- **Layer 4 (Products — Source).** The Source ask route chooses the governed answer packet that
  matches the reader's intent. It does not change the underlying Source data, value ledger, event
  facts, artifacts, or lifecycle records.
- No change to layers 1-3: no intake files, adapters, canonical rows, migrations, tenant data,
  retrieval indexing, or model egress policy are changed.

## Client Applicability

- All clients: yes, for the shared Source event ask route.
- Specific clients: none singled out.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/ava/value-ledger-governed-answer.ts` — strips explicit negative value instructions
  before applying the existing value-ledger keyword classifier.
- `src/lib/source/ava/evidence-readiness-governed-answer.ts` — treats "advancing from/past" as
  stage-completion wording alongside "advance from/past."
- `src/app/api/v1/source/[eventId]/nexus/ask/route.ts` — runs the existing stage/evidence-readiness
  branch before award/value-ledger commercial branches so explicit lifecycle advancement questions
  answer from stage readiness.
- Focused tests cover the exact failing prompt, negative calculate/claim variants, a positive
  value-ledger control, and the route-level NDJSON branch.

## QA / Validation

Red first:

- `npx jest src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts --runInBand`
  failed 1 test because the exact negative-savings prompt returned `true` for value-ledger intent.
- `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/value-ledger-negative-savings-routing.test.ts' --runInBand`
  failed because the route did not call the evidence-readiness answer for the exact prompt.

Green after the fix, with Node `v24.15.0`:

- `npx jest src/lib/source/ava/__tests__/value-ledger-governed-answer.test.ts --runInBand`
  passed: 12 tests.
- `npx jest src/lib/source/ava/__tests__/evidence-readiness-governed-answer.test.ts --runInBand`
  passed: 10 tests.
- `npx jest --runTestsByPath 'src/app/api/v1/source/[eventId]/nexus/ask/__tests__/value-ledger-negative-savings-routing.test.ts' --runInBand`
  passed: 2 tests.

Mutation-style guards:

- Removing the negative-instruction normalization makes the exact prompt and the calculate/claim
  variants classify as value-ledger intent again.
- Moving the stage/evidence-readiness branch back below award/value branches makes the route-level
  exact-prompt case miss the stage answer.
- Loosening the value classifier too far is caught by the positive control: "Show the value ledger
  for this event, but do not estimate savings" must still route to value ledger.

## Rollout Plan

Squash-merge to `main`. The repo-owned ACA main deploy workflow builds and deploys the image. No
manual Azure mutation, migration, data build, feature flag, or tenant-data operation is part of this
release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, on merge to `main`.
- Shared runtime mutators: none in this change.
- Approved image digest: to be recorded from the repo-owned deploy run after merge.
- ACA runtime invariant: to be read from the deploy run's runtime-invariant proof, not inferred.
- Worker image invariant: unchanged by this change; readback still required for the shared runtime
  invariant after deployment.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes. The change affects a signed-in Source event ask response, so
  signed-in acceptance remains owed after deployment. This release record does not claim it.

## Rollback Plan

Revert the squash commit. There is no migration, data write, feature flag, or runtime setting to
undo. Reverting restores the prior classifier order and value-ledger intent behavior.

## Audit Evidence

- The PR, diff, and hosted check runs.
- The focused red/green test output listed above.
- The repo-owned ACA deploy run and its runtime-invariant artifact after merge.
- A future signed-in Source event ask proof for the exact negative-savings stage-blocker prompt.

## Known Gaps

- Signed-in acceptance is not performed or claimed in this candidate record.
- The route still uses keyword classifiers rather than a full intent parser; this release only
  repairs the observed ordering and negative-instruction failure mode.
