# 2026-08-14-source-responses-layout-harness — Source Responses Layout Harness

## Release ID

`2026-08-14-source-responses-layout-harness`

## Status

`candidate`

## Plain-English Summary

The Source Responses screen now has a repeatable layout check for the vendor
response completeness matrix. The check confirms that the matrix gets the full
stage width, that the Q&A log stays below it, and that narrow viewports use
contained table scrolling instead of pushing the whole page sideways. This
release also fixes one proven overflow issue in the Responses package cockpit.

## Layer Impact

Layer 4 product presentation only. No tenant data, workflow persistence, parser
behavior, canonical model, schema, or data-plane write path changed.

## Client Applicability

- All clients: all Source users who view the Responses stage receive the layout
  containment fix after deployment.
- Specific clients: none.
- Internal only: the new QA harness command is internal engineering tooling.
- Public/demo only: none.
- Feature flag: none.

## Changes Included

- `scripts/qa/source-responses-layout-harness.ts`
- `package.json` command: `qa:source-responses-layout`
- `src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx`
- `docs/codex-handoff/SOURCE_LAYOUT_CROSS_SURFACE_SWEEP_2026-08-14.md`
- `reports/source-layout/responses-matrix/summary.md`
- `reports/source-layout/responses-matrix/summary.json`

## QA / Validation

- `NODE_PATH=/Users/anand/Projects/nexus/node_modules npm run qa:source-responses-layout`
  - Passed at `1440`, `1292`, `1100`, `900`, and `768`.
  - Verified Q&A remains below the completeness matrix.
  - Verified no page-level horizontal overflow.
  - Verified intentional table overflow stays contained in scrollports.
- `/Users/anand/Projects/nexus/node_modules/.bin/jest src/__tests__/integration/source/source-event-canvas-render.test.tsx --runInBand -t 'renders the Responses stage'`
  - Passed.
- `/Users/anand/Projects/nexus/node_modules/.bin/jest src/__tests__/integration/source/source-event-canvas-render.test.tsx src/components/source/canvas/responses/__tests__/VendorResponsePackageCockpit.test.tsx --runInBand -t 'Responses stage|Vendor response package cockpit'`
  - Passed the package cockpit test; the broad file's unrelated tests were
    filtered out.
- `/Users/anand/Projects/nexus/node_modules/.bin/eslint scripts/qa/source-responses-layout-harness.ts src/components/source/canvas/responses/VendorResponsePackageCockpit.tsx`
  - Passed.

## Rollout Plan

Merge through PR to `main`, then deploy through the repo-owned Azure Container
Apps main deploy workflow.

## Deployment Authority

- Repo-owned deploy workflow: `.github/workflows/aca-main-deploy.yml`
- Shared runtime mutators: none in this branch.
- Approved image digest: assigned by the main deploy workflow after merge.
- ACA runtime invariant: required after deployment before claiming live.
- Worker image invariant: no worker change expected.
- Feature/env flag update path: none.
- Live signed-in proof required: yes, Source Responses stage route after deploy.

## Rollback Plan

Revert this release commit. The rollback restores the prior package cockpit
layout and removes the new harness command. No schema or data rollback is
required.

## Audit Evidence

- Harness summary: `reports/source-layout/responses-matrix/summary.md`
- Harness JSON: `reports/source-layout/responses-matrix/summary.json`
- Cross-surface sweep: `docs/codex-handoff/SOURCE_LAYOUT_CROSS_SURFACE_SWEEP_2026-08-14.md`
- PR URL: to be added after PR creation.
- ACA deploy run: to be added after merge and deploy.

## Known Gaps

- The harness covers the Source Responses composition with deterministic
  fixtures. Additional fixture variants for sparse, many-vendor,
  long-vendor-name, and parser-rich states are logged as follow-up backlog.
- Cross-surface Home, Tower, Moves, Source preview, and Intelligence candidates
  are logged but not broadly changed in this slice.
