# u619 — P2 readiness cannot be cleared by a Discovery Report with no content

## Release ID

`2026-10-08-p2-readiness-contentless-discovery-report`

## Status

`candidate`

## Plain-English Summary

The P2 phase gate has a hard criterion, `p2_readiness_cleared`, that asks
whether the signed Discovery Report clears the phase. It is the only one of that
phase's criteria that passes on the **absence** of blocking language rather than
on the presence of a statement: it passes when the report text is non-empty, and
carries no unresolved-hard-gap language, and does not say conditional proceed.

The report's text was assembled from the latest version row as

```
[content ?? "", structured_data ? JSON.stringify(structured_data) : ""].join("\n")
```

When a report record has nothing readable — no version row at all, or a version
whose content and structured data are both empty — both halves are the empty
string and the join still produces a one-character string, a bare newline. So
the "the report is non-empty" test could not fail once a report record existed.
A record with nothing in it satisfied all three conditions, and a hard criterion
on the phase gate was cleared by a report that said nothing at all.

Underneath that sat a second defect. The criterion's failure sentence was chosen
by a three-arm ladder with no final arm: unresolved hard gaps, conditional
proceed, and no report record at all. The remaining state — a report record
present but its text genuinely empty — had no sentence. That state was
unreachable only _because_ of the vacuous emptiness test, so the two defects hid
each other: making the emptiness test honest on its own would have handed a
signed-in reviewer a failed hard gate with no stated cause, which is the shape a
previous release removed from the phase-close path. Both are fixed together.

The emptiness test now means what every caller already assumed, and the failure
sentence is chosen by a ladder whose last arm takes the remaining case instead
of testing for it, so no future failing state can fall through to silence.

**This is a guard, not a repair of a live misread, and the reachability was
measured rather than assumed.** Every live writer of a version row supplies
content: the authoring path falls back to the record's title, the approved-upload
path refuses an empty body outright, and both write adapters insert the record
and its first version in one transaction. The one helper that creates a record
with no version — whose own documentation states that a hollow record still
satisfies the gate — has no live callers today. So nothing in the product
currently reaches the cleared-by-silence state. What this change buys is that
wiring that helper up, which its name invites, can no longer silently open a
hard gate on the phase that the end-to-end path is currently blocked at.

## Layer Impact

Lane: `global-control-lane` — shared control-plane behaviour for all clients,
not flag-gated and not client-scoped.

- One new pure module owns the report-text derivation and the failure sentence.
  The gate evaluator calls it in two places instead of restating both inline.
- No schema change, no new table or column, no migration.
- No change to any authorization decision, to which criteria a phase declares,
  to any criterion's severity, or to the set of criteria evaluated.
- No canonical-model, adapter, or intake change. No product surface is edited.

## Client Applicability

- All clients: yes. Not flag-gated; the gate evaluator serves every client.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/programs/discovery-report-readiness.ts` — **new.** Two pure
  functions: the report-text derivation, which drops blank halves before joining
  so that "nothing readable" returns the empty string; and the failure sentence
  for the readiness criterion, exhaustive by construction. The module documents
  why the final arm is defensive and not reachable from today's caller, so it is
  not later mistaken for a live sentence.
- `src/lib/programs/governance.ts` — two call sites replace two inline
  derivations. The three existing sentences are preserved byte-for-byte, and the
  arm order is rearranged only where the arms are provably disjoint: with no
  report record the text is empty, so no hard-gap pattern can match.
- `src/lib/programs/__tests__/discovery-report-readiness.test.ts` — **new**, 14
  cases on the module.
- `src/lib/programs/__tests__/governance-evaluate-gates.test.ts` — one case
  appended, at the gate level, proving the change reaches the criterion's
  verdict and that the verdict carries a reason.

No workflow file is touched. Both new test files land in directories already
swept by required checks, so every case is merge-blocking without a workflow
edit. One generated file — the test CI coverage census — is regenerated; see
QA / Validation for the split between this change's count and drift inherited
from the base.

## QA / Validation

- `npx jest src/lib/programs/__tests__/discovery-report-readiness.test.ts` —
  **PASS**, 14 of 14.
- `npx jest src/lib/programs/__tests__/governance-evaluate-gates.test.ts` —
  **PASS**, 53 of 53 (52 pre-existing, 1 new).
- `npx jest src/lib/programs/__tests__` — **PASS**, 180 suites, 2,376 of 2,376.
- `npm run test:behaviors` — **PASS**, 208 suites, 2,162 of 2,162.
- `npx jest src/__tests__/integration/programs/full-lifecycle-crawl.test.ts` —
  **PASS**, 3 of 3 run, 12 skipped as on the base.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit` —
  **PASS**, exit 0.
- `npx eslint` over all four changed files — **PASS**, exit 0, no warnings.
- `npm run audit:test-ci-coverage:write` — **PASS**. This change adds one test
  file, so its own contribution is `+1`. The committed census on the base reads
  2,869 while a regeneration in a clean detached worktree of that same base
  commit reads 2,871, so the base carries `+2` of inherited drift. The
  regenerated file therefore reads 2,872 and the diff shows `+3`: one number is
  this change's, two are the base's. Measured in a clean worktree of the base
  rather than in this branch, because a branch's own committed test files would
  read one high.
- `npm run audit:tenancy-fence-coverage:write` — **PASS**, no new gap and no
  generated file changed.
- `npm run release:check -- --base origin/main --head HEAD` — **PASS**.
- **The defect was proven before it was fixed, not asserted.** A probe at the
  gate level — a signed-off report record with no version row — was run against
  the unmodified evaluator and the criterion was **absent from the failed
  checks**, i.e. it passed. The same fixture after the change fails as hard with
  the new sentence. The probe was then rewritten as the committed case.
- **Mutation testing: 6 applied, 6 killed.** Each mutation asserted its pattern
  matched exactly once before being applied, and every run's total was compared
  against the 67-case baseline so a changed total could not be read as a kill.
  Restoring the original unfiltered join, which is the defect itself (6
  failures); deleting the unreadable-content arm (2); collapsing that arm onto
  the no-record sentence, so the two states stop being distinguishable (3);
  dropping the lowercasing (7); the evaluator no longer setting a failure
  sentence (2); and — the one that matters most — **the evaluator reverting to
  the inline join while the module stays correct, which fails the gate-level
  case and is the proof that the module's answer reaches the criterion's
  verdict rather than sitting unread** (1).
- **Which test coverage was absent before.** No case anywhere set a report
  record with an unreadable version: every existing fixture supplied real
  content, so a cleared-by-silence verdict was never exercised and the vacuous
  test was the suite's own baseline. The one pre-existing assertion on this
  criterion pins the hard-gap sentence, which is preserved unchanged and still
  passes.
- Prettier, judged per file in place in this tree rather than on a copy, since
  configuration resolves from the file's own directory. Both new files are
  prettier-clean as written. Of the two edited files, the census is generated
  and is written by its own tool; the remaining two were checked against the base
  and this change's added lines introduce no reformatting of their own.
- **NOT RUN:** `npm run test:e2e` — needs Playwright browsers and live
  credentials. **NOT RUN:** any live signed-in walk. See Known Gaps.

## Rollout Plan

Merge to main. No migration, no flag, no environment variable, no worker job,
no data backfill. It becomes active on the next routine Azure Container Apps
deploy of main through the repo-owned workflow; this change neither requires nor
triggers one.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`. Not
  invoked by this change.
- Shared runtime mutators: none. No Azure command is run by or for this change.
- Approved image digest: not applicable — no runtime update is requested.
- ACA runtime invariant: unchanged; no revision, traffic weight, or Container App
  template is touched.
- Worker image invariant: unchanged; no worker job is touched.
- Feature/env flag update path: not applicable; no flag or environment variable.
- Live signed-in proof required: **yes**, and still owed. See Known Gaps.

## Rollback Plan

Revert the squash commit. The change is one new pure module plus two call sites
that previously held the same logic inline; reverting restores the prior
derivation exactly. Nothing is written, nothing is migrated, and no stored value
changes shape, so there is nothing to unwind. The only behavioural difference to
restore is the permissive one.

## Audit Evidence

- The PR and its CI run.
- The required AI surface control catalog job's `src/lib/programs/__tests__`
  step, which runs both new files' cases.
- The mutation tally above, reproducible from the two named suites.
- The before-and-after probe described in QA / Validation.

## Known Gaps

- **Not live-proven.** No signed-in walk has been taken. The direction that
  matters on a walk is the regression one: a report that legitimately clears the
  phase must still clear it, and the three pre-existing failure sentences must
  still appear for their own states. All are asserted in tests but none observed
  on screen. Owed to Anand, alongside the walks still owed for the releases
  listed in the prior records.
- **The criterion remains a negative test, and that is deliberately not changed
  here.** Its passing arm is "readable, and no hard-gap language, and not
  conditional proceed", so any readable Discovery Report that merely avoids
  those words clears it — including one that records no proceed decision at all.
  A case written against that behaviour was deliberately withdrawn rather than
  shipped: requiring an affirmative clearance statement would make a hard
  criterion strictly harder to satisfy for reports that read as acceptable
  today, which could block the phase for a Move that passes now. That is a
  governance and product decision, not a defect fix, and it is owed to Anand as
  a decision rather than taken by this change. The defensive final arm of the
  new ladder exists so that making the criterion stricter later cannot
  reintroduce a failing state with no sentence.
- **The helper that can create a contentless record is still unwired, and still
  documents itself as gate-satisfying.** This change makes that wiring safe
  rather than removing the invitation. Retiring that helper, or giving it a
  content requirement, is the natural follow-on.
- **Two sibling readers of the same text were already safe and are unchanged.**
  Both require a positive pattern match, so the vacuity never altered their
  answer; they now receive an honest empty string instead of a bare newline,
  which cannot change a regex result. No behaviour change is claimed for them.
