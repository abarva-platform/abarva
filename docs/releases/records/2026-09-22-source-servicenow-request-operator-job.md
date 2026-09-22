# 2026-09-22-source-servicenow-request-operator-job - ServiceNow request import ACA job

## Release ID

`2026-09-22-source-servicenow-request-operator-job`

## Status

`candidate`

## Plain-English Summary

Adds the repo-owned Azure Container Apps operator job path for the governed ServiceNow sourcing-request loader. The default job is dry-run only, requires an explicit tenant, immutable input hash and source version, load run ID, and idempotency key, and emits a tarball proof bundle that the private ACA wrapper can extract.

## Layer Impact

Release lane: `client-data-lane`.

- Layer 1 client intake: validates the declared ServiceNow-shaped input extract without changing it.
- Layer 2 source adapter/operator: adds the ACA job entrypoints and proof contract around the existing adapter-backed loader.
- Layer 3 canonical model: apply mode can append immutable pre-event request versions only after the existing approval environment variable and exact confirmation token are both present.
- Layer 4 products: unchanged. No product route is wired to run this job.

## Client Applicability

- All clients: reusable operator mechanism after client-scoped approval.
- Specific clients: None.
- Internal only: ACA operator job invocation and proof bundle.
- Public/demo only: The checked-in validation fixture is synthetic.
- Feature flag: None.

## Changes Included

- `scripts/source/load-servicenow-sourcing-requests.ts`
- `package.json` scripts:
  - `source:servicenow-requests:job`
  - `source:servicenow-requests:apply-job`
- `src/__tests__/integration/source/source-servicenow-request-loader.test.ts`

## QA / Validation

- PASS - Red-first focused loader expectations added for complete operator contract, immutable input hash mismatch, and tarball proof emission.
- PASS - `jest src/__tests__/integration/source/source-servicenow-request-loader.test.ts --runInBand` using the shared dependency tree: 8 tests passed.
- PASS - Dry-run job invocation with explicit tenant, input source version, input SHA, load run ID, idempotency key, and build version wrote `servicenow-request-import-plan.json`, `proof-manifest.json`, and `proof-bundle.tgz`.
- PASS - Apply-job invocation with the operator contract but without write approval/token refused before database access.
- PASS - `npm run ops:aca-job -- --plan-only ... --script source:servicenow-requests:job ...` wrote the expected plan-only ACA command shape with sanitized env evidence.
- PASS - `npx eslint scripts/source/load-servicenow-sourcing-requests.ts src/__tests__/integration/source/source-servicenow-request-loader.test.ts`.
- PASS - `npm run ops:aca-job -- --self-test`.
- PASS - `git diff --check`.
- NOT RUN - Migration apply, ServiceNow request data apply, tenant row write, supplier contact, email, event creation, signed-in browser proof.

## Rollout Plan

Merge through PR and deploy the resulting commit through `.github/workflows/aca-main-deploy.yml`. Deployment only makes the operator job script available in the digest-pinned runtime image. A data-plane apply remains a separate ACA operator action requiring explicit tenant scope, immutable input SHA/version, load run ID, idempotency key, approval env, confirmation token, database secret, proof capture, and follow-up readback.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this PR.
- Approved image digest: assigned by the repo-owned deploy workflow after merge.
- ACA runtime invariant: required before claiming the runtime includes this job.
- Worker image invariant: required before any operator execution claim.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, after a separately approved apply and readback; not part of this release candidate.

## Rollback Plan

Revert the PR to remove the job entrypoints and operator contract changes. If a future approved apply has written request-version rows, use that run's proof bundle and idempotency key for scoped review before any rollback; do not delete tenant data from this code rollback alone.

## Audit Evidence

- Pull request and CI checks.
- Local focused test output.
- Local dry-run proof bundle and manifest.
- ACA wrapper plan-only output for the new job script.
- Future approved operator run output, extracted proof bundle, and independent readback.

## Known Gaps

- This release does not apply migrations, run the ServiceNow import in apply mode, write tenant rows, contact suppliers, send email, create Source events, or prove a signed-in product surface.
