# 2026-08-31-tower-command-css-contract — Tower Command CSS Contract

## Release ID

`2026-08-31-tower-command-css-contract`

## Status

`candidate`

## Plain-English Summary

The Tower command-center stylesheet now declares the layout classes already used by the ported
command-center components and restores the fixed-shell shrink guards required by the CSS contract.
This prevents rendered sections from silently losing their intended spacing or horizontal behavior
when the component code references a class.

## Layer Impact

Release lane: `global-control-lane`.

Layer 4 PRODUCTS only. The change affects Tower command-center layout CSS and its contract test. It
does not change schemas, loaders, tenant rows, serving views, policies, migrations, or runtime data
access.

## Client Applicability

- All clients: yes, wherever the Tower command-center surface is enabled.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/components/tower/command-center/TowerCommandCenter.module.css`
- `docs/releases/records/2026-08-31-tower-command-css-contract.md`

## QA / Validation

Status: PASS.

- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower/command-center/__tests__/css-contract.test.ts --runInBand`
- PASS — `npx eslint src/components/tower/command-center/TowerCommandCenter.module.css src/components/tower/command-center/__tests__/css-contract.test.ts`
  - Note: ESLint reported the CSS file is ignored by current config; no JS/TS lint issues were found.
- PASS — `NODE_OPTIONS=--max-old-space-size=8192 npx tsc -p tsconfig.json --noEmit --pretty false`
- PASS — `node scripts/release-check.mjs --base origin/main --head HEAD`
- PASS WITH KNOWN BASELINE FAILURES — `NODE_OPTIONS=--max-old-space-size=8192 npx jest src/components/tower src/lib/tower --runInBand --silent --json --outputFile=/tmp/tower-jest-css-contract.json`
  - Result: 5 failing suites / 19 failing tests; 64 passing suites / 580 passing tests; 599 total tests.
  - The CSS contract suite passed; remaining failures are outside this stylesheet change.

## Rollout Plan

Merge through the protected PR path. The repo-owned Azure Container Apps main deploy workflow will
publish the layout hardening after merge.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: Not affected.
- Live signed-in proof required: Yes, for Tower command-center rendering.

## Rollback Plan

Revert the PR and redeploy through the repo-owned main deploy workflow. No data rollback is
required.

## Audit Evidence

Inspect the PR diff, CSS contract output, release-control output, ACA deploy evidence, and a
signed-in Tower command-center proof after deployment.

## Known Gaps

This change restores declared CSS contract coverage only. It does not redesign additional Tower
panels, alter data loading, or change the governed Tower projections.
