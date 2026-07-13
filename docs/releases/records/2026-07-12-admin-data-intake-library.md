# 2026-07-12-admin-data-intake-library — Admin Data Intake Library and Template Catalog

## Release ID

`2026-07-12-admin-data-intake-library`

## Status

`candidate`

## Plain-English Summary

Admin now includes a read-only Data Intake Library. It shows the tenant input
templates, setup guides, required fields, expected owners, validation rules,
mapping targets, module impact, and readiness impact that operators need before
uploading files or creating candidate data.

The experience is workflow-led, not chat-agent-led: choose the setup path,
download the appropriate template pack later, populate evidence, validate and
map, create an inactive candidate preview, then promote only with proof.

## Layer Impact

- Control plane: Adds a new Admin left-rail view for Data Intake Library and
  Template Catalog.
- Data plane: Read-only. No uploads, candidate versions, active access pointers,
  tenant facts, or module runtime paths are changed.
- Governance: Keeps uploaded evidence, template contract, candidate state,
  active state, and module-readiness state separate.

## Client Applicability

- All clients: Yes, shared Admin setup experience.
- Specific clients: None.
- Internal only: Admin/setup operators.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/data-intake-library.ts`
- `src/lib/admin/__tests__/data-intake-library.test.ts`
- `src/components/admin/AdminSetupExperience.tsx`
- `src/components/admin/__tests__/AdminSetupExperience.test.tsx`
- `reports/admin-data-intake-library/latest/admin-data-intake-library.json`
- `reports/admin-data-intake-library/latest/admin-data-intake-library-summary.md`
- `scripts/audit/admin-data-control-center.mjs`
- `docs/releases/records/2026-07-12-admin-data-intake-library.md`

## QA / Validation

- `npx jest src/lib/admin/__tests__/data-intake-library.test.ts src/components/admin/__tests__/AdminSetupExperience.test.tsx --runInBand` — Pass
- `npm run audit:admin-data-control-center` — Pass
- `npm run audit:enterprise-naming` — Pass
- `npm run audit:architecture-rules` — Pass
- `npm run release:check` — Pass
- `npx tsc --noEmit --pretty false` — Pass
- `git diff --check` — Pass

## Rollout Plan

Merge to `main`, then deploy through the approved ACA main deploy workflow. After
deploy, verify the signed-in Admin page shows the Data Intake Library tab and
that the page remains read-only.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deploy.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible
  production proof.

## Rollback Plan

Revert the PR. Since this release is read-only, rollback is code-only and does
not require data cleanup.

## Audit Evidence

- Admin data-control-center audit checks for the Data Intake Library strings,
  workflow language, catalog count, proof artifacts, and read-only guardrails.
- Focused catalog and Admin component tests prove the catalog renders and that
  placeholder download/upload actions are disabled.
- Proof artifacts are under `reports/admin-data-intake-library/latest/`.

## Known Gaps

- No full Admin redesign.
- No Add Data redesign.
- No upload flow.
- No tenant packet dry-run.
- No candidate preview creation.
- No candidate promotion.
- No production tenant writes.
- No Active Tenant Access Layer update.
- No module runtime behavior change.
