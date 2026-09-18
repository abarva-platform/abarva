# 2026-09-18-shared-shaper-dead-next-step-options — Delete the shaper options that promised a next step and delivered silence

## Release ID

`2026-09-18-shared-shaper-dead-next-step-options`

## Status

`candidate`

## Plain-English Summary

The shared answer shaper offered two settings — `requireNextStep` and `nextStepFallback` — that looked like a promise to make every answer end with something the reader can act on. Neither did anything. The feature they configured was deliberately removed in June, but the settings survived the removal, so a caller could switch them on and be told nothing had gone wrong while nothing was enforced.

This change deletes both settings and the plumbing that carried them, and adds a behavioural test that fails if the removed ending is ever put back. No user-visible output changes: the ending was already gone, only the misleading switches remained.

## Layer Impact

- `global-control-lane`: shared answer shaping used by every agent surface. The change is to the shaper's public input shape and to test coverage; the shaping behaviour itself is byte-identical before and after, proven by a same-scope suite baseline below.

## Client Applicability

- All clients: yes in the sense that the shared shaper runs on every agent answer — but no observable change, because the deleted settings had no effect on output.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/answer/shared-response-shaper.ts`: removes `requireNextStep` and `nextStepFallback` from `SharedResponseShapeInput`, removes the dead `requireNextStep` parameter from `findSharedResponseShapeIssues`, and records above the interface why they must not come back.
- `src/lib/agent/response-shape.ts`: removes both options from `ShapeAgentResponseOptions` and the pass-through into the shared shaper; corrects a comment that still named a "next-action fallback" as part of what this surface applies.
- `src/lib/answer/__tests__/shared-response-shaper.test.ts`: drops four `requireNextStep: true` arguments that no assertion depended on.
- `src/lib/agent/__tests__/response-shape.test.ts`: updates a case that asserted the *opposite* of the shipped behaviour and had been red on `main` ever since the ending was removed. Updated in place with the reason and a pointer to the June record, not deleted.
- `src/__tests__/behaviors/shared-shaper-no-manufactured-next-step.test.ts`: new behavioural suite over the real surface shaper.

## QA / Validation

Verified on clean `origin/main` (`60c80f4c7`) before any edit. `requireNextStep` was threaded into `findSharedResponseShapeIssues`, which never read it; `nextStepFallback` was read nowhere at all. No production caller passed either — the only callers were four test arguments that nothing asserted on.

**Why deletion and not reconnection.** The acceptance offered both. The ending these options configured was removed deliberately and that drop is recorded in `docs/releases/records/2026-06-27-tower-stock-closing-contract.md`, which also made plain `Next:` scaffolding a visible-answer-contract violation. A next step now comes from whatever produced the answer rather than from a shaper that would have to invent one. Reconnecting would put back the thing a shipped control refuses.

**A gap found while proving it, measured not assumed.** The visible-answer contract's `scaffolding_label_next` check is `/(?:^|\n)\s*Next:/i`. Driven directly, it refuses a bare `Next:` line and **accepts** `- Next:`, `* Next:` and `**Next:**` — and the bulleted form is exactly the one that was removed. So the contract is not the backstop for this; the new suite carries the weight itself and says so in a case of its own, which fails if the contract is ever widened, forcing a deliberate update instead of silent drift. Widening the contract regex is not done here: it changes a user-visible output gate and needs its own false-positive pass. Logged to the execution backlog as a new item.

**Test measurements**, all on the same scope before and after:

- New behavioural suite: 7 passed on unfixed code. Stated plainly — every case is a guardrail, because the append was already gone and only the type lied. What it can fail is a re-add, which is what the mutations below drive.
- `src/lib/agent/__tests__/response-shape.test.ts`: **2 failed / 44 passed before → 1 failed / 45 passed after**. The case this change fixes went red→green. The remaining failure is a different, untouched case about a placeholder wording, left open deliberately and recorded in the backlog.
- Scope baseline `npx jest src/lib/answer src/lib/agent`: **21 failing / 876 passing before → 20 failing / 877 passing after**, with a byte-identical failing-suite list (8 suites, same 8). The single moved test is the one above.
- Scope baseline `npx jest src/__tests__/behaviors`: 0 failing / 215 passing before → 0 failing / 222 passing after.

**Mutations — six, each caught.** Counts are the new behavioural suite, then `response-shape.test.ts`.

1. Re-add the removed bulleted ending: 4 failed / 3 passed, and 22 failed / 24 passed.
2. Re-add it as a bare label instead of a bullet: 4 failed / 3 passed, and 2 failed / 44 passed.
3. Append an unlabelled closing with no `Next:` token at all: 3 failed / 4 passed, and 3 failed / 43 passed.
4. Re-introduce a `missing_next_step` issue code with no append behind it — the half-reconnect that tells a caller a guarantee is running when nothing enforces it: 1 failed / 6 passed.
5. Widen the visible-answer contract to cover the bulleted form: 1 failed / 6 passed. This proves the gap-stating case is live rather than decorative.
6. The compile-time half. With the two options restored to both interfaces, a probe passing `requireNextStep: true` and `nextStepFallback` to both entry points **compiles clean, exit 0** — the defect, stated as a measurement. With them deleted, the same probe fails with two `TS2353` errors, one per entry point. The probe is not committed; it exists to measure the direction a runtime test cannot see.

**Gates**, each judged by exit code, not by grepping output:

- `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false` with `tsconfig.tsbuildinfo` removed beforehand: exit 0, no diagnostics.
- `npx eslint` over all five touched files: exit 0, no warnings.
- `node scripts/release-check.mjs --base origin/main --head HEAD`: exit 0.

The new suite sits in `src/__tests__/behaviors`, so it runs in the `Behavior coverage floor` CI job and inside `test:before-commit`. That placement is deliberate: the stale case this change repairs sat red for weeks in `src/lib/agent/__tests__`, which no routinely-run scope covers.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps deploy workflow builds and deploys on merge. No migration, no flag, no data build, no manual step.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`, triggered by the merge. No hand-run Azure command.
- Shared runtime mutators: none. This change does not touch env vars, flags, scale, secrets, traffic weights or the Container App template.
- Approved image digest: produced by the merge deploy run; recorded in the backlog and claim log after the run completes.
- ACA runtime invariant: to be proven after deploy — Container App template image equal to the 100%-traffic revision image, digest-pinned, revision Healthy.
- Worker image invariant: unchanged by this release; no worker job image is modified.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: **no**. There is no observable output change to prove — the shaping behaviour is byte-identical before and after, and the deleted options had no effect on any answer. The real proof is the compile-time refusal and the suite baseline above, both captured.

## Rollback Plan

Revert the PR. The change is additive-test plus a type narrowing; nothing persists state, no schema, no data. A revert restores the two unused options and the stale red case, and costs nothing else.

## Audit Evidence

- The PR and its CI run, including the `Behavior coverage floor` job executing the new suite.
- The before/after scope baselines and the six mutation results recorded in the QA section above.
- `docs/releases/records/2026-06-27-tower-stock-closing-contract.md` — the record of the original, deliberate removal this change finishes.
- `src/__tests__/behaviors/shared-shaper-no-manufactured-next-step.test.ts` — the standing guard.

## Known Gaps

- **The visible-answer contract still accepts a bulleted `Next:` closing.** Measured, not assumed, and stated in a test case rather than left implicit. Not repaired here: widening a user-visible output gate's pattern needs its own false-positive pass, and doing it inside a deletion would make both changes harder to review. Logged as a new execution-backlog item.
- **One case in `src/lib/agent/__tests__/response-shape.test.ts` remains red**, about which placeholder wording a scrubbed identifier is replaced with. It was red before this change and is untouched by it; it is a separate triage with its own backlog entry, and guessing at the answer would be the failure mode this whole work stream exists to stop.
- `findSharedResponseShapeIssues` is exported and has no caller outside its own module. Left alone deliberately — removing an export is a different change from removing a lying option, and bundling them would widen the review surface for no gain.
