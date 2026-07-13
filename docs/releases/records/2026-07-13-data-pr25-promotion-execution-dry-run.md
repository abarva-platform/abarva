# 2026-07-13-data-pr25-promotion-execution-dry-run — Promotion Execution Dry-Run With Rollback Proof

## Release ID

`2026-07-13-data-pr25-promotion-execution-dry-run`

## Status

`candidate`

## Plain-English Summary

Adds a non-destructive promotion execution rehearsal for the safe demo tenant
selected by the all-tenant readiness closure report. The rehearsal proves the
promotion sequence, prior-active-version capture, simulated Active Tenant Access
pointer update, module-read lock, and rollback path without promoting the
candidate or writing production tenant data.

## Layer Impact

- `global-control-lane`: adds a report-only promotion execution dry-run and
  rollback proof on top of the existing candidate runway.
- `internal-admin`: adds operator-facing JSON, Markdown, CSV, HTML, and rollback
  proof artifacts under `reports/promotion-execution-dry-run/skyharbor/`.
- Runtime behavior: no change.

## Client Applicability

- All clients: no runtime impact.
- Specific clients: SkyHarbor only for this dry-run proof.
- Internal only: yes.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/lib/enterprise-data/promotion-execution-dry-run/promotion-execution-dry-run.ts`
- `scripts/audit/build-promotion-execution-dry-run.ts`
- `npm run audit:promotion-execution-dry-run`
- `reports/promotion-execution-dry-run/skyharbor/*`
- Refreshed SkyHarbor candidate and promotion-gate proof artifacts so stored
  proof fingerprints match the current module-readiness derived-plan artifact.

## QA / Validation

- Pass: `npm run audit:skyharbor-candidate-version`
- Pass: `npm run audit:candidate-promotion-gate -- --candidate-record reports/candidate-tenant-data-versions/skyharbor/candidate-version-record.json --out-dir reports/candidate-promotion-gates/skyharbor --prior-active-version skyharbor-air:active-runtime-truth:unchanged`
- Pass: `npm run audit:operator-promotion-workflow`
- Pass: `npm run audit:promotion-execution-dry-run`
- Pass: `npm run audit:all-tenant-readiness-closure`
- Pass: `npx eslint scripts/audit/build-promotion-execution-dry-run.ts src/lib/enterprise-data/promotion-execution-dry-run/promotion-execution-dry-run.ts`
- Pass: isolated TypeScript compile for the new dry-run builder with Node
  types.
- Pass: `npm run audit:enterprise-naming`
- Pass: `npm run audit:architecture-rules`
- Pass: `npm run release:check`
- Pass: `git diff --check`

## Rollout Plan

Merge to `main`. This is an audit/report-only release and deploys through the
normal Azure Container Apps main workflow. It does not require a migration,
operator approval, data write, or runtime flag.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this change.
- Approved image digest: to be populated by ACA main deploy.
- ACA runtime invariant: required after merge/deploy.
- Worker image invariant: required after merge/deploy.
- Feature/env flag update path: none.
- Live signed-in proof required: standard post-deploy crawl if merged to main.

## Rollback Plan

Revert the PR. Since this change is report-only and does not change active data,
rollback does not require data repair.

## Audit Evidence

- PR URL: to be added.
- Generated dry-run report:
  `reports/promotion-execution-dry-run/skyharbor/promotion-execution-dry-run.json`
- Generated rollback proof:
  `reports/promotion-execution-dry-run/skyharbor/rollback-proof.json`

## Known Gaps

This release does not promote the candidate, update Active Tenant Access, write
production tenant data, change module runtime consumption, or execute rollback
against production. DATA-PR26 must be a separate explicit active-promotion
release if approved.

During validation, rerunning the SkyHarbor promotion gate initially exposed a
stale proof-fingerprint mismatch in the candidate record for the derived-plan
stage. Rerunning `npm run audit:skyharbor-candidate-version` refreshed the
candidate proof metadata and restored the SkyHarbor promotion gate to
`ready-for-operator-approval` with zero failed checks.
