# 2026-09-08-source360-staged-impact-load — Source 360 Staged Impact Load

## Release ID

`2026-09-08-source360-staged-impact-load`

## Status

`candidate`

## Plain-English Summary

`Source 360` now opens the executive contract-book view from the lighter portfolio payload, then hydrates the heavier evidence and action layer after the page is visible. This improves perceived load behavior while keeping the same governed payload and claim boundaries.

## Layer Impact

Release lane: `global-control-lane`

Layer 4/product surface only. No tenant data, schema, adapters, canonical objects, read models, assistant grounding, or data-build jobs are changed.

## Client Applicability

- All clients: Yes, for Source 360 workspace routes.
- Specific clients: No.
- Internal only: No.
- Public/demo only: No.
- Feature flag: Not applicable.

## Changes Included

- `src/app/(maestro)/source/workspace/WorkspaceClientLoader.tsx`
- `src/app/(maestro)/source/workspace/SourceWorkspaceLoadingShell.tsx`
- `src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts`

## QA / Validation

- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/page-tenant-routing.test.ts' --runInBand` passed.
- `npx jest --runTestsByPath 'src/app/(maestro)/source/preview/workspace/__tests__/WorkspaceClient.ecl-browser.test.tsx' --runInBand` passed.

## Rollout Plan

Merge through PR, then let the repo-owned Azure Container Apps main deploy workflow build and deploy the updated web image.

## Deployment Authority

- Repo-owned deploy workflow: Required after merge.
- Shared runtime mutators: None outside the repo-owned deploy workflow.
- Approved image digest: To be produced by the repo-owned deploy workflow.
- ACA runtime invariant: Required after deploy before claiming live.
- Worker image invariant: Not applicable.
- Feature/env flag update path: Not applicable.
- Live signed-in proof required: Yes, for `/source/workspace` initial paint and evidence-depth hydration.

## Rollback Plan

Rollback the web runtime to the prior ACA image digest if the workspace fails to hydrate the full evidence/action layer or the opening Source 360 view loses expected data.

## Audit Evidence

- PR URL and CI checks.
- Focused route and workspace tests.
- Post-deploy ACA runtime invariant.
- Signed-in `Source 360` timing proof showing initial portfolio paint before full impact hydration.

## Known Gaps

Signed-in product proof still requires a browser session for the intended tenant.
