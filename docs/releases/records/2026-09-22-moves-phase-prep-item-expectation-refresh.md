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
- The `<details>` block's own behaviour is asserted here only in the one state this test case drives. Other states of the panel are covered by the sibling suites in the same CI step, not by this case.
