# 2026-08-14-source-optimize-spine-readback — Read back persisted optimize calculation coverage

## Release ID

`2026-08-14-source-optimize-spine-readback`

## Status

`candidate`

## Plain-English Summary

Source Optimize needs a repeatable way to prove that persisted contract
opportunity amounts are backed by calculation runs. This release adds a
read-only operator command that checks the live Source optimization spine for
selected contracts and fails if an amount-bearing opportunity is missing its
calculation run or if the calculation output does not reconcile to the
persisted amount.

The command does not create, update, or delete data. It is a proof utility for
the deployment lane and for future canary tenant checks.

## Layer Impact

- Release lane: `client-data-lane`.
- Canonical model: no schema change and no data mutation. The script reads the
  existing Source canonical optimization tables.
- Products: Source Optimize and Contract 360 gain a repeatable live proof path
  for amount traceability, but no product UI is changed by this release.
- Source adapters: none changed.

## Client Applicability

- All clients: yes, where tenants use the shared Source Optimize opportunity
  spine.
- Specific clients: SkyHarbor receives the immediate proof run for the current
  golden-contract canary.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `scripts/source/readback-contract-optimization-spine.ts`: new read-only
  persisted-spine coverage checker.
- `package.json`: adds `source:contract-optimization:spine:readback`.

## QA / Validation

- Pass: `./node_modules/.bin/eslint scripts/source/readback-contract-optimization-spine.ts`
- Pass: `NODE_OPTIONS=--max-old-space-size=8192 ./node_modules/.bin/tsc --noEmit --pretty false`
- Pass: `git diff --check`
- Pending after merge/deploy: run
  `source:contract-optimization:spine:readback` through the approved ACA
  private-operator job using the deployed digest-pinned image and capture the
  structured JSON event.

## Rollout Plan

Merge to `main`. The repo-owned Azure Container Apps main deploy workflow builds
and deploys the digest-pinned web image. After deployment, submit the readback
script through the approved ACA private-operator job using the deployed image
and the live database secret.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none; this command is read-only.
- Approved image digest: produced by the workflow after merge.
- ACA runtime invariant: required before claiming the command is live.
- Worker image invariant: private operator job must use the approved digest and
  restore to idle afterward.
- Feature/env flag update path: not applicable.
- Live signed-in proof required: no UI change in this release; live database
  readback through the operator job is required.

## Rollback Plan

Revert this PR and redeploy through the repo-owned ACA workflow. No database
rollback is required because the release is read-only.

## Audit Evidence

- PR URL after publication.
- GitHub Actions ACA main deploy run after merge.
- ACA runtime invariant output after deploy.
- ACA private-operator readback proof event:
  `source_contract_optimization_spine_readback`.

## Known Gaps

This release does not replace signed-in browser proof for the Source Optimize
journey. It only proves the persisted data spine that the app consumes.
