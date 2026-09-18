# 2026-09-18-tower-palette-lens-destinations — Match shortcuts to Tower views

## Release ID

`2026-09-18-tower-palette-lens-destinations`

## Status

`candidate`

## Plain-English Summary

Three command-palette shortcuts promised different Tower views but all opened the same landing. Each now opens the named view using Tower's existing tab and view URL contract.

## Layer Impact

- `global-control-lane`, Products layer: shared navigation and its behavior test only. No intake, adapter, canonical model, schema, or tenant data changes.

## Client Applicability

- All clients: yes, through shared signed-in navigation.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Point Value, Spend, and Actions shortcuts to their existing Tower subviews.
- Require distinct destinations and verify palette clicks navigate to them.

## QA / Validation

- The updated behavior suite failed on the original links: 4 failed, 8 passed.
- The focused palette and Tower URL-state suites passed after the change: 2 suites, 18 tests.
- Broader behavior, lint, TypeScript, release check, and PR CI results are recorded with the PR.
- Signed-in acceptance remains owed after deployment.

## Rollout Plan

Squash-merge through a PR. The repository-owned ACA main deploy workflow builds the exact merge SHA and shifts traffic after health checks. No migration or data job is required.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none outside that workflow.
- Approved image digest: generated from the merge SHA by the workflow.
- ACA runtime invariant: verify template, 100%-traffic revision and required workers share that digest.
- Worker image invariant: unchanged in code; read back after deploy.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: yes; open each palette shortcut and confirm its active Tower tab and view.

## Rollback Plan

Revert the PR through the normal release lane. If a Tower view changes its URL contract, update the destination and behavior test together.

## Audit Evidence

- Red/green palette test, Tower URL-state test, PR and CI checks, exact-SHA ACA readback, and later signed-in view check.

## Known Gaps

- Signed-in acceptance is reserved for the human operator and remains owed.
- This does not change Tower data or chart content.
