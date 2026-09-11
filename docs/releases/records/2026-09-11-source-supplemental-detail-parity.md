# 2026-09-11-source-supplemental-detail-parity - Source supplemental detail parity

## Release ID

`2026-09-11-source-supplemental-detail-parity`

## Status

`candidate`

## Plain-English Summary

Evidence-backed supplemental contract rows can now be opened through the same
Contract 360 detail path as register rows. A row will not appear clickable and
then fail because the detail route searched a narrower dataset than the list.

## Layer Impact

- **Layer 4 - Products:** Source workspace contract discovery and contract-detail
  routing now use one promoted contract-row set.
- **Layer 3 - Canonical model:** No canonical data is changed.
- **Layer 2 - Source adapters:** No adapter or source package is changed.

## Client Applicability

- All clients using the Source workspace supplemental evidence path.
- Specific clients: none.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/api/source/workspace/contract/[contractId]/route.ts`: resolve detail
  from promoted evidence/action rows when register detail is absent.
- Route regression coverage for a supplemental evidence contract.
- No migration and no data mutation.

## QA / Validation

- PASS: focused contract-detail Jest suite, 9 tests.
- PASS: ESLint for the changed route and test.
- PASS: TypeScript check.
- PASS: signed-in Source smoke after tenant-wide projection refresh: supplemental
  contract appears in search and is offered as a Contract 360 row.
- Pending: post-deploy click-through proof for the new route.

## Rollout Plan

Merge through the protected main branch, let the repo-owned ACA deploy workflow
build and deploy the digest-pinned image, then repeat the signed-in Source
click-through and detail-tab smoke.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: none beyond the repo-owned deploy workflow.
- Approved image digest: produced by the main deploy workflow after merge.
- ACA runtime invariant: template image and 100% traffic revision must match the
  approved digest.
- Worker image invariant: unchanged.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source supplemental row to Contract 360.

## Rollback Plan

Roll back the ACA web revision to the prior digest through the repo-owned deploy
lane. No database rollback or data reload is required.

## Audit Evidence

- PR: `https://github.com/abarva-platform/abarva/pull/7613`
- Local route test, ESLint, and TypeScript output.
- ACA operator tenant refresh and independent readback outputs from the current
  digest-pinned runtime.
- Signed-in Source contract search smoke.

## Known Gaps

The contract-detail click-through still requires post-deploy proof after the
application image containing this fix is live.
