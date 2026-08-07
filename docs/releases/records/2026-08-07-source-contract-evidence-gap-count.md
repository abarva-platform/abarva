# 2026-08-07-source-contract-evidence-gap-count — Contract Evidence Gap Count Alignment

## Release ID

`2026-08-07-source-contract-evidence-gap-count`

## Status

`candidate`

## Plain-English Summary

Source Contract 360 now counts evidence gaps using the same missing-evidence classification that drives the contract story and sourcing guidance. A finance-confirmed realized-value line that is not yet established remains an explicit missing evidence line in the gap count instead of being excluded because its workflow state is different.

## Layer Impact

- Lane: `global-control-lane`.
- Products: Source Contract 360 shows consistent evidence-gap counts across the stat strip, story panel, and optimization evidence sourcing section.
- Canonical model: No schema, identity, or tenant-data changes.
- Source adapters: No loader or adapter changes.

## Client Applicability

- All clients: Yes, this is tenant-agnostic Source product behavior.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Existing Source preview route behavior.

## Changes Included

- `src/lib/source/data-model/contract-optimization-ledger.ts`
- `src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts`

## QA / Validation

- `npx jest src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts src/lib/source/data-model/__tests__/contract-optimization-spine.test.ts --runInBand` passed.
- `npx eslint src/lib/source/data-model/contract-optimization-ledger.ts src/lib/source/data-model/__tests__/contract-optimization-ledger.test.ts` passed.
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` passed.
- `npm run release:check` passed.
- `git diff --check` passed.

## Rollout Plan

Merge through PR to `main`. The repo-owned Azure Container Apps main deploy workflow builds and shifts the production/lab web runtime after merge.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: None in this change.
- Approved image digest: Set by the main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required after deploy.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, verify the Source Contract 360 evidence-gap count on `app.abarva.ai`.

## Rollback Plan

Revert the PR. There is no migration, seed, or tenant data mutation to roll back.

## Audit Evidence

- Candidate branch/PR.
- Local test, lint, typecheck, and release-check output.
- Post-merge ACA deployment evidence.
- Signed-in Source Contract 360 browser proof after deploy.

## Known Gaps

- This does not create new evidence data or quantify value where the governed ledger says evidence is missing.
- Header density and single-screen visual polish remain separate backlog items.
