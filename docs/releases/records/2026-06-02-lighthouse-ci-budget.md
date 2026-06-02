# 2026-06-02-lighthouse-ci-budget — Lighthouse CI Budget

## Release ID

`2026-06-02-lighthouse-ci-budget`

## Status

`candidate`

## Plain-English Summary

Adds a Lighthouse CI gate for public routes so Core Web Vitals and buyer-facing performance regressions are caught in pull requests.

## Layer Impact

- `public-demo`: Public homepage, contact, and sign-in route performance is now measured in CI.
- `global-control-lane`: Adds shared CI governance, npm script, and runbook for performance budgets.

## Client Applicability

- All clients: Shared CI gate applies to the control-plane repository.
- Specific clients: None.
- Internal only: CI operation and runbook.
- Public/demo only: Public route performance coverage.
- Feature flag: None.

## Changes Included

- `.github/workflows/lighthouse-ci.yml`
- `.lighthouserc.cjs`
- `docs/compliance/license-policy.json`
- `package.json`
- `package-lock.json`
- `docs/runbooks/lighthouse-ci.md`

## QA / Validation

- Passed: `npm run build`
- Passed: `npm run lighthouse:ci`
- Baseline measured: `/` performance `0.76`, LCP `899.5 ms`, CLS `0.747411`, TBT `0 ms`, speed index `207.8 ms`.
- Baseline measured: `/contact` performance `1.0`, LCP `768.0 ms`, CLS `0`, TBT `0 ms`, speed index `244.0 ms`.
- Baseline measured: `/sign-in` performance `1.0`, LCP `752.9 ms`, CLS `0`, TBT `0 ms`, speed index `205.2 ms`.
- Passed: `npm run release:check -- --base origin/main --head HEAD`
- Passed: `git diff --check`
- Passed: `npm run secrets:staged`
- Passed: `npm run compliance:supply-chain` after adding the `parse-cache-control@1.0.1` dev-only transitive license exception required by `@lhci/cli`; result was `0 denied`, `0 unclassified`, `43 review`, `4 exceptions`.

## Rollout Plan

Merge to `main`. GitHub Actions will run the Lighthouse CI budget on pull requests and manual workflow dispatches.

## Rollback Plan

Revert the PR to remove the workflow, LHCI config, npm script, dependency, runbook, and release record.

## Audit Evidence

- PR URL: Pending.
- CI run: Pending.
- Lighthouse reports: `audit-artifacts/performance/lighthouse/` artifact from the workflow.

## Known Gaps

Thresholds are intentionally conservative for the first gate. The homepage CLS baseline is currently high, so the CLS threshold is a regression ceiling and should be tightened after the underlying layout shift is fixed. `@lhci/cli` introduces `parse-cache-control@1.0.1`, a dev-only transitive package with no license metadata in `package-lock.json`; it is recorded as a named license-policy exception pending review.
