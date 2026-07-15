# 2026-07-15-home-ava-export-safe-negation — Home aVa Export Safe-Negation Fix

## Release ID

`2026-07-15-home-ava-export-safe-negation`

## Status

`candidate`

## Plain-English Summary

Home aVa answer exports were blocked when a visible answer safely said a named platform was not loaded, not available, or not proven. The claim validator treated the platform name as an unsupported positive claim even though the sentence was a caveat. This release keeps strict blocking for unsupported positive claims while allowing safe missing-evidence negations to export.

## Layer Impact

- Global control lane: updates the shared aVa answer claim validator used by Home and other answer export surfaces.
- Product runtime: allows already-rendered safe Home answers to export when they contain caveated, negative platform/system statements.
- Data layer: no schema, ingestion, candidate, or Active Tenant Access changes.

## Client Applicability

- All clients: yes, for aVa answer validation/export behavior.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/ava-answer/claim-source-validation.ts`
- `src/lib/ava-answer/__tests__/claim-source-validation.test.ts`

## QA / Validation

- Pass: `npx jest src/lib/ava-answer/__tests__/claim-source-validation.test.ts src/lib/ava-answer/export/__tests__/render-answer-html.test.ts --runInBand`
- Pass: `node --max-old-space-size=8192 node_modules/typescript/bin/tsc --noEmit --pretty false --project tsconfig.json`
- Pass: `git diff --check`
- Pass: `npm run audit:home-ava-context-contract`
- Pass: `npm run release:check`
- Pending before release: focused signed-in Meridian Home aVa HTML/PDF export proof after ACA deploy.

## Rollout Plan

Merge through PR to `main`, then deploy with the repo-owned Azure Container Apps main deploy workflow. No migration or manual data operation is required.

## Deployment Authority

- Repo-owned deploy workflow: required for shared runtime.
- Shared runtime mutators: no ad-hoc Azure runtime mutation.
- Approved image digest: produced by ACA main deploy workflow.
- ACA runtime invariant: required after deploy.
- Worker image invariant: no worker behavior expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Meridian Home aVa export proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No data rollback is required.

## Audit Evidence

- PR URL: pending.
- ACA deploy run: pending.
- Signed-in browser proof artifact: pending.

## Known Gaps

This release fixes safe-negation export blocking. It does not add Meridian typed chart or graph artifacts when the active Home packet has no chart metrics or relationship paths bound.
