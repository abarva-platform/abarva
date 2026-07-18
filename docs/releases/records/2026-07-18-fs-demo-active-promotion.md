# 2026-07-18-fs-demo-active-promotion — FS Demo Active Promotion

## Release ID

`2026-07-18-fs-demo-active-promotion`

## Status

`candidate`

## Plain-English Summary

Adds an ACA private-operator command to promote only FS Demo (`first-capital-financial`) from the reconciled candidate context contract to the governed active context pointer. The command verifies the candidate pack, records a rollback target and promotion event, updates only the FS Demo active pointer, reconciles active data-plane counts, and proves Airline Demo remains stable.

## Layer Impact

- Data plane: Mutates `intelligence_v7.active_tenant_contract_versions` for `first-capital-financial` only and records a `tenant_contract_promotion_events` promotion event.
- Retrieval metadata: Marks `first-capital-financial` promoted chunks as `active_runtime` so active retrieval proof is distinct from candidate-preview retrieval.
- Runtime: No code path is changed for default readers; existing active-pointer readers consume the newly promoted contract after the operator job runs.
- Schema: No schema change.

## Client Applicability

- Specific client/demo tenant: FS Demo (`first-capital-financial`) only.
- Explicitly protected: Airline Demo (`skyharbor-air`) active pointer must remain unchanged.
- All clients: No unrelated tenant pointer should change.
- Feature flag: None.

## Changes Included

- Adds `scripts/knowledge/fs-demo-active-promotion.mjs`.
- Adds `npm run promote:fs-demo-active-context`.
- Writes promotion proof reports under `reports/fs-demo-active-promotion/`.

## QA / Validation

Validation status before PR:

- PASS: `node --check scripts/knowledge/fs-demo-active-promotion.mjs`
- PASS: local no-DB dry-run of `node scripts/knowledge/fs-demo-active-promotion.mjs` blocked without mutation.
- PASS: `npm run audit:enterprise-naming`
- PASS: `npm run audit:architecture-rules`
- PASS: `npm run release:check`
- PASS: `git diff --check`
- REQUIRED AFTER DEPLOY: ACA private operator execution with `DATABASE_URL` secret.
- REQUIRED AFTER OPERATOR SUCCESS: signed-in browser proof for FS Demo routes.

## Rollout Plan

Merge through PR and deploy through the repo-owned ACA main workflow. Run the digest-pinned private operator job with `npm run promote:fs-demo-active-context` and the lab Azure/Postgres `DATABASE_URL` secret. Do not alter Airline Demo in this release.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: The operator job mutates only the FS Demo active pointer and associated promotion event.
- Approved image digest: Resolved by ACA main deploy after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Required before running the private operator job.
- Live signed-in proof required: Required before claiming signed-in runtime page proof.

## Rollback Plan

Use the `rollback_contract_version` recorded on `intelligence_v7.active_tenant_contract_versions` and in the promotion event validation summary to restore the prior FS Demo active pointer. Do not delete candidate data during rollback. Revert the PR only to remove the operator command from future images; the data-plane rollback is a separate governed pointer update.

## Audit Evidence

- `reports/fs-demo-active-promotion/pre-promotion-check.md`
- `reports/fs-demo-active-promotion/summary.md`
- `reports/fs-demo-active-promotion/promotion-event.csv`
- `reports/fs-demo-active-promotion/active-pointer-proof.csv`
- `reports/fs-demo-active-promotion/post-promotion-reconciliation.csv`
- `reports/fs-demo-active-promotion/home-active-proof.csv`
- `reports/fs-demo-active-promotion/tower-active-proof.csv`
- `reports/fs-demo-active-promotion/intelligence-active-proof.csv`
- `reports/fs-demo-active-promotion/moves-source-active-proof.csv`
- `reports/fs-demo-active-promotion/airline-stability-proof.csv`
- `reports/fs-demo-active-promotion/signed-in-browser-proof.md`
- `reports/fs-demo-active-promotion/blocked-claims-audit.csv`
- `reports/fs-demo-active-promotion/proof.html`

## Known Gaps

This PR adds the guarded promotion command. It does not itself prove signed-in browser pages until the command has been deployed, executed, and followed by authenticated live browser proof.
