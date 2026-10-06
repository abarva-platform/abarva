# 2026-09-18-ask-model-input-hash-hook - Ask Model Input Trace Hook

## Release ID

`2026-09-18-ask-model-input-hash-hook`

## Status

`candidate` - local change only; not merged or deployed.

## Plain-English Summary

The Intelligence Ask response trace now records a SHA-256 hash of the system and user input passed to answer generation. The route uses the existing model-input callback, so a successful answer no longer receives the no-model-call marker when generation actually ran. Prompt text is not added to the trace.

## Layer Impact

Layer 4 PRODUCTS, `global-control-lane`: this changes the Intelligence Ask observability hook. It does not change canonical facts, retrieval, prompts, generated answers, or tenant data.

## Client Applicability

- All clients: Applies to successful Intelligence Ask responses that use the shared generation path.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None added.

## Changes Included

- `src/app/api/intelligence/ask/route.ts`: hash each model-input callback and retain the latest hash for the response trace.
- `src/__tests__/integration/intelligence/model-input-hash-route.test.ts`: exercise the POST handler, generation callback, rendered response, and emitted trace.

## QA / Validation

- `failed before fix`, then `passed after fix` - focused route integration test. Before the hook was assigned, the emitted trace contained `no_model_call` despite the generation callback.
- `passed` - mutation check: replacing the callback assignment with a no-op made the focused test fail at the hash assertion; the assignment was restored and the test passed.
- `passed` - scoped ESLint on the route and focused test.
- `passed` - `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`.
- `passed` - `npm run release:check`.

## Rollout Plan

After review and merge, the repository-owned Azure Container Apps main deploy workflow builds and deploys the web image. No data build, migration, or flag change is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` after merge.
- Shared runtime mutators: None in this candidate.
- Approved image digest: Assigned by the deploy workflow after merge.
- ACA runtime invariant: Verify after deployment before claiming the change live.
- Worker image invariant: Verify after deployment under the existing release process.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, for an Intelligence Ask answer and its emitted trace after deployment.

## Rollback Plan

Revert the route hook through the normal review and main deploy workflow. No data rollback is required.

## Audit Evidence

The focused test's red and green runs, mutation run, scoped lint, TypeScript result, release gate output, and this worktree diff provide local candidate evidence. Deployment and signed-in proof remain pending.

## Known Gaps

The no-model-call marker remains for paths without a model-input callback. Live trace readback awaits a merged deployment and authenticated verification.
