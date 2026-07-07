# 2026-06-03-demo-environment-readiness - Synthetic Demo Environment Readiness

## Release ID

`2026-06-03-demo-environment-readiness`

## Status

`candidate`

## Plain-English Summary

Adds a deterministic readiness gate for the synthetic demo environment. Apex
Retail, Meridian Health System, and First Capital Financial are now represented
as rehearsal-eligible synthetic tenants with dataset roots, loader keys, reset
commands, and a verification command. First Capital is no longer treated as a
shell-only demo under the legacy `arcturus` alias.

## Layer Impact

`public-demo`: defines the committed synthetic data foundation used for sales,
investor, and internal product demos.

`ops-release-lane`: adds an operator runbook and manifest that distinguish
repo-controlled demo readiness from hosted `demo.abarva.com` evidence.

`app-control-lane`: updates the demo dataset registry and its integration tests;
no private data-plane implementation or real client data loading is performed.

## Client Applicability

- All clients: no direct client runtime change.
- Specific clients: none; the tenants are synthetic rehearsal tenants only.
- Internal only: AbarVa operators use the verifier and runbook before demos.
- Public/demo only: applies to demo posture and demo readiness evidence.
- Feature flag: none.

## Changes Included

- `src/lib/demo/demo-dataset-registry.ts`
- `src/__tests__/integration/demo/demo-dataset-registry.test.ts`
- `scripts/demo/verify-demo-environment-readiness.ts`
- `package.json`
- `docs/demo/DEMO_ENVIRONMENT_OPERATIONS.md`
- `docs/build/DEMO_ENVIRONMENT_READINESS_MANIFEST.md`
- `docs/build/DEMO_DATASET_REGISTRY.md`
- `docs/releases/records/2026-06-03-demo-environment-readiness.md`

## QA / Validation

- Pass: `npm run demo:environment:verify`
- Pass: `npx jest src/__tests__/integration/demo/demo-dataset-registry.test.ts --runInBand`
- Pass: `npx eslint scripts/demo/verify-demo-environment-readiness.ts src/lib/demo/demo-dataset-registry.ts src/__tests__/integration/demo/demo-dataset-registry.test.ts`
- Pass: `git diff --check`
- Pass: `npm run release:check -- --base origin/main --head HEAD`
- Note: focused Jest emitted the repo's pre-existing duplicate manual mock warnings for `mdast-util-from-markdown`, `mdast-util-gfm`, and `micromark-extension-gfm`; the target suite passed.

## Rollout Plan

Merge to `main` through the protected PR path. The verifier becomes available
to operators as `npm run demo:environment:verify`. Hosted domain, Clerk user,
and nightly reset scheduling remain separate environment steps.

## Rollback Plan

Revert the PR to restore the prior demo registry and remove the verifier and
runbook. No migrations, hosted routing, or private data-plane operations are
included.

## Audit Evidence

- PR URL after opening.
- Local verifier output in the PR.
- Required GitHub checks after CI runs.
- Future hosted evidence: `demo.abarva.com` browser smoke, Clerk demo user
  smoke, and nightly reset logs.

## Known Gaps

- Does not provision `demo.abarva.com`.
- Does not create Clerk demo users or corporate SSO rehearsal accounts.
- Does not run the live nightly scheduler.
- Does not load or mutate any private client data plane.
