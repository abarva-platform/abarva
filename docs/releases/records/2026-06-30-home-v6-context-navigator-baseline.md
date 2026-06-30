# 2026-06-30-home-v6-context-navigator-baseline — Home V6 Context Navigator Baseline

## Release ID

`2026-06-30-home-v6-context-navigator-baseline`

## Status

`candidate`

## Plain-English Summary

The Golden 100 Home V6 live gate passed with zero failures but left three warning-only answers that did not name the demo tenant in the opening. This release makes that opening deterministic for every Home V6 Claude-selected answer and records Home V6 as the frozen context navigator baseline once the three warning cases rerun cleanly in production.

## Layer Impact

- `global-control-lane`: tightens the shared Home V6 answer synthesis contract for all tenants using the Home V6 path.
- `public-demo`: makes demo-facing Home answers consistently open with the tenant-safe display name.

## Client Applicability

- All clients: all tenants using Home V6 receive the tenant-display-name opening requirement.
- Specific clients: Industrial Demo, Airline Demo, and Financial Services Demo are the targeted warning rerun scope.
- Internal only: none.
- Public/demo only: no.
- Feature flag: uses the existing Home V6 executive synthesis flags.

## Changes Included

- `src/lib/home/know/home-v6-executive-synthesis.ts`
- `src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts`
- `docs/home-know/HOME_V6_CONTEXT_NAVIGATOR_BASELINE_2026-06-30.md`
- `docs/releases/records/2026-06-30-home-v6-context-navigator-baseline.md`

## QA / Validation

- `pass`: `npx jest src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --runInBand` passed 11/11 tests.
- `pass`: `npx eslint src/lib/home/know/home-v6-executive-synthesis.ts src/lib/home/know/__tests__/home-v6-executive-synthesis.test.ts --max-warnings 0`.
- `pass`: `npm run release:check`.
- `not-run`: post-deploy targeted rerun of the three Golden 100 warning questions. This is required before the baseline can be called live-frozen.

## Rollout Plan

Merge to `main`, deploy through the canonical Azure Container Apps main deploy workflow, confirm the live revision receives 100% traffic, then rerun the three warning-only Home V6 questions against signed-in production sessions.

## Deployment Authority

- Repo-owned deploy workflow: ACA main deploy workflow on `main`
- Shared runtime mutators: none outside the approved workflow
- Approved image digest: assigned by the ACA deploy run
- ACA runtime invariant: required before declaring live
- Worker image invariant: required by the deploy workflow
- Feature/env flag update path: no new flag
- Live signed-in proof required: yes, targeted three-question warning rerun

## Rollback Plan

Revert this release commit and redeploy through the ACA main deploy workflow. The rollback restores the prior warning-only behavior for Claude answers that omit the tenant display name.

## Audit Evidence

- Pre-fix Golden 100 artifact: `/tmp/nexus-home-v6-readiness/audit-artifacts/home-v6-live-golden-100-2026-06-30`
- Pre-fix ZIP: `/Users/anand/Downloads/home-v6-live-golden-100-2026-06-30.zip`
- Post-fix targeted warning rerun artifact: pending after deploy

## Known Gaps

Live ACA deployment and the targeted three-question signed-in rerun are pending until this candidate lands on `main`.
