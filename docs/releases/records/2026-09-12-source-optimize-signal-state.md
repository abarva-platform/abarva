# 2026-09-12 — Source Optimize signal-state display

## Release ID

`source-optimize-signal-state-2026-09-12`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now shows one contract Optimize lever table. Signal-stage
opportunities are displayed as `Not sized` until the required evidence is
loaded, even if an upstream row contains a candidate amount.

## Layer Impact

- **Layer 1 - Client intake:** no change.
- **Layer 2 - Source adapters:** no change.
- **Layer 3 - Canonical model:** no change; this release does not alter rows or values.
- **Layer 4 - Product:** `global-control-lane`; Source Contract 360 Optimize presentation and claim-state binding.

## Client Applicability

- All clients: all authorized Source Contract 360 users receive the corrected Optimize view.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- Removed the legacy duplicate lever table from the contract Optimize page.
- Kept the Optimize subtabs and the current governed lever table.
- Hardened the retained legacy component so signal-stage rows cannot display a dollar amount if reused.
- Added behavioral coverage for the signal-stage amount refusal.

## QA / Validation

- Focused Source Contract 360 suites: pass, 14 tests.
- Signal-stage component test: pass; `$270K` is withheld and `Not sized` is rendered.
- ESLint: pass.
- `git diff --check`: pass.
- `npm run release:check -- --base origin/main --head HEAD`: pass locally.
- Post-deploy signed-in proof required: one lever table, six loaded levers, four sized rows, two signal-stage rows, and no legacy duplicate table.

## Rollout Plan

Merge through the protected `main` ACA workflow. Build from the exact merge
SHA, deploy the digest-pinned image, verify the ACA runtime invariant, assign
100% traffic, and run the signed-in Source Contract 360 proof.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: repo-owned ACA main deploy workflow only.
- Approved image digest: recorded after deployment.
- ACA runtime invariant: required and recorded after deployment.
- Worker image invariant: required and recorded after deployment.
- Feature/env flag update path: none.
- Live signed-in proof required: yes.

## Rollback Plan

Restore the prior approved digest-pinned ACA revision through the protected main
deploy workflow if the signed-in Source proof fails. No data or migration
rollback is required.

## Audit Evidence

Inspect PR #7636, its CI checks, the ACA deployment artifact, the runtime
invariant proof, and the signed-in Source Contract 360 navigation and Optimize
tab evidence.

## Known Gaps

This release does not reconcile the separate portfolio register and contract
depth populations or add missing contract evidence. Those remain data-plane work
and must not be inferred from the Optimize presentation.
