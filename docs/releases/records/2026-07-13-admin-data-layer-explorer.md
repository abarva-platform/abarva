# 2026-07-13-admin-data-layer-explorer — Admin Data Layer Explorer

## Release ID

`2026-07-13-admin-data-layer-explorer`

## Status

`candidate`

## Plain-English Summary

Adds a read-only Admin Data Layer Explorer page that explains how client input files move through AbarVa's governed data journey: input categories, tenant packet, evidence, parsing, validation, known facts, relationships, insights, candidate preview, promotion readiness, active access, module usage, outcome ledger, benchmarks, page mapping, quality checks, and guardrails.

This is an explanation and proof surface. It does not upload files, validate files, create candidates, promote candidates, update active access, write production tenant data, or change module runtime behavior.

## Layer Impact

- `internal-admin`: adds `/admin/data-layer-explorer` and Admin sidebar navigation.
- `global-control-lane`: adds a shared explanatory model and audit report generator for all tenants.
- `proof/reporting`: writes deterministic proof artifacts under `reports/admin-data-layer-explorer/latest/`.

## Client Applicability

- All clients: Read-only Admin explanatory surface when an authorized Admin user can access it.
- Specific clients: None.
- Internal only: Admin operators and implementation teams use this as the data journey truth map.
- Public/demo only: None.
- Feature flag: None.

## Changes Included

- New route: `/admin/data-layer-explorer`.
- New model: `src/lib/admin/data-layer-explorer.ts`.
- Admin sidebar entry: Data Journey.
- New audit command: `npm run audit:admin-data-layer-explorer`.
- New proof artifacts: `reports/admin-data-layer-explorer/latest/*`.
- Focused unit/source tests for the model, route, sidebar, and audit command.

## QA / Validation

- `npm run audit:admin-data-layer-explorer`: Pass.
- `npx jest --runTestsByPath src/lib/admin/__tests__/data-layer-explorer.test.ts "src/app/(maestro)/admin/data-layer-explorer/__tests__/page-source.test.ts" --runInBand`: Pass.
- `npx eslint src/lib/admin/data-layer-explorer.ts scripts/audit/build-admin-data-layer-explorer.ts src/app/'(maestro)'/admin/data-layer-explorer/page.tsx src/lib/admin/admin-shell-config.ts src/lib/admin/__tests__/data-layer-explorer.test.ts src/app/'(maestro)'/admin/data-layer-explorer/__tests__/page-source.test.ts`: Pass.
- Isolated TypeScript compile for the new route/model/audit/test files: Pass.
- `npm run build`: Pass; `/admin/data-layer-explorer` appears in the production route manifest.
- `npm run audit:enterprise-naming`: Pass.
- `npm run audit:architecture-rules`: Pass.
- `npm run release:check`: Pass.
- `git diff --check`: Pass.

## Rollout Plan

Merge through the protected PR lane. Deploy only through the repo-owned Azure Container Apps main deploy workflow. After deploy, verify ACA health/runtime invariant and run a signed-in proof of `/admin/data-layer-explorer`.

## Deployment Authority

- Repo-owned deploy workflow: Required for production/lab traffic.
- Shared runtime mutators: None in this PR.
- Approved image digest: Produced by the main ACA deploy workflow after merge.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: No worker change expected; invariant still checked by deploy proof.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, focused `/admin/data-layer-explorer` route proof.

## Rollback Plan

Revert the PR and redeploy through the repo-owned ACA main deploy workflow. No migrations, production data writes, candidate versions, promotions, active access updates, or module runtime changes are introduced, so rollback is code-only.

## Audit Evidence

- PR URL: To be added after PR creation.
- Proof artifacts: `reports/admin-data-layer-explorer/latest/section-map.json`, `page-layer-map.json`, `quality-checks.json`, `guardrails.json`, and `summary.md`.
- Validation output: To be added after local validation.
- ACA deploy/runtime proof: To be added after merge and deployment.
- Signed-in browser proof: To be added after deployment.

## Known Gaps

- Upload execution is out of scope.
- Validation execution is out of scope.
- Candidate creation is out of scope.
- Candidate promotion is out of scope.
- Active access updates are out of scope.
- Module runtime behavior changes are out of scope.
