# 2026-09-19-source-award-stage-alias — Award authority follows the stage, not its spelling

## Release ID

`2026-09-19-source-award-stage-alias`

## Status

`candidate`

## Plain-English Summary

The Source CXO narrative report decides whether an event may be presented to an
executive as "Award / proceed". It made that decision by comparing the event's
stage against three stage names written out by hand. The product uses two
different names for the same point in the lifecycle — the decision stage — and
only one of them was in that list.

The result was that two identical events, with identical artifacts, identical
evidence and identical expert-judgment kernel verdicts, were presented
differently: one as "Award / proceed", the other as "Pending", purely because of
which name happened to be stored on the event. The same file already contains the
mapping that says those two names are the same stage.

It also meant the deal pack and the CXO report could state two different verdicts
for one event. The deal pack takes its headline straight from the judgment
kernel, so it said "Award / proceed" while the report said "Pending" — the exact
disagreement the artifact-consistency suite exists to prevent.

The check now asks a named set of decision-stage keys, declared once, with the
reason beside it. Both names for the decision stage answer the same way. The gate
itself is unchanged in strength: an event that has not reached the decision stage
still refuses "Award / proceed", and the stages that mean "still evaluating" are
deliberately excluded and pinned by a test.

## Layer Impact

- **Products layer (Source).** The CXO narrative report and the artifacts rendered
  from it — HTML, PPTX and the deal pack comparison — state one verdict for one
  event. No other product surface changes.
- No canonical model, source adapter or client intake change. No schema, no
  migration, no data-plane read or write.

Release lane: `global-control-lane`.

## Client Applicability

- All clients: yes — the CXO report export is a shared product surface, not
  client-gated.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/source/exports/cxo-report/source-cxo-narrative-report.ts` — the
  spelling-sensitive award-stage check becomes `AWARD_DECISION_STAGE_KEYS`, a
  declared and exported set carrying the reason it is not derived from the stage
  number alone.
- `src/lib/source/exports/__tests__/artifact-verdict-consistency.test.ts` — four
  new cases: the two spellings of the decision stage agree; the deal pack and the
  report state one verdict; an award-ready event below the decision stage still
  refuses "Award / proceed"; every key carrying award authority produces it.
- `src/lib/source/exports/cxo-report/__tests__/source-cxo-narrative-report.test.ts`
  — one expectation restored, with the reason recorded inline. It had been
  rewritten in #4360 to agree with the defect rather than with the fixture it
  describes.
- `.github/workflows/ai-surface-control-catalog.yml` — one appended step, so both
  suites actually run on every pull request. Neither ran in any CI job before this
  change, which is why the red sat unseen for weeks.

## QA / Validation

- **The defect was reproduced on clean `origin/main` (`a84dbe383`) before any
  edit**, and root-caused by reading history rather than inferring: the
  consistency suite was green when written, `#2829` introduced the
  spelling-sensitive check and turned it red, and `#4360` — a commit touching one
  test file and no product code — rewrote the sibling expectation to match the new
  behaviour and moved two other fixtures onto the other spelling to work around
  it. The suite that disagreed was left red. Neither file runs in any CI job, so
  nothing reported it.
- **Failing test first.** Same 14 cases in the consistency suite: **4 failed / 10
  passed before the fix → 0 failed / 14 passed after.**
- **Five mutations of the shipped control, each caught by the case that should
  catch it**, product file byte-restored after each (22 cases across both suites):
  predicate hard-wired true → 1 failed / 21 passed; hard-wired false → 5 / 17; the
  original spelling-sensitive check restored → 5 / 17; a pre-decision stage key
  added to the set → 1 / 21; the still-evaluating stage added to the set → 1 / 21.
- **Scope baseline, same command either side.** `npx jest src/lib/source/exports`:
  **1 test failing before, 0 after**; 25 suites passing / 1 failing → 26 passing;
  288 tests → 292.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` exit
  **0**, with `tsconfig.tsbuildinfo` removed first.
- `npx eslint` over the three changed files: exit **0**, no output.
- `npm run audit:ai-surface-controls` exit **0** with the appended step in place
  (18 surfaces, 37 declared controls, 26 of 37 covered) — the step does not
  disturb the catalog's own accounting.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: recorded on the
  pull request.

## Rollout Plan

Merge to `main`. The repo-owned ACA main deploy workflow builds the image from the
merge SHA and shifts Product/Lab web traffic. No migration, no data build, no flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change.
- Approved image digest: recorded against the merge SHA after the deploy run.
- ACA runtime invariant: Container App template image must equal the
  100%-traffic revision image, digest-pinned; verified after deploy.
- Worker image invariant: both non-manual deliverable worker jobs on the same
  digest; verified after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes — see Known Gaps.

## Rollback Plan

Revert the pull request and redeploy, or shift 100% ACA traffic back to the prior
digest-pinned revision. No data written, so rollback carries no data constraint.

## Audit Evidence

- The pull request, its CI run, and the merge SHA.
- The mutation results above, each reproducible by re-applying the named mutation
  to the product file and re-running the two suites.
- The ACA deploy run keyed to the merge SHA, and the digest comparison recorded
  against it.

## Known Gaps

- **Signed-in acceptance is owed, not done.** The change reaches one route — the
  Source CXO report export — and proving it live means generating an export for a
  real event at the decision stage. Not attempted in an unattended run.
- **The deal pack applies no stage gate at all.** Its headline is the raw kernel
  verdict, so an evidence-complete event still sitting below the decision stage
  reads "Award / proceed" there while the report reads "Pending". This change
  removes the disagreement at the decision stage only. Whether the deal pack
  should carry the same gate, or the report should drop it, is a product decision
  and is recorded in the backlog rather than guessed at here.
- **Two `stageNumberFor` implementations disagree.** The report module places
  `transition`/`value` at stage 7; the deal pack module places them at 10 and 11.
  Out of scope and recorded in the backlog.
- **Nothing enforces that the new CI step stays.** The catalog audit proves a
  *declared control's* test runs; these two suites are not declared controls, so
  deleting the step would be silent. The structural fix — an inventory of
  `src/lib/**/__tests__` against CI coverage — is backlog item 77 and is not
  attempted here.
- The stage set remains hand-maintained. The stage number alone cannot decide
  award authority, because the evaluation, BAFO and decision stages share one
  number. The test pins both directions so a future addition has to be deliberate.
