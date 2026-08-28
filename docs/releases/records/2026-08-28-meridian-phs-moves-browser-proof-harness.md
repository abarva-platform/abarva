# 2026-08-28-meridian-phs-moves-browser-proof-harness — Meridian Moves Browser Proof Harness

## Release ID

`2026-08-28-meridian-phs-moves-browser-proof-harness`

## Status

`candidate`

## Plain-English Summary

Adds a Meridian/PHS Moves browser proof harness so the integrated executive demo can track Moves separately from the ECL Home, Tower, and Intelligence serving-surface denominator. The harness signs into the product, discovers a real strategic move, crawls the six Moves routes, captures screenshots and text snapshots, and writes a proof summary that the Meridian/PHS demo status tracker can consume.

## Layer Impact

Lane: `global-control-lane`.

Layer 4 Products: adds proof tooling for the Moves product routes. It does not change Moves runtime behavior, product data, serving views, or route defaults.

Reporting and release evidence: extends the Meridian/PHS demo readiness status writer so a captured Moves proof can advance the Moves denominator from browser-proof-required to browser-proof-complete.

## Client Applicability

- All clients: none.
- Specific clients: Meridian/PHS synthetic demo tenant only.
- Internal only: proof tooling and readiness reporting.
- Public/demo only: Meridian/PHS demo readiness evidence.
- Feature flag: none.

## Changes Included

- `scripts/ecl/run_meridian_phs_moves_browser_smoke.mjs`
- `scripts/ecl/write_meridian_phs_demo_status.mjs`
- `docs/architecture/meridian-phs-demo-readiness-status.json`
- `package.json` script `ecl:meridian-phs-moves-browser:smoke`

## QA / Validation

Validation status:

- PASS: `node --check scripts/ecl/run_meridian_phs_moves_browser_smoke.mjs`
- PASS: `npm run ecl:meridian-phs-moves-browser:smoke -- --validate-contract`
- PASS: `node --check scripts/ecl/write_meridian_phs_demo_status.mjs`
- PASS: `npm run ecl:meridian-phs-demo-status:write -- --json`
- PASS: `git diff --check`
- PASS: `npm run release:check`
- NOT-RUN: authenticated Moves six-route browser proof; this PR adds the harness but does not claim live proof.

## Rollout Plan

Merge to main after local validation. No ACA deployment is required because this is proof tooling and status-reporting infrastructure only.

## Deployment Authority

- Repo-owned deploy workflow: not required.
- Shared runtime mutators: none.
- Approved image digest: not applicable.
- ACA runtime invariant: not applicable.
- Worker image invariant: not applicable.
- Feature/env flag update path: none.
- Live signed-in proof required: required before claiming the Moves six-route proof is complete.

## Rollback Plan

Revert the PR. The rollback removes the Moves proof harness and status-summary integration without touching runtime product paths or data-plane state.

## Audit Evidence

Audit evidence will be the merged PR, local validation output, and any generated `job-output/meridian-phs-moves-browser-smoke/meridian_phs_moves_browser_smoke_summary.json` from an authenticated proof run.

## Known Gaps

This release does not refresh Moves demo narrative content, does not prove cross-module handoffs, and does not claim signed-in Moves browser proof until the harness is run against an authenticated environment.
