# 2026-07-01-tower-portfolio-value-pack — Tower Portfolio Value Pack

## Release ID

`2026-07-01-tower-portfolio-value-pack`

## Status

`candidate`

## Plain-English Summary

This release strengthens the first governed Portfolio Value Pack slice in Tower. The Tower command center now has a row-level view of funded programs with owner, budget, actual spend YTD, promised value, measured value, value gap, burn rate, realization rate, value per dollar spent, evidence status, inspection reason, blocker, and source evidence from `cio_tower` instead of a generic fact table.

## Layer Impact

- `global-control-lane`: Updates the shared Tower dashboard and aVa answer contract for all tenants that have governed `cio_tower` facts and measures.
- `client-data-lane`: No schema migration or client data mutation is included. The release reads existing `cio_tower.measure_results`, `cio_tower.facts`, `cio_tower.relationships`, and `cio_tower.entities`.

## Client Applicability

- All clients: Yes, wherever governed `cio_tower` rows exist.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Adds a governed Portfolio Value Pack row model to `src/lib/cio-tower/cxo-view-model.ts`.
- Updates the Tower CXO dashboard to render owner, budget, actual spend YTD, promised value, measured value, value gap, realization rate, value per dollar spent, evidence status, inspection reason, blocker, and source for portfolio programs.
- Updates deterministic top-program aVa answers to use budget, actual spend, and value facts together.
- Adds deterministic aVa answer families for largest value gap, weak value evidence, and inspect-this-week questions.
- Extends `scripts/qa/tower-prompt-raw-render-trace.mjs` so the deployed proof asks Portfolio Value Pack questions and captures final prompt, raw model output, and rendered response.

## QA / Validation

- Passed: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` (`24` tests).
- Passed: `npx jest src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx --runInBand` (`11` tests).
- Passed with warnings only: `npx eslint src/lib/cio-tower/answer.ts src/lib/cio-tower/cxo-view-model.ts src/lib/cio-tower/metric-packet.ts src/components/tower/TowerIndexPage.tsx src/lib/cio-tower/__tests__/answer.test.ts src/components/tower/__tests__/TowerCioDashboardSurface.test.tsx scripts/qa/tower-prompt-raw-render-trace.mjs`. The warnings are existing unused declarations in the large Tower surface; no lint errors were reported.
- Blocked by unrelated baseline dependency declarations: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` currently fails before this slice on missing project declarations/packages for `js-yaml`, `@azure-rest/ai-document-intelligence`, and `@axe-core/playwright`.
- Passed: `npm run release:check`.
- Pending after deploy: live parity proof showing dashboard value, aVa value, source evidence, prompt package, and trace ID on `app.abarva.ai`.

## Rollout Plan

Merge to `main`, let the repo-owned Azure Container Apps main deployment build and deploy the image, then verify the signed-in Tower page against `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No direct manual shared-runtime mutation in this release.
- Approved image digest: Captured after main deploy.
- ACA runtime invariant: Active revision, template image, and traffic image must match the approved main digest.
- Worker image invariant: No worker image change expected.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes.

## Rollback Plan

Revert this PR and redeploy the previous approved main image through the repo-owned ACA deploy path. No data rollback is required because this release does not mutate client data or schema.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- ACA revision/image/traffic: pending deploy.
- Proof report: `scripts/qa/tower-cxo-parity-proof.ts` output after deploy.

## Known Gaps

This is the first vertical slice only. It proves one governed dashboard/chat parity path and portfolio value-pack rendering; it does not complete every Tower question family or every possible CIO dashboard metric.
