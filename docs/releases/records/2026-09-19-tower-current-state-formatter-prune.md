# 2026-09-19-tower-current-state-formatter-prune — remove an orphaned Tower prompt formatter

## Release ID

`2026-09-19-tower-current-state-formatter-prune`

## Status

`candidate`

## Plain-English Summary

The old exported Tower current-state prompt formatter had no callers after the
advisor prompt contract was moved to an execution-path test. This change removes
that orphaned export and its private helper, then strengthens the existing Atlas
Tower prompt test so it proves the live prompt still carries the governed Tower
business state through `runAtlasLlm`.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 (products) — Tower advisor prompt assembly coverage. The runtime path
  remains `runAtlasLlm` plus its local `formatCleanTowerContext`; this change
  deletes unused code from the Tower grounding module.
- Layers 1-3 untouched. No intake, adapter, canonical model, schema, migration,
  tenant data, or data-build job changes.

## Client Applicability

- All clients: no observable product change; the removed export had no importer.
- Specific clients: none.
- Internal only: test coverage and dead-code cleanup.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/atlas/tower-grounding.ts` — removes the unused
  `formatTowerCurrentStateForPrompt` export and its private `money` helper.
- `src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts` —
  expands the existing execution-path prompt test so current Tower counts,
  budget rollup, pressure signal, initiative, and vendor facts must reach the
  composed prompt.

## QA / Validation

- Code search: `rg -n "formatTowerCurrentStateForPrompt" -S src` now finds
  only the historical explanation in the Atlas grounding contract test; there
  is no source importer or callable export left.
- Focused test: `npx jest
  src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts
  --runInBand` passed, 1 suite / 8 tests.
- Mutation: temporarily replacing the live `towerContext` insertion in
  `src/lib/atlas/llm.ts` with a stub made the focused test fail, 1 failed / 7
  passed. The failure was on the current-state assertion for governed read-model
  counts, proving the test is reading the executed prompt path rather than
  another serialized copy of the fixture. The mutation was reverted and the same
  focused test passed again, 1 suite / 8 tests.
- ESLint: `npx eslint src/lib/atlas/tower-grounding.ts
  src/__tests__/integration/atlas/atlas-tower-grounding-contract.test.ts`
  passed with no output.
- TypeScript: after clearing `tsconfig.tsbuildinfo`,
  `NODE_OPTIONS=--max-old-space-size=6144 npx tsc --noEmit --pretty false`
  passed with no output.
- Release check: `npm run release:check` passed.

## Rollout Plan

Open a PR and merge to `main` after validation. The repo-owned ACA main deploy
workflow builds and deploys from the merge SHA as usual. No migration, feature
flag, data build, or manual Azure runtime change is part of this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`,
  unchanged.
- Shared runtime mutators: none. No ad-hoc Azure command is used for this
  change.
- Approved image digest: produced by the repo-owned main deploy workflow after
  merge.
- ACA runtime invariant: to be proven after merge if the PR is deployed.
- Worker image invariant: unchanged by the code change; read back after deploy
  if the PR is merged.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no. The only product-code edit deletes an
  exported function with no importer; the observable prompt path is covered by
  the execution-path test.

## Rollback Plan

Revert the PR. No data, schema, migration, runtime configuration, traffic, or
feature flag rollback is required.

## Audit Evidence

- PR, commit, and CI run for this release.
- Focused Jest and mutation command output.
- ESLint, TypeScript, and release-check output.
- ACA deploy/runtime proof if merged and deployed.

## Known Gaps

Signed-in acceptance is not applicable because no rendered route response,
stored value, or tenant data path changes.
