# 2026-07-12-admin-tenant-packet-artifacts — Admin Tenant Packet Builder and Template Artifacts

## Release ID

`2026-07-12-admin-tenant-packet-artifacts`

## Status

`candidate`

## Plain-English Summary

Admin now lets an operator or client see and download the actual tenant-packet artifacts before any upload workflow exists. The Data Intake Library remains workflow-led: choose templates, inspect the fields and rules, open the relevant setup guide, download a template or field dictionary, or download the full Tenant Packet.

This is still read-only. It does not upload files, parse files, validate data, create candidates, promote data, or change what Home, Intelligence, Moves, Source, or Tower consume at runtime.

## Layer Impact

- Control plane: Extends the Admin Data Intake Library with a Tenant Packet Builder, selected-template planning, template detail, field dictionary view, guide detail, and artifact download links.
- Admin API: Adds read-only generated artifact routes for template CSV, field dictionary CSV, guide Markdown, and full Tenant Packet ZIP.
- Data plane: No production tenant data writes, no candidate data version creation, no promotion, and no Active Tenant Access Layer update.
- Module runtime: No Home, Intelligence, Moves, Source, or Tower runtime behavior changes.
- Governance: Preserves the truth split between template contract, uploaded evidence, candidate preview, active truth, and module readiness.

## Client Applicability

- All clients: Yes, shared Admin setup experience.
- Specific clients: None.
- Internal only: Admin/setup operators and controlled client setup users.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- `src/lib/admin/data-intake-library.ts`
- `src/lib/admin/__tests__/data-intake-library.test.ts`
- `src/app/api/admin/data-intake/templates/[templateId]/download/route.ts`
- `src/app/api/admin/data-intake/templates/[templateId]/field-dictionary/route.ts`
- `src/app/api/admin/data-intake/guides/[guideId]/route.ts`
- `src/app/api/admin/data-intake/tenant-packet/route.ts`
- `src/app/api/admin/data-intake/__tests__/artifacts.test.ts`
- `src/components/admin/AdminSetupExperience.tsx`
- `src/components/admin/__tests__/AdminSetupExperience.test.tsx`
- `scripts/audit/admin-data-control-center.mjs`
- `reports/admin-tenant-packet-artifacts/latest/admin-tenant-packet-artifacts.json`
- `reports/admin-tenant-packet-artifacts/latest/admin-tenant-packet-artifacts-summary.md`
- `docs/releases/records/2026-07-12-admin-tenant-packet-artifacts.md`

## QA / Validation

- `npx jest src/lib/admin/__tests__/data-intake-library.test.ts src/app/api/admin/data-intake/__tests__/artifacts.test.ts src/components/admin/__tests__/AdminSetupExperience.test.tsx --runInBand` — Pass
- `npm run audit:admin-data-control-center` — Pass
- `npm run audit:enterprise-naming` — Pass
- `npm run audit:architecture-rules` — Pass
- `npx eslint src/lib/admin/data-intake-library.ts src/lib/admin/__tests__/data-intake-library.test.ts src/app/api/admin/data-intake src/components/admin/AdminSetupExperience.tsx src/components/admin/__tests__/AdminSetupExperience.test.tsx scripts/audit/admin-data-control-center.mjs` — Pass
- `npm run release:check` — Pass
- `NODE_OPTIONS=--max-old-space-size=8192 npx tsc --noEmit --pretty false` — Pass
- `git diff --check` — Pass
- Signed-in browser proof — Not run yet.

## Rollout Plan

Open a PR from the Admin PR4 branch to `main`. After merge, deploy through the approved ACA main deploy workflow. After deploy, verify the active revision, digest, 100% traffic, health, and signed-in Admin visibility for the Data Intake Library artifact actions.

## Deployment Authority

- Repo-owned deploy workflow: Required for ACA production/lab deploy.
- Shared runtime mutators: None in this PR.
- Approved image digest: Not applicable until deploy.
- ACA runtime invariant: Required after deploy.
- Worker image invariant: Not applicable unless the main deploy workflow updates workers as part of standard release.
- Feature/env flag update path: None.
- Live signed-in proof required: Required before claiming browser-visible production proof.

## Rollback Plan

Revert this PR. Since this release is read-only and does not write tenant data or change active access, rollback removes only the Admin artifact UI/API additions.

## Audit Evidence

- Admin data-control-center audit checks the generated packet, template, dictionary, guide routes, and read-only guardrails.
- Focused tests prove template CSV, field dictionary CSV, guide Markdown, Tenant Packet ZIP, and Admin UI rendering.
- Proof artifacts are under `reports/admin-tenant-packet-artifacts/latest/`.

## Known Gaps

- No upload.
- No dry-run validation.
- No parsing execution.
- No candidate creation.
- No candidate promotion.
- No production tenant writes.
- No Active Tenant Access Layer update.
- No module runtime consumption changes.
