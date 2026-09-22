# 2026-09-22-moves-phase-prep-item-expectation-refresh — Moves phase build prep-item expectation refresh

## Release ID

`2026-09-22-moves-phase-prep-item-expectation-refresh`

## Status

`candidate`

## Plain-English Summary

One test case for the Moves phase build panel had been failing on `main` because the panel's wording changed in August and the test still looked for the old wording. The panel itself is correct — it still tells a reader how many preparation items are carrying forward into the next phase, and that those items do not block the current build. This change re-points the test at the words the panel actually shows today, and records next to each expectation why it was changed.

It also adds that test file to a continuous-integration job that can block a merge. Until now no job ran it at all, which is why a failing case could sit on `main` without anyone being told.

## Layer Impact

- **Release lane:** `internal-admin`
- **Layer 4 Products:** No product behaviour changes. The rendering component is byte-identical; only its test file and one workflow file changed.
- **Platform tooling:** One additional test file is now executed by a required status check.

## Client Applicability

- All clients: No client-visible change.
- Specific clients: None.
- Internal only: Yes — test and CI wiring only.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — two expectations in `wires phase workspace v2 task actions to the existing Files and gate controls` re-pointed at the current render, each with its reason recorded inline.
- `.github/workflows/ai-surface-control-catalog.yml` — that suite added by exact path to the existing `Exercise Moves visible AI liability controls` step.
- `src/__tests__/behaviors/t471-stale-suite-triage-ci-coverage.test.ts` — one case re-pointed, with its reason recorded inline. See *Two consequences of the wiring* below.
- `docs/architecture/test-ci-coverage-census.json` — regenerated, because the wiring changes the coverage shape the committed artifact describes.

### Two consequences of the wiring, both caught by CI on the first run and both repaired rather than silenced

Wiring the suite moves `src/components/strategic-moves/__tests__` from partially covered to fully covered, and two required-check cases were pinned to its previous state.

**The census artifact.** `docs/architecture/test-ci-coverage-census.json` describes the repository's coverage shape, and a shape change without a refresh is an enforced failure. Regenerated with `npm run audit:test-ci-coverage:write`. The counts attributable to this change are exactly one file: covered 1851 → 1852, uncovered 522 → 521, untriaged-unrun 472 → 471, one directory moving from partial to fully covered, and `criticalGovernedRiskDirectories` 2 → 1.

The same refresh also absorbs **pre-existing** count drift this change did not cause and is not claiming credit for: `testFiles` 2366 → 2373 and `coveredTestFiles` 1844 → 1851. Measured, not assumed — running the census on this branch with only the workflow edit reverted still reports `committed census is STALE: testFiles 2366 -> 2373 (+7); coveredTestFiles 1844 -> 1851 (+7)` while reporting `coverage shape matches`. Count drift is reported and never enforced, which is why it was invisible; the shape check is the one that gates, and it was green on `main`. That standing gap is backlog item T-587's, not this record's.

**One behavioral case used this directory as its live example.** `t471-stale-suite-triage-ci-coverage.test.ts` holds a real property — a file a workflow leaves out by omission is a human triage decision that leaves nothing machine-readable, so it must stay counted as untriaged rather than credited as a declared quarantine — and it pinned that property to `src/components/strategic-moves/__tests__`, where a workflow named 13 green siblings and omitted this one. Closing the red cases removed the example.

The property is kept and the example is now **derived from the census** rather than pinned to a directory that can be wired out from under it: every partially covered directory whose coverage arrives `via: ["command"]` with zero declared quarantines must still report every omitted file as untriaged. Eighteen directories match today. The case asserts the candidate set is non-empty first, so it cannot pass vacuously if that shape ever disappears — which is the failure mode that would otherwise replace one silent red with one silent green.

Nothing was deleted, loosened or quarantined to get green.

### Why the two expectations were wrong, and why the previous reading of them was wrong

The expectations read `1 required next-phase prep item` and `These items are carried forward as next-phase preparation`. Commit `adfb848d9` (2026-08-22) rewrote that block in `src/components/strategic-moves/PhaseApproveAndBuild.tsx`, collapsing it into a `<details>` element; its release record, `2026-08-22-moves-phase-build-simplification`, states the change "only simplifies how the phase build state is presented" and does not change approval semantics or gate policy. The product copy moved and these two expectations did not.

A previous pass recorded in this file that the block "does not render in this state at all" and left the case red on that basis. That reading was wrong, and the mechanism is recorded in the test file because it will mislead the next reader too: the summary line is emitted as four sibling text nodes (`{count}`, ` prep item`, the plural suffix, ` carrying forward`), so the copy is present in the DOM but satisfies no matcher written against the old single-phrase wording.

Neither replacement is a loosened matcher. The first still asserts the count and the carry-forward meaning together; the second keeps the load-bearing half of the sentence — that these items do **not** block this build — rather than matching the lead-in alone. Both fail on an empty render, which is proven by mutation 1 below.

## QA / Validation

Baseline over the same scope, measured on both sides rather than quoted as an absolute:

| scope | clean `origin/main` `7e2baef87` | this branch |
|---|---|---|
| `npx jest --runTestsByPath src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` | **1 failed, 75 passed, 76 total** | **0 failed, 76 passed, 76 total** |
| `npx jest src/components/strategic-moves` | 19 suites, **1 failed, 197 passed, 198 total** | 19 suites, **0 failed, 198 passed, 198 total** |

The single failure on the clean side is exactly the case repaired here; no other count moved.

Red first: the case is red on unmodified `main`, which is the starting state above, not a red manufactured for this record.

**Three mutations of the rendering component, each caught, each restored byte-identical (`git diff` clean afterwards):**

1. Suppress the whole `<details>` block (`{hasEvidenceGuidanceGaps && (` → `{false && hasEvidenceGuidanceGaps && (`) — 1 failed / 75 passed. This is the proof that neither matcher passes on a render that omits the block.
2. Report the wrong count (`{requiredGaps.length}` → `{requiredGaps.length + 1}`) — 1 failed / 75 passed.
3. Drop the non-blocking half of the body sentence, keeping the lead-in — 1 failed / 75 passed. This is the proof that the second matcher is not satisfied by the lead-in alone.

**The full CI step, run locally exactly as the workflow issues it** (14 paths, `--runInBand`): 14 suites / 143 tests passed. Before this change the step ran 13 suites / 67 tests.

**The two required-check cases the wiring moved**, each mutation-proved against the control under test, `scripts/quality/test-ci-coverage-census.mjs`, which was restored byte-identical afterwards:

- `npx jest --runTestsByPath src/__tests__/behaviors/t471-stale-suite-triage-ci-coverage.test.ts src/__tests__/behaviors/test-ci-coverage-census.test.ts` — **2 suites / 48 tests passed**.
- Mutation A, credit any unrun file as a declared quarantine (`hits.length === 0 && named.length > 0` → `hits.length === 0`) — **1 failed / 6 passed**.
- Mutation B, under-report the untriaged remainder by one — **1 failed / 6 passed**.

**The whole required directory, to prove no other ratchet moved:** `npx jest src/__tests__/behaviors --no-coverage --ci` — **104 suites / 866 tests passed, exit 0**.

- `node scripts/quality/check-named-suite-requiredness.mjs` — exit 0. The hosting job `AI surface control catalog` is a required status check on the `main` ruleset, read live from `GET /repos/abarva-platform/abarva/rulesets/17227397`.
- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` — **exit 0**, judged on the exit code, with `tsconfig.tsbuildinfo` removed first; 0 `error TS` lines.
- `npx eslint src/components/strategic-moves/__tests__/MovesPhaseStandaloneClient.test.tsx` — exit 0.

## Rollout Plan

Merge to `main` through the normal pull-request process. The repo-owned ACA main deploy workflow may rebuild the web image after merge; nothing in this change reaches a runtime surface.

## Deployment Authority

- Repo-owned deploy workflow: The only approved path if a main deploy runs after merge.
- Shared runtime mutators: None. No `az` command is issued by this change.
- Approved image digest: Not applicable until the repo-owned deploy workflow builds from `main`.
- ACA runtime invariant: Required if a main deploy is produced; not claimed in this record.
- Worker image invariant: No worker image changes.
- Feature/env flag update path: None.
- Live signed-in proof required: **No, and none is owed.** No file outside a test directory and a workflow file is in the diff, so no client-visible surface can reach this change.

## Rollback Plan

Revert the commit. No data, migration, tenant, artifact or runtime rollback applies. Reverting restores both the old expectations and the previous 13-path CI step.

## Audit Evidence

- The pull request and its check run for this branch.
- The `AI surface control catalog` job log, where the step `Exercise Moves visible AI liability controls` names the added file by exact path and reports its test count.
- `docs/releases/records/2026-08-22-moves-phase-build-simplification.md`, the record for the product change that moved the copy.

## Known Gaps

- This does not change the phase build panel, its approval semantics, or its gate policy. The component file is untouched.
- The census refresh here is mechanical — the shape change this wiring forces, plus whatever count drift had accumulated. It is **not** the artifact review and twenty-file triage draw that backlog item T-587 asks for, and it does not close that item.
- The `<details>` block's own behaviour is asserted here only in the one state this test case drives. Other states of the panel are covered by the sibling suites in the same CI step, not by this case.
