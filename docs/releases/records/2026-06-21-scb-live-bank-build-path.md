# 2026-06-21-scb-live-bank-build-path — Live Answer Bank Build-Path Hardening

## Release ID

`2026-06-21-scb-live-bank-build-path`

## Status

`candidate`

## Plain-English Summary

This keeps the Consilium live-answer eval bank intact while moving its heavy case corpus out of the production Next.js build path and out of the control-plane tenant-purity scan surface. The web runtime still exposes the lightweight checker and validator contracts, and the eval/test path still validates the full bank.

## Layer Impact

- `experimental`: Shared Context Brain live-answer eval plumbing only. No tenant-facing answer behavior is changed by this patch.
- `global-control-lane`: Production build configuration now excludes the eval bank corpus from the app typecheck so ACA image builds can complete reliably.

## Client Applicability

- All clients: No visible behavior change.
- Specific clients: None.
- Internal only: Eval harness and CI/runtime build reliability.
- Public/demo only: None.
- Feature flag: No new flag; existing SCB flags remain default-off unless separately flipped.

## Changes Included

- `src/lib/intelligence/answer/evals/live-answer/index.ts` keeps only lightweight exports.
- `src/lib/intelligence/answer/evals/live-answer/bank.ts` owns a lightweight bridge to `LIVE_ANSWER_CASES` for eval tests/runners.
- `evals/intelligence/live-answer/cases/*` owns the tenant/example-heavy live-answer corpus outside `src/lib`.
- `src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts` imports the case bank directly.
- `tsconfig.json` excludes the live-answer bank bridge, cases, and local test file from production app typecheck.

## QA / Validation

- `npm test -- src/lib/intelligence/answer/evals/live-answer/__tests__/live-answer-bank.test.ts --runInBand` — passed, 5/5 tests.
- `npm run audit:control-plane-purity:check` — passed at baseline counts.
- `NODE_OPTIONS=--max-old-space-size=6144 npm run build` — passed locally through compile, TypeScript, page data, and static generation.
- `git diff --check` — passed.

## Rollout Plan

Merge to `main`, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the new image. No manual ACA mutation is required.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA rollout.
- Shared runtime mutators: None in this PR.
- Approved image digest: Captured by the main deploy workflow after merge.
- ACA runtime invariant: Verified by the main deploy workflow after merge.
- Worker image invariant: Verified by the main deploy workflow after merge.
- Feature/env flag update path: None.
- Live signed-in proof required: Not required for this build-path-only patch; required for later SCB flag flips.

## Rollback Plan

Revert this PR or roll ACA traffic back to the previous healthy revision if the main deploy workflow reports a runtime issue.

## Audit Evidence

- Local eval bank test output.
- Local production build output using the Docker-equivalent `NODE_OPTIONS=--max-old-space-size=6144`.
- Main deploy workflow evidence after merge.

## Known Gaps

This does not flip SCB surface flags, run the env-gated live model eval, or prove signed-in SCB answers. Those remain separate closeout items.
