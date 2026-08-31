# 2026-08-31-source-workspace-credit-evidence-precedence — Source Workspace Credit Evidence Precedence

## Release ID

`2026-08-31-source-workspace-credit-evidence-precedence`

## Status

`candidate`

## Plain-English Summary

The Source workspace recoverable-credit lane now prefers the deterministic impact
coverage slice when it is loaded. The older performance-credit snapshot remains a
fallback only when the deterministic impact slice has no credit value. This keeps the
executive view from promoting a larger legacy rollup over the amount that can be traced
through the current Source impact read models.

The follow-up correction also scopes the recoverable-credit headline to the active
contract-depth load run when one is declared. That prevents older coverage rows from
being combined into a single current-package claim.

When the active load run is not exposed by the workspace diagnostics, the credit
headline is now limited to coverage rows tied to explicit credit/recovery action
candidates before falling back to broader historical performance-credit coverage.
Historical rows with generic opportunity counts are not blended into the current
credit headline unless the action queue itself identifies that contract as a
credit/recovery candidate.

This correction also covers workspaces whose diagnostic load-run identifier points
at a broad projection rather than the current impact package. In that case the
workspace selects the richest evidence-backed credit slice by loaded page text,
change orders, action rows, scope, spend, and performance coverage before it
falls back to older snapshot rows. Recoverable-credit type-mix rollups use the
same selected credit slice so charts, tables, and headlines tell one consistent
story.

The second follow-up correction makes the action-type mix use that same selected
credit coverage for recoverable leakage. That keeps the type-mix chart/table,
credit headline, and evidence-basis panel from presenting different recoverable
amounts. Credit-specific display also preserves one decimal in the thousands
band so the deterministic amount remains legible instead of being rounded into
a coarser executive shorthand.

The third follow-up adds visual coverage to vendor evidence-depth and archetype
subtabs using the same governed row builders that feed their tables. This closes
the remaining page-composition gap where several executive views were accurate
but table-only, even though the Source workspace design contract expects visual
summaries above drill-down detail.

The fourth follow-up removes the default serving-surface diagnostics panel from
the executive workspace shell. Operator diagnostics remain available through
their owned routes and tests, while the client-facing Source workspace keeps the
focus on claims, charts, evidence posture, and graph navigation.

The fifth follow-up makes the Vendor Evidence depth subtab rank against the
full vendor portfolio instead of only the top concentration vendors. Evidence-rich
lower-spend relationships now render in the chart and drill-down table when
their loaded rows support the claim.

The sixth follow-up makes the Evidence depth chart and table use the same
grouped-vendor coverage lookup as the ranking logic. Supplier rollups can carry
multiple physical vendor references; the executive tab now totals coverage
across those references instead of showing `Not established` for a relationship
whose underlying contracts have loaded depth rows.

## Layer Impact

- Lane: `global-control-lane`.
- Layer 4 PRODUCTS: updates Source workspace presentation logic and evidence-basis text.
  No schema, loader, adapter, or canonical model change is included.

## Client Applicability

- All clients: yes, for Source workspace tenants with contract-depth impact coverage.
- Specific clients: none named in this public release record.
- Internal only: no.
- Public/demo only: no.
- Feature flag: none.

## Changes Included

- `src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx`
- `src/app/(maestro)/source/preview/workspace/WorkspaceClient.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts`

## QA / Validation

- `npx eslint 'src/app/(maestro)/source/preview/workspace/WorkspaceExecutiveShell.tsx' 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts'`
  passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceExecutiveShell.performance.test.ts' --runInBand`
  passed, including active-load-run credit precedence and no-active-run historical
  credit isolation when older rows also carry opportunity counts.
- Added a regression for broad-projection diagnostics with a richer deterministic
  impact package. It verifies the recoverable-credit headline and action-type
  mix both stay scoped to the selected impact package instead of blending older
  recoverable rows.
- Added a regression for the case where a loaded credit row has evidence coverage
  but no matching credit action-card text. The action-type mix still reflects the
  selected credit coverage amount and count.
- Added regressions for vendor evidence-depth and archetype rollups so the
  charted views stay tied to the same rows as the drill-down tables.
- Re-ran the workspace browser-surface test that asserts internal diagnostics
  labels are not rendered in the default executive workspace.
- Added a browser-surface regression where high-spend vendors have no loaded
  depth while a lower-spend vendor has spend, performance, opportunity, and
  credit rows. The Evidence depth subtab must render the lower-spend vendor
  chart and table row instead of using the concentration slice.
- Strengthened the Evidence depth regression so the displayed supplier row can
  use a grouped rollup reference while the underlying evidence rows retain their
  physical vendor reference. The chart and table must still render the loaded
  depth.

## Rollout Plan

Merge through a protected PR to `main`. The repo-owned Azure Container Apps main deploy
workflow builds and deploys the resulting web image.

## Deployment Authority

- Repo-owned deploy workflow: required.
- Shared runtime mutators: none in this PR.
- Approved image digest: produced by the repo-owned deploy workflow after merge.
- ACA runtime invariant: verify after deploy before claiming live status.
- Worker image invariant: not affected.
- Feature/env flag update path: not affected.
- Live signed-in proof required: yes, Source workspace Optimize/Evidence proof after deploy.

## Rollback Plan

Revert the PR and redeploy through the repo-owned Azure Container Apps main deploy
workflow. No data rollback is required because this is presentation logic only.

## Audit Evidence

- PR URL: https://github.com/abarva-platform/abarva/pull/7211
- Follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7213
- Second follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7214
- Third follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7215
- Fourth follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7217
- Fifth follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7218
- Sixth follow-up PR URL: https://github.com/abarva-platform/abarva/pull/7220
- ACA deploy run: pending.
- Signed-in Source workspace proof: pending.

## Known Gaps

Live signed-in proof and aVa grounding checks remain required after deployment.
