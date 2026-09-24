# 2026-09-24-t756-rebaseline-stale-expectations — Re-baseline two dark expectations, recover a lost spend binding, wire both suites

## Release ID

`2026-09-24-t756-rebaseline-stale-expectations`

## Status

`candidate`

## Plain-English Summary

Two test files carried expectations that no longer matched the product, and both ran in no CI job, so nobody saw them. Item T-756 asked for them to be re-baselined against the changes that made them stale, with the reason written into each file, and explicitly forbade deleting or weakening either to make a count fall.

Re-baselining the first case **as a whole**, which the item required rather than editing the one string in the error message, is what made this more than a tidy-up. That case failed at its first assertion, so the thirteen assertions after it had not run since 2026-09-18, and **seven of the fourteen were wrong**. Six were behind a deliberate, release-recorded change to how record-type aliases are counted and how the copy is worded. The seventh was not stale at all: it asserted a vendor contract sizing to a currency figure from a payload field, a binding that was added deliberately in an earlier PR and then lost as collateral damage when a bad merge left two copies of the same function in the file and a later commit correctly deleted the dead one. Re-baselining that assertion down to "not sized" would have been weakening a test to bless a regression, so the binding is restored instead and the assertion stands.

With both suites green, the quarantine entries holding them out of CI say only that they are red — which is no longer true — so both are wired into the pull-request job and the exemptions are retired rather than left to outlive the fact that justified them.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 (Products): one read model regains a payload field in its spend-sizing fallback chain, so a contract carrying that field sizes to a figure instead of rendering "Not sized". No other product behavior changes.
- Layer 3 (Canonical model): unchanged. No schema, migration, projection, or canonical object changes.
- Layers 1-2: unchanged. No intake template, adapter, or tenant dataset changes.
- Test/CI tooling: two previously dark suites now run on every pull request; three control suites and one workflow move with them.

## Client Applicability

- All clients: yes, for the read-model change. Any tenant whose promoted vendor contracts carry the restored payload field will see a sized figure where the surface previously showed "Not sized".
- Specific clients: none singled out.
- Internal only: no. The read model has three non-test importers, including an internal diagnostics route and the pilot dashboard aggregates.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-context/intelligence-read-model.ts` — restore two payload reads in the vendor-spend fallback chain, in the position the original PR gave them, with the loss recorded in a comment beside them.
- `src/lib/enterprise-context/__tests__/intelligence-read-model.test.ts` — re-baseline the composite case as a whole with the reason recorded above it, one reason per moved expectation; add a parameterized case pinning each of the eight contract-side spend keys on its own, a case for the renewal-side key, and a case proving an unrecognized key still leaves a contract unsized.
- `src/lib/source/contract-evidence/__tests__/templates.test.ts` — re-baseline the ordered evidence-family list against the commit that prepended a family, with the reason recorded. The assertion stays an ordered deep compare.
- `.github/workflows/unit-suites.yml` — name both suites in the two existing steps that already own their directories, and update the per-step comments that counted the quarantines.
- `src/__tests__/behaviors/enterprise-context-ci-coverage.test.ts` — move one file from quarantined to green; the census split becomes eight-green, one-red.
- `src/__tests__/behaviors/source-contract-suite-ci-coverage.test.ts` — remove the retired quarantine entry and add the file to the owned list; the directory's covered count moves 1 to 2.
- `src/__tests__/behaviors/t754-credited-suite-wiring.test.ts` — record the discharge of two held rows as an executable constant, with a case per path asserting each is now reached by exactly one pull-request command and is absent from the unrun set.

**`docs/architecture/t475-stale-suite-triage.json` is deliberately byte-identical.** It is the prior item's audit artifact; its own `forbiddenEdits` field records that the triage writes a verdict and hands it on, and a sibling control pins the case titles each verdict was written about. The recorded verdicts stay as they were drawn. What changed is the state of the world, and that is recorded in the control that measures it every run.

## QA / Validation

**Re-verified on `origin/main` before anything was written**, at `4a2f80f0a`, in a fresh worktree: 2 suites, 2 failing, 30 tests, and both failures exactly the two the item names.

**Red first, then the fix, then the fix broken deliberately.** The re-baselined expectations were written before the runtime change: six of the seven then passed and the case failed at exactly one assertion, the regression. That is what separated the two halves of the case by measurement rather than by reading.

**Ten mutations, nine caught and one required to stay green.** Each was applied to a copy, the subject restored, and the restore verified byte-identical by sha256; the harness aborts if a mutation is a no-op, because a no-op mutation and a real coverage gap are indistinguishable from the delta alone.

| # | mutation | expected | result |
|---|---|---|---|
| M1 | remove the contract-side restored payload read | fail | 2 cases fail: the composite case and the one parameterized case for that key |
| M2 | remove the renewal-side restored payload read | fail | exactly 1 case fails, the renewal case |
| M3 | rename the evidence family the re-baselined list pins | fail | 1 case fails |
| M4 | re-add the record type the alias separation excluded from applications | fail | 2 cases fail, including the prior item's own exclusion case |
| M5 | re-add the record type the alias separation excluded from data domains | fail | 1 case fails |
| M6 | move the restored payload read to the end of the chain | **pass** | 37 of 37 green — the assertion pins presence, not position |
| MD1 | list the still-red third held suite as discharged | fail | 4 cases fail |
| MD2 | drop a discharge entry while the workflow still wires that path | fail | 2 cases fail |
| MD3 | un-wire a discharged path while it stays listed as discharged | fail | 2 cases fail |
| MD4 | shorten a discharge reason to a bare note | fail | 1 case fails |

M1 and M2 are the load-bearing pair: the eight spend keys are asserted one per case, and removing the restored key fails **exactly one** of the eight. That is what makes the new parameterized case non-vacuous and localizes the loss to precisely the two lines the original PR added.

**Wiring proven by mutation in two independent places, not asserted.** Removing the two added path lines from the workflow moves the census's workflow-reached count from 1973 to 1971 and its pull-request-reached count from 1970 to 1968 — exactly two in both, and the workflow was restored byte-identical afterwards. Measured independently against a separate worktree at `origin/main`, which reads 1971 and 1968. The three census-consuming control suites agree per-directory rather than only in the total.

**Scope baselines, measured on a separate worktree at `origin/main` rather than asserted, same condition both sides:**

- `src/lib/enterprise-context`, `src/lib/pilot-dashboard`, `src/lib/source/contract-evidence`: 14 suites / **3 failing** / 79 tests before, 14 suites / **1 failing** / 89 tests after. The one remaining failing suite is the third held row, identical at base, red for a reason that is a retire-or-re-wire decision and not a re-baseline.
- `src/__tests__/behaviors` (the CI-gated scope): 117 suites / 0 failing / 1078 tests before, 117 / 0 failing / 1079 after.

`NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` after removing `tsconfig.tsbuildinfo`: **exit 0 judged by exit code**, 0 diagnostics emitted. ESLint over every changed scope: exit 0.

**No signed-in acceptance is claimed.** One is owed and is named in Known Gaps.

## Rollout Plan

Merge to `main` through a pull request with squash merge, then the repo-owned ACA main deploy workflow builds and deploys the image from that SHA. No migration, loader job, data build, or flag change. The CI change takes effect on the next pull request.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none in this change. No `az containerapp` command is run by hand.
- Approved image digest: assigned by the deploy workflow for the merge SHA; not known before merge.
- ACA runtime invariant: to be proven from the deploy run's own `runtime-invariant-proof.json` after merge — template image, the sole 100%-traffic revision, and both worker job images equal to one digest.
- Worker image invariant: same proof.
- Feature/env flag update path: none.
- Live signed-in proof required: **yes**, and it is owed rather than done. See Known Gaps.

## Rollback Plan

Revert the pull request and redeploy the prior approved digest through the repo-owned workflow. No data rollback applies — nothing is written, migrated, or reloaded. The single runtime line can be reverted on its own without touching the test or CI changes, which is why it is one contiguous edit in one function.

## Audit Evidence

- The pull request, its check runs read at the head OID, and the squash SHA.
- The mutation table above, reproducible from the harness described in the pull request body.
- The census counts before, after, and under the wiring mutation.
- The deploy run's `runtime-invariant-proof.json` once the deploy completes.

## Known Gaps

1. **A live signed-in acceptance is owed and is not claimed.** The restored payload read changes what a product surface displays for any tenant whose promoted vendor contracts carry that field: a sized currency figure where the surface previously read "Not sized". The read model is reached by an internal diagnostics route and the pilot dashboard aggregates. Nothing here was verified against a deployed, signed-in session, and this record does not imply that it was.
2. **The restored field's relationship to the other annual-value field on the same object is not settled here.** Two differently-named fields can each carry an annual value for one contract, and this change restores one read into an ordered fallback chain exactly where the original PR put it. Which field should win when both are present is a data-contract question this item did not open and did not answer.
3. **One record type is excluded from the data-domain count by a decision documented in prose only.** The earlier change's release record states the exclusion as a class — adjacent but distinct types are not counted — but its parameterized alias table has no row for this particular type. The re-baselined composite case now pins the resulting count, and mutation M5 proves that pin has teeth, so the exclusion is executable for the first time. Whether it is the *intended* exclusion rather than an omission is a product question and is not asserted either way.
4. **The third held row is untouched and stays quarantined.** Its suite is red because the local dataset roots its loader reads were deleted when the canonical tenant input standard replaced them. Retiring the module or re-wiring it against a canonical dataset is a decision, not a re-baseline, and it belongs to its own open item.
5. **The committed test-CI-coverage census is not refreshed here.** This change moves the measured count, so the committed file is two further out of date. Refreshing it is the explicit subject of a separate open item whose acceptance requires the drift check to be wired into a workflow in the same change; refreshing it alone would be true for one day. The drift check runs in no workflow today, so nothing fails on it.
6. **One run of the CI-gated scope showed three additional failures that did not reproduce.** All three were suites that enumerate the test tree and then read each file, which is the shape a prior item repaired at its single known producer while naming the remaining intolerance as a residual. Two later full runs of the same scope were clean at 117 suites and 0 failing. Named because it was observed, not because it was diagnosed.
