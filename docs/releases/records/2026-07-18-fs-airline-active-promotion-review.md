# 2026-07-18-fs-airline-active-promotion-review — FS/Airline Active Promotion Dry Run

## Release ID

`2026-07-18-fs-airline-active-promotion-review`

## Status

`candidate`

## Plain-English Summary

Adds a non-mutating active-promotion review for FS Demo and Airline Demo candidate context. The review reads the already loaded candidate data and local render artifacts, then produces proof reports showing whether the tenants are ready for a separate active-promotion approval step.

## Layer Impact

- Data plane: Read-only audit of candidate rows in Azure/Postgres.
- Runtime safety: Confirms active pointer state and default runtime invisibility before any promotion.
- Module preview: Validates candidate-preview readiness for Home, Tower, Intelligence, Moves, and Source.

## Client Applicability

- All clients: No default runtime behavior changes.
- Specific clients: FS Demo (`first-capital-financial`) and Airline Demo (`skyharbor-air`) candidate review only.
- Internal only: Operator/audit proof command and generated reports.
- Public/demo only: Demo tenant readiness evidence.
- Feature flag: None.

## Changes Included

- Adds `scripts/knowledge/fs-airline-active-promotion-review.mjs`.
- Adds `npm run audit:fs-airline-active-promotion-review`.
- Writes review reports under `reports/fs-airline-active-promotion-review/`.

## QA / Validation

Validation status before PR:

- PASS: `node --check scripts/knowledge/fs-airline-active-promotion-review.mjs`
- PASS: `npm run audit:fs-airline-active-promotion-review` in local artifact-only mode; expected status is `WATCH_BEFORE_ACTIVE_PROMOTION` without `DATABASE_URL`.
- NOT RUN YET: ACA private operator execution with `DATABASE_URL` secret for live readback; required after deploy.
- PASS: `npm run audit:enterprise-naming`
- PASS: `npm run audit:architecture-rules`
- PENDING: `npm run release:check`
- PASS: `git diff --check`

## Rollout Plan

Merge through PR. Deploy through the repo-owned ACA main workflow only if the operator job must run from the deployed image. The command itself does not promote candidate context or mutate active runtime pointers.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml` if deployed.
- Shared runtime mutators: None in this PR.
- Approved image digest: Resolved by ACA main deploy if deployed.
- ACA runtime invariant: Required after deploy if deployed.
- Worker image invariant: Required if the operator job is run from the deployed image.
- Feature/env flag update path: None.
- Live signed-in proof required: Not part of this dry run; required before claiming user-facing runtime proof.

## Rollback Plan

Revert the PR to remove the dry-run script and npm command. Generated reports are audit artifacts only. No database rows, active pointers, traffic, or user-visible runtime state are changed by this review.

## Audit Evidence

- `reports/fs-airline-active-promotion-review/summary.md`
- `reports/fs-airline-active-promotion-review/promotion-dry-run.csv`
- `reports/fs-airline-active-promotion-review/home-preview-proof.csv`
- `reports/fs-airline-active-promotion-review/tower-preview-proof.csv`
- `reports/fs-airline-active-promotion-review/intelligence-preview-proof.csv`
- `reports/fs-airline-active-promotion-review/moves-source-preview-proof.csv`
- `reports/fs-airline-active-promotion-review/default-runtime-invisibility.md`
- `reports/fs-airline-active-promotion-review/blocked-claims-audit.csv`
- `reports/fs-airline-active-promotion-review/proof.html`

## Known Gaps

Active promotion and signed-in runtime page proof remain explicitly out of scope.
