# 2026-06-27-semantic2-crown-jewel-runtime-contract — Semantic2 Crown-Jewel Runtime Guardrails

## Release ID

`2026-06-27-semantic2-crown-jewel-runtime-contract`

## Status

`candidate`

## Plain-English Summary

Adds runtime guardrails so Home and Tower use the current semantic2 dossier
layer as the governed answer substrate instead of silently falling back to
duplicate tenant buckets, invalidated dossiers, or the older seed semantic
tables. Also documents which dossier/semantic layers are current and which
should be sunset.

## Layer Impact

- `global-control-lane`: Shared semantic2 runtime contract, tenant-scope
  canonicalization, and legacy semantic-table detection.
- `client-data-lane`: Protects all active tenant reads/writes from
  noncanonical tenant buckets and stale dossier rows.
- `public-demo`: Home/Tower demo surfaces are affected because they should now
  block stale/noncanonical dossier answers instead of masking them with legacy
  fallback output.

## Client Applicability

- All clients: applies to all runtime answer paths that use semantic2 dossiers.
- Specific clients: active allowlist is `apex-retail`, `first-capital`,
  `lakeshore-holdings`, `meridian-health`, `skyharbor-air`.
- Internal only: legacy semantic tables may remain for audit/migration, but not
  runtime answers.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- Adds `src/lib/semantic2/runtime-contract.ts`.
- Exports active semantic2 tenant keys from
  `src/lib/semantic2/dossiers/tenant-scope-policy.ts`.
- Updates curated semantic dossier loading to normalize tenant scope and block
  invalidated/stale dossier rows.
- Updates Home KNOW to avoid fallback answers for stale/noncanonical semantic2
  dossier failures.
- Updates Tower L3 dossier building to persist canonical tenant keys.
- Adds runtime-contract and Tower canonicalization tests.
- Updates `docs/ava-answer-quality/semantic2-first-policy.md`.
- Adds `docs/architecture/SEMANTIC2_CROWN_JEWEL_DOSSIER_RUNTIME.md`.

## QA / Validation

- PASS: `npx jest src/lib/semantic2/__tests__/runtime-contract.test.ts --runInBand`.
- PASS: `npx jest src/lib/tower/__tests__/tower-l3-dossiers.test.ts --runInBand`.
- PASS: `npx eslint src/lib/semantic2/runtime-contract.ts src/lib/semantic2/dossiers/tenant-scope-policy.ts src/lib/semantic-dossiers/curated-dossier-store.ts src/lib/home/know/home-know-engine.ts src/lib/tower/tower-l3-dossiers.ts src/lib/semantic2/__tests__/runtime-contract.test.ts src/lib/tower/__tests__/tower-l3-dossiers.test.ts`.
- BLOCKED: `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` reaches unrelated repository dependency/type issues: missing `js-yaml` declarations, missing `@azure-rest/ai-document-intelligence`, and missing `@axe-core/playwright`.
- PASS: `npm run release:check`.

## Rollout Plan

Merge to `main`, build/deploy through the approved Azure Container Apps release
lane, then verify Home and Tower signed-in answers still work for active tenants.

## Deployment Authority

- Repo-owned deploy workflow: required for ACA rollout.
- Shared runtime mutators: no manual shared runtime mutation in this release.
- Approved image digest: assigned by the release deploy.
- ACA runtime invariant: main image only at 100% traffic.
- Worker image invariant: not affected.
- Feature/env flag update path: none.
- Live signed-in proof required: Home and Tower smoke after deploy.

## Rollback Plan

Revert the PR. This is code/docs only; no destructive database migration is
included. Runtime can roll back to the previous ACA image if needed.

## Audit Evidence

- PR URL: pending.
- CI run: pending.
- Local validation output: pending.
- Architecture doc:
  `docs/architecture/SEMANTIC2_CROWN_JEWEL_DOSSIER_RUNTIME.md`.

## Known Gaps

- This does not purge legacy tables or noncanonical tenant rows from Azure. It
  prevents new runtime use and documents the sunset path.
- This does not run the semantic2 dossier refresh job.
