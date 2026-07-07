# 2026-07-02-tower-ava-value04-visible-contract — Tower aVa measured-value evidence question hardening

## Release ID

`2026-07-02-tower-ava-value04-visible-contract`

## Status

`candidate`

## Plain-English Summary

This release closes the last visible-answer-contract failure found in the live Tower 50x2 audit. Questions such as "Which programs have no measured value evidence?" now route to the deterministic Tower value-proof governance answer instead of falling through to older phrasing that can expose internal implementation language.

## Layer Impact

- `global-control-lane`: Updates the shared Tower aVa answer router for all clients using the CIO Tower path.
- `client-data-lane`: No data, schema, migration, or tenant-specific dataset changes.

## Client Applicability

- All clients: Yes, for Tower aVa value-proof questions.
- Specific clients: Validated locally against the SkyHarbor-style contract fixture; live audit target is Lakeshore + SkyHarbor.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/cio-tower/answer.ts`: expands the value-proof governance matcher to include measured-value-evidence gap phrasings.
- `src/lib/cio-tower/__tests__/answer.test.ts`: adds the exact 50x2 audit question shape and asserts no internal `read model` / `rows` / scaffold language leaks.

## QA / Validation

- `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand` — passed, 32/32 tests.
- Pre-fix live audit artifact: `/Users/anand/Downloads/tower-ava-50x2-live-post4331-2026-07-02T12-49-43-146Z` showed 98/100, with only `value-04` failing for Lakeshore and SkyHarbor due to visible-answer-contract 422 responses.
- Post-deploy validation required: rerun the same live 50x2 audit and expect 100/100.

## Rollout Plan

Merge to main, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the new main SHA to `app.abarva.ai`.

## Deployment Authority

- Repo-owned deploy workflow: Required.
- Shared runtime mutators: No manual/shared runtime mutation in this PR.
- Approved image digest: Captured by the ACA main deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not changed.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, rerun Tower aVa 50x2 live audit.

## Rollback Plan

Revert this PR or roll back the ACA revision to the previously approved main image. No database rollback is required.

## Audit Evidence

- PR: to be linked after opening.
- Local test: `npx jest src/lib/cio-tower/__tests__/answer.test.ts --runInBand`.
- Live audit before fix: `/Users/anand/Downloads/tower-ava-50x2-live-post4331-2026-07-02T12-49-43-146Z`.

## Known Gaps

Post-deploy live audit still needs to be rerun after this release lands.
