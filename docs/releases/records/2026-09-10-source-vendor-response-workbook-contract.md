# 2026-09-10-source-vendor-response-workbook-contract — Complete Vendor Response Workbook

## Release ID

`2026-09-10-source-vendor-response-workbook-contract`

## Status

`candidate`

## Plain-English Summary

Source vendor-response exports now produce one governed workbook that separates compliance,
solution, pricing, staffing, service levels, automation commitments, assumptions, transition,
commercial exceptions, evidence, format rules, and supplier certification. The added controls
make material claims measurable and commercially reviewable instead of leaving evaluators to
interpret unstructured narrative.

## Layer Impact

- Release lane: `global-control-lane`.
- Layer 4 — Products: expands the Source response-workbook XLSX renderer and its validation
  contract. Layers 1 through 3 and their governed records are unchanged.

## Client Applicability

- All clients: Yes, for future Source response-workbook renders.
- Specific clients: None.
- Internal only: No.
- Public/demo only: No.
- Feature flag: None.

## Changes Included

- Expanded the response workbook from the prior checklist shape to sixteen purpose-specific
  sheets.
- Added controlled fields for comparable pricing, resource location and capacity, SLA remedies,
  automation baselines and outcomes, transition acceptance, commercial exceptions, evidence
  pointers, and authorized submission certification.
- Added locked buyer identifiers, editable supplier-response cells, list validation, filters,
  frozen headers, and a consistent one-page-wide print contract.
- Added focused workbook structure, control, and print-layout tests.

## QA / Validation

- `npx jest src/lib/source/exports/__tests__/response-checklist.test.ts src/lib/source/exports/__tests__/dispatch.test.ts src/lib/source/exports/__tests__/structured-docx.test.ts src/lib/source/exports/__tests__/structured-format-parity.test.ts --runInBand` — passed, 69 tests.
- `npx eslint src/lib/source/exports/renderers/response-checklist.ts src/lib/source/exports/__tests__/response-checklist.test.ts` — passed.
- `NODE_OPTIONS='--max-old-space-size=8192' npx tsc --noEmit` — passed.
- Generated an XLSX proof, rendered all sixteen sheets to PDF, and visually reviewed the resulting
  sixteen-page contact sheet for clipping and print fit.

## Rollout Plan

Merge through a protected pull request. The repo-owned ACA main deploy workflow builds and deploys
the exact merged SHA. After deployment, render a response workbook from a signed-in Source event
and verify the required tabs and controls in the downloaded file.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`.
- Shared runtime mutators: Repo-owned workflow only.
- Approved image digest: Recorded by the deploy workflow for the merged SHA.
- ACA runtime invariant: Template image and 100% traffic revision must match the approved digest.
- Worker image invariant: No worker runtime changes.
- Feature/env flag update path: None.
- Live signed-in proof required: Yes, Source workbook render and file inspection.

## Rollback Plan

Revert the release pull request and redeploy the resulting main SHA through the repo-owned ACA
workflow. No schema, migration, canonical-data, or tenant-data rollback is required.

## Audit Evidence

- Pull request and merge SHA.
- ACA main deploy workflow run and runtime-invariant output.
- Focused test, lint, TypeScript, release-check, XLSX render, and signed-in download evidence.

## Known Gaps

Existing accepted client-final files are immutable lifecycle records and are not rewritten by this
renderer change. They require an explicit reviewed replacement when a current event must adopt the
expanded workbook contract.
